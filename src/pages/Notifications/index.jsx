import React, { useEffect, useState } from "react";
import { Avatar, Dropdown, Spin, Typography, message } from "antd";
import { BellOutlined, EllipsisOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getCookie } from "../../helpers/cookie";
import "./style.css";
import {
  getMyNotifications,
  deleteNotification,
  markNotificationRead,
} from "../../services/notifications/notificationsServices";

const { Title, Text } = Typography;

const formatHeaderDate = (d) => {
  try {
    return d.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
    });
  } catch (_e) {
    return "";
  }
};

const formatRelativeTime = (input) => {
  if (!input) return "";
  const dt = new Date(input);
  if (Number.isNaN(dt.getTime())) return "";
  const diffMs = Date.now() - dt.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSec < 60) return "vừa xong";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} giờ trước`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} ngày trước`;
};

function NotificationsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState("all");
  const [actionOpenId, setActionOpenId] = useState(null);

  const userType = getCookie("userType");

  const load = async () => {
    setLoading(true);
    try {
      const data = await getMyNotifications();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      const backendMsg = e?.response?.data?.message;
      message.error(
        backendMsg
          ? Array.isArray(backendMsg)
            ? backendMsg.join(", ")
            : backendMsg
          : "Không thể tải thông báo",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userType) {
      message.warning("Vui lòng đăng nhập để xem thông báo");
      return;
    }
    load();
  }, []);

  useEffect(() => {
    const onNewNotification = (evt) => {
      const n = evt?.detail;
      if (!n?.id) return;
      setItems((prev) => {
        if (prev.some((x) => x?.id === n.id)) return prev;
        return [n, ...prev];
      });
    };

    try {
      window.addEventListener("notification:new", onNewNotification);
    } catch (_e) {}

    return () => {
      try {
        window.removeEventListener("notification:new", onNewNotification);
      } catch (_e) {}
    };
  }, []);

  const onMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: 1 } : n)));
    } catch (e) {
      message.error("Không thể đánh dấu đã đọc");
    }
  };

  const onDelete = async (id) => {
    try {
      await deleteNotification(id);
      setItems((prev) => prev.filter((n) => n.id !== id));
      message.success("Đã xóa thông báo");
    } catch (e) {
      const backendMsg = e?.response?.data?.message;
      message.error(
        backendMsg
          ? Array.isArray(backendMsg)
            ? backendMsg.join(", ")
            : backendMsg
          : "Không thể xóa thông báo"
      );
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
        <Spin size="large" />
      </div>
    );
  }

  const visibleItems = tab === "unread" ? items.filter((n) => !n?.read) : items;
  const now = Date.now();
  const isNew = (createdAt) => {
    const dt = new Date(createdAt);
    if (Number.isNaN(dt.getTime())) return false;
    return now - dt.getTime() < 24 * 60 * 60 * 1000;
  };

  const newest = visibleItems.filter((n) => isNew(n?.created_at));
  const older = visibleItems.filter((n) => !isNew(n?.created_at));

  const handleOpen = async (n) => {
    try {
      if (!n?.read) await onMarkRead(n.id);
    } catch (_e) {}
    if (n?.link) {
      navigate(n.link);
      return;
    }
  };

  return (
    <div className="notifications-page">
      <div className="notifications-center">
        <div className="notifications-center__card">
          <div className="notifications-center__header">
            <div>
              <Title level={1} className="notifications-center__title">
                Thông báo
              </Title>
              <div className="notifications-center__date">{formatHeaderDate(new Date())}</div>
            </div>

            <Dropdown
              trigger={["click"]}
              placement="bottomRight"
              getPopupContainer={(triggerNode) => triggerNode?.closest?.(".notifications-center__card") || document.body}
              menu={{
                items: [
                  { key: "reload", label: "Tải lại" },
                  { key: "close", label: "Đóng" },
                ],
                onClick: ({ key }) => {
                  if (key === "reload") load();
                  if (key === "close") navigate(-1);
                },
              }}
            >
              <button type="button" className="notifications-center__header-more" aria-label="Tùy chọn">
                <EllipsisOutlined />
              </button>
            </Dropdown>
          </div>

          <div className="notifications-center__tabs">
            <button
              type="button"
              className={`notifications-center__tab ${tab === "all" ? "is-active" : ""}`}
              onClick={() => setTab("all")}
            >
              Tất cả
            </button>
            <button
              type="button"
              className={`notifications-center__tab ${tab === "unread" ? "is-active" : ""}`}
              onClick={() => setTab("unread")}
            >
              Chưa đọc
            </button>
          </div>

          <div className="notifications-center__body">
            {visibleItems.length === 0 ? (
              <div className="notifications-center__empty">Chưa có thông báo</div>
            ) : (
              <>
                {newest.length > 0 ? (
                  <div className="notifications-center__section">
                    <div className="notifications-center__section-title">Mới</div>
                    <div className="notifications-center__list">
                      {newest.map((n) => (
                        <div
                          key={n.id}
                          className={`notifications-center__item ${n?.read ? "is-read" : "is-unread"}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleOpen(n)}
                        >
                          <div className="notifications-center__avatar">
                            <Avatar icon={<BellOutlined />} />
                          </div>
                          <div className="notifications-center__content">
                            <div className="notifications-center__text">
                              <Text strong>{n.title || "Thông báo"}</Text>
                              {n.message ? <span className="notifications-center__sep">·</span> : null}
                              {n.message ? <span>{n.message}</span> : null}
                            </div>
                            <div className="notifications-center__time">{formatRelativeTime(n.created_at)}</div>
                          </div>

                          <div className="notifications-center__actions" onClick={(e) => e.stopPropagation()}>
                            <Dropdown
                              trigger={["click"]}
                              open={actionOpenId === n.id}
                              onOpenChange={(open) => setActionOpenId(open ? n.id : null)}
                              placement="bottomRight"
                              getPopupContainer={(triggerNode) =>
                                triggerNode?.closest?.(".notifications-center__card") || document.body
                              }
                              menu={{
                                items: [
                                  {
                                    key: "mark_read",
                                    label: "Đánh dấu là đã đọc",
                                    disabled: !!n?.read,
                                  },
                                  {
                                    key: "delete",
                                    label: "Xóa thông báo này",
                                    danger: true,
                                  },
                                ],
                                onClick: async ({ key }) => {
                                  if (key === "mark_read") await onMarkRead(n.id);
                                  if (key === "delete") await onDelete(n.id);
                                  setActionOpenId(null);
                                },
                              }}
                            >
                              <button
                                type="button"
                                className="notifications-center__more"
                                aria-label="Tùy chọn thông báo"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <EllipsisOutlined />
                              </button>
                            </Dropdown>
                            {!n?.read ? <div className="notifications-center__dot" /> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {older.length > 0 ? (
                  <div className="notifications-center__section">
                    <div className="notifications-center__section-title">Trước đó</div>
                    <div className="notifications-center__list">
                      {older.map((n) => (
                        <div
                          key={n.id}
                          className={`notifications-center__item ${n?.read ? "is-read" : "is-unread"}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleOpen(n)}
                        >
                          <div className="notifications-center__avatar">
                            <Avatar icon={<BellOutlined />} />
                          </div>
                          <div className="notifications-center__content">
                            <div className="notifications-center__text">
                              <Text strong>{n.title || "Thông báo"}</Text>
                              {n.message ? <span className="notifications-center__sep">·</span> : null}
                              {n.message ? <span>{n.message}</span> : null}
                            </div>
                            <div className="notifications-center__time">{formatRelativeTime(n.created_at)}</div>
                          </div>

                          <div className="notifications-center__actions" onClick={(e) => e.stopPropagation()}>
                            <Dropdown
                              trigger={["click"]}
                              open={actionOpenId === n.id}
                              onOpenChange={(open) => setActionOpenId(open ? n.id : null)}
                              placement="bottomRight"
                              getPopupContainer={(triggerNode) =>
                                triggerNode?.closest?.(".notifications-center__card") || document.body
                              }
                              menu={{
                                items: [
                                  {
                                    key: "mark_read",
                                    label: "Đánh dấu là đã đọc",
                                    disabled: !!n?.read,
                                  },
                                  {
                                    key: "delete",
                                    label: "Xóa thông báo này",
                                    danger: true,
                                  },
                                ],
                                onClick: async ({ key }) => {
                                  if (key === "mark_read") await onMarkRead(n.id);
                                  if (key === "delete") await onDelete(n.id);
                                  setActionOpenId(null);
                                },
                              }}
                            >
                              <button
                                type="button"
                                className="notifications-center__more"
                                aria-label="Tùy chọn thông báo"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <EllipsisOutlined />
                              </button>
                            </Dropdown>
                            {!n?.read ? <div className="notifications-center__dot" /> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotificationsPage;
