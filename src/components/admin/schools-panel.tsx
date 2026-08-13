import { useState } from "react";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import type { School } from "@/lib/types";

const empty: Omit<School, "id"> = {
  name: "",
  address: "",
  area: "",
  contact: "",
  notes: "",
  active: true,
};

export function AdminSchools() {
  const { db, addSchool, updateSchool, removeSchool } = useStore();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<School, "id">>(empty);

  const save = () => {
    if (form.name.trim().length < 3 || form.address.trim().length < 3) {
      toast.error("اكتب اسم المدرسة والعنوان");
      return;
    }
    if (editId) {
      updateSchool(editId, form);
      toast.success("تم تحديث بيانات المدرسة");
    } else {
      addSchool(form);
      toast.success("تمت إضافة المدرسة");
    }
    setOpen(false);
    setEditId(null);
    setForm(empty);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">المدارس ({db.schools.length})</h2>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) {
              setEditId(null);
              setForm(empty);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="rounded-full font-bold">
              <Plus className="size-4" /> إضافة مدرسة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editId ? "تعديل بيانات المدرسة" : "إضافة مدرسة جديدة"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <F label="اسم المدرسة">
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-11 rounded-2xl"
                />
              </F>
              <F label="العنوان">
                <Textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="rounded-2xl"
                  rows={2}
                />
              </F>
              <F label="المنطقة / المحافظة">
                <Input
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                  className="h-11 rounded-2xl"
                />
              </F>
              <F label="رقم تواصل المدرسة">
                <Input
                  value={form.contact ?? ""}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  className="h-11 rounded-2xl"
                  dir="ltr"
                />
              </F>
              <F label="ملاحظات التسليم">
                <Textarea
                  value={form.notes ?? ""}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="rounded-2xl"
                  rows={2}
                />
              </F>
              <div className="flex items-center justify-between rounded-2xl border p-3">
                <span className="font-semibold">متاحة للطلب</span>
                <Switch
                  checked={form.active}
                  onCheckedChange={(v) => setForm({ ...form, active: v })}
                />
              </div>
              <Button onClick={save} className="w-full rounded-full font-bold">
                حفظ
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {db.schools.map((s) => (
          <Card key={s.id} className="rounded-3xl border-border/70 shadow-card">
            <CardContent className="space-y-2 p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-lg font-bold">{s.name}</h3>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    s.active
                      ? "bg-success/15 text-success"
                      : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {s.active ? "متاحة" : "موقوفة"}
                </span>
              </div>
              <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0" /> {s.address} — {s.area}
              </p>
              {s.contact && (
                <p className="text-sm text-muted-foreground" dir="ltr">
                  {s.contact}
                </p>
              )}
              {s.notes && <p className="text-xs text-muted-foreground">{s.notes}</p>}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-full font-bold"
                  onClick={() => {
                    setEditId(s.id);
                    setForm({ ...s });
                    setOpen(true);
                  }}
                >
                  <Pencil className="size-4" /> تعديل
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full font-bold text-destructive"
                  onClick={() => {
                    removeSchool(s.id);
                    toast.success("تم حذف المدرسة");
                  }}
                >
                  <Trash2 className="size-4" /> حذف
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="font-semibold">{label}</Label>
      {children}
    </div>
  );
}
