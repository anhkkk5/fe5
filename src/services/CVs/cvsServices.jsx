import { get, post, edit, del } from "../../utils/axios/request";

// Lấy tất cả CV của user hiện tại
export const getMyCVs = async () => {
  const result = await get("cvs/me");
  return result;
};

// Tạo CV mới
export const createCV = async (cvData) => {
  const result = await post("cvs/me", cvData);
  return result;
};

// Cập nhật CV
export const updateCV = async (cvId, cvData) => {
  const result = await edit(`cvs/me/${cvId}`, cvData);
  return result;
};

// Xóa CV
export const deleteCV = async (cvId) => {
  const result = await del(`cvs/me/${cvId}`);
  return result;
};

// Lấy chi tiết CV (cho recruiter/admin)
export const getCVById = async (cvId) => {
  const result = await get(`cvs/${cvId}`);
  return result;
};


