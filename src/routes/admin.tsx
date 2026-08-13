import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Bell,
  BookOpen,
  HelpCircle,
  Package,
  School,
  Settings2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminOverview } from "@/components/admin/overview";
import { AdminOrders } from "@/components/admin/orders-panel";
import { AdminSchools } from "@/components/admin/schools-panel";
import { AdminBooklets } from "@/components/admin/booklets-panel";
import { AdminUsers } from "@/components/admin/users-panel";
import { AdminSettings } from "@/components/admin/settings-panel";
import { AdminHelp } from "@/components/admin/help-panel";
import { playNotificationSound, useStore } from "@/lib/store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة تحكم الأدمن — Nesma Booklets" },
      {
        name: "description",
        content: "إدارة الطلبات والمدارس والأسعار وطرق الدفع والتوصيل لخدمة طباعة البوكليتات.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "لوحة تحكم الأدمن — Nesma Booklets" },
      { property: "og:description", content: "إدارة كاملة لمنظومة طباعة البوكليتات." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, db, settings, markOrdersSeen, ready } = useStore();
  const [tab, setTab] = useState("overview");
  const prevCount = useRef<number | null>(null);

  const newOrders = useMemo(
    () => db.orders.filter((o) => !o.seenByAdmin).length,
    [db.orders],
  );

  useEffect(() => {
    if (!isAdmin) return;
    if (prevCount.current === null) {
      prevCount.current = db.orders.length;
      return;
    }
    if (db.orders.length > prevCount.current) {
      if (settings.soundEnabled) playNotificationSound();
      toast.success("🔔 وصل طلب جديد دلوقتي!", { duration: 6000 });
    }
    prevCount.current = db.orders.length;
  }, [db.orders.length, isAdmin, settings.soundEnabled]);

  if (!ready) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="font-display text-2xl font-extrabold">صفحة الأدمن</h1>
          <p className="mt-3 text-muted-foreground">
            الصفحة دي مخصصة لإدارة البرنامج فقط. سجّل دخول بحساب الأدمن للمتابعة.
          </p>
          <Link to="/auth">
            <Button size="lg" className="mt-6 rounded-full px-8 font-bold">
              تسجيل دخول الأدمن
            </Button>
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const tabs = [
    { v: "overview", l: "نظرة عامة", i: <BarChart3 className="size-4" /> },
    { v: "orders", l: "الطلبات", i: <Package className="size-4" /> },
    { v: "schools", l: "المدارس", i: <School className="size-4" /> },
    { v: "booklets", l: "البوكليتات", i: <BookOpen className="size-4" /> },
    { v: "users", l: "المستخدمون", i: <Users className="size-4" /> },
    { v: "settings", l: "الإعدادات", i: <Settings2 className="size-4" /> },
    { v: "help", l: "التعليمات", i: <HelpCircle className="size-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold sm:text-3xl">لوحة تحكم الأدمن</h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              تحكم كامل في الطلبات والأسعار والمدارس والدفع والتوصيل.
            </p>
          </div>
          <Button
            variant={newOrders ? "default" : "outline"}
            className="w-full rounded-full font-bold sm:w-auto"
            onClick={() => {
              setTab("orders");
              markOrdersSeen();
            }}
          >
            <Bell className="size-4" />
            {newOrders ? `${newOrders} طلب جديد` : "لا توجد طلبات جديدة"}
          </Button>
        </div>


        {newOrders > 0 && (
          <Card className="mt-4 rounded-3xl border-accent bg-accent-soft shadow-card">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <p className="font-bold text-accent-foreground">
                عندك {newOrders} طلب جديد محتاج مراجعة — افتح تبويب الطلبات وابدأ التنفيذ.
              </p>
              <Button
                size="sm"
                className="rounded-full font-bold"
                onClick={() => {
                  setTab("orders");
                  markOrdersSeen();
                }}
              >
                عرض الطلبات
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs value={tab} onValueChange={setTab} className="mt-6">
          <div className="-mx-4 overflow-x-auto px-4 pb-2">
            <TabsList className="w-max rounded-full">
              {tabs.map((t) => (
                <TabsTrigger
                  key={t.v}
                  value={t.v}
                  className="gap-1.5 rounded-full font-bold whitespace-nowrap"
                >
                  {t.i}
                  {t.l}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>


          <TabsContent value="overview" className="mt-5">
            <AdminOverview />
          </TabsContent>
          <TabsContent value="orders" className="mt-5">
            <AdminOrders />
          </TabsContent>
          <TabsContent value="schools" className="mt-5">
            <AdminSchools />
          </TabsContent>
          <TabsContent value="booklets" className="mt-5">
            <AdminBooklets />
          </TabsContent>
          <TabsContent value="users" className="mt-5">
            <AdminUsers />
          </TabsContent>
          <TabsContent value="settings" className="mt-5">
            <AdminSettings />
          </TabsContent>
          <TabsContent value="help" className="mt-5">
            <AdminHelp />
          </TabsContent>
        </Tabs>
      </main>
      <SiteFooter />
    </div>
  );
}
