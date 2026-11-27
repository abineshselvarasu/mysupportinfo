"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
    Globe, ShieldCheck, ShieldAlert, Copy, Check,
    RefreshCw, Monitor
} from "lucide-react";
import DiagnosticFaqSection, { type DiagnosticFaqItem } from "@/components/ui/DiagnosticFaqSection";

interface IpDetails {
    ip: string;
    ipv6: string;
    ispName: string;
    city: string;
    country: string;
    countryCode: string;
    vpnDetected: boolean;
}

const IP_RANGE_REFERENCE = [
    { cidr: "10.0.0.0/8", scope: "Private (RFC 1918 Class A)", usage: "Corporate LANs, cloud VPCs, enterprise VPN subnets" },
    { cidr: "172.16.0.0/12", scope: "Private (RFC 1918 Class B)", usage: "Docker bridges, campus networks, medium office VLANs" },
    { cidr: "192.168.0.0/16", scope: "Private (RFC 1918 Class C)", usage: "Home Wi-Fi routers, printers, smart-home devices" },
    { cidr: "100.64.0.0/10", scope: "Shared / CGNAT (RFC 6598)", usage: "ISP Carrier-Grade NAT & mobile data (blocks port forwarding)" },
    { cidr: "127.0.0.0/8", scope: "Loopback (localhost)", usage: "Internal device self-routing only; never leaves your OS" },
];

export default function WhatIsMyIpClient({ faqs }: { faqs: DiagnosticFaqItem[] }) {
    const [ipData, setIpData] = useState<IpDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [webrtcLeak, setWebrtcLeak] = useState<string>("Scanning…");
    const [copiedIp, setCopiedIp] = useState(false);

    useEffect(() => {
        const fetchIp = async () => {
            let ip = "Unavailable";
            let ipv6 = "Not Available";
            let ispName = "Unknown ISP";
            let city = "";
            let country = "";
            let countryCode = "";
            let vpnDetected = false;

            try {
                const res = await fetch("https://ipwho.is/");
                const data = await res.json();
                if (data.success) {
                    ip = data.ip || "Unavailable";
                    ispName = data.connection?.isp || data.connection?.org || "Unknown ISP";
                    city = data.city || "";
                    country = data.country || "";
                    countryCode = data.country_code || "";
                } else {
                    throw new Error();
                }
            } catch {
                try {
                    const res = await fetch("https://api.ipify.org?format=json");
                    ip = (await res.json()).ip || "Unavailable";
                } catch { /* ignore */ }
            }

            try {
                const res = await fetch("https://api64.ipify.org?format=json");
                const d = await res.json();
                if (d.ip?.includes(":")) ipv6 = d.ip;
            } catch { /* ignore */ }

            const vpnKeywords = ["vpn", "mullvad", "nordvpn", "expressvpn", "surfshark", "digitalocean", "cloudflare", "linode", "hetzner"];
            vpnDetected = vpnKeywords.some(k => ispName.toLowerCase().includes(k));

            setIpData({ ip, ipv6, ispName, city, country, countryCode, vpnDetected });
            setLoading(false);
        };

        fetchIp();
    }, []);

    // WebRTC Leak Check
    useEffect(() => {
        const checkWebrtc = async () => {
            try {
                const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
                pc.createDataChannel("");
                const ips = new Set<string>();
                await new Promise<void>((resolve) => {
                    pc.onicecandidate = (e) => {
                        if (!e.candidate) { resolve(); return; }
                        const m4 = e.candidate.candidate.match(/\b((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/);
                        if (m4 && !m4[0].startsWith("0.") && !m4[0].startsWith("127.")) ips.add(m4[0]);
                    };
                    pc.createOffer().then(o => pc.setLocalDescription(o)).catch(() => resolve());
                    setTimeout(resolve, 2500);
                });
                pc.close();
                if (ips.size === 0) setWebrtcLeak("No Leak (Protected)");
                else setWebrtcLeak(`Candidate Detected: ${[...ips].join(", ")}`);
            } catch {
                setWebrtcLeak("Unsupported");
            }
        };
        checkWebrtc();
    }, []);

    const copyIp = async () => {
        if (!ipData) return;
        await navigator.clipboard.writeText(ipData.ip);
        setCopiedIp(true);
        setTimeout(() => setCopiedIp(false), 2000);
    };

    const locationLabel = ipData
        ? [ipData.city, ipData.country].filter(Boolean).join(", ") || "Approximate location unavailable"
        : "Detecting approximate city and region…";

    return (
        <div className="min-h-screen bg-background text-foreground font-sans pb-24">
            {/* Breadcrumb Navigation */}
            <div className="max-w-site mx-auto px-6 pt-6">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-3xs font-extrabold uppercase tracking-widest text-background-dark/50">
                    <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                    <span>/</span>
                    <span className="text-primary font-bold" aria-current="page">What Is My IP</span>
                </nav>
            </div>

            {/* Hero Header */}
            <div className="text-center px-6 pt-8 pb-10 max-w-3xl mx-auto">
                <p className="text-xs font-black uppercase tracking-widest text-secondary mb-3">
                    Live IPv4, IPv6 &amp; WebRTC Leak Audit
                </p>
                <h1 className="font-serif text-fluid-h1 font-bold text-background-dark leading-tight mb-4">
                    What Is My IP Address?
                </h1>
                <p className="text-fluid-lead text-background-dark/70 font-medium leading-relaxed">
                    Instantly check your public IPv4 and IPv6 addresses, Internet Service Provider (ISP), approximate geolocation, and browser WebRTC leak status with zero server logging.
                </p>
            </div>

            {/* Main Interactive Diagnostic Card */}
            <div className="max-w-4xl mx-auto px-6 mb-16">
                <div className="bg-white border-2 border-background-dark rounded-3xl p-6 sm:p-10 shadow-block">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b-2 border-background-dark/10">
                        <div>
                            <span className="text-4xs font-bold uppercase tracking-ui-widest text-background-dark/60 block mb-1">
                                Your Public IPv4 Address
                            </span>
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-3xl sm:text-5xl font-mono font-bold text-background-dark">
                                    {loading ? "Scanning…" : ipData?.ip}
                                </span>
                                {ipData?.countryCode && (
                                    <span className="px-2.5 py-1 rounded-lg bg-background-dark/10 border border-background-dark/20 text-xs font-mono font-black uppercase text-background-dark">
                                        {ipData.countryCode}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs sm:text-sm text-background-dark/70 mt-2 font-medium">
                                {ipData ? (
                                    <>
                                        Provided by <span className="font-bold text-background-dark">{ipData.ispName}</span> &middot;{" "}
                                        <span className="font-bold text-background-dark">{locationLabel}</span>
                                    </>
                                ) : (
                                    <span>Querying ISP carrier and geolocation locally in your browser…</span>
                                )}
                            </p>
                        </div>

                        <div className="flex items-center gap-2.5">
                            <button
                                onClick={copyIp}
                                disabled={loading}
                                aria-label={copiedIp ? "IPv4 address copied to clipboard" : "Copy public IPv4 address to clipboard"}
                                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-background-dark font-black uppercase tracking-wider text-xs rounded-xl border-2 border-background-dark shadow-block-sm hover:bg-primary-dark active:translate-x-px active:translate-y-px active:shadow-none transition-all cursor-pointer disabled:opacity-50"
                            >
                                {copiedIp ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                                <span>{copiedIp ? "Copied!" : "Copy IP"}</span>
                            </button>
                            <div className="sr-only" role="status" aria-live="polite">
                                {copiedIp && "Public IP address copied to clipboard."}
                            </div>
                        </div>
                    </div>

                    {/* Secondary Network Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
                        <div className="p-4 rounded-2xl bg-background-dark/5 border border-background-dark/10">
                            <span className="text-4xs uppercase tracking-wider font-bold text-background-dark/60 block mb-1">
                                IPv6 Address
                            </span>
                            <span className="font-mono text-xs font-bold text-background-dark break-all block">
                                {loading ? "Scanning…" : ipData?.ipv6}
                            </span>
                            <span className="text-5xs text-background-dark/50 block mt-1">Dual-Stack Routing</span>
                        </div>

                        <div className="p-4 rounded-2xl bg-background-dark/5 border border-background-dark/10">
                            <span className="text-4xs uppercase tracking-wider font-bold text-background-dark/60 block mb-1">
                                WebRTC Privacy
                            </span>
                            <span className="font-bold text-xs text-secondary flex items-center gap-1.5">
                                <ShieldCheck size={14} aria-hidden="true" />
                                {webrtcLeak}
                            </span>
                            <span className="text-5xs text-background-dark/50 block mt-1">VPN Tunnel Protection</span>
                        </div>

                        <div className="p-4 rounded-2xl bg-background-dark/5 border border-background-dark/10">
                            <span className="text-4xs uppercase tracking-wider font-bold text-background-dark/60 block mb-1">
                                VPN / Proxy Status
                            </span>
                            <span className={`font-bold text-xs flex items-center gap-1.5 ${ipData?.vpnDetected ? "text-yellow-600" : "text-background-dark"}`}>
                                {ipData?.vpnDetected ? <ShieldAlert size={14} aria-hidden="true" /> : <ShieldCheck size={14} className="text-secondary" aria-hidden="true" />}
                                {loading ? "Checking…" : ipData?.vpnDetected ? "VPN / Datacenter ASN" : "Residential / Direct ISP"}
                            </span>
                            <span className="text-5xs text-background-dark/50 block mt-1">ASN Organization Check</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Editorial Content Section */}
            <div className="max-w-4xl mx-auto px-6 space-y-12">
                {/* Guide 1 */}
                <section className="bg-white border-2 border-background-dark rounded-3xl p-8 shadow-block-sm space-y-4">
                    <h2 className="font-serif text-fluid-h2 font-bold text-background-dark">
                        What is a Public IP Address and Why Does IT Need It?
                    </h2>
                    <p className="text-fluid-body text-background-dark/80 leading-relaxed font-medium">
                        Your <strong>public IP (Internet Protocol) address</strong> is the external numerical identity assigned by your Internet Service Provider (ISP) to your modem or router. Whenever your browser loads a website, authenticates an API, or joins a video call, destination servers use that public IP to route return packets back to your connection.
                    </p>
                    <p className="text-fluid-body text-background-dark/80 leading-relaxed font-medium">
                        IT helpdesks, network engineers, and security administrators routinely ask for your public IP address to allowlist remote employees inside corporate firewalls, troubleshoot VPN split-tunneling rules, diagnose asymmetric ISP routing, and verify whether Carrier-Grade NAT (CGNAT) is blocking inbound services or peer-to-peer gaming lobbies.
                    </p>
                </section>

                {/* IPv4 vs IPv6 */}
                <section className="space-y-6">
                    <h2 className="font-serif text-fluid-h2 font-bold text-background-dark">
                        IPv4 vs. IPv6: Understanding Dual-Stack Networking
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="p-6 rounded-3xl bg-white border-2 border-background-dark shadow-block-sm space-y-3">
                            <span className="inline-block px-2.5 py-1 rounded-full text-4xs font-mono font-black uppercase tracking-wider bg-primary text-background-dark">
                                IPv4 (Legacy Standard)
                            </span>
                            <h3 className="font-bold text-lg text-background-dark">32-Bit Dotted Decimal</h3>
                            <p className="text-xs text-background-dark/70 leading-relaxed font-medium">
                                Written as four 8-bit octets from 0 to 255 (e.g. <code>198.51.100.42</code>). Because only ~4.3 billion IPv4 addresses exist worldwide, ISPs share scarce addresses across many subscribers via NAT and Carrier-Grade NAT (CGNAT).
                            </p>
                        </div>

                        <div className="p-6 rounded-3xl bg-white border-2 border-background-dark shadow-block-sm space-y-3">
                            <span className="inline-block px-2.5 py-1 rounded-full text-4xs font-mono font-black uppercase tracking-wider bg-secondary text-white">
                                IPv6 (Modern Internet)
                            </span>
                            <h3 className="font-bold text-lg text-background-dark">128-Bit Hexadecimal</h3>
                            <p className="text-xs text-background-dark/70 leading-relaxed font-medium">
                                Formatted as eight colon-separated hexadecimal groups (e.g. <code>2001:db8::8a2e:370:7334</code>). Provides end-to-end reachability without address exhaustion, though dual-stack networks must run both IPv4 and IPv6 simultaneously.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Private vs Public CIDR Reference Table */}
                <section className="bg-white border-2 border-background-dark rounded-3xl p-8 shadow-block-sm space-y-4">
                    <h2 className="font-serif text-fluid-h2 font-bold text-background-dark">
                        Public vs. Private IP Ranges (RFC 1918 &amp; CGNAT Reference)
                    </h2>
                    <p className="text-sm text-background-dark/75 leading-relaxed font-medium">
                        If you run <code>ipconfig</code> on Windows or <code>ifconfig</code> on macOS/Linux, you will usually see a private local IP instead of the public address displayed above. Use this reference table to distinguish local router subnets and ISP CGNAT pools from true routable public IPs:
                    </p>
                    <div className="overflow-x-auto border-2 border-background-dark rounded-2xl">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-background-dark text-white uppercase tracking-wider text-4xs">
                                    <th className="p-3.5 font-extrabold">CIDR Range</th>
                                    <th className="p-3.5 font-extrabold">Classification</th>
                                    <th className="p-3.5 font-extrabold">Where You See It</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-background-dark/10">
                                {IP_RANGE_REFERENCE.map((row) => (
                                    <tr key={row.cidr} className="hover:bg-background/30">
                                        <td className="p-3.5 font-mono font-bold text-background-dark whitespace-nowrap">{row.cidr}</td>
                                        <td className="p-3.5 font-bold text-secondary whitespace-nowrap">{row.scope}</td>
                                        <td className="p-3.5 text-background-dark/75 font-medium">{row.usage}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* WebRTC Leak Mitigation Guide */}
                <section className="bg-white border-2 border-background-dark rounded-3xl p-8 shadow-block-sm space-y-4">
                    <h2 className="font-serif text-fluid-h2 font-bold text-background-dark">
                        How to Stop WebRTC IP Leaks Across Browsers
                    </h2>
                    <p className="text-sm text-background-dark/75 leading-relaxed font-medium">
                        If the WebRTC Privacy card above displays an unexpected public IP candidate while you are connected to a VPN, your browser is allowing STUN requests to bypass your encrypted proxy tunnel. Follow these browser steps to lock down WebRTC candidate discovery:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        <div className="p-5 rounded-2xl bg-background-dark/5 border border-background-dark/15 space-y-2">
                            <h3 className="font-bold text-sm text-background-dark">Mozilla Firefox</h3>
                            <p className="text-xs text-background-dark/75 leading-relaxed">
                                Open <code>about:config</code>, search for <code>media.peerconnection.enabled</code>, and toggle it to <code>false</code>—or restrict ICE candidates with <code>media.peerconnection.ice.default_address_only</code>.
                            </p>
                        </div>
                        <div className="p-5 rounded-2xl bg-background-dark/5 border border-background-dark/15 space-y-2">
                            <h3 className="font-bold text-sm text-background-dark">Brave Browser</h3>
                            <p className="text-xs text-background-dark/75 leading-relaxed">
                                Go to <strong>Settings &rarr; Privacy and security &rarr; WebRTC IP handling policy</strong> and choose <strong>Disable non-proxied UDP</strong> so WebRTC respects VPN and proxy routes.
                            </p>
                        </div>
                        <div className="p-5 rounded-2xl bg-background-dark/5 border border-background-dark/15 space-y-2">
                            <h3 className="font-bold text-sm text-background-dark">Chrome &amp; Edge</h3>
                            <p className="text-xs text-background-dark/75 leading-relaxed">
                                Use a native system-level VPN app (WireGuard/OpenVPN) with DNS &amp; IPv6 leak protection rather than a browser-only proxy extension, which cannot trap UDP STUN packets.
                            </p>
                        </div>
                    </div>
                </section>

                {/* SSR-Complete Accessible FAQ Accordion */}
                <DiagnosticFaqSection items={faqs} />

                {/* Related Diagnostics Hub */}
                <section className="pt-8 border-t-2 border-background-dark/10">
                    <h3 className="text-3xs font-extrabold uppercase tracking-widest text-primary mb-4">Explore More Diagnostics</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Link href="/what-is-my-browser" className="p-5 rounded-2xl bg-white border-2 border-background-dark shadow-block-sm hover:translate-x-px hover:translate-y-px transition-all">
                            <Globe size={18} className="text-primary mb-2" aria-hidden="true" />
                            <div className="font-bold text-sm text-background-dark">What Is My Browser</div>
                            <p className="text-3xs text-background-dark/60 mt-1">Check browser engine &amp; UA</p>
                        </Link>
                        <Link href="/what-is-my-screen-resolution" className="p-5 rounded-2xl bg-white border-2 border-background-dark shadow-block-sm hover:translate-x-px hover:translate-y-px transition-all">
                            <Monitor size={18} className="text-secondary mb-2" aria-hidden="true" />
                            <div className="font-bold text-sm text-background-dark">Screen Resolution</div>
                            <p className="text-3xs text-background-dark/60 mt-1">Hardware &amp; viewport dimensions</p>
                        </Link>
                        <Link href="/bufferbloat" className="p-5 rounded-2xl bg-white border-2 border-background-dark shadow-block-sm hover:translate-x-px hover:translate-y-px transition-all">
                            <RefreshCw size={18} className="text-background-dark mb-2" aria-hidden="true" />
                            <div className="font-bold text-sm text-background-dark">Bufferbloat Test</div>
                            <p className="text-3xs text-background-dark/60 mt-1">Test network latency under load</p>
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
