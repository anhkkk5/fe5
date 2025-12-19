import { get, post, edit, del } from "../../utils/axios/request";

const API_BASE = "/question-sets";

export const questionSetsServices = {
  // Lấy tất cả question sets
  getAllQuestionSets: async (category) => {
    const path = category
      ? `${API_BASE}?category=${encodeURIComponent(category)}`
      : API_BASE;
    return get(path);
  },

  // Lấy chi tiết question set
  getQuestionSetById: async (id) => {
    return get(`${API_BASE}/${id}`);
  },

  // Lấy câu hỏi từ question set
  getQuestionsFromSet: async (id) => {
    return get(`${API_BASE}/${id}/questions`);
  },

  // Tạo question set
  createQuestionSet: async (data) => {
    return post(API_BASE, data);
  },

  // Cập nhật question set
  updateQuestionSet: async (id, data) => {
    return edit(`${API_BASE}/${id}`, data);
  },

  // Xóa question set
  deleteQuestionSet: async (id) => {
    return del(`${API_BASE}/${id}`);
  },
};

