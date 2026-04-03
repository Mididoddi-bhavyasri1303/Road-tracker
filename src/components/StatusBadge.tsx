import { cn } from "@/lib/utils";

const statusConfig = {
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/30" },
  in_progress: { label: "In Progress", className: "bg-info/10 text-info border-info/30" },
  completed: { label: "Completed", className: "bg-success/10 text-success border-success/30" },
};

const StatusBadge = ({ status }: { status: string }) => {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", config.className)}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
