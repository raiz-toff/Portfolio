"use client";

// Phone number kept base64-encoded in source (see data/profile.ts) and
// decoded only in the browser, so it isn't sitting in plaintext for scrapers
// to grep out of the page source or bundle.

import { useSyncExternalStore } from "react";

import { IconBox } from "./overview-item";
import { PhoneIcon } from "./icons";

const subscribeNever = () => () => {};

export function PhoneItem({ phoneB64 }: { phoneB64: string }) {
  const phone = useSyncExternalStore<string | null>(
    subscribeNever,
    () => atob(phoneB64),
    () => null,
  );

  return (
    <div className="flex items-center gap-4 font-mono text-sm">
      <IconBox>
        <PhoneIcon />
      </IconBox>
      <p className="text-balance">
        {phone ? (
          <a className="link" href={`tel:${phone}`}>
            {formatPhoneNumber(phone)}
          </a>
        ) : (
          <span aria-hidden>············</span>
        )}
      </p>
    </div>
  );
}

function formatPhoneNumber(e164: string): string {
  const m = e164.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  return m ? `+1 ${m[1]}-${m[2]}-${m[3]}` : e164;
}
