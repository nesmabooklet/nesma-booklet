import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  CloudUpload,
  Eye,
  FileText,
  FolderTree,
  Home,
  ImageIcon,
  ImageUp,
  Loader2,
  Lock,
  School,
  Search,
  ShoppingBag,
  Sparkles,
  Tag,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { Separator } from "@/components/ui/separator";
import { EGP, playNotificationSound, useStore } from "@/lib/store";
import { fileToDataUrl, readPdf, sheetsFromPages } from "@/lib/pdf";
import { uploadPdfToTelegram, uploadProofToImgBB } from "@/lib/api";
import type { Booklet } from "@/lib/types";

export const Route = createFileRoute("/order")({
  head: () => ({
    meta: [
      { title: "اطلب طباعة بوكليت — Track Booklets" },
      {
        name: "description",
        content: "ارفع ملف البوكليت PDF واحسب التكلفة فوراً واختار طريقة الدفع والاستلام.",
      },
      { property: "og:title", content: "اطلب طباعة بوكليت — Track Booklets" },
      { property: "og:description", content: "طلب طباعة بوكليت في دقيقة واحدة." },
    ],
  }),
  component: OrderPage,
});

function OrderPage() {
  const { user, settings, db, addOrder } = useStore();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const proofRef = useRef<HTMLInputElement>(null);

  const schools = db.schools.filter((s) => s.active);
  const booklets = db.booklets.filter((b) => b.active);

  const [source, setSource] = useState<"upload" | "catalog">("upload");
  const [bookletId, setBookletId] = useState("");
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [previewBooklet, setPreviewBooklet] = useState<Booklet | null>(null);
  const [galleryFolder, setGalleryFolder] = useState<string>("all");
  const [gallerySearch, setGallerySearch] = useState<string>("");
  const [fileName, setFileName] = useState("");
  const [fileData, setFileData] = useState("");
  const [rawPdfFile, setRawPdfFile] = useState<File | null>(null);
  const [rawProofFile, setRawProofFile] = useState<File | null>(null);
  const [pages, setPages] = useState(0);
  const [reading, setReading] = useState(false);
  const [encrypted, setEncrypted] = useState(false);

  const [studentName, setStudentName] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [copies, setCopies] = useState(1);
  const [binding, setBinding] = useState(true);

  const [deliveryMethod, setDeliveryMethod] = useState<"school" | "home">("school");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");

  const payOptions = [
    settings.instapayEnabled ? "instapay" : null,
    settings.vodafoneEnabled ? "vodafone" : null,
    settings.cashEnabled ? "cash" : null,
  ].filter(Boolean) as ("instapay" | "vodafone" | "cash")[];
  const [paymentMethod, setPaymentMethod] = useState<"instapay" | "vodafone" | "cash">(
    payOptions[0] ?? "cash",
  );
  const [proof, setProof] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedBooklet = booklets.find((b) => b.id === bookletId);
  const effectivePages = source === "catalog" ? (selectedBooklet?.pages ?? 0) : pages;

  const allGalleryFolders = useMemo(() => {
    if (db.folders && db.folders.length > 0) {
      return db.folders.map((f) => f.name);
    }
    return Array.from(new Set(booklets.map((b) => b.grade).filter(Boolean)));
  }, [db.folders, booklets]);

  const filteredGalleryBooklets = useMemo(() => {
    return booklets.filter((b) => {
      const matchF = galleryFolder === "all" || b.grade === galleryFolder;
      const matchS =
        gallerySearch.trim() === "" ||
        b.title.toLowerCase().includes(gallerySearch.toLowerCase()) ||
        b.subject.toLowerCase().includes(gallerySearch.toLowerCase()) ||
        b.grade.toLowerCase().includes(gallerySearch.toLowerCase());
      return matchF && matchS;
    });
  }, [booklets, galleryFolder, gallerySearch]);

  const cost = useMemo(() => {
    const sheets = sheetsFromPages(effectivePages);
    const baseUnitPrintCost =
      source === "catalog" && selectedBooklet?.price !== undefined
        ? selectedBooklet.price
        : +(sheets * settings.pricePerSheet).toFixed(2);
    const printCost = +(baseUnitPrintCost * copies).toFixed(2);
    const bindingCost = binding ? +(settings.bindingPrice * copies).toFixed(2) : 0;
    const deliveryFee =
      deliveryMethod === "home" && settings.deliveryEnabled ? settings.deliveryFee : 0;
    return {
      sheets,
      printCost,
      bindingCost,
      deliveryFee,
      total: +(printCost + bindingCost + deliveryFee).toFixed(2),
    };
  }, [effectivePages, copies, binding, deliveryMethod, settings, source, selectedBooklet]);

  const onPickPdf = async (f?: File) => {
    if (!f) return;
    setEncrypted(false);
    setPages(0);
    setFileData("");
    setRawPdfFile(f);
    setFileName(f.name);
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      toast.error("الملف لازم يكون بصيغة PDF");
      setFileName("");
      setRawPdfFile(null);
      return;
    }
    const maxBytes = settings.maxUploadMB * 1024 * 1024;
    if (f.size > maxBytes) {
      toast.error(`حجم الملف أكبر من الحد المسموح (${settings.maxUploadMB} ميجا)`);
      setFileName("");
      setRawPdfFile(null);
      return;
    }
    setReading(true);
    const info = await readPdf(f);
    if (info.encrypted) {
      setEncrypted(true);
      setReading(false);
      toast.error("الملف محمي بكلمة سر — برجاء إعادة رفع الملف بعد فتح الحماية");
      return;
    }
    if (info.error || info.pages === 0) {
      setReading(false);
      setFileName("");
      setRawPdfFile(null);
      toast.error(info.error ?? "تعذّر قراءة عدد صفحات الملف");
      return;
    }
    setPages(info.pages);
    setFileData(await fileToDataUrl(f));
    setReading(false);
    toast.success(`تم قراءة الملف: ${info.pages} صفحة`);
  };

  const onPickProof = async (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("صورة التحويل لازم تكون صورة (JPG / PNG)");
      return;
    }
    setRawProofFile(f);
    setProof(await fileToDataUrl(f));
    toast.success("تم إرفاق صورة التحويل");
  };

  const submit = async () => {
    if (!user) {
      toast.error("سجّل دخولك الأول عشان تقدر تطلب");
      navigate({ to: "/auth" });
      return;
    }
    if (source === "upload" && (!fileData || !pages)) {
      toast.error("ارفع ملف الـ PDF الأول");
      return;
    }
    if (source === "catalog" && !selectedBooklet) {
      toast.error("اختار بوكليت من المتاح");
      return;
    }
    if (studentName.trim().length < 3) {
      toast.error("اكتب اسم الطالب");
      return;
    }
    if (!schoolId) {
      toast.error("اختار المدرسة");
      return;
    }
    if (deliveryMethod === "home" && (address.trim().length < 10 || !landmark.trim())) {
      toast.error("اكتب العنوان بالتفصيل والعلامة المميزة عشان المندوب ما يتوهش");
      return;
    }
    if (paymentMethod !== "cash" && !proof) {
      toast.error("رفع صورة التحويل إجباري لإتمام الطلب");
      return;
    }
    setSubmitting(true);

    let telegramFileId: string | undefined;
    let telegramFileUrl: string | undefined;
    let finalProofUrl: string | undefined = proof;

    // 1. رفع ملف الـ PDF إلى تليجرام في الجروب الخاص
    if (source === "upload" && rawPdfFile) {
      toast.loading("جاري حفظ وتخزين ملف الـ PDF سحابياً...", { id: "upload-status" });
      const tgRes = await uploadPdfToTelegram(
        rawPdfFile,
        `${user.phone}-${rawPdfFile.name}`,
        user.phone,
      );
      if (tgRes.ok) {
        telegramFileId = tgRes.fileId;
        telegramFileUrl = tgRes.fileUrl;
        toast.success("تم تخزين ملف الـ PDF بنجاح في السحابة", { id: "upload-status" });
      } else {
        toast.error("تنبيه: " + (tgRes.error || "تعذر تخزين الملف"), { id: "upload-status" });
      }
    }

    // 2. رفع صورة إثبات الدفع إلى ImgBB
    if (paymentMethod !== "cash" && (rawProofFile || proof)) {
      toast.loading("جاري رفع صورة إيصال التحويل...", { id: "proof-status" });
      const imgRes = await uploadProofToImgBB(rawProofFile || proof);
      if (imgRes.ok && imgRes.url) {
        finalProofUrl = imgRes.url;
        toast.success("تم رفع إيصال التحويل بنجاح", { id: "proof-status" });
      }
    }

    try {
      const order = await addOrder({
        userId: user.id,
        userName: user.name,
        userPhone: user.phone,
        source,
        bookletTitle: source === "catalog" ? selectedBooklet!.title : fileName,
        ...(source === "upload"
          ? {
              fileName: `${user.phone}-${fileName}`,
              fileDataUrl: telegramFileUrl || fileData,
              telegramFileId,
              telegramFileUrl,
            }
          : {}),
        pages: effectivePages,
        sheets: cost.sheets,
        copies,
        binding,
        printCost: cost.printCost,
        bindingCost: cost.bindingCost,
        deliveryFee: cost.deliveryFee,
        total: cost.total,
        schoolId,
        studentName: studentName.trim(),
        deliveryMethod,
        ...(deliveryMethod === "home"
          ? { address: address.trim(), landmark: landmark.trim() }
          : {}),
        paymentMethod,
        ...(finalProofUrl ? { paymentProof: finalProofUrl } : {}),
      });

      if (settings.soundEnabled) playNotificationSound();
      setSubmitting(false);
      toast.success(`تم إرسال طلبك بنجاح — رقم الطلب ${order.code}`);
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setSubmitting(false);
      toast.error("حدث خطأ أثناء حفظ الطلب، يرجى المحاولة ثانية");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="font-display text-2xl font-extrabold">لازم تسجّل دخول الأول</h1>
          <p className="mt-3 text-muted-foreground">
            عشان نقدر نربط الطلب برقم تليفونك ونتابع معاك، سجّل دخول أو اعمل حساب جديد في
            دقيقة.
          </p>
          <Link to="/auth">
            <Button size="lg" className="mt-6 rounded-full px-8 font-bold">
              دخول / حساب جديد
            </Button>
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-display text-3xl font-extrabold">اطلب طباعة بوكليت</h1>
        <p className="mt-2 text-muted-foreground">
          املأ الخطوات دي بالترتيب، وهتلاقي التكلفة بتتحدث معاك لحظة بلحظة على اليسار.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {/* STEP 1 */}
            <StepCard n="١" title="البوكليت المطلوب طباعته">
              <RadioGroup
                value={source}
                onValueChange={(v) => setSource(v as "upload" | "catalog")}
                className="grid gap-3 sm:grid-cols-2"
              >
                <OptionBox
                  value="upload"
                  active={source === "upload"}
                  title="ارفع ملف PDF"
                  desc={`أقصى حجم ${settings.maxUploadMB} ميجا`}
                  icon={<CloudUpload className="size-5" />}
                />
                <OptionBox
                  value="catalog"
                  active={source === "catalog"}
                  title="اختار من البوكليتات المتاحة"
                  desc={`${booklets.length} بوكليت جاهز`}
                  icon={<FileText className="size-5" />}
                />
              </RadioGroup>

              {source === "upload" ? (
                <div className="mt-4 space-y-3">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/pdf"
                    hidden
                    onChange={(e) => onPickPdf(e.target.files?.[0])}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex w-full flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-primary/40 bg-primary-soft/40 p-8 text-center transition-colors hover:bg-primary-soft"
                  >
                    {reading ? (
                      <Loader2 className="size-8 animate-spin text-primary" />
                    ) : (
                      <CloudUpload className="size-8 text-primary" />
                    )}
                    <span className="font-bold">
                      {fileName || "اضغط هنا لاختيار ملف الـ PDF"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      الملف بيترفع باسم رقم تليفونك: {user.phone}-اسم-الملف.pdf
                    </span>
                  </button>

                  {encrypted && (
                    <div className="flex items-start gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm font-semibold text-destructive">
                      <Lock className="mt-0.5 size-4 shrink-0" />
                      الملف محمي بكلمة سر، برجاء إعادة رفع الملف بعد فتحه وإزالة الحماية.
                    </div>
                  )}
                  {pages > 0 && (
                    <div className="flex items-center gap-2 rounded-2xl bg-success/10 p-4 text-sm font-bold text-success">
                      <CheckCircle2 className="size-4" /> عدد الصفحات: {pages} صفحة — يعادل{" "}
                      {sheetsFromPages(pages)} ورقة طباعة
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {selectedBooklet ? (
                    <div className="flex flex-col sm:flex-row items-center gap-4 rounded-3xl border border-primary/30 bg-primary-soft/30 p-4 shadow-sm">
                      {/* Book Thumbnail */}
                      <div className="relative aspect-[3/4] w-24 sm:w-28 shrink-0 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-md flex items-center justify-center">
                        {selectedBooklet.imageUrl ? (
                          <img
                            src={selectedBooklet.imageUrl}
                            alt={selectedBooklet.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1 p-2 text-center">
                            <BookOpen className="size-6 text-primary" />
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                              بدون صورة
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 text-center sm:text-right space-y-1">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <span className="rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-primary-foreground">
                            {selectedBooklet.grade}
                          </span>
                          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                            {selectedBooklet.subject}
                          </span>
                        </div>
                        <h3 className="font-display text-lg font-bold text-foreground">
                          {selectedBooklet.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {selectedBooklet.pages} صفحة • {sheetsFromPages(selectedBooklet.pages)} ورقة طباعة
                        </p>
                        <p className="text-sm font-extrabold text-primary pt-0.5">
                          سعر النسخة:{" "}
                          {EGP(
                            selectedBooklet.price !== undefined
                              ? selectedBooklet.price
                              : sheetsFromPages(selectedBooklet.pages) * settings.pricePerSheet,
                          )}
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full font-bold text-xs shrink-0"
                        onClick={() => setGalleryOpen(true)}
                      >
                        <BookOpen className="size-3.5" /> تغيير من المعرض
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setGalleryOpen(true)}
                      className="group flex w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-primary/50 bg-primary-soft/30 p-8 text-center transition-all hover:bg-primary-soft/70 hover:shadow-soft"
                    >
                      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md transition-transform group-hover:scale-110">
                        <BookOpen className="size-7" />
                      </div>
                      <div>
                        <span className="font-display text-lg font-extrabold text-foreground">
                          اضغط هنا لفتح معرض البوكليتات 📚
                        </span>
                        <p className="mt-1 text-xs text-muted-foreground">
                          تصفح المذكرات والكتب مقسمة حسب السنوات الدراسية مع صور الأغلفة والأسعار
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-sm">
                        <Sparkles className="size-3.5" /> تصفح المعرض واختيار البوكليت ({booklets.length} متاح)
                      </span>
                    </button>
                  )}
                </div>
              )}
            </StepCard>

            {/* STEP 2 */}
            <div id="step-2">
              <StepCard n="٢" title="بيانات الطالب والمدرسة">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="font-semibold">اسم الطالب</Label>
                  <Input
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="مثال: يوسف أحمد"
                    className="mt-1.5 h-12 rounded-2xl"
                  />
                </div>
                <div>
                  <Label className="font-semibold">المدرسة</Label>
                  <Select value={schoolId} onValueChange={setSchoolId}>
                    <SelectTrigger className="mt-1.5 h-12 w-full rounded-2xl">
                      <SelectValue placeholder="اختار المدرسة" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} — {s.area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-semibold">عدد النسخ</Label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={copies}
                    onChange={(e) => setCopies(Math.max(1, Number(e.target.value) || 1))}
                    className="mt-1.5 h-12 rounded-2xl"
                  />
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-border/70 p-3 sm:mt-7">
                  <div>
                    <p className="font-semibold">تغليف البوكليت</p>
                    <p className="text-xs text-muted-foreground">
                      {EGP(settings.bindingPrice)} للنسخة
                    </p>
                  </div>
                  <Switch checked={binding} onCheckedChange={setBinding} />
                </div>
              </div>
            </StepCard>
            </div>

            {/* STEP 3 */}
            <StepCard n="٣" title="طريقة الاستلام">
              <RadioGroup
                value={deliveryMethod}
                onValueChange={(v) => setDeliveryMethod(v as "school" | "home")}
                className="grid gap-3 sm:grid-cols-2"
              >
                <OptionBox
                  value="school"
                  active={deliveryMethod === "school"}
                  title="استلام من المدرسة"
                  desc="مجاناً — يسلّم عند باب المدرسة"
                  icon={<School className="size-5" />}
                />
                {settings.deliveryEnabled && (
                  <OptionBox
                    value="home"
                    active={deliveryMethod === "home"}
                    title="توصيل للمنزل"
                    desc={`رسوم توصيل ${EGP(settings.deliveryFee)}`}
                    icon={<Home className="size-5" />}
                  />
                )}
              </RadioGroup>
              {!settings.deliveryEnabled && (
                <p className="mt-3 text-sm text-muted-foreground">
                  خدمة التوصيل للمنزل مغلقة حالياً، الاستلام من المدرسة فقط.
                </p>
              )}
              {deliveryMethod === "home" && settings.deliveryEnabled && (
                <div className="mt-4 space-y-3">
                  <div>
                    <Label className="font-semibold">العنوان بالتفصيل</Label>
                    <Textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={4}
                      placeholder="المحافظة - المنطقة - اسم الشارع - رقم العمارة - الدور - رقم الشقة"
                      className="mt-1.5 rounded-2xl"
                    />
                  </div>
                  <div>
                    <Label className="font-semibold">العلامة المميزة</Label>
                    <Input
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="مثال: فوق صيدلية النور مباشرة"
                      className="mt-1.5 h-12 rounded-2xl"
                    />
                  </div>
                </div>
              )}
            </StepCard>

            {/* STEP 4 */}
            <StepCard n="٤" title="طريقة الدفع">
              {payOptions.length === 0 ? (
                <p className="text-sm text-destructive">
                  مفيش طرق دفع متاحة حالياً، تواصل معانا على واتساب.
                </p>
              ) : (
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}
                  className="grid gap-3 sm:grid-cols-3"
                >
                  {settings.instapayEnabled && (
                    <OptionBox
                      value="instapay"
                      active={paymentMethod === "instapay"}
                      title="إنستا باي"
                      desc={settings.instapayNumber}
                      icon={<Banknote className="size-5" />}
                    />
                  )}
                  {settings.vodafoneEnabled && (
                    <OptionBox
                      value="vodafone"
                      active={paymentMethod === "vodafone"}
                      title="فودافون كاش"
                      desc={settings.vodafoneNumber}
                      icon={<Wallet className="size-5" />}
                    />
                  )}
                  {settings.cashEnabled && (
                    <OptionBox
                      value="cash"
                      active={paymentMethod === "cash"}
                      title="كاش عند الاستلام"
                      desc="الدفع للمندوب"
                      icon={<Banknote className="size-5" />}
                    />
                  )}
                </RadioGroup>
              )}

              {paymentMethod !== "cash" && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-start gap-2 rounded-2xl bg-accent-soft p-4 text-sm font-semibold text-accent-foreground">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    حوّل مبلغ {EGP(cost.total)} على{" "}
                    {paymentMethod === "instapay"
                      ? settings.instapayNumber
                      : settings.vodafoneNumber}{" "}
                    ثم ارفع صورة التحويل — الرفع إجباري لإتمام الطلب.
                  </div>
                  <input
                    ref={proofRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => onPickProof(e.target.files?.[0])}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-full rounded-2xl font-bold"
                    onClick={() => proofRef.current?.click()}
                  >
                    <ImageUp className="size-4" />
                    {proof ? "تغيير صورة التحويل" : "رفع صورة التحويل"}
                  </Button>
                  {proof && (
                    <img
                      src={proof}
                      alt="صورة إثبات التحويل"
                      loading="lazy"
                      className="max-h-48 rounded-2xl border border-border object-contain"
                    />
                  )}
                </div>
              )}
            </StepCard>
          </div>

          {/* SUMMARY */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <Card className="rounded-3xl border-border/70 shadow-card">
              <CardContent className="space-y-3 p-6">
                <h2 className="font-display text-xl font-extrabold">ملخص التكلفة</h2>
                <Row label="عدد الصفحات" value={`${effectivePages} صفحة`} />
                <Row label="عدد الأوراق (وش وضهر)" value={`${cost.sheets} ورقة`} />
                <Row label="عدد النسخ" value={`${copies}`} />
                <Separator />
                <Row label="تكلفة الطباعة" value={EGP(cost.printCost)} />
                <Row label="التغليف" value={binding ? EGP(cost.bindingCost) : "بدون"} />
                <Row
                  label="التوصيل"
                  value={cost.deliveryFee ? EGP(cost.deliveryFee) : "استلام من المدرسة"}
                />
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg font-bold">الإجمالي</span>
                  <span className="font-display text-2xl font-extrabold text-primary">
                    {EGP(cost.total)}
                  </span>
                </div>
                <Button
                  size="lg"
                  className="mt-2 w-full rounded-full font-extrabold shadow-soft"
                  onClick={submit}
                  disabled={submitting || reading}
                >
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                  تأكيد وإرسال الطلب
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  تقدر تلغي الطلب من صفحتك طالما لسه ما دخلش مرحلة الطباعة.
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>

        {/* ======================================================== */}
        {/* FULL BOOKLETS EXHIBITION / GALLERY MODAL                */}
        {/* ======================================================== */}
        <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
          <DialogContent className="flex max-h-[90vh] max-w-5xl flex-col overflow-hidden rounded-3xl p-0">
            {/* MODAL HEADER */}
            <div className="border-b border-border/70 bg-primary-soft/40 p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <DialogTitle className="font-display text-2xl font-extrabold flex items-center gap-2">
                    <BookOpen className="size-6 text-primary" />
                    معرض البوكليتات والمذكرات المدرسية 📚
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    تصفح مذكرات السنوات الدراسية واختر البوكليت المطلوب للشراء والطباعة فوراً.
                  </p>
                </div>
              </div>

              {/* SEARCH & FOLDERS TABS */}
              <div className="mt-4 space-y-3">
                <div className="relative max-w-md">
                  <Search className="absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={gallerySearch}
                    onChange={(e) => setGallerySearch(e.target.value)}
                    placeholder="ابحث باسم البوكليت، المادة، أو السنة الدراسية..."
                    className="h-10 rounded-2xl bg-background pr-10 pl-4 text-sm shadow-xs"
                  />
                </div>

                {/* GRADE / FOLDER CHIPS */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Button
                    size="sm"
                    variant={galleryFolder === "all" ? "default" : "outline"}
                    className="rounded-full font-bold text-xs"
                    onClick={() => setGalleryFolder("all")}
                  >
                    كل السنوات ({booklets.length})
                  </Button>
                  {allGalleryFolders.map((f) => {
                    const cnt = booklets.filter((b) => b.grade === f).length;
                    return (
                      <Button
                        key={f}
                        size="sm"
                        variant={galleryFolder === f ? "default" : "outline"}
                        className="rounded-full font-bold text-xs"
                        onClick={() => setGalleryFolder(f)}
                      >
                        {f} ({cnt})
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* GALLERY GRID */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {filteredGalleryBooklets.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <BookOpen className="size-7" />
                  </div>
                  <h3 className="font-display text-lg font-bold">لا توجد بوكليتات مطابقة</h3>
                  <p className="text-xs text-muted-foreground">
                    جرب البحث بكلمة أخرى أو اختر سنة دراسية مختلفة
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                  {filteredGalleryBooklets.map((b) => {
                    const priceUnit =
                      b.price !== undefined
                        ? b.price
                        : sheetsFromPages(b.pages) * settings.pricePerSheet;

                    return (
                      <div
                        key={b.id}
                        onClick={() => setPreviewBooklet(b)}
                        className="group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-glow cursor-pointer"
                      >
                        {/* BOOK THUMBNAIL */}
                        <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted/60 flex items-center justify-center border-b border-border/60">
                          {b.imageUrl ? (
                            <img
                              src={b.imageUrl}
                              alt={b.title}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-2 p-3 text-center">
                              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                                <BookOpen className="size-6" />
                              </div>
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                <ImageIcon className="size-2.5" /> بدون صورة
                              </span>
                            </div>
                          )}

                          {/* BADGES */}
                          <div className="absolute top-2 right-2 flex flex-col gap-1">
                            <span className="rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-bold shadow-xs backdrop-blur-md">
                              {b.grade}
                            </span>
                          </div>

                          <div className="absolute bottom-2 left-2">
                            <span className="rounded-full bg-primary/95 px-2.5 py-0.5 text-[11px] font-extrabold text-primary-foreground shadow-md backdrop-blur-md">
                              {EGP(priceUnit)}
                            </span>
                          </div>
                        </div>

                        {/* INFO */}
                        <div className="flex flex-1 flex-col justify-between p-3 space-y-2">
                          <div>
                            <span className="text-[11px] font-bold text-primary block">
                              {b.subject} • {b.pages} صفحة
                            </span>
                            <h4 className="font-display text-sm font-bold text-foreground line-clamp-2 mt-0.5 leading-snug">
                              {b.title}
                            </h4>
                          </div>

                          <Button
                            size="sm"
                            className="w-full rounded-full font-bold text-xs shadow-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewBooklet(b);
                            }}
                          >
                            <Eye className="size-3" /> معاينة وتفاصيل
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* ======================================================== */}
        {/* BOOKLET DETAIL & PURCHASE POPUP                          */}
        {/* ======================================================== */}
        <Dialog
          open={!!previewBooklet}
          onOpenChange={(v) => {
            if (!v) setPreviewBooklet(null);
          }}
        >
          <DialogContent className="max-w-lg overflow-hidden rounded-3xl p-0">
            {previewBooklet && (
              <div>
                {/* PREVIEW HERO IMAGE */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted flex items-center justify-center border-b border-border/70">
                  {previewBooklet.imageUrl ? (
                    <img
                      src={previewBooklet.imageUrl}
                      alt={previewBooklet.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
                      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <BookOpen className="size-8" />
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                        <ImageIcon className="size-3.5" /> بدون صورة غلاف
                      </span>
                    </div>
                  )}
                </div>

                {/* DETAILS BODY */}
                <div className="p-6 space-y-5">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
                        {previewBooklet.grade}
                      </span>
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                        {previewBooklet.subject}
                      </span>
                    </div>
                    <DialogTitle className="font-display text-xl font-extrabold text-foreground leading-snug">
                      {previewBooklet.title}
                    </DialogTitle>
                    {previewBooklet.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {previewBooklet.description}
                      </p>
                    )}
                  </div>

                  {/* SPECS GRID */}
                  <div className="grid grid-cols-3 gap-3 rounded-2xl border border-border/70 bg-card p-3.5 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold">عدد الصفحات</p>
                      <p className="text-base font-extrabold text-foreground mt-0.5">
                        {previewBooklet.pages}
                      </p>
                    </div>
                    <div className="border-x border-border/60">
                      <p className="text-xs text-muted-foreground font-semibold">أوراق الطباعة</p>
                      <p className="text-base font-extrabold text-foreground mt-0.5">
                        {sheetsFromPages(previewBooklet.pages)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold">سعر النسخة</p>
                      <p className="text-base font-extrabold text-primary mt-0.5">
                        {EGP(
                          previewBooklet.price !== undefined
                            ? previewBooklet.price
                            : sheetsFromPages(previewBooklet.pages) * settings.pricePerSheet,
                        )}
                      </p>
                    </div>
                  </div>

                  {/* BUY ACTION BUTTON */}
                  <Button
                    size="lg"
                    className="w-full rounded-full font-display text-base font-extrabold shadow-soft"
                    onClick={() => {
                      setBookletId(previewBooklet.id);
                      setPreviewBooklet(null);
                      setGalleryOpen(false);
                      setTimeout(() => {
                        document.getElementById("step-2")?.scrollIntoView({ behavior: "smooth" });
                      }, 150);
                      toast.success(`تم اختيار «${previewBooklet.title}» بنجاح — أكمل بيانات الاستلام ✨`);
                    }}
                  >
                    <ShoppingBag className="size-5" /> شراء هذا البوكليت ومتابعة الطلب
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
      <SiteFooter />
    </div>
  );
}

function StepCard({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-3xl border-border/70 shadow-card">
      <CardContent className="p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="bg-brand flex size-9 items-center justify-center rounded-2xl font-display font-extrabold text-primary-foreground">
            {n}
          </span>
          <h2 className="font-display text-xl font-bold">{title}</h2>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function OptionBox({
  value,
  active,
  title,
  desc,
  icon,
}: {
  value: string;
  active: boolean;
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <Label
      htmlFor={`opt-${value}`}
      className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition-colors ${
        active ? "border-primary bg-primary-soft/60" : "border-border hover:bg-muted"
      }`}
    >
      <RadioGroupItem id={`opt-${value}`} value={value} className="mt-1" />
      <span className="flex flex-col gap-0.5">
        <span className="flex items-center gap-2 font-bold">
          {icon}
          {title}
        </span>
        <span className="text-xs break-all text-muted-foreground">{desc}</span>
      </span>
    </Label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
