"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
    Wifi, Globe, ShieldCheck, ShieldAlert, Copy, Check,
    RefreshCw, Monitor
} from "lucide-react";

interface IpDetails {
    ip: string;
    ipv6: string;
    ispName: string;
    city: string;
    country: string;
    countryCode: string;
    vpnDetected: boolean;
}

export default function WhatIsMyIpClient() {
    const [ipData, setIpData] = useState<IpDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [webrtcLeak, setWebrtcLeak] = useState<string>("Scanning…");
    const [copiedIp, setCopiedIp] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

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

    return (
        <div className="min-h-screen bg-background text-foreground font-sans pb-24">
            {/* Breadcrumb Navigation */}
            <div className="max-w-site mx-auto px-6 pt-6">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-3xs font-extrabold uppercase tracking-widest text-background-dark/50">
                    <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                    <span>/</span>
                    <span className="text-primary font-bold">What Is My IP</span>
                </nav>
            </div>

            {/* Hero Header */}
            <div className="text-center px-6 pt-8 pb-10 max-w-3xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/15 border border-secondary/25 text-secondary text-3xs font-extrabold uppercase tracking-wider mb-4">
                    <Wifi size={13} />
                    <span>Live IP &amp; Network Lookup</span>
                </div>
                <h1 className="font-serif text-fluid-h1 font-bold text-background-dark leading-tight mb-4">
                    What Is My IP Address?
                </h1>
                <p className="text-fluid-lead text-background-dark/70 font-medium leading-relaxed">
                    Instantly identify your public IPv4, IPv6, Internet Service Provider, approximate geolocation, and WebRTC privacy posture.
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
                                Provided by <span className="font-bold text-background-dark">{ipData?.ispName || "ISP"}</span> &middot; Located in <span className="font-bold text-background-dark">{[ipData?.city, ipData?.country].filter(Boolean).join(", ") || "Location unknown"}</span>
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
                                <ShieldCheck size={14} />
                                {webrtcLeak}
                            </span>
                            <span className="text-5xs text-background-dark/50 block mt-1">VPN Tunnel Protection</span>
                        </div>

                        <div className="p-4 rounded-2xl bg-background-dark/5 border border-background-dark/10">
                            <span className="text-4xs uppercase tracking-wider font-bold text-background-dark/60 block mb-1">
                                VPN / Proxy Status
                            </span>
                            <span className={`font-bold text-xs flex items-center gap-1.5 ${ipData?.vpnDetected ? "text-yellow-600" : "text-background-dark"}`}>
                                {ipData?.vpnDetected ? <ShieldAlert size={14} /> : <ShieldCheck size={14} className="text-secondary" />}
                                {ipData?.vpnDetected ? "VPN Detected" : "Direct Connection"}
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
                        What is an IP Address and Why Does It Matter?
                    </h2>
                    <p className="text-fluid-body text-background-dark/80 leading-relaxed font-medium">
                        Your <strong>IP (Internet Protocol) address</strong> is a unique numerical address that identifies your device or local router on the global internet. Just like a physical mailing address directs letters to your home, an IP address tells web servers where to send web pages, video streams, and API requests.
                    </p>
                    <p className="text-fluid-body text-background-dark/80 leading-relaxed font-medium">
                        Whenever you connect to the internet, your Internet Service Provider (ISP) assigns you a public IP address from their registered Autonomous System Number (ASN) pool.
                    </p>
                </section>

                {/* IPv4 vs IPv6 */}
                <section className="space-y-6">
                    <h2 className="font-serif text-fluid-h2 font-bold text-background-dark">
                        IPv4 vs. IPv6: The Dual-Stack Internet
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="p-6 rounded-3xl bg-white border-2 border-background-dark shadow-block-sm space-y-3">
                            <span className="inline-block px-2.5 py-1 rounded-full text-4xs font-mono font-black uppercase tracking-wider bg-primary text-background-dark">
                                IPv4 (Legacy Standard)
                            </span>
                            <h3 className="font-bold text-lg text-background-dark">32-Bit Numerical System</h3>
                            <p className="text-xs text-background-dark/70 leading-relaxed font-medium">
                                Formatted as 4 numbers separated by dots (e.g. <code>198.51.100.42</code>). With only 4.3 billion total addresses, IPv4 exhaustion forced networks to rely heavily on NAT (Network Address Translation).
                            </p>
                        </div>

                        <div className="p-6 rounded-3xl bg-white border-2 border-background-dark shadow-block-sm space-y-3">
                            <span className="inline-block px-2.5 py-1 rounded-full text-4xs font-mono font-black uppercase tracking-wider bg-secondary text-white">
                                IPv6 (Next Generation)
                            </span>
                            <h3 className="font-bold text-lg text-background-dark">128-Bit Hexadecimal System</h3>
                            <p className="text-xs text-background-dark/70 leading-relaxed font-medium">
                                Formatted as 8 groups of hexadecimal digits separated by colons (e.g. <code>2001:db8::8a2e:370:7334</code>). Provides 340 undecillion addresses, eliminating the need for complex NAT routing.
                            </p>
                        </div>
                    </div>
                </section>

                {/* FAQ Accordion */}
                <section className="space-y-4">
                    <h2 className="font-serif text-fluid-h2 font-bold text-background-dark">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-3">
                        {[
                            {
                                q: "Can someone find my physical home address from my IP?",
                                a: "No. IP geolocation databases only map an IP to an ISP exchange hub, city, or postal region. They do not contain individual customer names or physical street addresses."
                            },
                            {
                                q: "How do I hide or change my IP address?",
                                a: "You can change your public IP address by connecting to a Virtual Private Network (VPN), using an encrypted proxy, or restarting your home router (if your ISP provides dynamic IP assignments)."
                            },
                            {
                                q: "What is a WebRTC leak?",
                                a: "WebRTC (Web Real-Time Communication) is an HTML5 technology used for in-browser video calls. Sometimes, WebRTC queries the local network adapter directly, which can expose your real home IP address even when a VPN is turned on."
                            }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-white border-2 border-background-dark rounded-2xl overflow-hidden shadow-block-sm">
                                <button
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                    className="w-full p-5 text-left flex justify-between items-center gap-4 hover:bg-background/20 transition-colors cursor-pointer"
                                >
                                    <span className="font-bold text-background-dark text-base">{item.q}</span>
                                    <span className={`material-symbols-outlined text-background-dark/60 transition-transform duration-200 ${openFaq === idx ? "rotate-180 text-primary" : ""}`}>
                                        expand_more
                                    </span>
                                </button>
                                {openFaq === idx && (
                                    <div className="px-5 pb-5 pt-1 text-sm text-background-dark/75 leading-relaxed font-medium border-t border-background-dark/10">
                                        {item.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Related Diagnostics Hub */}
                <section className="pt-8 border-t-2 border-background-dark/10">
                    <h3 className="text-3xs font-extrabold uppercase tracking-widest text-primary mb-4">Explore More Diagnostics</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Link href="/what-is-my-browser" className="p-5 rounded-2xl bg-white border-2 border-background-dark shadow-block-sm hover:translate-x-px hover:translate-y-px transition-all">
                            <Globe size={18} className="text-primary mb-2" />
                            <div className="font-bold text-sm text-background-dark">What Is My Browser</div>
                            <p className="text-3xs text-background-dark/60 mt-1">Check browser engine &amp; UA</p>
                        </Link>
                        <Link href="/what-is-my-screen-resolution" className="p-5 rounded-2xl bg-white border-2 border-background-dark shadow-block-sm hover:translate-x-px hover:translate-y-px transition-all">
                            <Monitor size={18} className="text-secondary mb-2" />
                            <div className="font-bold text-sm text-background-dark">Screen Resolution</div>
                            <p className="text-3xs text-background-dark/60 mt-1">Hardware &amp; viewport dimensions</p>
                        </Link>
                        <Link href="/bufferbloat" className="p-5 rounded-2xl bg-white border-2 border-background-dark shadow-block-sm hover:translate-x-px hover:translate-y-px transition-all">
                            <RefreshCw size={18} className="text-background-dark mb-2" />
                            <div className="font-bold text-sm text-background-dark">Bufferbloat Test</div>
                            <p className="text-3xs text-background-dark/60 mt-1">Test network latency under load</p>
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
