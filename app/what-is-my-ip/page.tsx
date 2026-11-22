import type { Metadata } from "next";
import WhatIsMyIpClient from "./WhatIsMyIpClient";

export const metadata: Metadata = {
    title: "What Is My IP Address? Check Public IPv4, IPv6 & Location",
    description: "Check what is my IP address: discover your public IPv4, IPv6, ISP provider, approximate city location, and WebRTC privacy leaks live with zero tracking.",
    keywords: [
        "what is my ip",
        "what is my ip address",
        "my ip address",
        "check my ip",
        "public ip lookup",
        "ipv6 test online",
        "what is my isp",
        "webrtc leak check"
    ],
    alternates: {
        canonical: "/what-is-my-ip",
    },
    openGraph: {
        title: "What Is My IP Address? Check Public IPv4, IPv6 & Location",
        description: "Check your public IPv4, IPv6, ISP, and location live in your browser. 100% private with zero data logging.",
        url: "/what-is-my-ip",
    },
};

export default function WhatIsMyIpPage() {
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
                                "name": "What is an IP address?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "An IP (Internet Protocol) address is a unique numerical label assigned to every device connected to a computer network. Your public IP is assigned by your Internet Service Provider (ISP) and identifies your internet connection to websites and servers."
                                }
                            },
                            {
                                "@type": "Question",
                                "name": "What is the difference between IPv4 and IPv6?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "IPv4 uses 32-bit addresses formatted as four decimal numbers separated by dots (e.g. 192.0.2.1), providing ~4.3 billion addresses. IPv6 uses 128-bit addresses formatted as hexadecimal colons (e.g. 2001:db8::1), providing virtually unlimited addresses to accommodate all modern devices."
                                }
                            },
                            {
                                "@type": "Question",
                                "name": "Can websites see my exact home address from my IP?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "No. IP geolocation only identifies your approximate city, region, and ISP routing hub. It cannot pinpoint your physical street address or apartment number unless requested by law enforcement via your ISP."
                                }
                            }
                        ]
                    })
                }}
            />
            <WhatIsMyIpClient />
        </>
    );
}
