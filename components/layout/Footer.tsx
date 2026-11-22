"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import AskAI from "@/components/ui/AskAI";
import Logo from "@/components/ui/Logo";
import CookieManager, { CookiePreferencesButton } from "@/components/ui/CookieManager";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function Footer() {
    const [clientInfo, setClientInfo] = useState({ os: "Detecting...", browser: "Detecting..." });

    useEffect(() => {
        const ua = navigator.userAgent;
        let browser = "Unknown Browser";
        let os = "Unknown OS";

        if (ua.indexOf("Edg/") > -1 || ua.indexOf("Edge/") > -1 || ua.indexOf("EdgA/") > -1 || ua.indexOf("EdgiOS/") > -1) {
            browser = "Edge";
        } else if (ua.indexOf("SamsungBrowser/") > -1) {
            browser = "Samsung Internet";
        } else if (ua.indexOf("YaBrowser/") > -1) {
            browser = "Yandex Browser";
        } else if (ua.indexOf("UCBrowser/") > -1) {
            browser = "UC Browser";
        } else if (ua.indexOf("DuckDuckGo/") > -1) {
            browser = "DuckDuckGo";
        } else if (ua.indexOf("Vivaldi/") > -1) {
            browser = "Vivaldi";
        } else if (ua.indexOf("OPR/") > -1 || ua.indexOf("OPT/") > -1) {
            browser = "Opera";
        } else if (ua.indexOf("Opera Mini") > -1 || ua.indexOf("OPiOS/") > -1) {
            browser = "Opera Mini";
        } else if (ua.indexOf("CriOS/") > -1) {
            browser = "Chrome";
        } else if (ua.indexOf("FxiOS/") > -1) {
            browser = "Firefox";
        } else if (ua.indexOf("Firefox/") > -1) {
            browser = "Firefox";
        } else if (ua.indexOf("Silk/") > -1) {
            browser = "Amazon Silk";
        } else if (ua.indexOf("Chrome/") > -1) {
            browser = "Chrome";
        } else if (ua.indexOf("Safari/") > -1) {
            browser = "Safari";
        }

        if (/Android/i.test(ua)) os = "Android";
        else if (/iPad/i.test(ua)) os = "iPadOS";
        else if (/iPhone|iPod/i.test(ua)) os = "iOS";
        else if (/Win/i.test(ua)) os = "Windows";
        else if (/CrOS/i.test(ua)) os = "ChromeOS";
        else if (/Mac/i.test(ua)) os = navigator.maxTouchPoints > 1 ? "iPadOS" : "macOS";
        else if (/Linux/i.test(ua)) os = navigator.maxTouchPoints > 0 ? "Android/Linux Tablet" : "Linux";

        setClientInfo({ os, browser });
    }, []);

    return (
        <footer role="contentinfo" className="relative w-full border-t-2 border-background-dark bg-background-dark text-white overflow-hidden">
            {/* Subtle Top Ambient Radial Highlight */}
            <div
                className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-25"
                style={{
                    background: "radial-gradient(ellipse 60% 80% at 50% 0%, #00C48C 0%, transparent 75%)",
                }}
            />

            <div className="relative max-w-site mx-auto px-6 py-8 md:py-10">
                {/* Main Content Grid: Balanced 3 Columns */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 pb-8 border-b border-white/10 items-start">
                    
                    {/* Col 1: Brand & Core Mission (5 cols) */}
                    <div className="md:col-span-5 flex flex-col gap-3">
                        <Logo theme="dark" size="sm" />
                        <p className="text-accent/75 text-xs sm:text-sm leading-relaxed max-w-sm font-medium">
                            Private, client-side browser intelligence and bufferbloat latency testing. Built for IT support, remote teams, and gamers.
                        </p>
                        <p className="text-3xs text-accent/50 font-medium tracking-wide pt-1">
                            100% in-browser processing &middot; Zero database logs &middot; Encrypted TLS
                        </p>
                    </div>

                    {/* Col 2: Navigation Links (3 cols) */}
                    <div className="md:col-span-3 flex flex-col gap-2.5">
                        <span className="text-3xs font-black uppercase text-primary tracking-widest">
                            Diagnostics &amp; Tools
                        </span>
                        <nav aria-label="Footer diagnostics navigation" className="flex flex-col gap-1.5 text-xs font-semibold text-accent/75">
                            <Link className="hover:text-primary transition-colors flex items-center justify-between w-fit gap-2" href="/what-is-my-browser">
                                <span>What Is My Browser</span>
                            </Link>
                            <Link className="hover:text-primary transition-colors flex items-center justify-between w-fit gap-2" href="/what-is-my-ip">
                                <span>What Is My IP Address</span>
                            </Link>
                            <Link className="hover:text-primary transition-colors flex items-center justify-between w-fit gap-2" href="/what-is-my-screen-resolution">
                                <span>What Is My Screen Size</span>
                            </Link>
                            <Link className="hover:text-primary transition-colors flex items-center gap-2 w-fit" href="/bufferbloat">
                                <span>Bufferbloat Test</span>
                                <span className="text-4xs px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold uppercase leading-none">
                                    Latency
                                </span>
                            </Link>
                            <Link className="hover:text-primary transition-colors w-fit" href="/faq">
                                Knowledge Base (FAQ)
                            </Link>
                            <div className="flex items-center gap-2 pt-1 text-accent/50 text-3xs flex-wrap">
                                <Link className="hover:text-accent transition-colors underline-offset-2 hover:underline" href="/privacy">
                                    Privacy
                                </Link>
                                <span>&middot;</span>
                                <Link className="hover:text-accent transition-colors underline-offset-2 hover:underline" href="/terms">
                                    Terms
                                </Link>
                                <span>&middot;</span>
                                <CookiePreferencesButton />
                            </div>
                        </nav>
                    </div>

                    {/* Col 3: Live Active Telemetry Pill (4 cols) */}
                    <div className="md:col-span-4 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                            <span className="text-3xs font-black uppercase text-primary tracking-widest">
                                Active Environment
                            </span>
                            <span className="text-4xs font-bold text-accent/50 uppercase tracking-widest font-mono">
                                In-Memory
                            </span>
                        </div>
                        
                        {/* Compact Glass Telemetry Card */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-2 text-2xs font-mono backdrop-blur-sm shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-accent/50 font-sans font-medium text-3xs">Host OS</span>
                                <span className="text-white font-bold truncate max-w-[180px]">{clientInfo.os}</span>
                            </div>
                            <div className="flex items-center justify-between border-t border-white/5 pt-1.5">
                                <span className="text-accent/50 font-sans font-medium text-3xs">Browser</span>
                                <span className="text-white font-bold truncate max-w-[180px]">{clientInfo.browser}</span>
                            </div>
                        </div>
                        <p className="text-4xs text-accent/40 leading-normal">
                            Telemetry evaluated in browser memory. Disappears when tab closes.
                        </p>
                    </div>

                </div>

                {/* Bottom Row: Compact AI Prompt Strip, Theme Selector & Copyright */}
                <div className="pt-5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-3xs font-bold text-accent/60 uppercase tracking-wider">
                            Ask AI:
                        </span>
                        <AskAI variant="dark" compact={true} />
                    </div>

                    <div className="flex items-center gap-4">
                        <ThemeToggle compact variant="dark" />
                        <div className="flex items-center gap-2 text-3xs font-bold text-accent/40 uppercase tracking-wider">
                            <span>&copy; {new Date().getFullYear()} MySupportInfo.com</span>
                            <span>&middot;</span>
                            <span className="normal-case font-medium text-accent/35">Private System Diagnostics</span>
                        </div>
                    </div>
                </div>
            </div>
            {/* Global Cookie Preferences & Consent Manager */}
            <CookieManager />
        </footer>
    );
}
