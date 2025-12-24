import { get, post } from "../../utils/axios/request";

export const getFeedPostReactionSummary = async (postId) => {
  return await get(`feed-post-reactions/${postId}/summary`);
};

export const getMyFeedPostReaction = async (postId) => {
  return await get(`feed-post-reactions/${postId}/me`);
};

export const reactFeedPost = async (postId, type) => {
  return await post(`feed-post-reactions/${postId}`, { type });
};

export const listFriendsReactions = async (postId, type) => {
  const query = type ? `?type=${encodeURIComponent(type)}` : "";
  return await get(`feed-post-reactions/${postId}/friends${query}`);
};
