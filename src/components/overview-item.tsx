// Shared row primitives for the Overview panel (used by static rows and the
// live local-time row).

export function IconBox({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-muted-foreground/15 bg-muted ring-1 ring-line ring-offset-1 ring-offset-background [&_svg]:size-4 [&_svg]:text-muted-foreground">
      {children}
    </span>
  );
}

export function Item({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 font-mono text-sm">
      <IconBox>{icon}</IconBox>
      <p className="text-balance">{children}</p>
    </div>
  );
}
