import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { Container } from "@/components/ui/Container";
import { AdminNav } from "./AdminNav";

/**
 * Shared frame for /admin/*: the section tab bar above every page.
 *
 * The guard here is a convenience only. Layouts don't re-render on child
 * navigations and don't decide whether a page renders, so every /admin page
 * and every admin Server Action keeps its own getCurrentUser/isAdmin check,
 * and the database's RLS policies remain the real boundary.
 *
 * Anonymous visitors are deliberately left to the pages: a layout can't see
 * the pathname, and a redirect thrown here would win over the page's and lose
 * the precise `?next=` target.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const viewer = await getCurrentUser();
  if (viewer && !isAdmin(viewer)) notFound();

  return (
    <>
      <div className="border-b border-line bg-surface">
        <Container size="narrow" className="flex items-center gap-3">
          <ShieldCheck size={15} className="shrink-0 text-accent-ink" aria-hidden />
          <AdminNav />
        </Container>
      </div>
      {children}
    </>
  );
}
