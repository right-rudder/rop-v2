"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import { FLASH_PARAM, getFlashToast } from "@/lib/toast";

/**
 * Turns `?toast=<code>` (left by a redirecting server action via withFlash)
 * into a toast, then removes the param so a refresh doesn't repeat it.
 * Suspense-wrapped because useSearchParams would otherwise pull the whole
 * layout into client rendering on prerendered routes.
 */
export function FlashToast() {
  return (
    <Suspense fallback={null}>
      <FlashToastReader />
    </Suspense>
  );
}

function FlashToastReader() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const code = params.get(FLASH_PARAM);

  useEffect(() => {
    if (!code) return;
    const input = getFlashToast(code);
    if (input) toast.toast(input);
    const rest = new URLSearchParams(params);
    rest.delete(FLASH_PARAM);
    const query = rest.toString();
    // Keep the fragment: withFlash preserves it so a redirect can still land
    // on an anchor (e.g. "#inquire"), and usePathname doesn't carry it.
    const hash = window.location.hash;
    router.replace(`${pathname}${query ? `?${query}` : ""}${hash}`, { scroll: false });
  }, [code, params, pathname, router, toast]);

  return null;
}
