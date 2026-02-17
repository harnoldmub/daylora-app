import type { ReactNode } from "react";

type AdminPageHeaderProps = {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
};

export function AdminPageHeader({ title, description, actions }: AdminPageHeaderProps) {
  return (
    <div className="rounded-2xl border bg-card/80 backdrop-blur px-6 py-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">{title}</h1>
          {description ? <p className="text-muted-foreground mt-1">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

