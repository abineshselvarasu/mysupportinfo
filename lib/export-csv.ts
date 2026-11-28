export interface DiagnosticExportData {
    browserName?: string;
    browserVersion?: string;
    userAgent?: string;
    osName?: string;
    language?: string;
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
    ip?: string;
    ipv6?: string;
    ispName?: string;
    city?: string;
    country?: string;
    countryCode?: string;
    timezone?: string;
    latency?: string;
    connectionType?: string;
    connectionSpeed?: string;
    webrtcLeak?: string;
    vpnDetected?: boolean;
    adBlocker?: string;
    cookiesEnabled?: boolean;
    doNotTrack?: string;
    globalPrivacyControl?: string;
    [key: string]: unknown;
}

/**
 * Generates an RFC-4180 compliant CSV string from system diagnostic metrics.
 * Prepend UTF-8 BOM so Excel, Google Sheets, and LibreOffice Calc render special characters cleanly.
 * Sanitizes against CSV formula injection (=, +, -, @).
 */
export function generateDiagnosticCSV(
    data: DiagnosticExportData,
    maskSensitive: boolean = false,
    selectedFields?: Set<string>
): string {
    const allMetrics: [string, string, string, string][] = [
        ["browser", "Browser", "Browser Name", data.browserName || "Unknown"],
        ["browser", "Browser", "Browser Version", data.browserVersion || "Unknown"],
        ["userAgent", "Browser", "User Agent", data.userAgent || "Unknown"],
        ["language", "Browser", "Language", data.language || "Unknown"],
        ["cookies", "Browser", "Cookies Enabled", data.cookiesEnabled === false ? "No" : "Yes"],
        ["os", "Operating System", "Platform / OS", data.osName || "Unknown"],
        ["clock", "Operating System", "Timezone", data.timezone || "Unknown"],
        ["screen", "Display", "Screen Resolution", data.resolution || "Unknown"],
        ["viewport", "Display", "Viewport Size", data.windowSize || "Unknown"],
        ["screen", "Display", "Device Pixel Ratio (DPR)", data.pixelRatio || "1x"],
        ["screen", "Display", "Color Depth", data.colorDepth ? `${data.colorDepth}` : "Unknown"],
        ["screen", "Display", "Screen Orientation", data.orientation || "Unknown"],
        ["hardware", "Display", "Touch Support", data.touchSupport || "None"],
        ["hardware", "Hardware", "CPU Logical Cores", String(data.cpuCores ?? "Unknown")],
        ["hardware", "Hardware", "RAM Estimate", data.ram || "Unknown"],
        ["gpu", "Hardware", "GPU WebGL Renderer", data.webglVendor || "Unknown"],
        ["battery", "Hardware", "Battery Level", data.batteryLevel || "Unknown"],
        ["battery", "Hardware", "Battery Charging", data.batteryCharging || "Unknown"],
        ["ip", "Network", "Public IPv4", maskSensitive ? "[Masked for Privacy]" : (data.ip || "Unknown")],
        ["ip", "Network", "Public IPv6", maskSensitive ? "[Masked for Privacy]" : (data.ipv6 || "Not Detected / Unsupported")],
        ["isp", "Network", "ISP Name", maskSensitive ? "[Masked for Privacy]" : (data.ispName || "Unknown")],
        ["location", "Network", "Approximate Location", maskSensitive ? "[Masked for Privacy]" : ([data.city, data.country].filter(Boolean).join(", ") || "Unknown")],
        ["location", "Network", "Country Code", maskSensitive ? "[Masked for Privacy]" : (data.countryCode || "Unknown")],
        ["latency", "Network", "Latency (Idle)", data.latency || "Unknown"],
        ["latency", "Network", "Connection Type", data.connectionType || "Unknown"],
        ["latency", "Network", "Effective Speed", data.connectionSpeed || "Unknown"],
        ["webrtc", "Privacy & Security", "WebRTC Leak Status", data.webrtcLeak || "No Leak"],
        ["isp", "Privacy & Security", "VPN Detected", maskSensitive ? "[Masked for Privacy]" : (data.vpnDetected ? "Yes (Heuristic)" : "No")],
        ["privacy", "Privacy & Security", "Ad Blocker", data.adBlocker || "Not Detected"],
        ["privacy", "Privacy & Security", "Do Not Track", data.doNotTrack || "Unspecified"],
        ["privacy", "Privacy & Security", "Global Privacy Control (GPC)", data.globalPrivacyControl || "Not Set"],
        ["meta", "Audit Metadata", "Audit Source", "MySupportInfo (mysupportinfo.com)"],
        ["meta", "Audit Metadata", "Platform URL", "https://mysupportinfo.com"],
        ["meta", "Audit Metadata", "Export Timestamp (UTC)", new Date().toISOString()],
        ["meta", "Audit Metadata", "Privacy Masking Applied", maskSensitive ? "Yes (IP & Location Redacted)" : "No"],
        ["meta", "Audit Metadata", "Promotion & Referral", "Instant browser, OS & network diagnostics for IT support tickets: https://mysupportinfo.com"],
    ];

    // Filter by selectedFields if provided (always include meta)
    const filtered = selectedFields
        ? allMetrics.filter(([fieldId]) => fieldId === "meta" || selectedFields.has(fieldId))
        : allMetrics;

    const rows: [string, string, string][] = [
        ["Category", "Diagnostic Metric", "Detected Value"],
        ...filtered.map(([, category, metric, val]) => [category, metric, val] as [string, string, string]),
    ];

    const escapeCell = (val: string): string => {
        let clean = String(val ?? "").trim();
        // Prevent CSV injection if cell starts with dangerous formula prefixes
        if (/^[=+\-@]/.test(clean)) {
            clean = `'${clean}`;
        }
        if (clean.includes('"') || clean.includes(',') || clean.includes('\n') || clean.includes('\r')) {
            clean = `"${clean.replace(/"/g, '""')}"`;
        }
        return clean;
    };

    // Prepend UTF-8 BOM so spreadsheet viewers render UTF-8 encoding accurately
    return "\uFEFF" + rows.map(r => r.map(escapeCell).join(",")).join("\r\n");
}

/**
 * Triggers a browser download of the CSV content.
 */
export function downloadCSV(csvContent: string, filename?: string) {
    if (typeof window === "undefined") return;
    const dateStr = new Date().toISOString().slice(0, 10);
    const fname = filename || `mysupportinfo-diagnostic-report-${dateStr}.csv`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fname);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
