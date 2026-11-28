export interface NetworkDiagnostics {
    ip: string;
    ipv6: string;
    ispName: string;
    city: string;
    country: string;
    countryCode: string;
    vpnDetected: boolean;
}

const IP_CACHE_KEY = "msi_ip_v3";
const IP_CACHE_TTL = 5 * 60 * 1000;

export const VPN_ASN_KEYWORDS = [
    "vpn",
    "mullvad",
    "nordvpn",
    "expressvpn",
    "surfshark",
    "cyberghost",
    "protonvpn",
    "torguard",
    "ipvanish",
    "windscribe",
    "ovh",
    "digitalocean",
    "linode",
    "hetzner",
    "cloudflare",
];

async function fetchWithTimeout(url: string, timeoutMs = 5000): Promise<Response> {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        return await fetch(url, { signal: ctrl.signal });
    } finally {
        clearTimeout(tid);
    }
}

/**
 * Resolves public IPv4, dual-stack IPv6, ISP/ASN, approximate location, and VPN classification
 * using a short-lived sessionStorage cache and multi-provider fallback chain.
 */
export async function fetchNetworkDiagnostics(useCache = true): Promise<NetworkDiagnostics> {
    let ip = "Unavailable";
    let ipv6 = "Not Available";
    let ispName = "Unknown ISP";
    let city = "";
    let country = "";
    let countryCode = "";
    let vpnDetected = false;

    if (useCache && typeof window !== "undefined") {
        try {
            const raw = sessionStorage.getItem(IP_CACHE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Date.now() - parsed.ts < IP_CACHE_TTL) {
                    return {
                        ip: parsed.ip || ip,
                        ipv6: parsed.ipv6 || ipv6,
                        ispName: parsed.ispName || ispName,
                        city: parsed.city || "",
                        country: parsed.country || "",
                        countryCode: parsed.countryCode || "",
                        vpnDetected: Boolean(parsed.vpnDetected),
                    };
                }
            }
        } catch {
            // Ignore unreadable sessionStorage
        }
    }

    try {
        const res = await fetchWithTimeout("https://ipapi.co/json/");
        if (!res.ok) throw new Error("ipapi failed");
        const data = await res.json();
        if (data.error) throw new Error(data.reason || "ipapi error");
        ip = data.ip || "Unavailable";
        ispName = data.org || "Unknown ISP";
        city = data.city || "";
        country = data.country_name || "";
        countryCode = data.country_code || "";
    } catch {
        try {
            const res = await fetchWithTimeout("https://ipwho.is/");
            const data = await res.json();
            if (!data.success) throw new Error("ipwho.is failed");
            ip = data.ip || "Unavailable";
            ispName = data.connection?.isp || data.connection?.org || "Unknown ISP";
            city = data.city || "";
            country = data.country || "";
            countryCode = data.country_code || "";
        } catch {
            try {
                const res = await fetchWithTimeout("https://api.ipify.org?format=json");
                ip = (await res.json()).ip || "Unavailable";
            } catch {
                ip = "Unavailable";
            }
        }
    }

    vpnDetected = VPN_ASN_KEYWORDS.some((k) => ispName.toLowerCase().includes(k));

    try {
        const res6 = await fetchWithTimeout("https://api64.ipify.org?format=json");
        const d6 = await res6.json();
        if (d6.ip?.includes(":")) ipv6 = d6.ip;
    } catch {
        // IPv6 unsupported on this connection
    }

    if (ip.includes(":")) {
        if (ipv6 === "Not Available") ipv6 = ip;
        try {
            const res4 = await fetchWithTimeout("https://api.ipify.org?format=json");
            const d4 = await res4.json();
            ip = d4.ip && !d4.ip.includes(":") ? d4.ip : "Not Available (IPv6-only)";
        } catch {
            ip = "Not Available (IPv6-only)";
        }
    }

    const result: NetworkDiagnostics = { ip, ipv6, ispName, city, country, countryCode, vpnDetected };

    if (useCache && typeof window !== "undefined") {
        try {
            sessionStorage.setItem(IP_CACHE_KEY, JSON.stringify({ ts: Date.now(), ...result }));
        } catch {
            // Ignore quota errors
        }
    }

    return result;
}

/**
 * Inspects local RTCPeerConnection ICE candidates (IPv4 and IPv6) via STUN
 * to detect exposed public or local addresses behind a VPN.
 */
export async function scanWebRtcLeak(timeoutMs = 3000): Promise<string> {
    if (typeof window === "undefined" || typeof RTCPeerConnection === "undefined") {
        return "Unsupported";
    }

    try {
        const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
        pc.createDataChannel("");
        const ips = new Set<string>();

        await new Promise<void>((resolve) => {
            const timer = setTimeout(resolve, timeoutMs);
            pc.onicecandidate = (e) => {
                if (!e.candidate) {
                    clearTimeout(timer);
                    resolve();
                    return;
                }
                const cand = e.candidate.candidate;
                const m4 = cand.match(
                    /\b((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/
                );
                if (m4 && !m4[0].startsWith("0.") && !m4[0].startsWith("127.")) ips.add(m4[0]);
                const m6 = cand.match(/([0-9a-fA-F]{1,4}:){2,7}[0-9a-fA-F]{1,4}/);
                if (m6 && !m6[0].startsWith("fe80:") && m6[0] !== "::1") ips.add(m6[0]);
            };
            pc.createOffer()
                .then((o) => pc.setLocalDescription(o))
                .catch(() => {
                    clearTimeout(timer);
                    resolve();
                });
        });

        pc.close();

        if (ips.size === 0) return "No Leak (Protected)";
        const isPublic = [...ips].some(
            (candIp) =>
                !candIp.startsWith("192.168.") &&
                !candIp.startsWith("10.") &&
                !/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(candIp)
        );
        return isPublic ? `Public IP Exposed: ${[...ips].join(", ")}` : `Local Candidate: ${[...ips].join(", ")}`;
    } catch {
        return "Unsupported";
    }
}
