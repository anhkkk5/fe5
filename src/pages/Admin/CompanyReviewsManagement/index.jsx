import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Descriptions,
  Drawer,
  Input,
  Modal,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";
import {
  adminApproveReview,
  adminDeleteComment,
  adminDeleteReview,
  adminGetReviews,
  adminRejectReview,
  adminGetReviewDetail,
} from "../../../services/companyReviews/companyReviewsServices";

import "./style.css";

const { Title, Text } = Typography;

const statusOptions = [
  { label: "Chờ duyệt", value: "pending" },
  { label: "Đã duyệt", value: "approved" },
  { label: "Từ chối", value: "rejected" },
  { label: "Tất cả", value: "" },
];

const statusTag = (status) => {
  if (status === "approved") return <Tag color="green">Đã duyệt</Tag>;
  if (status === "rejected") return <Tag color="red">Từ chối</Tag>;
  return <Tag color="gold">Chờ duyệt</Tag>;
};

function CompanyReviewsManagement() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("pending");
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [active, setActive] = useState(null);
  const [activeLoading, setActiveLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminGetReviews({ status: status || undefined });
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      const backendMsg = e?.response?.data?.message;
      message.error(
        backendMsg
          ? Array.isArray(backendMsg)
            ? backendMsg.join(", ")
            : backendMsg
          : "Không thể tải danh sách đánh giá",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  const filtered = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) => {
      const companyName = r.company?.companyName || r.company?.fullName || "";
      const title = r.title || "";
      const pros = r.pros || "";
      const cons = r.cons || "";
      const userName = r.user?.name || "";
      return [companyName, title, pros, cons, userName].some((x) =>
        String(x).toLowerCase().includes(q),
      );
    });
  }, [items, search]);

  const openDetail = async (record) => {
    setDrawerOpen(true);
    setActiveLoading(true);
    try {
      const detail = await adminGetReviewDetail(record.id);
      setActive(detail);
    } catch (e) {
      const backendMsg = e?.response?.data?.message;
      message.error(
        backendMsg
          ? Array.isArray(backendMsg)
            ? backendMsg.join(", ")
            : backendMsg
          : "Không thể tải chi tiết đánh giá",
      );
      setDrawerOpen(false);
    } finally {
      setActiveLoading(false);
    }
  };

  const doApprove = async (id) => {
    await adminApproveReview(id);
    message.success("Đã duyệt đánh giá");
    await load();
    if (active?.id === id) {
      const detail = await adminGetReviewDetail(id);
      setActive(detail);
    }
  };

  const doReject = async (id) => {
    await adminRejectReview(id);
    message.success("Đã từ chối đánh giá");
    await load();
    if (active?.id === id) {
      const detail = await adminGetReviewDetail(id);
      setActive(detail);
    }
  };

  const doDeleteReview = async (id) => {
    await adminDeleteReview(id);
    message.success("Đã xoá đánh giá");
    await load();
    if (active?.id === id) {
      setDrawerOpen(false);
      setActive(null);
    }
  };

  const doDeleteComment = async (commentId) => {
    await adminDeleteComment(commentId);
    message.success("Đã xoá bình luận");
    if (active?.id) {
      const detail = await adminGetReviewDetail(active.id);
      setActive(detail);
    }
    await load();
  };

  const columns = [
    {
      title: "Công ty",
      key: "company",
      width: 220,
      ellipsis: true,
      render: (_, r) => {
        const name = r.company?.companyName || r.company?.fullName || "-";
        return <Text ellipsis={{ tooltip: name }}>{name}</Text>;
      },
    },
    {
      title: "Rating",
      dataIndex: "overallRating",
      key: "overallRating",
      width: 90,
      render: (v) => <Text>{v ?? "-"}</Text>,
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      width: 240,
      ellipsis: true,
      render: (v) => <Text ellipsis={{ tooltip: v }}>{v || "-"}</Text>,
    },
    {
      title: "Người viết",
      key: "user",
      width: 150,
      ellipsis: true,
      render: (_, r) => <Text ellipsis={{ tooltip: r.user?.name }}>{r.user?.name || "-"}</Text>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (v) => statusTag(v),
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
      render: (v) => <Text>{v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "-"}</Text>,
    },
    {
      title: "Hành động",
      key: "actions",
      width: 260,
      render: (_, r) => (
        <Space wrap size="small">
          <Button size="small" onClick={() => openDetail(r)}>
            Xem
          </Button>
          <Button
            size="small"
            type="primary"
            disabled={r.status === "approved"}
            onClick={() =>
              Modal.confirm({
                title: "Duyệt đánh giá?",
                okText: "Duyệt",
                cancelText: "Huỷ",
                onOk: () => doApprove(r.id),
              })
            }
          >
            Duyệt
          </Button>
          <Button
            size="small"
            danger
            disabled={r.status === "rejected"}
            onClick={() =>
              Modal.confirm({
                title: "Từ chối đánh giá?",
                okText: "Từ chối",
                okButtonProps: { danger: true },
                cancelText: "Huỷ",
                onOk: () => doReject(r.id),
              })
            }
          >
            Từ chối
          </Button>
          <Button
            size="small"
            danger
            onClick={() =>
              Modal.confirm({
                title: "Xoá đánh giá?",
                content: "Hành động này sẽ xoá review và toàn bộ comment liên quan.",
                okText: "Xoá",
                okButtonProps: { danger: true },
                cancelText: "Huỷ",
                onOk: () => doDeleteReview(r.id),
              })
            }
          >
            Xoá
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="admin-management-container">
      <Card>
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Title level={4} style={{ margin: 0 }}>
            Quản lý đánh giá công ty
          </Title>
          <Button onClick={load}>Tải lại</Button>
        </Space>

        <div style={{ marginTop: 16 }}>
          <Space wrap>
            <div>
              <div style={{ fontSize: 12, color: "#666" }}>Trạng thái</div>
              <Select
                style={{ width: 200 }}
                value={status}
                onChange={setStatus}
                options={statusOptions}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#666" }}>Tìm kiếm</div>
              <Input
                style={{ width: 320 }}
                placeholder="Công ty / tiêu đề / nội dung / người viết..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </Space>
        </div>

        <div style={{ marginTop: 16 }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <Spin />
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={(filtered || []).map((x) => ({ ...x, key: x.id }))}
              pagination={{
                pageSize: 10,
                position: ["bottomCenter"],
                style: {
                  display: "flex",
                  justifyContent: "center",
                  width: "100%",
                },
              }}
              tableLayout="fixed"
              scroll={{ x: 1200 }}
            />
          )}
        </div>
      </Card>

      <Drawer
        title="Chi tiết đánh giá"
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setActive(null);
        }}
        width={720}
      >
        {activeLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
            <Spin />
          </div>
        ) : active ? (
          <div>
            <Space wrap style={{ marginBottom: 12 }}>
              {statusTag(active.status)}
              <Button
                type="primary"
                disabled={active.status === "approved"}
                onClick={() =>
                  Modal.confirm({
                    title: "Duyệt đánh giá?",
                    okText: "Duyệt",
                    cancelText: "Huỷ",
                    onOk: () => doApprove(active.id),
                  })
                }
              >
                Duyệt
              </Button>
              <Button
                danger
                disabled={active.status === "rejected"}
                onClick={() =>
                  Modal.confirm({
                    title: "Từ chối đánh giá?",
                    okText: "Từ chối",
                    okButtonProps: { danger: true },
                    cancelText: "Huỷ",
                    onOk: () => doReject(active.id),
                  })
                }
              >
                Từ chối
              </Button>
              <Button
                danger
                onClick={() =>
                  Modal.confirm({
                    title: "Xoá đánh giá?",
                    content: "Hành động này sẽ xoá review và toàn bộ comment liên quan.",
                    okText: "Xoá",
                    okButtonProps: { danger: true },
                    cancelText: "Huỷ",
                    onOk: () => doDeleteReview(active.id),
                  })
                }
              >
                Xoá
              </Button>
            </Space>

            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Công ty">
                {active.company?.companyName || active.company?.fullName || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Người viết">
                {active.user?.name || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Overall rating">
                {active.overallRating ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Tiêu đề">
                {active.title || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Ưu điểm">
                {active.pros || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Nhược điểm">
                {active.cons || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {active.created_at ? dayjs(active.created_at).format("DD/MM/YYYY HH:mm") : "-"}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <Title level={5} style={{ marginBottom: 8 }}>
                Bình luận ({active.comments?.length || 0})
              </Title>
              {(active.comments || []).length === 0 ? (
                <Text type="secondary">Chưa có bình luận</Text>
              ) : (
                <Space direction="vertical" style={{ width: "100%" }}>
                  {(active.comments || []).map((c) => (
                    <Card key={c.id} size="small" bodyStyle={{ padding: 12 }}>
                      <Space style={{ width: "100%", justifyContent: "space-between" }}>
                        <div>
                          <Text strong>{c.user?.name || "-"}</Text>
                          <div style={{ fontSize: 12, color: "#888" }}>
                            {c.created_at ? dayjs(c.created_at).format("DD/MM/YYYY HH:mm") : "-"}
                          </div>
                        </div>
                        <Button
                          danger
                          size="small"
                          onClick={() =>
                            Modal.confirm({
                              title: "Xoá bình luận?",
                              okText: "Xoá",
                              okButtonProps: { danger: true },
                              cancelText: "Huỷ",
                              onOk: () => doDeleteComment(c.id),
                            })
                          }
                        >
                          Xoá
                        </Button>
                      </Space>
                      <div style={{ marginTop: 8 }}>{c.content}</div>
                    </Card>
                  ))}
                </Space>
              )}
            </div>
          </div>
        ) : (
          <Text type="secondary">Không có dữ liệu</Text>
        )}
      </Drawer>
    </div>
  );
}

export default CompanyReviewsManagement;
