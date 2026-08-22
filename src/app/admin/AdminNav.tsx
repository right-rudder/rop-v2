"use client";

import { usePathname } from "next/navigation";
import { Chip } from "@/components/ui/Chip";
import { ADMIN_TABS, isAdminTabActive } from "@/lib/admin-nav";

/** Section tabs for the admin area; highlights the tab owning the current path */
export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin sections" className="flex gap-1.5 overflow-x-auto py-3">
      {ADMIN_TABS.map((tab) => {
        const active = isAdminTabActive(pathname, tab.href);
        return (
          <Chip
            key={tab.href}
            href={tab.href}
            active={active}
            aria-current={active ? "page" : undefined}
            className="px-3 py-1 text-xs"
          >
            {tab.label}
          </Chip>
        );
      })}
    </nav>
  );
}
