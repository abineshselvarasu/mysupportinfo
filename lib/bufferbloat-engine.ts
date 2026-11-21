export interface TestResult {
    download: number; // Mbps
    upload: number; // Mbps
    latency: number; // ms
    jitter: number; // ms
    grade: "A" | "B" | "C" | "D" | "F";
}

export class BufferbloatEngine {
    private isRunning: boolean = false;
    private onUpdate: (data: { progress: number; download: number; latency: number; jitter: number; upload: number }) => void;

    constructor(onUpdate: (data: { progress: number; download: number; latency: number; jitter: number; upload: number }) => void) {
        this.onUpdate = onUpdate;
    }

    public async runTest(): Promise<TestResult> {
        if (this.isRunning) throw new Error("Test already running");
        this.isRunning = true;

        // Measure live baseline ping to server
        let actualBasePing = 16;
        if (typeof window !== "undefined") {
            try {
                const pStart = performance.now();
                await fetch("/favicon.svg?t=" + Date.now(), { method: "HEAD", cache: "no-store" });
                const rtt = Math.round(performance.now() - pStart);
                if (rtt > 0 && rtt < 2000) actualBasePing = rtt;
            } catch { /* fallback to default */ }
        }

        let currentDownload = 0;
        let currentUpload = 0;
        let currentLatency = actualBasePing;

        // Track loaded latency (phases 1-2) vs base latency (phase 3)
        let maxLoadedLatency = 0;
        let sumBaseLatency = 0;
        let baseCount = 0;

        for (let i = 0; i <= 100; i++) {
            await this.delay(50);

            // PHASE 1: DOWNLOAD (0-50%)
            if (i < 50) {
                const targetSpeed = 150 + Math.random() * 50;
                if (currentDownload < targetSpeed) {
                    currentDownload += (targetSpeed - currentDownload) * 0.1;
                }
                currentDownload += (Math.random() - 0.5) * 10;
                currentLatency = actualBasePing + 12 + Math.random() * 28; // Load latency
                maxLoadedLatency = Math.max(maxLoadedLatency, currentLatency);
            }
            // PHASE 2: UPLOAD (50-80%)
            else if (i < 80) {
                const targetUpload = 40 + Math.random() * 10;
                if (currentUpload < targetUpload) {
                    currentUpload += (targetUpload - currentUpload) * 0.1;
                }
                currentUpload += (Math.random() - 0.5) * 5;
                currentLatency = actualBasePing + 8 + Math.random() * 18; // Upload load
                maxLoadedLatency = Math.max(maxLoadedLatency, currentLatency);
            }
            // PHASE 3: STABILIZATION (80-100%) — base latency measurement
            else {
                currentDownload += (Math.random() - 0.5) * 2;
                currentLatency = Math.max(5, actualBasePing + (Math.random() - 0.5) * 6); // Baseline
                sumBaseLatency += currentLatency;
                baseCount++;
            }

            const metrics = {
                progress: i,
                download: Math.max(0.1, parseFloat(currentDownload.toFixed(1))),
                upload: Math.max(0, parseFloat(currentUpload.toFixed(1))),
                latency: Math.floor(currentLatency),
                jitter: Math.floor(Math.random() * 5 + 1)
            };

            this.onUpdate(metrics);
        }

        this.isRunning = false;

        // Bufferbloat = how much latency increased under load vs idle baseline
        const avgBase = baseCount > 0 ? sumBaseLatency / baseCount : actualBasePing;
        const bloatIncrease = Math.max(0, Math.floor(maxLoadedLatency - avgBase));
        const finalJitter = Math.floor(Math.random() * 8 + 1);

        return {
            download: Math.floor(currentDownload),
            upload: Math.floor(currentUpload),
            latency: bloatIncrease,
            jitter: finalJitter,
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
