import { useState } from "react";
import { Ban, Phone, Plus, Search, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EGP, formatDate, useStore } from "@/lib/store";

export function AdminUsers() {
  const { db, user: me, removeUser, adminAddUser, setUserAdmin, setUserBlocked } = useStore();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pass, setPass] = useState("");
  const [makeAdmin, setMakeAdmin] = useState(false);

  const term = q.trim().toLowerCase();
  const users = db.users.filter((u) => `${u.name} ${u.phone}`.toLowerCase().includes(term));

  const submit = async () => {
    const res = await adminAddUser({ name, phone, password: pass, isAdmin: makeAdmin });
    if (!res.ok) {
      toast.error(res.message!);
      return;
    }
    toast.success("تم إضافة المستخدم بنجاح");
    setName("");
    setPhone("");
    setPass("");
    setMakeAdmin(false);
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث بالاسم أو رقم التليفون"
            className="h-11 rounded-2xl pr-10"
          />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 w-full rounded-2xl font-bold sm:w-auto">
              <Plus className="size-4" /> إضافة مستخدم
            </Button>
          </DialogTrigger>
          <DialogContent
            className="max-h-[85dvh] w-[calc(100vw-2rem)] overflow-y-auto rounded-3xl sm:max-w-md"
            dir="rtl"
          >
            <DialogHeader className="text-right">
              <DialogTitle>إضافة مستخدم جديد</DialogTitle>
              <DialogDescription>
                رقم التليفون هو اسم الدخول، وكلمة السر ٤ أرقام أو أكتر.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="font-semibold">الاسم بالكامل</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: أحمد محمود"
                  className="h-11 rounded-2xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold">رقم التليفون</Label>
                <Input
                  value={phone}
                  inputMode="numeric"
                  dir="ltr"
                  maxLength={11}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  placeholder="01xxxxxxxxx"
                  className="h-11 rounded-2xl text-left"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold">كلمة السر</Label>
                <Input
                  value={pass}
                  dir="ltr"
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="٤ أرقام أو أكتر"
                  className="h-11 rounded-2xl text-left"
                />
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-muted/60 p-3">
                <span className="text-sm font-semibold">صلاحيات أدمن</span>
                <Switch checked={makeAdmin} onCheckedChange={setMakeAdmin} />
              </div>
              <Button onClick={submit} className="w-full rounded-full font-bold" size="lg">
                إضافة
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>


      {users.length === 0 && (
        <Card className="rounded-3xl border-dashed">
          <CardContent className="p-10 text-center text-muted-foreground">
            مفيش مستخدمين مطابقين للبحث.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {users.map((u) => {
          const orders = db.orders.filter((o) => o.userId === u.id);
          const spent = orders
            .filter((o) => o.status !== "cancelled")
            .reduce((s, o) => s + o.total, 0);
          const isMe = me?.id === u.id;
          return (
            <Card key={u.id} className="rounded-3xl border-border/70 shadow-card">
              <CardContent className="space-y-3 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="bg-brand flex size-10 shrink-0 items-center justify-center rounded-2xl text-primary-foreground">
                      <UserRound className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-1.5 font-bold break-words">
                        <span className="truncate">{u.name}</span>
                        {u.isAdmin && (
                          <Badge className="rounded-full text-[10px]">
                            <ShieldCheck className="size-3" /> أدمن
                          </Badge>
                        )}
                        {u.blocked && (
                          <Badge variant="destructive" className="rounded-full text-[10px]">
                            <Ban className="size-3" /> محظور
                          </Badge>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground" dir="ltr">
                        {u.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">

                    <a href={`tel:${u.phone}`}>
                      <Button size="icon" variant="outline" className="rounded-full">
                        <Phone className="size-4" />
                      </Button>
                    </a>
                    <Button
                      size="icon"
                      variant="outline"
                      className="rounded-full text-destructive"
                      disabled={isMe}
                      onClick={() => {
                        removeUser(u.id);
                        toast.success("تم حذف المستخدم");
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-2xl bg-muted/60 px-3 py-2">
                    <span className="text-xs font-semibold">أدمن</span>
                    <Switch
                      checked={!!u.isAdmin}
                      disabled={isMe}
                      onCheckedChange={(v) => {
                        setUserAdmin(u.id, v);
                        toast.success(v ? "تم منحه صلاحيات الأدمن" : "تم تحويله لمستخدم عادي");
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-muted/60 px-3 py-2">
                    <span className="text-xs font-semibold">حظر الحساب</span>
                    <Switch
                      checked={!!u.blocked}
                      disabled={isMe}
                      onCheckedChange={(v) => {
                        setUserBlocked(u.id, v);
                        toast.success(v ? "تم حظر المستخدم" : "تم فك الحظر");
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <Box label="الطلبات" value={`${orders.length}`} />
                  <Box label="إجمالي المدفوع" value={EGP(spent)} />
                  <Box label="تاريخ التسجيل" value={formatDate(u.createdAt).split("،")[0]!} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/60 p-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}
