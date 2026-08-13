import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Globe, Phone, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "من نحن — Nesma Booklets" },
      {
        name: "description",
        content:
          "تعرف على Nesma Booklets، خدمة طباعة بوكليتات المدارس وتوصيلها لباب المدرسة أو المنزل.",
      },
      { property: "og:title", content: "من نحن — Nesma Booklets" },
      {
        property: "og:description",
        content: "خدمة طباعة بوكليتات المدارس بجودة عالية وتوصيل سريع.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-1.5 text-sm font-bold text-primary">
          <Sparkles className="size-4" /> قصتنا
        </span>
        <h1 className="mt-4 font-display text-3xl font-extrabold sm:text-4xl">
          Nesma Booklets… طباعة مذاكرة ولادك بقت أسهل
        </h1>
        <p className="mt-4 leading-8 text-muted-foreground">
          بدأنا من مشكلة بسيطة بيعرفها كل ولي أمر: بوكليت المدرسة لازم يتطبع، والوقت ضيق،
          ومكتبات الطباعة زحمة. عملنا Nesma Booklets عشان ترفع الملف من موبايلك في دقيقة، تعرف
          التكلفة فوراً وبدقة، وتستلم البوكليت مغلّف ومترتب عند باب المدرسة أو لحد البيت.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { t: "جودة طباعة", d: "ألوان واضحة، ورق قوي، وتغليف يحافظ على البوكليت طول السنة." },
            { t: "أسعار شفافة", d: "التكلفة بتتحسب قدامك قبل ما تأكد الطلب، من غير مفاجآت." },
            { t: "التزام بالمواعيد", d: "متابعة لحظية لحالة الطلب من الاستلام للتسليم." },
          ].map((f) => (
            <Card key={f.t} className="rounded-3xl border-border/70 shadow-card">
              <CardContent className="p-5">
                <h2 className="font-display text-lg font-bold text-primary">{f.t}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-10 overflow-hidden rounded-3xl border-border/70 shadow-card">
          <div className="bg-brand p-5">
            <h2 className="font-display text-xl font-extrabold text-primary-foreground">
              تطوير وتنفيذ تقني
            </h2>
          </div>
          <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <Building2 className="size-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">الشركة المنفذة</p>
                <p className="font-bold">شركة OLTANI</p>
              </div>
            </div>
            <a
              href="https://oltani.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 hover:text-primary"
            >
              <Globe className="size-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">الموقع الإلكتروني</p>
                <p className="font-bold">oltani.com</p>
              </div>
            </a>
            <a href="tel:01002194451" className="flex items-center gap-3 hover:text-primary">
              <Phone className="size-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">للاستفسارات التقنية</p>
                <p className="font-bold" dir="ltr">
                  01002194451
                </p>
              </div>
            </a>
          </CardContent>
        </Card>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/order">
            <Button size="lg" className="rounded-full font-bold shadow-soft">
              اطلب طباعة بوكليت دلوقتي
            </Button>
          </Link>
          <Link to="/">
            <Button size="lg" variant="outline" className="rounded-full font-bold">
              الرجوع للرئيسية
            </Button>
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
