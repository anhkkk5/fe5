import React, { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, Button, Card, Col, Input, List, Row, Spin, Tabs, Typography, message } from "antd";
import { useSearchParams } from "react-router-dom";
import { getCookie } from "../../helpers/cookie";
import { decodeJwt } from "../../services/auth/authServices";
import { getAllUsers } from "../../services/users/usersServices";
import {
  getConversationMessages,
  getMyConversations,
  getOrCreateConversationWith,
  sendChatMessage,
} from "../../services/chat/chatServices.jsx";
import { connectSocket } from "../../realtime/socketClient";

const { Title, Text } = Typography;

const getUserDisplayName = (u) => {
  const fullName = (u?.fullName || "").trim();
  if (fullName) return fullName;

  const name = (u?.name || "").trim();
  if (name && name.length > 1) return name;

  const email = (u?.email || "").trim();
  if (email) return email.split("@")[0] || email;

  return "Người dùng";
};

function ChatPage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messagesList, setMessagesList] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchUser, setSearchUser] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  const myUserId = useMemo(() => {
    const cookieId = getCookie("id");
    if (cookieId) return String(cookieId);
    const token = getCookie("token") || localStorage.getItem("token") || "";
    const payload = token ? decodeJwt(token) : null;
    return payload?.sub ? String(payload.sub) : payload?.id ? String(payload.id) : "";
  }, []);

  const initialConversationId = useMemo(() => {
    const id = searchParams?.get("conversationId");
    return id ? String(id) : "";
  }, [searchParams]);

  const allUsersById = useMemo(() => {
    const map = new Map();
    (Array.isArray(allUsers) ? allUsers : []).forEach((u) => {
      if (u?.id != null) map.set(String(u.id), u);
    });
    return map;
  }, [allUsers]);

  const enrichUser = (u) => {
    if (!u) return null;
    const id = u?.id != null ? String(u.id) : "";
    if (!id) return u;
    const full = allUsersById.get(id);
    return full ? { ...u, ...full } : u;
  };

  const otherUserFromConversation = (conv) => {
    if (!conv) return null;
    const u1 = conv.user1;
    const u2 = conv.user2;
    if (!u1 || !u2) return null;
    const u1id = u1?.id != null ? String(u1.id) : "";
    const u2id = u2?.id != null ? String(u2.id) : "";
    if (myUserId && u1id === myUserId) return enrichUser(u2);
    if (myUserId && u2id === myUserId) return enrichUser(u1);
    return enrichUser(u2);
  };

  const scrollToBottom = () => {
    try {
      const el = listRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    } catch (_e) {}
  };

  const loadConversationsAndUsers = async () => {
    try {
      setLoading(true);
      const [convData, usersData] = await Promise.allSettled([
        getMyConversations(),
        getAllUsers(),
      ]);

      const convList = convData.status === "fulfilled" && Array.isArray(convData.value) ? convData.value : [];
      const userList = usersData.status === "fulfilled" && Array.isArray(usersData.value) ? usersData.value : [];

      setConversations(convList);
      setAllUsers(userList);
      setUsers(
        userList.filter(
          (u) =>
            String(u?.id || "") !== String(myUserId || "") &&
            String(u?.role || "").toLowerCase() !== "admin",
        ),
      );

      if (initialConversationId) {
        const found = convList.find((c) => String(c?.id || "") === String(initialConversationId));
        if (found) {
          setActiveConversation(found);
          return;
        }
        setActiveConversation({ id: Number(initialConversationId) });
        return;
      }

      if (!activeConversation && convList.length > 0) {
        setActiveConversation(convList[0]);
      }
    } catch (_e) {
      message.error("Không thể tải dữ liệu chat");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    if (!conversationId) return;
    try {
      setLoadingMessages(true);
      const data = await getConversationMessages(conversationId);
      const list = Array.isArray(data) ? data : [];
      setMessagesList(list);
      setTimeout(scrollToBottom, 0);
    } catch (_e) {
      message.error("Không thể tải tin nhắn");
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    connectSocket();
    loadConversationsAndUsers();
  }, []);

  useEffect(() => {
    if (!activeConversation?.id) return;
    loadMessages(activeConversation.id);
  }, [activeConversation?.id]);

  useEffect(() => {
    const onChatMessage = (evt) => {
      const payload = evt?.detail;
      if (!payload) return;

      const convId = payload?.conversationId != null ? String(payload.conversationId) : payload?.conversation?.id != null ? String(payload.conversation.id) : "";
      const activeId = activeConversation?.id != null ? String(activeConversation.id) : "";
      if (convId && activeId && convId === activeId) {
        setMessagesList((prev) => [...(Array.isArray(prev) ? prev : []), payload]);
        setTimeout(scrollToBottom, 0);
      }

      setConversations((prev) => {
        const list = Array.isArray(prev) ? [...prev] : [];
        const idx = list.findIndex((c) => String(c.id) === convId);
        if (idx >= 0) {
          const updated = { ...list[idx], lastMessage: payload };
          list.splice(idx, 1);
          return [updated, ...list];
        }
        return list;
      });
    };

    try {
      window.addEventListener("chat:message", onChatMessage);
    } catch (_e) {}

    return () => {
      try {
        window.removeEventListener("chat:message", onChatMessage);
      } catch (_e) {}
    };
  }, [activeConversation?.id]);

  const filteredUsers = useMemo(() => {
    const q = (searchUser || "").toLowerCase().trim();
    if (!q) return users;
    return users.filter((u) => {
      const name = (u?.fullName || u?.name || "").toLowerCase();
      const email = (u?.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [users, searchUser]);

  const startChatWith = async (otherUserId) => {
    try {
      const conv = await getOrCreateConversationWith(otherUserId);
      if (!conv?.id) return;
      setConversations((prev) => {
        const list = Array.isArray(prev) ? [...prev] : [];
        const exists = list.some((c) => String(c.id) === String(conv.id));
        return exists ? list : [conv, ...list];
      });
      setActiveConversation(conv);
    } catch (e) {
      if (e?.response?.status === 403) {
        message.error("Bạn cần kết bạn trước khi chat");
        return;
      }
      message.error("Không thể bắt đầu chat");
    }
  };

  const handleSend = async () => {
    const content = (text || "").trim();
    if (!content) return;
    if (!activeConversation?.id) return;
    try {
      setSending(true);
      const sent = await sendChatMessage(activeConversation.id, content);
      setText("");
      if (sent) {
        setMessagesList((prev) => [...(Array.isArray(prev) ? prev : []), sent]);
        setTimeout(scrollToBottom, 0);
      }
    } catch (e) {
      if (e?.response?.status === 403) {
        message.error("Bạn cần kết bạn trước khi chat");
        return;
      }
      message.error("Gửi tin nhắn thất bại");
    } finally {
      setSending(false);
    }
  };

  const activeOther = otherUserFromConversation(activeConversation);

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <Row gutter={16}>
        <Col xs={24} md={8} lg={7}>
          <Card bodyStyle={{ padding: 12 }}>
            <Title level={4} style={{ marginTop: 0, marginBottom: 12 }}>
              Chat
            </Title>
            <Tabs
              defaultActiveKey="conversations"
              items={[
                {
                  key: "conversations",
                  label: "Đoạn chat",
                  children: (
                    <List
                      dataSource={Array.isArray(conversations) ? conversations : []}
                      renderItem={(c) => {
                        const other = otherUserFromConversation(c);
                        const isActive = String(c?.id) === String(activeConversation?.id);
                        return (
                          <List.Item
                            style={{
                              cursor: "pointer",
                              padding: "10px 8px",
                              borderRadius: 8,
                              background: isActive ? "#f0f5ff" : "transparent",
                            }}
                            onClick={() => setActiveConversation(c)}
                          >
                            <div style={{ width: "100%", display: "flex", gap: 10, alignItems: "center" }}>
                              <Avatar src={other?.avatarUrl || undefined} size={34}>
                                {String(getUserDisplayName(other) || "").charAt(0).toUpperCase()}
                              </Avatar>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <Text strong ellipsis>
                                    {getUserDisplayName(other)}
                                  </Text>
                                </div>
                                {c?.lastMessage?.content ? (
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    {c.lastMessage.content}
                                  </Text>
                                ) : null}
                              </div>
                            </div>
                          </List.Item>
                        );
                      }}
                    />
                  ),
                },
                {
                  key: "users",
                  label: "Tìm người",
                  children: (
                    <div>
                      <Input
                        placeholder="Tìm theo tên/email"
                        value={searchUser}
                        onChange={(e) => setSearchUser(e.target.value)}
                        style={{ marginBottom: 10 }}
                      />
                      <List
                        dataSource={filteredUsers}
                        renderItem={(u) => (
                          <List.Item
                            style={{ cursor: "pointer", padding: "10px 8px" }}
                            onClick={() => startChatWith(u.id)}
                          >
                            <div style={{ width: "100%", display: "flex", gap: 10, alignItems: "center" }}>
                              <Avatar src={u?.avatarUrl || undefined} size={34}>
                                {String(getUserDisplayName(u) || "").charAt(0).toUpperCase()}
                              </Avatar>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <Text strong ellipsis>
                                  {getUserDisplayName(u)}
                                </Text>
                                <div>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    {u?.email || ""}
                                  </Text>
                                </div>
                              </div>
                            </div>
                          </List.Item>
                        )}
                      />
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} md={16} lg={17}>
          <Card bodyStyle={{ padding: 12, height: "calc(100vh - 160px)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "4px 4px 10px 4px", borderBottom: "1px solid #f0f0f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {activeOther ? (
                  <Avatar src={activeOther?.avatarUrl || undefined} size={36}>
                    {String(getUserDisplayName(activeOther) || "").charAt(0).toUpperCase()}
                  </Avatar>
                ) : (
                  <Avatar size={36} />
                )}
                <Text strong>
                  {activeOther ? getUserDisplayName(activeOther) : "Chọn một cuộc trò chuyện"}
                </Text>
              </div>
            </div>

            <div
              ref={listRef}
              style={{ flex: 1, overflowY: "auto", padding: 12, background: "#fafafa" }}
            >
              {loadingMessages ? (
                <div style={{ textAlign: "center", padding: 16 }}>
                  <Spin />
                </div>
              ) : null}

              {(Array.isArray(messagesList) ? messagesList : []).map((m) => {
                const senderId = m?.sender?.id != null ? String(m.sender.id) : m?.senderId != null ? String(m.senderId) : "";
                const mine = myUserId && senderId && String(senderId) === String(myUserId);
                return (
                  <div
                    key={m?.id || `${m?.created_at || m?.createdAt}-${Math.random()}`}
                    style={{
                      display: "flex",
                      justifyContent: mine ? "flex-end" : "flex-start",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "75%",
                        padding: "8px 12px",
                        borderRadius: 14,
                        background: mine ? "#1677ff" : "#ffffff",
                        color: mine ? "#fff" : "#111",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {m?.content}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 8, paddingTop: 10 }}>
              <Input.TextArea
                value={text}
                onChange={(e) => setText(e.target.value)}
                autoSize={{ minRows: 1, maxRows: 4 }}
                placeholder="Nhập tin nhắn..."
                onPressEnter={(e) => {
                  if (e.shiftKey) return;
                  e.preventDefault();
                  handleSend();
                }}
                disabled={!activeConversation?.id}
              />
              <Button type="primary" onClick={handleSend} loading={sending} disabled={!activeConversation?.id}>
                Gửi
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default ChatPage;