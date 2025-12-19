import { get, post, edit, del } from "../../utils/axios/request";

// Lấy tất cả reviews
export const getAllReviews = async (companyId) => {
  const url = companyId 
    ? `company-reviews/company/${companyId}`
    : "company-reviews";
  const result = await get(url);
  return result;
};

// Lấy stats của công ty
export const getCompanyStats = async (companyId) => {
  const result = await get(`company-reviews/company/${companyId}/stats`);
  return result;
};

// Tạo review mới
export const createReview = async (reviewData) => {
  const result = await post("company-reviews", reviewData);
  return result;
};

// Thêm comment vào review
export const addComment = async (reviewId, content) => {
  const result = await post(`company-reviews/${reviewId}/comments`, { content });
  return result;
};

// Đánh dấu review hữu ích
export const markHelpful = async (reviewId) => {
  const result = await post(`company-reviews/${reviewId}/helpful`);
  return result;
};

// Lấy chi tiết review
export const getReviewDetail = async (reviewId) => {
  const result = await get(`company-reviews/${reviewId}`);
  return result;
};

// Admin: danh sách reviews (lọc theo status/companyId)
export const adminGetReviews = async ({ status, companyId } = {}) => {
  const params = new URLSearchParams();
  if (companyId) params.set("companyId", String(companyId));
  if (status) params.set("status", String(status));
  const qs = params.toString();
  const url = qs ? `company-reviews/admin?${qs}` : "company-reviews/admin";
  return await get(url);
};

// Admin: xem chi tiết review
export const adminGetReviewDetail = async (reviewId) => {
  return await get(`company-reviews/admin/${reviewId}`);
};

// Admin: duyệt review
export const adminApproveReview = async (reviewId) => {
  return await edit(`company-reviews/admin/${reviewId}/approve`, {});
};

// Admin: từ chối review
export const adminRejectReview = async (reviewId) => {
  return await edit(`company-reviews/admin/${reviewId}/reject`, {});
};

// Admin: xoá review
export const adminDeleteReview = async (reviewId) => {
  return await del(`company-reviews/admin/${reviewId}`);
};

// Admin: xoá comment
export const adminDeleteComment = async (commentId) => {
  return await del(`company-reviews/admin/comments/${commentId}`);
};



