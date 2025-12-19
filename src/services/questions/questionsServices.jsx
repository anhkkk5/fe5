import { get, post, edit, del } from "../../utils/axios/request";

const API_BASE = "/questions";

export const questionsServices = {
  // Lấy tất cả câu hỏi
  getAllQuestions: async (category) => {
    const path = category ? `${API_BASE}?category=${encodeURIComponent(category)}` : API_BASE;
    return get(path);
  },

  // Lấy câu hỏi theo skill
  getQuestionsBySkill: async (skillCategory) => {
    return get(`${API_BASE}/skill/${encodeURIComponent(skillCategory)}`);
  },

  // Lấy chi tiết câu hỏi
  getQuestionById: async (id) => {
    return get(`${API_BASE}/${id}`);
  },

  // Tạo câu hỏi
  createQuestion: async (data) => {
    return post(API_BASE, data);
  },

  // Cập nhật câu hỏi
  updateQuestion: async (id, data) => {
    return edit(`${API_BASE}/${id}`, data);
  },

  // Xóa câu hỏi
  deleteQuestion: async (id) => {
    return del(`${API_BASE}/${id}`);
  },

  // Lấy danh sách các skill categories
  getSkillCategories: async () => {
    return get(`${API_BASE}/skill-categories/list`);
  },
};

