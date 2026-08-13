import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BookOpen, Clock, Package, Users, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EGP, useStore } from "@/lib/store";
import { STATUS_LABELS, type OrderStatus } from "@/lib/types";

export function AdminOverview() {
  const { db } = useStore();
  const orders = db.orders;

  const stats = useMemo(() => {
    const valid = orders.filter((o) => o.status !== "cancelled");
    return {
      total: orders.length,
      newOrders: orders.filter((o) => o.status === "new").length,
      revenue: valid.reduce((s, o) => s + o.total, 0),
      sheets: valid.reduce((s, o) => s + o.sheets * o.copies, 0),
      users: db.users.filter((u) => !u.isAdmin).length,
    };
  }, [orders, db.users]);

  const last7 = useMemo(() => {
    const days: { day: string; orders: number; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      const dayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === key);
      days.push({
        day: d.toLocaleDateString("ar-EG", { weekday: "short" }),
        orders: dayOrders.length,
        revenue: dayOrders
          .filter((o) => o.status !== "cancelled")
          .reduce((s, o) => s + o.total, 0),
      });
    }
    return days;
  }, [orders]);

  const byStatus = useMemo(() => {
    const keys = Object.keys(STATUS_LABELS) as OrderStatus[];
    return keys
      .map((k) => ({
        name: STATUS_LABELS[k],
        value: orders.filter((o) => o.status === k).length,
      }))
      .filter((d) => d.value > 0);
  }, [orders]);

  const bySchool = useMemo(
    () =>
      db.schools.map((s) => ({
        name: s.name.length > 14 ? s.name.slice(0, 14) + "…" : s.name,
        orders: orders.filter((o) => o.schoolId === s.id).length,
      })),
    [db.schools, orders],
  );

  const colors = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat icon={<Package />} label="إجمالي الطلبات" value={`${stats.total}`} />
        <Stat icon={<Clock />} label="طلبات جديدة" value={`${stats.newOrders}`} highlight />
        <Stat icon={<Wallet />} label="إجمالي الإيرادات" value={EGP(stats.revenue)} />
        <Stat icon={<BookOpen />} label="أوراق مطبوعة" value={`${stats.sheets}`} />
        <Stat icon={<Users />} label="أولياء الأمور" value={`${stats.users}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="الطلبات خلال آخر ٧ أيام">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={last7}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 16,
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              />
              <Line
                type="monotone"
                dataKey="orders"
                name="طلبات"
                stroke="var(--chart-1)"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="الإيرادات اليومية (ج.م)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={last7}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  borderRadius: 16,
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              />
              <Bar dataKey="revenue" name="إيراد" fill="var(--chart-2)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="توزيع الطلبات حسب الحالة">
          {byStatus.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={byStatus}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={3}
                >
                  {byStatus.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard title="الطلبات حسب المدرسة">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={bySchool} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" allowDecimals={false} stroke="var(--muted-foreground)" />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                stroke="var(--muted-foreground)"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 16,
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              />
              <Bar dataKey="orders" name="طلبات" fill="var(--chart-3)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
      لسه مفيش بيانات كفاية لعرض الرسم البياني.
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-3xl border-border/70 shadow-card">
      <CardContent className="p-5">
        <h3 className="font-display mb-4 text-lg font-bold">{title}</h3>
        {children}
      </CardContent>
    </Card>
  );
}

function Stat({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className={`rounded-3xl border-border/70 shadow-card ${highlight ? "bg-accent-soft" : ""}`}
    >
      <CardContent className="flex items-center gap-3 p-5">
        <span className="bg-brand flex size-11 shrink-0 items-center justify-center rounded-2xl text-primary-foreground">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-display truncate text-lg font-extrabold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
