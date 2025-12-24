import React, { useEffect, useState } from "react";
import { Avatar, Button, List, Popconfirm, Spin, Tag, Typography, message } from "antd";
import { BellOutlined, CloseOutlined } from "@ant-design/icons";
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

  return (
    <div className="notifications-page">
      <div className="notifications-shell">
        <div className="notifications-hero">
          <div className="notifications-date">{formatHeaderDate(new Date())}</div>
          <div className="notifications-hero-row">
            <Title level={2} className="notifications-hero-title">
              Trung tâm thông báo
            </Title>
            <Button
              className="notifications-close"
              type="text"
              shape="circle"
              icon={<CloseOutlined />}
              onClick={() => navigate(-1)}
              aria-label="Đóng"
            />
          </div>
          <div className="notifications-hero-actions">
            <Button className="notifications-reload" onClick={load}>
              Tải lại
            </Button>
          </div>
        </div>

        <List
          className="notifications-list"
          dataSource={items}
          locale={{ emptyText: "Chưa có thông báo" }}
          renderItem={(item) => (
            <List.Item className="notifications-list-item">
              <div className={`notification-item ${item.read ? "is-read" : "is-unread"}`}>
                <div className="notification-left">
                  <Avatar className="notification-avatar" icon={<BellOutlined />} />
                </div>

                <div className="notification-body">
                  <div className="notification-top">
                    <div className="notification-title-row">
                      <Text strong className="notification-title">
                        {item.title}
                      </Text>
                      {!item.read ? <Tag color="red">Mới</Tag> : <Tag color="green">Đã đọc</Tag>}
                    </div>
                    <Text type="secondary" className="notification-time">
                      {formatRelativeTime(item.created_at)}
                    </Text>
                  </div>

                  {item.message ? <div className="notification-message">{item.message}</div> : null}

                  <div className="notification-actions">
                    {!item.read ? (
                      <Button size="small" onClick={() => onMarkRead(item.id)}>
                        Đánh dấu đã đọc
                      </Button>
                    ) : null}
                    {item.link ? (
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => {
                          if (!item.read) onMarkRead(item.id);
                          navigate(item.link);
                        }}
                      >
                        Mở
                      </Button>
                    ) : null}

                    {item.read ? (
                      <Popconfirm
                        title="Xóa thông báo"
                        description="Bạn có chắc muốn xóa thông báo này?"
                        okText="Xóa"
                        cancelText="Hủy"
                        onConfirm={() => onDelete(item.id)}
                      >
                        <Button size="small" danger>
                          Xóa
                        </Button>
                      </Popconfirm>
                    ) : null}
                  </div>
                </div>
              </div>
            </List.Item>
          )}
        />
      </div>
    </div>
  );
}

export default NotificationsPage;
