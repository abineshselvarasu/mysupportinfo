"use client";

import React, { useState, useEffect, useId } from "react";
import {
    Download, X, Shield, Check, Globe, Wifi, Monitor,
    HardDrive, Cpu, Palette, Lock, EyeOff, Terminal,
    Activity, Clock, AlertTriangle, CheckSquare, FileSpreadsheet,
    FileText,
} from "lucide-react";
import { generateDiagnosticCSV, downloadCSV } from "@/lib/export-csv";
import { isMaskedValue } from "@/lib/report-share";

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
    orientation?: string;
    cpuCores?: number | string;
    ram?: string;
    webglVendor?: string;
    batteryLevel?: string;
    batteryCharging?: string;
    touchSupport?: string;
    persistence?: string;
    doNotTrack?: string;
    globalPrivacyControl?: string;
    adBlocker?: string;
    vpnDetected?: boolean;
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
    {
        id: "ip",
        title: "Public IP (IPv4 & IPv6)",
        category: "network",
        isSensitive: true,
        icon: Globe,
        getPreview: (s) => (isMaskedValue(s?.ip) ? "Hidden by sender" : s?.ip || "Scanning…"),
    },
    {
        id: "isp",
        title: "ISP & Network Provider",
        category: "network",
        isSensitive: true,
        icon: Wifi,
        getPreview: (s) => (isMaskedValue(s?.ispName) ? "Hidden by sender" : s?.ispName || "Scanning…"),
    },
    {
        id: "location",
        title: "City & Country Location",
        category: "network",
        isSensitive: true,
        icon: Globe,
        getPreview: (s) =>
            isMaskedValue(s?.city)
                ? "Hidden by sender"
                : [s?.city, s?.country].filter(Boolean).join(", ") || "Location unknown",
    },
    {
        id: "latency",
        title: "Latency & Speed",
        category: "network",
        icon: Activity,
        getPreview: (s) => (s?.latency ? `${s.latency} RTT` : "Measuring…"),
    },
    {
        id: "screen",
        title: "Screen Resolution & Colors",
        category: "hardware",
        icon: Monitor,
        getPreview: (s) => (s?.resolution ? `${s.resolution} (${s.colorDepth || "24-bit"})` : "Detecting…"),
    },
    {
        id: "viewport",
        title: "Viewport & Pixel Ratio",
        category: "hardware",
        icon: Monitor,
        getPreview: (s) => (s?.windowSize ? `${s.windowSize} (DPR: ${s.pixelRatio || "1x"})` : "Detecting…"),
    },
    {
        id: "hardware",
        title: "CPU Threads & RAM",
        category: "hardware",
        icon: Cpu,
        getPreview: (s) => (s ? `${s.cpuCores || "Unknown"} cores · ${s.ram || "Unknown"}` : "Detecting…"),
    },
    {
        id: "gpu",
        title: "GPU / WebGL Graphics",
        category: "hardware",
        icon: Palette,
        getPreview: (s) => (s?.webglVendor ? `${s.webglVendor.slice(0, 24)}…` : "Detecting…"),
    },
    {
        id: "battery",
        title: "Battery & Touch",
        category: "hardware",
        icon: Activity,
        getPreview: (s) =>
            s?.batteryLevel && s.batteryLevel !== "N/A"
                ? `${s.batteryLevel} (${s.batteryCharging})`
                : `Desktop · Touch: ${s?.touchSupport || "No"}`,
    },
    {
        id: "clock",
        title: "Timezone & System Clock",
        category: "hardware",
        icon: Clock,
        getPreview: (s, _, time) => (s?.timezone ? `${s.timezone} · ${time || ""}`.trim() : "Detecting…"),
    },
    {
        id: "webrtc",
        title: "WebRTC Leak Protection",
        category: "privacy",
        isSensitive: true,
        icon: Shield,
        getPreview: (_, leak) => (isMaskedValue(leak) ? "Hidden by sender" : leak || "Protected"),
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
        title: "Do Not Track, GPC & Ad Blocker",
        category: "privacy",
        icon: EyeOff,
        getPreview: (s) => (s ? `DNT: ${s.doNotTrack || "Off"} · GPC: ${s.globalPrivacyControl || "Not Set"}` : "Detecting…"),
    },
    {
        id: "userAgent",
        title: "Full User Agent String",
        category: "privacy",
        isSensitive: true,
        icon: Terminal,
        getPreview: (s) => (s?.userAgent ? `${s.userAgent.slice(0, 32)}…` : "Detecting…"),
    },
];

export const ALL_FIELD_IDS: FieldId[] = SCREENSHOT_FIELDS.map((f) => f.id);
export const SENSITIVE_FIELD_IDS: Set<FieldId> = new Set(
    SCREENSHOT_FIELDS.filter((f) => f.isSensitive).map((f) => f.id)
);
export const IP_PRIVACY_FIELD_IDS: FieldId[] = ["ip", "isp", "location"];
export const NETWORK_PII_FIELD_IDS: Set<FieldId> = new Set<FieldId>(["ip", "isp", "location", "webrtc"]);
export const BROWSER_SCREEN_FIELD_IDS: FieldId[] = ["browser", "os", "screen", "viewport", "js", "cookies", "language"];
export const DEFAULT_SELECTED_FIELDS = new Set<FieldId>(ALL_FIELD_IDS);

export interface ScreenshotModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (selectedFields: Set<FieldId>, format: "png" | "pdf") => Promise<void>;
    stats: SystemStatsSummary | null;
    webrtcLeak?: string;
    currentTime?: string;
    downloading: boolean;
    exportingFormat?: "png" | "pdf" | null;
    senderMasked?: boolean;
}

export default function ScreenshotModal({
    isOpen,
    onClose,
    onCapture,
    stats,
    webrtcLeak,
    currentTime,
    downloading,
    exportingFormat = null,
    senderMasked = false,
}: ScreenshotModalProps) {
    const [selectedFields, setSelectedFields] = useState<Set<FieldId>>(new Set<FieldId>(ALL_FIELD_IDS));
    const [preMaskSelection, setPreMaskSelection] = useState<Set<FieldId> | null>(null);
    const [csvExported, setCsvExported] = useState(false);
    const titleId = useId();

    useEffect(() => {
        if (!isOpen) {
            setPreMaskSelection(null);
            return;
        }
        if (senderMasked) {
            setSelectedFields((prev) => {
                const next = new Set(prev);
                NETWORK_PII_FIELD_IDS.forEach((id) => next.delete(id));
                return next.size > 0 ? next : new Set<FieldId>(["browser", "os"]);
            });
        }
    }, [isOpen, senderMasked]);

    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen && !downloading) onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, downloading, onClose]);

    if (!isOpen) return null;

    const availableAllIds = senderMasked
        ? ALL_FIELD_IDS.filter((id) => !NETWORK_PII_FIELD_IDS.has(id))
        : ALL_FIELD_IDS;
    const isSensitiveMasked = [...SENSITIVE_FIELD_IDS].every((id) => !selectedFields.has(id));
    const isWebDevBasics =
        selectedFields.size === BROWSER_SCREEN_FIELD_IDS.length &&
        BROWSER_SCREEN_FIELD_IDS.every((id) => selectedFields.has(id));
    const isAllSelected = selectedFields.size === availableAllIds.length;
    const isIpPrivacyMasked = Boolean(senderMasked) || IP_PRIVACY_FIELD_IDS.every((id) => !selectedFields.has(id));

    const toggleField = (id: FieldId) => {
        if (senderMasked && NETWORK_PII_FIELD_IDS.has(id)) return;
        setPreMaskSelection(null);
        setSelectedFields((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                if (next.size > 1) next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleMaskSensitive = () => {
        if (isSensitiveMasked) {
            if (preMaskSelection) {
                const restored = new Set<FieldId>(preMaskSelection);
                if (senderMasked) NETWORK_PII_FIELD_IDS.forEach((id) => restored.delete(id));
                setSelectedFields(restored);
            } else {
                setSelectedFields((prev) => {
                    const next = new Set(prev);
                    SENSITIVE_FIELD_IDS.forEach((id) => {
                        if (!senderMasked || !NETWORK_PII_FIELD_IDS.has(id)) next.add(id);
                    });
                    return next;
                });
            }
            setPreMaskSelection(null);
            return;
        }

        setPreMaskSelection(new Set(selectedFields));
        setSelectedFields((prev) => {
            const next = new Set(prev);
            SENSITIVE_FIELD_IDS.forEach((id) => next.delete(id));
            return next.size > 0
                ? next
                : new Set<FieldId>(ALL_FIELD_IDS.filter((id) => !SENSITIVE_FIELD_IDS.has(id)));
        });
    };
    const applySelectAll = () => {
        setPreMaskSelection(null);
        setSelectedFields(new Set<FieldId>(availableAllIds));
    };
    const applyWebDevBasics = () => {
        setPreMaskSelection(null);
        setSelectedFields(new Set<FieldId>(BROWSER_SCREEN_FIELD_IDS));
    };

    const handleExportCSV = () => {
        if (!stats) return;
        const csv = generateDiagnosticCSV(
            {
                ...(stats as Record<string, unknown>),
                cookiesEnabled: stats.persistence === "ENABLED",
                webrtcLeak: webrtcLeak || "No Leak",
            },
            isSensitiveMasked || isIpPrivacyMasked,
            selectedFields
        );
        downloadCSV(csv);
        setCsvExported(true);
        setTimeout(() => setCsvExported(false), 2200);
    };

    const categories: { id: "system" | "network" | "hardware" | "privacy"; name: string; badge?: string }[] = [
        { id: "system", name: "Browser & System" },
        { id: "network", name: "Network & Connection", badge: "Includes IP / Location" },
        { id: "hardware", name: "Display & Hardware" },
        { id: "privacy", name: "Privacy & Security" },
    ];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto"
            onClick={(e) => {
                if (e.target === e.currentTarget && !downloading) onClose();
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
        >
            <div className="relative w-full max-w-3xl bg-surface text-ink border border-line-strong shadow-elevated rounded-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto">
                {/* Header */}
                <div className="flex items-start justify-between p-5 sm:p-6 border-b border-line bg-well/40">
                    <div className="flex items-start gap-3">
                        <div className="size-10 rounded-xl bg-primary text-foreground flex items-center justify-center flex-shrink-0">
                            <Download size={18} aria-hidden="true" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h3 id={titleId} className="text-lg sm:text-xl font-bold text-ink">
                                    Customize Diagnostic Report Card
                                </h3>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-semibold bg-brand text-white">
                                    {selectedFields.size}/{ALL_FIELD_IDS.length} fields
                                </span>
                            </div>
                            <p className="text-xs text-muted mt-1 leading-relaxed">
                                Choose which device details appear in your downloaded PNG image, PDF document, or CSV spreadsheet. Hide IP and location if posting in a public thread.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={downloading}
                        aria-label="Close screenshot options"
                        className="p-1.5 rounded-lg border border-line text-muted hover:text-ink hover:border-line-strong transition-colors flex-shrink-0 cursor-pointer disabled:opacity-40"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                {/* Presets */}
                <div className="px-5 sm:px-6 py-3 bg-well/60 border-b border-line flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-muted mr-1 hidden sm:inline">Presets:</span>
                        <button
                            type="button"
                            onClick={toggleMaskSensitive}
                            aria-pressed={isSensitiveMasked}
                            disabled={downloading}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                                isSensitiveMasked
                                    ? "bg-secondary text-white border-secondary"
                                    : "bg-surface text-ink border-line hover:border-line-strong"
                            }`}
                        >
                            <Shield size={13} aria-hidden="true" />
                            <span>Hide IP &amp; Location</span>
                        </button>
                        <button
                            type="button"
                            onClick={applyWebDevBasics}
                            aria-pressed={isWebDevBasics}
                            disabled={downloading}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                                isWebDevBasics
                                    ? "bg-brand text-white border-brand"
                                    : "bg-surface text-ink border-line hover:border-line-strong"
                            }`}
                        >
                            <Monitor size={13} className="text-primary" aria-hidden="true" />
                            <span>Browser &amp; Screen Only</span>
                        </button>
                        <button
                            type="button"
                            onClick={applySelectAll}
                            aria-pressed={isAllSelected}
                            disabled={downloading}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                                isAllSelected
                                    ? "bg-brand text-white border-brand"
                                    : "bg-surface text-ink border-line hover:border-line-strong"
                            }`}
                        >
                            <CheckSquare size={13} className={isAllSelected ? "text-accent" : "text-muted"} aria-hidden="true" />
                            <span>Select All</span>
                        </button>
                    </div>
                    {isIpPrivacyMasked && (
                        <span className="text-xs font-semibold text-secondary">
                            &#10003; Personal IP &amp; location hidden
                        </span>
                    )}
                </div>

                {/* Body */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
                    {categories.map((category) => {
                        const fieldsInCategory = SCREENSHOT_FIELDS.filter((f) => f.category === category.id);
                        return (
                            <div key={category.id} className="space-y-2.5">
                                <div className="flex items-center justify-between pb-1.5 border-b border-line">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-ink">
                                            {category.name}
                                        </h4>
                                        {category.badge && (
                                            <span className="inline-flex items-center gap-1 text-2xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-md">
                                                <AlertTriangle size={10} aria-hidden="true" />
                                                {category.badge}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-muted font-mono">
                                        {fieldsInCategory.filter((f) => selectedFields.has(f.id)).length}/{fieldsInCategory.length}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                    {fieldsInCategory.map((field) => {
                                        const isSenderRedacted = Boolean(senderMasked && NETWORK_PII_FIELD_IDS.has(field.id));
                                        const isSelected = !isSenderRedacted && selectedFields.has(field.id);
                                        const preview = isSenderRedacted
                                            ? "Redacted by sender"
                                            : field.getPreview(stats, webrtcLeak, currentTime);
                                        const Icon = field.icon;

                                        return (
                                            <button
                                                key={field.id}
                                                type="button"
                                                onClick={() => toggleField(field.id)}
                                                disabled={downloading || isSenderRedacted}
                                                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-colors ${
                                                    isSenderRedacted
                                                        ? "bg-well/30 border-line opacity-55 cursor-not-allowed"
                                                        : isSelected
                                                        ? "bg-surface border-line-strong cursor-pointer"
                                                        : "bg-well/40 border-line opacity-65 hover:opacity-100 cursor-pointer"
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2 mb-2 w-full">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <Icon
                                                            size={14}
                                                            className={isSelected ? (field.isSensitive ? "text-amber-600 dark:text-amber-400" : "text-secondary") : "text-muted"}
                                                            aria-hidden="true"
                                                        />
                                                        <span className="text-xs font-semibold text-ink truncate">
                                                            {field.title}
                                                        </span>
                                                    </div>
                                                    <div
                                                        className={`size-4 rounded border flex items-center justify-center flex-shrink-0 ${
                                                            isSelected
                                                                ? "bg-secondary border-secondary text-white"
                                                                : "border-line-strong bg-canvas"
                                                        }`}
                                                        aria-hidden="true"
                                                    >
                                                        {isSelected && <Check size={11} strokeWidth={3} />}
                                                    </div>
                                                </div>
                                                <div className="font-mono text-2xs text-muted truncate w-full bg-well/60 px-2 py-1 rounded">
                                                    {isSelected ? preview : isSenderRedacted ? "Redacted by sender" : "Hidden"}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-5 sm:px-6 py-4 border-t border-line bg-well/40 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <p className="text-xs text-muted text-center lg:text-left">
                        {isIpPrivacyMasked
                            ? "IP address, location, and ISP will be omitted from all exports."
                            : "Full diagnostics including IP will be captured cleanly inside your browser."}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-center lg:justify-end flex-shrink-0">
                        <button
                            type="button"
                            onClick={handleExportCSV}
                            disabled={downloading || selectedFields.size === 0}
                            className="px-3.5 py-2 rounded-lg border border-line-strong bg-surface text-ink font-semibold text-xs hover:bg-hover transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap disabled:opacity-40 cursor-pointer"
                        >
                            <FileSpreadsheet size={14} aria-hidden="true" />
                            <span>{csvExported ? "Exported CSV" : "Export CSV"}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => onCapture(selectedFields, "pdf")}
                            disabled={downloading || selectedFields.size === 0}
                            className="px-4 py-2 rounded-lg border border-line-strong bg-surface text-ink font-semibold text-xs hover:bg-hover transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap disabled:opacity-40 cursor-pointer"
                        >
                            <FileText size={14} aria-hidden="true" />
                            <span>{exportingFormat === "pdf" ? "Rendering PDF…" : "Download PDF"}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => onCapture(selectedFields, "png")}
                            disabled={downloading || selectedFields.size === 0}
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-foreground font-bold rounded-lg text-xs hover:bg-primary-dark transition-colors whitespace-nowrap disabled:opacity-40 cursor-pointer"
                        >
                            <Download size={14} aria-hidden="true" />
                            <span>{downloading && exportingFormat !== "pdf" ? "Rendering PNG…" : "Download PNG"}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
