import React, { useEffect, useState } from "react";
import { Button, Card, List, Space, Spin, Tag, Typography, message } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getCookie } from "../../helpers/cookie";
import {
  getMyNotifications,
  markNotificationRead,
} from "../../services/notifications/notificationsServices";

const { Title, Text } = Typography;

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

  const onMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: 1 } : n)));
    } catch (e) {
      message.error("Không thể đánh dấu đã đọc");
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
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <Card bodyStyle={{ padding: 24 }}>
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Title level={3} style={{ margin: 0 }}>
            <Space>
              <BellOutlined />
              Thông báo
            </Space>
          </Title>
          <Button onClick={load}>Tải lại</Button>
        </Space>

        <div style={{ marginTop: 16 }}>
          <List
            dataSource={items}
            locale={{ emptyText: "Chưa có thông báo" }}
            renderItem={(item) => (
              <List.Item
                actions={[
                  item.read ? (
                    <Tag color="green">Đã đọc</Tag>
                  ) : (
                    <Button type="link" onClick={() => onMarkRead(item.id)}>
                      Đánh dấu đã đọc
                    </Button>
                  ),
                  item.link ? (
                    <Button
                      type="link"
                      onClick={() => {
                        if (!item.read) onMarkRead(item.id);
                        navigate(item.link);
                      }}
                    >
                      Mở
                    </Button>
                  ) : null,
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{item.title}</Text>
                      {!item.read && <Tag color="red">Mới</Tag>}
                    </Space>
                  }
                  description={
                    <div>
                      <Text>{item.message || ""}</Text>
                      <div style={{ marginTop: 6 }}>
                        <Text type="secondary">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleString("vi-VN")
                            : ""}
                        </Text>
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      </Card>
    </div>
  );
}

export default NotificationsPage;
