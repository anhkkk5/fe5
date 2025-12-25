import React, { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, Button, Card, Col, Input, List, Modal, Row, Spin, Tabs, Typography, message } from "antd";
import { Document, Page, pdfjs } from "react-pdf";
import { useSearchParams } from "react-router-dom";
import { getCookie } from "../../helpers/cookie";
import { decodeJwt } from "../../services/auth/authServices";
import { getAllUsers } from "../../services/users/usersServices";

import {
  getConversationMessages,
  getMyConversations,
  getOrCreateConversationWith,
  sendChatAttachment,
  sendChatMessage,
} from "../../services/chat/chatServices.jsx";
import { connectSocket } from "../../realtime/socketClient";

const { Title, Text } = Typography;

const API_BASE_URL =
  (import.meta.env?.VITE_API_BASE_URL || "").trim() || "https://be-dw0z.onrender.com/";
const NORMALIZED_BASE_URL = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;

try {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
} catch (_e) {}

const getUserDisplayName = (u) => {
  const role = String(u?.role || "").toLowerCase();

  const companyName =
    (u?.company?.companyName || u?.companyName || u?.company?.fullName || u?.companyFullName || "").trim();
  const candidateName =
    (u?.candidateProfile?.fullName || u?.candidateFullName || "").trim();

  const fullName = (u?.fullName || "").trim();
  const name = (u?.name || "").trim();

  const preferred = role === "recruiter" ? companyName : candidateName;
  if (preferred) return preferred;
  if (fullName) return fullName;
  if (name && name.length > 1) return name;

  const email = (u?.email || "").trim();
  if (email) return email.split("@")[0] || email;

  return "Người dùng";
};

const getUserAvatarUrl = (u) => {
  const role = String(u?.role || "").toLowerCase();
  if (u?.avatarUrl) return u.avatarUrl;
  if (role === "recruiter") return u?.company?.logo || u?.companyLogo || null;
  return u?.candidateProfile?.avatarUrl || u?.candidateAvatarUrl || null;
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
  const [uploading, setUploading] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState(() => new Set());
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const [pdfPreviewName, setPdfPreviewName] = useState("");
  const [pdfPreviewData, setPdfPreviewData] = useState(null);
  const [pdfPreviewObjectUrl, setPdfPreviewObjectUrl] = useState("");
  const [pdfNumPages, setPdfNumPages] = useState(0);
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfFetchError, setPdfFetchError] = useState("");
  const [pdfRenderError, setPdfRenderError] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const listRef = useRef(null);
  const fileInputRef = useRef(null);

  const appendMessageUnique = (prev, nextMsg) => {
    const list = Array.isArray(prev) ? prev : [];
    const nextId = nextMsg?.id != null ? String(nextMsg.id) : "";
    if (!nextId) return [...list, nextMsg];
    const exists = list.some((m) => (m?.id != null ? String(m.id) : "") === nextId);
    return exists ? list : [...list, nextMsg];
  };

  const openPdfPreview = (url, name, messageId) => {
    const proxyUrl = messageId ? `${NORMALIZED_BASE_URL}chat/messages/${messageId}/attachment` : url;
    if (!proxyUrl) return;
    setPdfPreviewUrl(String(proxyUrl));
    setPdfPreviewName(String(name || ""));
    setPdfPreviewData(null);
    setPdfPreviewObjectUrl("");
    setPdfNumPages(0);
    setPdfPage(1);
    setPdfFetchError("");
    setPdfRenderError("");
    setPdfPreviewOpen(true);
  };

  useEffect(() => {
    const run = async () => {
      if (!pdfPreviewOpen || !pdfPreviewUrl) return;
      try {
        setPdfLoading(true);

        setPdfFetchError("");
        setPdfRenderError("");
        setPdfPreviewData(null);
        setPdfPreviewObjectUrl("");

        const token = getCookie("token") || localStorage.getItem("token") || "";
        const res = await fetch(pdfPreviewUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const ab = await res.arrayBuffer();

        const u8 = new Uint8Array(ab);
        const head = String.fromCharCode(...Array.from(u8.slice(0, 5)));
        if (!head.startsWith("%PDF")) {
          throw new Error("NOT_A_PDF");
        }

        setPdfPreviewData(ab);
        try {
          const blob = new Blob([ab], { type: "application/pdf" });
          const objUrl = URL.createObjectURL(blob);
          setPdfPreviewObjectUrl(objUrl);
        } catch (_e) {}
      } catch (e) {
        const msg = String(e?.message || "");
        if (msg === "NOT_A_PDF") {
          setPdfFetchError(
            "Không thể preview vì backend trả về dữ liệu không phải PDF (thường do sai API_BASE_URL hoặc bị redirect/login).",
          );
        } else if (msg.startsWith("HTTP ")) {
          setPdfFetchError(`Không thể tải PDF để preview (${msg}).`);
        } else {
          setPdfFetchError("Không thể tải PDF để preview.");
        }
        try {
          console.error("PDF fetch error:", e);
        } catch (_e) {}
      } finally {
        setPdfLoading(false);
      }
    };

    run();
  }, [pdfPreviewOpen, pdfPreviewUrl]);

  useEffect(() => {
    if (pdfPreviewOpen) return;
    if (!pdfPreviewObjectUrl) return;
    try {
      URL.revokeObjectURL(pdfPreviewObjectUrl);
    } catch (_e) {}
    setPdfPreviewObjectUrl("");
  }, [pdfPreviewOpen, pdfPreviewObjectUrl]);

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
        setMessagesList((prev) => appendMessageUnique(prev, payload));
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
    const onPresenceList = (evt) => {
      const ids = evt?.detail?.userIds;
      if (!Array.isArray(ids)) return;
      setOnlineUserIds(new Set(ids.map((x) => String(x))));
    };

    const onPresenceUpdate = (evt) => {
      const userId = evt?.detail?.userId != null ? String(evt.detail.userId) : "";
      const online = !!evt?.detail?.online;
      if (!userId) return;
      setOnlineUserIds((prev) => {
        const next = new Set(Array.from(prev || []).map((x) => String(x)));
        if (online) next.add(userId);
        else next.delete(userId);
        return next;
      });
    };

    try {
      window.addEventListener("presence:list", onPresenceList);
      window.addEventListener("presence:update", onPresenceUpdate);
    } catch (_e) {}

    return () => {
      try {
        window.removeEventListener("presence:list", onPresenceList);
        window.removeEventListener("presence:update", onPresenceUpdate);
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
        message.error("Bạn cần kết bạn trước khi chat");
        return;
      }
      message.error("Không thể bắt đầu chat");
    }
  };

  const openFilePicker = () => {
    if (!activeConversation?.id) return;
    try {
      fileInputRef.current?.click?.();
    } catch (_e) {}
  };

  const handleFileSelected = async (e) => {
    const file = e?.target?.files?.[0];
    try {
      if (!file) return;
      if (!activeConversation?.id) return;

      const isImage = String(file.type || "").startsWith("image/");
      const isPdf = String(file.type || "") === "application/pdf" || String(file.name || "").toLowerCase().endsWith(".pdf");
      if (!isImage && !isPdf) {
        message.error("Chỉ hỗ trợ gửi ảnh hoặc file PDF");
        return;
      }

      setUploading(true);
      const sent = await sendChatAttachment(activeConversation.id, file, text);
      setText("");
      if (sent) {
        setMessagesList((prev) => appendMessageUnique(prev, sent));
        setTimeout(scrollToBottom, 0);
      }
    } catch (err) {
      if (err?.response?.status === 403) {
        message.error("Bạn cần kết bạn trước khi chat");
        return;
      }
      message.error("Gửi file thất bại");
    } finally {
      try {
        if (e?.target) e.target.value = "";
      } catch (_e) {}
      setUploading(false);
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
        setMessagesList((prev) => appendMessageUnique(prev, sent));
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

  const handleDownloadPdf = () => {
    const safeName = (pdfPreviewName || "attachment").replace(/[^a-zA-Z0-9-_]/g, "_");
    const run = async () => {
      try {
        if (!pdfPreviewUrl && !pdfPreviewObjectUrl && !pdfPreviewData) return;

        let href = pdfPreviewObjectUrl;
        if (!href && pdfPreviewData) {
          const blob = new Blob([pdfPreviewData], { type: "application/pdf" });
          href = URL.createObjectURL(blob);
        }

        if (!href && pdfPreviewUrl) {
          const token = getCookie("token") || localStorage.getItem("token") || "";
          const res = await fetch(pdfPreviewUrl, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          const ab = await res.arrayBuffer();
          const blob = new Blob([ab], { type: "application/pdf" });
          href = URL.createObjectURL(blob);
        }

        if (!href) return;

        const link = document.createElement("a");
        link.href = href;
        link.download = `${safeName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (href && href.startsWith("blob:") && href !== pdfPreviewObjectUrl) {
          try {
            URL.revokeObjectURL(href);
          } catch (_e) {}
        }
      } catch (e) {
        message.error("Không thể tải file PDF");
        try {
          console.error("PDF download error:", e);
        } catch (_e) {}
      }
    };
    run();
  };

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
                        const otherId = other?.id != null ? String(other.id) : "";
                        const isOnline = !!(otherId && onlineUserIds?.has?.(otherId));
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
                              <div style={{ position: "relative", width: 34, height: 34 }}>
                                <Avatar src={getUserAvatarUrl(other) || undefined} size={34}>
                                  {String(getUserDisplayName(other) || "").charAt(0).toUpperCase()}
                                </Avatar>
                                {isOnline ? (
                                  <span
                                    style={{
                                      position: "absolute",
                                      right: -1,
                                      bottom: -1,
                                      width: 10,
                                      height: 10,
                                      borderRadius: 999,
                                      background: "#52c41a",
                                      border: "2px solid #fff",
                                    }}
                                  />
                                ) : null}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <Text strong ellipsis>
                                    {getUserDisplayName(other)}
                                  </Text>
                                </div>
                                {c?.lastMessage ? (
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    {c.lastMessage.content
                                      ? c.lastMessage.content
                                      : c.lastMessage.attachmentType === "pdf"
                                      ? "[PDF]"
                                      : c.lastMessage.attachmentType === "image"
                                      ? "[Ảnh]"
                                      : ""}
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
                              <div style={{ position: "relative", width: 34, height: 34 }}>
                                <Avatar src={getUserAvatarUrl(u) || undefined} size={34}>
                                  {String(getUserDisplayName(u) || "").charAt(0).toUpperCase()}
                                </Avatar>
                                {u?.id != null && onlineUserIds?.has?.(String(u.id)) ? (
                                  <span
                                    style={{
                                      position: "absolute",
                                      right: -1,
                                      bottom: -1,
                                      width: 10,
                                      height: 10,
                                      borderRadius: 999,
                                      background: "#52c41a",
                                      border: "2px solid #fff",
                                    }}
                                  />
                                ) : null}
                              </div>
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
                  <Avatar src={getUserAvatarUrl(activeOther) || undefined} size={36}>
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
                const hasAttachment = !!m?.attachmentType && !!m?.attachmentUrl;
                const isImage = String(m?.attachmentType || "") === "image";
                const isPdf = String(m?.attachmentType || "") === "pdf";
                const caption = (m?.content || "").trim();
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
                      {hasAttachment && isImage ? (
                        <div style={{ marginBottom: caption ? 8 : 0 }}>
                          <img
                            src={m.attachmentUrl}
                            alt={m?.attachmentOriginalName || "attachment"}
                            style={{ maxWidth: 260, borderRadius: 10, display: "block" }}
                          />
                        </div>
                      ) : null}

                      {hasAttachment && isPdf ? (
                        <div style={{ marginBottom: caption ? 8 : 0 }}>
                          <Button
                            type="link"
                            style={{ padding: 0, height: "auto", color: mine ? "#fff" : "#1677ff" }}
                            onClick={(e) => {
                              try {
                                e?.preventDefault?.();
                                e?.stopPropagation?.();
                              } catch (_e) {}
                              openPdfPreview(m.attachmentUrl, m?.attachmentOriginalName, m?.id);
                            }}
                          >
                            {m?.attachmentOriginalName ? `PDF: ${m.attachmentOriginalName}` : "Xem file PDF"}
                          </Button>
                        </div>
                      ) : null}

                      {caption ? caption : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 8, paddingTop: 10, alignItems: "flex-end" }}>
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: "none" }}
                accept="image/*,application/pdf"
                onChange={handleFileSelected}
              />
              <Button onClick={openFilePicker} disabled={!activeConversation?.id} loading={uploading}>
                Gửi ảnh/PDF
              </Button>
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
              <Button type="primary" onClick={handleSend} loading={sending} disabled={!activeConversation?.id || uploading}>
                Gửi
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        open={pdfPreviewOpen}
        title={pdfPreviewName ? `PDF: ${pdfPreviewName}` : "Xem PDF"}
        onCancel={() => setPdfPreviewOpen(false)}
        footer={null}
        width={900}
        style={{ top: 20 }}
        bodyStyle={{ height: "80vh" }}
        destroyOnClose
      >
        {pdfFetchError ? (
          <div>
            <Text type="danger">{pdfFetchError}</Text>
            <div style={{ marginTop: 8 }}>
              <Button type="primary" onClick={handleDownloadPdf} disabled={!pdfPreviewUrl}>
                Tải về
              </Button>
            </div>
          </div>
        ) : pdfLoading || (!pdfPreviewData && !pdfPreviewObjectUrl) ? (
          <div style={{ textAlign: "center", padding: 24 }}>
            <Spin />
          </div>
        ) : (
          <div>
            {pdfRenderError ? (
              <div style={{ marginBottom: 10 }}>
                <Text type="danger">{pdfRenderError}</Text>
              </div>
            ) : null}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <Button
                  onClick={() => setPdfPage((p) => Math.max(1, p - 1))}
                  disabled={pdfPage <= 1}
                >
                  Trang trước
                </Button>
                <Button
                  style={{ marginLeft: 8 }}
                  onClick={() => setPdfPage((p) => (pdfNumPages ? Math.min(pdfNumPages, p + 1) : p + 1))}
                  disabled={pdfNumPages ? pdfPage >= pdfNumPages : false}
                >
                  Trang sau
                </Button>
              </div>
              <Text>
                Trang {pdfPage}
                {pdfNumPages ? ` / ${pdfNumPages}` : ""}
              </Text>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <Button type="primary" onClick={handleDownloadPdf} disabled={!pdfPreviewUrl}>
                Tải về
              </Button>
            </div>

            <div style={{ display: "flex", justifyContent: "center", overflow: "auto" }}>
              <Document
                file={pdfPreviewObjectUrl ? pdfPreviewObjectUrl : { data: pdfPreviewData }}
                onLoadSuccess={(info) => {
                  setPdfNumPages(info?.numPages || 0);
                  setPdfRenderError("");
                  setPdfPage(1);
                }}
                onLoadError={(err) => {
                  setPdfRenderError("Không thể hiển thị PDF để preview. Vui lòng thử tải về.");
                  try {
                    console.error("PDF load error:", err);
                  } catch (_e) {}
                }}
                loading={<Spin />}
              >
                <Page pageNumber={pdfPage} width={800} renderTextLayer={false} renderAnnotationLayer={false} />
              </Document>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ChatPage;