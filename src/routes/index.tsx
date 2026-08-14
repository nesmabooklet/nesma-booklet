import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  Bike,
  BookOpenCheck,
  Calculator,
  CloudUpload,
  MapPin,
  School,
  ShieldCheck,
  Sparkles,
  Timer,
  Wallet,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { EGP, useStore } from "@/lib/store";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Track Booklets — اطبع بوكليت ولادك واستلمه عند المدرسة" },
      {
        name: "description",
        content:
          "ارفع ملف البوكليت PDF، اعرف التكلفة فوراً، وادفع إنستا باي أو فودافون كاش أو كاش عند الاستلام، واستلم عند باب المدرسة أو البيت.",
      },
      { property: "og:title", content: "Track Booklets — طباعة بوكليتات المدارس" },
      {
        property: "og:description",
        content: "اطبع بوكليت ولادك من غير تعب واستلمه عند باب المدرسة أو البيت.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { settings, db } = useStore();
  const schools = db.schools.filter((s) => s.active);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="bg-hero relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-2 md:py-20">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card px-4 py-1.5 text-xs font-bold text-primary shadow-card sm:text-sm">
              <Sparkles className="size-4" /> خدمة طباعة بوكليتات المدارس رقم ١ لأولياء الأمور
            </span>
            <h1 className="font-display text-4xl leading-tight font-extrabold sm:text-5xl">
              اطبع بوكليت ولادك <span className="text-brand">من غير تعب</span>
              <br />
              واستلمه عند باب المدرسة أو البيت
            </h1>
            <p className="max-w-lg text-base leading-8 text-muted-foreground sm:text-lg">
              ارفع ملف الـ PDF من موبايلك، البرنامج يحسبلك عدد الأوراق والتكلفة فوراً، تدفع
              بالطريقة اللي تريحك، وإحنا نطبع ونغلّف ونوصّل. بلاش زحمة المكتبات ووجع الدماغ.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/order">
                <Button size="lg" className="rounded-full px-7 font-bold shadow-soft">
                  اطلب طباعة دلوقتي <ArrowLeft className="size-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-7 font-bold hover:bg-accent-soft"
                >
                  إنشاء حساب ولي أمر
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap gap-4 pt-2 text-sm font-semibold text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <BadgeCheck className="size-4 text-success" /> طباعة وش وضهر ألوان
              </span>
              <span className="flex items-center gap-1.5">
                <Timer className="size-4 text-success" /> تسليم سريع
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-success" /> ملفاتك في أمان
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="animate-float absolute -top-6 -right-4 z-10 hidden rounded-3xl border border-border/70 bg-card p-4 shadow-glow sm:block">
              <p className="text-xs text-muted-foreground">سعر الورقة (وش وضهر)</p>
              <p className="font-display text-2xl font-extrabold text-primary">
                {EGP(settings.pricePerSheet)}
              </p>
            </div>
            <img
              src={hero}
              alt="مندوب Track Booklets يسلّم بوكليت مطبوع لطلاب أمام باب المدرسة"
              width={1280}
              height={960}
              className="w-full rounded-[2rem] border border-border/70 object-cover shadow-glow"
            />
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <SectionTitle
          kicker="بخطوات بسيطة"
          title="إزاي تطبع البوكليت في ٤ خطوات؟"
          sub="كل خطوة عليها شرح واضح جوه البرنامج، مش هتحتاج حد يساعدك."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              i: <CloudUpload className="size-6" />,
              t: "١ - ارفع البوكليت",
              d: `ارفع ملف PDF لحد ${settings.maxUploadMB} ميجا، أو اختار بوكليت جاهز من المتاح.`,
            },
            {
              i: <Calculator className="size-6" />,
              t: "٢ - اعرف التكلفة",
              d: "البرنامج يحسب عدد الصفحات والأوراق والتغليف والتوصيل قدامك فوراً.",
            },
            {
              i: <Wallet className="size-6" />,
              t: "٣ - ادفع براحتك",
              d: "إنستا باي أو فودافون كاش (مع رفع صورة التحويل) أو كاش عند الاستلام.",
            },
            {
              i: <Bike className="size-6" />,
              t: "٤ - استلم طلبك",
              d: "من المدرسة أو لحد باب البيت، وتقدر تتابع حالة الطلب أول بأول.",
            },
          ].map((s) => (
            <Card
              key={s.t}
              className="group rounded-3xl border-border/70 shadow-card transition-transform hover:-translate-y-1"
            >
              <CardContent className="space-y-3 p-6">
                <div className="bg-brand flex size-12 items-center justify-center rounded-2xl text-primary-foreground shadow-soft">
                  {s.i}
                </div>
                <h3 className="font-display text-lg font-bold">{s.t}</h3>
                <p className="text-sm leading-7 text-muted-foreground">{s.d}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* PRICING EXPLAINER */}
      <section className="bg-primary-soft/50 py-14">
        <div className="mx-auto max-w-6xl px-4">
          <SectionTitle
            kicker="حساب واضح"
            title="التسعير بيتحسب إزاي؟"
            sub="من غير أي مفاجآت — الحساب قدامك خطوة بخطوة."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <PriceCard
              title="الورقة = وجهين"
              value={EGP(settings.pricePerSheet)}
              desc="كل صفحتين من الـ PDF بيتطبعوا على ورقة واحدة وش وضهر بالسعر ده."
            />
            <PriceCard
              title="الصفحة الفردية الأخيرة"
              value="ورقة كاملة"
              desc="لو عدد الصفحات فردي، آخر صفحة تتطبع لوحدها وتتحسب بسعر ورقة كاملة."
            />
            <PriceCard
              title="التغليف (اختياري)"
              value={EGP(settings.bindingPrice)}
              desc="تغليف يحمي البوكليت طول السنة، تقدر تضيفه أو تلغيه وقت الطلب."
            />
          </div>
          <div className="mt-6 rounded-3xl border border-border/70 bg-card p-6 shadow-card">
            <p className="font-display text-lg font-bold">مثال عملي</p>
            <p className="mt-2 leading-8 text-muted-foreground">
              بوكليت فيه <b>81 صفحة</b> ← عدد الأوراق = 41 ورقة (40 ورقة وش وضهر + ورقة أخيرة
              وش بس) ← تكلفة الطباعة ={" "}
              <b className="text-primary">{EGP(41 * settings.pricePerSheet)}</b>
              {settings.bindingPrice > 0 && <> + التغليف {EGP(settings.bindingPrice)}</>}.
            </p>
          </div>
        </div>
      </section>

      {/* SCHOOLS */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <SectionTitle
          kicker="أماكن الاستلام"
          title="المدارس اللي بنوصلها"
          sub="اختار مدرسة ابنك وقت الطلب، والمندوب يسلّم البوكليت هناك."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {schools.map((s) => (
            <Card key={s.id} className="rounded-3xl border-border/70 shadow-card">
              <CardContent className="space-y-2 p-5">
                <div className="flex items-center gap-2 text-primary">
                  <School className="size-5" />
                  <h3 className="font-display text-base font-bold">{s.name}</h3>
                </div>
                <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0" /> {s.address} — {s.area}
                </p>
                {s.notes && <p className="text-xs text-muted-foreground">{s.notes}</p>}
              </CardContent>
            </Card>
          ))}
          {schools.length === 0 && (
            <p className="text-muted-foreground">لسه مفيش مدارس مضافة من الأدمن.</p>
          )}
        </div>
      </section>

      {/* PAYMENT + FAQ */}
      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <SectionTitle kicker="طرق الدفع" title="ادفع بالطريقة اللي تريحك" />
            <div className="mt-6 space-y-3">
              {settings.instapayEnabled && (
                <PayRow
                  icon={<Banknote className="size-5" />}
                  title="إنستا باي"
                  desc={`حوّل على: ${settings.instapayNumber} وارفع صورة التحويل مع الطلب.`}
                />
              )}
              {settings.vodafoneEnabled && (
                <PayRow
                  icon={<Wallet className="size-5" />}
                  title="فودافون كاش"
                  desc={`حوّل على: ${settings.vodafoneNumber} وارفع صورة التحويل مع الطلب.`}
                />
              )}
              {settings.cashEnabled && (
                <PayRow
                  icon={<Banknote className="size-5" />}
                  title="كاش عند الاستلام"
                  desc="ادفع للمندوب وقت استلام البوكليت."
                />
              )}
            </div>
          </div>
          <div>
            <SectionTitle kicker="أسئلة شائعة" title="تعليمات مهمة قبل الطلب" />
            <Accordion type="single" collapsible className="mt-6">
              <FaqItem
                v="1"
                q="الملف بتاعي محمي بكلمة سر، أعمل إيه؟"
                a="البرنامج هينبهك إن الملف محمي، افتح الحماية من عندك وارفع الملف تاني عشان نقدر نحسب عدد الصفحات ونطبع."
              />
              <FaqItem
                v="2"
                q="أقصى حجم للملف كام؟"
                a={`أقصى حجم للرفع حالياً ${settings.maxUploadMB} ميجا بايت، وممكن يتزود من إدارة البرنامج.`}
              />
              <FaqItem
                v="3"
                q="أقدر ألغي الطلب؟"
                a="أيوه، طالما الطلب لسه ما دخلش مرحلة الطباعة أو التنفيذ. بعد كده مش هينفع الإلغاء أو التعديل."
              />
              <FaqItem
                v="4"
                q="التوصيل للبيت متاح؟"
                a={
                  settings.deliveryEnabled
                    ? `أيوه متاح بتكلفة ${EGP(settings.deliveryFee)}، واكتب العنوان والعلامة المميزة بالتفصيل.`
                    : "حالياً الاستلام من المدرسة فقط، والتوصيل للمنزل مغلق مؤقتاً."
                }
              />
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-8">
        <div className="bg-brand relative overflow-hidden rounded-[2rem] px-6 py-12 text-center shadow-glow">
          <BookOpenCheck className="absolute -top-6 -left-6 size-32 text-primary-foreground/15" />
          <h2 className="font-display text-2xl font-extrabold text-primary-foreground sm:text-3xl">
            بوكليت ولادك يستاهل طباعة محترمة
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/90">
            ارفع الملف دلوقتي واعرف التكلفة في ثواني — واحنا نكمّل الباقي.
          </p>
          <Link to="/order">
            <Button
              size="lg"
              variant="secondary"
              className="mt-6 rounded-full px-8 font-extrabold"
            >
              ابدأ طلبك <ArrowLeft className="size-4" />
            </Button>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function SectionTitle({
  kicker,
  title,
  sub,
}: {
  kicker: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="max-w-2xl">
      <span className="text-sm font-bold text-accent-foreground">{kicker}</span>
      <h2 className="font-display mt-1 text-2xl font-extrabold sm:text-3xl">{title}</h2>
      {sub && <p className="mt-2 leading-7 text-muted-foreground">{sub}</p>}
    </div>
  );
}

function PriceCard({ title, value, desc }: { title: string; value: string; desc: string }) {
  return (
    <Card className="rounded-3xl border-border/70 bg-card shadow-card">
      <CardContent className="space-y-2 p-6">
        <p className="text-sm font-bold text-muted-foreground">{title}</p>
        <p className="font-display text-2xl font-extrabold text-primary">{value}</p>
        <p className="text-sm leading-7 text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  );
}

function PayRow({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-3xl border border-border/70 bg-card p-4 shadow-card">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        {icon}
      </span>
      <div>
        <p className="font-bold">{title}</p>
        <p className="text-sm break-all text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function FaqItem({ v, q, a }: { v: string; q: string; a: string }) {
  return (
    <AccordionItem value={v} className="border-border/70">
      <AccordionTrigger className="text-right font-bold">{q}</AccordionTrigger>
      <AccordionContent className="leading-7 text-muted-foreground">{a}</AccordionContent>
    </AccordionItem>
  );
}
