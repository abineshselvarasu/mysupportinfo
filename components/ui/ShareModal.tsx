"use client";

import React, { useState, useEffect, useId } from "react";
import { Share2, X, Copy, Check, Shield, Globe } from "lucide-react";
import { encodeReport, isMaskedValue } from "@/lib/report-share";
import { copyToClipboard as writeClipboardText } from "@/lib/clipboard";

export interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    webrtcLeak?: string;
    stats: {
        browserName?: string;
        browserVersion?: string;
        osName?: string;
        resolution?: string;
        windowSize?: string;
        pixelRatio?: string;
        colorDepth?: string;
        orientation?: string;
        touchSupport?: string;
        cpuCores?: number | string;
        ram?: string;
        webglVendor?: string;
        batteryLevel?: string;
        batteryCharging?: string;
        language?: string;
        persistence?: string;
        doNotTrack?: string;
        globalPrivacyControl?: string;
        adBlocker?: string;
        ip?: string;
        ipv6?: string;
        ispName?: string;
        city?: string;
        country?: string;
        countryCode?: string;
        vpnDetected?: boolean;
        latency?: string;
        connectionType?: string;
        connectionSpeed?: string;
        userAgent?: string;
        timezone?: string;
    } | null;
}

export default function ShareModal({ isOpen, onClose, stats, webrtcLeak }: ShareModalProps) {
    const [maskSensitive, setMaskSensitive] = useState(false);
    const [copied, setCopied] = useState(false);
    const [shareUrl, setShareUrl] = useState("");
    const titleId = useId();
    const sourceAlreadyMasked = isMaskedValue(stats?.ip);
    const effectiveMask = sourceAlreadyMasked ? true : maskSensitive;

    useEffect(() => {
        if (!isOpen) {
            setCopied(false);
            return;
        }
        if (!stats || typeof window === "undefined") return;
        const encoded = encodeReport({ ...stats, webrtcLeak }, effectiveMask);
        setShareUrl(`${window.location.origin}/?report=${encoded}`);
    }, [isOpen, stats, webrtcLeak, effectiveMask]);

    const selectShareMode = (nextMask: boolean) => {
        if (sourceAlreadyMasked && !nextMask) return;
        setMaskSensitive(nextMask);
        setCopied(false);
    };

    const locationSummary = [stats?.city, stats?.country].filter(Boolean).join(", ");
    const fullInfoPreview = sourceAlreadyMasked
        ? "Unavailable — sender hid IP & location in this snapshot"
        : [stats?.ip, stats?.ispName, locationSummary]
              .filter((v) => v && v !== "Unavailable" && v !== "Unknown" && v !== "Unknown ISP")
              .join(" · ") || "Detecting network details…";

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
        if (await writeClipboardText(shareUrl)) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
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
            <div className="relative w-full max-w-lg bg-surface text-ink border border-line-strong shadow-elevated rounded-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto">
                <div className="flex items-start justify-between p-4 sm:p-5 border-b border-line bg-well/40 flex-shrink-0">
                    <div className="flex items-start gap-3">
                        <div className="size-9 rounded-xl bg-brand text-white flex items-center justify-center flex-shrink-0">
                            <Share2 size={17} aria-hidden="true" />
                        </div>
                        <div>
                            <h3 id={titleId} className="text-base sm:text-lg font-bold text-ink">
                                Share Diagnostic Link
                            </h3>
                            <p className="text-xs text-muted mt-0.5 leading-relaxed">
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

                <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
                    <div className="space-y-2.5">
                        <span className="block text-xs font-semibold text-ink">
                            What Should This Link Include?
                        </span>
                        <div role="radiogroup" aria-label="Shared report privacy level" className="grid grid-cols-1 gap-2.5">
                            <button
                                type="button"
                                role="radio"
                                aria-checked={!effectiveMask}
                                disabled={sourceAlreadyMasked}
                                onClick={() => selectShareMode(false)}
                                className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-colors ${
                                    sourceAlreadyMasked
                                        ? "opacity-50 cursor-not-allowed bg-well/30 border-line"
                                        : !effectiveMask
                                        ? "bg-secondary/5 border-secondary cursor-pointer"
                                        : "bg-well/40 border-line hover:border-line-strong cursor-pointer"
                                }`}
                            >
                                <Globe
                                    size={16}
                                    className={!effectiveMask ? "text-secondary mt-0.5 flex-shrink-0" : "text-muted mt-0.5 flex-shrink-0"}
                                    aria-hidden="true"
                                />
                                <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-bold text-ink">Include IP, ISP &amp; Location</span>
                                            <span className="text-3xs font-mono font-semibold text-secondary bg-secondary/10 border border-secondary/25 px-1.5 py-0.5 rounded">
                                                Support Ready
                                            </span>
                                        </div>
                                        <span
                                            className={`size-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                                                !effectiveMask ? "border-secondary bg-secondary" : "border-line-strong bg-canvas"
                                            }`}
                                            aria-hidden="true"
                                        >
                                            {!effectiveMask && <span className="size-1.5 rounded-full bg-white" />}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted leading-relaxed">
                                        Shows your IPv4, IPv6, ISP, approximate city, and WebRTC check along with browser &amp; screen specs.
                                    </p>
                                    <div className="font-mono text-2xs text-ink/85 bg-surface/80 border border-line px-2 py-1 rounded truncate">
                                        {fullInfoPreview}
                                    </div>
                                </div>
                            </button>

                            <button
                                type="button"
                                role="radio"
                                aria-checked={effectiveMask}
                                onClick={() => selectShareMode(true)}
                                className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                                    effectiveMask
                                        ? "bg-secondary/5 border-secondary"
                                        : "bg-well/40 border-line hover:border-line-strong"
                                }`}
                            >
                                <Shield
                                    size={16}
                                    className={effectiveMask ? "text-secondary mt-0.5 flex-shrink-0" : "text-muted mt-0.5 flex-shrink-0"}
                                    aria-hidden="true"
                                />
                                <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-bold text-ink">Hide IP &amp; Location</span>
                                            <span className="text-3xs font-mono font-semibold text-muted bg-well border border-line px-1.5 py-0.5 rounded">
                                                Public Safe
                                            </span>
                                        </div>
                                        <span
                                            className={`size-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                                                effectiveMask ? "border-secondary bg-secondary" : "border-line-strong bg-canvas"
                                            }`}
                                            aria-hidden="true"
                                        >
                                            {effectiveMask && <span className="size-1.5 rounded-full bg-white" />}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted leading-relaxed">
                                        Redacts IPv4, IPv6, ISP, city, and exposed WebRTC IPs so the URL is safe for public forums or GitHub issues.
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>

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

                <div className="px-4 sm:px-5 py-3.5 border-t border-line bg-well/40 flex items-center justify-between flex-shrink-0">
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
