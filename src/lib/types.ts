export type OrderStatus =
  | "new"
  | "confirmed"
  | "printing"
  | "ready"
  | "delivered"
  | "cancelled";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "طلب جديد",
  confirmed: "تم التأكيد",
  printing: "جاري الطباعة",
  ready: "جاهز للتسليم",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

/** الحالات التي لا يمكن للعميل إلغاء الطلب بعدها */
export const LOCKED_STATUSES: OrderStatus[] = ["printing", "ready", "delivered"];

export interface User {
  id: string;
  name: string;
  phone: string;
  password: string;
  isAdmin?: boolean;
  blocked?: boolean;
  createdAt: string;
}

export interface School {
  id: string;
  name: string;
  address: string;
  area: string;
  contact?: string;
  notes?: string;
  active: boolean;
}

export interface Booklet {
  id: string;
  title: string;
  grade: string;
  subject: string;
  pages: number;
  price?: number;
  imageUrl?: string;
  schoolId?: string;
  description?: string;
  active: boolean;
}

export interface Order {
  id: string;
  code: string;
  userId: string;
  userName: string;
  userPhone: string;
  source: "catalog" | "upload";
  bookletTitle: string;
  fileName?: string;
  fileDataUrl?: string;
  pages: number;
  sheets: number;
  copies: number;
  binding: boolean;
  printCost: number;
  bindingCost: number;
  deliveryFee: number;
  total: number;
  schoolId: string;
  studentName: string;
  deliveryMethod: "school" | "home";
  address?: string;
  landmark?: string;
  paymentMethod: "instapay" | "vodafone" | "cash";
  paymentProof?: string;
  status: OrderStatus;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  seenByAdmin: boolean;
}

export interface Settings {
  pricePerSheet: number;
  bindingPrice: number;
  deliveryEnabled: boolean;
  deliveryFee: number;
  instapayEnabled: boolean;
  instapayNumber: string;
  vodafoneEnabled: boolean;
  vodafoneNumber: string;
  cashEnabled: boolean;
  whatsappEnabled: boolean;
  whatsappNumber: string;
  maxUploadMB: number;
  soundEnabled: boolean;
  imgbbApiKey: string;
  brandTagline: string;
}
