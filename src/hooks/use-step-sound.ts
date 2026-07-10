"use client";

import { useCallback, useEffect, useRef } from "react";

// Soft synthesized footstep for the walkable floor: a short, low sine thump
// with a falling pitch, alternating slightly between "feet". Synthesized via
// WebAudio instead of an <audio> asset (cf. use-click-sound.ts): steps fire
// every ~140ms while the marker walks, and overlapping oscillator nodes mix
// cleanly where stacked <audio> elements would stutter.
export function useStepSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const parityRef = useRef(0);

  useEffect(() => {
    return () => {
      // browsers cap concurrent AudioContexts; release ours on unmount
      // (the story cover remounts the floor on every chapter visit)
      void ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
    };
  }, []);

  const play = useCallback(() => {
    // NOTE: like the click sound, deliberately NOT gated on
    // prefers-reduced-motion — that guard would silence audio for anyone
    // with "reduce animations" enabled, which isn't what they asked for.
    try {
      const Ctor =
        window.AudioContext ??
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return;
      const ctx = (ctxRef.current ??= new Ctor());
      if (ctx.state === "suspended") void ctx.resume();

      const t = ctx.currentTime;
      const parity = (parityRef.current ^= 1);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      // alternate feet: two nearby low pitches, both sweeping down
      osc.frequency.setValueAtTime(parity ? 172 : 148, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.09);
      // 12ms attack so the thump never clicks, then a fast natural decay
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.09, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } catch {
      // no audio support; ignore
    }
  }, []);

  return [play] as const;
}
