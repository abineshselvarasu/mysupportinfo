"use client";

import React, { useState, useEffect, useId } from "react";
import {
    Download, X, Shield, Check, Globe, Wifi, Monitor,
    HardDrive, Cpu, Palette, Lock, EyeOff, Terminal,
    Activity, Clock, AlertTriangle, CheckSquare
} from "lucide-react";

export type FieldId =
    | "browser"
    | "os"
    | "language"
    | "js"
    | "ip"
    | "isp"
    | "location"
    | "latency"
    | "screen"
    | "viewport"
    | "hardware"
    | "gpu"
    | "battery"
    | "clock"
    | "webrtc"
    | "cookies"
    | "privacy"
    | "userAgent";

export interface SystemStatsSummary {
    browserName?: string;
    browserVersion?: string;
    osName?: string;
    language?: string;
    ip?: string;
    ipv6?: string;
    ispName?: string;
    city?: string;
    country?: string;
    countryCode?: string;
    latency?: string;
    connectionType?: string;
    connectionSpeed?: string;
    resolution?: string;
    windowSize?: string;
    pixelRatio?: string;
    colorDepth?: string;
    cpuCores?: number | string;
    ram?: string;
    webglVendor?: string;
    batteryLevel?: string;
    batteryCharging?: string;
    touchSupport?: string;
    persistence?: string;
    doNotTrack?: string;
    adBlocker?: string;
    userAgent?: string;
    timezone?: string;
}

export interface ScreenshotFieldDef {
    id: FieldId;
    title: string;
    category: "system" | "network" | "hardware" | "privacy";
    isSensitive?: boolean;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    getPreview: (stats: SystemStatsSummary | null, webrtcLeak?: string, currentTime?: string) => string;
}

export const SCREENSHOT_FIELDS: ScreenshotFieldDef[] = [
    // Browser & System
    {
        id: "browser",
        title: "Browser & Version",
        category: "system",
        icon: Globe,
        getPreview: (s) => (s ? `${s.browserName || "Unknown"} ${s.browserVersion || ""}`.trim() : "Detecting…"),
    },
    {
        id: "os",
        title: "Operating System",
        category: "system",
        icon: HardDrive,
        getPreview: (s) => s?.osName || "Detecting…",
    },
    {
        id: "language",
        title: "Language & Locale",
        category: "system",
        icon: Globe,
        getPreview: (s) => s?.language || "Detecting…",
    },
    {
        id: "js",
        title: "JavaScript Engine",
        category: "system",
        icon: Terminal,
        getPreview: () => "Enabled (Active)",
    },

    // Network & Location (Sensitive PII)
    {
        id: "ip",
        title: "Public IP (IPv4 & IPv6)",
        category: "network",
        isSensitive: true,
        icon: Globe,
        getPreview: (s) => s?.ip || "Scanning…",
    },
    {
        id: "isp",
        title: "ISP & Network Provider",
        category: "network",
        isSensitive: true,
        icon: Wifi,
        getPreview: (s) => s?.ispName || "Scanning…",
    },
    {
        id: "location",
        title: "City & Country Location",
        category: "network",
        isSensitive: true,
        icon: Globe,
        getPreview: (s) => [s?.city, s?.country].filter(Boolean).join(", ") || "Location unknown",
    },
    {
        id: "latency",
        title: "Latency & Speed",
        category: "network",
        icon: Activity,
        getPreview: (s) => s?.latency ? `${s.latency} RTT` : "Measuring…",
    },

    // Hardware & Display
    {
        id: "screen",
        title: "Screen Resolution & Colors",
        category: "hardware",
        icon: Monitor,
        getPreview: (s) => s?.resolution ? `${s.resolution} (${s.colorDepth || "24-bit"})` : "Detecting…",
    },
    {
        id: "viewport",
        title: "Viewport & Pixel Ratio",
        category: "hardware",
        icon: Monitor,
        getPreview: (s) => s?.windowSize ? `${s.windowSize} (DPR: ${s.pixelRatio || "1x"})` : "Detecting…",
    },
    {
        id: "hardware",
        title: "CPU Threads & RAM",
        category: "hardware",
        icon: Cpu,
        getPreview: (s) => s ? `${s.cpuCores || "Unknown"} cores · ${s.ram || "Unknown"}` : "Detecting…",
    },
    {
        id: "gpu",
        title: "GPU / WebGL Graphics",
        category: "hardware",
        icon: Palette,
        getPreview: (s) => s?.webglVendor ? `${s.webglVendor.slice(0, 24)}…` : "Detecting…",
    },
    {
        id: "battery",
        title: "Battery & Touch",
        category: "hardware",
        icon: Activity,
        getPreview: (s) => s?.batteryLevel && s.batteryLevel !== "N/A" ? `${s.batteryLevel} (${s.batteryCharging})` : "Desktop / Touch: " + (s?.touchSupport || "No"),
    },
    {
        id: "clock",
        title: "Timezone & System Clock",
        category: "hardware",
        icon: Clock,
        getPreview: (s, _, time) => s?.timezone ? `${s.timezone} · ${time || ""}`.trim() : "Detecting…",
    },

    // Privacy & Security
    {
        id: "webrtc",
        title: "WebRTC Leak Protection",
        category: "privacy",
        isSensitive: true,
        icon: Shield,
        getPreview: (_, leak) => leak || "Protected",
    },
    {
        id: "cookies",
        title: "Cookies Acceptance",
        category: "privacy",
        icon: Lock,
        getPreview: (s) => s?.persistence || "ENABLED",
    },
    {
        id: "privacy",
        title: "Do Not Track & Ad Blocker",
        category: "privacy",
        icon: EyeOff,
        getPreview: (s) => s ? `DNT: ${s.doNotTrack || "Off"} · Ads: ${s.adBlocker || "Off"}` : "Detecting…",
    },
    {
        id: "userAgent",
        title: "Full User Agent String",
        category: "privacy",
        isSensitive: true,
        icon: Terminal,
        getPreview: (s) => s?.userAgent ? `${s.userAgent.slice(0, 32)}…` : "Detecting…",
    },
];

const ALL_FIELD_IDS: FieldId[] = SCREENSHOT_FIELDS.map((f) => f.id);
const SENSITIVE_FIELD_IDS: Set<FieldId> = new Set(
    SCREENSHOT_FIELDS.filter((f) => f.isSensitive).map((f) => f.id)
);

export const DEFAULT_SELECTED_FIELDS = new Set<FieldId>(ALL_FIELD_IDS);

export interface ScreenshotModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (selectedFields: Set<FieldId>) => Promise<void>;
    stats: SystemStatsSummary | null;
    webrtcLeak?: string;
    currentTime?: string;
    downloading: boolean;
}

export default function ScreenshotModal({
    isOpen,
    onClose,
    onCapture,
    stats,
    webrtcLeak,
    currentTime,
    downloading,
}: ScreenshotModalProps) {
    const [selectedFields, setSelectedFields] = useState<Set<FieldId>>(
        new Set<FieldId>(ALL_FIELD_IDS)
    );
    const titleId = useId();

    // Prevent body scrolling when open
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
            if (e.key === "Escape" && isOpen && !downloading) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, downloading, onClose]);

    if (!isOpen) return null;

    const toggleField = (id: FieldId) => {
        setSelectedFields((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                // Ensure at least one field remains selected
                if (next.size > 1) next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // Preset 1: Mask Sensitive IP & Geolocation (Safe for Support Tickets)
    const applyMaskSensitive = () => {
        const safe = new Set<FieldId>(
            ALL_FIELD_IDS.filter((id) => !SENSITIVE_FIELD_IDS.has(id))
        );
        setSelectedFields(safe);
    };

    // Preset 2: Select All Fields
    const applySelectAll = () => {
        setSelectedFields(new Set<FieldId>(ALL_FIELD_IDS));
    };

    // Preset 3: Web Dev Quick Bug Report (Browser, OS, Screen, Viewport, JS, Cookies)
    const applyWebDevBasics = () => {
        setSelectedFields(
            new Set<FieldId>(["browser", "os", "screen", "viewport", "js", "cookies", "language"])
        );
    };

    // Handle capture submission
    const handleDownload = async () => {
        await onCapture(selectedFields);
    };

    interface CategoryDef {
        id: "system" | "network" | "hardware" | "privacy";
        name: string;
        description: string;
        badge?: string;
    }

    const categories: CategoryDef[] = [
        {
            id: "system",
            name: "Browser & System",
            description: "Core browser engine, host platform, and runtime environment",
        },
        {
            id: "network",
            name: "Network & Connection",
            description: "IP routing, ISP carrier, speed and latency metrics",
            badge: "Contains Sensitive PII",
        },
        {
            id: "hardware",
            name: "Display & Hardware",
            description: "Screen resolution, viewport dimensions, processor and memory",
        },
        {
            id: "privacy",
            name: "Privacy & Security",
            description: "WebRTC leak posture, cookies, ad blocker and browser identifiers",
        },
    ];

    const isSensitiveMasked = [...SENSITIVE_FIELD_IDS].every((id) => !selectedFields.has(id));

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-background-dark/75 backdrop-blur-sm overflow-y-auto"
            onClick={(e) => {
                if (e.target === e.currentTarget && !downloading) onClose();
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
        >
            <div className="relative w-full max-w-3xl bg-background border-2 border-background-dark shadow-block rounded-3xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
                {/* ── Header ────────────────────────────────────────── */}
                <div className="flex items-start justify-between p-5 sm:p-6 border-b-2 border-background-dark/10 bg-white/70">
                    <div className="flex items-start gap-3.5">
                        <div className="p-2.5 rounded-2xl bg-primary border-2 border-background-dark text-background-dark shadow-block-sm flex-shrink-0 mt-0.5">
                            <Download size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 id={titleId} className="font-serif text-xl sm:text-2xl font-bold text-background-dark">
                                    Screenshot Options
                                </h3>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-extrabold uppercase tracking-wider bg-background-dark text-white font-mono">
                                    {selectedFields.size} / {ALL_FIELD_IDS.length} Included
                                </span>
                            </div>
                            <p className="text-xs text-background-dark/70 mt-1 leading-relaxed font-medium">
                                Choose which diagnostic cards appear on your downloaded PNG card. Redact sensitive info before sharing in public support tickets.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={downloading}
                        aria-label="Close screenshot options"
                        className="p-1.5 rounded-xl border-2 border-background-dark/20 text-background-dark/70 hover:text-background-dark hover:border-background-dark hover:bg-background-dark/5 transition-all flex-shrink-0 disabled:opacity-40"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* ── Presets Toolbar ───────────────────────────────── */}
                <div className="px-5 sm:px-6 py-3 bg-background-dark/5 border-b-2 border-background-dark/10 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-4xs font-bold uppercase tracking-wider text-background-dark/60 mr-1 hidden sm:inline">
                            Quick Presets:
                        </span>
                        <button
                            type="button"
                            onClick={applyMaskSensitive}
                            disabled={downloading}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-3xs font-bold transition-all border-2 ${
                                isSensitiveMasked
                                    ? "bg-secondary text-white border-background-dark shadow-block-sm"
                                    : "bg-white text-background-dark border-background-dark/30 hover:border-background-dark hover:bg-white"
                            }`}
                        >
                            <Shield size={12} className={isSensitiveMasked ? "text-white" : "text-secondary"} />
                            <span>Mask IP &amp; Location (Safe)</span>
                        </button>

                        <button
                            type="button"
                            onClick={applyWebDevBasics}
                            disabled={downloading}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-3xs font-bold bg-white text-background-dark border-2 border-background-dark/30 hover:border-background-dark hover:bg-white transition-all"
                        >
                            <Monitor size={12} className="text-primary" />
                            <span>Web Dev Basics</span>
                        </button>

                        <button
                            type="button"
                            onClick={applySelectAll}
                            disabled={downloading}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-3xs font-bold bg-white text-background-dark border-2 border-background-dark/30 hover:border-background-dark hover:bg-white transition-all"
                        >
                            <CheckSquare size={12} className="text-background-dark/70" />
                            <span>Select All</span>
                        </button>
                    </div>

                    {isSensitiveMasked && (
                        <div className="inline-flex items-center gap-1.5 text-4xs font-bold uppercase tracking-wider text-secondary bg-secondary/10 px-2 py-1 rounded-lg border border-secondary/20">
                            <span>&#10003;</span>
                            <span>PII Protected</span>
                        </div>
                    )}
                </div>

                {/* ── Checkbox Items Body (Scrollable) ─────────────── */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
                    {categories.map((category) => {
                        const fieldsInCategory = SCREENSHOT_FIELDS.filter(
                            (f) => f.category === category.id
                        );
                        return (
                            <div key={category.id} className="space-y-2.5">
                                <div className="flex items-center justify-between pb-1 border-b border-background-dark/10">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-xs font-bold uppercase tracking-ui-wide text-background-dark">
                                            {category.name}
                                        </h4>
                                        {category.badge && (
                                            <span className="inline-flex items-center gap-1 text-5xs font-black uppercase tracking-wider bg-yellow-100 text-yellow-800 border border-yellow-300 px-2 py-0.5 rounded-full">
                                                <AlertTriangle size={9} />
                                                {category.badge}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-4xs text-background-dark/50 font-medium">
                                        {fieldsInCategory.filter((f) => selectedFields.has(f.id)).length} of {fieldsInCategory.length} on
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                    {fieldsInCategory.map((field) => {
                                        const isSelected = selectedFields.has(field.id);
                                        const preview = field.getPreview(stats, webrtcLeak, currentTime);
                                        const Icon = field.icon;

                                        return (
                                            <button
                                                key={field.id}
                                                type="button"
                                                onClick={() => toggleField(field.id)}
                                                disabled={downloading}
                                                className={`group p-3 rounded-2xl border-2 text-left flex flex-col justify-between transition-all duration-150 ${
                                                    isSelected
                                                        ? "bg-white border-background-dark shadow-block-sm hover:translate-x-px hover:translate-y-px"
                                                        : "bg-background-dark/5 border-background-dark/15 opacity-60 hover:opacity-90 hover:border-background-dark/40"
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2 mb-2 w-full">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className={`p-1 rounded-lg ${
                                                                isSelected
                                                                    ? field.isSensitive
                                                                        ? "bg-yellow-100 text-yellow-800"
                                                                        : "bg-primary/10 text-primary"
                                                                    : "bg-background-dark/10 text-background-dark/40"
                                                            }`}
                                                        >
                                                            <Icon size={13} />
                                                        </div>
                                                        <span className="text-3xs font-bold text-background-dark leading-tight">
                                                            {field.title}
                                                        </span>
                                                    </div>

                                                    <div
                                                        className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                                                            isSelected
                                                                ? "bg-secondary border-secondary text-white"
                                                                : "border-background-dark/30 bg-white"
                                                        }`}
                                                        aria-hidden="true"
                                                    >
                                                        {isSelected && <Check size={11} strokeWidth={3} />}
                                                    </div>
                                                </div>

                                                <div className="mt-auto pt-1 w-full">
                                                    <div className="font-mono text-3xs text-background-dark/75 truncate font-medium bg-background-dark/5 px-2 py-0.5 rounded border border-background-dark/5">
                                                        {isSelected ? preview : "(Hidden / Excluded)"}
                                                    </div>
                                                    {field.isSensitive && (
                                                        <span className="inline-block mt-1 text-5xs font-bold uppercase tracking-wider text-amber-700">
                                                            &#9888; Personal Info
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── Footer ────────────────────────────────────────── */}
                <div className="p-4 sm:p-5 border-t-2 border-background-dark/10 bg-white/70 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-3xs text-background-dark/65 font-medium text-center sm:text-left">
                        {isSensitiveMasked ? (
                            <span className="text-secondary font-bold inline-flex items-center gap-1">
                                <span>&#10003;</span> IP address, location, and ISP will be omitted from the screenshot.
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1">
                                <span className="text-amber-600 font-bold">&#9888;</span> Your public IP address is currently included in the screenshot.
                            </span>
                        )}
                    </p>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={downloading}
                            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border-2 border-background-dark/30 text-background-dark font-bold text-xs hover:border-background-dark hover:bg-background-dark/5 transition-all disabled:opacity-40"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDownload}
                            disabled={downloading || selectedFields.size === 0}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 bg-primary border-2 border-background-dark shadow-block-sm text-background-dark font-black uppercase tracking-wider rounded-xl text-xs hover:bg-primary-dark active:translate-x-px active:translate-y-px active:shadow-none transition-all disabled:opacity-40"
                        >
                            <Download size={14} />
                            <span>{downloading ? "Generating PNG…" : "Download PNG Card"}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
