"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
    Monitor, Signal, HardDrive, Cpu, Clock, EyeOff, Terminal,
    Wifi, Copy, Check, Share2, Download, Palette, Globe,
    ShieldCheck, ShieldAlert, Languages, Smartphone,
    Activity, Zap, Layout, Lock, HelpCircle, ArrowRight,
    Wrench, User,
} from "lucide-react";
import DiagnosticFaqSection, { type DiagnosticFaqItem } from "@/components/ui/DiagnosticFaqSection";
import ScreenshotModal, { FieldId, DEFAULT_SELECTED_FIELDS, IP_PRIVACY_FIELD_IDS } from "@/components/ui/ScreenshotModal";
import ShareModal from "@/components/ui/ShareModal";
import ReportErrorModal from "@/components/ui/ReportErrorModal";
import { decodeReport, isMaskedValue, isSharedReportMasked, SharedReportData } from "@/lib/report-share";
import { downloadDiagnosticPDF, type DiagnosticPdfGroup } from "@/lib/export-pdf";
import { copyToClipboard } from "@/lib/clipboard";
import {
    detectBrowserInfo,
    detectGlobalPrivacyControl,
    detectOSName,
    formatDPR,
    getScreenOrientation,
} from "@/lib/device-detect";
import { fetchNetworkDiagnostics, scanWebRtcLeak } from "@/lib/network-detect";

type TabType = "overview" | "network" | "browser" | "hardware" | "privacy";
type AudienceMode = "simple" | "technical";

interface SystemStats {
    browserName: string;
    browserVersion: string;
    osName: string;
    language: string;
    connectionType: string;
    connectionSpeed: string;
    latency: string;
    ip: string;
    ipv6: string;
    ispName: string;
    city: string;
    country: string;
    countryCode: string;
    vpnDetected: boolean;
    resolution: string;
    windowSize: string;
    pixelRatio: string;
    colorDepth: string;
    orientation: string;
    touchSupport: string;
    cpuCores: number | string;
    ram: string;
    webglVendor: string;
    batteryLevel: string;
    batteryCharging: string;
    persistence: string;
    doNotTrack: string;
    globalPrivacyControl: string;
    adBlocker: string;
    userAgent: string;
    timezone: string;
}

interface MetricRowDef {
    id: string;
    fieldId?: FieldId;
    category: Exclude<TabType, "overview">;
    featuredOnOverview?: boolean;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    simpleLabel: string;
    technicalLabel: string;
    value: string | React.ReactNode;
    plainValue?: string;
    copyText?: string;
    simpleHelp: string;
    technicalHelp: string;
    status?: "good" | "warn" | "bad" | "neutral";
    statusLabel?: string;
    isCode?: boolean;
    action?: React.ReactNode;
}

const getLatencyStatus = (val: string): "good" | "warn" | "bad" | "neutral" => {
    const ms = parseInt(val);
    if (isNaN(ms)) return "neutral";
    if (ms < 50) return "good";
    if (ms < 150) return "warn";
    return "bad";
};

const HOME_FAQS: DiagnosticFaqItem[] = [
    {
        q: "Why do support technicians need my browser version and operating system?",
        a: "Web browsers render HTML, CSS, and JavaScript differently across operating systems. A bug affecting Safari on macOS might look completely fine in Google Chrome on Windows. Knowing your exact browser version and OS allows developers to reproduce the issue in an identical environment.",
    },
    {
        q: "How does MySupportInfo detect my graphics card (GPU) and hardware specs?",
        a: "MySupportInfo utilizes standard browser APIs: the WebGL debug renderer info extension queries your graphics hardware string, the Device Memory API provides memory estimations, and navigator.hardwareConcurrency detects available CPU thread cores.",
    },
    {
        q: "What is a WebRTC leak and how does it compromise my VPN?",
        a: "WebRTC allows video calls and peer-to-peer data in browsers. Even when using a VPN, WebRTC can communicate with STUN servers and expose your real public or local network IP address. MySupportInfo scans your browser's active ICE candidates to ensure no leaks exist.",
    },
    {
        q: "Is my personal data stored or logged when using this tool?",
        a: "Never. All detection occurs client-side in your local browser sandbox. We do not store IP addresses in databases, use no tracking cookies, and never build user profiles. All data disappears the moment you close your browser tab.",
    },
    {
        q: "How can I test my network for gaming and video call lag?",
        a: "Head to our Bufferbloat Test tool (/bufferbloat). It simulates real download and upload loads to measure whether your router buffers packets and spikes latency, assigning you an official Quality of Experience grade from A to F.",
    },
];

const STANDALONE_TOOLS = [
    {
        href: "/bufferbloat",
        title: "Bufferbloat Latency Test",
        desc: "Measure ping spikes while downloading or uploading to find out why games or video calls stutter.",
        cta: "Run latency test",
    },
    {
        href: "/what-is-my-ip",
        title: "What Is My IP Address",
        desc: "Inspect your public IPv4 & IPv6 addresses, ISP provider, approximate region, and VPN WebRTC leaks.",
        cta: "Audit IP & WebRTC",
    },
    {
        href: "/what-is-my-browser",
        title: "What Is My Browser",
        desc: "Verify your exact browser build, Blink/Gecko/WebKit rendering engine, cookies, and User-Agent.",
        cta: "Inspect browser",
    },
    {
        href: "/what-is-my-screen-resolution",
        title: "Screen Resolution & Viewport",
        desc: "Compare physical display dimensions against live CSS viewport pixels on zoom and DPR scaling.",
        cta: "Measure display",
    },
];

export default function Home() {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [ipLoading, setIpLoading] = useState(true);
    const [webrtcLeak, setWebrtcLeak] = useState<string>("Scanning…");
    const [webrtcLoading, setWebrtcLoading] = useState(true);

    const [activeTab, setActiveTab] = useState<TabType>("overview");
    const [audienceMode, setAudienceMode] = useState<AudienceMode>("simple");
    const [expandedHelpId, setExpandedHelpId] = useState<string | null>(null);
    const [copiedFieldId, setCopiedFieldId] = useState<string | null>(null);

    const [isCapturing, setIsCapturing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [exportingFormat, setExportingFormat] = useState<"png" | "pdf" | null>(null);
    const [downloading, setDownloading] = useState(false);
    const [currentTime, setCurrentTime] = useState<string>("");

    const [maskTicketIp, setMaskTicketIp] = useState(true);
    const [ticketCopied, setTicketCopied] = useState(false);

    const [isScreenshotModalOpen, setIsScreenshotModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isReportErrorOpen, setIsReportErrorOpen] = useState(false);
    const [sharedReport, setSharedReport] = useState<SharedReportData | null>(null);
    const [visibleFields, setVisibleFields] = useState<Set<FieldId>>(DEFAULT_SELECTED_FIELDS);
    const reportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const tick = () => setCurrentTime(new Date().toLocaleString("en-US", { hour12: true }));
        tick();
        const i = setInterval(tick, 1000);
        return () => clearInterval(i);
    }, []);

    // Shared report URL param decoding
    useEffect(() => {
        if (typeof window === "undefined") return;
        const params = new URLSearchParams(window.location.search);
        const reportParam = params.get("report");
        if (reportParam) {
            const decoded = decodeReport(reportParam);
            if (decoded) {
                setSharedReport(decoded);
                setStats({
                    browserName: decoded.browserName,
                    browserVersion: decoded.browserVersion,
                    osName: decoded.osName,
                    language: decoded.language,
                    connectionType: decoded.connectionType || "N/A",
                    connectionSpeed: decoded.connectionSpeed || "N/A",
                    latency: decoded.latency || "N/A",
                    ip: decoded.ip,
                    ipv6: decoded.ipv6,
                    ispName: decoded.ispName,
                    city: decoded.location.split(",")[0]?.trim() || "",
                    country: decoded.location.split(",")[1]?.trim() || "",
                    countryCode: decoded.countryCode || "",
                    vpnDetected: Boolean(decoded.vpnDetected),
                    resolution: decoded.resolution,
                    windowSize: decoded.windowSize,
                    pixelRatio: decoded.pixelRatio,
                    colorDepth: decoded.colorDepth,
                    orientation: decoded.orientation || "Unknown",
                    touchSupport: decoded.touchSupport || "N/A",
                    cpuCores: decoded.cpuCores,
                    ram: decoded.ram,
                    webglVendor: decoded.webglVendor,
                    batteryLevel: decoded.batteryLevel || "N/A",
                    batteryCharging: decoded.batteryCharging || "N/A",
                    persistence: decoded.persistence,
                    doNotTrack: decoded.doNotTrack,
                    globalPrivacyControl: decoded.globalPrivacyControl || "Not Set",
                    adBlocker: decoded.adBlocker || "N/A",
                    userAgent: decoded.userAgent || "Shared device snapshot",
                    timezone: decoded.timezone,
                });
                setLoading(false);
                setIpLoading(false);
                setWebrtcLoading(false);
                setWebrtcLeak(decoded.webrtcLeak || "Protected (Report)");
            }
        }
    }, []);

    const switchToMyDevice = () => {
        if (typeof window !== "undefined") {
            window.history.replaceState({}, "", window.location.pathname);
            setSharedReport(null);
            window.location.reload();
        }
    };

    // Main stats detection
    useEffect(() => {
        let active = true;
        const fetchStats = async () => {
            if (typeof window !== "undefined" && window.location.search.includes("report=")) {
                const p = new URLSearchParams(window.location.search);
                if (p.get("report") && decodeReport(p.get("report")!)) return;
            }
            const ua = navigator.userAgent;
            const [{ browserName, browserVersion }, osName] = await Promise.all([
                detectBrowserInfo(ua),
                detectOSName(ua),
            ]);

            // @ts-expect-error - Experimental Network Info API
            const conn = navigator.connection;
            const connType = conn?.effectiveType?.toUpperCase() || "N/A";
            const connSpeed = conn?.downlink ? `${conn.downlink} Mbps` : "N/A";
            const persistence = navigator.cookieEnabled ? "ENABLED" : "DISABLED";
            // @ts-expect-error - Experimental Device Memory API
            const ram = navigator.deviceMemory ? `~${navigator.deviceMemory} GB` : "Unknown";
            const cpu = navigator.hardwareConcurrency || "Unknown";
            let latency = conn?.rtt ? `${conn.rtt} ms` : "N/A";

            if (latency === "N/A" && typeof window !== "undefined") {
                try {
                    const pStart = performance.now();
                    await fetch("/favicon.svg?t=" + Date.now(), { method: "HEAD", cache: "no-store" });
                    const rtt = Math.round(performance.now() - pStart);
                    if (rtt > 0) latency = `${rtt} ms`;
                } catch { /* ignore */ }
            }

            const dnt = navigator.doNotTrack === "1" ? "ENABLED" : "DISABLED";
            const gpc = detectGlobalPrivacyControl();
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const language = navigator.language || "Unknown";
            const touchPoints = navigator.maxTouchPoints;
            const touchSupport = touchPoints > 0 ? `Supported (${touchPoints} pt)` : "Not Supported";
            const orientation = getScreenOrientation();
            const screenRes = `${window.screen.width} × ${window.screen.height}`;
            const windowSizeVal = `${window.innerWidth} × ${window.innerHeight}`;
            const pixelRatioVal = formatDPR(window.devicePixelRatio);
            const colorDepthVal = `${window.screen.colorDepth} bit`;

            let adBlocker = "Not Detected";
            try {
                const testEl = document.createElement("div");
                testEl.className = "ad ads advert banner adsbox ad-banner ad-placement";
                testEl.style.cssText = "position:absolute;left:-9999px;height:1px;width:1px;opacity:0;";
                document.body.appendChild(testEl);
                await new Promise((r) => setTimeout(r, 120));
                const isDomHidden =
                    testEl.offsetHeight === 0 ||
                    testEl.clientHeight === 0 ||
                    window.getComputedStyle(testEl).display === "none";
                document.body.removeChild(testEl);

                if (isDomHidden) {
                    adBlocker = "Detected";
                } else {
                    try {
                        await fetch("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", {
                            method: "HEAD",
                            mode: "no-cors",
                            cache: "no-store",
                        });
                    } catch {
                        adBlocker = "Detected";
                    }
                }
            } catch { /* ignore */ }

            let batteryLevel = "N/A";
            let batteryCharging = "N/A";
            try {
                // @ts-expect-error - experimental Battery API
                const bat = await navigator.getBattery?.();
                if (bat) {
                    batteryLevel = `${Math.round(bat.level * 100)}%`;
                    batteryCharging = bat.charging ? "Charging" : "On Battery";
                }
            } catch { /* ignore */ }

            let webgl = "Unknown";
            try {
                const canvas = document.createElement("canvas");
                const gl = canvas.getContext("webgl");
                if (gl) {
                    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
                    if (dbg) webgl = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
                }
            } catch { /* ignore */ }

            const { ip, ipv6, ispName, city, country, countryCode, vpnDetected } = await fetchNetworkDiagnostics(true);
            if (!active) return;

            setIpLoading(false);
            setStats({
                browserName,
                browserVersion,
                osName,
                language,
                connectionType: connType,
                connectionSpeed: connSpeed,
                latency,
                ip,
                ipv6,
                ispName,
                city,
                country,
                countryCode,
                vpnDetected,
                resolution: screenRes,
                windowSize: windowSizeVal,
                pixelRatio: pixelRatioVal,
                colorDepth: colorDepthVal,
                orientation,
                touchSupport,
                cpuCores: cpu,
                ram,
                webglVendor: webgl,
                batteryLevel,
                batteryCharging,
                persistence,
                doNotTrack: dnt,
                globalPrivacyControl: gpc,
                adBlocker,
                userAgent: ua,
                timezone: tz,
            });
            setLoading(false);
        };
        fetchStats();
        return () => {
            active = false;
        };
    }, []);

    // WebRTC leak scan
    useEffect(() => {
        let active = true;
        const detect = async () => {
            if (typeof window !== "undefined" && window.location.search.includes("report=")) {
                const p = new URLSearchParams(window.location.search);
                if (p.get("report") && decodeReport(p.get("report")!)) return;
            }
            const leak = await scanWebRtcLeak(3000);
            if (!active) return;
            setWebrtcLeak(leak);
            setWebrtcLoading(false);
        };
        detect();
        return () => {
            active = false;
        };
    }, []);

    // Live viewport, DPR, display & orientation tracking
    useEffect(() => {
        const onViewportChange = () =>
            setStats((prev) =>
                prev
                    ? {
                          ...prev,
                          windowSize: `${window.innerWidth} × ${window.innerHeight}`,
                          pixelRatio: formatDPR(window.devicePixelRatio),
                          resolution: `${window.screen.width} × ${window.screen.height}`,
                          colorDepth: `${window.screen.colorDepth} bit`,
                          orientation: getScreenOrientation(),
                      }
                    : prev
            );
        window.addEventListener("resize", onViewportChange);
        screen.orientation?.addEventListener?.("change", onViewportChange);
        return () => {
            window.removeEventListener("resize", onViewportChange);
            screen.orientation?.removeEventListener?.("change", onViewportChange);
        };
    }, []);

    const checkCookies = () =>
        setStats((prev) => (prev ? { ...prev, persistence: navigator.cookieEnabled ? "ENABLED" : "DISABLED" } : prev));

    const buildSupportSummaryText = (maskIp: boolean) => {
        if (!stats) return "Scanning system details…";
        const locBase = [stats.city, stats.country].filter(Boolean).join(", ");
        const locStr = locBase
            ? `${locBase}${stats.countryCode ? ` (${stats.countryCode})` : ""}`
            : stats.countryCode || "Unavailable";
        const connStr =
            stats.connectionType === "N/A"
                ? "Desktop / Wi-Fi"
                : `${stats.connectionType} · ${stats.connectionSpeed}`;
        const batteryStr =
            stats.batteryLevel && stats.batteryLevel !== "N/A"
                ? ` · ${stats.batteryLevel} (${stats.batteryCharging})`
                : "";
        const line = (label: string, value: string) => `${label.padEnd(17, " ")}${value}`;

        return [
            "MySupportInfo — Device Diagnostic Report (23 Metrics)",
            "",
            "[Browser & System]",
            line("Web Browser:", `${stats.browserName} ${stats.browserVersion}`.trim()),
            line("Operating Sys:", stats.osName),
            line("Login Cookies:", stats.persistence),
            line("Language:", stats.language),
            line("JavaScript:", "ENABLED"),
            line("User-Agent:", stats.userAgent),
            "",
            "[Network & Connection]",
            line("Public IPv4:", maskIp ? "[Masked for Privacy]" : stats.ip),
            line("Modern IPv6:", maskIp ? "[Masked for Privacy]" : stats.ipv6),
            line("ISP / Carrier:", maskIp ? "[Masked for Privacy]" : stats.ispName),
            line("Location:", maskIp ? "[Masked for Privacy]" : locStr),
            line(
                "WebRTC Leak:",
                webrtcLoading
                    ? "Scanning…"
                    : (maskIp && !webrtcSafe && webrtcLeak !== "Unsupported") || isWebRtcMasked
                    ? "[Masked for Privacy]"
                    : webrtcLeak
            ),
            line("Response Ping:", stats.latency),
            line("Connection:", connStr),
            "",
            "[Hardware & Display]",
            line("Display / Color:", `${stats.resolution} · ${stats.colorDepth} · ${stats.pixelRatio} DPR`),
            line("Window / Orient:", `${stats.windowSize} · ${stats.orientation || "Unknown"}`),
            line("CPU & Memory:", `${stats.cpuCores} CPU threads · ${stats.ram} RAM`),
            line("GPU Renderer:", stats.webglVendor),
            line("Touch / Battery:", `${stats.touchSupport}${batteryStr}`),
            line("Timezone/Clock:", `${stats.timezone} · ${currentTime || "—"}`),
            "",
            "[Privacy & Security]",
            line("Do Not Track:", stats.doNotTrack),
            line("Global Privacy:", stats.globalPrivacyControl),
            line("Ad Blocker:", stats.adBlocker),
            line(
                "VPN / Proxy:",
                maskIp || isSharedMasked
                    ? "[Masked for Privacy]"
                    : stats.vpnDetected
                    ? "VPN / Datacenter Range"
                    : "Standard Home / Mobile ISP"
            ),
            "",
            line("Source:", "https://mysupportinfo.com"),
        ].join("\n");
    };

    const copyAllInfo = async () => {
        if (!stats) return;
        if (await copyToClipboard(buildSupportSummaryText(false))) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const handleCopyTicketSnippet = async () => {
        if (!stats) return;
        if (await copyToClipboard(buildSupportSummaryText(maskTicketIp))) {
            setTicketCopied(true);
            setTimeout(() => setTicketCopied(false), 2500);
        }
    };

    const handleCopySingleValue = async (id: string, value: string) => {
        if (await copyToClipboard(value)) {
            setCopiedFieldId(id);
            setTimeout(() => setCopiedFieldId(null), 1800);
        }
    };

    const performCapture = async (fieldsToRender: Set<FieldId>, format: "png" | "pdf" = "png") => {
        const dateSlug = new Date().toISOString().slice(0, 10);

        if (format === "pdf") {
            setDownloading(true);
            setExportingFormat("pdf");
            try {
                const isMaskedPii = isSharedMasked || IP_PRIVACY_FIELD_IDS.every((f) => !fieldsToRender.has(f));
                const resolveRowText = (row: MetricRowDef): string => {
                    if (row.id === "ip4") {
                        if (ipLoading) return "Scanning...";
                        if (isMaskedValue(stats?.ip)) return audienceMode === "simple" ? "Hidden by sender" : "[Masked for Privacy]";
                        return `${stats?.ip || "—"}${stats?.countryCode && fieldsToRender.has("location") ? ` (${stats.countryCode})` : ""}`;
                    }
                    if (typeof row.value === "string") return row.value;
                    return row.plainValue || row.copyText || "—";
                };
                const categoryDefs: { category: Exclude<TabType, "overview">; title: string }[] = [
                    { category: "browser", title: "Browser & System" },
                    { category: "network", title: "Network & Connection" },
                    { category: "hardware", title: "Hardware & Display" },
                    { category: "privacy", title: "Privacy & Security" },
                ];
                const pdfGroups: DiagnosticPdfGroup[] = categoryDefs
                    .map(({ category, title }) => ({
                        title,
                        items: metricRows
                            .filter(
                                (r) =>
                                    r.category === category &&
                                    (!r.fieldId || fieldsToRender.has(r.fieldId)) &&
                                    (r.id !== "vpn_check" || fieldsToRender.has("isp"))
                            )
                            .map((r) => ({
                                label: audienceMode === "simple" ? r.simpleLabel : r.technicalLabel,
                                value: resolveRowText(r),
                                isCode: r.isCode,
                            })),
                    }))
                    .filter((g) => g.items.length > 0);

                await downloadDiagnosticPDF(
                    {
                        generatedAt: new Date().toUTCString(),
                        isMaskedPii,
                        kpis: [
                            {
                                label: "Browser",
                                value: fieldsToRender.has("browser")
                                    ? `${stats?.browserName || "—"} ${stats?.browserVersion || ""}`.trim()
                                    : "Masked",
                            },
                            {
                                label: "Platform / OS",
                                value: fieldsToRender.has("os") ? stats?.osName || "—" : "Masked",
                            },
                            {
                                label: "Display / Viewport",
                                value:
                                    fieldsToRender.has("screen") || fieldsToRender.has("viewport")
                                        ? `${stats?.resolution || "—"} · ${stats?.pixelRatio || "1x"}`
                                        : "Masked",
                            },
                            {
                                label: "Public IP / Ping",
                                value:
                                    fieldsToRender.has("ip") && !isMaskedValue(stats?.ip)
                                        ? `${stats?.ip || "—"} (${stats?.latency || "—"})`
                                        : `Ping: ${stats?.latency || "—"}`,
                            },
                        ],
                        groups: pdfGroups,
                    },
                    `mysupportinfo-diagnostic-report-${dateSlug}.pdf`
                );
            } catch (err) {
                console.error("PDF export failed:", err);
            } finally {
                setExportingFormat(null);
                setDownloading(false);
            }
            return;
        }

        const element = reportRef.current;
        if (!element) return;
        setDownloading(true);
        setExportingFormat("png");
        setIsCapturing(true);
        setVisibleFields(fieldsToRender);
        const prevWidth = element.style.width;
        if (typeof window !== "undefined" && window.innerWidth < 1024) {
            element.style.width = "1152px";
        }
        await new Promise((r) => setTimeout(r, 350));
        try {
            const html2canvas = (await import("html2canvas")).default;
            const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
            const captureW = Math.max(element.scrollWidth, 1152);
            const canvas = await html2canvas(element, {
                backgroundColor: isDark ? "#031915" : "#FAF6F0",
                scale: 2,
                logging: false,
                useCORS: true,
                width: captureW,
                height: element.scrollHeight,
                windowWidth: captureW,
                windowHeight: element.scrollHeight,
                x: 0,
                y: 0,
                onclone: (clonedDoc) => {
                    clonedDoc.documentElement.classList.toggle("dark", isDark);
                    const style = clonedDoc.createElement("style");
                    style.textContent = `
                        *, *::before, *::after {
                            font-variant-numeric: normal !important;
                            letter-spacing: normal !important;
                        }
                        code, pre, .font-mono {
                            font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace !important;
                        }
                    `;
                    clonedDoc.head.appendChild(style);
                },
            });
            const link = document.createElement("a");
            link.download = `mysupportinfo-diagnostic-report-${dateSlug}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        } catch (err) {
            console.error("PNG export failed:", err);
        } finally {
            element.style.width = prevWidth;
            setIsCapturing(false);
            setExportingFormat(null);
            setDownloading(false);
        }
    };

    const isSharedMasked = isSharedReportMasked(sharedReport);
    const isWebRtcMasked = isMaskedValue(webrtcLeak);
    const webrtcSafe = webrtcLeak.startsWith("No Leak") || webrtcLeak.startsWith("Local Candidate");
    const webrtcStatus: "good" | "warn" | "bad" | "neutral" =
        webrtcLoading || isWebRtcMasked || webrtcLeak === "Unsupported"
            ? "neutral"
            : webrtcSafe
            ? "good"
            : "bad";

    const latencyStatus = loading ? "neutral" : getLatencyStatus(stats?.latency || "");

    const maskedDisplayText = (raw?: string) =>
        audienceMode === "simple" ? "Hidden by sender" : raw || "[Masked for Privacy]";

    const metricRows: MetricRowDef[] = [
        // Network & IP
        {
            id: "ip4",
            fieldId: "ip",
            category: "network",
            featuredOnOverview: true,
            icon: Globe,
            simpleLabel: "Public Internet Address (IPv4)",
            technicalLabel: "Public IPv4 Address",
            value: ipLoading ? (
                "Scanning…"
            ) : isMaskedValue(stats?.ip) ? (
                maskedDisplayText(stats?.ip)
            ) : isCapturing ? (
                <span className="font-mono">
                    {stats?.ip}
                    {stats?.countryCode && visibleFields.has("location") ? ` (${stats.countryCode})` : ""}
                </span>
            ) : (
                <span className="inline-flex items-center gap-2 flex-wrap">
                    <span className="font-mono">{stats?.ip}</span>
                    {stats?.countryCode && (
                        <span className="px-1.5 py-0.5 rounded bg-well border border-line text-2xs font-mono font-bold text-ink">
                            {stats.countryCode}
                        </span>
                    )}
                </span>
            ),
            copyText: ipLoading || isMaskedValue(stats?.ip) ? undefined : stats?.ip,
            status: isMaskedValue(stats?.ip) ? "neutral" : undefined,
            statusLabel: isMaskedValue(stats?.ip) ? "Masked" : undefined,
            simpleHelp: "This is the public street address websites see when your router connects online.",
            technicalHelp: isMaskedValue(stats?.ip)
                ? "Public IPv4, ISP, and region were omitted from this shared link by the sender."
                : `External IPv4 endpoint assigned by ${stats?.ispName || "your ISP"}. Approximate region: ${[stats?.city, stats?.country].filter(Boolean).join(", ") || "Unknown"}.`,
        },
        {
            id: "isp",
            fieldId: "isp",
            category: "network",
            featuredOnOverview: true,
            icon: Wifi,
            simpleLabel: "Internet Provider",
            technicalLabel: "ISP / ASN Organization",
            value: ipLoading
                ? "Scanning…"
                : isMaskedValue(stats?.ispName)
                ? maskedDisplayText(stats?.ispName)
                : stats?.ispName,
            copyText: ipLoading || isMaskedValue(stats?.ispName) ? undefined : stats?.ispName,
            simpleHelp: "The internet company or mobile carrier currently routing your traffic.",
            technicalHelp: isMaskedValue(stats?.ispName)
                ? "ISP details were omitted by the report sender for privacy."
                : `Derived from IP WHOIS / ASN registration records.${stats?.vpnDetected ? " Matches a known VPN or datacenter range." : ""}`,
            status: isMaskedValue(stats?.ispName) ? "neutral" : stats?.vpnDetected ? "warn" : "neutral",
            statusLabel: isMaskedValue(stats?.ispName) ? "Masked" : stats?.vpnDetected ? "VPN / Datacenter" : undefined,
        },
        {
            id: "location",
            fieldId: "location",
            category: "network",
            icon: Globe,
            simpleLabel: "Approximate Location",
            technicalLabel: "IP Geolocation (City / Country)",
            value: ipLoading
                ? "Scanning…"
                : isMaskedValue(stats?.city)
                ? maskedDisplayText(stats?.city)
                : [stats?.city, stats?.country].filter(Boolean).join(", ") || "Unavailable",
            copyText:
                ipLoading || isMaskedValue(stats?.city)
                    ? undefined
                    : [stats?.city, stats?.country].filter(Boolean).join(", ") || undefined,
            status: isMaskedValue(stats?.city) ? "neutral" : undefined,
            statusLabel: isMaskedValue(stats?.city) ? "Masked" : undefined,
            simpleHelp: "General city or region inferred from your public IP address—never exact street GPS.",
            technicalHelp: isMaskedValue(stats?.city)
                ? "City and country geolocation were omitted by the report sender."
                : `Derived from IP geolocation lookup (${stats?.countryCode || "Unknown"}).`,
        },
        {
            id: "webrtc",
            fieldId: "webrtc",
            category: "network",
            featuredOnOverview: true,
            icon: ShieldCheck,
            simpleLabel: "VPN / WebRTC Leak Check",
            technicalLabel: "WebRTC ICE Leak Scan",
            value: webrtcLoading
                ? "Scanning…"
                : isWebRtcMasked
                ? maskedDisplayText(webrtcLeak)
                : audienceMode === "simple"
                ? webrtcSafe
                    ? "Safe — No IP leak found"
                    : webrtcLeak === "Unsupported"
                    ? "Browser blocked scan"
                    : "Public IP visible via WebRTC"
                : webrtcLeak,
            simpleHelp: "Checks if video-call features accidentally reveal your real home IP behind a VPN.",
            technicalHelp: "Runs local RTCPeerConnection ICE candidate discovery against stun.l.google.com:19302.",
            status: webrtcStatus,
            statusLabel: webrtcLoading
                ? "Checking"
                : isWebRtcMasked
                ? "Masked"
                : webrtcSafe
                ? "Protected"
                : webrtcLeak === "Unsupported"
                ? "N/A"
                : "Exposed",
        },
        {
            id: "latency",
            fieldId: "latency",
            category: "network",
            featuredOnOverview: true,
            icon: Activity,
            simpleLabel: "Response Speed (Ping)",
            technicalLabel: "Idle Round-Trip Latency (RTT)",
            value: loading
                ? "Measuring…"
                : audienceMode === "simple"
                ? stats?.latency === "N/A"
                    ? "Unavailable"
                    : `${stats?.latency} (${latencyStatus === "good" ? "Fast" : latencyStatus === "warn" ? "Moderate" : "Slow"})`
                : stats?.latency,
            simpleHelp: "How quickly data travels to a server and back. Under 50 ms feels snappy; test under load with Bufferbloat.",
            technicalHelp: "HTTP HEAD round-trip benchmark or navigator.connection.rtt estimate.",
            status: latencyStatus,
            statusLabel: latencyStatus === "good" ? "Snappy" : latencyStatus === "warn" ? "Moderate" : undefined,
        },
        {
            id: "ipv6",
            fieldId: "ip",
            category: "network",
            icon: Globe,
            simpleLabel: "Modern IPv6 Address",
            technicalLabel: "Dual-Stack IPv6 Endpoint",
            value: ipLoading
                ? "Scanning…"
                : isMaskedValue(stats?.ipv6)
                ? maskedDisplayText(stats?.ipv6)
                : stats?.ipv6 || "Not Available",
            copyText: !ipLoading && !isMaskedValue(stats?.ipv6) && stats?.ipv6 !== "Not Available" ? stats?.ipv6 : undefined,
            simpleHelp: "Newer IP address format. Many home routers still only use IPv4, which is completely normal.",
            technicalHelp: "Queried from api64.ipify.org to determine active IPv6 external routing.",
            status: !ipLoading && !isMaskedValue(stats?.ipv6) && stats?.ipv6 !== "Not Available" ? "good" : "neutral",
            statusLabel: isMaskedValue(stats?.ipv6) ? "Masked" : undefined,
        },
        {
            id: "conntype",
            fieldId: "latency",
            category: "network",
            icon: Signal,
            simpleLabel: "Connection Estimate",
            technicalLabel: "Network Information API",
            value: loading
                ? "…"
                : stats?.connectionType === "N/A"
                ? audienceMode === "simple"
                    ? "Desktop / Wi-Fi (Mobile API only)"
                    : "N/A (Desktop browser)"
                : `${stats?.connectionType} · ${stats?.connectionSpeed}`,
            simpleHelp: "Only mobile Chrome reports cellular speeds here. Use the Bufferbloat Test for real desktop speed.",
            technicalHelp: "navigator.connection effectiveType & downlink estimates; omitted on desktop Chromium/Firefox/Safari.",
        },

        // Browser & OS
        {
            id: "browser",
            fieldId: "browser",
            category: "browser",
            featuredOnOverview: true,
            icon: Monitor,
            simpleLabel: "Web Browser",
            technicalLabel: "Browser & Major Build",
            value: loading ? "…" : `${stats?.browserName} ${stats?.browserVersion}`,
            copyText: loading ? undefined : `${stats?.browserName} ${stats?.browserVersion}`,
            simpleHelp: "Keeping your browser updated fixes crashes, playback glitches, and login problems.",
            technicalHelp: "Parsed from User-Agent headers and Brave runtime checks where exposed.",
            status: "good",
            statusLabel: "Active",
        },
        {
            id: "os",
            fieldId: "os",
            category: "browser",
            featuredOnOverview: true,
            icon: HardDrive,
            simpleLabel: "Operating System",
            technicalLabel: "Host OS / Client Hints",
            value: loading ? "…" : stats?.osName,
            simpleHelp: "The operating system running on your computer or phone (Windows, macOS, Linux, iOS, or Android).",
            technicalHelp: "Detected via navigator.userAgentData.getHighEntropyValues(['platform']) and navigator.platform.",
        },
        {
            id: "cookies",
            fieldId: "cookies",
            category: "browser",
            featuredOnOverview: true,
            icon: Lock,
            simpleLabel: "Login Cookies",
            technicalLabel: "HTTP Cookies Persistence",
            value: loading
                ? "…"
                : audienceMode === "simple"
                ? stats?.persistence === "ENABLED"
                    ? "Turned On (Logins work)"
                    : "Turned Off (Logins may fail)"
                : stats?.persistence,
            simpleHelp: "Websites need cookies enabled to keep you signed in after loading a page.",
            technicalHelp: "Evaluates navigator.cookieEnabled state locally in browser memory.",
            status: loading ? "neutral" : stats?.persistence === "ENABLED" ? "good" : "bad",
            statusLabel: stats?.persistence === "ENABLED" ? "Enabled" : "Blocked",
            action: !isCapturing ? (
                <button
                    type="button"
                    onClick={checkCookies}
                    className="px-2.5 py-1 rounded-md border border-line text-2xs font-semibold text-ink hover:bg-hover transition-colors cursor-pointer"
                >
                    Re-check
                </button>
            ) : undefined,
        },
        {
            id: "language",
            fieldId: "language",
            category: "browser",
            icon: Languages,
            simpleLabel: "Browser Language",
            technicalLabel: "navigator.language Locale",
            value: loading ? "…" : stats?.language,
            simpleHelp: "Controls default page language, date style, and number formatting.",
            technicalHelp: "Read directly from navigator.language BCP 47 locale tag.",
        },
        {
            id: "js",
            fieldId: "js",
            category: "browser",
            icon: Zap,
            simpleLabel: "JavaScript",
            technicalLabel: "JavaScript Runtime",
            value: "Turned On (Active)",
            simpleHelp: "Interactive web apps require JavaScript to load buttons, menus, and dashboards.",
            technicalHelp: "Client-side ES execution verified active.",
            status: "good",
            statusLabel: "Running",
        },
        {
            id: "ua",
            fieldId: "userAgent",
            category: "browser",
            icon: Terminal,
            simpleLabel: "Technical Browser ID (User-Agent)",
            technicalLabel: "Full User-Agent String",
            value: loading ? "Loading…" : stats?.userAgent,
            copyText: loading ? undefined : stats?.userAgent,
            simpleHelp: "A hidden text badge your browser sends to websites to identify its engine and OS.",
            technicalHelp: "Raw navigator.userAgent header string for engineering bug reports.",
            isCode: true,
        },

        // Hardware & Display
        {
            id: "screen",
            fieldId: "screen",
            category: "hardware",
            featuredOnOverview: true,
            icon: Monitor,
            simpleLabel: "Monitor Size & Colors",
            technicalLabel: "Screen Resolution, Color Depth & DPR",
            value: loading
                ? "…"
                : `${stats?.resolution} · ${stats?.colorDepth} · ${stats?.pixelRatio} DPR`,
            copyText: loading
                ? undefined
                : `${stats?.resolution} (${stats?.colorDepth}, DPR ${stats?.pixelRatio})`,
            simpleHelp: "Physical display resolution, color bit depth, and display scaling factor (DPR).",
            technicalHelp: `window.screen (${stats?.resolution}), colorDepth (${stats?.colorDepth}), devicePixelRatio (${stats?.pixelRatio}).`,
        },
        {
            id: "viewport",
            fieldId: "viewport",
            category: "hardware",
            icon: Layout,
            simpleLabel: "Browser Window & Orientation",
            technicalLabel: "CSS Viewport & Screen Orientation",
            value: loading
                ? "…"
                : `${stats?.windowSize} viewport · ${stats?.orientation || "Unknown"}`,
            copyText: loading ? undefined : `${stats?.windowSize} (${stats?.orientation})`,
            simpleHelp: "The active usable pixel area inside your browser window right now—updates live on resize or zoom.",
            technicalHelp: `window.innerWidth × window.innerHeight (${stats?.windowSize}), ScreenOrientation (${stats?.orientation}).`,
        },
        {
            id: "cpu_ram",
            fieldId: "hardware",
            category: "hardware",
            featuredOnOverview: true,
            icon: Cpu,
            simpleLabel: "Processor & Memory",
            technicalLabel: "CPU Threads & Device Memory",
            value: loading ? "…" : `${stats?.cpuCores} CPU threads · ${stats?.ram} RAM`,
            simpleHelp: "Browsers round memory numbers intentionally (often capping at ~8 GB) to protect against tracking.",
            technicalHelp: "navigator.hardwareConcurrency (logical threads) & navigator.deviceMemory privacy-bucket estimate.",
        },
        {
            id: "gpu",
            fieldId: "gpu",
            category: "hardware",
            icon: Palette,
            simpleLabel: "Graphics Card (GPU)",
            technicalLabel: "WebGL Unmasked Renderer",
            value: loading ? "…" : stats?.webglVendor,
            copyText: loading ? undefined : stats?.webglVendor,
            simpleHelp: "Identifies the graphics hardware accelerating smooth animations and video playback.",
            technicalHelp: "Queried via WebGL WEBGL_debug_renderer_info extension.",
            isCode: true,
        },
        {
            id: "touch_battery",
            fieldId: "battery",
            category: "hardware",
            icon: Smartphone,
            simpleLabel: "Touchscreen & Battery",
            technicalLabel: "Touch Points & Battery API",
            value: loading
                ? "…"
                : `${stats?.touchSupport}${stats?.batteryLevel && stats.batteryLevel !== "N/A" ? ` · ${stats.batteryLevel} (${stats.batteryCharging})` : ""}`,
            simpleHelp: "Shows touchscreen support and laptop/phone charge status when exposed by your browser.",
            technicalHelp: "navigator.maxTouchPoints + optional Battery Status API.",
        },
        {
            id: "clock",
            fieldId: "clock",
            category: "hardware",
            icon: Clock,
            simpleLabel: "Timezone & Device Clock",
            technicalLabel: "Intl Timezone & Local Clock",
            value: loading ? "…" : `${stats?.timezone} · ${currentTime || "…"}`,
            simpleHelp: "Wrong system time can cause security warnings and broken 2FA login codes.",
            technicalHelp: "Intl.DateTimeFormat().resolvedOptions().timeZone synced with local system clock.",
        },

        // Privacy
        {
            id: "dnt",
            fieldId: "privacy",
            category: "privacy",
            icon: EyeOff,
            simpleLabel: "Do Not Track Signal",
            technicalLabel: "DNT Header (navigator.doNotTrack)",
            value: loading ? "…" : stats?.doNotTrack === "ENABLED" ? "Turned On" : "Off (Default)",
            simpleHelp: "Tells websites you prefer not to be tracked, though compliance is optional for sites.",
            technicalHelp: "Reads navigator.doNotTrack preference flag.",
        },
        {
            id: "gpc",
            fieldId: "privacy",
            category: "privacy",
            icon: ShieldCheck,
            simpleLabel: "Global Privacy Control (GPC)",
            technicalLabel: "navigator.globalPrivacyControl Signal",
            value: loading ? "…" : stats?.globalPrivacyControl === "ENABLED" ? "Enabled (Opt-Out Active)" : "Not Set",
            simpleHelp: "Modern browser-level signal telling websites not to sell or share your personal data.",
            technicalHelp: "Reads navigator.globalPrivacyControl standard boolean exposed by privacy browsers.",
        },
        {
            id: "adblock",
            fieldId: "privacy",
            category: "privacy",
            icon: ShieldAlert,
            simpleLabel: "Ad Blocker Extension",
            technicalLabel: "Content Blocking Heuristic",
            value: loading ? "Checking…" : stats?.adBlocker,
            simpleHelp: "Strict content blockers can occasionally hide checkout buttons or video players on support pages.",
            technicalHelp: "DOM bait & network script probe check for active ad-blocking filters.",
        },
        {
            id: "vpn_check",
            fieldId: "privacy",
            category: "privacy",
            icon: ShieldCheck,
            simpleLabel: "VPN / Cloud Proxy Flag",
            technicalLabel: "ISP Hosting / Datacenter Heuristic",
            value: ipLoading
                ? "Scanning…"
                : isSharedMasked
                ? maskedDisplayText()
                : stats?.vpnDetected
                ? "VPN / Datacenter Range"
                : "Standard Home / Mobile ISP",
            simpleHelp: "Indicates whether your IP belongs to a known VPN provider, proxy, or datacenter network.",
            technicalHelp: "Evaluates ASN/ISP organization keywords for commercial VPN and cloud hosting ranges.",
            status: isSharedMasked ? "neutral" : stats?.vpnDetected ? "warn" : "neutral",
            statusLabel: isSharedMasked ? "Masked" : stats?.vpnDetected ? "VPN / Cloud" : undefined,
        },
    ];

    const visibleRows = metricRows.filter((row) => {
        if (isCapturing) {
            if (row.id === "vpn_check" && !visibleFields.has("isp")) return false;
            return !row.fieldId || visibleFields.has(row.fieldId);
        }
        if (activeTab === "overview") return row.featuredOnOverview;
        return row.category === activeTab;
    });

    const tabs: { id: TabType; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
        { id: "overview", label: "Key Summary", icon: Activity },
        { id: "network", label: "Network & IP", icon: Wifi },
        { id: "browser", label: "Browser & OS", icon: Globe },
        { id: "hardware", label: "Hardware", icon: Cpu },
        { id: "privacy", label: "Privacy", icon: ShieldCheck },
    ];

    const statusBadgeClass = (s?: MetricRowDef["status"]) => {
        if (s === "good") return "bg-secondary/10 text-secondary border-secondary/30";
        if (s === "warn") return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30";
        if (s === "bad") return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30";
        return "bg-well text-muted border-line";
    };

    const humanVerdict = loading
        ? "Scanning your browser, operating system, screen size, and network connection locally…"
        : `You are using ${stats?.browserName} ${stats?.browserVersion} on ${stats?.osName} (${stats?.resolution}), routed through ${
              ipLoading
                  ? "your network"
                  : isSharedMasked || isMaskedValue(stats?.ispName)
                  ? "a privacy-masked network"
                  : stats?.ispName || "your ISP"
          } with ${stats?.latency !== "N/A" ? `${stats?.latency} response time` : "active connectivity"} and ${
              webrtcLoading
                  ? "an active WebRTC check"
                  : isWebRtcMasked
                  ? "WebRTC details hidden for privacy"
                  : webrtcSafe
                  ? "no WebRTC IP leak"
                  : "a visible WebRTC candidate"
          }.`;

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        mainEntity: HOME_FAQS.map((f) => ({
                            "@type": "Question",
                            name: f.q,
                            acceptedAnswer: { "@type": "Answer", text: f.a },
                        })),
                    }),
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "HowTo",
                        name: "How to Check Your Browser, IP and System Specs with MySupportInfo",
                        description:
                            "Step-by-step guide to discovering your full browser version, operating system, public IP, and hardware specifications for tech support.",
                        step: [
                            {
                                "@type": "HowToStep",
                                name: "Open MySupportInfo",
                                text: "Navigate to https://mysupportinfo.com on any computer, tablet, or phone without installing software.",
                                url: "https://mysupportinfo.com/#main-content",
                            },
                            {
                                "@type": "HowToStep",
                                name: "Review System Diagnostics",
                                text: "Your browser version, operating system, public IP address, screen resolution, GPU, RAM, and WebRTC privacy status load instantly in under 3 seconds.",
                                url: "https://mysupportinfo.com",
                            },
                            {
                                "@type": "HowToStep",
                                name: "Export or Share Diagnostic Data",
                                text: "Click 'Copy All Info' to copy raw text, or open 'Screenshot Report' to customize fields and export as a PNG image, PDF document, or CSV spreadsheet.",
                                url: "https://mysupportinfo.com",
                            },
                        ],
                    }),
                }}
            />

            <div className="bg-canvas text-ink pb-20">
                {/* Shared Remote Report Notification Banner */}
                {sharedReport && (
                    <div className="max-w-site mx-auto px-5 sm:px-6 pt-6">
                        <div className="bg-brand text-white p-4 sm:p-5 rounded-2xl border border-line-strong flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <ShieldCheck size={20} className="text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-base text-white">Viewing Shared Device Snapshot</span>
                                        <span className="text-3xs font-mono uppercase bg-white/15 px-2 py-0.5 rounded">Remote Report</span>
                                        {isSharedMasked && (
                                            <span className="text-3xs font-mono uppercase bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 px-2 py-0.5 rounded">
                                                IP &amp; Location Redacted
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-white/80 mt-0.5">
                                        Recorded {new Date(sharedReport.timestamp).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}.{" "}
                                        {isSharedMasked
                                            ? "Sender hid IP address, ISP, and location for privacy."
                                            : "Displaying the sender\u2019s exact browser, OS, and screen setup."}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={switchToMyDevice}
                                className="flex-shrink-0 px-4 py-2 bg-primary text-foreground font-bold text-xs rounded-lg hover:bg-primary-dark transition-colors cursor-pointer"
                            >
                                Inspect My Own Device
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Band 1: Asymmetric Signature Cockpit (Verdict + Preserved Circular Orb) ── */}
                <section className="max-w-site mx-auto px-5 sm:px-6 pt-10 pb-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                        {/* Left Column: Plain-English Hero + Actions */}
                        <div className="lg:col-span-7 space-y-6">
                            <div className="space-y-3">
                                <div className="inline-flex items-center gap-2 text-xs font-semibold text-secondary">
                                    <span className="size-2 rounded-full bg-secondary" aria-hidden="true" />
                                    <span>Runs locally in your browser &middot; Zero stored logs</span>
                                </div>
                                <h1 className="text-fluid-hero font-extrabold text-ink tracking-tight leading-tight">
                                    What Is My Browser, IP &amp; System Info?
                                </h1>
                                <p className="text-fluid-lead text-muted max-w-xl leading-relaxed">
                                    One instant page to check your device setup, spot internet leaks, and send clear answers to IT support—built to make sense to anyone.
                                </p>
                            </div>

                            {/* Plain-English Live Verdict Card */}
                            <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 space-y-3">
                                <div className="flex items-center justify-between gap-2 text-xs">
                                    <span className="font-bold text-ink">Instant Plain-English Summary</span>
                                    <span className="font-mono text-2xs text-muted">
                                        {loading ? "Detecting…" : "Live in memory"}
                                    </span>
                                </div>
                                <p className="text-sm text-ink leading-relaxed font-medium" aria-live="polite">
                                    {humanVerdict}
                                </p>
                            </div>

                            {/* Focused Primary CTA + Compact Actions */}
                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setIsScreenshotModalOpen(true)}
                                        disabled={loading || downloading}
                                        aria-label="Customize and export diagnostic report as PNG image, PDF, or CSV"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-foreground font-bold text-sm rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 cursor-pointer"
                                    >
                                        <Download size={16} aria-hidden="true" />
                                        <span>
                                            {downloading
                                                ? exportingFormat === "pdf"
                                                    ? "Generating PDF…"
                                                    : "Generating…"
                                                : "Screenshot Report"}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={copyAllInfo}
                                        aria-label="Copy All Info to clipboard"
                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-white font-semibold text-sm rounded-xl hover:opacity-95 transition-opacity cursor-pointer"
                                    >
                                        {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
                                        <span>{copied ? "Copied Info" : "Copy All Info"}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsShareModalOpen(true)}
                                        aria-label="Share Link with IT support"
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-surface text-ink border border-line-strong hover:bg-hover transition-colors rounded-xl text-xs sm:text-sm font-semibold cursor-pointer"
                                    >
                                        <Share2 size={14} aria-hidden="true" />
                                        <span>Share Link</span>
                                    </button>
                                </div>

                                <div className="text-xs text-muted flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <span>Exports PNG image, PDF &amp; CSV inside Screenshot Report.</span>
                                    <span aria-hidden="true">&middot;</span>
                                    <span>
                                        Wrong detail?{" "}
                                        <button
                                            type="button"
                                            onClick={() => setIsReportErrorOpen(true)}
                                            className="font-semibold text-ink underline underline-offset-4 hover:text-primary transition-colors cursor-pointer"
                                        >
                                            Report a detection issue
                                        </button>
                                    </span>
                                </div>
                            </div>

                            <div className="sr-only" role="status" aria-live="polite">
                                {copied && "All device specifications copied to clipboard."}
                            </div>
                        </div>

                        {/* Right Column: Preserved Signature Circular Diagnostic Orb */}
                        <div className="lg:col-span-5 flex justify-center">
                            <div className="relative w-full max-w-[380px] sm:max-w-orb aspect-square rounded-full flex flex-col items-center justify-center overflow-hidden bg-brand border-2 border-accent/25 shadow-brand-ring p-7 sm:p-10">
                                <div className="absolute inset-4 rounded-full border border-dashed border-accent/20 pointer-events-none" />
                                <div className="relative z-10 flex flex-col items-center text-center w-full">
                                    <span className="text-3xs text-accent/85 uppercase tracking-widest font-bold mb-3">
                                        Main Browser
                                    </span>
                                    <h2
                                        className="font-sans font-extrabold text-white tracking-tight mb-5 w-full"
                                        style={{ fontSize: "clamp(1.6rem, 3.6vw, 2.75rem)", lineHeight: 1.08 }}
                                    >
                                        {loading
                                            ? "Detecting…"
                                            : isCapturing && !visibleFields.has("browser")
                                            ? "Browser Masked"
                                            : `${stats?.browserName} ${stats?.browserVersion}`}
                                    </h2>

                                    <div className="flex items-center justify-center gap-5 sm:gap-8 mb-5">
                                        <div className="text-center">
                                            <p className="text-3xs text-accent/75 uppercase tracking-wider font-semibold mb-1 whitespace-nowrap">
                                                OS Platform
                                            </p>
                                            <p className="text-sm sm:text-base font-bold text-white">
                                                {loading ? "…" : isCapturing && !visibleFields.has("os") ? "Hidden" : stats?.osName}
                                            </p>
                                        </div>
                                        <div className="w-px h-8 bg-white/20 flex-shrink-0" />
                                        <div className="text-center">
                                            <p className="text-3xs text-accent/75 uppercase tracking-wider font-semibold mb-1 whitespace-nowrap">
                                                Public IP
                                            </p>
                                            <p className="text-xs sm:text-sm font-semibold text-accent font-mono tabular-nums break-all">
                                                {ipLoading
                                                    ? "Scanning…"
                                                    : isCapturing && !visibleFields.has("ip")
                                                    ? "[Masked]"
                                                    : isMaskedValue(stats?.ip)
                                                    ? "Hidden"
                                                    : stats?.ip}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-3xs uppercase tracking-widest font-mono text-white/65">
                                        mysupportinfo.com
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Band 1B: Interactive Plain-English / Engineer Diagnostic Ledger (also Screenshot Target) ── */}
                <div ref={reportRef} className={`w-full ${isCapturing ? "py-8 bg-canvas" : "pb-14"}`}>
                    <div className="max-w-site mx-auto px-5 sm:px-6">
                        {isCapturing ? (
                            (() => {
                                const isMaskedPii = isSharedMasked || IP_PRIVACY_FIELD_IDS.every((f) => !visibleFields.has(f));
                                const captureGroups: { title: string; items: MetricRowDef[] }[] = [
                                    {
                                        title: "Browser & System",
                                        items: metricRows.filter((r) => r.category === "browser" && (!r.fieldId || visibleFields.has(r.fieldId))),
                                    },
                                    {
                                        title: "Network & Connection",
                                        items: metricRows.filter((r) => r.category === "network" && (!r.fieldId || visibleFields.has(r.fieldId))),
                                    },
                                    {
                                        title: "Hardware & Display",
                                        items: metricRows.filter((r) => r.category === "hardware" && (!r.fieldId || visibleFields.has(r.fieldId))),
                                    },
                                    {
                                        title: "Privacy & Security",
                                        items: metricRows.filter(
                                            (r) =>
                                                r.category === "privacy" &&
                                                (!r.fieldId || visibleFields.has(r.fieldId)) &&
                                                (r.id !== "vpn_check" || visibleFields.has("isp"))
                                        ),
                                    },
                                ].filter((g) => g.items.length > 0);

                                const leftGroups = captureGroups.filter((_, idx) => idx % 2 === 0);
                                const rightGroups = captureGroups.filter((_, idx) => idx % 2 === 1);

                                return (
                                    <div className="rounded-2xl overflow-hidden border border-line-strong bg-surface shadow-subtle">
                                        {/* Integrated Branded Card Header */}
                                        <div className="bg-brand text-white px-7 py-5 flex flex-row items-center justify-between gap-4 border-b border-white/10">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2.5 flex-wrap">
                                                    <span className="font-extrabold text-xl text-white">
                                                        MySupport<span className="text-primary">Info</span>
                                                    </span>
                                                    <span className="text-white/35 text-sm font-normal" aria-hidden="true">|</span>
                                                    <span className="text-[11px] font-bold uppercase text-accent">
                                                        Official Device Report
                                                    </span>
                                                    {isMaskedPii && (
                                                        <>
                                                            <span className="text-white/35 text-sm font-normal" aria-hidden="true">|</span>
                                                            <span className="text-[11px] font-bold uppercase text-emerald-300">
                                                                &#10003; IP Masked
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                                <p className="text-xs text-white/80">
                                                    Client-side snapshot generated in browser memory at https://mysupportinfo.com
                                                </p>
                                            </div>
                                            <div className="text-xs font-mono text-accent text-right">
                                                {new Date().toUTCString()}
                                            </div>
                                        </div>

                                        {/* At-a-Glance Highlights Strip */}
                                        <div className="grid grid-cols-4 border-b border-line bg-well/40 divide-x divide-line">
                                            <div className="px-5 py-3.5">
                                                <div className="text-[11px] font-semibold text-muted mb-0.5">Browser</div>
                                                <div className="text-sm font-bold text-ink">
                                                    {visibleFields.has("browser") ? `${stats?.browserName || "—"} ${stats?.browserVersion || ""}`.trim() : "Masked"}
                                                </div>
                                            </div>
                                            <div className="px-5 py-3.5">
                                                <div className="text-[11px] font-semibold text-muted mb-0.5">Platform / OS</div>
                                                <div className="text-sm font-bold text-ink">
                                                    {visibleFields.has("os") ? stats?.osName || "—" : "Masked"}
                                                </div>
                                            </div>
                                            <div className="px-5 py-3.5">
                                                <div className="text-[11px] font-semibold text-muted mb-0.5">Display / Viewport</div>
                                                <div className="text-sm font-bold text-ink">
                                                    {visibleFields.has("screen") || visibleFields.has("viewport")
                                                        ? `${stats?.resolution || "—"} · ${stats?.pixelRatio || "1x"}`
                                                        : "Masked"}
                                                </div>
                                            </div>
                                            <div className="px-5 py-3.5">
                                                <div className="text-[11px] font-semibold text-muted mb-0.5">Public IP / Ping</div>
                                                <div className="text-sm font-bold text-ink break-words leading-normal">
                                                    {visibleFields.has("ip") && !isMaskedValue(stats?.ip)
                                                        ? `${stats?.ip || "—"} (${stats?.latency || "—"})`
                                                        : `Ping: ${stats?.latency || "—"}`}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Balanced 2-Column Categorized Spec Card */}
                                        <div className="grid grid-cols-2 divide-x divide-line">
                                            {[leftGroups, rightGroups].map((colGroups, colIdx) => (
                                                <div key={colIdx} className="divide-y divide-line">
                                                    {colGroups.map((group) => (
                                                        <div key={group.title} className="p-5 sm:p-6 space-y-3">
                                                            <div className="text-xs font-bold uppercase text-secondary border-b border-line pb-1.5">
                                                                {group.title}
                                                            </div>
                                                            <div className="space-y-2.5">
                                                                {group.items.map((row) => (
                                                                    <div key={row.id} className="flex items-start justify-between gap-4 text-xs">
                                                                        <span className="font-medium text-muted leading-snug flex-shrink-0">
                                                                            {audienceMode === "simple" ? row.simpleLabel : row.technicalLabel}
                                                                        </span>
                                                                        <span
                                                                            className={`font-semibold text-ink leading-snug ${
                                                                                row.isCode
                                                                                    ? "font-mono text-[11px] bg-well/60 border border-line px-2.5 py-1.5 rounded max-w-[340px] text-left break-words"
                                                                                    : "text-right break-words"
                                                                            }`}
                                                                        >
                                                                            {row.value}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Provenance Card Footer */}
                                        <div className="px-7 py-3 bg-well/50 border-t border-line flex items-center justify-between text-xs text-muted">
                                            <span>Verified In-Browser &middot; Zero Database Logs &middot; Privacy-First Diagnostics</span>
                                            <span className="font-semibold text-ink">mysupportinfo.com</span>
                                        </div>
                                    </div>
                                );
                            })()
                        ) : (
                            <div className="bg-surface border border-line rounded-2xl shadow-subtle overflow-hidden">
                            {/* Toolbar */}
                            {!isCapturing && (
                                <div className="px-4 sm:px-6 py-3.5 border-b border-line bg-well/40 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                                    {/* Category Tabs */}
                                    <div
                                        role="tablist"
                                        aria-label="Diagnostic detail categories"
                                        className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 md:flex-wrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                                    >
                                        {tabs.map((tab) => {
                                            const active = activeTab === tab.id;
                                            const Icon = tab.icon;
                                            return (
                                                <button
                                                    key={tab.id}
                                                    id={`tab-${tab.id}`}
                                                    role="tab"
                                                    type="button"
                                                    aria-selected={active}
                                                    aria-controls="diagnostic-ledger-panel"
                                                    onClick={() => setActiveTab(tab.id)}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                                                        active
                                                            ? "bg-brand text-white dark:bg-primary dark:text-foreground"
                                                            : "text-muted hover:text-ink hover:bg-hover"
                                                    }`}
                                                >
                                                    <Icon size={14} aria-hidden="true" />
                                                    <span>{tab.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Audience Toggle: Plain English vs Engineer */}
                                    <div
                                        role="group"
                                        aria-label="Detail explanation level"
                                        className="inline-flex items-center self-start lg:self-auto bg-canvas border border-line rounded-lg p-0.5 text-xs"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setAudienceMode("simple")}
                                            aria-pressed={audienceMode === "simple"}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                                                audienceMode === "simple"
                                                    ? "bg-surface text-ink shadow-sm border border-line"
                                                    : "text-muted hover:text-ink"
                                            }`}
                                        >
                                            <User size={12} aria-hidden="true" />
                                            <span>Plain English</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAudienceMode("technical")}
                                            aria-pressed={audienceMode === "technical"}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                                                audienceMode === "technical"
                                                    ? "bg-surface text-ink shadow-sm border border-line"
                                                    : "text-muted hover:text-ink"
                                            }`}
                                        >
                                            <Wrench size={12} aria-hidden="true" />
                                            <span>Engineer</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Tabular Diagnostic Ledger */}
                            <div
                                id="diagnostic-ledger-panel"
                                role="tabpanel"
                                aria-labelledby={isCapturing ? undefined : `tab-${activeTab}`}
                                className="divide-y divide-line"
                            >
                                        {visibleRows.map((row) => {
                                            const Icon = row.icon;
                                            const isExpanded = expandedHelpId === row.id;
                                            const label = audienceMode === "simple" ? row.simpleLabel : row.technicalLabel;
                                            const helpText = audienceMode === "simple" ? row.simpleHelp : row.technicalHelp;

                                            return (
                                                <div key={row.id} className="px-4 sm:px-6 py-3.5 sm:py-4 hover:bg-hover/65 transition-colors">
                                                    <div className="grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-12 gap-x-3 gap-y-1.5 md:gap-4 items-start md:items-center">
                                                        {/* Label + Optional Explanation Trigger */}
                                                        <div className="col-start-1 row-start-1 md:col-start-auto md:row-start-auto md:col-span-4 flex items-start md:items-center gap-2 min-w-0">
                                                            <Icon size={15} className="text-secondary flex-shrink-0 mt-0.5 md:mt-0" aria-hidden="true" />
                                                            <span className="text-xs sm:text-sm font-semibold text-ink leading-snug break-words">
                                                                {label}
                                                            </span>
                                                            {!isCapturing && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setExpandedHelpId(isExpanded ? null : row.id)}
                                                                    aria-expanded={isExpanded}
                                                                    aria-label={`Explain ${label}`}
                                                                    className={`text-muted hover:text-ink transition-colors p-0.5 rounded cursor-pointer flex-shrink-0 ${
                                                                        isExpanded ? "text-primary" : ""
                                                                    }`}
                                                                >
                                                                    <HelpCircle size={14} aria-hidden="true" />
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* Detected Value */}
                                                        <div
                                                            className={`${
                                                                row.isCode ? "pl-0" : "pl-6 md:pl-0"
                                                            } col-span-2 row-start-2 md:col-span-6 md:row-start-auto min-w-0`}
                                                        >
                                                            {row.isCode ? (
                                                                <div className="font-mono text-xs text-ink bg-well/70 border border-line px-3 py-2 rounded-lg break-all leading-relaxed">
                                                                    {row.value}
                                                                </div>
                                                            ) : (
                                                                <div className="text-sm sm:text-base font-bold text-ink tabular-nums break-words">
                                                                    {row.value}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Right Status / Action */}
                                                        {(row.statusLabel || row.action || (!isCapturing && row.copyText)) && (
                                                            <div className="col-start-2 row-start-1 justify-self-end md:col-start-auto md:row-start-auto md:col-span-2 md:justify-self-auto flex items-center justify-end gap-1.5 flex-wrap max-w-[148px] md:max-w-none flex-shrink-0">
                                                                {row.statusLabel && (
                                                                    <span
                                                                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-2xs font-semibold border whitespace-nowrap ${statusBadgeClass(
                                                                            row.status
                                                                        )}`}
                                                                    >
                                                                        {row.statusLabel}
                                                                    </span>
                                                                )}
                                                                {row.action}
                                                                {!isCapturing && row.copyText && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleCopySingleValue(row.id, row.copyText!)}
                                                                        aria-label={`Copy ${label}`}
                                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-line text-2xs font-semibold text-muted hover:text-ink hover:border-line-strong transition-colors cursor-pointer whitespace-nowrap"
                                                                    >
                                                                        {copiedFieldId === row.id ? (
                                                                            <>
                                                                                <Check size={12} className="text-secondary" aria-hidden="true" />
                                                                                <span>Copied</span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Copy size={12} aria-hidden="true" />
                                                                                <span>Copy</span>
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Accessible Plain-English Expandable Explanation */}
                                                    {isExpanded && (
                                                        <p className="mt-2.5 ml-6 md:ml-6 text-xs text-muted bg-well/50 border border-line rounded-lg px-3.5 py-2.5 max-w-3xl leading-relaxed">
                                                            {helpText}
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                            </div>

                            {/* Footer note inside workbench */}
                            {!isCapturing && (
                                <div className="px-4 sm:px-6 py-3 bg-well/30 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted">
                                    <span>
                                        Showing {visibleRows.length} items in <strong>{audienceMode === "simple" ? "Plain English" : "Engineer"}</strong> mode. Use the category tabs above to inspect all {metricRows.length} metrics.
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setAudienceMode(audienceMode === "simple" ? "technical" : "simple")}
                                        className="font-semibold text-secondary hover:underline underline-offset-4 w-fit cursor-pointer"
                                    >
                                        Switch to {audienceMode === "simple" ? "Engineer Mode" : "Plain English"}
                                    </button>
                                </div>
                            )}
                        </div>
                        )}
                    </div>
                </div>

                {/* ── Band 2: Full-Bleed Deep Teal Tool Hub (Elastic Path Contrast Rhythm) ── */}
                <section aria-labelledby="specialized-tools-heading" className="w-full bg-brand text-white border-y border-white/10 py-14">
                    <div className="max-w-site mx-auto px-5 sm:px-6 space-y-8">
                        <div className="max-w-2xl space-y-2">
                            <p className="text-xs font-bold uppercase tracking-wider text-primary">
                                Dedicated Diagnostic Tools
                            </p>
                            <h2 id="specialized-tools-heading" className="text-fluid-h2 font-extrabold text-white tracking-tight">
                                Focused checks for sluggish lag, IP privacy, browsers, and displays
                            </h2>
                            <p className="text-sm text-white/80 leading-relaxed">
                                Jump directly to a single tool instead of digging through operating system menus or ad-heavy lookup pages.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-white/15 rounded-2xl overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-white/15 bg-black/15">
                            {STANDALONE_TOOLS.map((tool) => (
                                <Link
                                    key={tool.href}
                                    href={tool.href}
                                    className="group p-6 flex flex-col justify-between gap-6 hover:bg-white/10 transition-colors"
                                >
                                    <div className="space-y-2">
                                        <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors">
                                            {tool.title}
                                        </h3>
                                        <p className="text-xs text-white/80 leading-relaxed">
                                            {tool.desc}
                                        </p>
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                                        <span>{tool.cta}</span>
                                        <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                                    </span>
                                </Link>
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-white/80 border-t border-white/10">
                            <div className="flex items-center gap-6 flex-wrap">
                                <Link href="/privacy" className="hover:text-primary transition-colors inline-flex items-center gap-1.5 font-semibold">
                                    <span>Privacy Centre — Zero server logging</span>
                                    <ArrowRight size={12} aria-hidden="true" />
                                </Link>
                                <Link href="/faq" className="hover:text-primary transition-colors inline-flex items-center gap-1.5 font-semibold">
                                    <span>Knowledge Base (FAQ)</span>
                                    <ArrowRight size={12} aria-hidden="true" />
                                </Link>
                            </div>
                            <span className="font-mono text-2xs text-accent">
                                No software installs required
                            </span>
                        </div>
                    </div>
                </section>

                {/* ── Band 3: Real Interactive Support Ticket Builder ── */}
                <section aria-labelledby="ticket-builder-heading" className="max-w-site mx-auto px-5 sm:px-6 py-16">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                        <div className="lg:col-span-5 space-y-5">
                            <div className="space-y-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-secondary">
                                    Ready For Any Helpdesk
                                </p>
                                <h2 id="ticket-builder-heading" className="text-fluid-h2 font-extrabold text-ink tracking-tight">
                                    Send exact specs in one clean block
                                </h2>
                                <p className="text-sm text-muted leading-relaxed">
                                    Stop typing browser versions or taking blurry phone pictures of settings screens. Copy a clean ticket snippet with optional IP redaction.
                                </p>
                            </div>

                            <ol className="space-y-3 text-sm text-ink">
                                <li className="flex items-start gap-3">
                                    <span className="size-6 rounded-full bg-well border border-line text-xs font-mono font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                        1
                                    </span>
                                    <span className="text-muted">
                                        Toggle <strong className="text-ink">Mask IP &amp; ISP</strong> if you are posting publicly in GitHub or Discord.
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="size-6 rounded-full bg-well border border-line text-xs font-mono font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                        2
                                    </span>
                                    <span className="text-muted">
                                        Paste directly into Zendesk, Jira, email, or live support chat.
                                    </span>
                                </li>
                            </ol>

                            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-semibold">
                                <Link href="/what-is-my-browser" className="text-secondary hover:underline underline-offset-4 inline-flex items-center gap-1">
                                    <span>Inspect Browser Engine</span>
                                    <ArrowRight size={13} aria-hidden="true" />
                                </Link>
                                <Link href="/what-is-my-screen-resolution" className="text-ink hover:text-primary transition-colors underline underline-offset-4 inline-flex items-center gap-1">
                                    <span>Check Viewport Scaling</span>
                                    <ArrowRight size={13} aria-hidden="true" />
                                </Link>
                            </div>
                        </div>

                        <div className="lg:col-span-7 bg-surface border border-line rounded-2xl overflow-hidden shadow-subtle">
                            <div className="px-4 sm:px-5 py-3 bg-well/50 border-b border-line flex items-center justify-between gap-3 flex-wrap">
                                <span className="text-xs font-bold text-ink">
                                    Live Support Ticket Snippet
                                </span>
                                <div className="flex items-center gap-3">
                                    <label className="inline-flex items-center gap-2 text-xs font-medium text-ink cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={maskTicketIp}
                                            onChange={(e) => setMaskTicketIp(e.target.checked)}
                                            className="size-3.5 rounded accent-secondary"
                                        />
                                        <span>Mask IP &amp; ISP</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleCopyTicketSnippet}
                                        disabled={loading}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer"
                                    >
                                        {ticketCopied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
                                        <span>{ticketCopied ? "Copied Ticket" : "Copy Ticket"}</span>
                                    </button>
                                </div>
                            </div>
                            <pre className="p-4 sm:p-5 text-xs font-mono text-ink leading-relaxed whitespace-pre-wrap break-words bg-surface">
                                {buildSupportSummaryText(maskTicketIp)}
                            </pre>
                        </div>
                    </div>
                </section>

                {/* ── Band 4: FAQ Accordion ── */}
                <div className="max-w-site mx-auto px-5 sm:px-6 pt-4">
                    <DiagnosticFaqSection title="Common Questions & Support Details" items={HOME_FAQS} />
                </div>

                {/* Modals */}
                <ScreenshotModal
                    isOpen={isScreenshotModalOpen}
                    onClose={() => setIsScreenshotModalOpen(false)}
                    onCapture={async (selected, format) => {
                        setIsScreenshotModalOpen(false);
                        await performCapture(selected, format);
                    }}
                    stats={stats}
                    webrtcLeak={webrtcLeak}
                    currentTime={currentTime}
                    downloading={downloading}
                    exportingFormat={exportingFormat}
                    senderMasked={isSharedMasked}
                />

                <ShareModal
                    isOpen={isShareModalOpen}
                    onClose={() => setIsShareModalOpen(false)}
                    stats={stats}
                    webrtcLeak={webrtcLeak}
                />

                <ReportErrorModal
                    isOpen={isReportErrorOpen}
                    onClose={() => setIsReportErrorOpen(false)}
                    systemStats={stats}
                />
            </div>
        </>
    );
}
