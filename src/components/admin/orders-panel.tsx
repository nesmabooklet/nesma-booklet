import { useMemo, useState } from "react";
import { Download, Eye, Phone, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { StatusBadge } from "@/components/status-badge";
import { EGP, formatDate, useStore } from "@/lib/store";
import { STATUS_LABELS, type Order, type OrderStatus } from "@/lib/types";

const statusKeys = Object.keys(STATUS_LABELS) as OrderStatus[];

export function AdminOrders() {
  const { db, setOrderStatus, setOrderNote } = useStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [open, setOpen] = useState<Order | null>(null);
  const [note, setNote] = useState("");

  const orders = useMemo(() => {
    return db.orders.filter((o) => {
      const okStatus = filter === "all" || o.status === filter;
      const text = `${o.code} ${o.userName} ${o.userPhone} ${o.studentName} ${o.bookletTitle}`;
      return okStatus && text.includes(q.trim());
    });
  }, [db.orders, filter, q]);

  const schoolName = (id: string) => db.schools.find((s) => s.id === id)?.name ?? "-";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث برقم الطلب أو اسم ولي الأمر أو رقم التليفون"
            className="h-11 rounded-2xl pr-10"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="h-11 w-48 rounded-2xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            {statusKeys.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {orders.length === 0 && (
        <Card className="rounded-3xl border-dashed">
          <CardContent className="p-10 text-center text-muted-foreground">
            مفيش طلبات مطابقة.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {orders.map((o) => (
          <Card
            key={o.id}
            className={`rounded-3xl border-border/70 shadow-card ${
              !o.seenByAdmin ? "ring-2 ring-accent" : ""
            }`}
          >
            <CardContent className="space-y-3 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-muted-foreground">
                    {o.code} • {formatDate(o.createdAt)}
                  </p>
                  <h3 className="font-display text-lg font-bold">{o.bookletTitle}</h3>
                  <p className="text-sm text-muted-foreground">
                    {o.userName} — <span dir="ltr">{o.userPhone}</span> • الطالب:{" "}
                    {o.studentName} • {schoolName(o.schoolId)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!o.seenByAdmin && (
                    <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-accent-foreground">
                      جديد
                    </span>
                  )}
                  <StatusBadge status={o.status} />
                </div>
              </div>

              <div className="grid gap-2 text-sm sm:grid-cols-4">
                <Cell label="الصفحات" value={`${o.pages}`} />
                <Cell label="الأوراق × النسخ" value={`${o.sheets} × ${o.copies}`} />
                <Cell
                  label="الاستلام"
                  value={o.deliveryMethod === "home" ? "توصيل منزل" : "من المدرسة"}
                />
                <Cell label="الإجمالي" value={EGP(o.total)} />
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-border/70 pt-3">
                <Select
                  value={o.status}
                  onValueChange={(v) => {
                    setOrderStatus(o.id, v as OrderStatus);
                    toast.success("تم تحديث حالة الطلب");
                  }}
                >
                  <SelectTrigger className="h-10 w-44 rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusKeys.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-full font-bold"
                  onClick={() => {
                    setOpen(o);
                    setNote(o.adminNote ?? "");
                  }}
                >
                  <Eye className="size-4" /> تفاصيل الطلب
                </Button>
                <a href={`tel:${o.userPhone}`}>
                  <Button size="sm" variant="outline" className="rounded-full font-bold">
                    <Phone className="size-4" /> اتصال
                  </Button>
                </a>
                <a
                  href={`https://wa.me/${o.userPhone.replace(/^0/, "20")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button size="sm" variant="outline" className="rounded-full font-bold">
                    واتساب
                  </Button>
                </a>
                {o.fileDataUrl && (
                  <a href={o.fileDataUrl} download={o.fileName}>
                    <Button size="sm" variant="outline" className="rounded-full font-bold">
                      <Download className="size-4" /> الملف
                    </Button>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl sm:max-w-lg">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display">تفاصيل الطلب {open.code}</DialogTitle>
                <DialogDescription>{formatDate(open.createdAt)}</DialogDescription>
              </DialogHeader>
              <div className="space-y-2 text-sm">
                <Line k="ولي الأمر" v={open.userName} />
                <Line k="رقم التليفون" v={open.userPhone} />
                <Line k="الطالب" v={open.studentName} />
                <Line k="المدرسة" v={schoolName(open.schoolId)} />
                <Line k="البوكليت" v={open.bookletTitle} />
                <Line k="المصدر" v={open.source === "upload" ? "ملف مرفوع" : "من المتاح"} />
                <Line k="عدد الصفحات" v={`${open.pages}`} />
                <Line k="عدد الأوراق" v={`${open.sheets} × ${open.copies} نسخة`} />
                <Line k="التغليف" v={open.binding ? "مطلوب" : "بدون"} />
                <Line k="تكلفة الطباعة" v={EGP(open.printCost)} />
                <Line k="تكلفة التغليف" v={EGP(open.bindingCost)} />
                <Line k="التوصيل" v={EGP(open.deliveryFee)} />
                <Line k="الإجمالي" v={EGP(open.total)} />
                <Line
                  k="طريقة الدفع"
                  v={
                    open.paymentMethod === "cash"
                      ? "كاش عند الاستلام"
                      : open.paymentMethod === "instapay"
                        ? "إنستا باي"
                        : "فودافون كاش"
                  }
                />
                {open.deliveryMethod === "home" && (
                  <>
                    <Line k="العنوان" v={open.address ?? "-"} />
                    <Line k="علامة مميزة" v={open.landmark ?? "-"} />
                  </>
                )}
                {open.paymentProof && (
                  <div>
                    <p className="mb-1 font-bold">صورة إثبات التحويل</p>
                    <img
                      src={open.paymentProof}
                      alt="إثبات الدفع"
                      loading="lazy"
                      className="w-full rounded-2xl border border-border"
                    />
                  </div>
                )}
                <div className="pt-2">
                  <Label className="font-bold">ملاحظة للعميل</Label>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="mt-1.5 rounded-2xl"
                    placeholder="مثال: الطلب هيتسلم بكرة الساعة ١٢ من مكتب المدرسة"
                  />
                  <Button
                    className="mt-2 w-full rounded-full font-bold"
                    onClick={() => {
                      setOrderNote(open.id, note);
                      toast.success("تم حفظ الملاحظة");
                    }}
                  >
                    حفظ الملاحظة
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/60 p-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 py-1.5">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-left font-semibold">{v}</span>
    </div>
  );
}
