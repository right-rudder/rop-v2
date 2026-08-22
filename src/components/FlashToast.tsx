"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import { FLASH_PARAM, FLASH_TOASTS } from "@/lib/toast";

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
    const input = FLASH_TOASTS[code];
    if (input) toast.toast(input);
    const rest = new URLSearchParams(params);
    rest.delete(FLASH_PARAM);
    const query = rest.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [code, params, pathname, router, toast]);

  return null;
}
