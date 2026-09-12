import { toast } from "sonner";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

/**
 * Global UI notification store.
 *
 * Holds only the *last* notification for components that want to read it
 * reactively (e.g. rendering an inline banner). It does not queue
 * notifications and does not store server data — for the actual toast UI
 * shown to the user, `showNotification` also triggers Sonner directly, since
 * Sonner keeps its own render queue and doesn't need React state to do it.
 *
 * Flow: error handler -> `showNotification()` -> this store (+ Sonner toast).
 */

export type NotificationType = "success" | "error" | "warning" | "info";

interface Notification {
  type: NotificationType;
  message: string;
  open: boolean;
}

interface NotificationState {
  notification: Notification | null;
  showNotification: (notification: Omit<Notification, "open">) => void;
  hideNotification: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set) => ({
      notification: null,
      showNotification: (notification) => {
        set(
          { notification: { ...notification, open: true } },
          false,
          "notification/showNotification",
        );
        toast[notification.type](notification.message);
      },
      hideNotification: () =>
        set(
          (state) =>
            state.notification ? { notification: { ...state.notification, open: false } } : state,
          false,
          "notification/hideNotification",
        ),
    }),
    { name: "notification-store", enabled: process.env.NODE_ENV === "development" },
  ),
);

/**
 * Convenience function for use outside React components (services, the
 * global error handler, the query client) where calling the hook isn't
 * possible. Equivalent to `useNotificationStore.getState().showNotification`.
 */
export function showNotification(notification: Omit<Notification, "open">): void {
  useNotificationStore.getState().showNotification(notification);
}

/** Non-hook equivalent of `hideNotification`, for use outside components. */
export function hideNotification(): void {
  useNotificationStore.getState().hideNotification();
}
