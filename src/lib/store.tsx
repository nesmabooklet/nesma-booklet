import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Booklet, Order, OrderStatus, School, Settings, User } from "./types";
import {
  apiGetUsers,
  apiCreateUser,
  apiUpdateUser,
  apiDeleteUser,
  apiGetSchools,
  apiCreateSchool,
  apiUpdateSchool,
  apiDeleteSchool,
  apiGetBooklets,
  apiCreateBooklet,
  apiUpdateBooklet,
  apiDeleteBooklet,
  apiGetOrders,
  apiCreateOrder,
  apiUpdateOrderStatus,
  apiUpdateOrderNote,
  apiMarkOrdersSeen,
  apiCancelOrder,
  apiGetSettings,
  apiUpdateSettings,
} from "./api";

const KEY = "nesma_booklets_v1";

interface DB {
  users: User[];
  schools: School[];
  booklets: Booklet[];
  orders: Order[];
  settings: Settings;
  currentUserId: string | null;
}

const defaultSettings: Settings = {
  pricePerSheet: 0.8,
  bindingPrice: 10,
  deliveryEnabled: true,
  deliveryFee: 25,
  instapayEnabled: true,
  instapayNumber: "nesma@instapay",
  vodafoneEnabled: true,
  vodafoneNumber: "01002194451",
  cashEnabled: true,
  whatsappEnabled: true,
  whatsappNumber: "01002194451",
  maxUploadMB: 50,
  soundEnabled: true,
  imgbbApiKey: "0a4a7b445eb56f88eaf10f278e79fc92",
  brandTagline: "اطبع بوكليت ولادك من غير تعب… واستلمه عند باب المدرسة أو البيت",
};

const seedSchools: School[] = [
  {
    id: "s1",
    name: "مدرسة النيل الدولية",
    address: "٥ شارع الجمهورية، وسط البلد",
    area: "القاهرة",
    contact: "0227001122",
    notes: "التسليم من مكتب الاستقبال قبل ١٢ ظهراً",
    active: true,
  },
  {
    id: "s2",
    name: "مدارس المستقبل الحديثة",
    address: "الحي العاشر، بجوار نادي الشرطة",
    area: "مدينة نصر",
    contact: "0226003344",
    active: true,
  },
  {
    id: "s3",
    name: "مدرسة الأندلس اللغات",
    address: "شارع ٩، المعادي الجديدة",
    area: "المعادي",
    active: true,
  },
];

const seedBooklets: Booklet[] = [
  {
    id: "b1",
    title: "بوكليت مراجعة الرياضيات - الترم الأول",
    grade: "الصف الرابع الابتدائي",
    subject: "رياضيات",
    pages: 64,
    schoolId: "s1",
    description: "مراجعة شاملة بالأسئلة والحلول النموذجية",
    active: true,
  },
  {
    id: "b2",
    title: "بوكليت اللغة العربية - نحو وقراءة",
    grade: "الصف السادس الابتدائي",
    subject: "لغة عربية",
    pages: 48,
    schoolId: "s2",
    active: true,
  },
  {
    id: "b3",
    title: "Science Revision Booklet",
    grade: "الصف الثاني الإعدادي",
    subject: "ساينس",
    pages: 81,
    schoolId: "s3",
    description: "شامل امتحانات السنوات السابقة",
    active: true,
  },
];

function initialDB(): DB {
  return {
    users: [
      {
        id: "admin",
        name: "مدير النظام",
        phone: "01002194451",
        password: "admin1234",
        isAdmin: true,
        createdAt: new Date().toISOString(),
      },
    ],
    schools: seedSchools,
    booklets: seedBooklets,
    orders: [],
    settings: defaultSettings,
    currentUserId: null,
  };
}

function load(): DB {
  if (typeof window === "undefined") return initialDB();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return initialDB();
    const parsed = JSON.parse(raw) as DB;
    return {
      ...initialDB(),
      ...parsed,
      settings: { ...defaultSettings, ...parsed.settings },
    };
  } catch {
    return initialDB();
  }
}

interface Ctx {
  db: DB;
  ready: boolean;
  user: User | null;
  isAdmin: boolean;
  settings: Settings;
  refreshFromCloud: () => Promise<void>;
  login: (
    phone: string,
    password: string,
  ) => { ok: boolean; message?: string; isAdmin?: boolean };
  register: (
    name: string,
    phone: string,
    password: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  addSchool: (s: Omit<School, "id">) => Promise<void>;
  updateSchool: (id: string, patch: Partial<School>) => Promise<void>;
  removeSchool: (id: string) => Promise<void>;
  addBooklet: (b: Omit<Booklet, "id">) => Promise<void>;
  updateBooklet: (id: string, patch: Partial<Booklet>) => Promise<void>;
  removeBooklet: (id: string) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
  adminAddUser: (u: {
    name: string;
    phone: string;
    password: string;
    isAdmin: boolean;
  }) => Promise<{ ok: boolean; message?: string }>;
  setUserAdmin: (id: string, isAdmin: boolean) => Promise<void>;
  setUserBlocked: (id: string, blocked: boolean) => Promise<void>;
  addOrder: (
    o: Omit<Order, "id" | "code" | "createdAt" | "updatedAt" | "status" | "seenByAdmin"> & {
      telegramFileId?: string;
      telegramFileUrl?: string;
    },
  ) => Promise<Order>;
  setOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  setOrderNote: (id: string, note: string) => Promise<void>;
  markOrdersSeen: () => Promise<void>;
  cancelOrder: (id: string) => Promise<{ ok: boolean; message: string }>;
}

const StoreContext = createContext<Ctx | null>(null);

function beep() {
  try {
    const AudioCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtor();
    const play = (freq: number, at: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + at);
      gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + at + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + at);
      osc.stop(ctx.currentTime + at + 0.4);
    };
    play(880, 0);
    play(1320, 0.22);
  } catch {
    /* الصوت غير متاح */
  }
}

export function playNotificationSound() {
  beep();
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(() => load());
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  // مزامنة البيانات من Cloudflare D1
  const refreshFromCloud = useCallback(async () => {
    try {
      const [cloudUsers, cloudSchools, cloudBooklets, cloudOrders, cloudSettings] =
        await Promise.all([
          apiGetUsers(),
          apiGetSchools(),
          apiGetBooklets(),
          apiGetOrders(),
          apiGetSettings(),
        ]);

      setDb((prev) => {
        const next: DB = {
          ...prev,
          users: cloudUsers.length > 0 ? cloudUsers : prev.users,
          schools: cloudSchools.length > 0 ? cloudSchools : prev.schools,
          booklets: cloudBooklets.length > 0 ? cloudBooklets : prev.booklets,
          orders: cloudOrders.length > 0 ? cloudOrders : prev.orders,
          settings: cloudSettings ? { ...prev.settings, ...cloudSettings } : prev.settings,
        };
        if (typeof window !== "undefined") {
          window.localStorage.setItem(KEY, JSON.stringify(next));
        }
        return next;
      });
    } catch (err) {
      console.warn("Could not sync with Cloudflare D1, using local fallback", err);
    }
  }, []);

  useEffect(() => {
    const local = load();
    setDb(local);
    loaded.current = true;
    setReady(true);

    // مزامنة فورية من Cloudflare D1
    refreshFromCloud();

    // تحديث دوري كل 15 ثانية لجلب أي طلبات جديدة
    const timer = setInterval(() => {
      refreshFromCloud();
    }, 15000);

    return () => clearInterval(timer);
  }, [refreshFromCloud]);

  useEffect(() => {
    if (!loaded.current) return;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(KEY, JSON.stringify(db));
    }
  }, [db]);

  const user = useMemo(
    () => db.users.find((u) => u.id === db.currentUserId) ?? null,
    [db.users, db.currentUserId],
  );

  const patch = useCallback((fn: (d: DB) => DB) => setDb((d) => fn(d)), []);

  const value: Ctx = useMemo(
    () => ({
      db,
      ready,
      user,
      isAdmin: !!user?.isAdmin,
      settings: db.settings,
      refreshFromCloud,
      login: (phone, password) => {
        const found = db.users.find((u) => u.phone === phone.trim());
        if (!found) return { ok: false, message: "رقم التليفون غير مسجل لدينا" };
        if (found.password !== password) return { ok: false, message: "كلمة السر غير صحيحة" };
        if (found.blocked)
          return { ok: false, message: "الحساب ده محظور، تواصل مع الدعم من فضلك" };
        patch((d) => ({ ...d, currentUserId: found.id }));
        return { ok: true, isAdmin: !!found.isAdmin };
      },
      register: async (name, phone, password) => {
        const cleanName = name.trim().replace(/\s+/g, " ");
        const cleanPhone = phone.trim();
        if (db.users.some((u) => u.phone === cleanPhone))
          return { ok: false, message: "رقم التليفون ده مسجل قبل كده" };
        if (db.users.some((u) => u.name.trim() === cleanName))
          return { ok: false, message: "الاسم ده مستخدم قبل كده، غيّره شوية" };
        
        const u = await apiCreateUser({
          name: cleanName,
          phone: cleanPhone,
          password,
          isAdmin: false,
          blocked: false,
        });

        if (u) {
          patch((d) => ({ ...d, users: [...d.users, u], currentUserId: u.id }));
          return { ok: true };
        }
        return { ok: false, message: "تعذر إنشاء الحساب، يرجى المحاولة مرة أخرى" };
      },
      logout: () => patch((d) => ({ ...d, currentUserId: null })),
      updateSettings: async (p) => {
        const nextSettings = { ...db.settings, ...p };
        patch((d) => ({ ...d, settings: nextSettings }));
        await apiUpdateSettings(nextSettings);
      },
      addSchool: async (s) => {
        const created = await apiCreateSchool(s);
        patch((d) => ({ ...d, schools: [...d.schools, created] }));
      },
      updateSchool: async (id, p) => {
        patch((d) => ({
          ...d,
          schools: d.schools.map((s) => (s.id === id ? { ...s, ...p } : s)),
        }));
        await apiUpdateSchool(id, p);
      },
      removeSchool: async (id) => {
        patch((d) => ({ ...d, schools: d.schools.filter((s) => s.id !== id) }));
        await apiDeleteSchool(id);
      },
      addBooklet: async (b) => {
        const created = await apiCreateBooklet(b);
        patch((d) => ({ ...d, booklets: [...d.booklets, created] }));
      },
      updateBooklet: async (id, p) => {
        patch((d) => ({
          ...d,
          booklets: d.booklets.map((b) => (b.id === id ? { ...b, ...p } : b)),
        }));
        await apiUpdateBooklet(id, p);
      },
      removeBooklet: async (id) => {
        patch((d) => ({ ...d, booklets: d.booklets.filter((b) => b.id !== id) }));
        await apiDeleteBooklet(id);
      },
      removeUser: async (id) => {
        patch((d) => ({
          ...d,
          users: d.users.filter((u) => u.id !== id),
          currentUserId: d.currentUserId === id ? null : d.currentUserId,
        }));
        await apiDeleteUser(id);
      },
      adminAddUser: async ({ name, phone, password, isAdmin }) => {
        const cleanName = name.trim().replace(/\s+/g, " ");
        const cleanPhone = phone.trim();
        if (cleanName.length < 3) return { ok: false, message: "اكتب اسم المستخدم بالكامل" };
        if (!isValidEgyptPhone(cleanPhone))
          return { ok: false, message: "رقم التليفون لازم يكون ١١ رقم مصري صحيح" };
        if (password.length < 4) return { ok: false, message: "كلمة السر ٤ أرقام أو أكتر" };
        if (db.users.some((u) => u.phone === cleanPhone))
          return { ok: false, message: "رقم التليفون ده مسجل قبل كده" };
        if (db.users.some((u) => u.name.trim() === cleanName))
          return { ok: false, message: "الاسم ده مستخدم قبل كده" };
        
        const created = await apiCreateUser({
          name: cleanName,
          phone: cleanPhone,
          password,
          isAdmin,
          blocked: false,
        });

        if (created) {
          patch((d) => ({ ...d, users: [...d.users, created] }));
          return { ok: true };
        }
        return { ok: false, message: "تعذر إضافة المستخدم" };
      },
      setUserAdmin: async (id, isAdmin) => {
        patch((d) => ({
          ...d,
          users: d.users.map((u) => (u.id === id ? { ...u, isAdmin } : u)),
        }));
        await apiUpdateUser(id, { isAdmin });
      },
      setUserBlocked: async (id, blocked) => {
        patch((d) => ({
          ...d,
          users: d.users.map((u) => (u.id === id ? { ...u, blocked } : u)),
          currentUserId: blocked && d.currentUserId === id ? null : d.currentUserId,
        }));
        await apiUpdateUser(id, { blocked });
      },
      addOrder: async (o) => {
        const order = await apiCreateOrder(o);
        patch((d) => ({ ...d, orders: [order, ...d.orders] }));
        return order;
      },
      setOrderStatus: async (id, status) => {
        patch((d) => ({
          ...d,
          orders: d.orders.map((o) =>
            o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o,
          ),
        }));
        await apiUpdateOrderStatus(id, status);
      },
      setOrderNote: async (id, note) => {
        patch((d) => ({
          ...d,
          orders: d.orders.map((o) => (o.id === id ? { ...o, adminNote: note } : o)),
        }));
        await apiUpdateOrderNote(id, note);
      },
      markOrdersSeen: async () => {
        patch((d) => ({ ...d, orders: d.orders.map((o) => ({ ...o, seenByAdmin: true })) }));
        await apiMarkOrdersSeen();
      },
      cancelOrder: async (id) => {
        const res = await apiCancelOrder(id);
        if (res.ok) {
          patch((d) => ({
            ...d,
            orders: d.orders.map((o) =>
              o.id === id
                ? { ...o, status: "cancelled" as OrderStatus, updatedAt: new Date().toISOString() }
                : o,
            ),
          }));
        }
        return res;
      },
    }),
    [db, ready, user, patch, refreshFromCloud],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export const EGP = (n: number) =>
  `${n.toLocaleString("ar-EG", { maximumFractionDigits: 2 })} ج.م`;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("ar-EG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const isValidEgyptPhone = (p: string) => /^01[0125][0-9]{8}$/.test(p.trim());
