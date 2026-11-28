"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Shield, X, CheckCircle2, Ban, BarChart2, Cookie } from "lucide-react";

interface CookiePreferences {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
    timestamp: string;
}

const COOKIE_PREFS_KEY = "msi_cookie_consent_v1";

export function CookiePreferencesButton({
    className = "",
    children,
}: {
    className?: string;
    children?: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={() => {
                if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("open-cookie-preferences"));
                }
            }}
            className={className || "hover:text-white transition-colors underline underline-offset-4 cursor-pointer text-left"}
        >
            {children || "Cookie Preferences"}
        </button>
    );
}

export default function CookieManager() {
    const [isOpen, setIsOpen] = useState(false);
    const [showBanner, setShowBanner] = useState(false);
    const [analytics, setAnalytics] = useState(true);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(COOKIE_PREFS_KEY);
            if (stored) {
                const parsed: CookiePreferences = JSON.parse(stored);
                setAnalytics(parsed.analytics ?? true);
            } else {
                const timer = setTimeout(() => setShowBanner(true), 1200);
                return () => clearTimeout(timer);
            }
        } catch {
            // fallback if storage disabled
        }
    }, []);

    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener("open-cookie-preferences", handleOpen);
        return () => window.removeEventListener("open-cookie-preferences", handleOpen);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) setIsOpen(false);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    const savePreferences = useCallback((enableAnalytics: boolean) => {
        const prefs: CookiePreferences = {
            necessary: true,
            analytics: enableAnalytics,
            marketing: false,
            timestamp: new Date().toISOString(),
        };

        try {
            localStorage.setItem(COOKIE_PREFS_KEY, JSON.stringify(prefs));
            window.dispatchEvent(new CustomEvent("cookie-preferences-updated", { detail: prefs }));
        } catch {
            // storage disabled
        }

        setAnalytics(enableAnalytics);
        setShowBanner(false);
        setIsOpen(false);
        setToastMessage("Privacy preferences saved");
        setTimeout(() => setToastMessage(null), 2500);
    }, []);

    return (
        <>
            {/* Compact Bottom-Centered Strip */}
            {showBanner && !isOpen && (
                <div className="fixed bottom-3 inset-x-0 z-40 px-3 pointer-events-none flex justify-center">
                    <div
                        role="region"
                        aria-label="Cookie consent banner"
                        className="pointer-events-auto w-full max-w-3xl bg-surface text-ink border border-line-strong rounded-xl px-4 py-2.5 shadow-elevated flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4"
                    >
                        <div className="flex items-start sm:items-center justify-between gap-2.5 flex-1 min-w-0">
                            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                                <Cookie size={16} className="text-primary flex-shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
                                <p className="text-xs text-muted leading-snug">
                                    <strong className="text-ink font-semibold">Privacy Notice:</strong>{" "}
                                    Essential session storage only plus optional anonymous page analytics—zero ad tracking.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowBanner(false)}
                                aria-label="Dismiss banner"
                                className="sm:hidden text-muted hover:text-ink p-1 rounded-md transition-colors cursor-pointer flex-shrink-0"
                            >
                                <X size={15} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="flex items-center justify-end gap-2 flex-shrink-0">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowBanner(false);
                                    setIsOpen(true);
                                }}
                                className="text-xs font-medium text-muted hover:text-ink transition-colors underline underline-offset-2 cursor-pointer px-1.5"
                            >
                                Customize
                            </button>
                            <button
                                type="button"
                                onClick={() => savePreferences(false)}
                                className="px-3 py-1.5 rounded-lg border border-line-strong text-ink text-xs font-semibold hover:bg-hover transition-colors cursor-pointer whitespace-nowrap"
                            >
                                Reject
                            </button>
                            <button
                                type="button"
                                onClick={() => savePreferences(true)}
                                className="px-3.5 py-1.5 rounded-lg bg-primary text-foreground text-xs font-bold hover:bg-primary-dark transition-colors cursor-pointer whitespace-nowrap"
                            >
                                Accept
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowBanner(false)}
                                aria-label="Dismiss banner"
                                className="hidden sm:inline-flex text-muted hover:text-ink p-1 rounded-md transition-colors cursor-pointer"
                            >
                                <X size={15} aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preferences Dialog */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="cookie-preferences-title"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setIsOpen(false);
                    }}
                >
                    <div className="bg-surface text-ink border border-line-strong rounded-2xl shadow-elevated max-w-lg w-full overflow-hidden my-8">
                        <div className="px-6 py-5 bg-brand text-white flex items-start justify-between gap-4 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="size-9 rounded-lg bg-white/10 text-primary flex items-center justify-center flex-shrink-0">
                                    <Shield size={18} aria-hidden="true" />
                                </div>
                                <div>
                                    <h2 id="cookie-preferences-title" className="text-base font-bold text-white">
                                        Cookie &amp; Privacy Preferences
                                    </h2>
                                    <p className="text-white/75 text-xs mt-0.5">
                                        Diagnostics execute locally in browser memory.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                aria-label="Close dialog"
                                className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                <X size={18} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="p-6 space-y-3.5 max-h-[60vh] overflow-y-auto">
                            <div className="p-4 rounded-xl border border-line bg-well/60 space-y-1.5">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 size={15} className="text-secondary" aria-hidden="true" />
                                        <span className="font-semibold text-sm text-ink">Strictly Necessary Storage</span>
                                    </div>
                                    <span className="text-xs font-mono font-semibold text-secondary">Always Active</span>
                                </div>
                                <p className="text-xs text-muted leading-relaxed">
                                    Remembers theme selection, consent preferences, and a 5-minute session IP cache to prevent rate limits.
                                </p>
                            </div>

                            <div className="p-4 rounded-xl border border-line bg-surface space-y-1.5">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <BarChart2 size={15} className="text-primary" aria-hidden="true" />
                                        <span className="font-semibold text-sm text-ink">Anonymous Performance Analytics</span>
                                    </div>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={analytics}
                                        aria-label="Toggle anonymous performance analytics"
                                        onClick={() => setAnalytics((prev) => !prev)}
                                        className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer border ${
                                            analytics ? "bg-secondary border-secondary" : "bg-well border-line-strong"
                                        }`}
                                    >
                                        <div
                                            className={`bg-white size-5 rounded-full shadow-sm transform transition-transform duration-150 ${
                                                analytics ? "translate-x-5" : "translate-x-0"
                                            }`}
                                        />
                                    </button>
                                </div>
                                <p className="text-xs text-muted leading-relaxed">
                                    Aggregate page-view counts only via Vercel Analytics. Never collects IP logs or device identities.
                                </p>
                            </div>

                            <div className="p-4 rounded-xl border border-line bg-well/40 space-y-1.5">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <Ban size={15} className="text-muted" aria-hidden="true" />
                                        <span className="font-semibold text-sm text-muted">Ad &amp; Behavioral Tracking</span>
                                    </div>
                                    <span className="text-xs font-mono text-muted">Never Used</span>
                                </div>
                                <p className="text-xs text-muted leading-relaxed">
                                    Zero advertising trackers, marketing pixels, or data brokers.
                                </p>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-well/60 border-t border-line flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5">
                            <button
                                type="button"
                                onClick={() => savePreferences(false)}
                                className="w-full sm:w-auto px-4 py-2 rounded-lg border border-line-strong text-ink font-semibold text-xs hover:bg-hover transition-colors cursor-pointer"
                            >
                                Reject Non-Essential
                            </button>
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                <button
                                    type="button"
                                    onClick={() => savePreferences(analytics)}
                                    className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-brand text-white font-semibold text-xs hover:opacity-95 transition-opacity cursor-pointer"
                                >
                                    Save Choice
                                </button>
                                <button
                                    type="button"
                                    onClick={() => savePreferences(true)}
                                    className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-primary text-foreground font-bold text-xs hover:bg-primary-dark transition-colors cursor-pointer"
                                >
                                    Accept All
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {toastMessage && (
                <div
                    role="status"
                    className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-brand text-white border border-white/15 px-4 py-2 rounded-lg shadow-elevated text-xs font-semibold flex items-center gap-2"
                >
                    <CheckCircle2 size={14} className="text-primary" aria-hidden="true" />
                    <span>{toastMessage}</span>
                </div>
            )}
        </>
    );
}
