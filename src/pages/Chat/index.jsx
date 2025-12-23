import React, { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, Button, Card, Col, Input, List, Row, Spin, Tabs, Typography, message } from "antd";
import { getCookie } from "../../helpers/cookie";
import { decodeJwt } from "../../services/auth/authServices";
import { getAllUsers } from "../../services/users/usersServices";
import {
  getConversationMessages,
  getMyConversations,
  getOrCreateConversationWith,
  sendChatMessage,
} from "../../services/chat/chatServices";
import { connectSocket, getSocket } from "../../realtime/socketClient";

const { Title, Text } = Typography;

function ChatPage() {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messagesList, setMessagesList] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchUser, setSearchUser] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const typingTimerRef = useRef(null);

  const [typingState, setTypingState] = useState({});
  const [seenState, setSeenState] = useState({});

  const userType = getCookie("userType");

  const myUserId = useMemo(() => {
    const cookieId = getCookie("id");
    if (cookieId) return String(cookieId);
    const token = getCookie("token") || localStorage.getItem("token") || "";
    const payload = token ? decodeJwt(token) : null;
    return payload?.sub ? String(payload.sub) : payload?.id ? String(payload.id) : "";
  }, []);

  const otherUserFromConversation = (conv) => {
    if (!conv) return null;
    const u1 = conv.user1;
    const u2 = conv.user2;
    if (!u1 || !u2) return null;
    const u1id = u1?.id != null ? String(u1.id) : "";
    const u2id = u2?.id != null ? String(u2.id) : "";
    if (myUserId && u1id === myUserId) return u2;
    if (myUserId && u2id === myUserId) return u1;
    return u2;
  };

  const usersById = useMemo(() => {
    const m = new Map();
    (Array.isArray(users) ? users : []).forEach((u) => {
      if (u?.id != null) m.set(String(u.id), u);
    });
    return m;
  }, [users]);

  const getUserMeta = (u) => {
    if (!u) return { name: "Người dùng", avatarUrl: null };
    const id = u?.id != null ? String(u.id) : "";
    const fromList = id ? usersById.get(id) : null;
    const name =
      fromList?.fullName ||
      fromList?.name ||
      u?.fullName ||
      u?.name ||
      u?.email ||
      "Người dùng";
    const avatarUrl = fromList?.avatarUrl || u?.avatarUrl || null;
    return { name, avatarUrl };
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
      setUsers(
        userList
          .filter((u) => u?.role === "candidate")
          .filter((u) => String(u?.id || "") !== String(myUserId || "")),
      );

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
    if (!userType) {
      message.warning("Vui lòng đăng nhập để chat");
      return;
    }
    if (userType !== "candidate") {
      message.warning("Chỉ ứng viên mới sử dụng tính năng chat");
      return;
    }
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

  useEffect(() => {
    const onTyping = (evt) => {
      const payload = evt?.detail;
      if (!payload) return;
      const convId = payload?.conversationId != null ? String(payload.conversationId) : "";
      if (!convId) return;
      setTypingState((prev) => ({
        ...(prev || {}),
        [convId]: {
          fromUserId: payload?.fromUserId != null ? String(payload.fromUserId) : "",
          isTyping: !!payload?.isTyping,
        },
      }));
    };

    const onSeen = (evt) => {
      const payload = evt?.detail;
      if (!payload) return;
      const convId = payload?.conversationId != null ? String(payload.conversationId) : "";
      if (!convId) return;
      setSeenState((prev) => ({
        ...(prev || {}),
        [convId]: {
          byUserId: payload?.byUserId != null ? String(payload.byUserId) : "",
          lastMessageId: payload?.lastMessageId ?? null,
          seenAt: payload?.seenAt || new Date().toISOString(),
        },
      }));
    };

    try {
      window.addEventListener("chat:typing", onTyping);
      window.addEventListener("chat:seen", onSeen);
    } catch (_e) {}

    return () => {
      try {
        window.removeEventListener("chat:typing", onTyping);
        window.removeEventListener("chat:seen", onSeen);
      } catch (_e) {}
    };
  }, []);

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
        const backendMsg = e?.response?.data?.message;
        message.error(
          backendMsg
            ? Array.isArray(backendMsg)
              ? backendMsg.join(", ")
              : backendMsg
            : "Cần nâng cấp Prime để chat với người lạ",
        );
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
      try {
        const s = getSocket();
        const other = otherUserFromConversation(activeConversation);
        if (s && other?.id != null) {
          s.emit("chat:typing", {
            conversationId: activeConversation.id,
            toUserId: other.id,
            isTyping: false,
          });
        }
      } catch (_e) {}
      if (sent) {
        setMessagesList((prev) => [...(Array.isArray(prev) ? prev : []), sent]);
        setTimeout(scrollToBottom, 0);
      }
    } catch (e) {
      if (e?.response?.status === 403) {
        const backendMsg = e?.response?.data?.message;
        message.error(
          backendMsg
            ? Array.isArray(backendMsg)
              ? backendMsg.join(", ")
              : backendMsg
            : "Cần nâng cấp Prime để chat với người lạ",
        );
        return;
      }
      message.error("Gửi tin nhắn thất bại");
    } finally {
      setSending(false);
    }
  };

  const activeOther = otherUserFromConversation(activeConversation);
  const activeOtherMeta = getUserMeta(activeOther);
  const activeConvId = activeConversation?.id != null ? String(activeConversation.id) : "";
  const isOtherTyping =
    activeConvId &&
    typingState?.[activeConvId]?.isTyping &&
    String(typingState?.[activeConvId]?.fromUserId || "") === String(activeOther?.id || "");

  useEffect(() => {
    if (!activeConversation?.id) return;
    const other = otherUserFromConversation(activeConversation);
    if (!other?.id) return;
    const last = (Array.isArray(messagesList) ? messagesList : []).slice(-1)[0];
    const lastId = last?.id;
    try {
      const s = getSocket();
      if (s) {
        s.emit("chat:seen", {
          conversationId: activeConversation.id,
          toUserId: other.id,
          lastMessageId: lastId ?? null,
        });
      }
    } catch (_e) {}
  }, [activeConversation?.id, loadingMessages]);

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
                        const otherMeta = getUserMeta(other);
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
                              <Avatar src={otherMeta.avatarUrl} size={40}>
                                {(otherMeta.name || "U").slice(0, 1).toUpperCase()}
                              </Avatar>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <Text strong ellipsis>{otherMeta.name}</Text>
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
                              <Avatar src={u?.avatarUrl} size={40}>
                                {(u?.fullName || u?.name || "U").slice(0, 1).toUpperCase()}
                              </Avatar>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <Text strong ellipsis>{u?.fullName || u?.name || u?.email || "Người dùng"}</Text>
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
            <div style={{ padding: "6px 6px 12px 6px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar src={activeOtherMeta.avatarUrl} size={42}>
                {(activeOtherMeta.name || "U").slice(0, 1).toUpperCase()}
              </Avatar>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <Text strong>
                  {activeOtherMeta.name || "Chọn một cuộc trò chuyện"}
                </Text>
                {isOtherTyping ? (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    đang nhập...
                  </Text>
                ) : null}
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
                const showAvatar = !mine;
                return (
                  <div
                    key={m?.id || `${m?.created_at || m?.createdAt}-${Math.random()}`}
                    style={{
                      display: "flex",
                      justifyContent: mine ? "flex-end" : "flex-start",
                      alignItems: "flex-end",
                      marginBottom: 8,
                      gap: 8,
                    }}
                  >
                    {showAvatar ? (
                      <Avatar src={activeOtherMeta.avatarUrl} size={28}>
                        {(activeOtherMeta.name || "U").slice(0, 1).toUpperCase()}
                      </Avatar>
                    ) : null}
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

              {(() => {
                const convId = activeConversation?.id != null ? String(activeConversation.id) : "";
                const s = convId ? seenState?.[convId] : null;
                const last = (Array.isArray(messagesList) ? messagesList : []).slice(-1)[0];
                const senderId = last?.sender?.id != null ? String(last.sender.id) : last?.senderId != null ? String(last.senderId) : "";
                const mine = myUserId && senderId && String(senderId) === String(myUserId);
                const isSeenByOther =
                  mine &&
                  s &&
                  String(s?.byUserId || "") === String(activeOther?.id || "") &&
                  (s?.lastMessageId == null || String(s?.lastMessageId) === String(last?.id));
                if (!isSeenByOther) return null;
                return (
                  <div style={{ display: "flex", justifyContent: "flex-end", paddingRight: 4 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Đã xem
                    </Text>
                  </div>
                );
              })()}
            </div>

            <div style={{ display: "flex", gap: 8, paddingTop: 10 }}>
              <Input.TextArea
                value={text}
                onChange={(e) => {
                  const v = e.target.value;
                  setText(v);
                  try {
                    const s = getSocket();
                    const other = otherUserFromConversation(activeConversation);
                    if (!s || !activeConversation?.id || !other?.id) return;
                    s.emit("chat:typing", {
                      conversationId: activeConversation.id,
                      toUserId: other.id,
                      isTyping: !!v,
                    });
                    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
                    typingTimerRef.current = setTimeout(() => {
                      try {
                        s.emit("chat:typing", {
                          conversationId: activeConversation.id,
                          toUserId: other.id,
                          isTyping: false,
                        });
                      } catch (_e) {}
                    }, 900);
                  } catch (_e) {}
                }}
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
