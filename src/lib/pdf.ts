import { PDFDocument } from "pdf-lib";

export interface PdfInfo {
  pages: number;
  encrypted: boolean;
  error?: string;
}

/** يقرأ عدد صفحات ملف PDF ويكتشف إن كان محمياً بكلمة سر (بدون أي سيرفر) */
export async function readPdf(file: File): Promise<PdfInfo> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: false });
    return { pages: doc.getPageCount(), encrypted: false };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/encrypt/i.test(msg)) {
      return { pages: 0, encrypted: true };
    }
    return { pages: 0, encrypted: false, error: "تعذّر قراءة الملف، تأكد أنه ملف PDF سليم." };
  }
}

/** عدد الأوراق الفعلية للطباعة: كل ورقة = وجهين (صفحتين PDF) */
export function sheetsFromPages(pages: number) {
  return Math.ceil(pages / 2);
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("فشل قراءة الملف"));
    reader.readAsDataURL(file);
  });
}
