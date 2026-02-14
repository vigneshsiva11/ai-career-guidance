#!/usr/bin/env tsx

// Syllabus PDF Ingestion Script with OCR/Text extraction

import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import { contentManagementService } from "../lib/content-management-service";
import { ocrService } from "../lib/ocr-service";

type Chunk = {
  text: string;
  metadata: {
    subject: string;
    grade: number;
    chapter: string;
    language?: string;
    isSyllabus: boolean;
    board?: string;
  };
};

function chunkText(text: string, maxChars = 1200): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + maxChars, text.length);
    chunks.push(text.slice(start, end));
    start = end;
  }
  return chunks.filter((t) => t.trim().length > 0);
}

async function extractPdfText(filePath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  if (data.text && data.text.trim().length > 50) return data.text;
  // Fallback to OCR via images is omitted; for scanned PDFs, users can convert pages to images and use OCR
  return data.text || "";
}

function inferMetaFromPath(
  filePath: string,
  defaults: { board?: string; language?: string }
): {
  subject: string;
  grade: number;
  chapter: string;
  board?: string;
  language?: string;
} {
  const lower = filePath.toLowerCase();
  const board = defaults.board;
  const language = defaults.language || "en";
  const gradeMatch = lower.match(/class[-_\s]?([1-9]|1[0-2])/);
  const grade = gradeMatch ? parseInt(gradeMatch[1], 10) : 10;
  const subjects = [
    "mathematics",
    "math",
    "science",
    "physics",
    "chemistry",
    "biology",
    "english",
    "history",
    "geography",
    "computer",
    "social",
  ];
  let subject = subjects.find((s) => lower.includes(s)) || "science";
  if (subject === "math") subject = "mathematics";
  const chapter = path.basename(filePath).replace(/\.(pdf|png|jpg|jpeg)$/i, "");
  return { subject, grade, chapter, board, language };
}

async function ingestPdf(
  filePath: string,
  defaults: { board?: string; language?: string }
) {
  const meta = inferMetaFromPath(filePath, defaults);
  let text = await extractPdfText(filePath);
  if (!text || text.trim().length < 20) {
    // Try OCR on images only if the file is an image
    if (/(png|jpg|jpeg)$/i.test(filePath)) {
      const dataUrl =
        "data:image/" +
        path.extname(filePath).slice(1) +
        ";base64," +
        fs.readFileSync(filePath).toString("base64");
      const res = await ocrService.extractTextFromImage(
        dataUrl,
        meta.language || "en"
      );
      text = res.text;
    }
  }
  const chunks = chunkText(text);
  const payload: Chunk[] = chunks.map((t) => ({
    text: t,
    metadata: {
      subject: meta.subject,
      grade: meta.grade,
      chapter: meta.chapter,
      language: meta.language,
      isSyllabus: true,
      board: meta.board,
    },
  }));
  if (payload.length) {
    await contentManagementService.addMultipleContent(payload);
    console.log(
      `✅ Ingested ${payload.length} chunks from ${path.basename(filePath)}`
    );
  } else {
    console.warn(`⚠️ No text extracted from ${filePath}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log(
      "Usage: tsx scripts/ingest-syllabus-pdfs.ts <file-or-dir> [--board=cbse|icse|state] [--language=en|hi|...]"
    );
    process.exit(1);
  }
  const target = args[0];
  const boardArg = args.find((a) => a.startsWith("--board="));
  const languageArg = args.find((a) => a.startsWith("--language="));
  const defaults = {
    board: boardArg?.split("=")[1],
    language: languageArg?.split("=")[1],
  };

  await contentManagementService.initialize();

  const stat = fs.statSync(target);
  if (stat.isDirectory()) {
    const files = fs
      .readdirSync(target)
      .filter((f) => /\.(pdf|png|jpg|jpeg)$/i.test(f));
    for (const f of files) {
      await ingestPdf(path.join(target, f), defaults);
    }
  } else {
    await ingestPdf(target, defaults);
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error("❌ Ingestion failed:", e);
    process.exit(1);
  });
}
