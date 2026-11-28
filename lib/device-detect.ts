type NavigatorWithHints = Navigator & {
    brave?: { isBrave?: () => Promise<boolean> };
    globalPrivacyControl?: boolean;
    deviceMemory?: number;
    userAgentData?: {
        platform?: string;
        getHighEntropyValues?: (hints: string[]) => Promise<{ platform?: string }>;
    };
};

export interface BrowserDetectionResult {
    browserName: string;
    browserVersion: string;
    engine: string;
}

/**
 * Formats devicePixelRatio without IEEE-754 float noise (e.g. 90% zoom -> "0.9x").
 */
export function formatDPR(raw?: number): string {
    const val = typeof raw === "number" && Number.isFinite(raw) && raw > 0 ? raw : 1;
    return `${Number(val.toFixed(2))}x`;
}

/**
 * Normalizes ScreenOrientation type into a clean human-readable label.
 */
export function getScreenOrientation(): string {
    if (typeof screen === "undefined") return "Unknown";
    return (
        screen.orientation?.type
            ?.replace("-primary", "")
            .replace("-secondary", " (alt)") || "Unknown"
    );
}

/**
 * Reads navigator.globalPrivacyControl (GPC) opt-out signal cleanly.
 */
export function detectGlobalPrivacyControl(): string {
    if (typeof navigator === "undefined") return "Not Set";
    const nav = navigator as NavigatorWithHints;
    return nav.globalPrivacyControl === true ? "ENABLED" : "Not Set";
}

function platformToOS(platform: string, ua: string): string | null {
    const value = platform.toLowerCase();
    const hasTouch = typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;

    if (value.includes("android")) return "Android";
    if (value.includes("ios") || value.includes("iphone") || value.includes("ipad")) return "iOS";
    if (value.includes("windows") || value.includes("win")) return "Windows";
    if (value.includes("chrome os") || value.includes("cros")) return "ChromeOS";
    if (value.includes("mac")) {
        return ua.includes("Macintosh") && hasTouch ? "iPadOS" : "macOS";
    }
    if (value.includes("linux")) {
        if (/Android/i.test(ua)) return "Android";
        if (hasTouch) return "Android/Linux Tablet";
        return "Linux";
    }
    return null;
}

/**
 * Detects host operating system using User-Agent Client Hints with UA & platform fallbacks.
 */
export async function detectOSName(uaArg?: string): Promise<string> {
    if (typeof navigator === "undefined") return "Unknown OS";
    const ua = uaArg ?? navigator.userAgent;
    const nav = navigator as NavigatorWithHints;

    try {
        const hints = await nav.userAgentData?.getHighEntropyValues?.(["platform"]);
        const osFromHints = platformToOS(hints?.platform || nav.userAgentData?.platform || "", ua);
        if (osFromHints) return osFromHints;
    } catch {
        // Ignore unavailable high-entropy hints
    }

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
}

/**
 * Detects browser product name, version, and rendering engine consistently across all routes.
 */
export async function detectBrowserInfo(uaArg?: string): Promise<BrowserDetectionResult> {
    if (typeof navigator === "undefined") {
        return { browserName: "Unknown Browser", browserVersion: "", engine: "Unknown" };
    }

    const ua = uaArg ?? navigator.userAgent;
    let browserName = "Unknown";
    let browserVersion = "";
    let engine = "Unknown";

    if (ua.includes("Edg/") || ua.includes("Edge/") || ua.includes("EdgA/") || ua.includes("EdgiOS/")) {
        browserName = "Microsoft Edge";
        browserVersion = ua.match(/(?:Edg|Edge|EdgA|EdgiOS)\/(\d+)/)?.[1] || "";
        engine = ua.includes("EdgiOS/") ? "WebKit" : "Blink (Chromium)";
    } else if (ua.includes("SamsungBrowser/")) {
        browserName = "Samsung Internet";
        browserVersion = ua.match(/SamsungBrowser\/(\d+)/)?.[1] || "";
        engine = "Blink";
    } else if (ua.includes("YaBrowser/")) {
        browserName = "Yandex Browser";
        browserVersion = ua.match(/YaBrowser\/(\d+)/)?.[1] || "";
        engine = "Blink";
    } else if (ua.includes("UCBrowser/")) {
        browserName = "UC Browser";
        browserVersion = ua.match(/UCBrowser\/(\d+)/)?.[1] || "";
        engine = "Blink";
    } else if (ua.includes("DuckDuckGo/")) {
        browserName = "DuckDuckGo";
        browserVersion = ua.match(/DuckDuckGo\/(\d+)/)?.[1] || "";
        engine = /Macintosh|iPhone|iPad/i.test(ua) ? "WebKit" : "Blink";
    } else if (ua.includes("Vivaldi/")) {
        browserName = "Vivaldi";
        browserVersion = ua.match(/Vivaldi\/(\d+)/)?.[1] || "";
        engine = "Blink";
    } else if (ua.includes("OPR/") || ua.includes("OPT/")) {
        browserName = "Opera";
        browserVersion = ua.match(/(?:OPR|OPT)\/(\d+)/)?.[1] || "";
        engine = ua.includes("OPT/") ? "WebKit" : "Blink";
    } else if (ua.includes("Opera Mini") || ua.includes("OPiOS/")) {
        browserName = "Opera Mini";
        browserVersion = ua.match(/(?:Opera Mini|OPiOS)\/(\d+)/)?.[1] || "";
        engine = ua.includes("OPiOS/") ? "WebKit" : "Presto / Blink";
    } else if (ua.includes("CriOS/")) {
        browserName = "Chrome";
        browserVersion = ua.match(/CriOS\/(\d+)/)?.[1] || "";
        engine = "WebKit (iOS)";
    } else if (ua.includes("FxiOS/")) {
        browserName = "Firefox";
        browserVersion = ua.match(/FxiOS\/(\d+)/)?.[1] || "";
        engine = "WebKit (iOS)";
    } else if (ua.includes("Firefox/")) {
        browserName = "Firefox";
        browserVersion = ua.match(/Firefox\/(\d+)/)?.[1] || "";
        engine = "Gecko";
    } else if (ua.includes("Silk/")) {
        browserName = "Amazon Silk";
        browserVersion = ua.match(/Silk\/(\d+)/)?.[1] || "";
        engine = "Blink";
    } else if (ua.includes("Chrome/")) {
        browserName = "Chrome";
        browserVersion = ua.match(/Chrome\/(\d+)/)?.[1] || "";
        engine = "Blink";
    } else if (ua.includes("Safari/")) {
        browserName = "Safari";
        browserVersion = ua.match(/Version\/(\d+)/)?.[1] || "";
        engine = "WebKit";
    }

    const nav = navigator as NavigatorWithHints;
    if (nav.brave?.isBrave) {
        try {
            if (await nav.brave.isBrave()) {
                browserName = "Brave";
                engine = "Blink (Chromium)";
            }
        } catch {
            // Ignore blocked Brave detection
        }
    }

    return { browserName, browserVersion, engine };
}
