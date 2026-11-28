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

    const buildDiagnosticPayload = () =>
        [
            "--- MYSUPPORTINFO DETECTION ERROR REPORT ---",
            `Metric Reported: ${selectedMetric.toUpperCase()}`,
            `Expected Value:  ${expectedValue || "(Not specified)"}`,
            `User Notes:      ${userNotes || "(None)"}`,
            "",
            "--- DETECTED SPECS ---",
            `Browser:     ${systemStats?.browserName || "Unknown"} ${systemStats?.browserVersion || ""}`.trim(),
            `Platform/OS: ${systemStats?.osName || "Unknown"}`,
            `Public IP:   ${systemStats?.ip || "Unknown"}`,
            `Resolution:  ${systemStats?.resolution || "Unknown"} (Viewport: ${systemStats?.windowSize || "Unknown"})`,
            `GPU/WebGL:   ${systemStats?.webglVendor || "Unknown"}`,
            `User Agent:  ${systemStats?.userAgent || (typeof navigator !== "undefined" ? navigator.userAgent : "Unknown")}`,
            `Timestamp:   ${new Date().toISOString()}`,
            "Report URL:  https://mysupportinfo.com",
        ].join("\n");

    const handleCopyPayload = async () => {
        try {
            await navigator.clipboard.writeText(buildDiagnosticPayload());
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
            `What I actually use: ${expectedValue || "[Please describe your real setup]"}\n` +
            `Additional notes: ${userNotes || "[Optional details]"}\n\n` +
            `System Diagnostic Dump:\n${buildDiagnosticPayload()}`
        );
        return `mailto:report@mysupportinfo.com?subject=${subject}&body=${body}`;
    };

    const metricOptions = [
        { id: "browser", label: "Browser" },
        { id: "os", label: "Operating System" },
        { id: "ip", label: "IP / Location" },
        { id: "gpu", label: "WebGL / GPU" },
        { id: "screen", label: "Screen / DPR" },
        { id: "webrtc", label: "WebRTC" },
        { id: "latency", label: "Network Latency" },
        { id: "other", label: "Other" },
    ];

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
            <div className="relative w-full max-w-2xl bg-surface text-ink border border-line-strong shadow-elevated rounded-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto">
                <div className="flex items-start justify-between p-5 sm:p-6 border-b border-line bg-well/40">
                    <div className="flex items-start gap-3">
                        <div className="size-10 rounded-xl bg-primary text-foreground flex items-center justify-center flex-shrink-0">
                            <AlertCircle size={18} aria-hidden="true" />
                        </div>
                        <div>
                            <h3 id={titleId} className="text-lg sm:text-xl font-bold text-ink">
                                Report a Detection Issue
                            </h3>
                            <p className="text-xs text-muted mt-1 leading-relaxed">
                                Notice a wrong browser, OS, GPU, or IP readout? Send the snapshot below to help refine our client-side detection rules.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close error report dialog"
                        className="p-1.5 rounded-lg border border-line text-muted hover:text-ink hover:border-line-strong transition-colors flex-shrink-0 cursor-pointer"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
                    <div>
                        <span className="block text-xs font-bold text-ink mb-2">Which detail looks wrong?</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {metricOptions.map((m) => (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => setSelectedMetric(m.id)}
                                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors text-left cursor-pointer ${
                                        selectedMetric === m.id
                                            ? "bg-secondary text-white border-secondary"
                                            : "bg-canvas text-ink border-line hover:border-line-strong"
                                    }`}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="expected-val" className="block text-xs font-bold text-ink mb-1.5">
                            What is your actual setup?
                        </label>
                        <input
                            id="expected-val"
                            type="text"
                            value={expectedValue}
                            onChange={(e) => setExpectedValue(e.target.value)}
                            placeholder="e.g. Brave 1.75 on macOS Sonoma, or 1 Gbps fiber connection"
                            className="w-full px-3.5 py-2.5 rounded-lg border border-line-strong focus:border-secondary focus:outline-none text-xs text-ink bg-canvas"
                        />
                    </div>

                    <div>
                        <label htmlFor="user-notes" className="block text-xs font-bold text-ink mb-1.5">
                            Additional Notes (Optional)
                        </label>
                        <textarea
                            id="user-notes"
                            rows={2}
                            value={userNotes}
                            onChange={(e) => setUserNotes(e.target.value)}
                            placeholder="e.g. Using VPN, custom privacy flags, or external display..."
                            className="w-full px-3.5 py-2 rounded-lg border border-line-strong focus:border-secondary focus:outline-none text-xs text-ink bg-canvas resize-none"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-muted inline-flex items-center gap-1.5">
                                <Terminal size={13} className="text-primary" aria-hidden="true" />
                                Telemetry Snapshot Included
                            </span>
                            <span className="text-2xs font-mono text-muted">Generated locally</span>
                        </div>
                        <div className="bg-brand text-white p-3.5 rounded-xl font-mono text-2xs leading-relaxed max-h-28 overflow-y-auto select-all space-y-0.5">
                            <div>Browser: {systemStats?.browserName || "Unknown"} {systemStats?.browserVersion || ""}</div>
                            <div>OS: {systemStats?.osName || "Unknown"}</div>
                            <div>IP: {systemStats?.ip || "Unknown"}</div>
                            <div>Display: {systemStats?.resolution || "Unknown"} (Viewport: {systemStats?.windowSize || "Unknown"})</div>
                            <div>GPU: {systemStats?.webglVendor || "Unknown"}</div>
                            <div className="truncate">UA: {systemStats?.userAgent || "Unknown"}</div>
                        </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-well/60 border border-line flex items-start gap-2.5 text-xs text-muted">
                        <Mail size={16} className="text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
                        <div>
                            Direct email: <a href="mailto:report@mysupportinfo.com" className="font-semibold text-ink underline underline-offset-2">report@mysupportinfo.com</a>{" "}
                            &middot; <a href="mailto:contact@mysupportinfo.com" className="font-semibold text-ink underline underline-offset-2">contact@mysupportinfo.com</a>
                        </div>
                    </div>
                </div>

                <div className="px-5 sm:px-6 py-4 border-t border-line bg-well/40 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                    <p className="text-xs text-muted">Nothing is sent automatically until you send your email.</p>
                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                        <button
                            type="button"
                            onClick={handleCopyPayload}
                            className="px-4 py-2 rounded-lg border border-line-strong bg-surface text-ink font-semibold text-xs hover:bg-hover transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        >
                            {copied ? <Check size={14} className="text-secondary" aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                            <span>{copied ? "Copied" : "Copy Details"}</span>
                        </button>
                        <a
                            href={getMailtoLink()}
                            onClick={onClose}
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2 bg-primary text-foreground font-bold rounded-lg text-xs hover:bg-primary-dark transition-colors cursor-pointer"
                        >
                            <Mail size={14} aria-hidden="true" />
                            <span>Send Report Email</span>
                            <ExternalLink size={12} aria-hidden="true" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
