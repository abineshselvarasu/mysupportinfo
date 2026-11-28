import type { PDFFont, PDFDocument } from "pdf-lib";

export interface DiagnosticPdfItem {
    label: string;
    value: string;
    isCode?: boolean;
}

export interface DiagnosticPdfGroup {
    title: string;
    items: DiagnosticPdfItem[];
}

export interface DiagnosticPdfReport {
    generatedAt: string;
    isMaskedPii: boolean;
    kpis: { label: string; value: string }[];
    groups: DiagnosticPdfGroup[];
}

interface FontByteCache {
    sansRegular?: Uint8Array;
    sansBold?: Uint8Array;
    sansExtraBold?: Uint8Array;
    monoRegular?: Uint8Array;
}

const fontCache: FontByteCache = {};

async function loadFontBytes(url: string): Promise<Uint8Array | undefined> {
    try {
        const res = await fetch(url, { cache: "force-cache" });
        if (!res.ok) return undefined;
        return new Uint8Array(await res.arrayBuffer());
    } catch {
        return undefined;
    }
}

async function ensureWebsiteFontBytes(): Promise<FontByteCache> {
    if (!fontCache.sansRegular) {
        fontCache.sansRegular = await loadFontBytes("/fonts/PlusJakartaSans-Regular.ttf");
    }
    if (!fontCache.sansBold) {
        fontCache.sansBold = await loadFontBytes("/fonts/PlusJakartaSans-Bold.ttf");
    }
    if (!fontCache.sansExtraBold) {
        fontCache.sansExtraBold = await loadFontBytes("/fonts/PlusJakartaSans-ExtraBold.ttf");
    }
    if (!fontCache.monoRegular) {
        fontCache.monoRegular = await loadFontBytes("/fonts/JetBrainsMono-Regular.ttf");
    }
    return fontCache;
}

interface LoadedPdfFonts {
    sans: PDFFont;
    bold: PDFFont;
    extraBold: PDFFont;
    mono: PDFFont;
    sets: {
        sans: Set<number>;
        bold: Set<number>;
        extraBold: Set<number>;
        mono: Set<number>;
    };
}

function sanitizeForFont(raw: string, supported: Set<number>): string {
    let out = "";
    for (const ch of raw || "") {
        const cp = ch.codePointAt(0) ?? 32;
        if (supported.has(cp)) {
            out += ch;
        } else if (ch === "\u2014" || ch === "\u2013") {
            out += "-";
        } else if (ch === "\u2026") {
            out += "...";
        } else if (ch === "\u2713") {
            out += supported.has(0x2713) ? ch : "OK";
        } else if (ch === "\u00D7") {
            out += supported.has(0x00d7) ? ch : "x";
        } else if (ch === "\u00B7") {
            out += supported.has(0x00b7) ? ch : ".";
        } else {
            out += " ";
        }
    }
    return out;
}

function wrapText(raw: string, font: PDFFont, supported: Set<number>, fontSize: number, maxWidth: number): string[] {
    const clean = sanitizeForFont(raw, supported).trim();
    if (!clean) return [""];

    const measure = (txt: string) => font.widthOfTextAtSize(txt, fontSize);
    const lines: string[] = [];

    const pushLongToken = (token: string) => {
        let cur = "";
        for (const ch of token) {
            const candidate = cur + ch;
            if (cur && measure(candidate) > maxWidth) {
                lines.push(cur);
                cur = ch;
            } else {
                cur = candidate;
            }
        }
        return cur;
    };

    let current = "";
    for (const word of clean.split(/\s+/)) {
        const candidate = current ? `${current} ${word}` : word;
        if (measure(candidate) <= maxWidth) {
            current = candidate;
        } else {
            if (current) lines.push(current);
            current = measure(word) <= maxWidth ? word : pushLongToken(word);
        }
    }
    if (current) lines.push(current);
    return lines.length > 0 ? lines : [""];
}

interface ComputedRow {
    item: DiagnosticPdfItem;
    labelLines: string[];
    valueLines: string[];
    height: number;
    boxHeight?: number;
}

interface ComputedGroup {
    title: string;
    rows: ComputedRow[];
    height: number;
}

/**
 * Generates a native selectable-text single-page PDF using the website's own
 * Plus Jakarta Sans and JetBrains Mono TrueType fonts embedded directly as subsets.
 */
export async function generateDiagnosticPDFBytes(report: DiagnosticPdfReport): Promise<Uint8Array> {
    const [{ PDFDocument, StandardFonts, rgb }, fontkitMod] = await Promise.all([
        import("pdf-lib"),
        import("@pdf-lib/fontkit"),
    ]);

    const pdfDoc: PDFDocument = await PDFDocument.create();
    const fontkitInstance = fontkitMod.default || fontkitMod;
    pdfDoc.registerFontkit(fontkitInstance as Parameters<PDFDocument["registerFontkit"]>[0]);

    const bytes = await ensureWebsiteFontBytes();
    const sans = bytes.sansRegular
        ? await pdfDoc.embedFont(bytes.sansRegular, { subset: true })
        : await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = bytes.sansBold
        ? await pdfDoc.embedFont(bytes.sansBold, { subset: true })
        : await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const extraBold = bytes.sansExtraBold
        ? await pdfDoc.embedFont(bytes.sansExtraBold, { subset: true })
        : bold;
    const mono = bytes.monoRegular
        ? await pdfDoc.embedFont(bytes.monoRegular, { subset: true })
        : await pdfDoc.embedFont(StandardFonts.Courier);

    const fonts: LoadedPdfFonts = {
        sans,
        bold,
        extraBold,
        mono,
        sets: {
            sans: new Set(sans.getCharacterSet()),
            bold: new Set(bold.getCharacterSet()),
            extraBold: new Set(extraBold.getCharacterSet()),
            mono: new Set(mono.getCharacterSet()),
        },
    };

    const pageWidth = 842;
    const margin = 24;
    const cardX = margin;
    const cardW = pageWidth - margin * 2; // 794pt
    const colW = cardW / 2; // 397pt
    const padX = 20;
    const labelMaxW = 148;
    const valMaxW = colW - padX * 2 - labelMaxW - 14; // ~195pt
    const codeBoxMaxW = colW - padX * 2 - 16;

    const headerH = 62;
    const kpiH = 46;
    const footerH = 34;

    const leftRaw = report.groups.filter((_, idx) => idx % 2 === 0);
    const rightRaw = report.groups.filter((_, idx) => idx % 2 === 1);

    const measureGroup = (g: DiagnosticPdfGroup): ComputedGroup => {
        let h = 16 + 18;
        const rows: ComputedRow[] = g.items.map((item) => {
            if (item.isCode) {
                const labelLines = wrapText(item.label, fonts.sans, fonts.sets.sans, 8.5, colW - padX * 2);
                const valueLines = wrapText(item.value || "N/A", fonts.mono, fonts.sets.mono, 7.6, codeBoxMaxW);
                const boxHeight = valueLines.length * 10.8 + 11;
                const rowH = labelLines.length * 11 + 4 + boxHeight + 10;
                h += rowH;
                return { item, labelLines, valueLines, height: rowH, boxHeight };
            }
            const labelLines = wrapText(item.label, fonts.sans, fonts.sets.sans, 8.5, labelMaxW);
            const valueLines = wrapText(item.value || "N/A", fonts.bold, fonts.sets.bold, 8.5, valMaxW);
            const rowH = Math.max(labelLines.length * 11, valueLines.length * 11.5) + 7.5;
            h += rowH;
            return { item, labelLines, valueLines, height: rowH };
        });
        h += 12;
        return { title: g.title.toUpperCase(), rows, height: h };
    };

    const leftGroups = leftRaw.map(measureGroup);
    const rightGroups = rightRaw.map(measureGroup);

    const leftHeight = leftGroups.reduce((acc, g) => acc + g.height, 0);
    const rightHeight = rightGroups.reduce((acc, g) => acc + g.height, 0);
    const bodyH = Math.max(leftHeight, rightHeight, 120);
    const cardH = headerH + kpiH + bodyH + footerH;
    const pageHeight = Math.ceil(margin * 2 + cardH);

    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const py = (yTop: number) => pageHeight - yTop;

    const cCanvas = rgb(0.98, 0.965, 0.941);
    const cWhite = rgb(1, 1, 1);
    const cWell = rgb(0.953, 0.937, 0.902);
    const cCode = rgb(0.961, 0.949, 0.922);
    const cLine = rgb(0.835, 0.875, 0.855);
    const cBrand = rgb(0, 0.278, 0.243);
    const cPrimary = rgb(1, 0.557, 0.376);
    const cAccent = rgb(1, 0.769, 0.718);
    const cSecondary = rgb(0, 0.62, 0.322);
    const cInk = rgb(0.055, 0.106, 0.086);
    const cMuted = rgb(0.31, 0.388, 0.357);
    const cMint = rgb(0.431, 0.906, 0.718);
    const cSep = rgb(0.6, 0.74, 0.71);
    const cHeaderSub = rgb(0.84, 0.9, 0.88);

    const drawRectTop = (
        x: number,
        yTop: number,
        w: number,
        h: number,
        fill?: ReturnType<typeof rgb>,
        borderColor?: ReturnType<typeof rgb>,
        borderWidth = 0.8
    ) => {
        page.drawRectangle({
            x,
            y: py(yTop + h),
            width: w,
            height: h,
            color: fill,
            borderColor,
            borderWidth: borderColor ? borderWidth : 0,
        });
    };

    const drawLineTop = (x1: number, yTop1: number, x2: number, yTop2: number, color = cLine, thickness = 0.7) => {
        page.drawLine({
            start: { x: x1, y: py(yTop1) },
            end: { x: x2, y: py(yTop2) },
            color,
            thickness,
        });
    };

    const drawTextTop = (
        txt: string,
        x: number,
        yTopBaseline: number,
        font: PDFFont,
        supported: Set<number>,
        size: number,
        color: ReturnType<typeof rgb>
    ) => {
        const clean = sanitizeForFont(txt, supported);
        page.drawText(clean, { x, y: py(yTopBaseline), font, size, color });
    };

    // Canvas & white card body
    drawRectTop(0, 0, pageWidth, pageHeight, cCanvas);
    const cardTop = margin;
    drawRectTop(cardX, cardTop, cardW, cardH, cWhite);

    // Emerald header
    drawRectTop(cardX, cardTop, cardW, headerH, cBrand);
    let hx = cardX + padX;
    const hTitleY = cardTop + 26;

    const logoPart1 = sanitizeForFont("MySupport", fonts.sets.extraBold);
    drawTextTop(logoPart1, hx, hTitleY, fonts.extraBold, fonts.sets.extraBold, 16, cWhite);
    hx += fonts.extraBold.widthOfTextAtSize(logoPart1, 16);

    const logoPart2 = sanitizeForFont("Info", fonts.sets.extraBold);
    drawTextTop(logoPart2, hx, hTitleY, fonts.extraBold, fonts.sets.extraBold, 16, cPrimary);
    hx += fonts.extraBold.widthOfTextAtSize(logoPart2, 16) + 9;

    drawTextTop("|", hx, hTitleY - 1, fonts.sans, fonts.sets.sans, 11, cSep);
    hx += fonts.sans.widthOfTextAtSize("|", 11) + 9;

    const badgeText = sanitizeForFont("OFFICIAL DEVICE REPORT", fonts.sets.bold);
    drawTextTop(badgeText, hx, hTitleY - 1, fonts.bold, fonts.sets.bold, 9, cAccent);
    hx += fonts.bold.widthOfTextAtSize(badgeText, 9);

    if (report.isMaskedPii) {
        hx += 9;
        drawTextTop("|", hx, hTitleY - 1, fonts.sans, fonts.sets.sans, 11, cSep);
        hx += fonts.sans.widthOfTextAtSize("|", 11) + 9;
        drawTextTop("IP MASKED", hx, hTitleY - 1, fonts.bold, fonts.sets.bold, 9, cMint);
    }

    drawTextTop(
        "Client-side diagnostic snapshot generated in browser memory at https://mysupportinfo.com",
        cardX + padX,
        cardTop + 44,
        fonts.sans,
        fonts.sets.sans,
        8.5,
        cHeaderSub
    );

    const cleanTs = sanitizeForFont(report.generatedAt, fonts.sets.mono);
    const tsW = fonts.mono.widthOfTextAtSize(cleanTs, 8.2);
    drawTextTop(cleanTs, cardX + cardW - padX - tsW, cardTop + 31, fonts.mono, fonts.sets.mono, 8.2, cAccent);

    // 4-Column KPI Summary Strip
    const kpiTop = cardTop + headerH;
    drawRectTop(cardX, kpiTop, cardW, kpiH, cWell);
    drawLineTop(cardX, kpiTop + kpiH, cardX + cardW, kpiTop + kpiH, cLine);

    const kpis = report.kpis.slice(0, 4);
    const kpiW = cardW / Math.max(kpis.length, 1);
    kpis.forEach((kpi, idx) => {
        const kx = cardX + idx * kpiW;
        if (idx > 0) drawLineTop(kx, kpiTop, kx, kpiTop + kpiH, cLine);
        drawTextTop(kpi.label, kx + 16, kpiTop + 17, fonts.sans, fonts.sets.sans, 8, cMuted);
        const maxKpiW = kpiW - 28;
        let kVal = sanitizeForFont(kpi.value || "-", fonts.sets.bold);
        while (kVal.length > 3 && fonts.bold.widthOfTextAtSize(kVal, 9.5) > maxKpiW) {
            kVal = `${kVal.slice(0, -4)}...`;
        }
        drawTextTop(kVal, kx + 16, kpiTop + 33, fonts.bold, fonts.sets.bold, 9.5, cInk);
    });

    // 2-Column Body
    const bodyTop = kpiTop + kpiH;
    const footerTop = bodyTop + bodyH;
    drawLineTop(cardX + colW, bodyTop, cardX + colW, footerTop, cLine);

    const renderColumn = (groups: ComputedGroup[], colX: number) => {
        let curY = bodyTop;
        groups.forEach((group, gIdx) => {
            if (gIdx > 0) drawLineTop(colX, curY, colX + colW, curY, cLine);
            let rowY = curY + 20;
            drawTextTop(group.title, colX + padX, rowY, fonts.bold, fonts.sets.bold, 8.5, cSecondary);
            drawLineTop(colX + padX, rowY + 5, colX + colW - padX, rowY + 5, cLine, 0.55);
            rowY += 18;

            for (const row of group.rows) {
                if (row.item.isCode && row.boxHeight) {
                    row.labelLines.forEach((line, lIdx) => {
                        drawTextTop(line, colX + padX, rowY + lIdx * 11, fonts.sans, fonts.sets.sans, 8.5, cMuted);
                    });
                    const boxTop = rowY + row.labelLines.length * 11 - 4;
                    drawRectTop(colX + padX, boxTop, colW - padX * 2, row.boxHeight, cCode, cLine, 0.65);
                    row.valueLines.forEach((line, vIdx) => {
                        drawTextTop(
                            line,
                            colX + padX + 8,
                            boxTop + 11.5 + vIdx * 10.8,
                            fonts.mono,
                            fonts.sets.mono,
                            7.6,
                            cInk
                        );
                    });
                    rowY += row.height;
                } else {
                    row.labelLines.forEach((line, lIdx) => {
                        drawTextTop(line, colX + padX, rowY + lIdx * 11, fonts.sans, fonts.sets.sans, 8.5, cMuted);
                    });
                    row.valueLines.forEach((line, vIdx) => {
                        const w = fonts.bold.widthOfTextAtSize(line, 8.5);
                        drawTextTop(
                            line,
                            colX + colW - padX - w,
                            rowY + vIdx * 11.5,
                            fonts.bold,
                            fonts.sets.bold,
                            8.5,
                            cInk
                        );
                    });
                    rowY += row.height;
                }
            }
            curY += group.height;
        });
    };

    renderColumn(leftGroups, cardX);
    renderColumn(rightGroups, cardX + colW);

    // Footer + Card Outer Border
    drawRectTop(cardX, footerTop, cardW, footerH, cWell);
    drawLineTop(cardX, footerTop, cardX + cardW, footerTop, cLine);
    drawTextTop(
        "Verified In-Browser \u00B7 Zero Database Logs \u00B7 Selectable Vector Diagnostic Report",
        cardX + padX,
        footerTop + 20,
        fonts.sans,
        fonts.sets.sans,
        8.5,
        cMuted
    );
    const domainClean = sanitizeForFont("mysupportinfo.com", fonts.sets.bold);
    const domainW = fonts.bold.widthOfTextAtSize(domainClean, 8.5);
    drawTextTop(
        domainClean,
        cardX + cardW - padX - domainW,
        footerTop + 20,
        fonts.bold,
        fonts.sets.bold,
        8.5,
        cInk
    );
    drawRectTop(cardX, cardTop, cardW, cardH, undefined, cLine, 1);

    pdfDoc.setTitle("MySupportInfo Official Device Report");
    pdfDoc.setCreator("MySupportInfo (https://mysupportinfo.com)");
    pdfDoc.setProducer("MySupportInfo Client-Side PDF Export");

    return pdfDoc.save();
}

/**
 * Generates and triggers a browser download of a selectable-text PDF using
 * the website's own Plus Jakarta Sans & JetBrains Mono fonts.
 */
export async function downloadDiagnosticPDF(report: DiagnosticPdfReport, filename?: string): Promise<void> {
    if (typeof window === "undefined") return;
    const pdfBytes = await generateDiagnosticPDFBytes(report);
    const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = filename || `mysupportinfo-diagnostic-report-${dateStr}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
