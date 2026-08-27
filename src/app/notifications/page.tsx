import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getNotificationsForUser, getUnreadNotificationCount } from "@/lib/data";
import { NotificationList } from "./NotificationList";
import { PageHero } from "@/components/PageHero";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false },
};

export default async function NotificationsPage() {
  const viewer = await getCurrentUser();
  if (!viewer) redirect("/login?next=/notifications");

  // The list is capped, so the unread total comes from its own count query —
  // filtering the page would undercount anyone with unread items further back.
  const [notifications, unread] = await Promise.all([
    getNotificationsForUser(viewer.id),
    getUnreadNotificationCount(viewer.id),
  ]);

  return (
    <div className="pb-20">
      <PageHero
        size="narrow"
        eyebrow="Your account"
        title="Notifications"
        meta={
          <span>
            {unread > 0
              ? `${unread} unread`
              : notifications.length > 0
                ? "Nothing new"
                : "Nothing yet"}
          </span>
        }
      />
      <Container size="narrow" className="py-12">
        {notifications.length === 0 ? (
          <Card className="p-10 text-center">
            <p className="font-display text-xl font-bold tracking-tight text-ink">
              No notifications yet
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              We&apos;ll let you know here when a listing claim is reviewed, or when a listing
              is assigned to your account.
            </p>
          </Card>
        ) : (
          <NotificationList notifications={notifications} unreadCount={unread} />
        )}
      </Container>
    </div>
  );
}
