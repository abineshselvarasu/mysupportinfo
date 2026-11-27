"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
    Terminal, Copy, Check,
    RefreshCw, CheckCircle, Monitor, Wifi
} from "lucide-react";
import DiagnosticFaqSection, { type DiagnosticFaqItem } from "@/components/ui/DiagnosticFaqSection";

interface BrowserDetails {
    browserName: string;
    browserVersion: string;
    engine: string;
    osName: string;
    userAgent: string;
    cookiesEnabled: boolean;
    jsEnabled: boolean;
    language: string;
}

export default function WhatIsMyBrowserClient({ faqs }: { faqs: DiagnosticFaqItem[] }) {
    const [details, setDetails] = useState<BrowserDetails | null>(null);
    const [copiedUA, setCopiedUA] = useState(false);

    useEffect(() => {
        const ua = navigator.userAgent;
        let browserName = "Unknown Browser";
        let browserVersion = "";
        let engine = "Unknown Engine";

        if (ua.includes("Edg/") || ua.includes("Edge/")) {
            browserName = "Microsoft Edge";
            browserVersion = ua.match(/Edg\/(\d+(\.\d+)?)/)?.[1] || "";
            engine = "Blink (Chromium)";
        } else if (ua.includes("SamsungBrowser/")) {
            browserName = "Samsung Internet";
            browserVersion = ua.match(/SamsungBrowser\/(\d+(\.\d+)?)/)?.[1] || "";
            engine = "Blink";
        } else if (ua.includes("OPR/") || ua.includes("OPT/")) {
            browserName = "Opera";
            browserVersion = ua.match(/OPR\/(\d+(\.\d+)?)/)?.[1] || "";
            engine = "Blink";
        } else if (ua.includes("Firefox/") || ua.includes("FxiOS/")) {
            browserName = "Mozilla Firefox";
            browserVersion = ua.match(/(?:Firefox|FxiOS)\/(\d+(\.\d+)?)/)?.[1] || "";
            engine = "Gecko";
        } else if (ua.includes("Chrome/") || ua.includes("CriOS/")) {
            browserName = "Google Chrome";
            browserVersion = ua.match(/(?:Chrome|CriOS)\/(\d+(\.\d+)?)/)?.[1] || "";
            engine = "Blink";
        } else if (ua.includes("Safari/")) {
            browserName = "Apple Safari";
            browserVersion = ua.match(/Version\/(\d+(\.\d+)?)/)?.[1] || "";
            engine = "WebKit";
        }

        let os = "Unknown OS";
        if (/Win/i.test(ua)) os = "Windows";
        else if (/Mac/i.test(ua)) os = navigator.maxTouchPoints > 1 ? "iPadOS" : "macOS";
        else if (/Android/i.test(ua)) os = "Android";
        else if (/iPhone|iPod/i.test(ua)) os = "iOS";
        else if (/Linux/i.test(ua)) os = "Linux";

        setDetails({
            browserName,
            browserVersion,
            engine,
            osName: os,
            userAgent: ua,
            cookiesEnabled: navigator.cookieEnabled,
            jsEnabled: true,
            language: navigator.language || "en",
        });
    }, []);

    const copyUA = async () => {
        if (!details) return;
        await navigator.clipboard.writeText(details.userAgent);
        setCopiedUA(true);
        setTimeout(() => setCopiedUA(false), 2000);
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans pb-24">
            {/* Breadcrumb Navigation */}
            <div className="max-w-site mx-auto px-6 pt-6">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-3xs font-extrabold uppercase tracking-widest text-background-dark/50">
                    <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                    <span>/</span>
                    <span className="text-primary font-bold" aria-current="page">What Is My Browser</span>
                </nav>
            </div>

            {/* Hero Header */}
            <div className="text-center px-6 pt-8 pb-10 max-w-3xl mx-auto">
                <p className="text-xs font-black uppercase tracking-widest text-primary mb-3">
                    Instant Client-Side Browser &amp; User-Agent Check
                </p>
                <h1 className="font-serif text-fluid-h1 font-bold text-background-dark leading-tight mb-4">
                    What Is My Browser?
                </h1>
                <p className="text-fluid-lead text-background-dark/70 font-medium leading-relaxed">
                    Check your exact web browser name, version, rendering engine, cookie status, and full User-Agent string locally in your browser with zero server tracking.
                </p>
            </div>

            {/* Main Interactive Diagnostic Card */}
            <div className="max-w-4xl mx-auto px-6 mb-16">
                <div className="bg-white border-2 border-background-dark rounded-3xl p-6 sm:p-10 shadow-block">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b-2 border-background-dark/10">
                        <div>
                            <span className="text-4xs font-bold uppercase tracking-ui-widest text-background-dark/60 block mb-1">
                                Detected Browser &amp; Version
                            </span>
                            <div className="text-3xl sm:text-5xl font-serif font-bold text-background-dark flex items-center gap-3">
                                <span>{details ? details.browserName : "Detecting…"}</span>
                                {details?.browserVersion && (
                                    <span className="text-xl sm:text-2xl font-mono px-3 py-1 bg-primary text-background-dark border-2 border-background-dark rounded-xl shadow-block-sm">
                                        v{details.browserVersion}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs sm:text-sm text-background-dark/70 mt-2 font-medium">
                                {details ? (
                                    <>
                                        Running on <span className="font-bold text-background-dark">{details.osName}</span> with{" "}
                                        <span className="font-bold text-background-dark">{details.engine}</span> rendering engine.
                                    </>
                                ) : (
                                    <span>Detecting operating system and browser rendering engine…</span>
                                )}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2.5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/15 text-secondary border border-secondary/25 text-3xs font-extrabold uppercase tracking-wider">
                                <CheckCircle size={13} aria-hidden="true" />
                                JavaScript Enabled
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/15 text-secondary border border-secondary/25 text-3xs font-extrabold uppercase tracking-wider">
                                <CheckCircle size={13} aria-hidden="true" />
                                Cookies {details ? (details.cookiesEnabled ? "Enabled" : "Disabled") : "Checking"}
                            </span>
                        </div>
                    </div>

                    {/* Quick Specs Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b-2 border-background-dark/10">
                        <div className="p-4 rounded-2xl bg-background-dark/5 border border-background-dark/10">
                            <span className="text-4xs uppercase tracking-wider font-bold text-background-dark/60 block mb-1">Rendering Engine</span>
                            <span className="font-bold text-sm text-background-dark">{details?.engine || "—"}</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-background-dark/5 border border-background-dark/10">
                            <span className="text-4xs uppercase tracking-wider font-bold text-background-dark/60 block mb-1">Host Platform</span>
                            <span className="font-bold text-sm text-background-dark">{details?.osName || "—"}</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-background-dark/5 border border-background-dark/10">
                            <span className="text-4xs uppercase tracking-wider font-bold text-background-dark/60 block mb-1">Language</span>
                            <span className="font-bold text-sm text-background-dark font-mono">{details?.language || "en"}</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-background-dark/5 border border-background-dark/10">
                            <span className="text-4xs uppercase tracking-wider font-bold text-background-dark/60 block mb-1">JavaScript Status</span>
                            <span className="font-bold text-sm text-secondary">{details ? "Active" : "Checking"}</span>
                        </div>
                    </div>

                    {/* User Agent Block */}
                    <div className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-3xs font-extrabold uppercase tracking-wider text-background-dark/70 flex items-center gap-1.5">
                                <Terminal size={13} aria-hidden="true" />
                                Full User-Agent String
                            </span>
                            <button
                                onClick={copyUA}
                                disabled={!details}
                                aria-label={copiedUA ? "User-agent string copied to clipboard" : "Copy full user-agent string to clipboard"}
                                className="flex items-center gap-1.5 text-3xs font-black uppercase tracking-wider px-3 py-1 rounded-lg bg-background-dark text-white hover:bg-foreground transition-all cursor-pointer disabled:opacity-50"
                            >
                                {copiedUA ? <Check size={11} strokeWidth={3} aria-hidden="true" /> : <Copy size={11} aria-hidden="true" />}
                                <span>{copiedUA ? "Copied" : "Copy UA"}</span>
                            </button>
                            <div className="sr-only" role="status" aria-live="polite">
                                {copiedUA && "User-agent string copied to clipboard."}
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-background-dark text-accent font-mono text-2xs leading-relaxed break-all border-2 border-background-dark">
                            {details ? details.userAgent : "Detecting user agent string…"}
                        </div>
                    </div>
                </div>
            </div>

            {/* Editorial Content Section */}
            <div className="max-w-4xl mx-auto px-6 space-y-12">
                {/* Guide 1 */}
                <section className="bg-white border-2 border-background-dark rounded-3xl p-8 shadow-block-sm space-y-4">
                    <h2 className="font-serif text-fluid-h2 font-bold text-background-dark">
                        How Browser Detection &amp; Client Hints Work
                    </h2>
                    <p className="text-fluid-body text-background-dark/80 leading-relaxed font-medium">
                        Every time you visit a website, your browser transmits an identification token called the <strong>User-Agent (UA)</strong> string. This metadata lets web applications determine which HTML5 features, JavaScript APIs, video codecs, and CSS layout engines your software supports.
                    </p>
                    <p className="text-fluid-body text-background-dark/80 leading-relaxed font-medium">
                        Modern Chromium browsers (Chrome, Microsoft Edge, Brave, Opera) also implement <strong>User-Agent Client Hints (UA-CH)</strong> alongside frozen User-Agent strings. Because frozen UA strings mask minor version builds and exact CPU architecture (`0.0.0`), developers and IT engineers check both strings when diagnosing OS-specific regressions or rendering glitches.
                    </p>
                </section>

                {/* Guide 2: Browser Rendering Engines */}
                <section className="space-y-6">
                    <h2 className="font-serif text-fluid-h2 font-bold text-background-dark">
                        Understanding Major Browser Rendering Engines
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="p-6 rounded-3xl bg-white border-2 border-background-dark shadow-block-sm flex flex-col justify-between">
                            <div>
                                <span className="inline-block px-2.5 py-1 rounded-full text-4xs font-mono font-black uppercase tracking-wider bg-primary text-background-dark mb-3">
                                    Blink Engine
                                </span>
                                <h3 className="font-bold text-lg text-background-dark mb-2">Chromium Family</h3>
                                <p className="text-xs text-background-dark/70 leading-relaxed font-medium">
                                    Powers Google Chrome, Microsoft Edge, Brave, Opera, and Vivaldi. Paired with the V8 JavaScript engine for fast WebAssembly and modern CSS Grid execution.
                                </p>
                            </div>
                        </div>

                        <div className="p-6 rounded-3xl bg-white border-2 border-background-dark shadow-block-sm flex flex-col justify-between">
                            <div>
                                <span className="inline-block px-2.5 py-1 rounded-full text-4xs font-mono font-black uppercase tracking-wider bg-secondary text-white mb-3">
                                    Gecko Engine
                                </span>
                                <h3 className="font-bold text-lg text-background-dark mb-2">Mozilla Firefox</h3>
                                <p className="text-xs text-background-dark/70 leading-relaxed font-medium">
                                    Independent open-source engine developed by Mozilla. Emphasizes Enhanced Tracking Protection, Total Cookie Protection, and strict web standards compliance.
                                </p>
                            </div>
                        </div>

                        <div className="p-6 rounded-3xl bg-white border-2 border-background-dark shadow-block-sm flex flex-col justify-between">
                            <div>
                                <span className="inline-block px-2.5 py-1 rounded-full text-4xs font-mono font-black uppercase tracking-wider bg-accent text-background-dark mb-3">
                                    WebKit Engine
                                </span>
                                <h3 className="font-bold text-lg text-background-dark mb-2">Apple Safari</h3>
                                <p className="text-xs text-background-dark/70 leading-relaxed font-medium">
                                    Powers Safari across macOS, iOS, and iPadOS. Highly tuned for Apple Silicon battery efficiency, Intelligent Tracking Prevention (ITP), and P3 wide color gamut.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Troubleshooting Checklist for Support Tickets */}
                <section className="bg-white border-2 border-background-dark rounded-3xl p-8 shadow-block-sm space-y-4">
                    <h2 className="font-serif text-fluid-h2 font-bold text-background-dark">
                        Why Support Teams Request Your Browser Version &amp; Cookies Status
                    </h2>
                    <ul className="space-y-3 text-sm text-background-dark/80 font-medium leading-relaxed">
                        <li className="flex items-start gap-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 flex-shrink-0" />
                            <span><strong>Outdated TLS / Security Certificates:</strong> Legacy browsers more than 2 years behind often fail TLS 1.3 handshakes with banking, SaaS, and checkout APIs.</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 flex-shrink-0" />
                            <span><strong>Session Cookie &amp; Login Failures:</strong> If cookies are blocked globally or stripped by aggressive privacy add-ons, single sign-on (SSO / OAuth) loops repeatedly.</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 flex-shrink-0" />
                            <span><strong>Engine-Specific Layout Bugs:</strong> A flexbox, sticky scroll, or WebGL canvas bug in Apple WebKit may work properly in Blink or Gecko—reproducing the exact engine cuts support resolution time in half.</span>
                        </li>
                    </ul>
                </section>

                {/* SSR-Complete Accessible FAQ Accordion */}
                <DiagnosticFaqSection items={faqs} />

                {/* Related Diagnostics Hub */}
                <section className="pt-8 border-t-2 border-background-dark/10">
                    <h3 className="text-3xs font-extrabold uppercase tracking-widest text-primary mb-4">Explore More Diagnostics</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Link href="/what-is-my-ip" className="p-5 rounded-2xl bg-white border-2 border-background-dark shadow-block-sm hover:translate-x-px hover:translate-y-px transition-all">
                            <Wifi size={18} className="text-secondary mb-2" aria-hidden="true" />
                            <div className="font-bold text-sm text-background-dark">What Is My IP</div>
                            <p className="text-3xs text-background-dark/60 mt-1">Check public IPv4, IPv6 &amp; ISP</p>
                        </Link>
                        <Link href="/what-is-my-screen-resolution" className="p-5 rounded-2xl bg-white border-2 border-background-dark shadow-block-sm hover:translate-x-px hover:translate-y-px transition-all">
                            <Monitor size={18} className="text-primary mb-2" aria-hidden="true" />
                            <div className="font-bold text-sm text-background-dark">Screen Resolution</div>
                            <p className="text-3xs text-background-dark/60 mt-1">Hardware &amp; viewport dimensions</p>
                        </Link>
                        <Link href="/bufferbloat" className="p-5 rounded-2xl bg-white border-2 border-background-dark shadow-block-sm hover:translate-x-px hover:translate-y-px transition-all">
                            <RefreshCw size={18} className="text-background-dark mb-2" aria-hidden="true" />
                            <div className="font-bold text-sm text-background-dark">Bufferbloat Test</div>
                            <p className="text-3xs text-background-dark/60 mt-1">Test gaming &amp; video latency</p>
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
