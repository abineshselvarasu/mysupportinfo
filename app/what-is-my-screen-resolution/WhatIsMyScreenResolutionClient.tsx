"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
    RefreshCw, Globe, Wifi
} from "lucide-react";
import DiagnosticFaqSection, { type DiagnosticFaqItem } from "@/components/ui/DiagnosticFaqSection";

const RESPONSIVE_BREAKPOINTS = [
    { token: "XS (Mobile)", widthRange: "< 640 px", typicalDevice: "Portrait smartphones (360–430 CSS px)" },
    { token: "SM (Large Mobile)", widthRange: ">= 640 px", typicalDevice: "Landscape phones and small phablets" },
    { token: "MD (Tablet)", widthRange: ">= 768 px", typicalDevice: "iPad / Android tablets in portrait mode" },
    { token: "LG (Laptop)", widthRange: ">= 1024 px", typicalDevice: "13\"–14\" laptops and landscape tablets" },
    { token: "XL (Desktop)", widthRange: ">= 1280 px", typicalDevice: "1080p Full HD & scaled MacBook Retina screens" },
    { token: "2XL (Ultrawide / QHD)", widthRange: ">= 1536 px", typicalDevice: "2560×1440 QHD and 4K desktop displays" },
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
            setScreenRes({
                width: window.screen.width,
                height: window.screen.height,
            });
            setViewport({
                width: window.innerWidth,
                height: window.innerHeight,
            });
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

    // Calculate aspect ratio string safely only after measurement
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

    // CSS Breakpoint indicator
    const getBreakpoint = (w: number) => {
        if (w <= 0) return "Detecting…";
        if (w >= 1536) return "2XL (Desktop Extra Large)";
        if (w >= 1280) return "XL (Standard Desktop)";
        if (w >= 1024) return "LG (Laptop / Tablet Landscape)";
        if (w >= 768)  return "MD (Tablet Portrait)";
        if (w >= 640)  return "SM (Large Smartphone)";
        return "XS (Compact Mobile)";
    };

    const megapixelsLabel =
        screenRes.width > 0 && screenRes.height > 0
            ? `${((screenRes.width * screenRes.height) / 1000000).toFixed(1)} MP`
            : "—";

    return (
        <div className="min-h-screen bg-background text-foreground font-sans pb-24">
            {/* Breadcrumb Navigation */}
            <div className="max-w-site mx-auto px-6 pt-6">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-3xs font-extrabold uppercase tracking-widest text-background-dark/50">
                    <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                    <span>/</span>
                    <span className="text-primary font-bold" aria-current="page">What Is My Screen Resolution</span>
                </nav>
            </div>

            {/* Hero Header */}
            <div className="text-center px-6 pt-8 pb-10 max-w-3xl mx-auto">
                <p className="text-xs font-black uppercase tracking-widest text-primary mb-3">
                    Live Display, Viewport &amp; DPR Diagnostics
                </p>
                <h1 className="font-serif text-fluid-h1 font-bold text-background-dark leading-tight mb-4">
                    What Is My Screen Resolution?
                </h1>
                <p className="text-fluid-lead text-background-dark/70 font-medium leading-relaxed">
                    Instantly measure your display screen resolution, active CSS browser viewport size, device pixel ratio (DPR), responsive breakpoint, and aspect ratio live as you resize or zoom.
                </p>
            </div>

            {/* Main Interactive Diagnostic Display Card */}
            <div className="max-w-4xl mx-auto px-6 mb-16">
                <div className="bg-white border-2 border-background-dark rounded-3xl p-6 sm:p-10 shadow-block">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b-2 border-background-dark/10">
                        {/* Hardware Resolution */}
                        <div className="p-6 rounded-3xl bg-background-dark text-white border-2 border-background-dark flex flex-col justify-between">
                            <div>
                                <span className="text-4xs font-bold uppercase tracking-ui-widest text-accent/70 block mb-2">
                                    Logical Screen Resolution
                                </span>
                                <div className="text-3xl sm:text-5xl font-mono font-bold text-white mb-2">
                                    {screenRes.width > 0 ? `${screenRes.width} × ${screenRes.height}` : "Measuring…"}
                                </div>
                                <p className="text-xs text-accent/80 leading-relaxed font-medium">
                                    Monitor dimensions exposed via <code>window.screen</code> (multiply by DPR for raw physical hardware pixels).
                                </p>
                            </div>
                            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-2xs font-mono">
                                <span className="text-accent/60">Aspect Ratio</span>
                                <span className="font-bold text-primary">{aspectLabel}</span>
                            </div>
                        </div>

                        {/* Viewport Size */}
                        <div className="p-6 rounded-3xl bg-primary/15 border-2 border-background-dark flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-4xs font-bold uppercase tracking-ui-widest text-background-dark/70">
                                        Browser Viewport (CSS Pixels)
                                    </span>
                                    <span className="text-5xs font-black uppercase tracking-wider bg-secondary text-white px-2 py-0.5 rounded-full">
                                        Live On Zoom
                                    </span>
                                </div>
                                <div className="text-3xl sm:text-5xl font-mono font-bold text-background-dark mb-2" aria-live="polite">
                                    {viewport.width > 0 ? `${viewport.width} × ${viewport.height}` : "Measuring…"}
                                </div>
                                <p className="text-xs text-background-dark/75 leading-relaxed font-medium">
                                    Actual web page rendering canvas. Resize your browser window or press Ctrl +/- to observe live scaling.
                                </p>
                            </div>
                            <div className="mt-6 pt-4 border-t border-background-dark/10 flex items-center justify-between text-2xs font-mono">
                                <span className="text-background-dark/60">CSS Breakpoint</span>
                                <span className="font-bold text-background-dark">{getBreakpoint(viewport.width)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
                        <div className="p-4 rounded-2xl bg-background-dark/5 border border-background-dark/10">
                            <span className="text-4xs uppercase tracking-wider font-bold text-background-dark/60 block mb-1">
                                Device Pixel Ratio (DPR)
                            </span>
                            <span className="font-bold text-base text-background-dark font-mono">
                                {mounted && dpr !== null ? `${dpr}x` : "—"}
                            </span>
                            <span className="text-5xs text-background-dark/50 block mt-0.5">
                                {mounted && dpr !== null ? (dpr > 1 ? "HiDPI / Retina Scaling" : "Standard 1:1 Scale") : "Display Density"}
                            </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-background-dark/5 border border-background-dark/10">
                            <span className="text-4xs uppercase tracking-wider font-bold text-background-dark/60 block mb-1">
                                Color Depth
                            </span>
                            <span className="font-bold text-base text-background-dark font-mono">
                                {mounted && colorDepth !== null ? `${colorDepth}-bit` : "—"}
                            </span>
                            <span className="text-5xs text-background-dark/50 block mt-0.5">
                                {mounted && colorDepth !== null ? (colorDepth >= 24 ? "True Color (16.7M+ colors)" : "Standard Color") : "Screen Color Range"}
                            </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-background-dark/5 border border-background-dark/10">
                            <span className="text-4xs uppercase tracking-wider font-bold text-background-dark/60 block mb-1">
                                Screen Orientation
                            </span>
                            <span className="font-bold text-base text-background-dark capitalize">
                                {mounted && orientation ? orientation : "—"}
                            </span>
                            <span className="text-5xs text-background-dark/50 block mt-0.5">Screen Orientation API</span>
                        </div>

                        <div className="p-4 rounded-2xl bg-background-dark/5 border border-background-dark/10">
                            <span className="text-4xs uppercase tracking-wider font-bold text-background-dark/60 block mb-1">
                                Logical Pixel Area
                            </span>
                            <span className="font-bold text-base text-background-dark font-mono">
                                {megapixelsLabel}
                            </span>
                            <span className="text-5xs text-background-dark/50 block mt-0.5">Scaled Canvas Size</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Editorial Content Section */}
            <div className="max-w-4xl mx-auto px-6 space-y-12">
                {/* Hardware vs CSS pixels */}
                <section className="bg-white border-2 border-background-dark rounded-3xl p-8 shadow-block-sm space-y-4">
                    <h2 className="font-serif text-fluid-h2 font-bold text-background-dark">
                        Hardware Screen Resolution vs. CSS Viewport &amp; DPR Formula
                    </h2>
                    <p className="text-fluid-body text-background-dark/80 leading-relaxed font-medium">
                        Developers and support engineers frequently ask why a 4K display (3840×2160) or modern flagship phone reports a smaller width like 1920px or 390px in browsers. The reason is OS display scaling via <strong>Device Pixel Ratio (DPR)</strong>:
                    </p>
                    <div className="p-4 rounded-2xl bg-background-dark text-accent font-mono text-xs sm:text-sm border-2 border-background-dark">
                        Logical CSS Pixels = Physical Panel Pixels &divide; Device Pixel Ratio (DPR)
                    </div>
                    <p className="text-fluid-body text-background-dark/80 leading-relaxed font-medium">
                        For example, a 3840×2160 monitor set to 200% Windows scaling or macOS HiDPI mode reports a <code>1920×1080</code> logical CSS viewport at <code>DPR = 2x</code>. This ensures typography, icons, and web interfaces remain comfortable to read while using 4 physical hardware sub-pixels to render every crisp edge.
                    </p>
                </section>

                {/* Common Resolutions Guide */}
                <section className="space-y-6">
                    <h2 className="font-serif text-fluid-h2 font-bold text-background-dark">
                        Standard Display Resolutions in 2026
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-5 rounded-2xl bg-white border-2 border-background-dark shadow-block-sm">
                            <div className="text-lg font-mono font-bold text-background-dark">1920 × 1080</div>
                            <span className="text-3xs font-extrabold text-primary uppercase">Full HD (1080p)</span>
                            <p className="text-3xs text-background-dark/70 mt-1.5 font-medium leading-relaxed">
                                Most widely adopted desktop monitor resolution worldwide (16:9 ratio).
                            </p>
                        </div>
                        <div className="p-5 rounded-2xl bg-white border-2 border-background-dark shadow-block-sm">
                            <div className="text-lg font-mono font-bold text-background-dark">2560 × 1440</div>
                            <span className="text-3xs font-extrabold text-secondary uppercase">2K QHD (1440p)</span>
                            <p className="text-3xs text-background-dark/70 mt-1.5 font-medium leading-relaxed">
                                Standard high-sharpness tier for productivity, CAD, and PC gaming monitors.
                            </p>
                        </div>
                        <div className="p-5 rounded-2xl bg-white border-2 border-background-dark shadow-block-sm">
                            <div className="text-lg font-mono font-bold text-background-dark">3840 × 2160</div>
                            <span className="text-3xs font-extrabold text-background-dark uppercase">4K Ultra HD</span>
                            <p className="text-3xs text-background-dark/70 mt-1.5 font-medium leading-relaxed">
                                Ultra-dense 8.3 Megapixel display, typically viewed at 150% or 200% OS scaling.
                            </p>
                        </div>
                        <div className="p-5 rounded-2xl bg-white border-2 border-background-dark shadow-block-sm">
                            <div className="text-lg font-mono font-bold text-background-dark">390 × 844</div>
                            <span className="text-3xs font-extrabold text-primary uppercase">Mobile Viewport</span>
                            <p className="text-3xs text-background-dark/70 mt-1.5 font-medium leading-relaxed">
                                Benchmark CSS viewport width for modern smartphones at 3x DPR scaling.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Responsive Breakpoint Reference Table */}
                <section className="bg-white border-2 border-background-dark rounded-3xl p-8 shadow-block-sm space-y-4">
                    <h2 className="font-serif text-fluid-h2 font-bold text-background-dark">
                        Responsive CSS Breakpoints Reference for UI &amp; QA Teams
                    </h2>
                    <p className="text-sm text-background-dark/75 leading-relaxed font-medium">
                        When filing a layout bug report with your development team, knowing the exact CSS viewport width matters more than your monitor model. Most modern frameworks (Tailwind CSS, Bootstrap, Material) trigger layout shifts at these exact CSS pixel thresholds:
                    </p>
                    <div className="overflow-x-auto border-2 border-background-dark rounded-2xl">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-background-dark text-white uppercase tracking-wider text-4xs">
                                    <th className="p-3.5 font-extrabold">Breakpoint</th>
                                    <th className="p-3.5 font-extrabold">CSS Viewport Width</th>
                                    <th className="p-3.5 font-extrabold">Common Device Class</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-background-dark/10">
                                {RESPONSIVE_BREAKPOINTS.map((bp) => (
                                    <tr key={bp.token} className="hover:bg-background/30">
                                        <td className="p-3.5 font-bold text-background-dark whitespace-nowrap">{bp.token}</td>
                                        <td className="p-3.5 font-mono font-bold text-secondary whitespace-nowrap">{bp.widthRange}</td>
                                        <td className="p-3.5 text-background-dark/75 font-medium">{bp.typicalDevice}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* SSR-Complete Accessible FAQ Accordion */}
                <DiagnosticFaqSection items={faqs} />

                {/* Related Diagnostics Hub */}
                <section className="pt-8 border-t-2 border-background-dark/10">
                    <h3 className="text-3xs font-extrabold uppercase tracking-widest text-primary mb-4">Explore More Diagnostics</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Link href="/what-is-my-browser" className="p-5 rounded-2xl bg-white border-2 border-background-dark shadow-block-sm hover:translate-x-px hover:translate-y-px transition-all">
                            <Globe size={18} className="text-primary mb-2" aria-hidden="true" />
                            <div className="font-bold text-sm text-background-dark">What Is My Browser</div>
                            <p className="text-3xs text-background-dark/60 mt-1">Check browser engine &amp; UA</p>
                        </Link>
                        <Link href="/what-is-my-ip" className="p-5 rounded-2xl bg-white border-2 border-background-dark shadow-block-sm hover:translate-x-px hover:translate-y-px transition-all">
                            <Wifi size={18} className="text-secondary mb-2" aria-hidden="true" />
                            <div className="font-bold text-sm text-background-dark">What Is My IP</div>
                            <p className="text-3xs text-background-dark/60 mt-1">Check public IPv4, IPv6 &amp; ISP</p>
                        </Link>
                        <Link href="/bufferbloat" className="p-5 rounded-2xl bg-white border-2 border-background-dark shadow-block-sm hover:translate-x-px hover:translate-y-px transition-all">
                            <RefreshCw size={18} className="text-background-dark mb-2" aria-hidden="true" />
                            <div className="font-bold text-sm text-background-dark">Bufferbloat Test</div>
                            <p className="text-3xs text-background-dark/60 mt-1">Test network latency under load</p>
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
