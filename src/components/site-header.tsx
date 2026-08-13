import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Menu, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { Brand } from "./brand";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useStore } from "@/lib/store";

const links = [
  { to: "/", label: "الرئيسية" },
  { to: "/order", label: "اطلب طباعة" },
  { to: "/dashboard", label: "طلباتي" },
  { to: "/about", label: "من نحن" },
];

export function SiteHeader() {
  const { user, isAdmin, logout } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const Nav = ({ onClick }: { onClick?: () => void }) => (
    <>
      {links.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          onClick={onClick}
          activeProps={{ className: "text-primary font-bold" }}
          className="rounded-full px-3 py-2 text-sm font-semibold text-foreground/80 transition-colors hover:text-primary"
        >
          {l.label}
        </Link>
      ))}
      {isAdmin && (
        <Link
          to="/admin"
          onClick={onClick}
          className="flex items-center gap-1 rounded-full px-3 py-2 text-sm font-bold text-accent-foreground"
        >
          <ShieldCheck className="size-4" /> لوحة الأدمن
        </Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Brand />

        <nav className="hidden items-center gap-1 md:flex">
          <Nav />
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to={isAdmin ? "/admin" : "/dashboard"}>
                <Button variant="secondary" size="sm" className="rounded-full font-bold">
                  <LayoutDashboard className="size-4" />
                  {user.name.split(" ")[0]}
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label="تسجيل الخروج"
                onClick={() => {
                  logout();
                  navigate({ to: "/" });
                }}
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          ) : (
            <Link to="/auth" className="hidden sm:block">
              <Button size="sm" className="rounded-full font-bold shadow-soft">
                <UserRound className="size-4" /> دخول / تسجيل
              </Button>
            </Link>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full md:hidden">
                <Menu className="size-5" />
                <span className="sr-only">القائمة</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="mt-8 flex flex-col gap-1 px-4">
                <Nav onClick={() => setOpen(false)} />
                <div className="mt-4 border-t pt-4">
                  {user ? (
                    <Button
                      variant="outline"
                      className="w-full rounded-full"
                      onClick={() => {
                        logout();
                        setOpen(false);
                        navigate({ to: "/" });
                      }}
                    >
                      <LogOut className="size-4" /> تسجيل الخروج
                    </Button>
                  ) : (
                    <Link to="/auth" onClick={() => setOpen(false)}>
                      <Button className="w-full rounded-full font-bold">دخول / تسجيل</Button>
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
