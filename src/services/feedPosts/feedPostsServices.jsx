import { del, edit, get, post } from "../../utils/axios/request";

export const getFeedPosts = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", String(params.page));
  if (params.limit) queryParams.append("limit", String(params.limit));
  if (params.type) queryParams.append("type", params.type);
  if (params.keyword) queryParams.append("keyword", params.keyword);

  const queryString = queryParams.toString();
  const url = queryString ? `feed-posts?${queryString}` : "feed-posts";
  return await get(url);
};

export const getFeedPostDetail = async (id) => {
  return await get(`feed-posts/${id}`);
};

export const createFeedPost = async (payload) => {
  return await post("feed-posts", payload);
};

export const updateFeedPost = async (id, payload) => {
  return await edit(`feed-posts/${id}`, payload);
};

export const deleteFeedPost = async (id) => {
  return await del(`feed-posts/${id}`);
};

export const shareFeedPost = async (id) => {
  return await post(`feed-posts/${id}/share`);
};
