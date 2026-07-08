"use client";

import { useClickSound } from "@/hooks/use-click-sound";

// Anchor that plays the soft UI click on activation — the same tactile
// feedback chanhdai.com gives its icon-button links. Drop-in for a plain <a>,
// so server components can hand off just the interactive bits to the client.
export default function SoundLink({
  onClick,
  ...props
}: React.ComponentProps<"a">) {
  const [click] = useClickSound();

  return (
    <a
      {...props}
      onClick={(event) => {
        click();
        onClick?.(event);
      }}
    />
  );
}
