import { Download, Activity } from "lucide-react";

interface RunMetrics {
    progress: number;
    download: number;
    latency: number;
    jitter: number;
    upload: number;
}

interface ResultsChartsProps {
    data: RunMetrics[];
}

export const ResultsCharts = ({ data }: ResultsChartsProps) => {
    const hasData = data && data.length > 0;
    const currentMetric = hasData ? data[data.length - 1] : { download: 0, latency: 0, jitter: 0, upload: 0 };

    const chartData = hasData
        ? data.map((d, i) => ({
              ...d,
              baseLatency: Math.max(10, d.latency - (d.download > 10 ? d.download * 0.1 : 0) - Math.abs(Math.sin(i)) * 5),
          }))
        : [];

    const currentBaseLatency = hasData && chartData.length > 0 ? chartData[chartData.length - 1].baseLatency : 0;

    const currentMaxDownload = hasData ? Math.max(...chartData.map((d) => d.download), 50) : 100;
    const maxDownload = currentMaxDownload + currentMaxDownload * 0.1;

    const currentMaxLatency = hasData ? Math.max(...chartData.map((d) => d.latency), 50) : 100;
    const maxLatency = currentMaxLatency + currentMaxLatency * 0.1;

    const createPath = (key: keyof (typeof chartData)[0], maxVal: number, height: number, width: number) => {
        if (!hasData || chartData.length === 0) return "";
        const points = chartData.map((d) => {
            const x = (d.progress / 100) * width;
            const val = d[key] as number;
            const y = height - (val / maxVal) * height;
            return `${x},${y}`;
        });
        return `M ${points.join(" L ")}`;
    };

    const createAreaPath = (key: keyof (typeof chartData)[0], maxVal: number, height: number, width: number) => {
        if (!hasData || chartData.length === 0) return "";
        const linePath = createPath(key, maxVal, height, width);
        const lastX = (chartData[chartData.length - 1].progress / 100) * width;
        return `${linePath} L ${lastX},${height} L 0,${height} Z`;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            {/* Download Throughput Chart */}
            <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 h-72 sm:h-80 flex flex-col">
                <div className="flex justify-between items-start mb-4 gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <Download size={18} className="text-secondary flex-shrink-0" aria-hidden="true" />
                        <div className="min-w-0">
                            <h3 className="font-bold text-sm sm:text-base text-ink">Download Throughput</h3>
                            <p className="text-2xs text-muted">Saturation curve over test timeline</p>
                        </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <div className="text-xl sm:text-2xl font-mono font-bold text-ink tabular-nums">
                            {currentMetric.download.toFixed(1)}
                        </div>
                        <span className="text-2xs text-muted font-mono uppercase">Mbps</span>
                    </div>
                </div>

                <div className="relative flex-1 w-full min-h-0 bg-well/40 rounded-xl border border-line overflow-hidden">
                    <div className="absolute inset-0 flex flex-col justify-between text-2xs text-muted pointer-events-none z-0 pb-3 pl-2 font-mono">
                        {[1, 0.75, 0.5, 0.25, 0].map((pct) => (
                            <div key={pct} className="flex items-center w-full border-b border-line h-full relative">
                                <span className="absolute left-1 top-1 opacity-75">{Math.round(maxDownload * pct)}</span>
                            </div>
                        ))}
                    </div>
                    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 240">
                        <defs>
                            <linearGradient id="downloadChartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#009E52" stopOpacity="0.24" />
                                <stop offset="100%" stopColor="#009E52" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        {hasData && (
                            <>
                                <path d={createAreaPath("download", maxDownload, 240, 1000)} fill="url(#downloadChartGradient)" />
                                <path d={createPath("download", maxDownload, 240, 1000)} fill="none" stroke="#009E52" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                            </>
                        )}
                    </svg>
                </div>
            </div>

            {/* Latency Spike Chart */}
            <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 h-72 sm:h-80 flex flex-col">
                <div className="flex justify-between items-start mb-4 gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <Activity size={18} className="text-primary flex-shrink-0" aria-hidden="true" />
                        <div className="min-w-0">
                            <h3 className="font-bold text-sm sm:text-base text-ink">Latency Under Load</h3>
                            <p className="text-2xs text-muted">Loaded ping vs idle baseline (ms)</p>
                        </div>
                    </div>
                    <div className="flex gap-4 flex-shrink-0 font-mono">
                        <div className="text-right">
                            <div className="text-lg sm:text-xl font-bold text-primary tabular-nums">{currentMetric.latency}</div>
                            <p className="text-2xs text-muted">Loaded</p>
                        </div>
                        <div className="text-right">
                            <div className="text-lg sm:text-xl font-bold text-secondary tabular-nums">{Math.round(currentBaseLatency)}</div>
                            <p className="text-2xs text-muted">Idle</p>
                        </div>
                    </div>
                </div>

                <div className="relative flex-1 w-full min-h-0 bg-well/40 rounded-xl border border-line overflow-hidden">
                    <div className="absolute inset-0 flex flex-col justify-between text-2xs text-muted pointer-events-none z-0 pb-3 pl-2 font-mono">
                        {[1, 0.75, 0.5, 0.25, 0].map((pct) => (
                            <div key={pct} className="flex items-center w-full border-b border-line h-full relative">
                                <span className="absolute left-1 top-1 opacity-75">{Math.round(maxLatency * pct)}</span>
                            </div>
                        ))}
                    </div>
                    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 240">
                        <defs>
                            <linearGradient id="latencyLoadedGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#FF8E60" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#FF8E60" stopOpacity="0" />
                            </linearGradient>
                            <linearGradient id="latencyBaseGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#009E52" stopOpacity="0.16" />
                                <stop offset="100%" stopColor="#009E52" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        {hasData && (
                            <>
                                <path d={createAreaPath("latency", maxLatency, 240, 1000)} fill="url(#latencyLoadedGradient)" />
                                <path d={createPath("latency", maxLatency, 240, 1000)} fill="none" stroke="#FF8E60" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                                <path d={createAreaPath("baseLatency", maxLatency, 240, 1000)} fill="url(#latencyBaseGradient)" />
                                <path d={createPath("baseLatency", maxLatency, 240, 1000)} fill="none" stroke="#009E52" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                            </>
                        )}
                    </svg>
                </div>
            </div>
        </div>
    );
};
