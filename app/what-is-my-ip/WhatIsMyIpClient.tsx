"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, ShieldAlert, Copy, Check, ChevronRight, ArrowRight } from "lucide-react";
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
    { cidr: "10.0.0.0/8", scope: "Private (RFC 1918)", usage: "Corporate LANs, cloud VPCs, enterprise VPN subnets" },
    { cidr: "172.16.0.0/12", scope: "Private (RFC 1918)", usage: "Containers, campus networks, office VLANs" },
    { cidr: "192.168.0.0/16", scope: "Private (RFC 1918)", usage: "Home Wi-Fi routers, printers, smart-home gear" },
    { cidr: "100.64.0.0/10", scope: "Shared CGNAT (RFC 6598)", usage: "Carrier-Grade NAT & mobile data pools" },
    { cidr: "127.0.0.0/8", scope: "Loopback (localhost)", usage: "Internal device self-routing only" },
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

            if (ip.includes(":")) {
                if (ipv6 === "Not Available") ipv6 = ip;
                try {
                    const res4 = await fetch("https://api.ipify.org?format=json");
                    const d4 = await res4.json();
                    ip = d4.ip && !d4.ip.includes(":") ? d4.ip : "Not Available (IPv6-only)";
                } catch {
                    ip = "Not Available (IPv6-only)";
                }
            }

            const vpnKeywords = ["vpn", "mullvad", "nordvpn", "expressvpn", "surfshark", "digitalocean", "cloudflare", "linode", "hetzner"];
            vpnDetected = vpnKeywords.some((k) => ispName.toLowerCase().includes(k));

            setIpData({ ip, ipv6, ispName, city, country, countryCode, vpnDetected });
            setLoading(false);
        };
        fetchIp();
    }, []);

    useEffect(() => {
        const checkWebrtc = async () => {
            try {
                const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
                pc.createDataChannel("");
                const ips = new Set<string>();
                await new Promise<void>((resolve) => {
                    pc.onicecandidate = (e) => {
                        if (!e.candidate) {
                            resolve();
                            return;
                        }
                        const m4 = e.candidate.candidate.match(/\b((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/);
                        if (m4 && !m4[0].startsWith("0.") && !m4[0].startsWith("127.")) ips.add(m4[0]);
                    };
                    pc.createOffer().then((o) => pc.setLocalDescription(o)).catch(() => resolve());
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
        ? [ipData.city, ipData.country].filter(Boolean).join(", ") || "Approximate region unavailable"
        : "Checking ISP and region…";

    return (
        <div className="bg-canvas text-ink pb-20">
            <div className="max-w-site mx-auto px-5 sm:px-6 pt-8 space-y-10">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-muted">
                    <Link href="/" className="hover:text-ink transition-colors">Overview</Link>
                    <ChevronRight size={14} aria-hidden="true" />
                    <span className="text-ink font-semibold" aria-current="page">What Is My IP Address</span>
                </nav>

                <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-secondary">
                        Public IPv4, IPv6 &amp; WebRTC Leak Check
                    </p>
                    <h1 className="text-fluid-hero font-extrabold text-ink tracking-tight leading-tight">
                        What Is My IP Address?
                    </h1>
                    <p className="text-fluid-lead text-muted leading-relaxed max-w-2xl">
                        See the public IP address websites detect for your connection, your Internet provider, and whether WebRTC is exposing another address behind a VPN.
                    </p>
                </div>

                {/* Main Diagnostic Surface */}
                <section className="bg-surface border border-line rounded-2xl shadow-subtle overflow-hidden">
                    <div className="p-6 sm:p-8 border-b border-line flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1.5">
                            <span className="text-xs font-semibold text-muted block">Your Public IPv4 Address</span>
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-3xl sm:text-4xl font-mono font-extrabold text-ink tabular-nums">
                                    {loading ? "Scanning…" : ipData?.ip}
                                </span>
                                {ipData?.countryCode && (
                                    <span className="px-2 py-0.5 rounded bg-well border border-line text-xs font-mono font-bold text-ink">
                                        {ipData.countryCode}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-muted">
                                {ipData ? (
                                    <>
                                        ISP: <strong className="text-ink">{ipData.ispName}</strong> &middot; {locationLabel}
                                    </>
                                ) : (
                                    "Resolving carrier and geolocation in browser memory…"
                                )}
                            </p>
                        </div>

                        <div>
                            <button
                                type="button"
                                onClick={copyIp}
                                disabled={loading}
                                aria-label={copiedIp ? "IPv4 address copied" : "Copy public IPv4 address"}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-foreground font-bold text-xs rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                {copiedIp ? <Check size={14} strokeWidth={2.5} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                                <span>{copiedIp ? "Copied IP" : "Copy IP Address"}</span>
                            </button>
                            <div className="sr-only" role="status" aria-live="polite">
                                {copiedIp && "Public IP address copied to clipboard."}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-line bg-well/30">
                        <div className="p-5 space-y-1">
                            <span className="text-xs font-semibold text-muted block">IPv6 Endpoint</span>
                            <div className="font-mono text-xs font-bold text-ink break-all">
                                {loading ? "Scanning…" : ipData?.ipv6}
                            </div>
                            <span className="text-2xs text-muted block">Dual-stack compatibility</span>
                        </div>

                        <div className="p-5 space-y-1">
                            <span className="text-xs font-semibold text-muted block">WebRTC VPN Privacy</span>
                            <div className="font-semibold text-xs text-secondary inline-flex items-center gap-1.5">
                                <ShieldCheck size={14} aria-hidden="true" />
                                <span>{webrtcLeak}</span>
                            </div>
                            <span className="text-2xs text-muted block">STUN candidate check</span>
                        </div>

                        <div className="p-5 space-y-1">
                            <span className="text-xs font-semibold text-muted block">Network Classification</span>
                            <div className="font-semibold text-xs inline-flex items-center gap-1.5 text-ink">
                                {ipData?.vpnDetected ? (
                                    <ShieldAlert size={14} className="text-amber-500" aria-hidden="true" />
                                ) : (
                                    <ShieldCheck size={14} className="text-secondary" aria-hidden="true" />
                                )}
                                <span>{loading ? "Checking…" : ipData?.vpnDetected ? "VPN / Datacenter Range" : "Residential / Direct ISP"}</span>
                            </div>
                            <span className="text-2xs text-muted block">ASN organization check</span>
                        </div>
                    </div>
                </section>

                {/* Guides & CIDR Reference */}
                <section className="space-y-4">
                    <h2 className="text-fluid-h2 font-bold text-ink">Public IPv4 vs IPv6 &amp; Private Router Ranges</h2>
                    <p className="text-sm text-muted leading-relaxed">
                        Command-line tools like <code className="px-1.5 py-0.5 rounded bg-well border border-line font-mono text-xs text-ink">ipconfig</code> or <code className="px-1.5 py-0.5 rounded bg-well border border-line font-mono text-xs text-ink">ifconfig</code> usually display your home router&apos;s private local address rather than your public internet IP above.
                    </p>
                    <div className="overflow-x-auto bg-surface border border-line rounded-2xl">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-brand text-white">
                                    <th className="p-3.5 font-semibold">CIDR Prefix</th>
                                    <th className="p-3.5 font-semibold">Scope</th>
                                    <th className="p-3.5 font-semibold">Common Usage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {IP_RANGE_REFERENCE.map((row) => (
                                    <tr key={row.cidr} className="hover:bg-hover/65 transition-colors">
                                        <td className="p-3.5 font-mono font-bold text-ink whitespace-nowrap">{row.cidr}</td>
                                        <td className="p-3.5 font-semibold text-secondary whitespace-nowrap">{row.scope}</td>
                                        <td className="p-3.5 text-muted">{row.usage}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* WebRTC Mitigation */}
                <section className="bg-surface border border-line rounded-2xl p-6 sm:p-8 space-y-4">
                    <h2 className="text-fluid-h2 font-bold text-ink">How to Prevent WebRTC IP Leaks</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="p-4 rounded-xl bg-well/40 border border-line space-y-1.5">
                            <h3 className="font-bold text-ink">Mozilla Firefox</h3>
                            <p className="text-muted leading-relaxed">
                                In <code>about:config</code>, restrict STUN exposure via <code>media.peerconnection.ice.default_address_only</code>.
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-well/40 border border-line space-y-1.5">
                            <h3 className="font-bold text-ink">Brave Browser</h3>
                            <p className="text-muted leading-relaxed">
                                Open Privacy settings &rarr; WebRTC IP handling &rarr; select Disable non-proxied UDP.
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-well/40 border border-line space-y-1.5">
                            <h3 className="font-bold text-ink">Chrome &amp; Edge</h3>
                            <p className="text-muted leading-relaxed">
                                Use an OS-level VPN client rather than a browser-only proxy extension to trap UDP traffic.
                            </p>
                        </div>
                    </div>
                </section>

                <DiagnosticFaqSection items={faqs} />

                {/* Cross-links */}
                <section className="pt-6 border-t border-line">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-muted mb-4">Related Diagnostic Tools</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { href: "/what-is-my-browser", title: "What Is My Browser", desc: "Inspect engine version & UA" },
                            { href: "/what-is-my-screen-resolution", title: "Screen Resolution", desc: "Check live viewport & DPR" },
                            { href: "/bufferbloat", title: "Bufferbloat Test", desc: "Test loaded network latency" },
                        ].map((item) => (
                            <Link key={item.href} href={item.href} className="group p-4 rounded-xl bg-surface border border-line hover:border-line-strong transition-colors flex items-center justify-between gap-2">
                                <div>
                                    <div className="font-bold text-sm text-ink group-hover:text-primary transition-colors">{item.title}</div>
                                    <p className="text-xs text-muted mt-0.5">{item.desc}</p>
                                </div>
                                <ArrowRight size={15} className="text-muted group-hover:text-primary transition-colors flex-shrink-0" aria-hidden="true" />
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
