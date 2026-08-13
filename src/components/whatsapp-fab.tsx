import { MessageCircle } from "lucide-react";
import { useStore } from "@/lib/store";

export function WhatsAppFab() {
  const { settings, ready } = useStore();
  if (!ready || !settings.whatsappEnabled || !settings.whatsappNumber) return null;

  const num = settings.whatsappNumber.replace(/\D/g, "").replace(/^0/, "20");

  return (
    <a
      href={`https://wa.me/${num}?text=${encodeURIComponent("السلام عليكم، محتاج مساعدة في طلب طباعة بوكليت 🙏")}`}
      target="_blank"
      rel="noreferrer"
      aria-label="تواصل معنا على واتساب"
      className="fixed bottom-5 left-5 z-50 flex items-center gap-2 rounded-full bg-success px-4 py-3 text-success-foreground shadow-glow transition-transform hover:scale-105 active:scale-95"
    >
      <MessageCircle className="size-5" />
      <span className="hidden text-sm font-semibold sm:inline">تواصل واتساب</span>
    </a>
  );
}
