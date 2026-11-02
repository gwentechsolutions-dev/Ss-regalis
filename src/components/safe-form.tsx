"use client";
import type { ComponentPropsWithRef } from "react";
import { useReady } from "./use-ready";
/** Prevent pre-hydration submission and keep private form values out of query strings. */
export function SafeForm({
  children,
  ...props
}: ComponentPropsWithRef<"form">) {
  const ready = useReady();
  return (
    <form {...props} method="post">
      <fieldset disabled={!ready} style={{ display: "contents" }}>
        {children}
      </fieldset>
    </form>
  );
}
