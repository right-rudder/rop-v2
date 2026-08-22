/** Admin section tabs, in display order. Overview must stay first. */
export type AdminTab = { label: string; href: string };

export const ADMIN_TABS: readonly AdminTab[] = [
  { label: "Overview", href: "/admin" },
  { label: "Submissions", href: "/admin/submissions" },
  { label: "Leads", href: "/admin/leads" },
  { label: "Moderation", href: "/admin/moderation" },
];

/**
 * Whether a tab should be highlighted for the current pathname.
 * Overview is an exact match only; every other tab also owns its children.
 */
export function isAdminTabActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin" || pathname === "/admin/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
