"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
    Monitor, Signal, HardDrive, Cpu, Clock, EyeOff, Terminal,
    MapPin, Wifi, Copy, Share2, Download, Palette, Globe,
    Battery, ShieldCheck, ShieldAlert, Languages, Smartphone,
    Activity, Zap, Layout, Lock, Info, ArrowRight, HelpCircle,
    FileSpreadsheet,
} from "lucide-react";
import FadeIn from "@/components/ui/FadeIn";
import ScreenshotModal, { FieldId, DEFAULT_SELECTED_FIELDS, SENSITIVE_FIELD_IDS } from "@/components/ui/ScreenshotModal";
import ShareModal from "@/components/ui/ShareModal";
import ReportErrorModal from "@/components/ui/ReportErrorModal";
import { decodeReport, SharedReportData } from "@/lib/report-share";
import { generateDiagnosticCSV, downloadCSV } from "@/lib/export-csv";

type TabType = "network" | "browser" | "hardware" | "privacy";

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
    adBlocker: string;
    userAgent: string;
    timezone: string;
}

const getLatencyStatus = (val: string): "good" | "warn" | "bad" | "info" => {
    const ms = parseInt(val);
    if (isNaN(ms)) return "info";
    if (ms < 50) return "good";
    if (ms < 150) return "warn";
    return "bad";
};

const getSpeedStatus = (val: string): "good" | "warn" | "bad" | "info" => {
    const mbps = parseFloat(val);
    if (isNaN(mbps)) return "info";
    if (mbps > 50) return "good";
    if (mbps > 10) return "warn";
    return "bad";
};

const getBatteryStatus = (level: string): "good" | "warn" | "bad" | "info" => {
    if (level === "N/A") return "info";
    const pct = parseInt(level);
    if (isNaN(pct)) return "info";
    if (pct > 50) return "good";
    if (pct > 20) return "warn";
    return "bad";
};

type NavigatorWithUserAgentData = Navigator & {
    userAgentData?: {
        platform?: string;
        getHighEntropyValues?: (hints: string[]) => Promise<{ platform?: string }>;
    };
};

const platformToOS = (platform: string, ua: string): string | null => {
    const value = platform.toLowerCase();
    const hasTouch = typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;

    if (value.includes("android")) return "Android";
    if (value.includes("ios") || value.includes("iphone") || value.includes("ipad")) return "iOS";
    if (value.includes("windows") || value.includes("win")) return "Windows";
    if (value.includes("chrome os") || value.includes("cros")) return "ChromeOS";
    if (value.includes("mac")) {
        return ua.includes("Macintosh") && navigator.maxTouchPoints > 1 ? "iPadOS" : "macOS";
    }
    if (value.includes("linux")) {
        if (/Android/i.test(ua)) return "Android";
        if (hasTouch) return "Android/Linux Tablet";
        return "Linux";
    }

    return null;
};

const detectOSName = async (ua: string): Promise<string> => {
    const nav = navigator as NavigatorWithUserAgentData;

    try {
        const hints = await nav.userAgentData?.getHighEntropyValues?.(["platform"]);
        const osFromHints = platformToOS(hints?.platform || nav.userAgentData?.platform || "", ua);
        if (osFromHints) return osFromHints;
    } catch { /* ignore unavailable client hints */ }

    const platform = platformToOS(navigator.platform || "", ua);
    if (platform && platform !== "Linux") return platform;

    if (/Android/i.test(ua)) return "Android";
    if (/iPad/i.test(ua)) return "iPadOS";
    if (/iPhone|iPod/i.test(ua)) return "iOS";
    if (/Windows NT|Win64|Win32/i.test(ua)) return "Windows";
    if (/CrOS/i.test(ua)) return "ChromeOS";
    if (/Macintosh|Mac OS X/i.test(ua)) return navigator.maxTouchPoints > 1 ? "iPadOS" : "macOS";
    if (/Linux/i.test(ua)) return navigator.maxTouchPoints > 0 ? "Android/Linux Tablet" : "Linux";

    return platform || "Unknown OS";
};

const IP_CACHE_KEY = "msi_ip_v2";
const IP_CACHE_TTL = 5 * 60 * 1000;

export default function Home() {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [ipLoading, setIpLoading] = useState(true);
    const [webrtcLeak, setWebrtcLeak] = useState<string>("Scanning…");
    const [webrtcLoading, setWebrtcLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>("network");
    const [isCapturing, setIsCapturing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [currentTime, setCurrentTime] = useState<string>("");
    const [openFaq, setOpenFaq] = useState<number | null>(null);
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

    // Check for shared report parameter (?report=...) on load
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
                    connectionType: "N/A",
                    connectionSpeed: "N/A",
                    latency: "N/A",
                    ip: decoded.ip,
                    ipv6: decoded.ipv6,
                    ispName: decoded.ispName,
                    city: decoded.location.split(",")[0]?.trim() || "",
                    country: decoded.location.split(",")[1]?.trim() || "",
                    countryCode: "",
                    vpnDetected: false,
                    resolution: decoded.resolution,
                    windowSize: decoded.windowSize,
                    pixelRatio: decoded.pixelRatio,
                    colorDepth: decoded.colorDepth,
                    orientation: "Unknown",
                    touchSupport: "N/A",
                    cpuCores: decoded.cpuCores,
                    ram: decoded.ram,
                    webglVendor: decoded.webglVendor,
                    batteryLevel: "N/A",
                    batteryCharging: "N/A",
                    persistence: decoded.persistence,
                    doNotTrack: decoded.doNotTrack,
                    adBlocker: "N/A",
                    userAgent: "Shared device snapshot",
                    timezone: decoded.timezone,
                });
                setLoading(false);
                setIpLoading(false);
                setWebrtcLoading(false);
                setWebrtcLeak("Protected (Report)");
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
        const fetchStats = async () => {
            if (typeof window !== "undefined" && window.location.search.includes("report=")) {
                const p = new URLSearchParams(window.location.search);
                if (p.get("report") && decodeReport(p.get("report")!)) {
                    return; // Retain shared report snapshot
                }
            }
            const ua = navigator.userAgent;
            let browserName = "Unknown";
            let browserVersion = "";

            if (ua.includes("Edg/") || ua.includes("Edge/") || ua.includes("EdgA/") || ua.includes("EdgiOS/")) {
                browserName = "Microsoft Edge";
                browserVersion = ua.match(/Edg\/(\d+)/)?.[1] || ua.match(/Edge\/(\d+)/)?.[1] || ua.match(/EdgA\/(\d+)/)?.[1] || ua.match(/EdgiOS\/(\d+)/)?.[1] || "";
            } else if (ua.includes("SamsungBrowser/")) {
                browserName = "Samsung Internet";
                browserVersion = ua.match(/SamsungBrowser\/(\d+)/)?.[1] || "";
            } else if (ua.includes("YaBrowser/")) {
                browserName = "Yandex Browser";
                browserVersion = ua.match(/YaBrowser\/(\d+)/)?.[1] || "";
            } else if (ua.includes("UCBrowser/")) {
                browserName = "UC Browser";
                browserVersion = ua.match(/UCBrowser\/(\d+)/)?.[1] || "";
            } else if (ua.includes("DuckDuckGo/")) {
                browserName = "DuckDuckGo";
                browserVersion = ua.match(/DuckDuckGo\/(\d+)/)?.[1] || "";
            } else if (ua.includes("Vivaldi/")) {
                browserName = "Vivaldi";
                browserVersion = ua.match(/Vivaldi\/(\d+)/)?.[1] || "";
            } else if (ua.includes("OPR/") || ua.includes("OPT/")) {
                browserName = "Opera";
                browserVersion = ua.match(/OPR\/(\d+)/)?.[1] || ua.match(/OPT\/(\d+)/)?.[1] || "";
            } else if (ua.includes("Opera Mini") || ua.includes("OPiOS/")) {
                browserName = "Opera Mini";
                browserVersion = ua.match(/Opera Mini\/(\d+)/)?.[1] || ua.match(/OPiOS\/(\d+)/)?.[1] || "";
            } else if (ua.includes("CriOS/")) {
                browserName = "Chrome";
                browserVersion = ua.match(/CriOS\/(\d+)/)?.[1] || "";
            } else if (ua.includes("FxiOS/")) {
                browserName = "Firefox";
                browserVersion = ua.match(/FxiOS\/(\d+)/)?.[1] || "";
            } else if (ua.includes("Firefox/")) {
                browserName = "Firefox";
                browserVersion = ua.match(/Firefox\/(\d+)/)?.[1] || "";
            } else if (ua.includes("Silk/")) {
                browserName = "Amazon Silk";
                browserVersion = ua.match(/Silk\/(\d+)/)?.[1] || "";
            } else if (ua.includes("Chrome/")) {
                browserName = "Chrome";
                browserVersion = ua.match(/Chrome\/(\d+)/)?.[1] || "";
            } else if (ua.includes("Safari/")) {
                browserName = "Safari";
                browserVersion = ua.match(/Version\/(\d+)/)?.[1] || "";
            }

            // Brave browser detection (which masks as Chrome in UA)
            // @ts-expect-error - Brave specific API
            if (typeof navigator !== "undefined" && navigator.brave?.isBrave) {
                try {
                    // @ts-expect-error - Brave specific API
                    const isBrave = await navigator.brave.isBrave();
                    if (isBrave) browserName = "Brave";
                } catch { /* ignore */ }
            }

            const osName = await detectOSName(ua);

            // @ts-expect-error - Experimental API
            const conn = navigator.connection;
            // Network Information API is only available on mobile Chrome/Android
            const connType = conn?.effectiveType?.toUpperCase() || "N/A";
            const connSpeed = conn?.downlink ? `${conn.downlink} Mbps` : "N/A";
            const persistence = navigator.cookieEnabled ? "ENABLED" : "DISABLED";
            // @ts-expect-error - Experimental API
            const ram = navigator.deviceMemory ? `~${navigator.deviceMemory} GB` : "Unknown";
            const cpu = navigator.hardwareConcurrency || "Unknown";
            let latency = conn?.rtt ? `${conn.rtt} ms` : "N/A";

            // If Network Information API is unavailable (e.g. desktop browsers), measure live HTTP round-trip
            if (latency === "N/A" && typeof window !== "undefined") {
                try {
                    const pStart = performance.now();
                    await fetch("/favicon.svg?t=" + Date.now(), { method: "HEAD", cache: "no-store" });
                    const rtt = Math.round(performance.now() - pStart);
                    if (rtt > 0) latency = `${rtt} ms`;
                } catch { /* ignore */ }
            }

            const dnt = navigator.doNotTrack === "1" ? "ENABLED" : "DISABLED";
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const language = navigator.language || "Unknown";
            const touchPoints = navigator.maxTouchPoints;
            const touchSupport = touchPoints > 0 ? `Supported (${touchPoints} pt)` : "Not Supported";
            const orientation = screen.orientation?.type?.replace("-primary", "").replace("-secondary", " (alt)") || "Unknown";
            const screenRes = `${window.screen.width} × ${window.screen.height}`;
            const windowSizeVal = `${window.innerWidth} × ${window.innerHeight}`;
            const pixelRatioVal = `${window.devicePixelRatio}x`;
            const colorDepthVal = `${window.screen.colorDepth} bit`;

            // Ad blocker detection (DOM bait + script network check)
            let adBlocker = "Not Detected";
            try {
                const testEl = document.createElement("div");
                testEl.className = "ad ads advert banner adsbox ad-banner ad-placement";
                testEl.style.cssText = "position:absolute;left:-9999px;height:1px;width:1px;opacity:0;";
                document.body.appendChild(testEl);
                await new Promise(r => setTimeout(r, 120));
                const isDomHidden = testEl.offsetHeight === 0 || testEl.clientHeight === 0 || window.getComputedStyle(testEl).display === "none";
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

            // Battery
            let batteryLevel = "N/A";
            let batteryCharging = "N/A";
            try {
                // @ts-expect-error - experimental
                const bat = await navigator.getBattery?.();
                if (bat) {
                    batteryLevel = `${Math.round(bat.level * 100)}%`;
                    batteryCharging = bat.charging ? "Charging" : "On Battery";
                }
            } catch { /* ignore */ }

            // WebGL
            let webgl = "Unknown";
            try {
                const canvas = document.createElement("canvas");
                const gl = canvas.getContext("webgl");
                if (gl) {
                    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
                    if (dbg) webgl = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
                }
            } catch { /* ignore */ }

            // IP data (with sessionStorage cache and multi-provider fallback)
            let ip = "Unavailable";
            let ipv6 = "Not Available";
            let ispName = "Unknown ISP";
            let city = "";
            let country = "";
            let countryCode = "";
            let vpnDetected = false;
            let usedCache = false;

            try {
                const raw = sessionStorage.getItem(IP_CACHE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Date.now() - parsed.ts < IP_CACHE_TTL) {
                        ({ ip, ipv6, ispName, city, country, countryCode, vpnDetected } = parsed);
                        usedCache = true;
                    }
                }
            } catch { /* ignore */ }

            if (!usedCache) {
                try {
                    const ctrl = new AbortController();
                    const tid = setTimeout(() => ctrl.abort(), 5000);
                    const res = await fetch("https://ipapi.co/json/", { signal: ctrl.signal });
                    clearTimeout(tid);
                    if (!res.ok) throw new Error("ipapi failed");
                    const data = await res.json();
                    if (data.error) throw new Error(data.reason || "ipapi error");
                    ip = data.ip || "Unavailable";
                    ispName = data.org || "Unknown ISP";
                    city = data.city || "";
                    country = data.country_name || "";
                    countryCode = data.country_code || "";
                } catch {
                    // Fallback to ipwho.is (free, high limit, full geolocation + ISP)
                    try {
                        const ctrl = new AbortController();
                        const tid = setTimeout(() => ctrl.abort(), 5000);
                        const res = await fetch("https://ipwho.is/", { signal: ctrl.signal });
                        clearTimeout(tid);
                        const data = await res.json();
                        if (data.success) {
                            ip = data.ip || "Unavailable";
                            ispName = data.connection?.isp || data.connection?.org || "Unknown ISP";
                            city = data.city || "";
                            country = data.country || "";
                            countryCode = data.country_code || "";
                        } else {
                            throw new Error("ipwho.is failed");
                        }
                    } catch {
                        try {
                            const res = await fetch("https://api.ipify.org?format=json");
                            ip = (await res.json()).ip || "Unavailable";
                        } catch { ip = "Unavailable"; }
                    }
                }

                const vpnKeywords = ["vpn", "mullvad", "nordvpn", "expressvpn", "surfshark", "cyberghost", "protonvpn", "torguard", "ipvanish", "windscribe", "ovh", "digitalocean", "linode", "hetzner", "cloudflare"];
                vpnDetected = vpnKeywords.some(k => ispName.toLowerCase().includes(k));

                try {
                    const res = await fetch("https://api64.ipify.org?format=json");
                    const data = await res.json();
                    if (data.ip?.includes(":")) ipv6 = data.ip;
                } catch { /* ignore */ }

                try {
                    sessionStorage.setItem(IP_CACHE_KEY, JSON.stringify({
                        ts: Date.now(), ip, ipv6, ispName, city, country, countryCode, vpnDetected,
                    }));
                } catch { /* ignore */ }
            }

            setIpLoading(false);
            setStats({
                browserName, browserVersion, osName, language,
                connectionType: connType, connectionSpeed: connSpeed, latency,
                ip, ipv6, ispName, city, country, countryCode, vpnDetected,
                resolution: screenRes, windowSize: windowSizeVal, pixelRatio: pixelRatioVal,
                colorDepth: colorDepthVal, orientation, touchSupport,
                cpuCores: cpu, ram, webglVendor: webgl,
                batteryLevel, batteryCharging,
                persistence, doNotTrack: dnt, adBlocker,
                userAgent: ua, timezone: tz,
            });
            setLoading(false);
        };
        fetchStats();
    }, []);

    // WebRTC leak detection (IPv4 + IPv6 + private/public classification)
    useEffect(() => {
        const detect = async () => {
            if (typeof window !== "undefined" && window.location.search.includes("report=")) {
                const p = new URLSearchParams(window.location.search);
                if (p.get("report") && decodeReport(p.get("report")!)) {
                    return;
                }
            }
            try {
                const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
                pc.createDataChannel("");
                const ips = new Set<string>();
                await new Promise<void>((resolve) => {
                    pc.onicecandidate = (e) => {
                        if (!e.candidate) { resolve(); return; }
                        const cand = e.candidate.candidate;
                        const m4 = cand.match(/\b((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/);
                        if (m4 && !m4[0].startsWith("0.") && !m4[0].startsWith("127.")) {
                            ips.add(m4[0]);
                        }
                        const m6 = cand.match(/([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}/);
                        if (m6) ips.add(m6[0]);
                    };
                    pc.createOffer().then(o => pc.setLocalDescription(o)).catch(() => resolve());
                    setTimeout(resolve, 3000);
                });
                pc.close();

                if (ips.size === 0) {
                    setWebrtcLeak("No Leak (Protected)");
                } else {
                    const isPublic = [...ips].some(candIp =>
                        !candIp.startsWith("192.168.") &&
                        !candIp.startsWith("10.") &&
                        !/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(candIp)
                    );
                    if (isPublic) {
                        setWebrtcLeak(`Public IP Exposed: ${[...ips].join(", ")}`);
                    } else {
                        setWebrtcLeak(`Local Candidate: ${[...ips].join(", ")}`);
                    }
                }
            } catch {
                setWebrtcLeak("Unsupported");
            }
            setWebrtcLoading(false);
        };
        detect();
    }, []);

    // Live viewport updates on resize/zoom
    useEffect(() => {
        const onResize = () => setStats(prev => prev ? {
            ...prev,
            windowSize: `${window.innerWidth} × ${window.innerHeight}`,
            pixelRatio: `${window.devicePixelRatio}x`,
            resolution: `${window.screen.width} × ${window.screen.height}`,
        } : prev);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const checkCookies = () => setStats(prev => prev
        ? { ...prev, persistence: navigator.cookieEnabled ? "ENABLED" : "DISABLED" }
        : prev
    );

    const copyAllInfo = async () => {
        if (!stats) return;
        const text = [
            "MySupportInfo — Device Diagnostic Report",
            `Generated: ${new Date().toLocaleString()}`,
            "",
            "─── BROWSER ───────────────────────────────",
            `Browser:       ${stats.browserName} ${stats.browserVersion}`,
            `OS:            ${stats.osName}`,
            `Language:      ${stats.language}`,
            `User Agent:    ${stats.userAgent}`,
            "",
            "─── NETWORK ───────────────────────────────",
            `IP (IPv4):     ${stats.ip}`,
            `IP (IPv6):     ${stats.ipv6}`,
            `Location:      ${[stats.city, stats.country].filter(Boolean).join(", ") || "Unknown"}`,
            `ISP:           ${stats.ispName}`,
            `VPN Detected:  ${stats.vpnDetected ? "Yes" : "No"}`,
            `WebRTC Leak:   ${webrtcLoading ? "Scanning…" : webrtcLeak}`,
            `Connection:    ${stats.connectionType === "N/A" ? "N/A (desktop — mobile API only)" : `${stats.connectionType} — ${stats.connectionSpeed}`}`,
            `Latency RTT:   ${stats.latency}`,
            "",
            "─── HARDWARE ──────────────────────────────",
            `Screen:        ${stats.resolution} (${stats.colorDepth})`,
            `Viewport:      ${stats.windowSize} (DPR: ${stats.pixelRatio})`,
            `CPU Cores:     ${stats.cpuCores}`,
            `RAM:           ${stats.ram}`,
            `GPU:           ${stats.webglVendor}`,
            `Battery:       ${stats.batteryLevel} — ${stats.batteryCharging}`,
            `Touch:         ${stats.touchSupport}`,
            `Orientation:   ${stats.orientation}`,
            "",
            "─── PRIVACY ───────────────────────────────",
            `Cookies:       ${stats.persistence}`,
            `Do Not Track:  ${stats.doNotTrack}`,
            `Ad Blocker:    ${stats.adBlocker}`,
            `Timezone:      ${stats.timezone}`,
            `Time:          ${currentTime}`,
        ].join("\n");
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const [csvExported, setCsvExported] = useState(false);

    const handleExportCSV = () => {
        if (!stats) return;
        const csvData = {
            ...stats,
            webrtcLeak,
            cookiesEnabled: stats.persistence === "ENABLED",
        };
        const csv = generateDiagnosticCSV(csvData, false);
        downloadCSV(csv);
        setCsvExported(true);
        setTimeout(() => setCsvExported(false), 2500);
    };

    const shareLink = () => {
        setIsShareModalOpen(true);
    };

    const handleCaptureFromModal = async (selected: Set<FieldId>) => {
        setIsScreenshotModalOpen(false);
        await performCapture(selected);
    };

    const performCapture = async (fieldsToRender: Set<FieldId>) => {
        const element = reportRef.current;
        if (!element) return;
        setDownloading(true);
        setIsCapturing(true);
        setVisibleFields(fieldsToRender);
        await new Promise(r => setTimeout(r, 350)); // wait for DOM to repaint with custom fields
        try {
            const html2canvas = (await import("html2canvas")).default;
            const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
            const captureBg = isDark ? "#011f1a" : "#FAF6F0";
            const canvas = await html2canvas(element, {
                backgroundColor: captureBg,
                scale: 2,
                logging: false,
                useCORS: true,
                width: element.scrollWidth,
                height: element.scrollHeight,
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight,
                x: 0,
                y: 0,
            });
            const link = document.createElement("a");
            const dateStr = new Date().toISOString().slice(0, 10);
            link.download = `mysupportinfo-diagnostic-report-${dateStr}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        } catch (err) {
            console.error("Screenshot capture failed:", err);
        } finally {
            setIsCapturing(false);
            setDownloading(false);
        }
    };

    const downloadReport = () => {
        setIsScreenshotModalOpen(true);
    };

    // ─── Card component ───────────────────────────────────────────────
    const iconBgClass = (s: "good" | "warn" | "bad" | "info") => ({
        good: "bg-secondary/10 text-secondary",
        warn: "bg-yellow-50 text-yellow-600",
        bad:  "bg-red-50 text-red-400",
        info: "bg-secondary/10 text-secondary",
    }[s]);

    const Card = ({
        icon: Icon, title, value, subtext, tooltip,
        status = "info", fullWidth = false, isCode = false,
        fieldId,
    }: {
        icon: React.ComponentType<{ className?: string; size?: number }>;
        title: string;
        value?: string | React.ReactNode;
        subtext: string;
        tooltip?: string;
        status?: "good" | "warn" | "bad" | "info";
        fullWidth?: boolean;
        isCode?: boolean;
        fieldId?: FieldId;
    }) => {
        // Exclude field in screenshot if unselected
        if (isCapturing && fieldId && !visibleFields.has(fieldId)) {
            return null;
        }

        return (
            <div className={`bg-white border-2 border-background-dark shadow-block-sm p-5 rounded-2xl flex flex-col justify-between hover:bg-background/20 transition-all duration-300 ${fullWidth ? "col-span-1 md:col-span-2" : ""}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 ${iconBgClass(status)} rounded-lg`}>
                            <Icon size={16} />
                        </div>
                        <span className="text-background-dark/70 font-semibold text-3xs uppercase tracking-micro">{title}</span>
                    </div>
                    {tooltip && (
                        <div className="relative group/tip">
                            <Info size={14} className="text-background-dark/25 cursor-help select-none group-hover/tip:text-background-dark/60 transition-colors" />
                            <div className="absolute right-0 bottom-7 w-56 bg-background-dark text-accent text-3xs rounded-xl p-3 z-50 shadow-xl leading-relaxed border border-accent/10 opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-opacity duration-200">
                                {tooltip}
                            </div>
                        </div>
                    )}
                </div>
                <div>
                    {isCode ? (
                        <div className="font-mono text-2xs text-accent bg-background-dark p-3 rounded-lg break-all leading-relaxed">
                            {value}
                        </div>
                    ) : (
                        <div className="text-xl font-bold text-background-dark mb-1 leading-tight break-all">{value}</div>
                    )}
                    <div className="text-3xs text-background-dark/60 mt-2 leading-tight font-medium">{subtext}</div>
                </div>
            </div>
        );
    };

    // ─── Shared status values ─────────────────────────────────────────
    const webrtcStatus: "good" | "warn" | "bad" | "info" =
        webrtcLoading ? "info"
        : webrtcLeak.startsWith("No Leak") || webrtcLeak.startsWith("Local Candidate") ? "good"
        : webrtcLeak === "Unsupported" ? "info"
        : "bad";

    const privacyItems = !loading && !webrtcLoading
        ? [
            {
                ok: webrtcLeak.startsWith("No Leak") || webrtcLeak.startsWith("Local Candidate"),
                label: webrtcLeak.startsWith("No Leak") || webrtcLeak.startsWith("Local Candidate") ? "No WebRTC leak" : "WebRTC leak",
            },
            {
                ok: stats?.doNotTrack === "ENABLED",
                label: stats?.doNotTrack === "ENABLED" ? "DNT on" : "DNT off",
            },
            {
                ok: stats?.adBlocker === "Detected",
                label: stats?.adBlocker === "Detected" ? "Ad blocker" : "No ad blocker",
            },
            {
                ok: !!stats?.vpnDetected,
                label: stats?.vpnDetected ? "VPN detected" : "No VPN",
            },
          ]
        : null;

    // ─── Tab card grids (shared between tab view and capture view) ────
    const networkCards = (
        <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card
                    fieldId="ip"
                    icon={Globe}
                    title="IP Address (IPv4)"
                    value={ipLoading ? "Scanning…" : (
                        <span className="flex items-center gap-2 flex-wrap">
                            {stats?.countryCode && (!isCapturing || visibleFields.has("location")) && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-black uppercase tracking-wider bg-background-dark/10 text-background-dark border border-background-dark/20 font-mono">
                                    {stats.countryCode}
                                </span>
                            )}
                            <span className="font-mono break-all">{stats?.ip}</span>
                            {stats?.vpnDetected && (
                                <span className="text-4xs font-black uppercase tracking-wider bg-yellow-100 text-yellow-700 border border-yellow-300 px-2 py-0.5 rounded-full">VPN</span>
                            )}
                        </span>
                    )}
                    subtext={
                        ipLoading
                            ? "Resolving your public address…"
                            : isCapturing && !visibleFields.has("location")
                            ? "Location hidden for privacy"
                            : [stats?.city, stats?.country].filter(Boolean).join(", ") || "Location unknown"
                    }
                    tooltip="Your public IPv4 address as seen by the internet. Assigned by your ISP or router NAT."
                />
                <Card
                    fieldId="ip"
                    icon={Globe}
                    title="IPv6 Address"
                    value={ipLoading ? "Scanning…" : (stats?.ipv6 || "Not Available")}
                    subtext="IPv6 is available when your ISP and router support dual-stack networking."
                    tooltip="Next-gen IP addressing with a vastly larger address space. Only shown when your connection supports it."
                    status={!ipLoading && stats?.ipv6 !== "Not Available" ? "good" : "info"}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card
                    fieldId="isp"
                    icon={Wifi}
                    title="ISP / Network"
                    value={ipLoading ? "Scanning…" : stats?.ispName}
                    subtext="Your Internet Service Provider or mobile carrier organisation."
                    tooltip="Derived from your IP's ASN (Autonomous System Number) registration data."
                />
                <Card
                    fieldId="webrtc"
                    icon={ShieldCheck}
                    title="WebRTC Leak"
                    value={webrtcLoading ? "Scanning…" : (
                        <span className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${webrtcLeak.startsWith("No Leak") || webrtcLeak.startsWith("Local Candidate") ? "bg-secondary" : webrtcLeak === "Unsupported" ? "bg-background-dark/30" : "bg-red-400"}`} />
                            {webrtcLeak}
                        </span>
                    )}
                    subtext="Detects if your real IP is exposed via WebRTC even when using a VPN."
                    tooltip="WebRTC can bypass VPN tunnels. 'No Leak' means your real IP is not being exposed to websites."
                    status={webrtcStatus}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card
                    fieldId="latency"
                    icon={Signal}
                    title="Connection Type"
                    value={loading ? "…" : stats?.connectionType}
                    subtext={stats?.connectionType === "N/A" ? "Not available — Network Information API requires mobile Chrome." : "Effective network generation from the Network Information API."}
                    tooltip="Reports 4G/3G/2G on mobile Chrome. Unavailable on desktop browsers (Chrome, Firefox, Safari for desktop do not expose this API)."
                    status={loading ? "info" : (stats?.connectionType === "4G" ? "good" : stats?.connectionType === "N/A" ? "info" : "warn")}
                />
                <Card
                    fieldId="latency"
                    icon={Zap}
                    title="Estimated Speed"
                    value={loading ? "…" : stats?.connectionSpeed}
                    subtext={stats?.connectionSpeed === "N/A" ? "Not available — Network Information API requires mobile Chrome." : "Rough downlink estimate — run Bufferbloat Test for accurate results."}
                    tooltip="Downlink estimate from the Network Information API. Only available on mobile Chrome. For accurate speed measurements on any device, use the Bufferbloat Test."
                    status={loading ? "info" : getSpeedStatus(stats?.connectionSpeed || "")}
                />
                <Card
                    fieldId="latency"
                    icon={Activity}
                    title="Latency (RTT)"
                    value={loading ? "…" : stats?.latency}
                    subtext={stats?.latency === "N/A" ? "Not available on current network connection." : "Round-trip time to nearest server. Under 50ms = excellent, 50–150ms = good."}
                    tooltip="Round-trip time (RTT) to the nearest edge server. Lower latency provides faster response times and smoother real-time interactions."
                    status={loading ? "info" : getLatencyStatus(stats?.latency || "")}
                />
            </div>
        </div>
    );

    const browserCards = (
        <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <Card
                    fieldId="browser"
                    icon={Monitor}
                    title="Browser"
                    value={loading ? "…" : `${stats?.browserName} ${stats?.browserVersion}`}
                    subtext="Detected browser engine and major version number."
                    tooltip="Detected from the User Agent string. Useful for debugging browser-specific rendering issues."
                    status="good"
                />
                <Card
                    fieldId="os"
                    icon={HardDrive}
                    title="Operating System"
                    value={loading ? "…" : stats?.osName}
                    subtext="Host OS detected from browser client hints and user agent."
                    tooltip="Identifies the OS platform your browser runs on. Helps support teams reproduce your environment."
                />
                <Card
                    fieldId="language"
                    icon={Languages}
                    title="Language / Locale"
                    value={loading ? "…" : stats?.language}
                    subtext="Primary browser language and locale setting."
                    tooltip="Affects date formatting, number separators, and which language websites display by default."
                />
                <Card
                    fieldId="js"
                    icon={ShieldCheck}
                    title="JavaScript"
                    value={<span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-secondary flex-shrink-0" />ENABLED</span>}
                    subtext="JS is active — this page cannot load without it."
                    tooltip="If you can see this card, JavaScript is enabled and functioning correctly."
                    status="good"
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <Card
                    fieldId="userAgent"
                    icon={Terminal}
                    title="Full User Agent"
                    value={loading ? "Loading…" : stats?.userAgent}
                    subtext="Complete browser identification string sent with every HTTP request."
                    tooltip="Servers use this to identify your browser, OS, and rendering engine for compatibility checks."
                    fullWidth
                    isCode
                />
                <Card
                    fieldId="privacy"
                    icon={EyeOff}
                    title="Do Not Track"
                    value={loading ? "…" : (
                        <span className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${stats?.doNotTrack === "ENABLED" ? "bg-secondary" : "bg-background-dark/30"}`} />
                            {stats?.doNotTrack}
                        </span>
                    )}
                    subtext="Browser tracking opt-out preference signal sent to websites."
                    tooltip="When enabled, your browser requests websites not track you. Most sites do not honour it."
                    status={loading ? "info" : stats?.doNotTrack === "ENABLED" ? "good" : "info"}
                />
                <Card
                    fieldId="cookies"
                    icon={Lock}
                    title="Cookies"
                    value={loading ? "…" : (
                        <span className="flex items-center justify-between w-full">
                            <span className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${stats?.persistence === "ENABLED" ? "bg-secondary" : "bg-red-400"}`} />
                                {stats?.persistence}
                            </span>
                            {!isCapturing && (
                                <button
                                    onClick={checkCookies}
                                    aria-label="Re-test cookie status"
                                    className="text-4xs text-primary font-black uppercase tracking-wider bg-background-dark px-2 py-0.5 rounded border border-background-dark hover:bg-primary hover:text-background-dark transition-colors"
                                >
                                    Re-test
                                </button>
                            )}
                        </span>
                    )}
                    subtext="Required for session management and user preference storage."
                    tooltip="Cookies store session data. If disabled, most login systems and preferences will not work."
                />
            </div>
        </div>
    );

    const hardwareCards = (
        <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <Card
                    fieldId="viewport"
                    icon={Monitor}
                    title="Viewport Size"
                    value={loading ? "…" : stats?.windowSize}
                    subtext={`Screen: ${stats?.resolution} · DPR: ${stats?.pixelRatio} · live on zoom`}
                    tooltip="The pixel area your browser content occupies. Updates live when you resize or zoom."
                />
                <Card
                    fieldId="screen"
                    icon={Palette}
                    title="Color Depth"
                    value={loading ? "…" : stats?.colorDepth}
                    subtext="Bits used per pixel for the display's color range."
                    tooltip="24-bit = ~16.7 million colors (standard). 30-bit = HDR. Higher means richer images."
                />
                <Card
                    fieldId="hardware"
                    icon={Cpu}
                    title="CPU Cores"
                    value={loading ? "…" : stats?.cpuCores}
                    subtext="Logical processor threads available to the browser."
                    tooltip="More cores allow browsers and WebAssembly to run parallel tasks faster."
                />
                <Card
                    fieldId="hardware"
                    icon={HardDrive}
                    title="RAM Estimate"
                    value={loading ? "…" : stats?.ram}
                    subtext="Rounded memory bucket from the Device Memory API."
                    tooltip="Browsers report memory in buckets (0.5, 1, 2, 4, 8 GB) to resist fingerprinting."
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <Card
                    fieldId="gpu"
                    icon={Terminal}
                    title="WebGL / GPU"
                    value={<span className="text-xs sm:text-sm font-bold text-background-dark leading-snug break-words block">{loading ? "…" : stats?.webglVendor}</span>}
                    subtext="GPU renderer string from the WebGL debug extension."
                    tooltip="Identifies your graphics card. Useful for diagnosing rendering and performance issues."
                    fullWidth
                />
                <Card
                    fieldId="battery"
                    icon={Battery}
                    title="Battery"
                    value={loading ? "…" : (stats?.batteryLevel === "N/A" ? "Desktop / N/A" : `${stats?.batteryLevel} — ${stats?.batteryCharging}`)}
                    subtext="Charge level and status from the Battery Status API."
                    tooltip="Available on laptops and mobile. Desktop PCs report N/A. Helps diagnose performance issues."
                    status={loading ? "info" : getBatteryStatus(stats?.batteryLevel || "N/A")}
                />
                <Card
                    fieldId="battery"
                    icon={Smartphone}
                    title="Touch Support"
                    value={loading ? "…" : stats?.touchSupport}
                    subtext="Touchscreen capability from maxTouchPoints API."
                    tooltip="Affects how events fire. Touch devices support gestures; mice use click/hover events."
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card
                    fieldId="screen"
                    icon={Layout}
                    title="Screen Orientation"
                    value={loading ? "…" : stats?.orientation}
                    subtext="Current orientation from the Screen Orientation API."
                    tooltip="Landscape for desktops. Portrait for phones held upright. Affects responsive layout breakpoints."
                />
                <Card
                    fieldId="clock"
                    icon={MapPin}
                    title="Timezone"
                    value={loading ? "…" : stats?.timezone}
                    subtext="Local timezone via Intl.DateTimeFormat API."
                    tooltip="Used by web apps to show times in your local zone. Can differ from your IP geolocation."
                />
                <Card
                    fieldId="clock"
                    icon={Clock}
                    title="System Clock"
                    value={currentTime || "…"}
                    subtext="Live clock synchronized with your device's system time."
                    tooltip="Clock drift affects SSL certificate validation and TOTP 2FA codes — keep system time accurate."
                />
            </div>
        </div>
    );

    const privacyCards = (
        <div className="space-y-3">
            {(!isCapturing || visibleFields.has("privacy")) && (
                <div className="bg-background-dark border-2 border-background-dark rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <p className="text-4xs text-accent/50 uppercase tracking-ui-wider font-bold mb-1">Privacy Snapshot</p>
                        {privacyItems ? (
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-accent/90">
                                {privacyItems.map((item, i) => (
                                    <span key={i} className="inline-flex items-center gap-1.5">
                                        <span className={item.ok ? "text-secondary font-bold" : "text-primary font-bold"} aria-hidden="true">
                                            {item.ok ? <>&#10003;</> : <>&#9888;</>}
                                        </span>
                                        <span>{item.label}</span>
                                        {i < privacyItems.length - 1 && <span className="text-accent/30 ml-1.5" aria-hidden="true">&#183;</span>}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm font-medium text-accent/90 leading-relaxed">Analysing privacy posture&#8230;</p>
                        )}
                    </div>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card
                    fieldId="webrtc"
                    icon={ShieldCheck}
                    title="WebRTC Leak"
                    value={webrtcLoading ? "Scanning…" : (
                        <span className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${webrtcLeak.startsWith("No Leak") || webrtcLeak.startsWith("Local Candidate") ? "bg-secondary" : webrtcLeak === "Unsupported" ? "bg-background-dark/30" : "bg-red-400"}`} />
                            {webrtcLeak}
                        </span>
                    )}
                    subtext="Checks if your real IP is exposed through WebRTC even behind a VPN."
                    tooltip="A WebRTC leak can reveal your real IP to sites even when using a VPN. 'No Leak' means you're safe."
                    status={webrtcStatus}
                />
                <Card
                    fieldId="ip"
                    icon={stats?.vpnDetected ? ShieldAlert : ShieldCheck}
                    title="VPN Detection"
                    value={ipLoading ? "Scanning…" : (
                        <span className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${stats?.vpnDetected ? "bg-yellow-400" : "bg-background-dark/30"}`} />
                            {stats?.vpnDetected ? "VPN Detected" : "No VPN Detected"}
                        </span>
                    )}
                    subtext="Heuristic check against known VPN provider organisation names."
                    tooltip="Checks if your ISP name matches known VPN providers. Heuristic only — not 100% conclusive."
                    status={stats?.vpnDetected ? "warn" : "info"}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card
                    fieldId="privacy"
                    icon={EyeOff}
                    title="Do Not Track"
                    value={loading ? "…" : (
                        <span className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${stats?.doNotTrack === "ENABLED" ? "bg-secondary" : "bg-background-dark/30"}`} />
                            {stats?.doNotTrack}
                        </span>
                    )}
                    subtext="Browser tracking opt-out preference signal."
                    tooltip="A request to websites not to track you. Most sites do not honour this header."
                    status={loading ? "info" : stats?.doNotTrack === "ENABLED" ? "good" : "info"}
                />
                <Card
                    fieldId="privacy"
                    icon={ShieldAlert}
                    title="Ad Blocker"
                    value={loading ? "Detecting…" : (
                        <span className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${stats?.adBlocker === "Detected" ? "bg-secondary" : "bg-background-dark/30"}`} />
                            {stats?.adBlocker}
                        </span>
                    )}
                    subtext="Checks if an ad-filtering browser extension is active."
                    tooltip="Detected by injecting a hidden element with ad-class names and checking if it was removed."
                    status={loading ? "info" : stats?.adBlocker === "Detected" ? "good" : "info"}
                />
            </div>
        </div>
    );

    // ─── Tab config ───────────────────────────────────────────────────
    const tabConfig: { id: TabType; label: string; icon: React.ComponentType<{ className?: string; size?: number }> }[] = [
        { id: "network",  label: "Network",  icon: Wifi         },
        { id: "browser",  label: "Browser",  icon: Globe        },
        { id: "hardware", label: "Hardware", icon: Cpu          },
        { id: "privacy",  label: "Privacy",  icon: ShieldCheck  },
    ];

    const tabSections: { id: TabType; label: string; content: React.ReactNode; fieldIds: FieldId[] }[] = [
        { id: "network",  label: "Network",  content: networkCards,  fieldIds: ["ip", "isp", "location", "webrtc", "latency"] },
        { id: "browser",  label: "Browser",  content: browserCards,  fieldIds: ["browser", "os", "language", "js", "userAgent", "privacy", "cookies"] },
        { id: "hardware", label: "Hardware", content: hardwareCards, fieldIds: ["viewport", "screen", "hardware", "gpu", "battery", "clock"] },
        { id: "privacy",  label: "Privacy",  content: privacyCards,  fieldIds: ["webrtc", "ip", "privacy"] },
    ];

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": [
                            {
                                "@type": "Question",
                                "name": "Why do support technicians need my browser version and operating system?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "Web browsers render HTML, CSS, and JavaScript differently across operating systems. A bug affecting Safari on macOS might look completely fine in Google Chrome on Windows. Knowing your exact browser version and OS allows developers to reproduce the issue in an identical environment."
                                }
                            },
                            {
                                "@type": "Question",
                                "name": "How does MySupportInfo detect my graphics card (GPU) and hardware specs?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "MySupportInfo utilizes standard browser APIs: the WebGL debug renderer info extension queries your graphics hardware string, the Device Memory API provides memory estimations, and navigator.hardwareConcurrency detects available CPU thread cores."
                                }
                            },
                            {
                                "@type": "Question",
                                "name": "What is a WebRTC leak and how does it compromise my VPN?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "WebRTC allows video calls and peer-to-peer data in browsers. Even when using a VPN, WebRTC can communicate with STUN servers and expose your real public or local network IP address. MySupportInfo scans your browser's active ICE candidates to ensure no leaks exist."
                                }
                            },
                            {
                                "@type": "Question",
                                "name": "Is my personal data stored or logged when using this tool?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "Never. All detection occurs client-side in your local browser sandbox. We do not store IP addresses in databases, use no tracking cookies, and never build user profiles. All data disappears the moment you close your browser tab."
                                }
                            },
                            {
                                "@type": "Question",
                                "name": "How can I test my network for gaming and video call lag?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "Head to our Bufferbloat Test tool (/bufferbloat). It simulates real download and upload loads to measure whether your router buffers packets and spikes latency, assigning you an official Quality of Experience grade from A to F."
                                }
                            }
                        ]
                    })
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "HowTo",
                        "name": "How to Check Your Browser, IP and System Specs with MySupportInfo",
                        "description": "Step-by-step guide to discovering your full browser version, operating system, public IP, and hardware specifications for tech support.",
                        "step": [
                            {
                                "@type": "HowToStep",
                                "name": "Open MySupportInfo",
                                "text": "Navigate to https://mysupportinfo.com on any computer, tablet, or phone without installing software.",
                                "url": "https://mysupportinfo.com/#main-content"
                            },
                            {
                                "@type": "HowToStep",
                                "name": "Review System Diagnostics",
                                "text": "Your browser version, operating system, public IP address, screen resolution, GPU, RAM, and WebRTC privacy status load instantly in under 3 seconds.",
                                "url": "https://mysupportinfo.com/"
                            },
                            {
                                "@type": "HowToStep",
                                "name": "Export or Share Diagnostic Data",
                                "text": "Click 'Copy All Info' to copy raw text, 'Screenshot Report' to download a clean visual PNG card, or 'Export CSV' for IT ticketing systems.",
                                "url": "https://mysupportinfo.com/"
                            }
                        ]
                    })
                }}
            />
            <div className="min-h-screen bg-background text-foreground selection:bg-primary/40 font-sans pb-24">

            {/* ── Shared Remote Report Notification Banner ──────────── */}
            {sharedReport && (
                <div className="max-w-site mx-auto px-6 pt-6">
                    <div className="bg-secondary text-white p-4 sm:p-5 rounded-3xl border-2 border-background-dark shadow-block-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <div className="p-2.5 rounded-2xl bg-white text-secondary flex-shrink-0 shadow-sm">
                                <ShieldCheck size={22} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-serif font-bold text-lg sm:text-xl text-white">Viewing Shared Diagnostic Report</span>
                                    <span className="text-4xs font-mono font-black uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full">Remote Device</span>
                                </div>
                                <p className="text-xs text-white/85 mt-0.5 leading-relaxed font-medium">
                                    Snapshot recorded on {new Date(sharedReport.timestamp).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}. Showing sender&#39;s exact browser, OS, and hardware specifications.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={switchToMyDevice}
                            className="flex-shrink-0 px-4 py-2 bg-white text-background-dark font-extrabold text-xs uppercase tracking-wider rounded-xl border-2 border-background-dark shadow-block-sm hover:bg-accent transition-all cursor-pointer"
                        >
                            Inspect My Own Device
                        </button>
                    </div>
                </div>
            )}

            {/* ── Hero ──────────────────────────────────────────────── */}
            <div className="text-center px-6 pt-16 pb-10">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-3xs font-black uppercase tracking-wider bg-background-dark/5 text-background-dark border-2 border-background-dark/15 font-mono mb-6 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-secondary flex-shrink-0 animate-pulse" />
                    <span>One Link to Diagnose Any Device</span>
                </div>
                <h1 className="font-serif leading-none mb-6 select-none">
                    <span className="block text-4xl sm:text-5xl md:text-7xl lg:text-display font-light text-background-dark tracking-tight">
                        What Is My
                    </span>
                    <span className="block text-4xl sm:text-6xl md:text-8xl lg:text-display-lg font-bold text-primary italic tracking-tight -mt-2">
                        Browser & IP?
                    </span>
                </h1>
                <p className="text-sm md:text-base text-background-dark/75 max-w-xl mx-auto mb-10 leading-relaxed font-medium">
                    Instant system diagnostics for remote teams and IT helpdesks. Check your browser version, operating system, public IP address, screen resolution, WebGL GPU, WebRTC leaks, and network latency — 100% in-browser with zero tracking.
                </p>
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                    <button
                        onClick={copyAllInfo}
                        aria-label="Copy all device info to clipboard"
                        className="flex items-center gap-2 px-5 sm:px-6 py-2.5 bg-background-dark text-white border-2 border-background-dark shadow-block hover:bg-foreground active:translate-x-px active:translate-y-px active:shadow-none transition-all rounded-xl text-sm font-bold cursor-pointer"
                    >
                        <Copy size={15} />
                        {copied ? "Copied!" : "Copy All Info"}
                    </button>
                    <button
                        onClick={() => setIsScreenshotModalOpen(true)}
                        disabled={loading || downloading}
                        aria-label="Customize and download screenshot report card"
                        className="flex items-center gap-2 px-5 sm:px-6 py-2.5 bg-primary text-background-dark border-2 border-background-dark shadow-block-sm rounded-xl text-sm font-bold hover:bg-primary-dark active:translate-x-px active:translate-y-px active:shadow-none transition-all disabled:opacity-50 cursor-pointer"
                    >
                        <Download size={15} />
                        <span>Screenshot Report</span>
                    </button>
                    <button
                        onClick={handleExportCSV}
                        disabled={loading}
                        aria-label="Export complete diagnostic data to CSV spreadsheet"
                        className="flex items-center gap-2 px-5 sm:px-6 py-2.5 bg-white text-background-dark border-2 border-background-dark shadow-block-sm rounded-xl text-sm font-bold hover:bg-accent/20 active:translate-x-px active:translate-y-px active:shadow-none transition-all disabled:opacity-50 cursor-pointer"
                    >
                        <FileSpreadsheet size={15} />
                        <span>{csvExported ? "Exported CSV!" : "Export CSV"}</span>
                    </button>
                    <button
                        onClick={shareLink}
                        aria-label="Share diagnostic link with IT support"
                        className="flex items-center gap-2 px-5 sm:px-6 py-2.5 bg-white text-background-dark border-2 border-background-dark shadow-block-sm rounded-xl text-sm font-bold hover:bg-accent/20 active:translate-x-px active:translate-y-px active:shadow-none transition-all cursor-pointer"
                    >
                        <Share2 size={15} />
                        <span>Share Link</span>
                    </button>
                </div>

                {/* Spot an incorrect spec button */}
                <div className="flex items-center justify-center gap-1.5 text-xs text-background-dark/70 dark:text-white/70 mt-4">
                    <span>Notice an incorrect spec?</span>
                    <button
                        type="button"
                        onClick={() => setIsReportErrorOpen(true)}
                        className="font-bold underline underline-offset-2 hover:text-primary transition-colors cursor-pointer text-background-dark dark:text-accent"
                    >
                        Report a detection error
                    </button>
                </div>

                {/* Accessible Screen Reader Status Region */}
                <div className="sr-only" role="status" aria-live="polite">
                    {copied && "All device specifications copied to clipboard."}
                    {csvExported && "Diagnostic specifications exported as CSV spreadsheet."}
                </div>
            </div>

            {/* ── Report wrapper (screenshot capture area) ──────────── */}
            <div ref={reportRef} className={`bg-background w-full ${isCapturing ? "px-6 sm:px-12 py-10" : "px-6 py-4"}`}>

                {/* ── Official Branded Report Header (Screenshot Capture Only) ──── */}
                {isCapturing && (
                    <div className="max-w-6xl mx-auto mb-10 p-6 sm:p-8 rounded-3xl bg-background-dark text-white border-3 border-background-dark shadow-block">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-5 border-b border-white/10">
                            <div className="flex items-center gap-4">
                                <div className="w-13 h-13 rounded-2xl bg-primary border-2 border-white/20 shadow-block-sm flex items-center justify-center flex-shrink-0 text-background-dark">
                                    <Activity size={26} strokeWidth={2.5} />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <span className="font-black text-2xl tracking-tight text-white font-sans leading-none">
                                            MySupport<span className="text-primary italic font-serif ml-0.5">Info</span>
                                        </span>
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-4xs font-mono font-black uppercase tracking-wider bg-white/10 text-accent border border-white/20">
                                            Official Diagnostic Report
                                        </span>
                                        {[...SENSITIVE_FIELD_IDS].every(f => !visibleFields.has(f)) && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-4xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30">
                                                <span>&#10003;</span> PII Masked
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-white/80 font-medium font-sans">
                                        Client-side device, browser, network &amp; hardware specifications generated at{" "}
                                        <strong className="text-accent underline underline-offset-2">https://mysupportinfo.com</strong>
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:items-start md:items-end gap-1 text-xs font-mono">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-accent font-bold">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    <span>Verified In-Browser Session</span>
                                </div>
                                <div className="text-white/60 text-3xs">
                                    Generated: {new Date().toUTCString()}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex flex-wrap items-center justify-between gap-3 text-3xs font-mono text-white/70">
                            <div className="flex items-center gap-3.5 flex-wrap">
                                <span className="inline-flex items-center gap-1.5">
                                    <span className="text-primary">&#10003;</span> Zero Database Logs
                                </span>
                                <span className="text-white/25">&#183;</span>
                                <span className="inline-flex items-center gap-1.5">
                                    <span className="text-primary">&#10003;</span> 100% In-Browser Execution
                                </span>
                                <span className="text-white/25">&#183;</span>
                                <span className="inline-flex items-center gap-1.5">
                                    <span className="text-primary">&#10003;</span> Encrypted TLS Transmission
                                </span>
                            </div>
                            <div className="text-accent font-bold">
                                Audit Source: mysupportinfo.com
                            </div>
                        </div>
                    </div>
                )}

                {/* Orb */}
                <div className="flex justify-center px-4 mb-14">
                    <div className="relative w-full max-w-orb aspect-square rounded-full flex flex-col items-center justify-center overflow-hidden bg-background-dark border-4 border-accent/25 shadow-block p-6 sm:p-10">
                        <div className="absolute inset-4 rounded-full border-2 border-dashed border-accent/15 pointer-events-none" />
                        <div className="relative z-10 flex flex-col items-center text-center w-full">
                            <span className="text-4xs text-accent/75 uppercase tracking-ui-widest font-bold mb-3 sm:mb-4">Main Browser</span>
                            <h2 className="font-serif font-bold text-white mb-4 sm:mb-6 w-full" style={{ fontSize: "clamp(1.5rem, 7vw, 3.75rem)", lineHeight: 1.08 }}>
                                {loading ? "…" : (isCapturing && !visibleFields.has("browser") ? "Browser Masked" : `${stats?.browserName} ${stats?.browserVersion}`)}
                            </h2>
                            <div className="flex items-center justify-center gap-6 sm:gap-10 mb-5 sm:mb-6">
                                <div className="text-center">
                                    <p className="text-5xs text-accent/60 uppercase tracking-ui-wider font-bold mb-1">OS Environment</p>
                                    <p className="text-sm sm:text-base font-semibold text-accent">
                                        {loading ? "…" : (isCapturing && !visibleFields.has("os") ? "Hidden" : stats?.osName)}
                                    </p>
                                </div>
                                <div className="w-px h-8 bg-accent/20 self-center flex-shrink-0" />
                                <div className="text-center">
                                    <p className="text-5xs text-accent/60 uppercase tracking-ui-wider font-bold mb-1">Global IP</p>
                                    <p className="text-xs sm:text-sm font-semibold text-accent font-mono tabular-nums break-all">
                                        {ipLoading ? "…" : (isCapturing && !visibleFields.has("ip") ? "[Masked for Privacy]" : stats?.ip)}
                                    </p>
                                </div>
                            </div>
                            <div className="text-5xs uppercase tracking-ui-wider font-mono text-accent/60">
                                mysupportinfo.com
                            </div>
                            {!isCapturing && (
                                <button
                                    onClick={downloadReport}
                                    disabled={loading || downloading}
                                    aria-label="Download screenshot report as PNG"
                                    className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-primary border-2 border-background-dark shadow-block-sm text-background-dark rounded-full text-3xs font-black uppercase tracking-wider hover:bg-primary-dark active:translate-x-px active:translate-y-px active:shadow-none transition-all disabled:opacity-40 mt-3 cursor-pointer"
                                >
                                    <Download size={13} />
                                    {downloading ? "Generating…" : <><span className="hidden sm:inline">Download Screenshot </span>Report</>}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Tabs / Capture area ───────────────────────────── */}
                <div className="max-w-6xl mx-auto">
                    {isCapturing ? (
                        // Full-page capture mode: all selected sections stacked, no tab bar
                        <div className="space-y-10">
                            {tabSections.map(section => {
                                const hasVisibleCard = section.fieldIds.some(f => visibleFields.has(f));
                                if (!hasVisibleCard) return null;
                                return (
                                    <div key={section.id}>
                                        <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-background-dark/10">
                                            {React.createElement(tabConfig.find(t => t.id === section.id)?.icon || Globe, {
                                                size: 16,
                                                className: "text-primary",
                                            })}
                                            <span className="text-2xs font-bold text-background-dark uppercase tracking-ui-wide">
                                                {section.label}
                                            </span>
                                        </div>
                                        {section.content}
                                    </div>
                                );
                            })}
                            {/* ── Branded Promotional & Referral Banner (Viral Loop for IT Support & Teams) ── */}
                            <div className="mt-12 p-8 rounded-3xl bg-white dark:bg-[#062b24] border-3 border-background-dark dark:border-accent/40 shadow-block text-background-dark dark:text-white">
                                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b-2 border-background-dark/10 dark:border-white/10">
                                    <div className="space-y-2.5 max-w-2xl">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-3xs font-black uppercase tracking-wider bg-primary/20 dark:bg-primary/25 text-background-dark dark:text-accent border border-background-dark/20 dark:border-primary/40 font-mono">
                                            <span>Free System Diagnostics for Remote Teams &amp; IT Helpdesks</span>
                                        </div>
                                        <h3 className="font-serif text-2xl font-black text-background-dark dark:text-white tracking-tight">
                                            Need Diagnostic Details From Your Own Clients or Teammates?
                                        </h3>
                                        <p className="text-xs text-background-dark/80 dark:text-white/80 leading-relaxed font-medium">
                                            Direct them to <strong className="text-background-dark dark:text-primary font-black underline decoration-primary decoration-2">https://mysupportinfo.com</strong>.
                                            Users don&#39;t need to install any software or configure anything. They can view, copy, or screenshot their full browser version, operating system, public IP, screen resolution, WebRTC leak status, and network latency in under 3 seconds.
                                        </p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row lg:flex-col items-stretch gap-3 flex-shrink-0 w-full lg:w-auto">
                                        <div className="px-6 py-4 rounded-2xl bg-background-dark text-white border-2 border-background-dark shadow-block-sm flex items-center justify-between gap-5">
                                            <div>
                                                <span className="block text-4xs uppercase tracking-widest text-accent font-bold">Test Any Device</span>
                                                <span className="text-base font-black font-mono text-primary">mysupportinfo.com</span>
                                            </div>
                                            <div className="w-8 h-8 rounded-xl bg-primary text-background-dark flex items-center justify-center font-bold text-sm">
                                                &rarr;
                                            </div>
                                        </div>
                                        <span className="text-4xs text-center text-background-dark/60 dark:text-white/60 font-mono">
                                            1-Click Link &middot; Visual PNG Card &middot; CSV Export
                                        </span>
                                    </div>
                                </div>

                                {/* Audit trail & copyright */}
                                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-3xs text-background-dark/65 dark:text-white/60 font-mono">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-background-dark dark:text-white">MySupportInfo.com</span>
                                        <span>&middot;</span>
                                        <span>Private Client-Side Device Intelligence</span>
                                    </div>
                                    <div>
                                        &copy; {new Date().getFullYear()} MySupportInfo. Built for Helpdesks, Sysadmins &amp; Remote Workers.
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Normal tab view
                        <>
                            {/* Tab bar */}
                            <div
                                role="tablist"
                                aria-label="Device diagnostic categories"
                                className="flex gap-1 bg-background-dark/5 dark:bg-white/10 border-2 border-background-dark/10 dark:border-white/15 rounded-2xl p-1 mb-8 overflow-x-auto"
                            >
                                {tabConfig.map(tab => (
                                    <button
                                        key={tab.id}
                                        id={`tab-${tab.id}`}
                                        role="tab"
                                        aria-selected={activeTab === tab.id}
                                        aria-controls={`tabpanel-${tab.id}`}
                                        onClick={() => setActiveTab(tab.id)}
                                        aria-label={`${tab.label} diagnostics tab`}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-2xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                                            activeTab === tab.id
                                                ? "bg-background-dark text-white dark:bg-primary dark:text-background-dark shadow-block-sm"
                                                : "text-background-dark/60 dark:text-accent/80 hover:text-background-dark dark:hover:text-white hover:bg-background-dark/10 dark:hover:bg-white/10"
                                        }`}
                                    >
                                        <tab.icon size={14} aria-hidden="true" />
                                        <span className="hidden sm:inline">{tab.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Active tab content */}
                            {tabSections.map(section => (
                                activeTab === section.id && (
                                    <div
                                        key={section.id}
                                        id={`tabpanel-${section.id}`}
                                        role="tabpanel"
                                        aria-labelledby={`tab-${section.id}`}
                                        tabIndex={0}
                                        className="focus:outline-none"
                                    >
                                        <FadeIn>
                                            {section.content}
                                        </FadeIn>
                                    </div>
                                )
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* ── Navigation cards ──────────────────────────────────── */}
            <div className="bg-background w-full px-6 py-4">
                <div className="max-w-6xl mx-auto">
                    <FadeIn delay={0.3}>
                        <div className="mb-6">
                            <p className="text-3xs font-black uppercase tracking-ui-wider text-primary mb-2">More Tools</p>
                            <h2 className="font-serif text-fluid-h2 font-bold text-background-dark">Explore Diagnostics</h2>
                            <p className="mt-2 max-w-2xl text-sm text-background-dark/65 font-medium leading-relaxed">Run deeper network tests, review privacy details, or learn how each device metric is detected.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-1">
                            <Link href="/bufferbloat" className="group relative overflow-hidden rounded-3xl bg-background-dark border-2 border-background-dark shadow-block hover:scale-102 transition-all duration-300">
                                <div className="p-8 flex flex-col justify-between min-h-card">
                                    <div>
                                        <div className="size-12 rounded-2xl bg-primary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                                            <Signal size={22} className="text-background-dark" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2">Bufferbloat Test</h3>
                                        <p className="text-accent text-sm leading-relaxed">Analyse network latency under load to detect lag in gaming, calls, and streaming.</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-primary font-bold uppercase tracking-widest text-3xs mt-6">
                                        <span>Run Diagnostic</span>
                                        <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </Link>

                            <Link
                                href="/privacy"
                                className="group relative overflow-hidden rounded-3xl bg-accent dark:bg-[#062b24] border-2 border-background-dark dark:border-accent/40 shadow-block hover:scale-102 transition-all duration-300"
                            >
                                <div className="p-8 flex flex-col justify-between min-h-card">
                                    <div>
                                        <div className="size-12 rounded-2xl bg-background-dark dark:bg-accent/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                                            <EyeOff size={22} className="text-accent" />
                                        </div>
                                        <h3 className="text-lg font-bold text-background-dark dark:text-white mb-2">Privacy Centre</h3>
                                        <p className="text-background-dark/80 dark:text-accent/80 text-sm leading-relaxed">Review how we handle your data locally — zero tracking, GDPR compliant.</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-background-dark dark:text-accent font-bold uppercase tracking-widest text-3xs mt-6">
                                        <span>View Policy</span>
                                        <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </Link>

                            <Link
                                href="/faq"
                                className="group relative overflow-hidden rounded-3xl bg-white dark:bg-[#062b24] border-2 border-background-dark dark:border-secondary/40 shadow-block hover:scale-102 transition-all duration-300"
                            >
                                <div className="p-8 flex flex-col justify-between min-h-card">
                                    <div>
                                        <div className="size-12 rounded-2xl bg-secondary/15 dark:bg-secondary/25 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                                            <HelpCircle size={22} className="text-secondary" />
                                        </div>
                                        <h3 className="text-lg font-bold text-background-dark dark:text-white mb-2">Knowledge Base</h3>
                                        <p className="text-background-dark/70 dark:text-white/75 text-sm leading-relaxed">Common questions about network testing, privacy, and what each metric means.</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-background-dark dark:text-secondary font-bold uppercase tracking-widest text-3xs mt-6">
                                        <span>Read FAQ</span>
                                        <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </FadeIn>

                    {/* ── High-Authority Long-Form SEO Content ────────────────── */}
                    <article className="mt-20 pt-16 border-t-2 border-background-dark/10 space-y-16">

                        {/* Overview: What is My Browser & Support Info */}
                        <section>
                            <div className="inline-flex items-center gap-2 text-primary font-black uppercase text-3xs tracking-ui-wide mb-2">
                                <span className="material-symbols-outlined text-sm">devices</span>
                                System Diagnostics & Technical Support
                            </div>
                            <h2 className="text-3xl md:text-4xl font-extrabold text-background-dark font-serif mb-6">
                                What Is My Browser? Fast, Private Device & Network Details
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-background-dark/80 text-sm md:text-base leading-relaxed font-medium">
                                <div className="space-y-4">
                                    <p>
                                        When you visit websites, report a bug to a software developer, or contact an IT helpdesk, one of the first questions you are asked is: <em>&ldquo;What browser and operating system are you using?&rdquo;</em>
                                    </p>
                                    <p>
                                        <strong>MySupportInfo</strong> provides a modern, privacy-first diagnostic hub that automatically reads the technical specifications your web browser shares with web servers. Whether you are troubleshooting rendering bugs in Google Chrome, verifying your public IP address behind a VPN, checking screen scaling on a 4K display, or auditing WebRTC privacy leaks, MySupportInfo gives you comprehensive data in a clean, visual card.
                                    </p>
                                </div>
                                <div className="bg-white border-2 border-background-dark rounded-2xl p-6 shadow-block-sm space-y-3">
                                    <h3 className="font-bold text-background-dark text-base flex items-center gap-2">
                                        <span className="material-symbols-outlined text-secondary">verified_user</span>
                                        Why Choose MySupportInfo over Legacy Tools?
                                    </h3>
                                    <ul className="text-xs text-background-dark/70 space-y-2 leading-relaxed">
                                        <li className="flex items-start gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 flex-shrink-0" />
                                            <span><strong>100% Client-Side Detection:</strong> No server database logs or tracking cookies.</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 flex-shrink-0" />
                                            <span><strong>Integrated Bufferbloat Diagnostic:</strong> Measure network latency under load alongside device specs.</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 flex-shrink-0" />
                                            <span><strong>One-Click Export Options:</strong> Copy formatted text to clipboard or download a high-res PNG card for ticketing systems.</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 flex-shrink-0" />
                                            <span><strong>Modern Neobrutalist UI:</strong> High-contrast, instantly responsive, and readable on mobile and desktop.</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* Complete Breakdown of Technical Metrics */}
                        <section>
                            <h2 className="text-2xl md:text-3xl font-extrabold text-background-dark font-serif mb-8">
                                Complete Diagnostic Guide: What Each Metric Means
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                                <div className="bg-white border-2 border-background-dark rounded-2xl p-6 shadow-block-sm">
                                    <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                                        <span className="material-symbols-outlined text-xl">language</span>
                                    </div>
                                    <h3 className="font-bold text-background-dark text-base mb-1">Browser Engine & Version</h3>
                                    <p className="text-xs text-background-dark/70 leading-relaxed font-medium">
                                        Identifies your browser (Chrome, Safari, Firefox, Edge, Opera, Brave) and its rendering engine (Blink, Gecko, WebKit). Support teams need this to reproduce layout bugs or verify compatibility with modern HTML5 APIs.
                                    </p>
                                </div>

                                <div className="bg-white border-2 border-background-dark rounded-2xl p-6 shadow-block-sm">
                                    <div className="size-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-3">
                                        <span className="material-symbols-outlined text-xl">laptop</span>
                                    </div>
                                    <h3 className="font-bold text-background-dark text-base mb-1">Operating System & Architecture</h3>
                                    <p className="text-xs text-background-dark/70 leading-relaxed font-medium">
                                        Detects your host OS (Windows 11, macOS Sequoia, Linux, iOS, Android) via modern Client Hints and navigator fallback APIs. Helps developers distinguish mobile touch interfaces from desktop environments.
                                    </p>
                                </div>

                                <div className="bg-white border-2 border-background-dark rounded-2xl p-6 shadow-block-sm">
                                    <div className="size-10 rounded-xl bg-accent/20 text-accent flex items-center justify-center mb-3">
                                        <span className="material-symbols-outlined text-xl">public</span>
                                    </div>
                                    <h3 className="font-bold text-background-dark text-base mb-1">Public IP, Geolocation & ISP</h3>
                                    <p className="text-xs text-background-dark/70 leading-relaxed font-medium">
                                        Displays your public IPv4 and IPv6 addresses, Autonomous System Number (ASN), ISP organization, and city/country location. Crucial for confirming whether your VPN or proxy tunnel is routing correctly.
                                    </p>
                                </div>

                                <div className="bg-white border-2 border-background-dark rounded-2xl p-6 shadow-block-sm">
                                    <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                                        <span className="material-symbols-outlined text-xl">aspect_ratio</span>
                                    </div>
                                    <h3 className="font-bold text-background-dark text-base mb-1">Screen Resolution vs Viewport</h3>
                                    <p className="text-xs text-background-dark/70 leading-relaxed font-medium">
                                        Separates physical monitor resolution from usable browser viewport area and reports Device Pixel Ratio (DPR). When users report UI scaling issues on Retina or 4K monitors, this explains the difference.
                                    </p>
                                </div>

                                <div className="bg-white border-2 border-background-dark rounded-2xl p-6 shadow-block-sm">
                                    <div className="size-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-3">
                                        <span className="material-symbols-outlined text-xl">memory</span>
                                    </div>
                                    <h3 className="font-bold text-background-dark text-base mb-1">CPU Cores & Device Memory</h3>
                                    <p className="text-xs text-background-dark/70 leading-relaxed font-medium">
                                        Inspects available logical CPU threads and estimated RAM buckets. Web apps, WebAssembly modules, and browser games use these values to allocate worker threads and balance performance.
                                    </p>
                                </div>

                                <div className="bg-white border-2 border-background-dark rounded-2xl p-6 shadow-block-sm">
                                    <div className="size-10 rounded-xl bg-accent/20 text-accent flex items-center justify-center mb-3">
                                        <span className="material-symbols-outlined text-xl">security</span>
                                    </div>
                                    <h3 className="font-bold text-background-dark text-base mb-1">WebRTC Leaks & Privacy Signals</h3>
                                    <p className="text-xs text-background-dark/70 leading-relaxed font-medium">
                                        Audits STUN peer connections to ensure your real local or ISP IP address is not leaking past your VPN. Also monitors Do Not Track (DNT), cookie persistence, and active ad blockers.
                                    </p>
                                </div>

                            </div>
                        </section>

                        {/* Bufferbloat CTA Section */}
                        <section className="bg-background-dark text-white rounded-3xl p-8 md:p-12 shadow-block flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="max-w-xl">
                                <div className="text-xs font-black uppercase text-primary tracking-widest mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">network_check</span>
                                    Advanced Network Diagnostic
                                </div>
                                <h2 className="text-2xl md:text-3xl font-extrabold mb-3 font-serif">
                                    Experiencing Gaming Lag or Choppy Video Calls?
                                </h2>
                                <p className="text-accent/80 text-sm leading-relaxed font-medium">
                                    Often, what appears to be a slow browser or buggy web app is actually <strong>Bufferbloat</strong>—packet queuing delay caused by your router during heavy downloads or uploads. Run our professional latency under load test to grade your connection from A to F.
                                </p>
                            </div>
                            <div className="flex-shrink-0">
                                <Link
                                    href="/bufferbloat"
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-background-dark rounded-full font-black text-base hover:bg-primary-dark transition-all border-2 border-background-dark shadow-block-sm hover:scale-105 active:scale-95"
                                >
                                    <span>RUN BUFFERBLOAT TEST</span>
                                    <ArrowRight size={18} />
                                </Link>
                            </div>
                        </section>

                        {/* IT Support & Helpdesk Workflows */}
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div>
                                <div className="inline-flex items-center gap-2 text-secondary font-black uppercase text-3xs tracking-ui-wide mb-2">
                                    <span className="material-symbols-outlined text-sm">support_agent</span>
                                    Optimized for IT Helpdesks
                                </div>
                                <h2 className="text-2xl md:text-3xl font-extrabold text-background-dark font-serif mb-4">
                                    How Tech Support Teams Use MySupportInfo
                                </h2>
                                <p className="text-sm text-background-dark/80 leading-relaxed font-medium mb-4">
                                    Technical support engineers waste countless hours asking clients for basic configuration info. MySupportInfo streamlines the entire customer intake process:
                                </p>
                                <ul className="text-xs text-background-dark/70 space-y-3 font-medium">
                                    <li className="flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 flex-shrink-0" />
                                        <span><strong>Send Clients a Single URL:</strong> Direct users to <code>mysupportinfo.com</code> with no app downloads or software installation needed.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 flex-shrink-0" />
                                        <span><strong>One-Click Formatted Report:</strong> Clients click &ldquo;Copy All Info&rdquo; and paste clean, structured markdown directly into Zendesk, Freshdesk, Jira, or email.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 flex-shrink-0" />
                                        <span><strong>Downloadable Visual Proof:</strong> Clients can download a visual PNG screenshot card showing exact browser version, viewport, and network RTT.</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="bg-white border-2 border-background-dark rounded-2xl p-6 shadow-block-sm font-mono text-2xs space-y-2 text-background-dark/80">
                                <div className="text-3xs uppercase tracking-wider font-sans font-black text-primary border-b border-background-dark/10 pb-2 mb-3">
                                    Sample Diagnostic Output
                                </div>
                                <div>Browser: Chrome 132.0.0.0 (Blink)</div>
                                <div>OS: Windows 11 64-bit</div>
                                <div>Screen: 2560 × 1440 · Viewport: 1920 × 940 (DPR: 1.25x)</div>
                                <div>IP (IPv4): 198.51.100.42 · IPv6: Supported</div>
                                <div>ISP: Cloudflare Warp / ASN 13335</div>
                                <div>WebRTC Leak: No Leak (Protected)</div>
                                <div>Hardware: 16 Cores · ~8 GB RAM · RTX 4080 (WebGL)</div>
                                <div>Network Quality: Latency 14ms · Bufferbloat Grade A</div>
                            </div>
                        </section>

                        {/* Homepage FAQ Accordion */}
                        <section>
                            <div className="text-center max-w-2xl mx-auto mb-10">
                                <h2 className="text-fluid-h2 font-extrabold text-background-dark font-serif mb-3">
                                    Browser & Support Details FAQ
                                </h2>
                                <p className="text-sm text-background-dark/70 font-medium">
                                    Quick answers to common questions about device detection, user-agent data, and privacy protection.
                                </p>
                            </div>
                            <div className="max-w-3xl mx-auto space-y-3">
                                {[
                                    {
                                        q: "Why do support technicians need my browser version and operating system?",
                                        a: "Web browsers render HTML, CSS, and JavaScript differently across operating systems. A bug affecting Safari on macOS might look completely fine in Google Chrome on Windows. Knowing your exact browser version and OS allows developers to reproduce the issue in an identical environment."
                                    },
                                    {
                                        q: "How does MySupportInfo detect my graphics card (GPU) and hardware specs?",
                                        a: "MySupportInfo utilizes standard browser APIs: the WebGL debug renderer info extension queries your graphics hardware string, the Device Memory API provides memory estimations, and navigator.hardwareConcurrency detects available CPU thread cores."
                                    },
                                    {
                                        q: "What is a WebRTC leak and how does it compromise my VPN?",
                                        a: "WebRTC allows video calls and peer-to-peer data in browsers. Even when using a VPN, WebRTC can communicate with STUN servers and expose your real public or local network IP address. MySupportInfo scans your browser's active ICE candidates to ensure no leaks exist."
                                    },
                                    {
                                        q: "Is my personal data stored or logged when using this tool?",
                                        a: "Never. All detection occurs client-side in your local browser sandbox. We do not store IP addresses in databases, use no tracking cookies, and never build user profiles. All data disappears the moment you close your browser tab."
                                    },
                                    {
                                        q: "How can I test my network for gaming and video call lag?",
                                        a: "Head to our Bufferbloat Test tool (/bufferbloat). It simulates real download and upload loads to measure whether your router buffers packets and spikes latency, assigning you an official Quality of Experience grade from A to F."
                                    }
                                ].map((item, idx) => (
                                    <div
                                        key={item.q}
                                        className="bg-white border-2 border-background-dark rounded-2xl overflow-hidden shadow-block-sm transition-all duration-200"
                                    >
                                        <button
                                            id={`home-faq-btn-${idx}`}
                                            onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                            className="w-full p-5 text-left flex justify-between items-center gap-4 hover:bg-background/20 transition-colors cursor-pointer"
                                            aria-expanded={openFaq === idx}
                                            aria-controls={`home-faq-${idx}`}
                                        >
                                            <span className="font-extrabold text-background-dark text-base">{item.q}</span>
                                            <span className={`material-symbols-outlined transition-transform duration-300 ease-out text-background-dark/60 flex-shrink-0 ml-2 ${openFaq === idx ? "rotate-180 text-primary" : ""}`}>
                                                expand_more
                                            </span>
                                        </button>
                                        <div
                                            id={`home-faq-${idx}`}
                                            role="region"
                                            aria-labelledby={`home-faq-btn-${idx}`}
                                            className={`grid transition-[grid-template-rows] duration-300 ease-out ${openFaq === idx ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                                        >
                                            <div className="overflow-hidden">
                                                <div className={`px-5 pb-5 pt-1 text-sm text-background-dark/75 leading-relaxed font-medium border-t border-background-dark/10 transition-opacity duration-200 ${openFaq === idx ? "opacity-100" : "opacity-0"}`}>
                                                    {item.a}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                    </article>
                </div>
            </div>

            {/* ── Screenshot Options & Privacy Modal ──────────────── */}
            <ScreenshotModal
                isOpen={isScreenshotModalOpen}
                onClose={() => setIsScreenshotModalOpen(false)}
                onCapture={handleCaptureFromModal}
                stats={stats}
                webrtcLeak={webrtcLeak}
                currentTime={currentTime}
                downloading={downloading}
            />

            {/* ── Share Diagnostic Report Modal ───────────────────── */}
            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                stats={stats}
            />

            {/* ── Report a Detection Error Modal ─────────────────── */}
            <ReportErrorModal
                isOpen={isReportErrorOpen}
                onClose={() => setIsReportErrorOpen(false)}
                systemStats={stats}
            />
        </div>
        </>
    );
}
