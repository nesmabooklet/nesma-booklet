import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

export function Brand({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <Link to="/" className={cn("flex items-center gap-2", className)}>
      <img
        src={logo}
        alt="شعار Nesma Booklets"
        width={64}
        height={64}
        className={cn("object-contain", size === "sm" ? "size-9" : "size-11")}
      />
      <span className="flex flex-col leading-tight">
        <span
          className={cn(
            "font-display font-extrabold text-brand",
            size === "sm" ? "text-base" : "text-lg",
          )}
        >
          Nesma Booklets
        </span>
        <span className="text-[11px] font-medium text-muted-foreground">
          طباعة بوكليتات المدارس
        </span>
      </span>
    </Link>
  );
}
