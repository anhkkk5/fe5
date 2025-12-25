import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Input, Pagination, Space, Table, Tag, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";
import { getCookie } from "../../helpers/cookie";
import { get } from "../../utils/axios/request";
import { getMyFriends, sendFriendRequest } from "../../services/friends/friendsServices";

const { Title, Text } = Typography;

function FriendsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState([]);
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [friendsPage, setFriendsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);

  const userType = getCookie("userType");

  const load = async () => {
    setLoading(true);
    try {
      const [friendsData, usersData] = await Promise.all([getMyFriends(), get("users/all")]);
      setFriends(Array.isArray(friendsData) ? friendsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (e) {
      const backendMsg = e?.response?.data?.message;
      message.error(
        backendMsg
          ? Array.isArray(backendMsg)
            ? backendMsg.join(", ")
            : backendMsg
          : "Không thể tải dữ liệu bạn bè",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userType) {
      message.warning("Vui lòng đăng nhập để xem bạn bè");
      return;
    }
    if (!['candidate', 'company'].includes(String(userType || '').toLowerCase())) {
      message.warning("Bạn cần đăng nhập để sử dụng tính năng bạn bè");
      navigate("/");
      return;
    }
    load();
  }, []);

  const friendIds = useMemo(() => {
    const s = new Set();
    (friends || []).forEach((f) => {
      const id = f?.friend?.id;
      if (id) s.add(id);
    });
    return s;
  }, [friends]);

  const filteredUsers = useMemo(() => {
    const text = (q || "").trim().toLowerCase();
    const list = (Array.isArray(users) ? users : []).filter(
      (u) => String(u?.role || "").toLowerCase() !== "admin",
    );
    if (!text) return list;
    return list.filter((u) => {
      const name = (u?.fullName || u?.name || "").toLowerCase();
      const email = (u?.email || "").toLowerCase();
      return name.includes(text) || email.includes(text);
    });
  }, [users, q]);

  useEffect(() => {
    setFriendsPage(1);
  }, [friends.length]);

  useEffect(() => {
    setUsersPage(1);
  }, [filteredUsers.length, q]);

  const onSend = async (userId) => {
    try {
      await sendFriendRequest(userId);
      message.success("Đã gửi lời mời kết bạn");
      navigate("/friends/requests");
    } catch (e) {
      const backendMsg = e?.response?.data?.message;
      message.error(
        backendMsg
          ? Array.isArray(backendMsg)
            ? backendMsg.join(", ")
            : backendMsg
          : "Không thể gửi lời mời",
      );
    }
  };

  const friendColumns = [
    {
      title: "Bạn bè",
      dataIndex: "friend",
      key: "friend",
      render: (friend) => (
        <Space direction="vertical" size={0}>
          <Text strong>{friend?.name || ""}</Text>
          <Text type="secondary">{friend?.email || ""}</Text>
        </Space>
      ),
    },
    {
      title: "Role",
      dataIndex: ["friend", "role"],
      key: "role",
      render: (role) => <Tag>{role}</Tag>,
      width: 140,
    },
  ];

  const friendsPageSize = 8;
  const usersPageSize = 8;

  const paginatedFriends = (Array.isArray(friends) ? friends : []).slice(
    (friendsPage - 1) * friendsPageSize,
    friendsPage * friendsPageSize,
  );

  const paginatedUsers = (Array.isArray(filteredUsers) ? filteredUsers : []).slice(
    (usersPage - 1) * usersPageSize,
    usersPage * usersPageSize,
  );

  const userColumns = [
    {
      title: "Người dùng",
      dataIndex: "name",
      key: "name",
      render: (_name, u) => (
        <Space direction="vertical" size={0}>
          <Text strong>{u?.name || ""}</Text>
          <Text type="secondary">{u?.email || ""}</Text>
        </Space>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role) => <Tag>{role}</Tag>,
      width: 140,
    },
    {
      title: "",
      key: "action",
      width: 160,
      render: (_v, u) => {
        const isFriend = friendIds.has(u?.id);
        return (
          <Button
            type="primary"
            disabled={isFriend}
            onClick={() => onSend(u.id)}
          >
            {isFriend ? "Đã là bạn" : "Kết bạn"}
          </Button>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Card bodyStyle={{ padding: 24 }}>
          <Space style={{ width: "100%", justifyContent: "space-between" }} align="center">
            <Title level={3} style={{ margin: 0 }}>
              Bạn bè
            </Title>
            <Button onClick={() => navigate("/friends/requests")}>Lời mời kết bạn</Button>
          </Space>
          <div style={{ marginTop: 12 }}>
            <Table
              rowKey={(r) => r.friendshipId}
              loading={loading}
              columns={friendColumns}
              dataSource={paginatedFriends}
              pagination={false}
              locale={{ emptyText: "Chưa có bạn bè" }}
            />
            <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
              <Pagination
                current={friendsPage}
                pageSize={friendsPageSize}
                total={(Array.isArray(friends) ? friends : []).length}
                onChange={(page) => setFriendsPage(page)}
                showSizeChanger={false}
              />
            </div>
          </div>
        </Card>

        <Card bodyStyle={{ padding: 24 }}>
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <Title level={4} style={{ margin: 0 }}>
              Tìm người để kết bạn
            </Title>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên hoặc email"
              allowClear
            />
            <Table
              rowKey={(r) => r.id}
              loading={loading}
              columns={userColumns}
              dataSource={paginatedUsers}
              pagination={false}
              locale={{ emptyText: "Không có người dùng" }}
            />
            <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
              <Pagination
                current={usersPage}
                pageSize={usersPageSize}
                total={(Array.isArray(filteredUsers) ? filteredUsers : []).length}
                onChange={(page) => setUsersPage(page)}
                showSizeChanger={false}
              />
            </div>
          </Space>
        </Card>
      </Space>
    </div>
  );
}

export default FriendsPage;
