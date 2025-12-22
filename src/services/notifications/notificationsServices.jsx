import { get, edit, del } from "../../utils/axios/request";

export const getMyNotifications = async () => {
  return await get("notifications/my");
};

export const markNotificationRead = async (id) => {
  return await edit(`notifications/${id}/read`, {});
};

export const deleteNotification = async (id) => {
  return await del(`notifications/${id}`);
};
