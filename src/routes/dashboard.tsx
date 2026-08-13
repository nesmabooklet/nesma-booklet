import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Ban,
  Download,
  Home,
  Package,
  Plus,
  Receipt,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EGP, formatDate, useStore } from "@/lib/store";
import { LOCKED_STATUSES } from "@/lib/types";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "طلباتي — Nesma Booklets" },
      { name: "description", content: "تابع طلبات طباعة البوكليتات وحالتها وحمّل ملفاتك." },
      { property: "og:title", content: "طلباتي — Nesma Booklets" },
      { property: "og:description", content: "لوحة ولي الأمر لمتابعة الطلبات." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, db, cancelOrder } = useStore();
  const [toCancel, setToCancel] = useState<string | null>(null);

  const myOrders = useMemo(
    () => db.orders.filter((o) => o.userId === user?.id),
    [db.orders, user?.id],
  );

  const stats = useMemo(() => {
    const active = myOrders.filter(
      (o) => !["delivered", "cancelled"].includes(o.status),
    ).length;
    const spent = myOrders
      .filter((o) => o.status !== "cancelled")
      .reduce((s, o) => s + o.total, 0);
    return { total: myOrders.length, active, spent };
  }, [myOrders]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="font-display text-2xl font-extrabold">سجّل دخول لعرض طلباتك</h1>
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

  const current = myOrders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const past = myOrders.filter((o) => ["delivered", "cancelled"].includes(o.status));

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold">أهلاً {user.name} 👋</h1>
            <p className="mt-1 text-muted-foreground" dir="ltr">
              {user.phone}
            </p>
          </div>
          <Link to="/order">
            <Button size="lg" className="rounded-full font-bold shadow-soft">
              <Plus className="size-4" /> طلب طباعة جديد
            </Button>
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard icon={<Package />} label="إجمالي الطلبات" value={`${stats.total}`} />
          <StatCard icon={<Receipt />} label="طلبات جارية" value={`${stats.active}`} />
          <StatCard icon={<Wallet />} label="إجمالي المدفوع" value={EGP(stats.spent)} />
        </div>

        <Tabs defaultValue="current" className="mt-8">
          <TabsList className="rounded-full">
            <TabsTrigger value="current" className="rounded-full font-bold">
              الطلبات الجارية ({current.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="rounded-full font-bold">
              الطلبات السابقة ({past.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="current" className="mt-5 space-y-4">
            {current.length === 0 && <Empty />}
            {current.map((o) => (
              <OrderCard key={o.id} order={o} onCancel={() => setToCancel(o.id)} />
            ))}
          </TabsContent>
          <TabsContent value="past" className="mt-5 space-y-4">
            {past.length === 0 && <Empty />}
            {past.map((o) => (
              <OrderCard key={o.id} order={o} onCancel={() => setToCancel(o.id)} />
            ))}
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={!!toCancel} onOpenChange={(v) => !v && setToCancel(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد إلغاء الطلب</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من إلغاء الطلب؟ الإجراء ده مش هينفع تتراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">تراجع</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!toCancel) return;
                const orderId = toCancel;
                setToCancel(null);
                const res = await cancelOrder(orderId);
                if (res.ok) {
                  toast.success(res.message);
                } else {
                  toast.error(res.message);
                }
              }}
            >
              تأكيد الإلغاء
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SiteFooter />
    </div>
  );
}

function Empty() {
  return (
    <Card className="rounded-3xl border-dashed">
      <CardContent className="p-10 text-center text-muted-foreground">
        مفيش طلبات هنا لسه.
      </CardContent>
    </Card>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="rounded-3xl border-border/70 shadow-card">
      <CardContent className="flex items-center gap-4 p-5">
        <span className="bg-brand flex size-12 items-center justify-center rounded-2xl text-primary-foreground">
          {icon}
        </span>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-display text-xl font-extrabold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderCard({
  order,
  onCancel,
}: {
  order: import("@/lib/types").Order;
  onCancel: () => void;
}) {
  const { db } = useStore();
  const school = db.schools.find((s) => s.id === order.schoolId);
  const locked = LOCKED_STATUSES.includes(order.status);

  return (
    <Card className="rounded-3xl border-border/70 shadow-card">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-muted-foreground">{order.code}</p>
            <h3 className="font-display text-lg font-bold">{order.bookletTitle}</h3>
            <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Info label="الطالب" value={order.studentName} />
          <Info label="المدرسة" value={school?.name ?? "-"} />
          <Info
            label="الصفحات / الأوراق"
            value={`${order.pages} صفحة • ${order.sheets} ورقة × ${order.copies}`}
          />
          <Info
            label="الاستلام"
            value={order.deliveryMethod === "home" ? "توصيل للمنزل" : "من المدرسة"}
          />
        </div>

        {order.deliveryMethod === "home" && (
          <p className="rounded-2xl bg-muted p-3 text-sm">
            <Home className="ml-1 inline size-4" /> {order.address} — علامة مميزة:{" "}
            {order.landmark}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3">
          <div className="text-sm">
            <span className="text-muted-foreground">الإجمالي: </span>
            <span className="font-display text-xl font-extrabold text-primary">
              {EGP(order.total)}
            </span>
            <span className="mr-2 text-muted-foreground">
              (
              {order.paymentMethod === "cash"
                ? "كاش عند الاستلام"
                : order.paymentMethod === "instapay"
                  ? "إنستا باي"
                  : "فودافون كاش"}
              )
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {order.fileDataUrl && (
              <a href={order.fileDataUrl} download={order.fileName}>
                <Button variant="outline" size="sm" className="rounded-full font-bold">
                  <Download className="size-4" /> تحميل الملف
                </Button>
              </a>
            )}
            {order.status !== "cancelled" && (
              <Button
                variant={locked ? "ghost" : "destructive"}
                size="sm"
                className="rounded-full font-bold"
                onClick={
                  locked
                    ? () =>
                        toast.error(
                          "لا يمكن إلغاء الطلب أو التعديل عليه بعد بدء التنفيذ والطباعة",
                        )
                    : onCancel
                }
              >
                <Ban className="size-4" /> إلغاء الطلب
              </Button>
            )}
          </div>
        </div>

        {order.adminNote && (
          <p className="rounded-2xl bg-accent-soft p-3 text-sm font-semibold text-accent-foreground">
            ملاحظة من الإدارة: {order.adminNote}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
