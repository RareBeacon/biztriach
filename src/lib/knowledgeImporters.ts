export type SupportedFileType = "pdf" | "docx" | "xlsx" | "csv" | "pptx" | "txt" | "md" | "image";

export function detectFileType(fileName: string): SupportedFileType | null {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (["pdf"].includes(ext)) return "pdf";
  if (["docx", "doc"].includes(ext)) return "docx";
  if (["xlsx", "xls"].includes(ext)) return "xlsx";
  if (["csv"].includes(ext)) return "csv";
  if (["pptx", "ppt"].includes(ext)) return "pptx";
  if (["txt"].includes(ext)) return "txt";
  if (["md", "markdown"].includes(ext)) return "md";
  if (["jpg", "jpeg", "png", "webp"].includes(ext)) return "image";
  return null;
}

export async function extractFromSpreadsheet(buffer: Buffer, fileType: "xlsx" | "csv"): Promise<string> {
  try {
    if (fileType === "csv") {
      const text = buffer.toString("utf-8");
      const lines = text.split("\n").filter(l => l.trim());
      const headers = lines[0]?.split(",").map(h => h.trim()) || [];
      const rows = lines.slice(1, 50).map(line => {
        const vals = line.split(",");
        return headers.map((h, i) => `${h}: ${vals[i] || ""}`).join(", ");
      });
      return `Spreadsheet CSV Data:\nHeaders: ${headers.join(", ")}\n\nRows:\n${rows.join("\n")}`;
    }
    if (fileType === "xlsx") {
      try {
        const XLSXMod = await import("xlsx");
        const XLSX: any = (XLSXMod as any).default || XLSXMod;
        const workbook = XLSX.read(buffer, { type: "buffer" });
        let fullText = "";
        for (const sheetName of workbook.SheetNames.slice(0, 5)) {
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][];
          fullText += `\n\nSheet: ${sheetName}\n`;
          for (const row of json.slice(0, 100)) {
            if (row.some((c: any) => String(c).trim())) {
              fullText += row.join(" | ") + "\n";
            }
          }
        }
        return fullText.trim() || "Excel file appears empty";
      } catch {
        return buffer.toString("utf-8").slice(0, 10000);
      }
    }
  } catch (e) {
    throw new Error("Failed to extract spreadsheet content");
  }
  return "";
}

export async function extractFromPptx(buffer: Buffer): Promise<string> {
  try {
    try {
      const JSZipMod = await import("jszip");
      const JSZip: any = (JSZipMod as any).default || JSZipMod;
      const zip = await JSZip.loadAsync(buffer);
      let text = "";
      const slideFiles = Object.keys(zip.files).filter((f: string) => f.startsWith("ppt/slides/slide"));
      for (const slideFile of slideFiles.slice(0, 30)) {
        const content = await zip.files[slideFile].async("string");
        const matches = Array.from(content.matchAll(/<a:t>([^<]+)<\/a:t>/g));
        for (const m of matches as any) text += m[1] + " ";
        text += "\n\n";
      }
      return text.trim() || "PowerPoint processed but no text found";
    } catch {
      return "PowerPoint extraction requires additional processing. Export as PDF for best results.";
    }
  } catch {
    return "Failed to extract PowerPoint content";
  }
}

export async function extractFromImage(buffer: Buffer): Promise<string> {
  return `[Image Upload Detected - Size: ${(buffer.length / 1024).toFixed(1)}KB]\nQueued for OCR. Please also upload text description for immediate training.`;
}

export async function extractMultiSourceText(buffer: Buffer, fileName: string): Promise<string> {
  const type = detectFileType(fileName);
  if (!type) throw new Error(`Unsupported file type for ${fileName}`);
  switch (type) {
    case "pdf":
    case "docx":
    case "txt":
    case "md": {
      const { extractTextFromFile } = await import("./rag");
      return extractTextFromFile(buffer, type === "docx" ? "docx" : type === "pdf" ? "pdf" : "txt");
    }
    case "xlsx":
    case "csv":
      return extractFromSpreadsheet(buffer, type);
    case "pptx":
      return extractFromPptx(buffer);
    case "image":
      return extractFromImage(buffer);
    default:
      return buffer.toString("utf-8").slice(0, 20000);
  }
}

export async function crawlWebsite(url: string, maxPages = 10): Promise<{ url: string; title: string; content: string }[]> {
  const results: { url: string; title: string; content: string }[] = [];
  try {
    const res = await fetch(url, { headers: { "User-Agent": "BiztriachBot/1.0" } });
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    const html = await res.text();
    let text = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<nav[\s\S]*?<\/nav>/gi, "").replace(/<header[\s\S]*?<\/header>/gi, "").replace(/<footer[\s\S]*?<\/footer>/gi, "");
    const titleMatch = text.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : url;
    const mainMatch = text.match(/<main[^>]*>([\s\S]*?)<\/main>/i) || text.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (mainMatch) text = mainMatch[1];
    text = text.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim().slice(0, 15000);
    results.push({ url, title, content: text });
  } catch (e) {
    throw new Error(`Website crawl failed: ${(e as Error).message}`);
  }
  return results;
}
