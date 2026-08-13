import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Info, KeyRound, Phone, UserRound } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isValidEgyptPhone, useStore } from "@/lib/store";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "الدخول والتسجيل — Nesma Booklets" },
      {
        name: "description",
        content: "سجّل برقم تليفونك وكلمة سر بسيطة وابدأ اطلب طباعة بوكليت ولادك.",
      },
      { property: "og:title", content: "الدخول والتسجيل — Nesma Booklets" },
      { property: "og:description", content: "حساب ولي الأمر برقم التليفون فقط." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { login, register, user } = useStore();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  const [lPhone, setLPhone] = useState("");
  const [lPass, setLPass] = useState("");

  const [rName, setRName] = useState("");
  const [rPhone, setRPhone] = useState("");
  const [rPass, setRPass] = useState("");
  const [rPass2, setRPass2] = useState("");

  const go = (isAdmin: boolean) => navigate({ to: isAdmin ? "/admin" : "/dashboard" });

  const doLogin = () => {
    if (!isValidEgyptPhone(lPhone)) {
      toast.error("رقم التليفون لازم يكون ١١ رقم ويبدأ بـ 010 / 011 / 012 / 015");
      return;
    }
    const res = login(lPhone, lPass);
    if (!res.ok) {
      toast.error(res.message!);
      return;
    }
    toast.success("أهلاً بيك 👋");
    go(!!res.isAdmin);
  };

  const doRegister = async () => {
    if (rName.trim().length < 3) {
      toast.error("اكتب اسمك بالكامل من فضلك");
      return;
    }
    if (!isValidEgyptPhone(rPhone)) {
      toast.error("رقم التليفون لازم يكون ١١ رقم صحيح (010 / 011 / 012 / 015)");
      return;
    }
    if (rPass.length < 4) {
      toast.error("كلمة السر لازم تكون ٤ أرقام أو أكتر");
      return;
    }
    if (rPass !== rPass2) {
      toast.error("كلمتا السر غير متطابقتين");
      return;
    }
    const res = await register(rName, rPhone, rPass);
    if (!res.ok) {
      toast.error(res.message!);
      return;
    }
    toast.success("تم إنشاء حسابك بنجاح 🎉");
    go(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-2 md:items-center">
        <div className="space-y-5">
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">
            حسابك عندنا <span className="text-brand">برقم تليفونك بس</span>
          </h1>
          <p className="leading-8 text-muted-foreground">
            من غير إيميلات ولا تعقيد. رقم التليفون هو اسم المستخدم، وكلمة السر من ٤ أرقام أو
            أكتر — سهلة عليك وعلى كل أولياء الأمور.
          </p>
          <div className="rounded-3xl border border-border/70 bg-primary-soft/60 p-5 text-sm">
            <p className="flex items-center gap-2 font-bold text-primary">
              <Info className="size-4" /> تعليمات سريعة
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pr-5 text-muted-foreground">
              <li>الرقم لازم يكون ١١ رقم مصري صحيح.</li>
              <li>الاسم ورقم التليفون مايتكرروش مع مستخدم تاني.</li>
              <li>من حسابك تقدر تتابع كل طلباتك وتحمّل ملفاتك.</li>
            </ul>
            <p className="mt-3 rounded-2xl bg-background/70 p-3 text-xs font-semibold text-muted-foreground">
              حساب الأدمن التجريبي: رقم <span className="text-primary">01002194451</span> وكلمة
              السر <span className="text-primary">admin1234</span> (تقدر تغيّرها من إعدادات
              اللوحة لاحقاً).
            </p>
          </div>
          {user && (
            <p className="text-sm font-semibold text-success">
              أنت مسجل دخول حالياً باسم {user.name}.
            </p>
          )}
        </div>

        <Card className="rounded-3xl border-border/70 shadow-card">
          <CardContent className="p-5 sm:p-6">
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2 rounded-full">
                <TabsTrigger value="login" className="rounded-full font-bold">
                  تسجيل الدخول
                </TabsTrigger>
                <TabsTrigger value="register" className="rounded-full font-bold">
                  حساب جديد
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-5 space-y-4">
                <Field
                  id="lphone"
                  label="رقم التليفون"
                  icon={<Phone className="size-4" />}
                  value={lPhone}
                  onChange={setLPhone}
                  placeholder="01xxxxxxxxx"
                  inputMode="numeric"
                />
                <PassField
                  id="lpass"
                  label="كلمة السر"
                  value={lPass}
                  onChange={setLPass}
                  show={show}
                  setShow={setShow}
                />
                <Button onClick={doLogin} className="w-full rounded-full font-bold" size="lg">
                  دخول
                </Button>
              </TabsContent>

              <TabsContent value="register" className="mt-5 space-y-4">
                <Field
                  id="rname"
                  label="الاسم بالكامل"
                  icon={<UserRound className="size-4" />}
                  value={rName}
                  onChange={setRName}
                  placeholder="مثال: أحمد محمود"
                />
                <Field
                  id="rphone"
                  label="رقم التليفون"
                  icon={<Phone className="size-4" />}
                  value={rPhone}
                  onChange={setRPhone}
                  placeholder="01xxxxxxxxx"
                  inputMode="numeric"
                />
                <PassField
                  id="rpass"
                  label="كلمة السر (٤ أرقام فأكثر)"
                  value={rPass}
                  onChange={setRPass}
                  show={show}
                  setShow={setShow}
                />
                <PassField
                  id="rpass2"
                  label="تأكيد كلمة السر"
                  value={rPass2}
                  onChange={setRPass2}
                  show={show}
                  setShow={setShow}
                />
                <Button
                  onClick={doRegister}
                  className="w-full rounded-full font-bold"
                  size="lg"
                >
                  إنشاء الحساب
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({
  id,
  label,
  icon,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  id: string;
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "numeric" | "text";
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="font-semibold">
        {label}
      </Label>
      <div className="relative">
        {icon && (
          <span className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground">
            {icon}
          </span>
        )}
        <Input
          id={id}
          value={value}
          inputMode={inputMode}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-12 rounded-2xl pr-10"
        />
      </div>
    </div>
  );
}

function PassField({
  id,
  label,
  value,
  onChange,
  show,
  setShow,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  setShow: (v: boolean) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="font-semibold">
        {label}
      </Label>
      <div className="relative">
        <KeyRound className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          inputMode="numeric"
          onChange={(e) => onChange(e.target.value)}
          className="h-12 rounded-2xl pr-10 pl-10"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="إظهار كلمة السر"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}
