"use client";

import React, { useState, useEffect, useId } from "react";
import { AlertCircle, X, Mail, Copy, Check, Terminal, ExternalLink } from "lucide-react";

export interface ReportErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
    systemStats?: {
        browserName?: string;
        browserVersion?: string;
        osName?: string;
        ip?: string;
        resolution?: string;
        windowSize?: string;
        userAgent?: string;
        webglVendor?: string;
    } | null;
}

export default function ReportErrorModal({ isOpen, onClose, systemStats }: ReportErrorModalProps) {
    const titleId = useId();
    const [selectedMetric, setSelectedMetric] = useState<string>("browser");
    const [expectedValue, setExpectedValue] = useState<string>("");
    const [userNotes, setUserNotes] = useState<string>("");
    const [copied, setCopied] = useState<boolean>(false);

    // Prevent body scroll when modal is open
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

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const buildDiagnosticPayload = () => {
        return [
            `--- MYSUPPORTINFO DETECTION ERROR REPORT ---`,
            `Metric Reported: ${selectedMetric.toUpperCase()}`,
            `Expected Value:  ${expectedValue || "(Not specified)"}`,
            `User Notes:      ${userNotes || "(None)"}`,
            ``,
            `--- DETECTED SPECS ---`,
            `Browser:     ${systemStats?.browserName || "Unknown"} ${systemStats?.browserVersion || ""}`.trim(),
            `Platform/OS: ${systemStats?.osName || "Unknown"}`,
            `Public IP:   ${systemStats?.ip || "Unknown"}`,
            `Resolution:  ${systemStats?.resolution || "Unknown"} (Viewport: ${systemStats?.windowSize || "Unknown"})`,
            `GPU/WebGL:   ${systemStats?.webglVendor || "Unknown"}`,
            `User Agent:  ${systemStats?.userAgent || (typeof navigator !== "undefined" ? navigator.userAgent : "Unknown")}`,
            `Timestamp:   ${new Date().toISOString()}`,
            `Report URL:  https://mysupportinfo.com`,
        ].join("\n");
    };

    const handleCopyPayload = async () => {
        const payload = buildDiagnosticPayload();
        try {
            await navigator.clipboard.writeText(payload);
            setCopied(true);
            setTimeout(() => setCopied(false), 2200);
        } catch {
            // fallback
        }
    };

    const getMailtoLink = () => {
        const subject = encodeURIComponent(`Detection Error Report: ${selectedMetric.toUpperCase()} - MySupportInfo`);
        const body = encodeURIComponent(
            `Hi MySupportInfo Team,\n\nI noticed an incorrect detection on https://mysupportinfo.com.\n\n` +
            `Metric with issue: ${selectedMetric}\n` +
            `What I actually use: ${expectedValue || "[Please describe your real browser/OS/hardware]"}\n` +
            `Additional notes: ${userNotes || "[Any additional details]"}\n\n` +
            `System Diagnostic Dump:\n${buildDiagnosticPayload()}`
        );
        return `mailto:support@mysupportinfo.com?subject=${subject}&body=${body}`;
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-background-dark/80 backdrop-blur-sm overflow-y-auto"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
        >
            <div className="relative w-full max-w-2xl bg-white border-2 border-background-dark shadow-block rounded-3xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
                {/* ── Header ────────────────────────────────────────── */}
                <div className="flex items-start justify-between p-5 sm:p-6 border-b-2 border-background-dark/10 bg-background/30">
                    <div className="flex items-start gap-3.5">
                        <div className="p-2.5 rounded-2xl bg-primary border-2 border-background-dark text-background-dark shadow-block-sm flex-shrink-0 mt-0.5">
                            <AlertCircle size={22} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 id={titleId} className="font-serif text-xl sm:text-2xl font-bold text-background-dark">
                                    Report a Detection Error
                                </h3>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-4xs font-extrabold uppercase tracking-wider bg-background-dark text-white font-mono">
                                    Engineering Feedback
                                </span>
                            </div>
                            <p className="text-xs text-background-dark/70 mt-1 leading-relaxed font-medium">
                                Spotted an inaccurate browser version, OS, IP, or GPU string? Submit a report so our engineering team can refine our client-side detection rules.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close error report dialog"
                        className="p-1.5 rounded-xl border-2 border-background-dark/20 text-background-dark/70 hover:text-background-dark hover:border-background-dark hover:bg-background-dark/5 transition-all flex-shrink-0 cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* ── Form Body (Scrollable) ────────────────────────── */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
                    {/* Metric Selector */}
                    <div>
                        <label className="block text-2xs font-bold uppercase tracking-wider text-background-dark mb-1.5">
                            Which metric is incorrect?
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                                { id: "browser", label: "Browser" },
                                { id: "os", label: "Operating System" },
                                { id: "ip", label: "IP / Location" },
                                { id: "gpu", label: "WebGL / GPU" },
                                { id: "screen", label: "Screen / DPR" },
                                { id: "webrtc", label: "WebRTC" },
                                { id: "latency", label: "Network Latency" },
                                { id: "other", label: "Other / General" },
                            ].map((m) => (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => setSelectedMetric(m.id)}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all text-left ${
                                        selectedMetric === m.id
                                            ? "bg-secondary text-white border-background-dark shadow-block-sm"
                                            : "bg-white text-background-dark border-background-dark/20 hover:border-background-dark/40"
                                    }`}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Expected Value */}
                    <div>
                        <label htmlFor="expected-val" className="block text-2xs font-bold uppercase tracking-wider text-background-dark mb-1.5">
                            What is your actual configuration?
                        </label>
                        <input
                            id="expected-val"
                            type="text"
                            value={expectedValue}
                            onChange={(e) => setExpectedValue(e.target.value)}
                            placeholder="e.g. Chrome 132 on Windows 11, or 1Gbps Fiber connection..."
                            className="w-full px-3.5 py-2.5 rounded-xl border-2 border-background-dark/25 focus:border-background-dark focus:outline-none text-xs font-medium text-background-dark bg-white"
                        />
                    </div>

                    {/* Additional Notes */}
                    <div>
                        <label htmlFor="user-notes" className="block text-2xs font-bold uppercase tracking-wider text-background-dark mb-1.5">
                            Additional Details (Optional)
                        </label>
                        <textarea
                            id="user-notes"
                            rows={2}
                            value={userNotes}
                            onChange={(e) => setUserNotes(e.target.value)}
                            placeholder="e.g. Using Brave with Shields active, or running inside a virtual machine..."
                            className="w-full px-3.5 py-2 rounded-xl border-2 border-background-dark/25 focus:border-background-dark focus:outline-none text-xs font-medium text-background-dark bg-white resize-none"
                        />
                    </div>

                    {/* Auto-populated Diagnostic Telemetry Box */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-3xs font-bold uppercase tracking-wider text-background-dark/70 flex items-center gap-1.5">
                                <Terminal size={12} className="text-primary" />
                                Auto-Attached Diagnostic Telemetry
                            </span>
                            <span className="text-4xs text-background-dark/50 font-mono">
                                Will be included in your email report
                            </span>
                        </div>
                        <div className="bg-background-dark text-accent/90 p-3 rounded-xl font-mono text-3xs leading-relaxed max-h-28 overflow-y-auto border border-background-dark/30 select-all">
                            <div>Browser: {systemStats?.browserName || "Unknown"} {systemStats?.browserVersion || ""}</div>
                            <div>OS: {systemStats?.osName || "Unknown"}</div>
                            <div>IP: {systemStats?.ip || "Unknown"}</div>
                            <div>Screen: {systemStats?.resolution || "Unknown"} (Viewport: {systemStats?.windowSize || "Unknown"})</div>
                            <div>GPU: {systemStats?.webglVendor || "Unknown"}</div>
                            <div className="truncate">UA: {systemStats?.userAgent || "Unknown"}</div>
                        </div>
                    </div>

                    {/* Official Domain Support Notice */}
                    <div className="p-3.5 rounded-2xl bg-primary/15 border-2 border-primary/30 flex items-start gap-3">
                        <Mail size={18} className="text-background-dark mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-background-dark leading-relaxed font-medium">
                            <span>Direct support channels: </span>
                            <a href="mailto:support@mysupportinfo.com" className="font-bold underline underline-offset-2">
                                support@mysupportinfo.com
                            </a>
                            <span> &middot; </span>
                            <a href="mailto:contact@mysupportinfo.com" className="font-bold underline underline-offset-2">
                                contact@mysupportinfo.com
                            </a>
                            <p className="text-3xs text-background-dark/70 mt-0.5">
                                Official Zoho domain mail hosted on mysupportinfo.com. Tickets are reviewed within 24 hours.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Footer ────────────────────────────────────────── */}
                <div className="p-4 sm:p-5 border-t-2 border-background-dark/10 bg-background/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-3xs text-background-dark/60 font-medium text-center sm:text-left">
                        Zero telemetry data is stored on our servers until you submit your email report.
                    </p>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap justify-end">
                        <button
                            type="button"
                            onClick={handleCopyPayload}
                            className="px-4 py-2.5 rounded-xl border-2 border-background-dark/30 text-background-dark font-bold text-xs hover:border-background-dark hover:bg-background-dark/5 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            {copied ? <Check size={14} className="text-secondary" /> : <Copy size={14} />}
                            <span>{copied ? "Copied Payload!" : "Copy Payload"}</span>
                        </button>
                        <a
                            href={getMailtoLink()}
                            onClick={onClose}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-primary border-2 border-background-dark shadow-block-sm text-background-dark font-black uppercase tracking-wider rounded-xl text-xs hover:bg-primary-dark active:translate-x-px active:translate-y-px active:shadow-none transition-all cursor-pointer"
                        >
                            <Mail size={14} />
                            <span>Send to support@mysupportinfo.com</span>
                            <ExternalLink size={12} className="opacity-70" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
