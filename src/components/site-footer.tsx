import { Link } from "@tanstack/react-router";
import { Brand } from "./brand";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/70 bg-card/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div className="space-y-3">
          <Brand size="sm" />
          <p className="text-sm text-muted-foreground">
            خدمة طباعة بوكليتات المدارس بأعلى جودة وأسرع توصيل — لطلاب مصر وأولياء أمورهم.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <h3 className="font-display text-base font-bold">روابط سريعة</h3>
          <div className="flex flex-col gap-1.5 text-muted-foreground">
            <Link to="/order" className="hover:text-primary">
              اطلب طباعة بوكليت
            </Link>
            <Link to="/dashboard" className="hover:text-primary">
              متابعة طلباتي
            </Link>
            <Link to="/about" className="hover:text-primary">
              من نحن
            </Link>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <h3 className="font-display text-base font-bold">مواعيد العمل</h3>
          <p className="text-muted-foreground">
            السبت – الخميس، من ٩ صباحاً حتى ٩ مساءً
            <br />
            الاستلام من المدرسة قبل نهاية اليوم الدراسي.
          </p>
        </div>
      </div>
      <div className="border-t border-border/70 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Track Booklets — جميع الحقوق محفوظة.
      </div>
    </footer>
  );
}
