"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Check, CheckCircle2, ChevronRight, ArrowRight, Terminal } from "lucide-react";
import DiagnosticFaqSection, { type DiagnosticFaqItem } from "@/components/ui/DiagnosticFaqSection";
import { detectBrowserInfo, detectOSName } from "@/lib/device-detect";
import { copyToClipboard } from "@/lib/clipboard";

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
        let active = true;
        const detect = async () => {
            const ua = navigator.userAgent;
            const [{ browserName, browserVersion, engine }, osName] = await Promise.all([
                detectBrowserInfo(ua),
                detectOSName(ua),
            ]);
            if (!active) return;
            setDetails({
                browserName,
                browserVersion,
                engine,
                osName,
                userAgent: ua,
                cookiesEnabled: navigator.cookieEnabled,
                jsEnabled: true,
                language: navigator.language || "en",
            });
        };
        detect();
        return () => {
            active = false;
        };
    }, []);

    const copyUA = async () => {
        if (!details) return;
        if (await copyToClipboard(details.userAgent)) {
            setCopiedUA(true);
            setTimeout(() => setCopiedUA(false), 2000);
        }
    };

    return (
        <div className="bg-canvas text-ink pb-20">
            <div className="max-w-site mx-auto px-5 sm:px-6 pt-8 space-y-10">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-muted">
                    <Link href="/" className="hover:text-ink transition-colors">Overview</Link>
                    <ChevronRight size={14} aria-hidden="true" />
                    <span className="text-ink font-semibold" aria-current="page">What Is My Browser</span>
                </nav>

                <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary">
                        Browser Version, Engine &amp; User-Agent Inspector
                    </p>
                    <h1 className="text-fluid-hero font-extrabold text-ink tracking-tight leading-tight">
                        What Is My Browser?
                    </h1>
                    <p className="text-fluid-lead text-muted leading-relaxed max-w-2xl">
                        Instantly see your browser name, version build, rendering engine, cookie status, and full User-Agent identification string in one clean view.
                    </p>
                </div>

                {/* Main Browser Surface */}
                <section className="bg-surface border border-line rounded-2xl shadow-subtle overflow-hidden">
                    <div className="p-6 sm:p-8 border-b border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                            <span className="text-xs font-semibold text-muted block">Detected Browser</span>
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
                                    {details ? details.browserName : "Detecting…"}
                                </span>
                                {details?.browserVersion && (
                                    <span className="px-2.5 py-0.5 rounded-lg bg-primary text-foreground font-mono text-base font-bold">
                                        v{details.browserVersion}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-muted">
                                {details
                                    ? `Running on ${details.osName} using the ${details.engine} rendering engine.`
                                    : "Inspecting browser engine and platform locally…"}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-secondary/10 border border-secondary/25 text-xs font-semibold text-secondary">
                                <CheckCircle2 size={13} aria-hidden="true" />
                                JavaScript On
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-secondary/10 border border-secondary/25 text-xs font-semibold text-secondary">
                                <CheckCircle2 size={13} aria-hidden="true" />
                                Cookies {details ? (details.cookiesEnabled ? "Enabled" : "Blocked") : "…"}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-line bg-well/30">
                        <div className="p-4 sm:p-5 space-y-1">
                            <span className="text-xs text-muted font-medium block">Engine</span>
                            <span className="font-bold text-sm text-ink">{details?.engine || "—"}</span>
                        </div>
                        <div className="p-4 sm:p-5 space-y-1">
                            <span className="text-xs text-muted font-medium block">Platform</span>
                            <span className="font-bold text-sm text-ink">{details?.osName || "—"}</span>
                        </div>
                        <div className="p-4 sm:p-5 space-y-1">
                            <span className="text-xs text-muted font-medium block">Locale</span>
                            <span className="font-mono font-bold text-sm text-ink">{details?.language || "en"}</span>
                        </div>
                        <div className="p-4 sm:p-5 space-y-1">
                            <span className="text-xs text-muted font-medium block">JS Status</span>
                            <span className="font-bold text-sm text-secondary">{details ? "Active" : "…"}</span>
                        </div>
                    </div>

                    <div className="p-6 sm:p-8 border-t border-line space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-ink inline-flex items-center gap-1.5">
                                <Terminal size={13} className="text-primary" aria-hidden="true" />
                                Full User-Agent String
                            </span>
                            <button
                                type="button"
                                onClick={copyUA}
                                disabled={!details}
                                aria-label={copiedUA ? "User-agent copied" : "Copy full user-agent string"}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer"
                            >
                                {copiedUA ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
                                <span>{copiedUA ? "Copied UA" : "Copy User-Agent"}</span>
                            </button>
                            <div className="sr-only" role="status" aria-live="polite">
                                {copiedUA && "User-agent string copied to clipboard."}
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-brand text-accent font-mono text-xs leading-relaxed break-all">
                            {details ? details.userAgent : "Detecting user agent…"}
                        </div>
                    </div>
                </section>

                {/* Rendering Engines Guide */}
                <section className="space-y-4">
                    <h2 className="text-fluid-h2 font-bold text-ink">Major Browser Engines Explained</h2>
                    <div className="bg-surface border border-line rounded-2xl divide-y md:divide-y-0 md:divide-x divide-line grid grid-cols-1 md:grid-cols-3">
                        <div className="p-6 space-y-2">
                            <span className="text-xs font-mono font-bold text-primary">Blink</span>
                            <h3 className="font-bold text-base text-ink">Chromium Family</h3>
                            <p className="text-xs text-muted leading-relaxed">
                                Powers Google Chrome, Microsoft Edge, Brave, Opera, and Vivaldi alongside the V8 JavaScript engine.
                            </p>
                        </div>
                        <div className="p-6 space-y-2">
                            <span className="text-xs font-mono font-bold text-secondary">Gecko</span>
                            <h3 className="font-bold text-base text-ink">Mozilla Firefox</h3>
                            <p className="text-xs text-muted leading-relaxed">
                                Independent open-source engine focused on standards compliance and enhanced tracking isolation.
                            </p>
                        </div>
                        <div className="p-6 space-y-2">
                            <span className="text-xs font-mono font-bold text-ink">WebKit</span>
                            <h3 className="font-bold text-base text-ink">Apple Safari</h3>
                            <p className="text-xs text-muted leading-relaxed">
                                Powers Safari across macOS, iOS, and iPadOS—critical for debugging mobile viewport behavior.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Why Support Teams Ask */}
                <section className="bg-surface border border-line rounded-2xl p-6 sm:p-8 space-y-3">
                    <h2 className="text-fluid-h2 font-bold text-ink">Why Support Teams Check Browser Version &amp; Cookies</h2>
                    <ul className="space-y-2 text-sm text-muted leading-relaxed list-disc pl-5">
                        <li><strong className="text-ink">Login Loops:</strong> Disabled or cleared cookies break SSO and checkout sessions.</li>
                        <li><strong className="text-ink">Security Compatibility:</strong> Old browsers fail modern TLS handshakes on banking and SaaS portals.</li>
                        <li><strong className="text-ink">Layout Differences:</strong> Identifying whether a user is on Blink, Gecko, or WebKit lets engineers reproduce bugs accurately.</li>
                    </ul>
                </section>

                <DiagnosticFaqSection items={faqs} />

                <section className="pt-6 border-t border-line">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-muted mb-4">Related Diagnostic Tools</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { href: "/what-is-my-ip", title: "What Is My IP", desc: "Inspect IPv4, IPv6 & WebRTC" },
                            { href: "/what-is-my-screen-resolution", title: "Screen Resolution", desc: "Check live viewport & DPR" },
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
