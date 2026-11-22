export interface SharedReportData {
    browserName: string;
    browserVersion: string;
    osName: string;
    resolution: string;
    windowSize: string;
    pixelRatio: string;
    colorDepth: string;
    cpuCores: number | string;
    ram: string;
    webglVendor: string;
    language: string;
    persistence: string;
    doNotTrack: string;
    ip: string;
    ipv6: string;
    ispName: string;
    location: string;
    timezone: string;
    timestamp: number;
}

/**
 * Encodes a system stats object into a compact, URL-safe base64 string
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
    },
    maskSensitive: boolean = false
): string {
    const loc = [stats.city, stats.country].filter(Boolean).join(", ");
    const payload: SharedReportData = {
        browserName: stats.browserName || "Unknown Browser",
        browserVersion: stats.browserVersion || "",
        osName: stats.osName || "Unknown OS",
        resolution: stats.resolution || "Unknown",
        windowSize: stats.windowSize || "Unknown",
        pixelRatio: stats.pixelRatio || "1x",
        colorDepth: stats.colorDepth || "24-bit",
        cpuCores: stats.cpuCores || "Unknown",
        ram: stats.ram || "Unknown",
        webglVendor: stats.webglVendor || "Unknown",
        language: stats.language || "en",
        persistence: stats.persistence || "ENABLED",
        doNotTrack: stats.doNotTrack || "DISABLED",
        ip: maskSensitive ? "[Masked for Privacy]" : (stats.ip || "Unavailable"),
        ipv6: maskSensitive ? "[Masked]" : (stats.ipv6 || "Not Available"),
        ispName: maskSensitive ? "[Masked for Privacy]" : (stats.ispName || "Unknown ISP"),
        location: maskSensitive ? "[Masked for Privacy]" : (loc || "Unknown"),
        timezone: stats.timezone || "UTC",
        timestamp: Date.now(),
    };

    try {
        const json = JSON.stringify(payload);
        // UTF-8 safe base64 encoding
        const bytes = new TextEncoder().encode(json);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary)
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");
    } catch {
        return "";
    }
}

/**
 * Decodes a URL-safe base64 string back into a diagnostic report
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
