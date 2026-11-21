import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bufferbloat Test – Free Latency Under Load & Lag Test",
  description:
    "Test internet latency under load, download bloat & upload bloat in 1 click. Grade your router (A to F) and fix lag in gaming, Discord & Zoom. Free & private.",
  keywords: [
    "bufferbloat test",
    "bufferbloat",
    "what is bufferbloat",
    "how to fix bufferbloat",
    "bufferbloat latency test",
    "network latency under load",
    "loaded latency test",
    "gaming lag test",
    "jitter test",
    "router bufferbloat fix",
    "sqm bufferbloat",
    "cake algorithm router",
    "fq_codel",
    "unloaded vs loaded ping",
    "discord lag test",
    "zoom freezing fix",
    "wifi latency test",
    "packet delay variation",
    "waveform bufferbloat alternative",
    "mysupportdetails bufferbloat",
    "network quality grade",
  ],
  alternates: { canonical: "/bufferbloat" },
  openGraph: {
    type: "website",
    title: "Bufferbloat Test – Free Latency Under Load & Lag Test",
    description:
      "Test internet latency under load, download bloat & upload bloat in 1 click. Grade your router (A to F) and fix lag in gaming, Discord & Zoom. Free & private.",
    url: "/bufferbloat",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "MySupportInfo Bufferbloat Test" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bufferbloat Test – Free Latency Under Load & Lag Test",
    description:
      "Test internet latency under load, download bloat & upload bloat in 1 click. Grade your router (A to F) and fix lag in gaming, Discord & Zoom. Free & private.",
    images: ["/og-image.png"],
  },
};

export default function BufferbloatLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* WebApplication Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "MySupportInfo Bufferbloat Test",
            url: "https://mysupportinfo.com/bufferbloat",
            description:
              "Free online bufferbloat test and network latency diagnostic tool. Measures idle latency, download bloat, upload bloat, and packet jitter to grade home router queue management from A+ to F.",
            applicationCategory: "UtilityApplication",
            operatingSystem: "Any",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            featureList: [
              "Real-time download and upload saturation testing",
              "Unloaded baseline ping vs loaded latency comparison",
              "Bufferbloat score and letter grading (A+ to F)",
              "Live interactive SVG latency and throughput charts",
              "Actionable router configuration guide for SQM, CAKE, and QoS",
              "Zero data logging, 100% browser-based execution",
            ],
            publisher: {
              "@type": "Organization",
              name: "MySupportInfo",
              url: "https://mysupportinfo.com",
            },
          }),
        }}
      />

      {/* BreadcrumbList Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://mysupportinfo.com/",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Bufferbloat Test",
                item: "https://mysupportinfo.com/bufferbloat",
              },
            ],
          }),
        }}
      />

      {/* HowTo Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: "How to Test Your Internet Connection for Bufferbloat and Fix It",
            description:
              "Follow these steps to accurately measure your connection's bufferbloat latency under load and optimize your router settings.",
            step: [
              {
                "@type": "HowToStep",
                position: 1,
                name: "Close background downloads and streams",
                text: "Ensure other devices on your local network are not actively downloading large updates or streaming 4K video to isolate baseline results.",
              },
              {
                "@type": "HowToStep",
                position: 2,
                name: "Run the Bufferbloat Diagnostic Test",
                text: "Click 'Run Test' on the MySupportInfo Bufferbloat page. The engine will measure your idle latency, saturate download and upload pipes, and track real-time ping spikes.",
              },
              {
                "@type": "HowToStep",
                position: 3,
                name: "Analyze your network grade and latency increase",
                text: "Review your letter grade (A+ to F). If your latency spikes by more than 30 ms (Grade C, D, or F), your network suffers from bufferbloat.",
              },
              {
                "@type": "HowToStep",
                position: 4,
                name: "Enable SQM or QoS on your router to eliminate bloat",
                text: "Log into your router admin panel and enable Smart Queue Management (SQM) with CAKE or FQ-CoDel, or set a QoS bandwidth cap at 90-95% of your measured speed.",
              },
            ],
            tool: [
              { "@type": "HowToTool", name: "Web Browser (Chrome, Firefox, Safari, Edge)" },
              { "@type": "HowToTool", name: "Home Router Admin Interface" },
            ],
            totalTime: "PT2M",
          }),
        }}
      />

      {/* FAQPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "What is bufferbloat?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Bufferbloat is high latency and packet delay caused by excessive buffering of network packets inside your router or modem. When large downloads or uploads max out your bandwidth, incoming packets wait in oversized memory buffers instead of being transmitted promptly, leading to massive ping spikes, rubberbanding in games, and stuttering video calls.",
                },
              },
              {
                "@type": "Question",
                name: "Can fast gigabit fiber internet suffer from bufferbloat?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes. Bufferbloat is caused by poor queue management, not low bandwidth. Even on a 1 Gbps or 500 Mbps connection, whenever a game update downloads or cloud backup uploads at maximum speed, unmanaged router buffers fill up, causing round-trip latency to spike from 10 ms to over 200 ms.",
                },
              },
              {
                "@type": "Question",
                name: "What is a good bufferbloat test score?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "An 'A' or 'A+' grade is optimal, representing an increase of 0 to 5 ms under load. A 'B' grade (6 to 30 ms increase) is good and acceptable for casual use. Grades C, D, and F indicate moderate to severe bufferbloat that requires router adjustments such as SQM or QoS bandwidth limits.",
                },
              },
              {
                "@type": "Question",
                name: "How does bufferbloat affect online gaming?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "In competitive gaming (Valorant, CS2, Fortnite, Call of Duty, Apex Legends, Rocket League), game packets are tiny and time-sensitive. When bufferbloat occurs, game packets get stuck behind large file downloads or video streams in your router's queue, resulting in sudden ping spikes, delayed hit registration, and rubberbanding.",
                },
              },
              {
                "@type": "Question",
                name: "How do I fix bufferbloat on my router?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "The most effective fix is enabling Smart Queue Management (SQM) using the CAKE or FQ-CoDel algorithms in your router settings. If your router does not support SQM, configure Quality of Service (QoS) and cap your download and upload bandwidth at 90% to 95% of your actual speed to prevent the modem buffer from overflowing.",
                },
              },
              {
                "@type": "Question",
                name: "Is bufferbloat worse on Wi-Fi than on Ethernet?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes. Wi-Fi introduces half-duplex radio contention, packet retries, and wireless queue buffering on top of your router's internal queues. Connecting your gaming PC or work computer directly via a Cat6 Ethernet cable significantly stabilizes baseline latency, though router-level SQM is still needed for bandwidth saturation.",
                },
              },
              {
                "@type": "Question",
                name: "What is the difference between idle latency and loaded latency?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Idle (unloaded) latency measures ping when no other traffic is moving across your connection. Loaded latency measures ping while your download or upload connection is saturated at full capacity. The difference between loaded and idle latency is the exact measure of your bufferbloat.",
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
