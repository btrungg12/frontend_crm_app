import { apiRequest } from "./client";

type NotificationQuery = {
  isRead?: boolean;
};

export async function getNotifications(params: NotificationQuery = {}) {
  return await apiRequest("/notifications", {
    query: {
      isRead: params.isRead
    }
  });
}

export async function getUnreadCount() {
  return await apiRequest("/notifications/unread-count");
}

export async function markAllNotificationsAsRead() {
  return await apiRequest("/notifications/read-all", {
    method: "PATCH"
  });
}

export async function markNotificationAsRead(notificationId: string) {
  return await apiRequest(`/notifications/${notificationId}/read`, {
    method: "PATCH"
  });
}
