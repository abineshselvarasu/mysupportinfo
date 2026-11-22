"use client";

import React, { useState, useEffect, useId } from "react";
import { Share2, X, Copy, Check, Shield } from "lucide-react";
import { encodeReport } from "@/lib/report-share";

export interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    stats: {
        browserName?: string;
        browserVersion?: string;
        osName?: string;
        resolution?: string;
        windowSize?: string;
        pixelRatio?: string;
        colorDepth?: string;
        cpuCores?: number | string;
        ram?: string;
        webglVendor?: string;
        language?: string;
        persistence?: string;
        doNotTrack?: string;
        ip?: string;
        ipv6?: string;
        ispName?: string;
        city?: string;
        country?: string;
        timezone?: string;
    } | null;
}

export default function ShareModal({ isOpen, onClose, stats }: ShareModalProps) {
    const [maskSensitive, setMaskSensitive] = useState(true);
    const [copied, setCopied] = useState(false);
    const [shareUrl, setShareUrl] = useState("");
    const titleId = useId();

    useEffect(() => {
        if (!isOpen || !stats || typeof window === "undefined") return;
        const encoded = encodeReport(stats, maskSensitive);
        const origin = window.location.origin;
        setShareUrl(`${origin}/?report=${encoded}`);
    }, [isOpen, stats, maskSensitive]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const copyToClipboard = async () => {
        if (!shareUrl) return;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            // clipboard write failed
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-background-dark/75 backdrop-blur-sm overflow-y-auto"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
        >
            <div className="relative w-full max-w-lg bg-background border-2 border-background-dark shadow-block rounded-3xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-start justify-between p-5 sm:p-6 border-b-2 border-background-dark/10 bg-white/70">
                    <div className="flex items-start gap-3.5">
                        <div className="p-2.5 rounded-2xl bg-secondary text-white border-2 border-background-dark shadow-block-sm flex-shrink-0 mt-0.5">
                            <Share2 size={20} />
                        </div>
                        <div>
                            <h3 id={titleId} className="font-serif text-xl sm:text-2xl font-bold text-background-dark">
                                Share Diagnostic Report
                            </h3>
                            <p className="text-xs text-background-dark/70 mt-1 leading-relaxed font-medium">
                                Send this link to your IT helpdesk, customer support, or developer so they can view your exact device details on their screen.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close share options"
                        className="p-1.5 rounded-xl border-2 border-background-dark/20 text-background-dark/70 hover:text-background-dark hover:border-background-dark hover:bg-background-dark/5 transition-all flex-shrink-0 cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 sm:p-6 space-y-5">
                    {/* Privacy Preset Toggle */}
                    <div className="p-4 rounded-2xl bg-white border-2 border-background-dark shadow-block-sm space-y-2.5">
                        <label className="flex items-start gap-3 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={maskSensitive}
                                onChange={(e) => setMaskSensitive(e.target.checked)}
                                className="mt-1 w-4 h-4 rounded text-secondary focus:ring-secondary border-background-dark/30"
                            />
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-background-dark">
                                        Mask IP &amp; Geolocation (Recommended)
                                    </span>
                                    <span className="text-4xs font-black uppercase tracking-wider bg-secondary/15 text-secondary px-2 py-0.5 rounded-full border border-secondary/20">
                                        Privacy Safe
                                    </span>
                                </div>
                                <p className="text-3xs text-background-dark/65 mt-0.5 leading-relaxed font-medium">
                                    Hides your public IPv4, IPv6, ISP name, and physical location from the link. Safe to share on public forums, GitHub issues, and Discord tickets.
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* URL Input with Copy Button */}
                    <div>
                        <label className="block text-3xs font-extrabold uppercase tracking-ui-wide text-background-dark/70 mb-1.5">
                            Shareable Link (Client-Side Encoded)
                        </label>
                        <div className="flex items-stretch gap-2">
                            <input
                                type="text"
                                readOnly
                                value={shareUrl}
                                onFocus={(e) => e.target.select()}
                                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border-2 border-background-dark font-mono text-2xs text-background-dark/80 focus:outline-none focus:ring-2 focus:ring-primary truncate"
                            />
                            <button
                                onClick={copyToClipboard}
                                className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-background-dark font-black uppercase tracking-wider text-xs rounded-xl border-2 border-background-dark shadow-block-sm hover:bg-primary-dark active:translate-x-px active:translate-y-px active:shadow-none transition-all flex-shrink-0 cursor-pointer"
                            >
                                {copied ? <Check size={14} strokeWidth={3} /> : <Copy size={14} />}
                                <span>{copied ? "Copied!" : "Copy Link"}</span>
                            </button>
                        </div>
                    </div>

                    {/* Technical details badge */}
                    <div className="flex items-center gap-2 text-3xs text-background-dark/65 bg-background-dark/5 p-3 rounded-xl border border-background-dark/10">
                        <Shield size={14} className="text-secondary flex-shrink-0" />
                        <span>
                            100% In-Browser. No data is stored in any database or cloud server. The specs are encoded directly into the URL parameters for total privacy.
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-5 border-t-2 border-background-dark/10 bg-white/70 flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl border-2 border-background-dark/30 text-background-dark font-bold text-xs hover:border-background-dark hover:bg-background-dark/5 transition-all cursor-pointer"
                    >
                        Close
                    </button>
                    <button
                        onClick={copyToClipboard}
                        className="flex items-center gap-2 px-5 py-2 bg-background-dark text-white font-bold text-xs rounded-xl border-2 border-background-dark shadow-block-sm hover:bg-foreground active:translate-x-px active:translate-y-px active:shadow-none transition-all cursor-pointer"
                    >
                        <Copy size={13} />
                        <span>{copied ? "Copied to Clipboard!" : "Copy Share Link"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
