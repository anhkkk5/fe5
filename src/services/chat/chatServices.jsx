import { get, post } from "../../utils/axios/request";

export const getMyConversations = async () => {
  return await get("chat/conversations/my");
};

export const getOrCreateConversationWith = async (otherUserId) => {
  return await post(`chat/conversations/with/${otherUserId}`, {});
};

export const getConversationMessages = async (conversationId) => {
  return await get(`chat/conversations/${conversationId}/messages`);
};

export const sendChatMessage = async (conversationId, content) => {
  return await post(`chat/conversations/${conversationId}/messages`, { content });
};