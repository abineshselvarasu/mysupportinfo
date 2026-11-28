export interface TestResult {
    download: number; // Mbps
    upload: number; // Mbps
    latency: number; // ms delta (bloat spike)
    jitter: number; // ms
    grade: "A" | "B" | "C" | "D" | "F";
}

export interface EngineSample {
    progress: number;
    download: number;
    latency: number;
    jitter: number;
    upload: number;
}

const DOWNLOAD_CHUNK_BYTES = 1572864; // 1.5 MB per stream request
const UPLOAD_PAYLOAD_BYTES = 393216; // 384 KB per POST chunk (safe under serverless limits)
const DOWNLOAD_MS = 2800;
const UPLOAD_MS = 2200;
const IDLE_MS = 1200;

function buildUploadPayload(): Uint8Array {
    const buf = new Uint8Array(UPLOAD_PAYLOAD_BYTES);
    let seed = 0x9e3779b9;
    for (let i = 0; i < buf.length; i++) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        buf[i] = (seed >>> 16) & 0xff;
    }
    return buf;
}

function median(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
    return sorted[idx];
}

export class BufferbloatEngine {
    private isRunning = false;
    private abortCtrl: AbortController | null = null;
    private onUpdate: (data: EngineSample) => void;

    constructor(onUpdate: (data: EngineSample) => void) {
        this.onUpdate = onUpdate;
    }

    public abort(): void {
        this.abortCtrl?.abort();
        this.isRunning = false;
    }

    private async measureRtt(signal: AbortSignal): Promise<number | null> {
        const start = performance.now();
        try {
            const res = await fetch(`/api/speedtest?mode=ping&t=${start.toFixed(2)}`, {
                method: "GET",
                cache: "no-store",
                signal,
            });
            if (!res.ok) return null;
            await res.text();
            const rtt = performance.now() - start;
            return Number.isFinite(rtt) && rtt > 0 ? Math.max(1, Math.round(rtt)) : 1;
        } catch {
            return null;
        }
    }

    public async runTest(): Promise<TestResult> {
        if (this.isRunning) throw new Error("Test already running");
        this.isRunning = true;
        this.abortCtrl = new AbortController();
        const masterSignal = this.abortCtrl.signal;

        const allJitters: number[] = [];
        const loadedRtts: number[] = [];
        const idleRtts: number[] = [];

        let lastRtt: number | null = null;
        const recordJitter = (rtt: number): number => {
            const diff = lastRtt !== null ? Math.max(0, Math.round(Math.abs(rtt - lastRtt))) : 1;
            lastRtt = rtt;
            allJitters.push(diff);
            return diff;
        };

        // 0. Measure unloaded baseline ping (5 samples after 1 warm-up)
        for (let i = 0; i < 6; i++) {
            const rtt = await this.measureRtt(masterSignal);
            if (rtt !== null && i > 0) {
                idleRtts.push(rtt);
                recordJitter(rtt);
            }
        }
        const initialBaseline = idleRtts.length > 0 ? Math.round(median(idleRtts)) : 15;
        let currentLatency = initialBaseline;
        let currentJitter = 1;
        let latestDownloadMbps = 0;
        let latestUploadMbps = 0;

        const emit = (progress: number) => {
            this.onUpdate({
                progress: Math.min(100, Math.max(0, Math.round(progress))),
                download: Math.max(0, Number(latestDownloadMbps.toFixed(1))),
                upload: Math.max(0, Number(latestUploadMbps.toFixed(1))),
                latency: Math.max(1, Math.round(currentLatency)),
                jitter: Math.max(0, Math.round(currentJitter)),
            });
        };

        emit(0);

        // 1. PHASE 1: DOWNLOAD LOAD (0 -> 50%)
        const dlCtrl = new AbortController();
        const dlBytesCounter = { total: 0, recent: 0 };
        const dlWorker = async (workerId: number) => {
            let seq = 0;
            while (!dlCtrl.signal.aborted && !masterSignal.aborted) {
                try {
                    const res = await fetch(
                        `/api/speedtest?mode=down&size=${DOWNLOAD_CHUNK_BYTES}&w=${workerId}&s=${seq++}`,
                        { cache: "no-store", signal: dlCtrl.signal }
                    );
                    const reader = res.body?.getReader();
                    if (!reader) break;
                    while (!dlCtrl.signal.aborted) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        const bytes = value?.byteLength ?? 0;
                        dlBytesCounter.total += bytes;
                        dlBytesCounter.recent += bytes;
                    }
                } catch {
                    if (dlCtrl.signal.aborted) break;
                    await this.delay(40);
                }
            }
        };

        const dlWorkers = [dlWorker(0), dlWorker(1), dlWorker(2)];
        const dlStart = performance.now();
        let lastTick = dlStart;
        const dlSamplesMbps: number[] = [];

        while (!masterSignal.aborted) {
            await this.delay(110);
            const now = performance.now();
            const elapsed = now - dlStart;
            const winSec = Math.max(0.05, (now - lastTick) / 1000);
            const windowMbps = (dlBytesCounter.recent * 8) / (winSec * 1_000_000);
            dlBytesCounter.recent = 0;
            lastTick = now;

            if (windowMbps > 0) {
                latestDownloadMbps = latestDownloadMbps > 0 ? latestDownloadMbps * 0.4 + windowMbps * 0.6 : windowMbps;
                dlSamplesMbps.push(latestDownloadMbps);
            }

            const probe = await this.measureRtt(dlCtrl.signal);
            if (probe !== null) {
                currentLatency = probe;
                currentJitter = recordJitter(probe);
                loadedRtts.push(probe);
            }

            const pct = Math.min(49, (elapsed / DOWNLOAD_MS) * 50);
            emit(pct);
            if (elapsed >= DOWNLOAD_MS) break;
        }
        dlCtrl.abort();
        await Promise.allSettled(dlWorkers);

        const dlElapsedSec = Math.max(0.2, (performance.now() - dlStart) / 1000);
        const avgDownloadMbps =
            dlBytesCounter.total > 0
                ? (dlBytesCounter.total * 8) / (dlElapsedSec * 1_000_000)
                : dlSamplesMbps.length > 0
                ? median(dlSamplesMbps)
                : latestDownloadMbps;
        latestDownloadMbps = Number(avgDownloadMbps.toFixed(1));
        emit(50);

        // 2. PHASE 2: UPLOAD LOAD (50 -> 80%)
        const ulCtrl = new AbortController();
        const ulPayload = buildUploadPayload();
        const ulBytesCounter = { total: 0, recent: 0 };

        const ulWorker = async (workerId: number) => {
            let seq = 0;
            while (!ulCtrl.signal.aborted && !masterSignal.aborted) {
                try {
                    const res = await fetch(`/api/speedtest?mode=up&w=${workerId}&s=${seq++}`, {
                        method: "POST",
                        body: ulPayload as unknown as BodyInit,
                        cache: "no-store",
                        signal: ulCtrl.signal,
                    });
                    if (res.ok) {
                        ulBytesCounter.total += ulPayload.byteLength;
                        ulBytesCounter.recent += ulPayload.byteLength;
                    }
                } catch {
                    if (ulCtrl.signal.aborted) break;
                    await this.delay(40);
                }
            }
        };

        const ulWorkers = [ulWorker(0), ulWorker(1)];
        const ulStart = performance.now();
        lastTick = ulStart;
        const ulSamplesMbps: number[] = [];

        while (!masterSignal.aborted) {
            await this.delay(110);
            const now = performance.now();
            const elapsed = now - ulStart;
            const winSec = Math.max(0.05, (now - lastTick) / 1000);
            const windowMbps = (ulBytesCounter.recent * 8) / (winSec * 1_000_000);
            ulBytesCounter.recent = 0;
            lastTick = now;

            if (windowMbps > 0) {
                latestUploadMbps = latestUploadMbps > 0 ? latestUploadMbps * 0.4 + windowMbps * 0.6 : windowMbps;
                ulSamplesMbps.push(latestUploadMbps);
            }

            const probe = await this.measureRtt(ulCtrl.signal);
            if (probe !== null) {
                currentLatency = probe;
                currentJitter = recordJitter(probe);
                loadedRtts.push(probe);
            }

            const pct = 50 + Math.min(29, (elapsed / UPLOAD_MS) * 30);
            emit(pct);
            if (elapsed >= UPLOAD_MS) break;
        }
        ulCtrl.abort();
        await Promise.allSettled(ulWorkers);

        const ulElapsedSec = Math.max(0.2, (performance.now() - ulStart) / 1000);
        const avgUploadMbps =
            ulBytesCounter.total > 0
                ? (ulBytesCounter.total * 8) / (ulElapsedSec * 1_000_000)
                : ulSamplesMbps.length > 0
                ? median(ulSamplesMbps)
                : latestUploadMbps;
        latestUploadMbps = Number(avgUploadMbps.toFixed(1));
        emit(80);

        // 3. PHASE 3: IDLE STABILIZATION (80 -> 100%)
        const postIdleRtts: number[] = [];
        const idleStart = performance.now();
        while (!masterSignal.aborted) {
            await this.delay(130);
            const probe = await this.measureRtt(masterSignal);
            if (probe !== null) {
                currentLatency = probe;
                currentJitter = recordJitter(probe);
                postIdleRtts.push(probe);
            }
            const elapsed = performance.now() - idleStart;
            const pct = 80 + Math.min(19, (elapsed / IDLE_MS) * 20);
            emit(pct);
            if (elapsed >= IDLE_MS) break;
        }

        emit(100);
        this.isRunning = false;

        const basePool = postIdleRtts.length > 0 ? postIdleRtts : idleRtts;
        const avgBase = basePool.length > 0 ? median(basePool) : initialBaseline;
        // Use 90th percentile of loaded probes so a single transient OS tick doesn't skew grade
        const loadedRef = loadedRtts.length > 0 ? percentile(loadedRtts, 90) : avgBase;
        const bloatIncrease = Math.max(0, Math.round(loadedRef - avgBase));
        const avgJitter =
            allJitters.length > 0
                ? Math.max(1, Math.round(allJitters.reduce((a, b) => a + b, 0) / allJitters.length))
                : 1;

        return {
            download: Math.round(latestDownloadMbps),
            upload: Math.round(latestUploadMbps),
            latency: bloatIncrease,
            jitter: avgJitter,
            grade: this.calculateGrade(bloatIncrease),
        };
    }

    private delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private calculateGrade(bloatIncrease: number): TestResult["grade"] {
        if (bloatIncrease <= 5) return "A";
        if (bloatIncrease <= 30) return "B";
        if (bloatIncrease <= 60) return "C";
        if (bloatIncrease <= 100) return "D";
        return "F";
    }
}
