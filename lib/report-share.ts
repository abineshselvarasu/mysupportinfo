export interface SharedReportData {
    browserName: string;
    browserVersion: string;
    osName: string;
    resolution: string;
    windowSize: string;
    pixelRatio: string;
    colorDepth: string;
    orientation?: string;
    touchSupport?: string;
    cpuCores: number | string;
    ram: string;
    webglVendor: string;
    batteryLevel?: string;
    batteryCharging?: string;
    language: string;
    persistence: string;
    doNotTrack: string;
    globalPrivacyControl?: string;
    adBlocker?: string;
    ip: string;
    ipv6: string;
    ispName: string;
    location: string;
    countryCode?: string;
    vpnDetected?: boolean;
    latency?: string;
    connectionType?: string;
    connectionSpeed?: string;
    webrtcLeak?: string;
    userAgent?: string;
    timezone: string;
    timestamp: number;
}

/**
 * Encodes a system stats object into a compact, URL-safe base64 string.
 */
export function encodeReport(
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
        webrtcLeak?: string;
        userAgent?: string;
        timezone?: string;
    },
    maskSensitive: boolean = false
): string {
    const loc = [stats.city, stats.country].filter(Boolean).join(", ");
    const webrtcVal = stats.webrtcLeak || "Protected (Report)";
    const isWebRtcSafe = webrtcVal.startsWith("No Leak") || webrtcVal.startsWith("Local Candidate");

    const payload: SharedReportData = {
        browserName: stats.browserName || "Unknown Browser",
        browserVersion: stats.browserVersion || "",
        osName: stats.osName || "Unknown OS",
        resolution: stats.resolution || "Unknown",
        windowSize: stats.windowSize || "Unknown",
        pixelRatio: stats.pixelRatio || "1x",
        colorDepth: stats.colorDepth || "24-bit",
        orientation: stats.orientation || "Unknown",
        touchSupport: stats.touchSupport || "N/A",
        cpuCores: stats.cpuCores || "Unknown",
        ram: stats.ram || "Unknown",
        webglVendor: stats.webglVendor || "Unknown",
        batteryLevel: stats.batteryLevel || "N/A",
        batteryCharging: stats.batteryCharging || "N/A",
        language: stats.language || "en",
        persistence: stats.persistence || "ENABLED",
        doNotTrack: stats.doNotTrack || "DISABLED",
        globalPrivacyControl: stats.globalPrivacyControl || "Not Set",
        adBlocker: stats.adBlocker || "Not Detected",
        ip: maskSensitive ? "[Masked for Privacy]" : stats.ip || "Unavailable",
        ipv6: maskSensitive ? "[Masked]" : stats.ipv6 || "Not Available",
        ispName: maskSensitive ? "[Masked for Privacy]" : stats.ispName || "Unknown ISP",
        location: maskSensitive ? "[Masked for Privacy]" : loc || "Unknown",
        countryCode: maskSensitive ? "" : stats.countryCode || "",
        vpnDetected: maskSensitive ? false : Boolean(stats.vpnDetected),
        latency: stats.latency || "N/A",
        connectionType: stats.connectionType || "N/A",
        connectionSpeed: stats.connectionSpeed || "N/A",
        webrtcLeak: maskSensitive && !isWebRtcSafe ? "[Masked for Privacy]" : webrtcVal,
        userAgent: stats.userAgent || "Shared device snapshot",
        timezone: stats.timezone || "UTC",
        timestamp: Date.now(),
    };

    try {
        const json = JSON.stringify(payload);
        const bytes = new TextEncoder().encode(json);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    } catch {
        return "";
    }
}

/**
 * Decodes a URL-safe base64 string back into a diagnostic report.
 */
export function decodeReport(encoded: string): SharedReportData | null {
    if (!encoded) return null;
    try {
        let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4) {
            base64 += "=";
        }
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        const json = new TextDecoder().decode(bytes);
        const parsed = JSON.parse(json);
        if (parsed && typeof parsed === "object" && parsed.browserName) {
            return parsed as SharedReportData;
        }
        return null;
    } catch {
        return null;
    }
}
