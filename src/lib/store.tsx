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
  apiGetFolders,
  apiCreateFolder,
  apiUpdateFolder,
  apiDeleteFolder,
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

const KEY = "track_booklets_v1";

interface DB {
  users: User[];
  schools: School[];
  folders: Folder[];
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
  instapayNumber: "track@instapay",
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
    title: "مذكرة اللغة العربية الشاملة (قراءة ونصوص ونحو)",
    grade: "الصف الأول الابتدائي",
    subject: "لغة عربية",
    pages: 44,
    description: "تأسيس شامل في القراءة والكتابة والأنشطة التفاعلية",
    active: true,
  },
  {
    id: "b2",
    title: "بوكليت الرياضيات والمسائل اللفظية",
    grade: "الصف الأول الابتدائي",
    subject: "رياضيات",
    pages: 52,
    description: "تمارين وتدريبات متدرجة وفق المنهج الجديد",
    active: true,
  },
  {
    id: "b3",
    title: "بوكليت مراجعة الرياضيات - الترم الأول",
    grade: "الصف الرابع الابتدائي",
    subject: "رياضيات",
    pages: 64,
    description: "مراجعة شاملة بالأسئلة والحلول النموذجية",
    active: true,
  },
  {
    id: "b4",
    title: "بوكليت اللغة العربية - نحو وقراءة وتعبير",
    grade: "الصف السادس الابتدائي",
    subject: "لغة عربية",
    pages: 48,
    description: "شرح مبسط لقواعد النحو مع قطع تدريبية محلولة",
    active: true,
  },
  {
    id: "b5",
    title: "Science & Biology Revision Booklet",
    grade: "الصف الثاني الإعدادي",
    subject: "ساينس",
    pages: 80,
    description: "شامل امتحانات السنوات السابقة وبنك الأسئلة المتوقعة",
    active: true,
  },
  {
    id: "b6",
    title: "مذكرة مراجعة ليلة الامتحان في اللغة الإنجليزية",
    grade: "الصف الثالث الإعدادي",
    subject: "English",
    pages: 60,
    description: "أهم الكلمات والقواعد والمحادثات المتوقعة لشهادة الإعدادية",
    active: true,
  },
  {
    id: "b7",
    title: "بوكليت الكيمياء العامة - المراجعة المركزة",
    grade: "الصف الأول الثانوي",
    subject: "كيمياء",
    pages: 96,
    description: "شرح شامل وتطبيقات عملية ومسائل محلولة بالتفصيل",
    active: true,
  },
];

const seedFolders: Folder[] = [
  { id: "f1", name: "الصف الأول الابتدائي", sortOrder: 1 },
  { id: "f2", name: "الصف الرابع الابتدائي", sortOrder: 2 },
  { id: "f3", name: "الصف السادس الابتدائي", sortOrder: 3 },
  { id: "f4", name: "الصف الثاني الإعدادي", sortOrder: 4 },
  { id: "f5", name: "الصف الثالث الإعدادي", sortOrder: 5 },
  { id: "f6", name: "الصف الأول الثانوي", sortOrder: 6 },
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
    folders: seedFolders,
    booklets: seedBooklets,
    orders: [],
    settings: defaultSettings,
    currentUserId: null,
  };
}

function load(): DB {
  if (typeof window === "undefined") return initialDB();
  try {
    const raw = window.localStorage.getItem(KEY) || window.localStorage.getItem("nesma_booklets_v1");
    if (!raw) return initialDB();
    const parsed = JSON.parse(raw) as DB;
    return {
      ...initialDB(),
      ...parsed,
      folders: Array.isArray(parsed.folders) && parsed.folders.length > 0 ? parsed.folders : seedFolders,
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
  ) => Promise<{ ok: boolean; message?: string; isAdmin?: boolean }>;
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
  addFolder: (name: string) => Promise<Folder | null>;
  updateFolder: (id: string, name: string) => Promise<void>;
  removeFolder: (id: string, name: string) => Promise<void>;
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
      const [cloudUsers, cloudSchools, cloudFolders, cloudBooklets, cloudOrders, cloudSettings] =
        await Promise.all([
          apiGetUsers(),
          apiGetSchools(),
          apiGetFolders(),
          apiGetBooklets(),
          apiGetOrders(),
          apiGetSettings(),
        ]);

      let finalFolders = cloudFolders;
      if (cloudFolders.length === 0) {
        try {
          for (const sf of seedFolders) {
            await apiCreateFolder(sf.name);
          }
          finalFolders = await apiGetFolders();
        } catch (e) {
          console.warn("Auto-seed folders to D1:", e);
        }
      }

      // مزامنة أي طلبات أو مستخدمين محليين تم إنشاؤهم قبل المزامنة إلى قاعدة بيانات D1 السحابية
      if (typeof window !== "undefined") {
        try {
          const raw = window.localStorage.getItem(KEY);
          if (raw) {
            const localData = JSON.parse(raw) as DB;
            if (localData && Array.isArray(localData.orders)) {
              for (const lo of localData.orders) {
                const exists = cloudOrders.some((co) => co.id === lo.id || co.code === lo.code);
                if (!exists && lo.userId) {
                  try {
                    await apiCreateOrder({
                      userId: lo.userId,
                      userName: lo.userName,
                      userPhone: lo.userPhone,
                      source: lo.source,
                      bookletTitle: lo.bookletTitle,
                      fileName: lo.fileName,
                      fileDataUrl: lo.fileDataUrl,
                      pages: lo.pages,
                      sheets: lo.sheets,
                      copies: lo.copies,
                      binding: lo.binding,
                      printCost: lo.printCost,
                      bindingCost: lo.bindingCost,
                      deliveryFee: lo.deliveryFee,
                      total: lo.total,
                      schoolId: lo.schoolId,
                      studentName: lo.studentName,
                      deliveryMethod: lo.deliveryMethod,
                      address: lo.address,
                      landmark: lo.landmark,
                      paymentMethod: lo.paymentMethod,
                      paymentProof: lo.paymentProof,
                    });
                  } catch (e) {
                    console.warn("Auto-sync local order to D1 error:", e);
                  }
                }
              }
            }

            // فحص ومزامنة المستخدمين المحليين
            if (localData && Array.isArray(localData.users)) {
              for (const lu of localData.users) {
                if (lu.id !== "admin") {
                  const existsUser = cloudUsers.some((cu) => cu.phone === lu.phone);
                  if (!existsUser) {
                    try {
                      await apiCreateUser({
                        name: lu.name,
                        phone: lu.phone,
                        password: lu.password,
                        isAdmin: !!lu.isAdmin,
                        blocked: !!lu.blocked,
                      });
                    } catch (e) {
                      console.warn("Auto-sync local user to D1 error:", e);
                    }
                  }
                }
              }
            }
          }
        } catch (syncErr) {
          console.warn("Local migration error:", syncErr);
        }
      }

      // جلب أحدث نسخة بعد المزامنة
      const [finalOrders, finalUsers] = await Promise.all([apiGetOrders(), apiGetUsers()]);

      setDb((prev) => {
        const next: DB = {
          ...prev,
          users: finalUsers.length > 0 ? finalUsers : (cloudUsers.length > 0 ? cloudUsers : prev.users),
          schools: cloudSchools.length > 0 ? cloudSchools : prev.schools,
          folders: finalFolders.length > 0 ? finalFolders : prev.folders,
          booklets: cloudBooklets.length > 0 ? cloudBooklets : prev.booklets,
          orders: finalOrders.length > 0 ? finalOrders : (cloudOrders.length > 0 ? cloudOrders : prev.orders),
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
      login: async (phone, password) => {
        const cleanPhone = phone.trim();
        let found = db.users.find((u) => u.phone === cleanPhone);
        if (!found) {
          try {
            const cloudUsers = await apiGetUsers();
            if (cloudUsers && cloudUsers.length > 0) {
              patch((d) => ({ ...d, users: cloudUsers }));
              found = cloudUsers.find((u) => u.phone === cleanPhone);
            }
          } catch (e) {
            console.warn("Direct D1 users fetch fallback:", e);
          }
        }
        if (!found) return { ok: false, message: "رقم التليفون غير مسجل لدينا" };
        if (found.password !== password) return { ok: false, message: "كلمة السر غير صحيحة" };
        if (found.blocked)
          return { ok: false, message: "الحساب ده محظور، تواصل مع الدعم من فضلك" };
        patch((d) => ({ ...d, currentUserId: found.id }));
        // مزامنة فورية لكل الطلبات من السحابة بعد الدخول مباشرة
        await refreshFromCloud();
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
      addFolder: async (name: string) => {
        const clean = name.trim();
        if (!clean) return null;
        const created = await apiCreateFolder(clean);
        patch((d) => ({ ...d, folders: [...d.folders, created] }));
        return created;
      },
      updateFolder: async (id: string, name: string) => {
        const clean = name.trim();
        if (!clean) return;
        const oldFolder = db.folders.find((f) => f.id === id);
        patch((d) => ({
          ...d,
          folders: d.folders.map((f) => (f.id === id ? { ...f, name: clean } : f)),
          booklets: oldFolder
            ? d.booklets.map((b) => (b.grade === oldFolder.name ? { ...b, grade: clean } : b))
            : d.booklets,
        }));
        await apiUpdateFolder(id, clean);
      },
      removeFolder: async (id: string, name: string) => {
        patch((d) => ({
          ...d,
          folders: d.folders.filter((f) => f.id !== id),
        }));
        await apiDeleteFolder(id);
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
        const order = db.orders.find((o) => o.id === id);
        if (order) {
          if (["printing", "ready", "delivered"].includes(order.status)) {
            return {
              ok: false,
              message: "لا يمكن إلغاء الطلب أو التعديل عليه بعد بدء التنفيذ والطباعة",
            };
          }
          if (order.status === "cancelled") {
            return { ok: true, message: "الطلب ملغي بالفعل" };
          }
        }

        // تحديث الحالة محلياً فوراً
        patch((d) => ({
          ...d,
          orders: d.orders.map((o) =>
            o.id === id
              ? { ...o, status: "cancelled" as OrderStatus, updatedAt: new Date().toISOString() }
              : o,
          ),
        }));

        try {
          const res = await apiCancelOrder(id);
          if (!res.ok) {
            await refreshFromCloud();
            return res;
          }
          return { ok: true, message: "تم إلغاء الطلب بنجاح" };
        } catch {
          return { ok: true, message: "تم إلغاء الطلب بنجاح" };
        }
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
