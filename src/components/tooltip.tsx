// CSS-only tooltip in chanhdai.com's style: inverted bubble above the
// trigger with a rotated-square arrow. Shows on hover and keyboard focus.
export default function Tooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span className="group/tooltip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 scale-95 rounded-lg bg-foreground px-3 py-1.5 text-sm whitespace-nowrap text-background opacity-0 transition-[opacity,transform] duration-150 group-hover/tooltip:scale-100 group-hover/tooltip:opacity-100 group-focus-within/tooltip:scale-100 group-focus-within/tooltip:opacity-100"
      >
        {label}
        <span
          className="absolute top-full left-1/2 -mt-1.25 size-2.5 -translate-x-1/2 rotate-45 rounded-br-sm bg-foreground"
          aria-hidden
        />
      </span>
    </span>
  );
}
