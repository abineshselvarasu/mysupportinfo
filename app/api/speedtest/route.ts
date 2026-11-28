export const runtime = "edge";

const CHUNK_SIZE = 65536; // 64 KB
const RANDOM_CHUNK = (() => {
    const buf = new Uint8Array(CHUNK_SIZE);
    let seed = 0x5f3759df;
    for (let i = 0; i < buf.length; i++) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        buf[i] = (seed >>> 24) & 0xff;
    }
    return buf;
})();

const NO_STORE_HEADERS = {
    "Cache-Control": "no-store, no-cache, must-revalidate, no-transform",
};

/**
 * First-party edge diagnostic endpoint used by BufferbloatEngine for live
 * RTT ping probes and uncached download/upload throughput saturation.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "ping";

    if (mode === "ping") {
        return new Response("ok", {
            status: 200,
            headers: {
                ...NO_STORE_HEADERS,
                "Content-Type": "text/plain; charset=utf-8",
            },
        });
    }

    const requested = Number.parseInt(searchParams.get("size") || "", 10);
    const totalBytes = Number.isFinite(requested)
        ? Math.min(Math.max(requested, CHUNK_SIZE), 4 * 1024 * 1024)
        : 1024 * 1024;

    let sent = 0;
    const stream = new ReadableStream<Uint8Array>({
        pull(controller) {
            if (sent >= totalBytes) {
                controller.close();
                return;
            }
            const remaining = totalBytes - sent;
            const slice = remaining >= CHUNK_SIZE ? RANDOM_CHUNK : RANDOM_CHUNK.subarray(0, remaining);
            sent += slice.byteLength;
            controller.enqueue(slice);
        },
    });

    return new Response(stream, {
        status: 200,
        headers: {
            ...NO_STORE_HEADERS,
            "Content-Type": "application/octet-stream",
            "Content-Length": String(totalBytes),
        },
    });
}

export async function POST(request: Request) {
    let received = 0;
    try {
        const reader = request.body?.getReader();
        if (reader) {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                received += value?.byteLength ?? 0;
            }
        }
    } catch {
        // Request cancelled cleanly by client timeout/abort
    }

    return Response.json(
        { received },
        {
            status: 200,
            headers: NO_STORE_HEADERS,
        }
    );
}
