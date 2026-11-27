"use client";
import React, { useState, useEffect, useCallback } from "react";

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
            className={className || "hover:text-accent transition-colors underline-offset-2 hover:underline cursor-pointer text-left"}
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

    // Initialize from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(COOKIE_PREFS_KEY);
            if (stored) {
                const parsed: CookiePreferences = JSON.parse(stored);
                setAnalytics(parsed.analytics ?? true);
            } else {
                // Show banner after a brief delay so it doesn't pop aggressively on initial load
                const timer = setTimeout(() => setShowBanner(true), 1200);
                return () => clearTimeout(timer);
            }
        } catch {
            // fallback if storage disabled
        }
    }, []);

    // Listen to custom open event
    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener("open-cookie-preferences", handleOpen);
        return () => window.removeEventListener("open-cookie-preferences", handleOpen);
    }, []);

    // Handle Escape key to close modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                setIsOpen(false);
            }
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

        // Show brief confirmation toast
        setToastMessage("Cookie preferences saved");
        setTimeout(() => setToastMessage(null), 2500);
    }, []);

    const handleAcceptAll = () => savePreferences(true);
    const handleRejectAll = () => savePreferences(false);
    const handleSaveCustom = () => savePreferences(analytics);

    return (
        <>
            {/* ── First-Visit Compact Bottom Cookie Strip ─────────────── */}
            {showBanner && !isOpen && (
                <div className="fixed bottom-3 inset-x-0 z-40 px-3 pointer-events-none flex justify-center">
                    <div
                        role="region"
                        aria-label="Cookie consent banner"
                        className="pointer-events-auto w-full max-w-3xl bg-white border-2 border-background-dark rounded-2xl px-3.5 sm:px-4 py-2.5 shadow-block flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                    >
                        <div className="flex items-start sm:items-center justify-between gap-2.5 flex-1 min-w-0">
                            <div className="flex items-start sm:items-center gap-2 min-w-0">
                                <span className="material-symbols-outlined text-primary text-base sm:text-lg flex-shrink-0 mt-0.5 sm:mt-0" aria-hidden="true">cookie</span>
                                <p className="text-2xs text-background-dark/80 leading-snug font-medium">
                                    <strong className="text-background-dark font-extrabold">Privacy Notice:</strong>{" "}
                                    Essential session storage only plus optional anonymous page analytics—no ad trackers.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowBanner(false)}
                                aria-label="Dismiss banner"
                                className="sm:hidden text-background-dark/50 hover:text-background-dark p-1 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                            >
                                <span className="material-symbols-outlined text-base" aria-hidden="true">close</span>
                            </button>
                        </div>

                        <div className="flex items-center justify-end gap-2 flex-shrink-0">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowBanner(false);
                                    setIsOpen(true);
                                }}
                                className="text-2xs font-bold text-background-dark/70 hover:text-primary transition-colors underline cursor-pointer px-1"
                            >
                                Customize
                            </button>
                            <button
                                type="button"
                                onClick={handleRejectAll}
                                className="px-2.5 py-1 rounded-lg border border-background-dark text-background-dark text-2xs font-bold hover:bg-background-dark/5 transition-colors cursor-pointer whitespace-nowrap"
                            >
                                Reject
                            </button>
                            <button
                                type="button"
                                onClick={handleAcceptAll}
                                className="px-3 py-1 rounded-lg bg-primary text-foreground border border-background-dark text-2xs font-black shadow-block-sm hover:bg-primary-dark transition-all cursor-pointer whitespace-nowrap"
                            >
                                Accept
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowBanner(false)}
                                aria-label="Dismiss banner"
                                className="hidden sm:inline-flex text-background-dark/50 hover:text-background-dark p-1 rounded-lg transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-base" aria-hidden="true">close</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Cookie Preferences Modal Dialog ──────────────────────── */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 bg-background-dark/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="cookie-preferences-title"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setIsOpen(false);
                    }}
                >
                    <div className="bg-white border-2 border-background-dark rounded-2xl shadow-block max-w-lg w-full overflow-hidden transition-all duration-200 animate-in fade-in zoom-in-95 my-8">
                        {/* Header */}
                        <div className="p-6 bg-background-dark text-white flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-white/10 text-primary flex items-center justify-center flex-shrink-0">
                                    <span className="material-symbols-outlined text-xl">shield</span>
                                </div>
                                <div>
                                    <h2 id="cookie-preferences-title" className="text-lg font-extrabold text-white">
                                        Cookie &amp; Privacy Preferences
                                    </h2>
                                    <p className="text-accent/70 text-xs mt-0.5">
                                        All diagnostics execute client-side in memory.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                aria-label="Close dialog"
                                className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        </div>

                        {/* Body / Toggles */}
                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                            {/* Category 1: Strictly Necessary */}
                            <div className="p-4 rounded-xl border border-background-dark/15 bg-background/50 flex flex-col gap-2">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-secondary text-base">check_circle</span>
                                        <span className="font-extrabold text-sm text-background-dark">
                                            Strictly Necessary &amp; Session Storage
                                        </span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full text-4xs font-black uppercase tracking-wider bg-secondary/15 text-secondary border border-secondary/30">
                                        Always Active
                                    </span>
                                </div>
                                <p className="text-xs text-background-dark/70 leading-relaxed font-medium">
                                    Essential for remembering UI preferences, saving your privacy choices, and temporarily caching IP lookups in your session to avoid rate limits. Cannot be switched off.
                                </p>
                            </div>

                            {/* Category 2: Performance & Analytics */}
                            <div className="p-4 rounded-xl border border-background-dark/15 bg-white flex flex-col gap-2">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-base">analytics</span>
                                        <span className="font-extrabold text-sm text-background-dark">
                                            Anonymous Performance Analytics
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={analytics}
                                        onClick={() => setAnalytics(!analytics)}
                                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer border border-background-dark/30 ${
                                            analytics ? "bg-secondary" : "bg-background-dark/20"
                                        }`}
                                    >
                                        <div
                                            className={`bg-[#FAF6F0] size-4 rounded-full shadow-md transform transition-transform duration-200 ${
                                                analytics ? "translate-x-5" : "translate-x-0"
                                            }`}
                                        />
                                    </button>
                                </div>
                                <p className="text-xs text-background-dark/70 leading-relaxed font-medium">
                                    Provides anonymous, aggregate page view and latency metrics via Vercel Analytics to help us detect server load and optimize testing nodes. Never collects personal identities or IP logs.
                                </p>
                            </div>

                            {/* Category 3: Marketing & Profiling */}
                            <div className="p-4 rounded-xl border border-background-dark/15 bg-background/50 flex flex-col gap-2">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-background-dark/40 text-base">block</span>
                                        <span className="font-extrabold text-sm text-background-dark/60">
                                            Marketing &amp; Cross-Site Tracking
                                        </span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full text-4xs font-black uppercase tracking-wider bg-background-dark/10 text-background-dark/50 border border-background-dark/20">
                                        Not Used
                                    </span>
                                </div>
                                <p className="text-xs text-background-dark/60 leading-relaxed font-medium">
                                    MySupportInfo does not run ads, utilize tracking pixels, or share data with third-party brokers. Zero marketing cookies are ever set.
                                </p>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-5 bg-background border-t-2 border-background-dark/10 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={handleRejectAll}
                                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border-2 border-background-dark text-background-dark font-bold text-xs hover:bg-background-dark/5 transition-colors cursor-pointer text-center"
                            >
                                Reject Non-Essential
                            </button>
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                <button
                                    type="button"
                                    onClick={handleSaveCustom}
                                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-background-dark text-white font-bold text-xs hover:bg-background-dark/90 shadow-block-sm transition-all cursor-pointer text-center"
                                >
                                    Save Preferences
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAcceptAll}
                                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-primary text-foreground font-black border-2 border-background-dark shadow-block-sm hover:bg-primary-dark transition-all text-xs cursor-pointer text-center"
                                >
                                    Accept All
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Saved Feedback Toast ──────────────────────────────────── */}
            {toastMessage && (
                <div
                    role="status"
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background-dark text-white border border-accent/20 px-4 py-2.5 rounded-full shadow-block text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2"
                >
                    <span className="text-secondary font-bold" aria-hidden="true">&#10003;</span>
                    <span>{toastMessage}</span>
                </div>
            )}
        </>
    );
}
