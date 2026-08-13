import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EGP, useStore } from "@/lib/store";
import { sheetsFromPages } from "@/lib/pdf";
import type { Booklet } from "@/lib/types";

const empty: Omit<Booklet, "id"> = {
  title: "",
  grade: "",
  subject: "",
  pages: 0,
  schoolId: "",
  description: "",
  active: true,
};

export function AdminBooklets() {
  const { db, settings, addBooklet, updateBooklet, removeBooklet } = useStore();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Booklet, "id">>(empty);

  const save = () => {
    if (form.title.trim().length < 3 || form.pages < 1) {
      toast.error("اكتب اسم البوكليت وعدد الصفحات");
      return;
    }
    if (editId) {
      updateBooklet(editId, form);
      toast.success("تم تحديث البوكليت");
    } else {
      addBooklet(form);
      toast.success("تمت إضافة البوكليت");
    }
    setOpen(false);
    setEditId(null);
    setForm(empty);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">
          البوكليتات المتاحة ({db.booklets.length})
        </h2>
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
              <Plus className="size-4" /> إضافة بوكليت
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editId ? "تعديل البوكليت" : "بوكليت جديد"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <F label="اسم البوكليت">
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="h-11 rounded-2xl"
                />
              </F>
              <div className="grid grid-cols-2 gap-3">
                <F label="الصف الدراسي">
                  <Input
                    value={form.grade}
                    onChange={(e) => setForm({ ...form, grade: e.target.value })}
                    className="h-11 rounded-2xl"
                  />
                </F>
                <F label="المادة">
                  <Input
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="h-11 rounded-2xl"
                  />
                </F>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <F label="عدد الصفحات">
                  <Input
                    type="number"
                    min={1}
                    value={form.pages || ""}
                    onChange={(e) => setForm({ ...form, pages: Number(e.target.value) || 0 })}
                    className="h-11 rounded-2xl"
                  />
                </F>
                <F label="المدرسة">
                  <Select
                    value={form.schoolId || "none"}
                    onValueChange={(v) => setForm({ ...form, schoolId: v === "none" ? "" : v })}
                  >
                    <SelectTrigger className="h-11 w-full rounded-2xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">كل المدارس</SelectItem>
                      {db.schools.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </F>
              </div>
              <F label="وصف مختصر">
                <Textarea
                  value={form.description ?? ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="rounded-2xl"
                />
              </F>
              <div className="flex items-center justify-between rounded-2xl border p-3">
                <span className="font-semibold">متاح للطلب</span>
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

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {db.booklets.map((b) => (
          <Card key={b.id} className="rounded-3xl border-border/70 shadow-card">
            <CardContent className="space-y-2 p-5">
              <h3 className="font-display text-base font-bold">{b.title}</h3>
              <p className="text-sm text-muted-foreground">
                {b.grade} • {b.subject} • {b.pages} صفحة
              </p>
              <p className="text-sm font-bold text-primary">
                تكلفة الطباعة التقريبية:{" "}
                {EGP(sheetsFromPages(b.pages) * settings.pricePerSheet)}
              </p>
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-full font-bold"
                  onClick={() => {
                    setEditId(b.id);
                    setForm({ ...b });
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
                    removeBooklet(b.id);
                    toast.success("تم الحذف");
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
