import { useMemo, useRef, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  FolderPlus,
  FolderTree,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EGP, useStore } from "@/lib/store";
import { sheetsFromPages } from "@/lib/pdf";
import { uploadProofToImgBB } from "@/lib/api";
import type { Booklet } from "@/lib/types";

const defaultFolders = [
  "الصف الأول الابتدائي",
  "الصف الثاني الابتدائي",
  "الصف الثالث الابتدائي",
  "الصف الرابع الابتدائي",
  "الصف الخامس الابتدائي",
  "الصف السادس الابتدائي",
  "الصف الأول الإعدادي",
  "الصف الثاني الإعدادي",
  "الصف الثالث الإعدادي",
  "الصف الأول الثانوي",
  "الصف الثاني الثانوي",
  "الصف الثالث الثانوي",
];

const empty: Omit<Booklet, "id"> = {
  title: "",
  grade: "الصف الأول الابتدائي",
  subject: "لغة عربية",
  pages: 50,
  price: undefined,
  imageUrl: "",
  schoolId: "",
  description: "",
  active: true,
};

export function AdminBooklets() {
  const { db, settings, addBooklet, updateBooklet, removeBooklet } = useStore();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Booklet, "id">>(empty);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [activeFolder, setActiveFolder] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [customFolder, setCustomFolder] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // قائمة الفولدرات المتاحة من البوكليتات الحالية + الافتراضية
  const allFolders = useMemo(() => {
    const fromDb = db.booklets.map((b) => b.grade).filter(Boolean);
    const combined = Array.from(new Set([...defaultFolders, ...fromDb]));
    return combined;
  }, [db.booklets]);

  // البوكليتات بعد التصفية والبحث
  const filteredBooklets = useMemo(() => {
    return db.booklets.filter((b) => {
      const matchFolder = activeFolder === "all" || b.grade === activeFolder;
      const matchSearch =
        search.trim() === "" ||
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.subject.toLowerCase().includes(search.toLowerCase()) ||
        b.grade.toLowerCase().includes(search.toLowerCase());
      return matchFolder && matchSearch;
    });
  }, [db.booklets, activeFolder, search]);

  const handleImagePick = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار ملف صورة صالح (JPG أو PNG)");
      return;
    }
    setUploadingImg(true);
    toast.loading("جاري رفع صورة الغلاف إلى السحابة عبر ImgBB...", { id: "cover-up" });
    try {
      const res = await uploadProofToImgBB(file);
      if (res.ok && res.url) {
        setForm((prev) => ({ ...prev, imageUrl: res.url }));
        toast.success("تم رفع صورة الغلاف بنجاح ✨", { id: "cover-up" });
      } else {
        toast.error("تعذر رفع الصورة، يرجى المحاولة ثانية", { id: "cover-up" });
      }
    } catch {
      toast.error("حدث خطأ أثناء رفع الصورة", { id: "cover-up" });
    } finally {
      setUploadingImg(false);
    }
  };

  const save = () => {
    if (form.title.trim().length < 2) {
      toast.error("اكتب اسم البوكليت");
      return;
    }
    if (form.pages < 1) {
      toast.error("عدد الصفحات لازم يكون صفحة واحدة على الأقل");
      return;
    }
    if (editId) {
      updateBooklet(editId, form);
      toast.success("تم تحديث البوكليت بنجاح");
    } else {
      addBooklet(form);
      toast.success("تمت إضافة البوكليت إلى المعرض");
    }
    setOpen(false);
    setEditId(null);
    setForm(empty);
  };

  const handleAddFolder = () => {
    if (customFolder.trim().length < 2) {
      toast.error("اكتب اسم الفولدر أو السنة الدراسية");
      return;
    }
    setActiveFolder(customFolder.trim());
    setForm((prev) => ({ ...prev, grade: customFolder.trim() }));
    toast.success(`تم إنشاء فولدر «${customFolder.trim()}»`);
    setCustomFolder("");
    setNewFolderOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-extrabold flex items-center gap-2">
            <BookOpen className="size-6 text-primary" />
            معرض البوكليتات والسنوات الدراسية ({db.booklets.length})
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            أضف الفولدرات الرئيسية والبوكليتات مع صور الأغلفة والأسعار لتظهر في معرض العميل.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="rounded-full font-bold"
            onClick={() => setNewFolderOpen(true)}
          >
            <FolderPlus className="size-4" /> إضافة فولدر / سنة دراسية
          </Button>
          <Button
            className="rounded-full font-bold shadow-soft"
            onClick={() => {
              setEditId(null);
              setForm(empty);
              setOpen(true);
            }}
          >
            <Plus className="size-4" /> إضافة بوكليت جديد
          </Button>
        </div>
      </div>

      {/* STATS STRIP */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <p className="text-xs text-muted-foreground font-semibold">إجمالي البوكليتات</p>
          <p className="text-2xl font-extrabold text-foreground mt-1">{db.booklets.length}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <p className="text-xs text-muted-foreground font-semibold">الفولدرات والسنوات</p>
          <p className="text-2xl font-extrabold text-primary mt-1">{allFolders.length}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <p className="text-xs text-muted-foreground font-semibold">بوكليتات بغلاف مصور</p>
          <p className="text-2xl font-extrabold text-success mt-1">
            {db.booklets.filter((b) => !!b.imageUrl).length}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <p className="text-xs text-muted-foreground font-semibold">بدون غلاف</p>
          <p className="text-2xl font-extrabold text-amber-500 mt-1">
            {db.booklets.filter((b) => !b.imageUrl).length}
          </p>
        </div>
      </div>

      {/* FOLDERS FILTER TABS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-muted-foreground flex items-center gap-1.5">
            <FolderTree className="size-4 text-primary" /> الفولدرات الرئيسية (السنوات الدراسية):
          </span>
        </div>
        <div className="flex flex-wrap gap-2 pb-1">
          <Button
            size="sm"
            variant={activeFolder === "all" ? "default" : "outline"}
            className="rounded-full font-bold text-xs"
            onClick={() => setActiveFolder("all")}
          >
            كل السنوات ({db.booklets.length})
          </Button>
          {allFolders.map((f) => {
            const count = db.booklets.filter((b) => b.grade === f).length;
            return (
              <Button
                key={f}
                size="sm"
                variant={activeFolder === f ? "default" : "outline"}
                className="rounded-full font-bold text-xs"
                onClick={() => setActiveFolder(f)}
              >
                {f} ({count})
              </Button>
            );
          })}
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-md">
        <Search className="absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث باسم البوكليت، المادة، أو السنة..."
          className="h-11 rounded-2xl pr-10 pl-4"
        />
      </div>

      {/* BOOKLETS GRID (EXHIBITION CARDS) */}
      {filteredBooklets.length === 0 ? (
        <Card className="rounded-3xl border-dashed py-14 text-center">
          <CardContent className="space-y-3">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary">
              <BookOpen className="size-7" />
            </div>
            <h3 className="font-display text-lg font-bold">لا توجد بوكليتات في هذا القسم</h3>
            <p className="text-sm text-muted-foreground">
              اضغط على «إضافة بوكليت جديد» لإنشاء أول بوكليت ورفع غلافه.
            </p>
            <Button
              className="rounded-full font-bold mt-2"
              onClick={() => {
                setEditId(null);
                setForm({ ...empty, grade: activeFolder === "all" ? empty.grade : activeFolder });
                setOpen(true);
              }}
            >
              <Plus className="size-4" /> إضافة بوكليت الآن
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredBooklets.map((b) => {
            const calculatedPrice = sheetsFromPages(b.pages) * settings.pricePerSheet;
            const finalPrice = b.price !== undefined ? b.price : calculatedPrice;

            return (
              <Card
                key={b.id}
                className="group flex flex-col overflow-hidden rounded-3xl border-border/70 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-glow"
              >
                {/* BOOK THUMBNAIL */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/50 flex items-center justify-center border-b border-border/60">
                  {b.imageUrl ? (
                    <img
                      src={b.imageUrl}
                      alt={b.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <BookOpen className="size-7" />
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                        <ImageIcon className="size-3" /> بدون صورة
                      </span>
                    </div>
                  )}

                  {/* BADGES ON COVER */}
                  <div className="absolute top-2.5 right-2.5 flex flex-col gap-1">
                    <span className="rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-bold shadow-sm backdrop-blur-md">
                      {b.grade}
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 left-2.5">
                    <span className="rounded-full bg-primary/95 px-3 py-1 text-xs font-extrabold text-primary-foreground shadow-md backdrop-blur-md">
                      {EGP(finalPrice)}
                    </span>
                  </div>
                </div>

                {/* CONTENT */}
                <CardContent className="flex flex-1 flex-col justify-between p-4 space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span className="font-semibold text-primary">{b.subject}</span>
                      <span>{b.pages} صفحة ({sheetsFromPages(b.pages)} ورقة)</span>
                    </div>
                    <h3 className="font-display text-base font-bold line-clamp-2 leading-snug">
                      {b.title}
                    </h3>
                    {b.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {b.description}
                      </p>
                    )}
                  </div>

                  {/* CONTROLS */}
                  <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={b.active}
                        onCheckedChange={(v) => updateBooklet(b.id, { active: v })}
                      />
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        {b.active ? "متاح" : "معطل"}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="size-8 rounded-full p-0"
                        title="تعديل"
                        onClick={() => {
                          setEditId(b.id);
                          setForm({ ...b });
                          setOpen(true);
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="size-8 rounded-full p-0 text-destructive hover:bg-destructive/10"
                        title="حذف"
                        onClick={() => {
                          removeBooklet(b.id);
                          toast.success("تم حذف البوكليت من المعرض");
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT BOOKLET MODAL */}
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            setEditId(null);
            setForm(empty);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editId ? "تعديل بيانات البوكليت" : "إضافة بوكليت جديد للمعرض"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* COVER IMAGE UPLOADER */}
            <div className="space-y-2">
              <Label className="font-bold flex items-center justify-between">
                <span>صورة غلاف البوكليت (ImgBB)</span>
                <span className="text-xs text-muted-foreground">اختياري</span>
              </Label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => handleImagePick(e.target.files?.[0])}
              />

              {form.imageUrl ? (
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border">
                  <img
                    src={form.imageUrl}
                    alt="غلاف البوكليت"
                    className="h-full w-full object-cover"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 left-2 size-8 rounded-full p-0 shadow-md"
                    onClick={() => setForm((p) => ({ ...p, imageUrl: "" }))}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={uploadingImg}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 bg-primary-soft/30 p-6 text-center transition-colors hover:bg-primary-soft/60"
                >
                  {uploadingImg ? (
                    <>
                      <Loader2 className="size-8 animate-spin text-primary" />
                      <span className="text-sm font-bold text-primary">
                        جاري الرفع إلى ImgBB...
                      </span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="size-8 text-primary" />
                      <span className="text-sm font-bold">اضغط لاختيار ورفع صورة الغلاف</span>
                      <span className="text-xs text-muted-foreground">
                        إذا لم ترفع صورة، سيظهر البوكليت بشكل جميل مع شارة «بدون صورة»
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* TITLE */}
            <F label="اسم البوكليت / المذكرة">
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="مثال: مذكرة اللغة العربية - الترم الأول"
                className="h-11 rounded-2xl"
              />
            </F>

            {/* FOLDER & SUBJECT */}
            <div className="grid grid-cols-2 gap-3">
              <F label="السنة الدراسية (الفولدر)">
                <Select
                  value={form.grade}
                  onValueChange={(v) => setForm({ ...form, grade: v })}
                >
                  <SelectTrigger className="h-11 w-full rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allFolders.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </F>

              <F label="المادة">
                <Input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="مثال: رياضيات، علوم..."
                  className="h-11 rounded-2xl"
                />
              </F>
            </div>

            {/* PAGES & CUSTOM PRICE */}
            <div className="grid grid-cols-2 gap-3">
              <F label="عدد الصفحات">
                <Input
                  type="number"
                  min={1}
                  value={form.pages || ""}
                  onChange={(e) => setForm({ ...form, pages: Number(e.target.value) || 0 })}
                  className="h-11 rounded-2xl"
                />
              </F>

              <F label="سعر مخصص (اختياري)">
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  placeholder={`تلقائي (${EGP(sheetsFromPages(form.pages || 0) * settings.pricePerSheet)})`}
                  value={form.price !== undefined ? form.price : ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      price: e.target.value === "" ? undefined : Number(e.target.value),
                    })
                  }
                  className="h-11 rounded-2xl"
                />
              </F>
            </div>

            {/* DESCRIPTION */}
            <F label="وصف أو ملاحظات للبوكليت (اختياري)">
              <Textarea
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="تفاصيل عن البوكليت، نوع التغليف، المنهج..."
                className="rounded-2xl"
              />
            </F>

            {/* ACTIVE TOGGLE */}
            <div className="flex items-center justify-between rounded-2xl border border-border/70 p-3 bg-muted/40">
              <div>
                <p className="text-sm font-bold">متاح للطلب في المعرض</p>
                <p className="text-xs text-muted-foreground">
                  عند التعطيل لن يظهر هذا البوكليت للعملاء
                </p>
              </div>
              <Switch
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
            </div>

            {/* SUBMIT BUTTON */}
            <Button onClick={save} className="w-full rounded-full font-bold shadow-soft" size="lg">
              <CheckCircle2 className="size-4" /> {editId ? "حفظ التعديلات" : "إضافة البوكليت للمعرض"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ADD NEW FOLDER / YEAR MODAL */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">إضافة فولدر / سنة دراسية جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <F label="اسم الفولدر أو السنة الدراسية">
              <Input
                value={customFolder}
                onChange={(e) => setCustomFolder(e.target.value)}
                placeholder="مثال: لغات KG1، دبلومات فنية، إلخ..."
                className="h-11 rounded-2xl"
              />
            </F>
            <Button
              onClick={handleAddFolder}
              className="w-full rounded-full font-bold shadow-soft"
              size="lg"
            >
              <Sparkles className="size-4" /> إضافة الفولدر وتحديده
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="font-bold text-xs text-foreground/80">{label}</Label>
      {children}
    </div>
  );
}
