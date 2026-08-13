import { STATUS_LABELS, type OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const styles: Record<OrderStatus, string> = {
  new: "bg-accent-soft text-accent-foreground",
  confirmed: "bg-primary-soft text-primary",
  printing: "bg-warning/25 text-warning-foreground",
  ready: "bg-success/20 text-success",
  delivered: "bg-success text-success-foreground",
  cancelled: "bg-destructive/15 text-destructive",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap",
        styles[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
