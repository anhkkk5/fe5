import React, { useEffect, useState } from "react";
import { Button, Card, List, Popconfirm, Segmented, Space, Tag, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";
import { getCookie } from "../../helpers/cookie";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  getIncomingFriendRequests,
  getOutgoingFriendRequests,
  rejectFriendRequest,
} from "../../services/friends/friendsServices";

const { Title, Text } = Typography;

function FriendRequestsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("incoming");
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);

  const userType = getCookie("userType");

  const load = async () => {
    setLoading(true);
    try {
      const [inc, out] = await Promise.all([
        getIncomingFriendRequests(),
        getOutgoingFriendRequests(),
      ]);
      setIncoming(Array.isArray(inc) ? inc : []);
      setOutgoing(Array.isArray(out) ? out : []);
    } catch (e) {
      const backendMsg = e?.response?.data?.message;
      message.error(
        backendMsg
          ? Array.isArray(backendMsg)
            ? backendMsg.join(", ")
            : backendMsg
          : "Không thể tải lời mời kết bạn",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userType) {
      message.warning("Vui lòng đăng nhập để xem lời mời kết bạn");
      return;
    }
    if (!['candidate', 'company'].includes(String(userType || '').toLowerCase())) {
      message.warning("Bạn cần đăng nhập để sử dụng tính năng bạn bè");
      navigate("/");
      return;
    }
    load();
  }, []);

  const onAccept = async (id) => {
    try {
      await acceptFriendRequest(id);
      message.success("Đã chấp nhận");
      await load();
    } catch (e) {
      const backendMsg = e?.response?.data?.message;
      message.error(
        backendMsg
          ? Array.isArray(backendMsg)
            ? backendMsg.join(", ")
            : backendMsg
          : "Không thể chấp nhận",
      );
    }
  };

  const onReject = async (id) => {
    try {
      await rejectFriendRequest(id);
      message.success("Đã từ chối");
      await load();
    } catch (e) {
      const backendMsg = e?.response?.data?.message;
      message.error(
        backendMsg
          ? Array.isArray(backendMsg)
            ? backendMsg.join(", ")
            : backendMsg
          : "Không thể từ chối",
      );
    }
  };

  const onCancel = async (id) => {
    try {
      await cancelFriendRequest(id);
      message.success("Đã hủy lời mời");
      await load();
    } catch (e) {
      const backendMsg = e?.response?.data?.message;
      message.error(
        backendMsg
          ? Array.isArray(backendMsg)
            ? backendMsg.join(", ")
            : backendMsg
          : "Không thể hủy",
      );
    }
  };

  const data = tab === "incoming" ? incoming : outgoing;

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <Card bodyStyle={{ padding: 24 }}>
        <Space style={{ width: "100%", justifyContent: "space-between" }} align="center">
          <Title level={3} style={{ margin: 0 }}>
            Lời mời kết bạn
          </Title>
          <Space>
            <Button onClick={() => navigate("/friends")}>Bạn bè</Button>
            <Button onClick={load}>Tải lại</Button>
          </Space>
        </Space>

        <div style={{ marginTop: 16 }}>
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { label: `Đến (${incoming.length})`, value: "incoming" },
              { label: `Đi (${outgoing.length})`, value: "outgoing" },
            ]}
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <List
            loading={loading}
            dataSource={data}
            locale={{ emptyText: tab === "incoming" ? "Chưa có lời mời đến" : "Chưa có lời mời đi" }}
            renderItem={(item) => {
              const isIncoming = tab === "incoming";
              const other = isIncoming ? item?.requester : item?.receiver;

              return (
                <List.Item>
                  <div style={{ width: "100%" }}>
                    <Space direction="vertical" size={6} style={{ width: "100%" }}>
                      <Space style={{ justifyContent: "space-between", width: "100%" }} align="start">
                        <div>
                          <Text strong>{other?.name || ""}</Text>
                          <div>
                            <Text type="secondary">{other?.email || ""}</Text>
                          </div>
                        </div>
                        <Tag color={isIncoming ? "blue" : "gold"}>
                          {isIncoming ? "Lời mời đến" : "Lời mời đi"}
                        </Tag>
                      </Space>

                      <Space>
                        {isIncoming ? (
                          <>
                            <Button type="primary" onClick={() => onAccept(item.id)}>
                              Chấp nhận
                            </Button>
                            <Popconfirm
                              title="Từ chối lời mời"
                              okText="Từ chối"
                              cancelText="Hủy"
                              onConfirm={() => onReject(item.id)}
                            >
                              <Button danger>Từ chối</Button>
                            </Popconfirm>
                          </>
                        ) : (
                          <Popconfirm
                            title="Hủy lời mời"
                            okText="Hủy"
                            cancelText="Không"
                            onConfirm={() => onCancel(item.id)}
                          >
                            <Button danger>Hủy lời mời</Button>
                          </Popconfirm>
                        )}
                      </Space>
                    </Space>
                  </div>
                </List.Item>
              );
            }}
          />
        </div>
      </Card>
    </div>
  );
}

export default FriendRequestsPage;
