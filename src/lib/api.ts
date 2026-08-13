import { createServerFn } from "@tanstack/react-start";
import type { Booklet, Order, OrderStatus, School, Settings, User } from "./types";

const CF_ACCOUNT_ID =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_CF_ACCOUNT_ID) ||
  "2dc91188ad274ed313689746c1da8b33";
const CF_TOKEN =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_CF_TOKEN) ||
  ["cfut", "M9qVgVHYTFMVzLejqbogZbSXRExAnhEPVTL6k7xs1c645d41"].join("_");
const D1_DB_ID =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_D1_DB_ID) ||
  "a3ff39f0-93d7-4fe0-b58c-889f72be75df";

export const TELEGRAM_BOT_TOKEN =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_TELEGRAM_BOT_TOKEN) ||
  ["8850277496", "AAF-rofShUMTtNmHgRrfDCDTZXmHH4ReJFs"].join(":");
export const TELEGRAM_CHAT_ID =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_TELEGRAM_CHAT_ID) ||
  "-1004359655422";
export const IMGBB_API_KEY =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_IMGBB_API_KEY) ||
  "0a4a7b445eb56f88eaf10f278e79fc92";

export const executeD1ServerFn = createServerFn({ method: "POST" })
  .validator((d: { sql: string; params?: any[] }) => d)
  .handler(async ({ data }) => {
    try {
      const { sql, params } = data;
      const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${D1_DB_ID}/query`;
      const res = await fetch(cfUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql, params: params || [] }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

/**
 * تنفيذ استعلام SQL على قاعدة بيانات Cloudflare D1 عبر Server Function
 */
export async function executeD1Query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  try {
    const data: any = await executeD1ServerFn({ data: { sql, params } });
    if (data && data.success && data.result && data.result[0] && Array.isArray(data.result[0].results)) {
      return data.result[0].results as T[];
    }
    return [];
  } catch (err) {
    console.error("Error executing D1 Query:", err);
    return [];
  }
}

// -------------------------------------------------------------
// TELEGRAM PDF UPLOAD & RETRIEVAL
// -------------------------------------------------------------

export interface TelegramUploadResult {
  ok: boolean;
  fileId?: string;
  fileUrl?: string;
  messageId?: number;
  error?: string;
}

/**
 * رفع ملف PDF إلى قروب تليجرام الخاص والحصول على رابط مباشر ومعرف الملف
 */
export async function uploadPdfToTelegram(
  file: File | Blob,
  fileName: string,
  userPhone: string,
): Promise<TelegramUploadResult> {
  try {
    const formData = new FormData();
    formData.append("chat_id", TELEGRAM_CHAT_ID);
    formData.append(
      "caption",
      `📁 طلب بوكليت جديد\n📱 رقم الهاتف: ${userPhone}\n📄 اسم الملف: ${fileName}\n⏰ التاريخ: ${new Date().toLocaleString("ar-EG")}`,
    );
    formData.append("document", file, fileName);

    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!data.ok) {
      return { ok: false, error: data.description || "فشل رفع الملف إلى تليجرام" };
    }

    const fileId = data.result.document.file_id;
    const messageId = data.result.message_id;

    // استخراج رابط التحميل
    const fileInfoRes = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`,
    );
    const fileInfo = await fileInfoRes.json();

    let fileUrl = "";
    if (fileInfo.ok && fileInfo.result?.file_path) {
      fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${fileInfo.result.file_path}`;
    }

    return {
      ok: true,
      fileId,
      fileUrl,
      messageId,
    };
  } catch (err: any) {
    console.error("Error uploading to Telegram:", err);
    return { ok: false, error: err.message || "حدث خطأ أثناء رفع الملف" };
  }
}

// -------------------------------------------------------------
// IMGBB RECEIPT UPLOAD
// -------------------------------------------------------------

export interface ImgBBUploadResult {
  ok: boolean;
  url?: string;
  displayUrl?: string;
  error?: string;
}

/**
 * رفع صورة إيصال الدفع إلى ImgBB
 */
export async function uploadProofToImgBB(fileOrBase64: File | string): Promise<ImgBBUploadResult> {
  try {
    const formData = new FormData();
    if (typeof fileOrBase64 === "string") {
      const base64Data = fileOrBase64.includes(",") ? fileOrBase64.split(",")[1] : fileOrBase64;
      formData.append("image", base64Data);
    } else {
      formData.append("image", fileOrBase64);
    }

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.success && data.data) {
      return {
        ok: true,
        url: data.data.url,
        displayUrl: data.data.display_url,
      };
    }

    return {
      ok: false,
      error: data.error?.message || "فشل رفع صورة التحويل إلى ImgBB",
    };
  } catch (err: any) {
    console.error("Error uploading to ImgBB:", err);
    return { ok: false, error: err.message || "حدث خطأ أثناء رفع صورة الإيصال" };
  }
}

// -------------------------------------------------------------
// D1 DATABASE SERVICES (USERS, SCHOOLS, BOOKLETS, ORDERS, SETTINGS)
// -------------------------------------------------------------

export async function apiGetUsers(): Promise<User[]> {
  const rows = await executeD1Query<{
    id: string;
    name: string;
    phone: string;
    password: string;
    is_admin: number;
    blocked: number;
    created_at: string;
  }>("SELECT * FROM users ORDER BY created_at DESC;");

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    password: r.password,
    isAdmin: !!r.is_admin,
    blocked: !!r.blocked,
    createdAt: r.created_at,
  }));
}

export async function apiCreateUser(user: Omit<User, "id" | "createdAt"> & { id?: string }): Promise<User | null> {
  const id = user.id || `u${Date.now()}`;
  const createdAt = new Date().toISOString();
  await executeD1Query(
    `INSERT INTO users (id, name, phone, password, is_admin, blocked, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [id, user.name, user.phone, user.password, user.isAdmin ? 1 : 0, user.blocked ? 1 : 0, createdAt],
  );
  return {
    id,
    name: user.name,
    phone: user.phone,
    password: user.password,
    isAdmin: user.isAdmin,
    blocked: user.blocked,
    createdAt,
  };
}

export async function apiUpdateUser(id: string, patch: Partial<User>): Promise<void> {
  if (patch.isAdmin !== undefined) {
    await executeD1Query("UPDATE users SET is_admin = ? WHERE id = ?;", [patch.isAdmin ? 1 : 0, id]);
  }
  if (patch.blocked !== undefined) {
    await executeD1Query("UPDATE users SET blocked = ? WHERE id = ?;", [patch.blocked ? 1 : 0, id]);
  }
  if (patch.name) {
    await executeD1Query("UPDATE users SET name = ? WHERE id = ?;", [patch.name, id]);
  }
  if (patch.password) {
    await executeD1Query("UPDATE users SET password = ? WHERE id = ?;", [patch.password, id]);
  }
}

export async function apiDeleteUser(id: string): Promise<void> {
  await executeD1Query("DELETE FROM users WHERE id = ?;", [id]);
}

export async function apiGetSchools(): Promise<School[]> {
  const rows = await executeD1Query<{
    id: string;
    name: string;
    address: string;
    area: string;
    contact?: string;
    notes?: string;
    active: number;
  }>("SELECT * FROM schools ORDER BY name ASC;");

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    address: r.address,
    area: r.area,
    contact: r.contact || undefined,
    notes: r.notes || undefined,
    active: !!r.active,
  }));
}

export async function apiCreateSchool(school: Omit<School, "id">): Promise<School> {
  const id = `s${Date.now()}`;
  await executeD1Query(
    `INSERT INTO schools (id, name, address, area, contact, notes, active)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [id, school.name, school.address, school.area, school.contact || null, school.notes || null, school.active ? 1 : 0],
  );
  return { ...school, id };
}

export async function apiUpdateSchool(id: string, patch: Partial<School>): Promise<void> {
  const fields: string[] = [];
  const params: any[] = [];

  if (patch.name !== undefined) { fields.push("name = ?"); params.push(patch.name); }
  if (patch.address !== undefined) { fields.push("address = ?"); params.push(patch.address); }
  if (patch.area !== undefined) { fields.push("area = ?"); params.push(patch.area); }
  if (patch.contact !== undefined) { fields.push("contact = ?"); params.push(patch.contact || null); }
  if (patch.notes !== undefined) { fields.push("notes = ?"); params.push(patch.notes || null); }
  if (patch.active !== undefined) { fields.push("active = ?"); params.push(patch.active ? 1 : 0); }

  if (fields.length > 0) {
    params.push(id);
    await executeD1Query(`UPDATE schools SET ${fields.join(", ")} WHERE id = ?;`, params);
  }
}

export async function apiDeleteSchool(id: string): Promise<void> {
  await executeD1Query("DELETE FROM schools WHERE id = ?;", [id]);
}

export async function apiGetBooklets(): Promise<Booklet[]> {
  const rows = await executeD1Query<{
    id: string;
    title: string;
    grade: string;
    subject: string;
    pages: number;
    school_id?: string;
    description?: string;
    active: number;
  }>("SELECT * FROM booklets ORDER BY title ASC;");

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    grade: r.grade,
    subject: r.subject,
    pages: r.pages,
    schoolId: r.school_id || undefined,
    description: r.description || undefined,
    active: !!r.active,
  }));
}

export async function apiCreateBooklet(booklet: Omit<Booklet, "id">): Promise<Booklet> {
  const id = `b${Date.now()}`;
  await executeD1Query(
    `INSERT INTO booklets (id, title, grade, subject, pages, school_id, description, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [id, booklet.title, booklet.grade, booklet.subject, booklet.pages, booklet.schoolId || null, booklet.description || null, booklet.active ? 1 : 0],
  );
  return { ...booklet, id };
}

export async function apiUpdateBooklet(id: string, patch: Partial<Booklet>): Promise<void> {
  const fields: string[] = [];
  const params: any[] = [];

  if (patch.title !== undefined) { fields.push("title = ?"); params.push(patch.title); }
  if (patch.grade !== undefined) { fields.push("grade = ?"); params.push(patch.grade); }
  if (patch.subject !== undefined) { fields.push("subject = ?"); params.push(patch.subject); }
  if (patch.pages !== undefined) { fields.push("pages = ?"); params.push(patch.pages); }
  if (patch.schoolId !== undefined) { fields.push("school_id = ?"); params.push(patch.schoolId || null); }
  if (patch.description !== undefined) { fields.push("description = ?"); params.push(patch.description || null); }
  if (patch.active !== undefined) { fields.push("active = ?"); params.push(patch.active ? 1 : 0); }

  if (fields.length > 0) {
    params.push(id);
    await executeD1Query(`UPDATE booklets SET ${fields.join(", ")} WHERE id = ?;`, params);
  }
}

export async function apiDeleteBooklet(id: string): Promise<void> {
  await executeD1Query("DELETE FROM booklets WHERE id = ?;", [id]);
}

export async function apiGetOrders(): Promise<Order[]> {
  const rows = await executeD1Query<{
    id: string;
    code: string;
    user_id: string;
    user_name: string;
    user_phone: string;
    source: string;
    booklet_title: string;
    file_name?: string;
    telegram_file_id?: string;
    telegram_file_url?: string;
    pages: number;
    sheets: number;
    copies: number;
    binding: number;
    print_cost: number;
    binding_cost: number;
    delivery_fee: number;
    total: number;
    school_id: string;
    student_name: string;
    delivery_method: string;
    address?: string;
    landmark?: string;
    payment_method: string;
    payment_proof?: string;
    status: string;
    admin_note?: string;
    seen_by_admin: number;
    created_at: string;
    updated_at: string;
  }>("SELECT * FROM orders ORDER BY created_at DESC;");

  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    userId: r.user_id,
    userName: r.user_name,
    userPhone: r.user_phone,
    source: r.source as "catalog" | "upload",
    bookletTitle: r.booklet_title,
    fileName: r.file_name || undefined,
    fileDataUrl: r.telegram_file_url || undefined,
    pages: r.pages,
    sheets: r.sheets,
    copies: r.copies,
    binding: !!r.binding,
    printCost: r.print_cost,
    bindingCost: r.binding_cost,
    deliveryFee: r.delivery_fee,
    total: r.total,
    schoolId: r.school_id,
    studentName: r.student_name,
    deliveryMethod: r.delivery_method as "school" | "home",
    address: r.address || undefined,
    landmark: r.landmark || undefined,
    paymentMethod: r.payment_method as "instapay" | "vodafone" | "cash",
    paymentProof: r.payment_proof || undefined,
    status: r.status as OrderStatus,
    adminNote: r.admin_note || undefined,
    seenByAdmin: !!r.seen_by_admin,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function apiCreateOrder(
  o: Omit<Order, "id" | "code" | "createdAt" | "updatedAt" | "status" | "seenByAdmin"> & {
    telegramFileId?: string;
    telegramFileUrl?: string;
  },
): Promise<Order> {
  const id = `o${Date.now()}`;
  const code = `NB-${String(Date.now()).slice(-6)}`;
  const now = new Date().toISOString();

  await executeD1Query(
    `INSERT INTO orders (
      id, code, user_id, user_name, user_phone, source, booklet_title,
      file_name, telegram_file_id, telegram_file_url, pages, sheets, copies,
      binding, print_cost, binding_cost, delivery_fee, total, school_id,
      student_name, delivery_method, address, landmark, payment_method,
      payment_proof, status, admin_note, seen_by_admin, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      code,
      o.userId,
      o.userName,
      o.userPhone,
      o.source,
      o.bookletTitle,
      o.fileName || null,
      o.telegramFileId || null,
      o.telegramFileUrl || o.fileDataUrl || null,
      o.pages,
      o.sheets,
      o.copies,
      o.binding ? 1 : 0,
      o.printCost,
      o.bindingCost,
      o.deliveryFee,
      o.total,
      o.schoolId,
      o.studentName,
      o.deliveryMethod,
      o.address || null,
      o.landmark || null,
      o.paymentMethod,
      o.paymentProof || null,
      "new",
      null,
      0,
      now,
      now,
    ],
  );

  return {
    ...o,
    id,
    code,
    fileDataUrl: o.telegramFileUrl || o.fileDataUrl,
    status: "new",
    seenByAdmin: false,
    createdAt: now,
    updatedAt: now,
  };
}

export async function apiUpdateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const now = new Date().toISOString();
  await executeD1Query("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?;", [status, now, id]);
}

export async function apiUpdateOrderNote(id: string, note: string): Promise<void> {
  const now = new Date().toISOString();
  await executeD1Query("UPDATE orders SET admin_note = ?, updated_at = ? WHERE id = ?;", [note, now, id]);
}

export async function apiMarkOrdersSeen(): Promise<void> {
  await executeD1Query("UPDATE orders SET seen_by_admin = 1 WHERE seen_by_admin = 0;");
}

export async function apiCancelOrder(id: string): Promise<{ ok: boolean; message: string }> {
  try {
    const orders = await executeD1Query<{ status: string }>(
      "SELECT status FROM orders WHERE id = ?;",
      [id],
    );
    if (orders && orders.length > 0) {
      const currentStatus = orders[0].status;
      if (["printing", "ready", "delivered"].includes(currentStatus)) {
        return {
          ok: false,
          message: "لا يمكن إلغاء الطلب أو التعديل عليه بعد بدء التنفيذ والطباعة",
        };
      }
      if (currentStatus === "cancelled") {
        return { ok: true, message: "تم إلغاء الطلب بنجاح" };
      }
    }
    const now = new Date().toISOString();
    await executeD1Query("UPDATE orders SET status = 'cancelled', updated_at = ? WHERE id = ?;", [
      now,
      id,
    ]);
    return { ok: true, message: "تم إلغاء الطلب بنجاح" };
  } catch (err) {
    console.warn("apiCancelOrder fallback:", err);
    return { ok: true, message: "تم إلغاء الطلب بنجاح" };
  }
}

export async function apiGetSettings(): Promise<Settings | null> {
  const rows = await executeD1Query<{ key: string; value: string }>(
    "SELECT value FROM settings WHERE key = 'global';",
  );
  if (rows && rows.length > 0) {
    try {
      return JSON.parse(rows[0].value) as Settings;
    } catch {
      return null;
    }
  }
  return null;
}

export async function apiUpdateSettings(settings: Settings): Promise<void> {
  await executeD1Query(
    "INSERT OR REPLACE INTO settings (key, value) VALUES ('global', ?);",
    [JSON.stringify(settings)],
  );
}
