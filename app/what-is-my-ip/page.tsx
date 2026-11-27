import type { Metadata } from "next";
import WhatIsMyIpClient from "./WhatIsMyIpClient";
import type { DiagnosticFaqItem } from "@/components/ui/DiagnosticFaqSection";
import { buildToolJsonLd } from "@/lib/seo-schema";

export const metadata: Metadata = {
    title: "What Is My IP Address? Check Public IPv4, IPv6 & Location",
    description:
        "Check what is my IP address: discover your public IPv4, IPv6, ISP provider, ASN routing info, approximate city location, and WebRTC privacy leaks live with zero tracking.",
    keywords: [
        "what is my ip",
        "what is my ip address",
        "my ip address",
        "check my ip",
        "public ip lookup",
        "ipv6 test online",
        "what is my isp",
        "webrtc leak check",
        "cgnat ip check",
    ],
    alternates: {
        canonical: "/what-is-my-ip",
    },
    openGraph: {
        title: "What Is My IP Address? Check Public IPv4, IPv6 & Location",
        description:
            "Check your public IPv4, IPv6, ISP, and WebRTC leak posture live in your browser. 100% private with zero data logging.",
        url: "/what-is-my-ip",
    },
};

const ipFaqs: DiagnosticFaqItem[] = [
    {
        q: "What is an IP address and who assigns it?",
        a: "An IP (Internet Protocol) address is a unique numerical label assigned to your network router or cellular device by your Internet Service Provider (ISP). Websites use your public IP address as the return destination to route web pages, video streams, and API responses back to you.",
    },
    {
        q: "What is the difference between IPv4 and IPv6?",
        a: "IPv4 uses 32-bit addresses formatted as four decimal octets separated by dots (for example, 192.0.2.1), supporting roughly 4.3 billion addresses. IPv6 uses 128-bit hexadecimal blocks separated by colons (for example, 2001:db8::1), providing virtually unlimited address space and eliminating multi-layer NAT bottlenecks.",
    },
    {
        q: "Can websites find my exact street address from my public IP?",
        a: "No. Commercial IP geolocation databases only map an IP block to your ISP's regional routing exchange, city, or postal area. They cannot reveal your apartment number, street address, or personal identity—only your ISP holds subscriber billing records.",
    },
    {
        q: "Why does my router show a 192.168.x.x or 10.x.x.x IP instead of my public IP?",
        a: "Addresses in 192.168.0.0/16, 10.0.0.0/8, and 172.16.0.0/12 are private RFC 1918 local-network addresses used inside your home or office Wi-Fi. Your router performs Network Address Translation (NAT) to share one public ISP IP across all devices on your local network.",
    },
    {
        q: "What is a WebRTC leak and how do I stop it when using a VPN?",
        a: "WebRTC enables browser voice and video calls by negotiating peer-to-peer ICE candidates via STUN servers, which can bypass a browser proxy or poorly configured VPN tunnel and reveal your true public or LAN IP. You can mitigate WebRTC leaks by enabling WebRTC IP handling protection in Firefox (media.peerconnection.enabled) or Brave Shields, or enabling full-tunnel kill switches in your VPN client.",
    },
];

export default function WhatIsMyIpPage() {
    const schemas = buildToolJsonLd({
        name: "MySupportInfo — What Is My IP Address & WebRTC Leak Checker",
        description:
            "Free in-browser public IPv4, IPv6, ISP, geolocation, and WebRTC leak checker with zero database logging.",
        path: "/what-is-my-ip",
        breadcrumbLabel: "What Is My IP",
        featureList: [
            "Real-time public IPv4 and IPv6 address lookup",
            "ISP organization and regional geolocation detection",
            "Client-side WebRTC STUN ICE candidate leak audit",
            "Heuristic VPN and hosting ASN check",
        ],
        faqs: ipFaqs,
    });

    return (
        <>
            {schemas.map((schema, i) => (
                <script
                    key={i}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
                />
            ))}
            <WhatIsMyIpClient faqs={ipFaqs} />
        </>
    );
}
