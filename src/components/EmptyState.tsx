import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
      <div className="mb-6 rounded-full bg-accent/50 p-6">
        <Icon className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-2xl font-bold mb-2 text-card-foreground">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="lg" className="bg-primary hover:bg-primary/90">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
