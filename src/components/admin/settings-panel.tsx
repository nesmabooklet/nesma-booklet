import { useState } from "react";
import { Bell, Bike, Image, MessageCircle, Save, Upload, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { playNotificationSound, useStore } from "@/lib/store";
import type { Settings } from "@/lib/types";

export function AdminSettings() {
  const { settings, updateSettings } = useStore();
  const [form, setForm] = useState<Settings>(settings);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    if (form.pricePerSheet <= 0) {
      toast.error("سعر الورقة لازم يكون أكبر من صفر");
      return;
    }
    updateSettings(form);
    toast.success("تم حفظ الإعدادات بنجاح");
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Section icon={<Wallet className="size-5" />} title="الأسعار">
          <Num
            label="سعر الورقة الواحدة (وش وضهر = صفحتين PDF) بالجنيه"
            value={form.pricePerSheet}
            onChange={(v) => set("pricePerSheet", v)}
            step={0.05}
          />
          <p className="text-xs text-muted-foreground">
            مثال: لو السعر 0.80 ج.م، يبقى كل صفحتين PDF بـ 80 قرش، والصفحة الفردية الأخيرة
            تُحسب بورقة كاملة.
          </p>
          <Num
            label="سعر التغليف للنسخة (جنيه)"
            value={form.bindingPrice}
            onChange={(v) => set("bindingPrice", v)}
          />
        </Section>

        <Section icon={<Bike className="size-5" />} title="التوصيل">
          <Toggle
            label="تفعيل التوصيل للمنزل"
            checked={form.deliveryEnabled}
            onChange={(v) => set("deliveryEnabled", v)}
          />
          <Num
            label="سعر التوصيل للمنزل (جنيه)"
            value={form.deliveryFee}
            onChange={(v) => set("deliveryFee", v)}
          />
        </Section>

        <Section icon={<Wallet className="size-5" />} title="طرق الدفع">
          <Toggle
            label="تفعيل إنستا باي"
            checked={form.instapayEnabled}
            onChange={(v) => set("instapayEnabled", v)}
          />
          <Txt
            label="حساب / رقم إنستا باي"
            value={form.instapayNumber}
            onChange={(v) => set("instapayNumber", v)}
          />
          <Toggle
            label="تفعيل فودافون كاش"
            checked={form.vodafoneEnabled}
            onChange={(v) => set("vodafoneEnabled", v)}
          />
          <Txt
            label="رقم فودافون كاش"
            value={form.vodafoneNumber}
            onChange={(v) => set("vodafoneNumber", v)}
          />
          <Toggle
            label="تفعيل الدفع كاش عند الاستلام"
            checked={form.cashEnabled}
            onChange={(v) => set("cashEnabled", v)}
          />
        </Section>

        <Section icon={<MessageCircle className="size-5" />} title="زر واتساب للدعم">
          <Toggle
            label="إظهار زر الواتساب في الموقع"
            checked={form.whatsappEnabled}
            onChange={(v) => set("whatsappEnabled", v)}
          />
          <Txt
            label="رقم الواتساب"
            value={form.whatsappNumber}
            onChange={(v) => set("whatsappNumber", v)}
          />
        </Section>

        <Section icon={<Upload className="size-5" />} title="حدود الرفع">
          <Num
            label="أقصى حجم لملف الـ PDF (ميجابايت)"
            value={form.maxUploadMB}
            onChange={(v) => set("maxUploadMB", v)}
          />
          <p className="text-xs text-muted-foreground">
            الافتراضي 50 ميجا، وتقدر تزوّده من هنا في أي وقت.
          </p>
        </Section>

        <Section icon={<Bell className="size-5" />} title="التنبيهات الصوتية">
          <Toggle
            label="تشغيل صوت التنبيه عند وصول طلب جديد"
            checked={form.soundEnabled}
            onChange={(v) => set("soundEnabled", v)}
          />
          <Button
            variant="outline"
            className="rounded-full font-bold"
            onClick={() => playNotificationSound()}
          >
            تجربة صوت التنبيه
          </Button>
        </Section>

        <Section icon={<Image className="size-5" />} title="إعداد رفع الصور (ImgBB)">
          <Txt
            label="مفتاح ImgBB API (لرفع صور التحويل على السيرفر)"
            value={form.imgbbApiKey}
            onChange={(v) => set("imgbbApiKey", v)}
          />
          <p className="text-xs text-muted-foreground">
            في النسخة الحالية صور التحويل بتتخزن محلياً مع الطلب. المفتاح ده مُجهّز للمبرمج
            لربط الرفع بخدمة ImgBB وقت التشغيل الفعلي.
          </p>
        </Section>
      </div>

      <Button size="lg" className="w-full rounded-full font-extrabold shadow-soft" onClick={save}>
        <Save className="size-4" /> حفظ كل الإعدادات
      </Button>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-3xl border-border/70 shadow-card">
      <CardContent className="space-y-3 p-5">
        <h3 className="font-display flex items-center gap-2 text-lg font-bold text-primary">
          {icon}
          {title}
        </h3>
        {children}
      </CardContent>
    </Card>
  );
}

function Num({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="font-semibold">{label}</Label>
      <Input
        type="number"
        step={step}
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="h-11 rounded-2xl"
      />
    </div>
  );
}

function Txt({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="font-semibold">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-2xl"
      />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/70 p-3">
      <span className="text-sm font-semibold">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
