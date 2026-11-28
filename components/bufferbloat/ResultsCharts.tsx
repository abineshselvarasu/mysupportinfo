"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Download, Upload, Activity, Waves } from "lucide-react";
import type { TestResult } from "@/lib/bufferbloat-engine";

export interface RunMetrics {
    progress: number;
    download: number;
    latency: number;
    jitter: number;
    upload: number;
}

interface ResultsChartsProps {
    data: RunMetrics[];
    result?: TestResult | null;
}

interface ChartPoint {
    x: number;
    y: number;
}

const PAD = { top: 26, right: 16, bottom: 28, left: 44 };

function getNiceCeiling(rawMax: number, minCeiling = 20): { ceiling: number; ticks: number[] } {
    const target = Math.max(rawMax * 1.12, minCeiling);
    const rawStep = target / 4;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const normalized = rawStep / magnitude;
    const niceSteps = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
    const niceNormalized = niceSteps.find((s) => normalized <= s) ?? 10;

    const step = niceNormalized * magnitude;
    const ceiling = step * 4;
    return {
        ceiling,
        ticks: [0, step, step * 2, step * 3, ceiling],
    };
}

/**
 * Monotone cubic interpolation (Fritsch-Carlson) so telemetry curves flow smoothly
 * without overshooting peak or baseline coordinates.
 */
function buildSmoothPath(points: ChartPoint[], yMin: number, yMax: number): string {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
    if (points.length === 2) {
        return `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)},${points[1].y.toFixed(1)}`;
    }

    const n = points.length;
    const dx: number[] = [];
    const dy: number[] = [];
    const m: number[] = new Array(n).fill(0);

    for (let i = 0; i < n - 1; i++) {
        const dxi = Math.max(points[i + 1].x - points[i].x, 0.001);
        dx.push(dxi);
        dy.push((points[i + 1].y - points[i].y) / dxi);
    }

    m[0] = dy[0];
    m[n - 1] = dy[n - 2];
    for (let i = 1; i < n - 1; i++) {
        if (dy[i - 1] * dy[i] <= 0) {
            m[i] = 0;
        } else {
            m[i] = (dy[i - 1] + dy[i]) / 2;
        }
    }

    for (let i = 0; i < n - 1; i++) {
        if (dy[i] === 0) {
            m[i] = 0;
            m[i + 1] = 0;
        } else {
            const a = m[i] / dy[i];
            const b = m[i + 1] / dy[i];
            const hypot = Math.hypot(a, b);
            if (hypot > 3) {
                const t = 3 / hypot;
                m[i] = t * a * dy[i];
                m[i + 1] = t * b * dy[i];
            }
        }
    }

    const clampY = (y: number) => Math.max(yMin, Math.min(yMax, y));
    let d = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
    for (let i = 0; i < n - 1; i++) {
        const seg = dx[i] / 3;
        const cp1x = points[i].x + seg;
        const cp1y = clampY(points[i].y + m[i] * seg);
        const cp2x = points[i + 1].x - seg;
        const cp2y = clampY(points[i + 1].y - m[i + 1] * seg);
        d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${points[i + 1].x.toFixed(1)},${points[i + 1].y.toFixed(1)}`;
    }
    return d;
}

function buildAreaPath(points: ChartPoint[], baselineY: number, yMin: number, yMax: number): string {
    if (points.length === 0) return "";
    const line = buildSmoothPath(points, yMin, yMax);
    const first = points[0];
    const last = points[points.length - 1];
    return `${line} L ${last.x.toFixed(1)},${baselineY.toFixed(1)} L ${first.x.toFixed(1)},${baselineY.toFixed(1)} Z`;
}

function getPhaseName(progress: number): string {
    if (progress < 50) return "Download Load";
    if (progress < 80) return "Upload Load";
    return "Idle Check";
}

function useContainerSize(ref: React.RefObject<HTMLDivElement | null>, fallbackW = 540, fallbackH = 250) {
    const [size, setSize] = useState({ w: fallbackW, h: fallbackH });

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const update = () => {
            const nextW = el.clientWidth;
            const nextH = el.clientHeight;
            if (nextW > 120 && nextH > 100) {
                setSize((prev) => (prev.w === nextW && prev.h === nextH ? prev : { w: nextW, h: nextH }));
            }
        };
        update();
        if (typeof ResizeObserver === "undefined") return;
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, [ref]);

    return size;
}

interface TelemetryPlotProps {
    data: RunMetrics[];
    hoveredIdx: number | null;
    onHoverIdx: (idx: number | null) => void;
    yScale: { ceiling: number; ticks: number[] };
    renderCurves: (
        toX: (progress: number) => number,
        toY: (val: number) => number,
        plotTop: number,
        plotBottom: number,
        plotW: number,
        uid: string
    ) => React.ReactNode;
    renderTooltip: (sample: RunMetrics) => React.ReactNode;
    ariaLabel: string;
}

function TelemetryPlotCanvas({
    data,
    hoveredIdx,
    onHoverIdx,
    yScale,
    renderCurves,
    renderTooltip,
    ariaLabel,
}: TelemetryPlotProps) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const { w, h } = useContainerSize(wrapRef);
    const uid = useId().replace(/:/g, "");

    const plotLeft = PAD.left;
    const plotRight = Math.max(plotLeft + 40, w - PAD.right);
    const plotTop = PAD.top;
    const plotBottom = Math.max(plotTop + 40, h - PAD.bottom);
    const plotW = plotRight - plotLeft;
    const plotH = plotBottom - plotTop;

    const toX = (progress: number) => plotLeft + (Math.max(0, Math.min(100, progress)) / 100) * plotW;
    const toY = (val: number) => plotBottom - (Math.max(0, Math.min(val, yScale.ceiling)) / yScale.ceiling) * plotH;

    const findNearestIndex = (clientX: number) => {
        const el = wrapRef.current;
        if (!el || data.length === 0) return null;
        const rect = el.getBoundingClientRect();
        const relX = clientX - rect.left - plotLeft;
        const targetProgress = Math.max(0, Math.min(100, (relX / plotW) * 100));
        let bestIdx = 0;
        let bestDiff = Infinity;
        for (let i = 0; i < data.length; i++) {
            const diff = Math.abs(data[i].progress - targetProgress);
            if (diff < bestDiff) {
                bestDiff = diff;
                bestIdx = i;
            }
        }
        return bestIdx;
    };

    const hoveredSample = hoveredIdx !== null && data[hoveredIdx] ? data[hoveredIdx] : null;
    const hoverX = hoveredSample ? toX(hoveredSample.progress) : 0;
    const tooltipOnLeft = hoveredSample ? hoveredSample.progress > 60 : false;

    const dlEndX = toX(50);
    const ulEndX = toX(80);

    return (
        <div
            ref={wrapRef}
            className="relative w-full h-[230px] sm:h-[250px] bg-well/35 rounded-xl border border-line select-none touch-pan-y overflow-hidden"
            onMouseMove={(e) => onHoverIdx(findNearestIndex(e.clientX))}
            onMouseLeave={() => onHoverIdx(null)}
            onTouchMove={(e) => {
                if (e.touches[0]) onHoverIdx(findNearestIndex(e.touches[0].clientX));
            }}
            onTouchEnd={() => onHoverIdx(null)}
        >
            <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block absolute inset-0" role="img" aria-label={ariaLabel}>
                {/* Subtle test phase background bands */}
                <rect x={plotLeft} y={plotTop} width={dlEndX - plotLeft} height={plotH} fill="rgba(0, 158, 82, 0.045)" />
                <rect x={dlEndX} y={plotTop} width={ulEndX - dlEndX} height={plotH} fill="rgba(255, 142, 96, 0.055)" />
                <rect x={ulEndX} y={plotTop} width={plotRight - ulEndX} height={plotH} fill="rgba(0, 71, 62, 0.035)" />

                {/* Phase headers cleanly pinned inside top gutter */}
                <text x={plotLeft + (dlEndX - plotLeft) / 2} y={15} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="rgb(var(--ink-muted))">
                    DOWNLOAD (0–50%)
                </text>
                <text x={dlEndX + (ulEndX - dlEndX) / 2} y={15} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="rgb(var(--ink-muted))">
                    UPLOAD (50–80%)
                </text>
                <text x={ulEndX + (plotRight - ulEndX) / 2} y={15} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="rgb(var(--ink-muted))">
                    IDLE
                </text>

                {/* Phase divider vertical hairlines */}
                <line x1={dlEndX} y1={plotTop} x2={dlEndX} y2={plotBottom} stroke="var(--line)" strokeDasharray="3 3" strokeWidth="1" />
                <line x1={ulEndX} y1={plotTop} x2={ulEndX} y2={plotBottom} stroke="var(--line)" strokeDasharray="3 3" strokeWidth="1" />

                {/* Calibrated horizontal Y-axis gridlines & aligned labels */}
                {yScale.ticks.map((tick, idx) => {
                    const y = toY(tick);
                    return (
                        <g key={tick}>
                            <line
                                x1={plotLeft}
                                y1={y}
                                x2={plotRight}
                                y2={y}
                                stroke="var(--line)"
                                strokeDasharray={idx === 0 ? undefined : "3 3"}
                                strokeWidth={idx === 0 ? 1 : 0.85}
                            />
                            <text
                                x={plotLeft - 7}
                                y={y + 3}
                                textAnchor="end"
                                fontSize="10"
                                fontFamily="var(--font-mono), ui-monospace, monospace"
                                fill="rgb(var(--ink-muted))"
                            >
                                {Math.round(tick)}
                            </text>
                        </g>
                    );
                })}

                {/* X-axis timeline labels */}
                {[0, 25, 50, 80, 100].map((pct) => (
                    <text
                        key={pct}
                        x={toX(pct)}
                        y={h - 9}
                        textAnchor={pct === 0 ? "start" : pct === 100 ? "end" : "middle"}
                        fontSize="10"
                        fontFamily="var(--font-mono), ui-monospace, monospace"
                        fill="rgb(var(--ink-muted))"
                    >
                        {pct}%
                    </text>
                ))}

                {/* Plot border */}
                <rect x={plotLeft} y={plotTop} width={plotW} height={plotH} fill="none" stroke="var(--line)" strokeWidth="1" />

                {/* Data curves & markers */}
                {renderCurves(toX, toY, plotTop, plotBottom, plotW, uid)}

                {/* Synchronized Crosshair Line */}
                {hoveredSample && (
                    <line
                        x1={hoverX}
                        y1={plotTop}
                        x2={hoverX}
                        y2={plotBottom}
                        stroke="rgb(var(--ink))"
                        strokeOpacity="0.45"
                        strokeDasharray="3 3"
                        strokeWidth="1.25"
                    />
                )}
            </svg>

            {/* Clamped Floating Tooltip */}
            {hoveredSample && (
                <div
                    className="pointer-events-none absolute z-20 top-7 bg-surface/95 backdrop-blur-sm border border-line-strong rounded-xl px-3 py-2 shadow-elevated text-2xs min-w-[148px]"
                    style={{
                        left: tooltipOnLeft ? undefined : Math.min(hoverX + 10, w - 162),
                        right: tooltipOnLeft ? Math.max(w - hoverX + 10, 10) : undefined,
                    }}
                >
                    <div className="flex items-center justify-between gap-2 pb-1 mb-1 border-b border-line font-bold text-ink">
                        <span>{getPhaseName(hoveredSample.progress)}</span>
                        <span className="font-mono text-muted">{hoveredSample.progress}%</span>
                    </div>
                    {renderTooltip(hoveredSample)}
                </div>
            )}
        </div>
    );
}

export const ResultsCharts = ({ data, result }: ResultsChartsProps) => {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const hasData = Boolean(data && data.length > 0);

    // Derive calm idle baseline from Stabilization Phase (>=80%) when measured, or earliest sample
    const derivedBaseline = useMemo(() => {
        if (!hasData) return 15;
        const stableSamples = data.filter((d) => d.progress >= 80);
        if (stableSamples.length > 0) {
            const sum = stableSamples.reduce((acc, s) => acc + s.latency, 0);
            return Math.round(sum / stableSamples.length);
        }
        return Math.max(5, Math.min(...data.map((d) => d.latency)));
    }, [data, hasData]);

    const summary = useMemo(() => {
        if (!hasData) {
            return {
                dlPeak: 0,
                dlLatest: 0,
                ulPeak: 0,
                ulLatest: 0,
                pingPeak: 0,
                pingLatest: 0,
                avgJitter: 0,
            };
        }
        const dlSamples = data.filter((d) => d.progress <= 55).map((d) => d.download);
        const ulSamples = data.filter((d) => d.progress >= 50).map((d) => d.upload);
        const latest = data[data.length - 1];
        return {
            dlPeak: dlSamples.length ? Math.max(...dlSamples) : latest.download,
            dlLatest: latest.download,
            ulPeak: ulSamples.length ? Math.max(...ulSamples) : latest.upload,
            ulLatest: latest.upload,
            pingPeak: Math.max(...data.map((d) => d.latency)),
            pingLatest: latest.latency,
            avgJitter: Math.round(data.reduce((a, b) => a + b.jitter, 0) / data.length),
        };
    }, [data, hasData]);

    const activeSample = hoveredIdx !== null && data[hoveredIdx] ? data[hoveredIdx] : hasData ? data[data.length - 1] : null;

    const bwScale = useMemo(
        () => getNiceCeiling(hasData ? Math.max(...data.map((d) => Math.max(d.download, d.upload)), 40) : 100, 40),
        [data, hasData]
    );

    const pingScale = useMemo(
        () => getNiceCeiling(hasData ? Math.max(...data.map((d) => d.latency), derivedBaseline + 10, 24) : 60, 24),
        [data, hasData, derivedBaseline]
    );

    const peakLatencySample = useMemo(() => {
        if (!hasData) return null;
        return data.reduce((best, cur) => (cur.latency > best.latency ? cur : best), data[0]);
    }, [data, hasData]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            {/* Graph 1: Dual Bandwidth Throughput (Download + Upload) */}
            <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 flex flex-col gap-4">
                <div className="flex flex-wrap justify-between items-start gap-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Download size={16} className="text-secondary flex-shrink-0" aria-hidden="true" />
                            <h3 className="font-bold text-sm sm:text-base text-ink">Bandwidth Throughput</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-2xs text-muted">
                            <span className="inline-flex items-center gap-1.5">
                                <span className="size-2 rounded-full bg-secondary" aria-hidden="true" />
                                <span>Download (Peak {summary.dlPeak.toFixed(1)} Mbps)</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
                                <span>Upload (Peak {summary.ulPeak.toFixed(1)} Mbps)</span>
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 font-mono text-right">
                        <div>
                            <div className="text-lg sm:text-xl font-bold text-secondary tabular-nums">
                                {(activeSample?.download ?? 0).toFixed(1)}
                            </div>
                            <span className="text-3xs uppercase text-muted inline-flex items-center gap-1">
                                <Download size={10} aria-hidden="true" /> Mbps
                            </span>
                        </div>
                        <div className="border-l border-line pl-4">
                            <div className="text-lg sm:text-xl font-bold text-primary tabular-nums">
                                {(activeSample?.upload ?? 0).toFixed(1)}
                            </div>
                            <span className="text-3xs uppercase text-muted inline-flex items-center gap-1">
                                <Upload size={10} aria-hidden="true" /> Mbps
                            </span>
                        </div>
                    </div>
                </div>

                <TelemetryPlotCanvas
                    data={data}
                    hoveredIdx={hoveredIdx}
                    onHoverIdx={setHoveredIdx}
                    yScale={bwScale}
                    ariaLabel="Download and upload throughput over test timeline"
                    renderCurves={(toX, toY, plotTop, plotBottom, _plotW, uid) => {
                        if (!hasData) return null;
                        const dlPts = data.map((d) => ({ x: toX(d.progress), y: toY(d.download) }));
                        const ulPts = data.map((d) => ({ x: toX(d.progress), y: toY(d.upload) }));
                        const hoverSample = hoveredIdx !== null ? data[hoveredIdx] : null;
                        return (
                            <>
                                <defs>
                                    <linearGradient id={`dlGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#009E52" stopOpacity="0.24" />
                                        <stop offset="100%" stopColor="#009E52" stopOpacity="0" />
                                    </linearGradient>
                                    <linearGradient id={`ulGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#FF8E60" stopOpacity="0.22" />
                                        <stop offset="100%" stopColor="#FF8E60" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                <path d={buildAreaPath(dlPts, plotBottom, plotTop, plotBottom)} fill={`url(#dlGrad-${uid})`} />
                                <path d={buildSmoothPath(dlPts, plotTop, plotBottom)} fill="none" stroke="#009E52" strokeWidth="2.25" strokeLinejoin="round" />

                                <path d={buildAreaPath(ulPts, plotBottom, plotTop, plotBottom)} fill={`url(#ulGrad-${uid})`} />
                                <path d={buildSmoothPath(ulPts, plotTop, plotBottom)} fill="none" stroke="#FF8E60" strokeWidth="2.25" strokeLinejoin="round" />

                                {hoverSample && (
                                    <>
                                        <circle
                                            cx={toX(hoverSample.progress)}
                                            cy={toY(hoverSample.download)}
                                            r="4.5"
                                            fill="#009E52"
                                            stroke="#FFFFFF"
                                            strokeWidth="1.75"
                                        />
                                        <circle
                                            cx={toX(hoverSample.progress)}
                                            cy={toY(hoverSample.upload)}
                                            r="4.5"
                                            fill="#FF8E60"
                                            stroke="#FFFFFF"
                                            strokeWidth="1.75"
                                        />
                                    </>
                                )}
                            </>
                        );
                    }}
                    renderTooltip={(s) => (
                        <div className="space-y-1 font-mono">
                            <div className="flex justify-between gap-3">
                                <span className="text-muted">Download</span>
                                <span className="font-bold text-secondary">{s.download.toFixed(1)} Mbps</span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="text-muted">Upload</span>
                                <span className="font-bold text-primary">{s.upload.toFixed(1)} Mbps</span>
                            </div>
                        </div>
                    )}
                />
            </div>

            {/* Graph 2: Loaded Latency & Bloat Spike vs Idle Baseline */}
            <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 flex flex-col gap-4">
                <div className="flex flex-wrap justify-between items-start gap-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Activity size={16} className="text-primary flex-shrink-0" aria-hidden="true" />
                            <h3 className="font-bold text-sm sm:text-base text-ink">Latency Under Load</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-2xs text-muted">
                            <span className="inline-flex items-center gap-1.5">
                                <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
                                <span>Loaded Ping (Peak {summary.pingPeak} ms)</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <span className="w-3 h-0.5 border-t-2 border-dashed border-secondary" aria-hidden="true" />
                                <span>Idle Baseline ({derivedBaseline} ms)</span>
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 font-mono text-right">
                        <div>
                            <div className="text-lg sm:text-xl font-bold text-primary tabular-nums">
                                {hoveredIdx !== null
                                    ? activeSample?.latency ?? 0
                                    : result
                                    ? summary.pingPeak
                                    : activeSample?.latency ?? 0}
                            </div>
                            <span className="text-3xs uppercase text-muted">
                                {hoveredIdx === null && result ? "Peak ms" : "Ping ms"}
                            </span>
                        </div>
                        <div className="border-l border-line pl-4">
                            <div className="text-lg sm:text-xl font-bold text-secondary tabular-nums">
                                +
                                {hoveredIdx !== null
                                    ? Math.max(0, (activeSample?.latency ?? derivedBaseline) - derivedBaseline)
                                    : result
                                    ? result.latency
                                    : Math.max(0, (activeSample?.latency ?? derivedBaseline) - derivedBaseline)}
                            </div>
                            <span className="text-3xs uppercase text-muted inline-flex items-center gap-1">
                                <Waves size={10} aria-hidden="true" /> Bloat ms
                            </span>
                        </div>
                    </div>
                </div>

                <TelemetryPlotCanvas
                    data={data}
                    hoveredIdx={hoveredIdx}
                    onHoverIdx={setHoveredIdx}
                    yScale={pingScale}
                    ariaLabel="Loaded latency compared to idle ping baseline"
                    renderCurves={(toX, toY, plotTop, plotBottom, plotW, uid) => {
                        if (!hasData) return null;
                        const pingPts = data.map((d) => ({ x: toX(d.progress), y: toY(d.latency) }));
                        const baseY = toY(derivedBaseline);
                        const hoverSample = hoveredIdx !== null ? data[hoveredIdx] : null;
                        const firstX = pingPts[0].x;
                        const lastX = pingPts[pingPts.length - 1].x;

                        return (
                            <>
                                <defs>
                                    <linearGradient id={`pingGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#FF8E60" stopOpacity="0.28" />
                                        <stop offset="100%" stopColor="#FF8E60" stopOpacity="0.02" />
                                    </linearGradient>
                                </defs>

                                {/* Area between Loaded Latency curve and plot floor */}
                                <path d={buildAreaPath(pingPts, plotBottom, plotTop, plotBottom)} fill={`url(#pingGrad-${uid})`} />

                                {/* Steady Idle Baseline horizontal reference line */}
                                <line
                                    x1={firstX}
                                    y1={baseY}
                                    x2={lastX}
                                    y2={baseY}
                                    stroke="#009E52"
                                    strokeWidth="2"
                                    strokeDasharray="5 4"
                                />

                                {/* Loaded Ping curve */}
                                <path d={buildSmoothPath(pingPts, plotTop, plotBottom)} fill="none" stroke="#FF8E60" strokeWidth="2.5" strokeLinejoin="round" />

                                {/* Peak latency highlight pin */}
                                {peakLatencySample && peakLatencySample.latency > derivedBaseline && !hoverSample && (
                                    <g>
                                        <circle
                                            cx={toX(peakLatencySample.progress)}
                                            cy={toY(peakLatencySample.latency)}
                                            r="4"
                                            fill="#FF8E60"
                                            stroke="#FFFFFF"
                                            strokeWidth="1.5"
                                        />
                                        <text
                                            x={Math.max(PAD.left + 32, Math.min(toX(peakLatencySample.progress), PAD.left + plotW - 34))}
                                            y={Math.max(plotTop + 12, toY(peakLatencySample.latency) - 8)}
                                            textAnchor="middle"
                                            fontSize="9.5"
                                            fontWeight="700"
                                            fontFamily="var(--font-mono), ui-monospace, monospace"
                                            fill="#E87143"
                                        >
                                            Peak {peakLatencySample.latency}ms
                                        </text>
                                    </g>
                                )}

                                {hoverSample && (
                                    <>
                                        <circle
                                            cx={toX(hoverSample.progress)}
                                            cy={baseY}
                                            r="4"
                                            fill="#009E52"
                                            stroke="#FFFFFF"
                                            strokeWidth="1.5"
                                        />
                                        <circle
                                            cx={toX(hoverSample.progress)}
                                            cy={toY(hoverSample.latency)}
                                            r="4.5"
                                            fill="#FF8E60"
                                            stroke="#FFFFFF"
                                            strokeWidth="1.75"
                                        />
                                    </>
                                )}
                            </>
                        );
                    }}
                    renderTooltip={(s) => (
                        <div className="space-y-1 font-mono">
                            <div className="flex justify-between gap-3">
                                <span className="text-muted">Loaded</span>
                                <span className="font-bold text-primary">{s.latency} ms</span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="text-muted">Baseline</span>
                                <span className="font-bold text-secondary">{derivedBaseline} ms</span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="text-muted">Delta</span>
                                <span className="font-bold text-ink">+{Math.max(0, s.latency - derivedBaseline)} ms</span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="text-muted">Jitter</span>
                                <span className="font-semibold text-ink">{s.jitter} ms</span>
                            </div>
                        </div>
                    )}
                />
            </div>
        </div>
    );
};
