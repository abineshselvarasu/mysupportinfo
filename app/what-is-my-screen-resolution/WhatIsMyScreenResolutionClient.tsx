"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
    Monitor, RefreshCw, Globe, Wifi
} from "lucide-react";

export default function WhatIsMyScreenResolutionClient() {
    const [screenRes, setScreenRes] = useState({ width: 0, height: 0 });
    const [viewport, setViewport] = useState({ width: 0, height: 0 });
    const [dpr, setDpr] = useState(1);
    const [colorDepth, setColorDepth] = useState(24);
    const [orientation, setOrientation] = useState("landscape");
    const [openFaq, setOpenFaq] = useState<number | null>(null);

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
        };

        updateMetrics();
        window.addEventListener("resize", updateMetrics);
        return () => window.removeEventListener("resize", updateMetrics);
    }, []);

    // Calculate aspect ratio string
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = screenRes.width > 0 && screenRes.height > 0 ? gcd(screenRes.width, screenRes.height) : 1;
    let aspectX = screenRes.width / divisor;
    let aspectY = screenRes.height / divisor;
    if (aspectX === 8 && aspectY === 5) { aspectX = 16; aspectY = 10; }

    // CSS Breakpoint indicator
    const getBreakpoint = (w: number) => {
        if (w >= 1536) return "2XL (Desktop Extra Large)";
        if (w >= 1280) return "XL (Standard Desktop)";
        if (w >= 1024) return "LG (Laptop / Tablet Landscape)";
        if (w >= 768)  return "MD (Tablet Portrait)";
        if (w >= 640)  return "SM (Large Smartphone)";
        return "XS (Compact Mobile)";
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans pb-24">
            {/* Breadcrumb Navigation */}
            <div className="max-w-site mx-auto px-6 pt-6">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-3xs font-extrabold uppercase tracking-widest text-background-dark/50">
                    <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                    <span>/</span>
                    <span className="text-primary font-bold">What Is My Screen Resolution</span>
                </nav>
            </div>

            {/* Hero Header */}
            <div className="text-center px-6 pt-8 pb-10 max-w-3xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-3xs font-extrabold uppercase tracking-wider mb-4">
                    <Monitor size={13} />
                    <span>Live Display &amp; Viewport Metrics</span>
                </div>
                <h1 className="font-serif text-fluid-h1 font-bold text-background-dark leading-tight mb-4">
                    What Is My Screen Resolution?
                </h1>
                <p className="text-fluid-lead text-background-dark/70 font-medium leading-relaxed">
                    Instantly measure your monitor hardware resolution, live browser viewport size, device pixel ratio (DPR), and display aspect ratio.
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
                                    Physical Hardware Resolution
                                </span>
                                <div className="text-3xl sm:text-5xl font-mono font-bold text-white mb-2">
                                    {screenRes.width > 0 ? `${screenRes.width} × ${screenRes.height}` : "Measuring…"}
                                </div>
                                <p className="text-xs text-accent/80 leading-relaxed font-medium">
                                    Total pixel grid supported by your monitor display hardware.
                                </p>
                            </div>
                            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-2xs font-mono">
                                <span className="text-accent/60">Aspect Ratio</span>
                                <span className="font-bold text-primary">{aspectX}:{aspectY}</span>
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
                            <span className="font-bold text-base text-background-dark font-mono">{dpr}x</span>
                            <span className="text-5xs text-background-dark/50 block mt-0.5">
                                {dpr > 1 ? "HiDPI / Retina Display" : "Standard 1:1 Scale"}
                            </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-background-dark/5 border border-background-dark/10">
                            <span className="text-4xs uppercase tracking-wider font-bold text-background-dark/60 block mb-1">
                                Color Depth
                            </span>
                            <span className="font-bold text-base text-background-dark font-mono">{colorDepth}-bit</span>
                            <span className="text-5xs text-background-dark/50 block mt-0.5">
                                {colorDepth >= 24 ? "True Color (16.7M colors)" : "Standard Depth"}
                            </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-background-dark/5 border border-background-dark/10">
                            <span className="text-4xs uppercase tracking-wider font-bold text-background-dark/60 block mb-1">
                                Screen Orientation
                            </span>
                            <span className="font-bold text-base text-background-dark capitalize">{orientation}</span>
                            <span className="text-5xs text-background-dark/50 block mt-0.5">Screen Orientation API</span>
                        </div>

                        <div className="p-4 rounded-2xl bg-background-dark/5 border border-background-dark/10">
                            <span className="text-4xs uppercase tracking-wider font-bold text-background-dark/60 block mb-1">
                                Total Physical Pixels
                            </span>
                            <span className="font-bold text-base text-background-dark font-mono">
                                {((screenRes.width * screenRes.height) / 1000000).toFixed(1)} MP
                            </span>
                            <span className="text-5xs text-background-dark/50 block mt-0.5">Megapixels</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Editorial Content Section */}
            <div className="max-w-4xl mx-auto px-6 space-y-12">
                {/* Hardware vs CSS pixels */}
                <section className="bg-white border-2 border-background-dark rounded-3xl p-8 shadow-block-sm space-y-4">
                    <h2 className="font-serif text-fluid-h2 font-bold text-background-dark">
                        Hardware Screen Resolution vs. CSS Viewport
                    </h2>
                    <p className="text-fluid-body text-background-dark/80 leading-relaxed font-medium">
                        One of the most frequent points of confusion for web developers and users alike is why a 4K monitor (3840×2160) or high-end smartphone reports a viewport width of only 1920px or 412px in web browsers.
                    </p>
                    <p className="text-fluid-body text-background-dark/80 leading-relaxed font-medium">
                        The explanation lies in <strong>Device Pixel Ratio (DPR)</strong>. Modern operating systems apply display scaling (typically 125%, 150%, or 200%) so user interface elements, text fonts, and buttons remain legible on high-density displays rather than appearing microscopically small. CSS pixels are logical units calculated by dividing physical pixels by the DPR.
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
                                Most widely adopted desktop monitor resolution worldwide.
                            </p>
                        </div>
                        <div className="p-5 rounded-2xl bg-white border-2 border-background-dark shadow-block-sm">
                            <div className="text-lg font-mono font-bold text-background-dark">2560 × 1440</div>
                            <span className="text-3xs font-extrabold text-secondary uppercase">2K QHD (1440p)</span>
                            <p className="text-3xs text-background-dark/70 mt-1.5 font-medium leading-relaxed">
                                Premier choice for desktop productivity, gaming, and creative work.
                            </p>
                        </div>
                        <div className="p-5 rounded-2xl bg-white border-2 border-background-dark shadow-block-sm">
                            <div className="text-lg font-mono font-bold text-background-dark">3840 × 2160</div>
                            <span className="text-3xs font-extrabold text-background-dark uppercase">4K Ultra HD</span>
                            <p className="text-3xs text-background-dark/70 mt-1.5 font-medium leading-relaxed">
                                Ultra-dense 8.3 Megapixel display, commonly scaled at 150% or 200%.
                            </p>
                        </div>
                        <div className="p-5 rounded-2xl bg-white border-2 border-background-dark shadow-block-sm">
                            <div className="text-lg font-mono font-bold text-background-dark">390 × 844</div>
                            <span className="text-3xs font-extrabold text-primary uppercase">Mobile Viewport</span>
                            <p className="text-3xs text-background-dark/70 mt-1.5 font-medium leading-relaxed">
                                Standard logical viewport for iPhone 13, 14, and modern mobile viewports.
                            </p>
                        </div>
                    </div>
                </section>

                {/* FAQ Accordion */}
                <section className="space-y-4">
                    <h2 className="font-serif text-fluid-h2 font-bold text-background-dark">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-3">
                        {[
                            {
                                q: "How do I change my screen resolution on Windows?",
                                a: "Right-click on your desktop, select 'Display settings', navigate to the 'Display resolution' dropdown under 'Scale & layout', and pick your monitor's recommended native resolution."
                            },
                            {
                                q: "How do I change display resolution on a Mac?",
                                a: "Open Apple Menu > System Settings > Displays. Choose your preferred scaling option or select 'More Space' / 'Default'."
                            },
                            {
                                q: "Why does browser zoom change my viewport width?",
                                a: "When you zoom in with Ctrl + (Cmd + on Mac), the browser increases CSS pixel size, which decreases the available CSS viewport width. This allows responsive layouts to switch to tablet or mobile modes automatically."
                            }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-white border-2 border-background-dark rounded-2xl overflow-hidden shadow-block-sm">
                                <button
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                    className="w-full p-5 text-left flex justify-between items-center gap-4 hover:bg-background/20 transition-colors cursor-pointer"
                                >
                                    <span className="font-bold text-background-dark text-base">{item.q}</span>
                                    <span className={`material-symbols-outlined text-background-dark/60 transition-transform duration-200 ${openFaq === idx ? "rotate-180 text-primary" : ""}`}>
                                        expand_more
                                    </span>
                                </button>
                                {openFaq === idx && (
                                    <div className="px-5 pb-5 pt-1 text-sm text-background-dark/75 leading-relaxed font-medium border-t border-background-dark/10">
                                        {item.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Related Diagnostics Hub */}
                <section className="pt-8 border-t-2 border-background-dark/10">
                    <h3 className="text-3xs font-extrabold uppercase tracking-widest text-primary mb-4">Explore More Diagnostics</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Link href="/what-is-my-browser" className="p-5 rounded-2xl bg-white border-2 border-background-dark shadow-block-sm hover:translate-x-px hover:translate-y-px transition-all">
                            <Globe size={18} className="text-primary mb-2" />
                            <div className="font-bold text-sm text-background-dark">What Is My Browser</div>
                            <p className="text-3xs text-background-dark/60 mt-1">Check browser engine &amp; UA</p>
                        </Link>
                        <Link href="/what-is-my-ip" className="p-5 rounded-2xl bg-white border-2 border-background-dark shadow-block-sm hover:translate-x-px hover:translate-y-px transition-all">
                            <Wifi size={18} className="text-secondary mb-2" />
                            <div className="font-bold text-sm text-background-dark">What Is My IP</div>
                            <p className="text-3xs text-background-dark/60 mt-1">Check public IPv4, IPv6 &amp; ISP</p>
                        </Link>
                        <Link href="/bufferbloat" className="p-5 rounded-2xl bg-white border-2 border-background-dark shadow-block-sm hover:translate-x-px hover:translate-y-px transition-all">
                            <RefreshCw size={18} className="text-background-dark mb-2" />
                            <div className="font-bold text-sm text-background-dark">Bufferbloat Test</div>
                            <p className="text-3xs text-background-dark/60 mt-1">Test network latency under load</p>
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
