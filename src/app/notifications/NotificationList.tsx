"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Check, CheckCheck } from "lucide-react";
import type { AppNotification } from "@/lib/types";
import { markNotificationsRead } from "@/app/actions/claims";
import { notificationLinkLabel } from "@/lib/notifications";
import { useActionToast } from "@/components/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function NotificationList({
  notifications,
  /** Total unread for this user, which can exceed what the capped list shows. */
  unreadCount,
}: {
  notifications: AppNotification[];
  unreadCount: number;
}) {
  // One action for both buttons: sending no id marks every unread row read.
  const [state, action, pending] = useActionState(markNotificationsRead, {});
  useActionToast(state, { errorTitle: "Couldn't update notifications" });

  return (
    <div className="space-y-5">
      {unreadCount > 0 && (
        <form action={action} className="flex justify-end">
          <Button type="submit" variant="ghost" size="sm" disabled={pending}>
            <CheckCheck size={15} />
            {pending ? "Marking…" : "Mark all as read"}
          </Button>
        </form>
      )}

      <ul className="space-y-4">
        {notifications.map((notification) => {
          const unread = !notification.readAt;
          return (
            <li key={notification.id}>
              <Card
                className={cn(
                  "flex flex-col gap-3 p-6 sm:flex-row sm:items-start sm:justify-between",
                  unread && "border-accent/30 bg-accent-soft/40",
                )}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-bold tracking-tight text-ink">
                      {notification.title}
                    </h2>
                    {unread && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-ink">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-ink/90">{notification.body}</p>
                  <p className="flex flex-wrap items-center gap-3 pt-1">
                    <time
                      className="font-mono text-xs text-muted"
                      dateTime={notification.createdAt}
                    >
                      {formatDate(notification.createdAt)}
                    </time>
                    {notification.href && (
                      <Link
                        href={notification.href}
                        className="text-sm text-accent-ink hover:underline"
                      >
                        {notificationLinkLabel(notification.type)}
                      </Link>
                    )}
                  </p>
                </div>

                {unread && (
                  <form action={action} className="shrink-0">
                    <input type="hidden" name="notificationId" value={notification.id} />
                    <Button type="submit" variant="secondary" size="sm" disabled={pending}>
                      <Check size={15} />
                      Mark read
                    </Button>
                  </form>
                )}
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
