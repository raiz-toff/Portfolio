"use client";

import { useEffect, useState } from "react";

export default function FlipSentences({
  sentences,
  className = "",
}: {
  sentences: string[];
  className?: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % sentences.length),
      3000
    );
    return () => clearInterval(id);
  }, [sentences.length]);

  return (
    <div className={className}>
      <p
        key={index}
        className="flip-item font-mono text-sm text-balance text-muted-foreground"
      >
        {sentences[index]}
      </p>
    </div>
  );
}
