"use client";

import { track } from "@vercel/analytics";
import { useState } from "react";

interface Props {
  text: string | (() => string);
  label: string;
  copiedLabel: string;
  /** Sent with the `copy_output` analytics event. */
  kind: string;
  small?: boolean;
}

export default function CopyButton({ text, label, copiedLabel, kind, small }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const value = typeof text === "function" ? text() : text;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      track("copy_output", { kind });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable (insecure context / denied) */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`rounded-lg border border-slate-300 font-medium hover:border-indigo-500 hover:text-indigo-700 dark:border-slate-600 dark:hover:text-indigo-300 ${
        small ? "px-2 py-0.5 text-xs" : "px-3 py-1.5 text-sm"
      }`}
    >
      <span aria-live="polite">{copied ? `✓ ${copiedLabel}` : label}</span>
    </button>
  );
}
