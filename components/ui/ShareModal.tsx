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
        setShareUrl(`${window.location.origin}/?report=${encoded}`);
    }, [isOpen, stats, maskSensitive]);

    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "";
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
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
        >
            <div className="relative w-full max-w-lg bg-surface text-ink border border-line-strong shadow-elevated rounded-2xl overflow-hidden my-auto">
                <div className="flex items-start justify-between p-5 sm:p-6 border-b border-line bg-well/40">
                    <div className="flex items-start gap-3">
                        <div className="size-10 rounded-xl bg-brand text-white flex items-center justify-center flex-shrink-0">
                            <Share2 size={18} aria-hidden="true" />
                        </div>
                        <div>
                            <h3 id={titleId} className="text-lg font-bold text-ink">
                                Share Diagnostic Link
                            </h3>
                            <p className="text-xs text-muted mt-1 leading-relaxed">
                                Send this URL to a technician or teammate so they see your exact browser and screen specs—zero database storage involved.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close share options"
                        className="p-1.5 rounded-lg border border-line text-muted hover:text-ink hover:border-line-strong transition-colors flex-shrink-0 cursor-pointer"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="p-5 sm:p-6 space-y-5">
                    <label className="flex items-start gap-3 p-4 rounded-xl bg-well/50 border border-line cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={maskSensitive}
                            onChange={(e) => setMaskSensitive(e.target.checked)}
                            className="mt-0.5 size-4 rounded accent-secondary"
                        />
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-ink">Hide IP Address &amp; Location</span>
                                <span className="text-3xs font-mono font-semibold text-secondary bg-secondary/10 border border-secondary/25 px-1.5 py-0.5 rounded">
                                    Recommended
                                </span>
                            </div>
                            <p className="text-xs text-muted leading-relaxed">
                                Removes your IPv4, IPv6, ISP, and city so the link is safe to paste in public GitHub issues or Discord chats.
                            </p>
                        </div>
                    </label>

                    <div>
                        <label htmlFor="share-url-input" className="block text-xs font-semibold text-ink mb-1.5">
                            Generated Diagnostic Link
                        </label>
                        <div className="flex items-stretch gap-2">
                            <input
                                id="share-url-input"
                                type="text"
                                readOnly
                                value={shareUrl}
                                onFocus={(e) => e.target.select()}
                                className="flex-1 px-3 py-2 rounded-lg bg-canvas border border-line-strong font-mono text-xs text-ink focus:outline-none focus:border-secondary truncate"
                            />
                            <button
                                type="button"
                                onClick={copyToClipboard}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-foreground font-bold text-xs rounded-lg hover:bg-primary-dark transition-colors flex-shrink-0 cursor-pointer"
                            >
                                {copied ? <Check size={14} strokeWidth={2.5} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                                <span>{copied ? "Copied" : "Copy"}</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs text-muted bg-well/40 p-3 rounded-xl border border-line">
                        <Shield size={15} className="text-secondary flex-shrink-0" aria-hidden="true" />
                        <span>
                            Your system details live inside the URL parameters themselves—never uploaded to any server.
                        </span>
                    </div>
                </div>

                <div className="px-5 sm:px-6 py-4 border-t border-line bg-well/40 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-line-strong text-ink font-semibold text-xs hover:bg-hover transition-colors cursor-pointer"
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        onClick={copyToClipboard}
                        className="inline-flex items-center gap-2 px-5 py-2 bg-brand text-white font-semibold text-xs rounded-lg hover:opacity-95 transition-opacity cursor-pointer"
                    >
                        <Copy size={13} aria-hidden="true" />
                        <span>{copied ? "Copied Link" : "Copy Share Link"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
