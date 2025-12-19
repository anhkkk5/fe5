import { get, post, edit, del } from "../../utils/axios/request";

const API_BASE = "/quizzes";

export const quizzesServices = {
  // Candidate: Lấy danh sách quiz với filter
  getQuizzesForCandidate: async (category, completionStatus) => {
    let path = `${API_BASE}/candidate/list`;
    const params = [];
    if (category) params.push(`category=${encodeURIComponent(category)}`);
    if (completionStatus) params.push(`completionStatus=${completionStatus}`);
    if (params.length > 0) path += `?${params.join("&")}`;
    return get(path);
  },

  // Candidate: Lấy chi tiết quiz
  getQuizById: async (id) => {
    return get(`${API_BASE}/${id}`);
  },

  // Candidate: Submit bài làm
  submitQuiz: async (id, answers) => {
    return post(`${API_BASE}/${id}/submit`, { answers });
  },

  // Candidate: Lấy kết quả
  getQuizResult: async (id) => {
    return get(`${API_BASE}/${id}/result`);
  },

  // Candidate: Lấy tất cả kết quả
  getMyResults: async () => {
    return get(`${API_BASE}/candidate/my-results`);
  },

  // Candidate: Xóa attempt để làm lại
  deleteAttempt: async (id) => {
    return del(`${API_BASE}/${id}/attempt`);
  },

  // Company: Lấy tất cả quiz
  getAllQuizzes: async () => {
    return get(API_BASE);
  },

  // Company: Tạo quiz
  createQuiz: async (data) => {
    return post(API_BASE, data);
  },

  // Company: Cập nhật quiz
  updateQuiz: async (id, data) => {
    return edit(`${API_BASE}/${id}`, data);
  },

  // Company: Xóa quiz
  deleteQuiz: async (id) => {
    return del(`${API_BASE}/${id}`);
  },
};

