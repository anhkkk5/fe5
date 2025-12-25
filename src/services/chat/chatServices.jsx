  import { get, post, postForm } from "../../utils/axios/request";

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

export const sendChatAttachment = async (conversationId, file, content = "") => {
  const form = new FormData();
  form.append("file", file);
  if (typeof content === "string" && content.trim()) {
    form.append("content", content);
  }
  return await postForm(`chat/conversations/${conversationId}/messages/attachment`, form);
};