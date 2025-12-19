import { get, del, post, edit } from "../../utils/axios/request";

export const getAllPosts = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.category) queryParams.append("category", params.category);
  if (params.keyword) queryParams.append("keyword", params.keyword);
  if (params.status) queryParams.append("status", params.status);

  const queryString = queryParams.toString();
  const url = queryString ? `posts?${queryString}` : "posts";
  const result = await get(url);
  return result;
};

export const getPostDetail = async (idOrSlug) => {
  // Thử lấy theo slug trước
  try {
    const result = await get(`posts/slug/${idOrSlug}`);
    return result;
  } catch (error) {
    // Nếu không tìm thấy theo slug, thử theo ID
    const result = await get(`posts/${idOrSlug}`);
    return result;
  }
};

export const deletePost = async (id) => {
  const result = await del(`posts/${id}`);
  return result;
};

export const createPost = async (options) => {
  const result = await post("posts", options);
  return result;
};

export const updatePost = async (id, options) => {
  const result = await edit(`posts/${id}`, options);
  return result;
};

