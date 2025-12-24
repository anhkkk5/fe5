import { del, get, post } from "../../utils/axios/request";

export const getFeedPostComments = async (postId) => {
  const qs = new URLSearchParams();
  qs.append("postId", String(postId));
  return await get(`feed-post-comments?${qs.toString()}`);
};

export const createFeedPostComment = async (postId, payload) => {
  return await post(`feed-post-comments/${postId}`, payload);
};

export const deleteFeedPostComment = async (commentId) => {
  return await del(`feed-post-comments/${commentId}`);
};
