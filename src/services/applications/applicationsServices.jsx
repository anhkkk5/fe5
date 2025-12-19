import { get } from "../../utils/axios/request";

// Lấy danh sách tất cả job mà candidate hiện tại đã ứng tuyển
export const getMyApplications = async () => {
  const result = await get("applications/me");
  return result;
};
