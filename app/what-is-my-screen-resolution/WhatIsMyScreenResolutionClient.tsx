"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, ArrowRight } from "lucide-react";
import DiagnosticFaqSection, { type DiagnosticFaqItem } from "@/components/ui/DiagnosticFaqSection";

const RESPONSIVE_BREAKPOINTS = [
    { token: "XS (Mobile)", widthRange: "< 640 px", typicalDevice: "Portrait smartphones (360–430 CSS px)" },
    { token: "SM (Large Mobile)", widthRange: ">= 640 px", typicalDevice: "Landscape phones & compact windows" },
    { token: "MD (Tablet)", widthRange: ">= 768 px", typicalDevice: "Tablets in portrait mode" },
    { token: "LG (Laptop)", widthRange: ">= 1024 px", typicalDevice: "13\"–14\" laptops & landscape tablets" },
    { token: "XL (Desktop)", widthRange: ">= 1280 px", typicalDevice: "Full HD & scaled HiDPI screens" },
    { token: "2XL (Ultrawide / QHD)", widthRange: ">= 1536 px", typicalDevice: "QHD and 4K desktop displays" },
];

export default function WhatIsMyScreenResolutionClient({ faqs }: { faqs: DiagnosticFaqItem[] }) {
    const [mounted, setMounted] = useState(false);
    const [screenRes, setScreenRes] = useState({ width: 0, height: 0 });
    const [viewport, setViewport] = useState({ width: 0, height: 0 });
    const [dpr, setDpr] = useState<number | null>(null);
    const [colorDepth, setColorDepth] = useState<number | null>(null);
    const [orientation, setOrientation] = useState<string | null>(null);

    useEffect(() => {
        const updateMetrics = () => {
            if (typeof window === "undefined") return;
            setScreenRes({ width: window.screen.width, height: window.screen.height });
            setViewport({ width: window.innerWidth, height: window.innerHeight });
            setDpr(window.devicePixelRatio || 1);
            setColorDepth(window.screen.colorDepth || 24);
            setOrientation(
                window.screen.orientation?.type?.replace("-primary", "").replace("-secondary", "") || "landscape"
            );
            setMounted(true);
        };

        updateMetrics();
        window.addEventListener("resize", updateMetrics);
        return () => window.removeEventListener("resize", updateMetrics);
    }, []);

    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    let aspectLabel = "Detecting…";
    if (screenRes.width > 0 && screenRes.height > 0) {
        const divisor = gcd(screenRes.width, screenRes.height);
        let aspectX = screenRes.width / divisor;
        let aspectY = screenRes.height / divisor;
        if (aspectX === 8 && aspectY === 5) {
            aspectX = 16;
            aspectY = 10;
        }
        aspectLabel = `${aspectX}:${aspectY}`;
    }

    const getBreakpoint = (w: number) => {
        if (w <= 0) return "Detecting…";
        if (w >= 1536) return "2XL (Ultrawide)";
        if (w >= 1280) return "XL (Desktop)";
        if (w >= 1024) return "LG (Laptop)";
        if (w >= 768) return "MD (Tablet)";
        if (w >= 640) return "SM (Large Phone)";
        return "XS (Mobile)";
    };

    const megapixelsLabel =
        screenRes.width > 0 && screenRes.height > 0
            ? `${((screenRes.width * screenRes.height) / 1000000).toFixed(1)} MP`
            : "—";

    const widthRatioPct =
        screenRes.width > 0 ? Math.min(100, Math.max(20, Math.round((viewport.width / screenRes.width) * 100))) : 75;
    const heightRatioPct =
        screenRes.height > 0 ? Math.min(100, Math.max(20, Math.round((viewport.height / screenRes.height) * 100))) : 70;

    return (
        <div className="bg-canvas text-ink pb-20">
            <div className="max-w-site mx-auto px-5 sm:px-6 pt-8 space-y-10">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-muted">
                    <Link href="/" className="hover:text-ink transition-colors">Overview</Link>
                    <ChevronRight size={14} aria-hidden="true" />
                    <span className="text-ink font-semibold" aria-current="page">What Is My Screen Resolution</span>
                </nav>

                <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary">
                        Live Display, Viewport &amp; DPR Inspector
                    </p>
                    <h1 className="text-fluid-hero font-extrabold text-ink tracking-tight leading-tight">
                        What Is My Screen Resolution?
                    </h1>
                    <p className="text-fluid-lead text-muted leading-relaxed max-w-2xl">
                        See your full monitor size alongside your live browser window dimensions—resize or zoom your browser to watch how websites adapt.
                    </p>
                </div>

                {/* Interactive Proportional Screen vs Browser Frame Visualizer */}
                <section className="bg-surface border border-line rounded-2xl shadow-subtle overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-12 border-b border-line">
                        {/* Numbers Side */}
                        <div className="md:col-span-7 divide-y divide-line">
                            <div className="p-6 space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-muted">Full Monitor Area (Screen Resolution)</span>
                                    <span className="font-mono font-semibold text-ink">{aspectLabel}</span>
                                </div>
                                <div className="text-3xl sm:text-4xl font-mono font-extrabold text-ink tabular-nums">
                                    {screenRes.width > 0 ? `${screenRes.width} × ${screenRes.height}` : "Measuring…"}
                                </div>
                                <p className="text-xs text-muted">
                                    Logical display area reported by your operating system.
                                </p>
                            </div>

                            <div className="p-6 space-y-1.5 bg-well/25">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-muted">Active Browser Window (CSS Viewport)</span>
                                    <span className="px-2 py-0.5 rounded bg-secondary/10 border border-secondary/25 text-secondary font-mono font-semibold">
                                        {getBreakpoint(viewport.width)}
                                    </span>
                                </div>
                                <div className="text-3xl sm:text-4xl font-mono font-extrabold text-ink tabular-nums" aria-live="polite">
                                    {viewport.width > 0 ? `${viewport.width} × ${viewport.height}` : "Measuring…"}
                                </div>
                                <p className="text-xs text-muted">
                                    Actual page canvas inside your browser chrome. Press Ctrl +/- to watch zoom scaling update live.
                                </p>
                            </div>
                        </div>

                        {/* Live Visual Frame Preview */}
                        <div className="md:col-span-5 p-6 bg-well/40 border-t md:border-t-0 md:border-l border-line flex flex-col justify-between gap-3">
                            <span className="text-xs font-bold text-ink">Screen vs. Window Ratio</span>
                            <div className="relative w-full aspect-[16/10] bg-brand rounded-xl border border-white/15 p-2 flex items-start justify-start">
                                <div
                                    className="bg-primary/25 border-2 border-primary rounded-md flex items-center justify-center p-2 transition-all duration-150"
                                    style={{ width: `${widthRatioPct}%`, height: `${heightRatioPct}%` }}
                                >
                                    <span className="text-2xs font-mono font-bold text-white text-center leading-tight">
                                        Browser<br />{widthRatioPct}% × {heightRatioPct}%
                                    </span>
                                </div>
                            </div>
                            <p className="text-2xs text-muted">
                                Dark teal frame = whole monitor &middot; Coral box = active browser viewport
                            </p>
                        </div>
                    </div>

                    {/* Secondary Technical Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-line">
                        <div className="p-4 sm:p-5 space-y-1">
                            <span className="text-xs text-muted font-medium block">Pixel Ratio (DPR)</span>
                            <span className="font-mono font-bold text-base text-ink">{mounted && dpr !== null ? `${dpr}x` : "—"}</span>
                            <span className="text-2xs text-muted block">{mounted && dpr && dpr > 1 ? "HiDPI / Retina" : "Standard 1:1"}</span>
                        </div>
                        <div className="p-4 sm:p-5 space-y-1">
                            <span className="text-xs text-muted font-medium block">Color Depth</span>
                            <span className="font-mono font-bold text-base text-ink">{mounted && colorDepth !== null ? `${colorDepth}-bit` : "—"}</span>
                            <span className="text-2xs text-muted block">{mounted && colorDepth && colorDepth >= 24 ? "True Color" : "Standard"}</span>
                        </div>
                        <div className="p-4 sm:p-5 space-y-1">
                            <span className="text-xs text-muted font-medium block">Orientation</span>
                            <span className="font-bold text-base text-ink capitalize">{mounted && orientation ? orientation : "—"}</span>
                            <span className="text-2xs text-muted block">Screen orientation</span>
                        </div>
                        <div className="p-4 sm:p-5 space-y-1">
                            <span className="text-xs text-muted font-medium block">Scaled Area</span>
                            <span className="font-mono font-bold text-base text-ink">{megapixelsLabel}</span>
                            <span className="text-2xs text-muted block">Logical canvas</span>
                        </div>
                    </div>
                </section>

                {/* Formula Explainer */}
                <section className="bg-surface border border-line rounded-2xl p-6 sm:p-8 space-y-4">
                    <h2 className="text-fluid-h2 font-bold text-ink">Why 4K Monitors Often Report 1920 × 1080 in Browsers</h2>
                    <p className="text-sm text-muted leading-relaxed">
                        High-resolution laptops and phones scale interfaces so text stays easy to read. Browsers divide raw hardware pixels by your OS scale factor (Device Pixel Ratio):
                    </p>
                    <div className="p-4 rounded-xl bg-brand text-accent font-mono text-xs sm:text-sm">
                        Browser CSS Pixels = Physical Monitor Pixels &divide; Device Pixel Ratio (DPR)
                    </div>
                </section>

                {/* Responsive Breakpoint Reference Table */}
                <section className="space-y-4">
                    <h2 className="text-fluid-h2 font-bold text-ink">Responsive CSS Breakpoints Reference</h2>
                    <div className="overflow-x-auto bg-surface border border-line rounded-2xl">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-brand text-white">
                                    <th className="p-3.5 font-semibold">Breakpoint</th>
                                    <th className="p-3.5 font-semibold">CSS Viewport Width</th>
                                    <th className="p-3.5 font-semibold">Typical Device</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {RESPONSIVE_BREAKPOINTS.map((bp) => (
                                    <tr key={bp.token} className="hover:bg-hover/65 transition-colors">
                                        <td className="p-3.5 font-bold text-ink whitespace-nowrap">{bp.token}</td>
                                        <td className="p-3.5 font-mono font-bold text-secondary whitespace-nowrap">{bp.widthRange}</td>
                                        <td className="p-3.5 text-muted">{bp.typicalDevice}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <DiagnosticFaqSection items={faqs} />

                <section className="pt-6 border-t border-line">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-muted mb-4">Related Diagnostic Tools</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { href: "/what-is-my-browser", title: "What Is My Browser", desc: "Inspect engine version & UA" },
                            { href: "/what-is-my-ip", title: "What Is My IP", desc: "Check IPv4, IPv6 & WebRTC" },
                            { href: "/bufferbloat", title: "Bufferbloat Test", desc: "Measure loaded latency" },
                        ].map((item) => (
                            <Link key={item.href} href={item.href} className="group p-4 rounded-xl bg-surface border border-line hover:border-line-strong transition-colors flex items-center justify-between gap-2">
                                <div>
                                    <div className="font-bold text-sm text-ink group-hover:text-primary transition-colors">{item.title}</div>
                                    <p className="text-xs text-muted mt-0.5">{item.desc}</p>
                                </div>
                                <ArrowRight size={15} className="text-muted group-hover:text-primary transition-colors flex-shrink-0" aria-hidden="true" />
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
