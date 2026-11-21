import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bufferbloat & Device Info FAQ – Latency & Privacy Help",
  description:
    "Expert answers on testing & fixing bufferbloat, router SQM/CAKE settings, browser detection, WebRTC leaks, and our zero-data-logging privacy policy.",
  keywords: [
    "bufferbloat FAQ",
    "what is bufferbloat",
    "how to fix bufferbloat",
    "bufferbloat test questions",
    "router SQM guide",
    "CAKE algorithm router",
    "MySupportInfo privacy",
    "device detection FAQ",
    "WebRTC leak explained",
    "what is my browser FAQ",
    "mysupportdetails comparison",
    "network latency help",
  ],
  alternates: { canonical: "/faq" },
  openGraph: {
    type: "website",
    title: "Bufferbloat & Device Info FAQ – Latency & Privacy Help",
    description:
      "Expert answers on testing & fixing bufferbloat, router SQM/CAKE settings, browser detection, WebRTC leaks, and our zero-data-logging privacy policy.",
    url: "/faq",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "MySupportInfo FAQ" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bufferbloat & Device Info FAQ – Latency & Privacy Help",
    description:
      "Expert answers on testing & fixing bufferbloat, router SQM/CAKE settings, browser detection, WebRTC leaks, and our zero-data-logging privacy policy.",
    images: ["/og-image.png"],
  },
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "What is bufferbloat and why does it cause lag in gaming and video calls?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Bufferbloat is unwanted latency and jitter that occurs when network equipment (such as your home router or modem) buffers too many data packets. When large downloads or uploads saturate your bandwidth, packets sit waiting in oversized memory queues. High-priority, time-sensitive packets—such as competitive gaming keystrokes, Discord voice data, or Zoom video streams—get stuck behind bulk file transfers, causing sudden ping spikes from 20 ms to 200+ ms.",
                },
              },
              {
                "@type": "Question",
                name: "How does the Bufferbloat Test work?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "The test executes a multi-phase diagnostic: First, it measures your clean baseline (idle) round-trip ping. Next, it saturates your downstream pipe to measure download bloat. Then, it saturates your upstream pipe to measure upload bloat. Finally, it calculates the latency delta (how many milliseconds ping increased under load) and awards an official grade from A to F.",
                },
              },
              {
                "@type": "Question",
                name: "What is a good bufferbloat score and how can I fix a poor grade?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "An 'A' or 'A+' grade (0–5 ms increase under load) is ideal for competitive gaming and seamless remote work. A 'B' grade (6–30 ms) is good for everyday use. If you receive a C, D, or F, the #1 fix is enabling Smart Queue Management (SQM) with CAKE or FQ-CoDel in your router settings. Alternatively, set a QoS bandwidth cap at 90%–95% of your plan's maximum line speed, or connect your computer via Cat6 Ethernet instead of Wi-Fi.",
                },
              },
              {
                "@type": "Question",
                name: "Do you store or log my IP address or personal data?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "No. MySupportInfo is engineered with a strict privacy-first architecture. All user-agent parsing, hardware querying, screen resolution detection, and latency calculations happen 100% client-side inside your browser sandbox. We maintain zero database logs, store no IP addresses, use no tracking cookies, and never build cross-session device fingerprints. We are fully GDPR and CCPA compliant by design.",
                },
              },
              {
                "@type": "Question",
                name: "What is a WebRTC leak and how does MySupportInfo detect it?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "WebRTC (Web Real-Time Communication) allows browsers to make direct peer-to-peer audio and video calls. However, WebRTC can query your computer's STUN interfaces and expose your real public or local IP address even if you are connected to a VPN proxy. MySupportInfo runs a local STUN ice-candidate test to verify whether your actual IP address is leaking through your browser.",
                },
              },
              {
                "@type": "Question",
                name: "How do I share my technical diagnostic results with an IT support technician?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "You have two quick options: (1) Click 'Copy All Info' at the top of the homepage to copy a cleanly formatted plain-text diagnostic summary into your clipboard—perfect for pasting into Zendesk, Jira, Freshdesk, email, or GitHub issues. (2) Click 'Download Screenshot Report' to generate a high-resolution PNG summary card directly on your device.",
                },
              },
              {
                "@type": "Question",
                name: "Why does my detected RAM or CPU core count differ from my computer's exact specs?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Modern browsers deliberately restrict hardware reporting to protect user privacy against device fingerprinting. The Device Memory API rounds RAM into privacy buckets (typically capped at 8 GB), and navigator.hardwareConcurrency reports logical hyperthreaded CPU threads rather than physical CPU cores. These values represent the computing capacity accessible to your web browser.",
                },
              },
              {
                "@type": "Question",
                name: "What is the difference between Screen Resolution and Viewport Size?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Screen Resolution represents the physical hardware pixel dimensions of your monitor (e.g. 1920 × 1080 or 3840 × 2160). Viewport Size represents the actual usable pixel area inside your browser window. If you resize your window, use browser zoom (e.g. 125%), or have an OS display scaling factor applied (Device Pixel Ratio / DPR), your viewport size will adjust dynamically while your screen resolution remains fixed.",
                },
              },
              {
                "@type": "Question",
                name: "How does MySupportInfo compare to MySupportDetails and other diagnostic tools?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "While older legacy tools like MySupportDetails provide basic system text, MySupportInfo offers a modern, interactive Neobrutalist design with zero server-side data logging, an integrated real-time Bufferbloat Latency Diagnostic with live SVG charting, WebRTC VPN privacy leak audits, and instant client-side PNG report card exports.",
                },
              },
              {
                "@type": "Question",
                name: "Why does my bufferbloat grade differ from a standard Ookla speed test?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Standard speed tests measure maximum raw throughput (Mbps) under clean, unencumbered conditions. They do not evaluate Quality of Experience (QoE) under congestion. You can have a 1,000 Mbps fiber connection that downloads files blazingly fast, but if your router lacks queue management, your latency can spike to 300 ms whenever someone uploads a file or streams 4K video.",
                },
              },
              {
                "@type": "Question",
                name: "Is MySupportInfo completely free for personal and commercial use?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes, MySupportInfo is 100% free with no account creation, no paywalls, and no subscription requirements. IT technicians, MSP helpdesks, network administrators, remote workers, and gamers can use it freely for diagnostic and support workflows.",
                },
              },
              {
                "@type": "Question",
                name: "Which browsers and operating systems are supported?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "MySupportInfo is fully compatible with all modern web browsers, including Google Chrome, Mozilla Firefox, Apple Safari, Microsoft Edge, Brave, Opera, and Vivaldi across Windows, macOS, Linux, ChromeOS, iOS, iPadOS, and Android.",
                },
              },
            ],
          }),
        }}
      />
      {children}
    </>
  );
}
