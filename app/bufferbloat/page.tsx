"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Play, RotateCw, Activity, Waves, Upload, ChevronRight, ArrowRight, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { BufferbloatEngine, TestResult } from "@/lib/bufferbloat-engine";
import { ResultsCharts } from "@/components/bufferbloat/ResultsCharts";
import DiagnosticFaqSection, { type DiagnosticFaqItem } from "@/components/ui/DiagnosticFaqSection";

export interface RunMetrics {
    progress: number;
    download: number;
    latency: number;
    jitter: number;
    upload: number;
}

function getPhaseLabel(progress: number): string {
    if (progress < 50) return "Testing download congestion…";
    if (progress < 80) return "Testing upload congestion…";
    return "Comparing loaded vs idle ping…";
}

function gradeBadgeClasses(grade: string | undefined): string {
    if (grade === "A" || grade === "B") return "bg-secondary text-white border-secondary";
    if (grade === "C" || grade === "D") return "bg-primary text-foreground border-primary";
    if (grade === "F") return "bg-red-600 text-white border-red-600";
    return "bg-well text-muted border-line";
}

function gradeLabel(grade: string | undefined): string {
    if (grade === "A") return "No Bufferbloat (Ideal)";
    if (grade === "B") return "Minimal Bufferbloat (Good)";
    if (grade === "C") return "Moderate Bufferbloat (Fair)";
    if (grade === "D") return "Noticeable Bufferbloat (Poor)";
    if (grade === "F") return "Severe Bufferbloat (Critical)";
    return "Ready to Measure";
}

const BUFFERBLOAT_FAQS: DiagnosticFaqItem[] = [
    {
        q: "What exactly is bufferbloat?",
        a: "Bufferbloat is unwanted latency and jitter that happens when your router or modem holds too many packets in oversized queues during heavy downloads or uploads. Urgent packets like game inputs and voice calls get stuck waiting in line, spiking your ping.",
    },
    {
        q: "Why do I lag even on 1 Gbps fiber internet?",
        a: "Raw speed (Mbps) measures total pipe width, while latency (ms) measures reaction time. Without active queue management, a single big file upload or Steam download can still fill your router buffer and push ping above 150 ms.",
    },
    {
        q: "What is the difference between idle latency and loaded latency?",
        a: "Idle latency is your normal ping when nothing else uses the internet. Loaded latency is ping measured while saturating download or upload bandwidth. Bufferbloat is the extra spike added under load.",
    },
    {
        q: "What is Smart Queue Management (SQM) and how does it fix lag?",
        a: "SQM (algorithms like CAKE or FQ-CoDel on routers) gives voice and game packets small priority queues instead of trapping them behind bulk downloads, usually keeping loaded ping spikes under 5 ms.",
    },
    {
        q: "Does Wi-Fi increase bufferbloat compared to Ethernet?",
        a: "Yes. Wireless airtime contention and retries add jitter even before traffic hits your modem. Run a quick test on Wi-Fi and another over wired Ethernet to separate home Wi-Fi interference from ISP router bloat.",
    },
    {
        q: "What if my router does not have SQM?",
        a: "Look for QoS (Quality of Service) or bandwidth limits in your router panel and cap upload/download speeds at roughly 90% of your plan speed so queues form gently inside your router instead of your ISP modem.",
    },
];

export default function BufferbloatPage() {
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<TestResult | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [runMetrics, setRunMetrics] = useState<RunMetrics | null>(null);
    const [metricsHistory, setMetricsHistory] = useState<RunMetrics[]>([]);
    const engineRef = useRef<BufferbloatEngine | null>(null);

    useEffect(() => {
        return () => {
            engineRef.current?.abort();
        };
    }, []);

    const startTest = async () => {
        engineRef.current?.abort();
        setIsRunning(true);
        setProgress(0);
        setRunMetrics(null);
        setMetricsHistory([]);
        setResult(null);

        const engine = new BufferbloatEngine((data) => {
            setProgress(data.progress);
            setRunMetrics(data);
            setMetricsHistory((prev) => [...prev, data]);
        });
        engineRef.current = engine;
        try {
            const data = await engine.runTest();
            setResult(data);
        } finally {
            setIsRunning(false);
        }
    };

    const circumference = 816;
    const offset = circumference - (progress / 100) * circumference;

    const gaugeStatus = isRunning
        ? !runMetrics
            ? "Calibrating"
            : runMetrics.progress < 50
            ? "Download"
            : runMetrics.progress < 80
            ? "Upload"
            : "Finishing"
        : result
        ? "Completed"
        : "Standby";

    const hasData = metricsHistory.length > 0;

    // Plain-English real-app suitability translation
    const appImpacts = result
        ? [
              {
                  app: "Video Calls (Zoom / Teams)",
                  ok: result.latency <= 30,
                  status: result.latency <= 30 ? "Clear & steady" : result.latency <= 60 ? "Occasional pauses" : "Likely freezes",
              },
              {
                  app: "Competitive Gaming",
                  ok: result.latency <= 15,
                  status: result.latency <= 15 ? "Low ping spikes" : result.latency <= 35 ? "Mild jitter" : "Rubberbanding risk",
              },
              {
                  app: "Voice Chat (Discord)",
                  ok: result.latency <= 40,
                  status: result.latency <= 40 ? "Crisp voice" : "Robotic audio risk",
              },
          ]
        : [
              { app: "Video Calls (Zoom / Teams)", ok: null, status: "Run test to verify" },
              { app: "Competitive Gaming", ok: null, status: "Run test to verify" },
              { app: "Voice Chat (Discord)", ok: null, status: "Run test to verify" },
          ];

    return (
        <div className="bg-canvas text-ink pb-20">
            <div className="max-w-site mx-auto px-5 sm:px-6 pt-8 pb-10 space-y-12">
                {/* Breadcrumb */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-muted">
                    <Link href="/" className="hover:text-ink transition-colors">Overview</Link>
                    <ChevronRight size={14} aria-hidden="true" />
                    <span className="text-ink font-semibold" aria-current="page">Bufferbloat Latency Test</span>
                </nav>

                {/* Header */}
                <div className="max-w-3xl space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary">
                        Loaded Latency &amp; Router Queue Check
                    </p>
                    <h1 className="text-fluid-hero font-extrabold text-ink tracking-tight leading-tight">
                        Bufferbloat Latency Test
                    </h1>
                    <p className="text-fluid-lead text-muted leading-relaxed">
                        Find out why online games lag or video calls stutter when someone else downloads a file—even on fast internet plans. Measures how much ping climbs under real network load.
                    </p>
                </div>

                {/* Primary Interactive Workbench */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    {/* Left: Precision SVG Arc Gauge */}
                    <div className="lg:col-span-7 bg-surface border border-line rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-between gap-6">
                        <div className="w-full flex items-center justify-between text-xs border-b border-line pb-3">
                            <span className="font-bold text-ink">Live Connection Meter</span>
                            <span className="font-mono text-muted uppercase">{gaugeStatus}</span>
                        </div>

                        <div className="relative w-full max-w-[260px] aspect-square flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 288 288" aria-hidden="true">
                                <circle
                                    className="text-well"
                                    cx="144"
                                    cy="144"
                                    fill="transparent"
                                    r="130"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                />
                                <circle
                                    className="text-primary transition-all duration-300 ease-out"
                                    cx="144"
                                    cy="144"
                                    fill="transparent"
                                    r="130"
                                    stroke="currentColor"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={offset}
                                    strokeLinecap="round"
                                    strokeWidth="12"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <span className="text-xs font-semibold text-muted mb-1">
                                    {isRunning ? `${progress}%` : result ? "Download Speed" : "Ready"}
                                </span>
                                <div className="text-4xl sm:text-5xl font-mono font-extrabold text-ink tabular-nums">
                                    {result
                                        ? result.download
                                        : runMetrics
                                        ? runMetrics.download.toFixed(1)
                                        : "--"}
                                </div>
                                <span className="text-xs font-mono uppercase text-muted mt-1">Mbps</span>
                            </div>
                        </div>

                        {/* 3-Column Metrics Strip */}
                        <div className="grid grid-cols-3 gap-4 w-full border-t border-b border-line py-4 text-center">
                            <div>
                                <div className="inline-flex items-center gap-1 text-2xs font-semibold text-muted mb-1">
                                    <Activity size={12} className="text-secondary" aria-hidden="true" />
                                    <span>{result ? "Bloat Spike" : "Ping"}</span>
                                </div>
                                <div className="text-lg sm:text-xl font-mono font-bold text-ink tabular-nums">
                                    {result ? `+${result.latency} ms` : runMetrics ? `${runMetrics.latency} ms` : "--"}
                                </div>
                            </div>
                            <div className="border-x border-line px-2">
                                <div className="inline-flex items-center gap-1 text-2xs font-semibold text-muted mb-1">
                                    <Waves size={12} className="text-primary" aria-hidden="true" />
                                    <span>Jitter</span>
                                </div>
                                <div className="text-lg sm:text-xl font-mono font-bold text-ink tabular-nums">
                                    {result ? `${result.jitter} ms` : runMetrics ? `${runMetrics.jitter} ms` : "--"}
                                </div>
                            </div>
                            <div>
                                <div className="inline-flex items-center gap-1 text-2xs font-semibold text-muted mb-1">
                                    <Upload size={12} className="text-secondary" aria-hidden="true" />
                                    <span>Upload</span>
                                </div>
                                <div className="text-lg sm:text-xl font-mono font-bold text-ink tabular-nums">
                                    {result ? `${result.upload} Mbps` : runMetrics ? `${runMetrics.upload.toFixed(1)} Mbps` : "--"}
                                </div>
                            </div>
                        </div>

                        {isRunning && runMetrics && (
                            <p role="status" aria-live="polite" className="text-xs font-medium text-muted">
                                {getPhaseLabel(runMetrics.progress)}
                            </p>
                        )}

                        <button
                            type="button"
                            onClick={startTest}
                            disabled={isRunning}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-primary text-foreground font-bold text-sm rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            {isRunning ? <RotateCw size={16} className="animate-spin" aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
                            <span>{isRunning ? "Testing Connection…" : result ? "Run Test Again" : "Start Bufferbloat Test"}</span>
                        </button>
                    </div>

                    {/* Right: Grade + Everyday App Impact Panel */}
                    <div className="lg:col-span-5 bg-surface border border-line rounded-2xl p-6 sm:p-8 flex flex-col justify-between gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-line pb-3">
                                <span className="text-xs font-bold text-ink">Quality Grade</span>
                                <span className="text-xs font-mono text-muted">Idle vs Load Delta</span>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className={`size-16 rounded-2xl border flex items-center justify-center text-3xl font-mono font-extrabold flex-shrink-0 ${gradeBadgeClasses(result?.grade)}`}>
                                    {result?.grade || "?"}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-ink">{gradeLabel(result?.grade)}</h2>
                                    <p className="text-xs text-muted mt-0.5 leading-relaxed">
                                        {result
                                            ? `Latency added +${result.latency} ms under full traffic load.`
                                            : "Press Start Bufferbloat Test to check whether your router keeps video calls and gaming responsive."}
                                    </p>
                                </div>
                            </div>

                            {result && (
                                <div className="space-y-1.5 pt-2">
                                    <div className="flex justify-between text-xs font-mono">
                                        <span className="text-muted">Queue Delay</span>
                                        <span className="font-bold text-ink">+{result.latency} ms</span>
                                    </div>
                                    <div
                                        role="progressbar"
                                        aria-valuenow={result.latency}
                                        aria-valuemin={0}
                                        aria-valuemax={120}
                                        aria-label="Bufferbloat latency increase"
                                        className="h-2 w-full bg-well rounded-full overflow-hidden"
                                    >
                                        <div
                                            className={`h-full transition-all duration-500 ${
                                                result.latency <= 30 ? "bg-secondary" : result.latency <= 100 ? "bg-primary" : "bg-red-600"
                                            }`}
                                            style={{ width: `${Math.min((result.latency / 120) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Plain-English App Suitability Matrix */}
                        <div className="space-y-2.5 border-t border-line pt-4">
                            <span className="text-xs font-bold text-ink block">Everyday App Verdict</span>
                            <div className="divide-y divide-line border border-line rounded-xl bg-well/40">
                                {appImpacts.map((item) => (
                                    <div key={item.app} className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs">
                                        <span className="font-medium text-ink">{item.app}</span>
                                        <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
                                            {item.ok === true && <CheckCircle2 size={14} className="text-secondary" aria-hidden="true" />}
                                            {item.ok === false && (result && result.latency > 100 ? <XCircle size={14} className="text-red-500" aria-hidden="true" /> : <AlertTriangle size={14} className="text-primary" aria-hidden="true" />)}
                                            <span className={item.ok === null ? "text-muted font-normal" : ""}>{item.status}</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Live Charts */}
                {hasData && (
                    <section aria-label="Real-time test charts" className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                            <div>
                                <h2 className="text-fluid-h2 font-bold text-ink">Live Bandwidth &amp; Latency Graph</h2>
                                <p className="text-xs text-muted mt-0.5">
                                    Synchronized download, upload, and loaded ping telemetry across test phases — hover or drag across either chart to inspect samples.
                                </p>
                            </div>
                            <span className={`text-xs font-mono font-semibold flex-shrink-0 ${result ? "text-secondary" : "text-primary"}`}>
                                {result ? "Diagnostic Complete" : "Live Streaming…"}
                            </span>
                        </div>
                        <ResultsCharts data={metricsHistory} result={result} />
                    </section>
                )}

                {/* Grade Scale & Router Fixes Ledger */}
                <section aria-label="Grading scale and router fixes" className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-line">
                    <div className="space-y-4">
                        <h2 className="text-fluid-h2 font-bold text-ink">Understanding Your Grade (A–F)</h2>
                        <div className="bg-surface border border-line rounded-2xl divide-y divide-line overflow-hidden">
                            {[
                                { grade: "A", label: "Ideal (+0–5 ms)", desc: "Virtually zero queue delay. Competitive gaming and 4K calls remain steady during downloads." },
                                { grade: "B", label: "Good (+6–30 ms)", desc: "Minimal buffering impact. Smooth for daily calls and streaming." },
                                { grade: "C", label: "Fair (+31–60 ms)", desc: "Noticeable ping jumps when other devices download large files." },
                                { grade: "D", label: "Poor (+61–100 ms)", desc: "Games stutter and call quality drops under heavy usage." },
                                { grade: "F", label: "Critical (+100+ ms)", desc: "Severe router queue congestion whenever traffic peaks." },
                            ].map((item) => (
                                <div
                                    key={item.grade}
                                    className={`px-4 py-3.5 flex items-start gap-3.5 ${
                                        result?.grade === item.grade ? "bg-well/70" : ""
                                    }`}
                                >
                                    <span className={`size-8 rounded-lg border text-sm font-mono font-bold flex items-center justify-center flex-shrink-0 ${gradeBadgeClasses(item.grade)}`}>
                                        {item.grade}
                                    </span>
                                    <div>
                                        <div className="text-sm font-bold text-ink">{item.label}</div>
                                        <p className="text-xs text-muted mt-0.5 leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-fluid-h2 font-bold text-ink">How to Fix High Bufferbloat</h2>
                        <div className="bg-surface border border-line rounded-2xl divide-y divide-line overflow-hidden">
                            {[
                                { title: "1. Turn on Smart Queue Management (SQM / CAKE)", desc: "In your router admin settings, look for SQM, CAKE, or FQ-CoDel. It automatically stops downloads from blocking interactive packets." },
                                { title: "2. Set QoS Bandwidth Caps (~90% of speed)", desc: "If SQM isn't available, cap your upload and download limits slightly below your ISP maximum so your router paces traffic cleanly." },
                                { title: "3. Prefer Wired Ethernet Over Wi-Fi", desc: "A direct Cat6 Ethernet cable avoids wireless retries and shared channel jitter." },
                            ].map((tip) => (
                                <div key={tip.title} className="p-4 sm:p-5 space-y-1">
                                    <h3 className="text-sm font-bold text-ink">{tip.title}</h3>
                                    <p className="text-xs text-muted leading-relaxed">{tip.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Concise Educational Explainer */}
                <section className="bg-surface border border-line rounded-2xl p-6 sm:p-8 space-y-4">
                    <h2 className="text-fluid-h2 font-bold text-ink">Why Fast Connections Can Still Feel Sluggish</h2>
                    <p className="text-sm text-muted leading-relaxed max-w-3xl">
                        Paying for 500 Mbps or 1 Gbps gives you a wide highway, but traditional speed tests only check how wide the road is when empty. If a device uploads cloud photos or downloads updates at full throttle, bloated router memory queues trap tiny real-time voice and gaming packets behind bulky transfers.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-line text-xs">
                        <div>
                            <div className="font-bold text-ink mb-1">Bandwidth (Mbps)</div>
                            <p className="text-muted">Total volume moving per second—useful for large file downloads.</p>
                        </div>
                        <div>
                            <div className="font-bold text-ink mb-1">Idle Ping (ms)</div>
                            <p className="text-muted">Round-trip speed when the network is quiet.</p>
                        </div>
                        <div>
                            <div className="font-bold text-primary mb-1">Loaded Ping Delta (+ms)</div>
                            <p className="text-muted">How much delay climbs under traffic. Keeping this low prevents stutter.</p>
                        </div>
                    </div>
                </section>

                <DiagnosticFaqSection title="Bufferbloat Questions & Answers" items={BUFFERBLOAT_FAQS} />

                {/* Bottom Deep Teal Navigation Callout */}
                <section className="bg-brand text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1.5 max-w-xl">
                        <h2 className="text-xl font-bold text-white">Need browser, IP, or display info too?</h2>
                        <p className="text-xs text-white/80 leading-relaxed">
                            Inspect your entire device profile or run our WebRTC VPN leak audit on the main overview dashboard.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-foreground font-bold text-xs rounded-xl hover:bg-primary-dark transition-colors"
                        >
                            <span>Full Device Check</span>
                            <ArrowRight size={14} aria-hidden="true" />
                        </Link>
                        <Link
                            href="/what-is-my-ip"
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 text-white border border-white/20 font-semibold text-xs rounded-xl hover:bg-white/15 transition-colors"
                        >
                            <span>Check IP &amp; Leaks</span>
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
