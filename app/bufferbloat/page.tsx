"use client";

import React, { useState } from "react";
import FadeIn from "@/components/ui/FadeIn";
import { BufferbloatEngine, TestResult } from "@/lib/bufferbloat-engine";
import Link from "next/link";
import { ResultsCharts } from "@/components/bufferbloat/ResultsCharts";
import AskAI from "@/components/ui/AskAI";

export interface RunMetrics {
    progress: number;
    download: number;
    latency: number;
    jitter: number;
    upload: number;
}

function getPhaseLabel(progress: number): string {
    if (progress < 50) return "Measuring Download Bloat…";
    if (progress < 80) return "Measuring Upload Bloat…";
    return "Calculating Baseline Latency…";
}

function gradeColor(grade: string | undefined): string {
    if (grade === "A" || grade === "B") return "#009E52";
    if (grade === "C" || grade === "D") return "#FF8E60";
    if (grade === "F") return "#ef4444";
    return "rgba(0,73,62,0.5)";
}

function gradeBgClass(grade: string | undefined): string {
    if (grade === "A") return "bg-secondary shadow-glow-green";
    if (grade === "B") return "bg-secondary/80 shadow-glow-green-md";
    if (grade === "C") return "bg-primary shadow-glow-orange";
    if (grade === "D") return "bg-primary/80 shadow-glow-orange-md";
    if (grade === "F") return "bg-red-500 shadow-glow-red";
    return "bg-background-dark/10";
}

function gradeLabel(grade: string | undefined): string {
    if (grade === "A") return "No Bufferbloat (Excellent)";
    if (grade === "B") return "Minimal Bufferbloat (Good)";
    if (grade === "C") return "Moderate Bufferbloat (Fair)";
    if (grade === "D") return "Significant Bufferbloat (Poor)";
    if (grade === "F") return "Severe Bufferbloat (Critical)";
    return "Not Tested";
}

export default function BufferbloatPage() {
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<TestResult | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [runMetrics, setRunMetrics] = useState<RunMetrics | null>(null);
    const [metricsHistory, setMetricsHistory] = useState<RunMetrics[]>([]);
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    const startTest = async () => {
        setIsRunning(true);
        setProgress(0);
        setRunMetrics(null);
        setMetricsHistory([]);
        setResult(null);

        const engine = new BufferbloatEngine((data) => {
            setProgress(data.progress);
            setRunMetrics(data);
            setMetricsHistory(prev => [...prev, data]);
        });
        const data = await engine.runTest();
        setResult(data);
        setIsRunning(false);
    };

    const circumference = 816;
    const offset = circumference - (progress / 100) * circumference;

    const gaugeLabel = isRunning
        ? (runMetrics && runMetrics.progress < 50 ? "Download" : runMetrics && runMetrics.progress < 80 ? "Upload" : "Analysing")
        : result ? "Download" : "Ready";

    const hasData = metricsHistory.length > 0;

    const faqItems = [
        {
            q: "What exactly is bufferbloat?",
            a: "Bufferbloat is the unwanted latency and jitter that occurs when network equipment (such as home routers, cable modems, or Wi-Fi access points) buffers too many packets of data. Instead of transmitting packets immediately or dropping low-priority packets when the line is full, network hardware places incoming packets into huge memory buffers. This creates a virtual traffic jam: high-priority time-sensitive packets (like your gaming keystrokes or Discord voice chat) sit trapped in the queue behind bulk downloads."
        },
        {
            q: "Why do I lag even though I have 1 Gbps high-speed fiber internet?",
            a: "Bandwidth (speed in Mbps) and latency (ping in milliseconds) are fundamentally different. A gigabit connection is like an 8-lane superhighway, but if someone begins downloading a massive game file or uploading high-resolution video, your router will fill its internal queues to capacity. Without active queue management, packets get backed up regardless of pipe width, causing ping to surge from 10 ms to 300+ ms."
        },
        {
            q: "What is the difference between idle latency and loaded latency?",
            a: "Idle latency is your baseline ping to a test server when nobody else is using your internet connection. Loaded latency is your ping measured while downloading or uploading at 100% capacity. Bufferbloat is specifically the difference (the delta) between your loaded latency and your idle latency. If your idle ping is 15 ms and your loaded ping jumps to 120 ms, you have +105 ms of bufferbloat."
        },
        {
            q: "What is Smart Queue Management (SQM) and how does it fix bufferbloat?",
            a: "Smart Queue Management (SQM) is a router algorithm (most notably CAKE and FQ-CoDel) that proactively manages network queues. Instead of allowing packets to pile up in a single first-in-first-out line, SQM creates hundreds of tiny micro-queues, automatically isolating heavy traffic flows from lightweight, time-sensitive flows. It guarantees that voice calls, DNS queries, and gaming packets skip to the front of the line with near-zero latency penalty."
        },
        {
            q: "Does Wi-Fi make bufferbloat worse than a wired Ethernet cable?",
            a: "Yes. Wi-Fi operates as a shared, half-duplex medium with retransmission delays, interference, and access point buffer queues. Testing on Wi-Fi typically shows additional latency spikes compared to a wired Cat6 Ethernet connection. For the most accurate bufferbloat assessment, run this test once over Ethernet and once over Wi-Fi to isolate local wireless bloat from ISP modem bloat."
        },
        {
            q: "How can I fix bufferbloat if my router doesn't have SQM?",
            a: "If your stock ISP router lacks SQM, look for a Quality of Service (QoS) setting or bandwidth limiter. Set your router's maximum download and upload speed to 90%–95% of your plan's measured speed. This deliberate 5–10% reduction prevents your modem's bottleneck buffer from ever filling up, transferring queue management back to the router where packet pacing is much cleaner."
        }
    ];

    return (
        <div className="flex flex-col overflow-x-hidden text-foreground">
            <main className="max-w-site mx-auto px-6 py-12 w-full">

                {/* Breadcrumb Navigation */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-8">
                    <Link href="/" className="text-background-dark/60 text-sm font-semibold hover:text-background-dark transition-colors">Home</Link>
                    <span className="material-symbols-outlined text-sm text-background-dark/40">chevron_right</span>
                    <span className="text-background-dark text-sm font-extrabold" aria-current="page">Bufferbloat Test</span>
                </nav>

                {/* Hero Header */}
                <FadeIn>
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-background-dark text-xs font-black uppercase tracking-wider mb-4">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            Network Quality & Latency Diagnostic
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 text-background-dark font-serif">
                            Bufferbloat <span className="text-primary italic">Test</span>
                        </h1>
                        <p className="text-background-dark/70 max-w-3xl mx-auto text-base md:text-lg leading-relaxed font-medium">
                            Measure how your internet latency holds up under real download and upload loads. Detect hidden packet queuing lag that causes stuttering in gaming, dropped frames in Discord, and freezing video calls — even on ultra-fast gigabit connections.
                        </p>
                    </div>
                </FadeIn>

                {/* Main Interactive Test Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">

                    {/* Left Panel: Gauge & Real-time Metrics */}
                    <div className="lg:col-span-8 bg-white border-2 border-background-dark shadow-block rounded-2xl p-5 sm:p-8 md:p-12 flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-accent/5 pointer-events-none" />

                        {/* Circular Gauge */}
                        <div className="relative w-full max-w-xs aspect-square flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 288 288">
                                <circle className="text-background-dark/5" cx="144" cy="144" fill="transparent" r="130" stroke="currentColor" strokeWidth="14" />
                                <circle
                                    className="text-primary drop-shadow-orange transition-all duration-300 ease-out"
                                    cx="144" cy="144" fill="transparent" r="130"
                                    stroke="currentColor"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={offset}
                                    strokeLinecap="round"
                                    strokeWidth="14"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <span className="text-background-dark/60 text-xs font-bold uppercase tracking-widest mb-1">{gaugeLabel}</span>
                                <div className="text-5xl sm:text-6xl font-black text-background-dark tabular-nums">
                                    {result
                                        ? result.download
                                        : runMetrics
                                            ? runMetrics.download.toFixed(1)
                                            : <span className="text-background-dark/30">--</span>}
                                </div>
                                <span className="text-background-dark/60 text-lg font-semibold uppercase">Mbps</span>
                            </div>
                        </div>

                        {/* 3 Metric Cards */}
                        <div className="grid grid-cols-3 gap-4 sm:gap-8 md:gap-12 mt-8 sm:mt-12 w-full max-w-sm sm:max-w-lg">
                            <div className="text-center">
                                <span className="material-symbols-outlined text-secondary mb-2 text-3xl">network_ping</span>
                                <div className="text-2xl font-bold text-background-dark tabular-nums">
                                    {result
                                        ? <>{result.latency}<span className="text-sm font-semibold text-background-dark/50 ml-1">ms</span></>
                                        : runMetrics
                                            ? <>{runMetrics.latency}<span className="text-sm font-semibold text-background-dark/50 ml-1">ms</span></>
                                            : <span className="text-background-dark/30 text-xl">--</span>}
                                </div>
                                <div className="text-3xs text-background-dark/50 font-bold uppercase tracking-wider">
                                    {result ? "Bloat Increase" : "Latency"}
                                </div>
                            </div>
                            <div className="text-center border-x border-background-dark/10 px-4">
                                <span className="material-symbols-outlined text-secondary mb-2 text-3xl">waves</span>
                                <div className="text-2xl font-bold text-background-dark tabular-nums">
                                    {result
                                        ? <>{result.jitter}<span className="text-sm font-semibold text-background-dark/50 ml-1">ms</span></>
                                        : runMetrics
                                            ? <>{runMetrics.jitter}<span className="text-sm font-semibold text-background-dark/50 ml-1">ms</span></>
                                            : <span className="text-background-dark/30 text-xl">--</span>}
                                </div>
                                <div className="text-3xs text-background-dark/50 font-bold uppercase tracking-wider">Jitter</div>
                            </div>
                            <div className="text-center">
                                <span className="material-symbols-outlined text-secondary mb-2 text-3xl">upload</span>
                                <div className="text-2xl font-bold text-background-dark tabular-nums">
                                    {result
                                        ? <>{result.upload}<span className="text-sm font-semibold text-background-dark/50 ml-1">Mbps</span></>
                                        : runMetrics
                                            ? <>{runMetrics.upload.toFixed(1)}<span className="text-sm font-semibold text-background-dark/50 ml-1">Mbps</span></>
                                            : <span className="text-background-dark/30 text-xl">--</span>}
                                </div>
                                <div className="text-3xs text-background-dark/50 font-bold uppercase tracking-wider">Upload</div>
                            </div>
                        </div>

                        {/* Phase Progress Indicator */}
                        {isRunning && runMetrics && (
                            <div className="mt-6 flex items-center gap-2 text-background-dark/70 text-xs md:text-base font-semibold">
                                <span className="material-symbols-outlined text-xs md:text-base animate-spin text-primary">sync</span>
                                {getPhaseLabel(runMetrics.progress)}
                                <span className="text-primary font-black text-xs md:text-base">{runMetrics.progress}%</span>
                            </div>
                        )}

                        {/* Run Test Button */}
                        <button
                            onClick={startTest}
                            disabled={isRunning}
                            aria-label={isRunning ? "Testing connection for bufferbloat" : result ? "Re-run bufferbloat test" : "Start bufferbloat test"}
                            className="p-3 mt-6 sm:px-16 rounded-full bg-primary border-2 border-background-dark shadow-block-sm text-foreground font-black text-base sm:text-xl hover:scale-105 active:scale-95 hover:bg-primary-dark transition-all flex items-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
                        >
                            <span className="material-symbols-outlined">{isRunning ? "sync" : "play_arrow"}</span>
                            {isRunning ? "TESTING CONNECTION…" : result ? "RUN AGAIN" : "START BUFFERBLOAT TEST"}
                        </button>
                    </div>

                    {/* Right Panel: Grade Assessment Card */}
                    <div className="lg:col-span-4">
                        <div className="bg-accent/25 border-2 border-background-dark shadow-block rounded-2xl p-8 flex flex-col items-center text-center h-full relative overflow-hidden">

                            {/* Traffic Signal Lights Indicator */}
                            <div className="absolute top-0 right-0 p-4">
                                <div className="flex flex-col gap-2 p-1.5 bg-white/40 rounded-full border border-background-dark/10">
                                    <div className={`w-4 h-4 rounded-full transition-all ${result?.grade === "A" || result?.grade === "B" ? "bg-secondary ring-4 ring-offset-2 ring-offset-background shadow-glow-green-sm" : "bg-secondary/20"}`} />
                                    <div className={`w-4 h-4 rounded-full transition-all ${result?.grade === "C" || result?.grade === "D" ? "bg-primary ring-4 ring-offset-2 ring-offset-background shadow-glow-orange-sm" : "bg-primary/20"}`} />
                                    <div className={`w-4 h-4 rounded-full transition-all ${result?.grade === "F" ? "bg-red-500 ring-4 ring-offset-2 ring-offset-background shadow-glow-red-sm" : "bg-red-500/20"}`} />
                                </div>
                            </div>

                            <div className="text-xs font-black text-background-dark/70 uppercase tracking-ui mb-8">Network Quality Grade</div>

                            {/* Grade Visual Circle */}
                            <div className="relative mb-6">
                                <div
                                    className="absolute inset-0 blur-3xl rounded-full"
                                    style={{ backgroundColor: result?.grade ? `${gradeColor(result.grade)}33` : "rgba(255,196,183,0.1)" }}
                                />
                                <div
                                    className="relative w-36 h-36 rounded-full border-4 flex items-center justify-center"
                                    style={{ borderColor: result?.grade ? `${gradeColor(result.grade)}44` : "rgba(0,73,62,0.1)" }}
                                >
                                    <div className={`w-28 h-28 rounded-full flex items-center justify-center text-white text-7xl font-black shadow-lg ${gradeBgClass(result?.grade)}`}>
                                        {result?.grade || "?"}
                                    </div>
                                </div>
                            </div>

                            <h2 className="text-xl font-bold mb-3" style={{ color: gradeColor(result?.grade) }}>
                                {gradeLabel(result?.grade)}
                            </h2>

                            <p className="text-sm text-background-dark/80 leading-relaxed mb-6 font-medium">
                                {result
                                    ? `Latency rose by +${result.latency} ms under active load. ${result.latency <= 5 ? "Your router manages queues masterfully. Ideal for competitive esports." : result.latency <= 30 ? "Minor buffering spike, generally unnoticeable for typical usage." : "Noticeable queue lag detected. We recommend configuring SQM or QoS on your router."}`
                                    : "Run the diagnostic above to see how your connection handles congestion and latency spikes under heavy load."}
                            </p>

                            {/* Bloat Latency Bar */}
                            {result && (
                                <div className="w-full pt-6 border-t border-background-dark/10">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold uppercase text-background-dark/60">Bloat Increase</span>
                                        <span className="text-sm font-black" style={{ color: gradeColor(result.grade) }}>+{result.latency} ms</span>
                                    </div>
                                    <div className="h-2.5 w-full bg-background-dark/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full transition-all duration-700 rounded-full"
                                            style={{
                                                width: `${Math.min((result.latency / 120) * 100, 100)}%`,
                                                backgroundColor: gradeColor(result.grade),
                                            }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-4xs text-background-dark/30 font-bold mt-1">
                                        <span>0 ms (Perfect)</span>
                                        <span>60 ms</span>
                                        <span>120+ ms (High)</span>
                                    </div>
                                </div>
                            )}

                            {/* How It Works Explainer */}
                            {!result && !isRunning && (
                                <div className="w-full pt-6 border-t border-background-dark/10 space-y-3">
                                    <p className="text-4xs text-background-dark/50 uppercase tracking-ui font-black mb-4">Diagnostic Methodology</p>
                                    {[
                                        { icon: "download", label: "Phase 1", desc: "Saturates downstream to test download bloat" },
                                        { icon: "upload", label: "Phase 2", desc: "Saturates upstream where queue bloat is worst" },
                                        { icon: "analytics", label: "Phase 3", desc: "Calculates idle vs loaded latency delta" },
                                    ].map(item => (
                                        <div key={item.label} className="flex items-center gap-3 text-left">
                                            <span className="material-symbols-outlined text-primary text-base">{item.icon}</span>
                                            <div>
                                                <span className="text-3xs font-black text-background-dark/50 uppercase tracking-wider">{item.label} · </span>
                                                <span className="text-xs text-background-dark/70 font-medium">{item.desc}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Live Real-time Charts */}
                {hasData && (
                    <section aria-label="Real-time test charts" className="mb-14">
                        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-3 my-8">
                            <h2 className="text-xl font-extrabold text-background-dark flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">show_chart</span>
                                Live Bandwidth & Latency Graph
                            </h2>
                            {result && (
                                <span className="text-xs font-black text-secondary uppercase tracking-wider bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20">
                                    Diagnostic Complete
                                </span>
                            )}
                        </div>
                        <ResultsCharts data={metricsHistory} />
                    </section>
                )}

                {/* Grading Scale & Quick Fixes */}
                <section aria-label="Grading scale and quick fixes" className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-12 border-t border-background-dark/10 mb-16">

                    {/* Grading Scale */}
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                <span className="material-symbols-outlined">format_list_bulleted</span>
                            </div>
                            <h2 className="text-xl font-extrabold text-background-dark">Bufferbloat Grading Scale</h2>
                        </div>
                        <div className="space-y-2">
                            {[
                                { grade: "A", label: "Grade A (Ideal)",     range: "0–5 ms increase",    desc: "Zero to negligible bufferbloat. Flawless responsiveness in competitive gaming, Discord, and 4K streaming.",   bg: "bg-secondary",     color: "#009E52" },
                                { grade: "B", label: "Grade B (Good)",      range: "6–30 ms increase",   desc: "Minimal bufferbloat. Occasional tiny micro-stutters during heavy multi-device downloads, but very stable.",   bg: "bg-secondary/80",  color: "#009E52" },
                                { grade: "C", label: "Grade C (Fair)",      range: "31–60 ms increase",  desc: "Moderate bufferbloat. Noticeable lag spikes in games and occasional voice robotic distortion during downloads.", bg: "bg-primary",     color: "#FF8E60" },
                                { grade: "D", label: "Grade D (Poor)",      range: "61–100 ms increase", desc: "Significant bufferbloat. Game packets queue up, causing rubberbanding and severe video call freezing.",       bg: "bg-primary/80",  color: "#FF8E60" },
                                { grade: "F", label: "Grade F (Critical)",  range: "100+ ms increase",   desc: "Severe bufferbloat. Interactive apps become unusable whenever another device saturates the connection.",     bg: "bg-red-500",       color: "#ef4444" },
                            ].map((item) => (
                                <div
                                    key={item.grade}
                                    className={`flex items-center gap-4 p-4 rounded-xl transition-all border ${result?.grade === item.grade ? "bg-accent/30 border-background-dark/20 shadow-sm" : "border-transparent hover:bg-accent/10 hover:border-background-dark/10"}`}
                                >
                                    <div className={`size-11 rounded-lg ${item.bg} border-2 border-background-dark flex items-center justify-center font-black text-white text-xl flex-shrink-0`}>{item.grade}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap justify-between items-center gap-x-2">
                                            <span className="font-extrabold text-background-dark">{item.label}</span>
                                            <span className="text-xs font-extrabold uppercase" style={{ color: item.color }}>{item.range}</span>
                                        </div>
                                        <div className="text-xs text-background-dark/60 mt-0.5 font-semibold">{item.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* How to Fix Bufferbloat */}
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                                <span className="material-symbols-outlined">build_circle</span>
                            </div>
                            <h2 className="text-xl font-extrabold text-background-dark">How to Fix a Poor Bufferbloat Score</h2>
                        </div>
                        <p className="text-background-dark/70 leading-relaxed font-semibold text-sm">
                            Got a C, D, or F grade? Bufferbloat is almost always caused by router buffer misconfigurations rather than ISP line faults. You can resolve it with these proven methods:
                        </p>
                        <div className="space-y-4">
                            {[
                                { icon: "settings_suggest",         title: "Enable SQM with CAKE or FQ-CoDel", desc: "Look for 'Smart Queue Management' (SQM), 'CAKE', or 'fq_codel' in your router's advanced settings. SQM is the industry gold-standard algorithm that prevents queue build-up without sacrificing real bandwidth." },
                                { icon: "settings_input_component", title: "Set QoS Bandwidth Limits (85%–95%)", desc: "If SQM is unavailable, configure router Quality of Service (QoS) and set upload and download bandwidth caps to 90% of your maximum line rate. This ensures buffers fill up in the router rather than the ISP modem." },
                                { icon: "cable",                    title: "Use Wired Cat6 Ethernet Over Wi-Fi", desc: "Wi-Fi airtime contention adds another layer of buffer delay. Running a direct Ethernet cable removes wireless queue spikes and stabilizes baseline jitter dramatically." },
                                { icon: "router",                   title: "Upgrade to an SQM-Ready Router",    desc: "ISP-bundled combination modem-routers rarely have adequate CPU power or modern queue algorithms. Switching to a standalone router running OpenWrt, Asuswrt-Merlin, pfSense, or an eero mesh network fixes bufferbloat permanently." },
                            ].map((item) => (
                                <div key={item.title} className="p-4 rounded-xl bg-white border-2 border-background-dark shadow-block-sm hover:scale-101 transition-all">
                                    <div className="font-extrabold text-secondary mb-1 flex items-center gap-2 text-sm">
                                        <span className="material-symbols-outlined text-sm">{item.icon}</span>
                                        {item.title}
                                    </div>
                                    <p className="text-sm text-background-dark/70 font-medium leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── DEEP DIVE EDUCATIONAL CONTENT (High-Authority SEO) ─── */}
                <article className="border-t-2 border-background-dark/10 pt-16 space-y-16">

                    {/* Section 1: What is Bufferbloat? */}
                    <section>
                        <div className="inline-flex items-center gap-2 text-primary font-black uppercase text-3xs tracking-ui-wide mb-2">
                            <span className="material-symbols-outlined text-sm">info</span>
                            Understanding Network Congestion
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-background-dark mb-6 font-serif">
                            What is Bufferbloat? The Silent Killer of Fast Internet
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-background-dark/80 text-sm md:text-base leading-relaxed font-medium">
                            <div className="space-y-4">
                                <p>
                                    <strong>Bufferbloat</strong> is high packet latency and jitter that occurs when network equipment (such as your broadband modem, Wi-Fi router, or ISP gateway) buffers too much data during times of network saturation.
                                </p>
                                <p>
                                    When internet routers were first designed, memory was expensive and buffers were small. As RAM became dirt cheap, manufacturers added massive memory buffers to prevent packet loss during brief traffic spikes. While well-intentioned, these oversized buffers created a far worse problem: when you download a game on Steam, stream a 4K movie, or upload a video, packets sit waiting in huge buffers for hundreds of milliseconds instead of being sent immediately.
                                </p>
                            </div>
                            <div className="bg-white border-2 border-background-dark rounded-2xl p-6 shadow-block-sm space-y-4">
                                <h3 className="font-bold text-background-dark text-lg flex items-center gap-2">
                                    <span className="material-symbols-outlined text-secondary">alt_route</span>
                                    The Highway Traffic Analogy
                                </h3>
                                <p className="text-sm text-background-dark/75 leading-relaxed">
                                    Imagine a 4-lane highway that narrows to an exit ramp. Instead of letting cars merge smoothly, engineers build a giant 500-car holding parking lot before the ramp. Even if an emergency ambulance (your competitive gaming keystrokes or voice packet) needs to get through, it is forced to wait behind all 500 cars sitting in the holding lot.
                                </p>
                                <p className="text-sm font-semibold text-secondary">
                                    That holding lot is bufferbloat. It turns a temporary delay into a prolonged latency catastrophe.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Why High Bandwidth Doesn't Stop Bufferbloat */}
                    <section className="bg-accent/15 border-2 border-background-dark rounded-3xl p-8 md:p-12 shadow-block-sm">
                        <div className="max-w-3xl">
                            <h2 className="text-2xl md:text-3xl font-extrabold text-background-dark mb-4 font-serif">
                                Why 1 Gbps Fiber Can Still Suffer From Severe Lag
                            </h2>
                            <p className="text-background-dark/80 text-base leading-relaxed mb-6 font-medium">
                                Many internet users believe that paying for faster download speeds (such as 500 Mbps, 1 Gbps, or multi-gig plans) will eliminate lag. However, speed tests like Speedtest.net only measure <em>throughput under idle conditions</em>. They tell you how wide your pipe is, not how quickly individual time-sensitive packets travel when that pipe is full.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-background-dark/10">
                                <div>
                                    <div className="text-xl font-black text-background-dark mb-1">Bandwidth</div>
                                    <p className="text-xs text-background-dark/70 font-medium">The total volume of data your connection can carry per second (e.g. 500 Mbps). Great for fast downloads.</p>
                                </div>
                                <div>
                                    <div className="text-xl font-black text-background-dark mb-1">Idle Latency</div>
                                    <p className="text-xs text-background-dark/70 font-medium">The baseline round-trip time (RTT in ms) when zero other devices are transmitting data.</p>
                                </div>
                                <div>
                                    <div className="text-xl font-black text-primary mb-1">Loaded Latency</div>
                                    <p className="text-xs text-background-dark/70 font-medium">The round-trip delay when the connection is busy. If this spikes, you have bufferbloat.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 3: Impact on Real-Time Applications */}
                    <section>
                        <h2 className="text-3xl font-extrabold text-background-dark mb-8 font-serif">
                            How Bufferbloat Destroys Your Daily Internet Experience
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                            {/* Card 1: Gaming */}
                            <div className="bg-white border-2 border-background-dark rounded-2xl p-6 shadow-block-sm flex flex-col justify-between">
                                <div>
                                    <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                                        <span className="material-symbols-outlined text-2xl">sports_esports</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-background-dark mb-2">Competitive Gaming Lag</h3>
                                    <p className="text-sm text-background-dark/70 leading-relaxed font-medium">
                                        In games like <em>Counter-Strike 2, Valorant, Call of Duty, Fortnite, Rocket League</em>, and <em>Apex Legends</em>, game packets are only a few bytes. When someone starts an upload or stream on your network, your ping jumps from 20 ms to 200 ms, causing rubberbanding, ghost bullets, and desync.
                                    </p>
                                </div>
                                <div className="mt-4 pt-3 border-t border-background-dark/10 text-3xs font-extrabold uppercase text-primary">
                                    Impact: High Ping Spikes & Desync
                                </div>
                            </div>

                            {/* Card 2: Video Conferencing */}
                            <div className="bg-white border-2 border-background-dark rounded-2xl p-6 shadow-block-sm flex flex-col justify-between">
                                <div>
                                    <div className="size-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-4">
                                        <span className="material-symbols-outlined text-2xl">video_call</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-background-dark mb-2">Zoom & Teams Freezing</h3>
                                    <p className="text-sm text-background-dark/70 leading-relaxed font-medium">
                                        Remote workers frequently experience &ldquo;Your internet connection is unstable&rdquo; alerts on Zoom, Microsoft Teams, and Google Meet. Video feeds freeze, audio stutters, and calls drop unexpectedly while cloud backups sync in the background.
                                    </p>
                                </div>
                                <div className="mt-4 pt-3 border-t border-background-dark/10 text-3xs font-extrabold uppercase text-secondary">
                                    Impact: Video Freezes & Audio Cutouts
                                </div>
                            </div>

                            {/* Card 3: Voice Chat */}
                            <div className="bg-white border-2 border-background-dark rounded-2xl p-6 shadow-block-sm flex flex-col justify-between">
                                <div>
                                    <div className="size-12 rounded-xl bg-accent text-background-dark flex items-center justify-center mb-4">
                                        <span className="material-symbols-outlined text-2xl">mic</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-background-dark mb-2">Discord & VoIP Robotics</h3>
                                    <p className="text-sm text-background-dark/70 leading-relaxed font-medium">
                                        Voice over IP relies on constant packet pacing. When router buffers inflate, UDP packets arrive out of order or clump together (jitter). Your friends will report that your voice sounds metallic, robotic, or chops into silence mid-sentence.
                                    </p>
                                </div>
                                <div className="mt-4 pt-3 border-t border-background-dark/10 text-3xs font-extrabold uppercase text-background-dark">
                                    Impact: Jitter & &ldquo;Robot Voice&rdquo;
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 4: Deep Dive - How SQM & CAKE Fix It */}
                    <section className="bg-white border-2 border-background-dark rounded-3xl p-8 md:p-12 shadow-block">
                        <div className="max-w-4xl mx-auto">
                            <div className="inline-flex items-center gap-2 text-secondary font-black uppercase text-3xs tracking-ui-wide mb-2">
                                <span className="material-symbols-outlined text-sm">verified</span>
                                The Definitive Solution
                            </div>
                            <h2 className="text-3xl md:text-4xl font-extrabold text-background-dark mb-6 font-serif">
                                How Smart Queue Management (SQM) Eliminates Bufferbloat
                            </h2>
                            <div className="space-y-6 text-background-dark/80 text-sm md:text-base leading-relaxed font-medium">
                                <p>
                                    The definitive technical cure for bufferbloat was standardized by the Internet Engineering Task Force (IETF) and is called <strong>Smart Queue Management (SQM)</strong>. Modern SQM implementations use cutting-edge algorithms known as <strong>CAKE</strong> (Common Applications Kept Enhanced) and <strong>FQ-CoDel</strong> (FlowQueue Controlled Delay).
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                                    <div className="p-5 rounded-2xl bg-background border border-background-dark/15">
                                        <h3 className="font-bold text-background-dark mb-2 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary text-base">layers</span>
                                            1. Fair Queuing (FQ)
                                        </h3>
                                        <p className="text-xs text-background-dark/70 leading-relaxed font-normal">
                                            Instead of dumping all packets into one big FIFO (first-in-first-out) bucket, FQ divides traffic into hundreds of distinct sub-queues. A single large BitTorrent or Steam download cannot starve your gaming stream because each flow receives an equal turn.
                                        </p>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-background border border-background-dark/15">
                                        <h3 className="font-bold text-background-dark mb-2 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-secondary text-base">timer</span>
                                            2. Controlled Delay (CoDel)
                                        </h3>
                                        <p className="text-xs text-background-dark/70 leading-relaxed font-normal">
                                            CoDel monitors the <em>sojourn time</em> (how long packets wait in a queue). If packets wait longer than 5 ms, CoDel intentionally drops or marks (ECN) a tiny fraction of packets, forcing sending servers (TCP) to throttle back slightly before the buffer overflows.
                                        </p>
                                    </div>
                                </div>
                                <p>
                                    By running SQM on your router, your loaded latency typically stays within <strong>0 to 5 ms of your idle ping</strong>, regardless of whether 10 people in your household are downloading files or streaming video simultaneously.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Ask AI Section */}
                    <div className="bg-white border-2 border-background-dark p-6 sm:p-8 rounded-3xl shadow-block-sm">
                        <AskAI variant="light" />
                    </div>

                    {/* Section 5: Bufferbloat FAQ Accordion */}
                    <section>
                        <div className="text-center max-w-2xl mx-auto mb-10">
                            <h2 className="text-3xl font-extrabold text-background-dark font-serif mb-3">
                                Frequently Asked Questions About Bufferbloat
                            </h2>
                            <p className="text-sm text-background-dark/70 font-medium">
                                Answers to the most common questions about latency testing, router queue configurations, and diagnostic grading.
                            </p>
                        </div>
                        <div className="max-w-3xl mx-auto space-y-3">
                            {faqItems.map((item, index) => (
                                <div
                                    key={item.q}
                                    className="bg-white border-2 border-background-dark rounded-2xl overflow-hidden shadow-block-sm transition-all"
                                >
                                    <button
                                        onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                        className="w-full p-5 text-left flex justify-between items-center gap-4 hover:bg-background/20 transition-colors cursor-pointer"
                                        aria-expanded={openFaq === index}
                                    >
                                        <span className="font-extrabold text-background-dark text-base">{item.q}</span>
                                        <span className={`material-symbols-outlined transition-transform duration-300 ease-out text-background-dark/60 flex-shrink-0 ml-2 ${openFaq === index ? "rotate-180 text-primary" : ""}`}>
                                            expand_more
                                        </span>
                                    </button>
                                    <div
                                        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                                            openFaq === index ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                                        }`}
                                    >
                                        <div className="overflow-hidden">
                                            <div className={`px-5 pb-5 pt-1 text-sm text-background-dark/75 leading-relaxed font-medium border-t border-background-dark/10 transition-opacity duration-200 ${openFaq === index ? "opacity-100" : "opacity-0"}`}>
                                                {item.a}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Section 6: Cross-Link to System Diagnostics */}
                    <section className="bg-background-dark text-white rounded-3xl p-8 md:p-12 shadow-block flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                            <div className="text-xs font-black uppercase text-primary tracking-widest mb-2">All-in-One Support Diagnostic</div>
                            <h2 className="text-2xl md:text-3xl font-extrabold mb-3 font-serif">
                                Inspect Your Full Device & Browser Environment
                            </h2>
                            <p className="text-accent/80 text-sm max-w-xl leading-relaxed font-medium">
                                While network bufferbloat causes online lag, your browser version, GPU rendering engine, screen resolution, and WebRTC privacy settings also affect web application performance.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0">
                            <Link
                                href="/"
                                className="px-6 py-3.5 bg-primary text-background-dark rounded-xl font-bold text-sm hover:bg-primary-dark transition-all border-2 border-background-dark shadow-block-sm text-center"
                            >
                                Check Browser & Device Details
                            </Link>
                            <Link
                                href="/faq"
                                className="px-6 py-3.5 bg-white/10 text-white rounded-xl font-bold text-sm hover:bg-white/20 transition-all border border-white/20 text-center"
                            >
                                Read Full Knowledge Base
                            </Link>
                        </div>
                    </section>

                </article>

            </main>
        </div>
    );
}
