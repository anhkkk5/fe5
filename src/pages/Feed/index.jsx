import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Empty,
  Form,
  Input,
  List,
  Pagination,
  Select,
  Space,
  Typography,
  Upload,
  message,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { getCookie } from "../../helpers/cookie";
import { decodeJwt } from "../../services/auth/authServices";
import { uploadMultipleImages } from "../../services/Cloudinary/cloudinaryServices";
import { createFeedPost, deleteFeedPost, getFeedPosts } from "../../services/feedPosts/feedPostsServices";

const { Title, Text } = Typography;
const { TextArea } = Input;

const TYPE_OPTIONS = [
  { value: "post", label: "Viết bài" },
  { value: "job", label: "Tuyển dụng" },
  { value: "event", label: "Sự kiện" },
];

function FeedPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [type, setType] = useState(undefined);
  const [keyword, setKeyword] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);

  const token = useMemo(() => {
    return localStorage.getItem("token") || getCookie("token");
  }, []);

  const auth = useMemo(() => {
    if (!token) return null;
    return decodeJwt(token);
  }, [token]);

  const currentUserId = auth?.sub;
  const currentRole = auth?.role;

  const canPost = Boolean(token);

  const fetchFeed = async (nextPage = page) => {
    setLoading(true);
    try {
      const res = await getFeedPosts({
        page: nextPage,
        limit,
        type: type || undefined,
        keyword: keyword?.trim() ? keyword.trim() : undefined,
      });

      setItems(Array.isArray(res?.items) ? res.items : []);
      setTotal(Number(res?.total || 0));
      setPage(Number(res?.page || nextPage));
    } catch (e) {
      messageApi.error("Không thể tải bản tin");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed(1);
  }, [type]);

  const onSearch = () => {
    fetchFeed(1);
  };

  const onCreate = async (values) => {
    if (!canPost) {
      messageApi.warning("Bạn cần đăng nhập để đăng bài");
      return;
    }

    setCreating(true);
    try {
      let images = [];
      if (selectedFiles.length) {
        const uploadRes = await uploadMultipleImages(selectedFiles, "feed_posts");
        const arr = Array.isArray(uploadRes) ? uploadRes : [];
        images = arr.map((x) => x?.secure_url).filter(Boolean);
      }

      await createFeedPost({
        type: values.type,
        title: values.title || "",
        content: values.content,
        images,
      });

      messageApi.success("Đăng bài thành công");
      form.resetFields();
      setSelectedFiles([]);
      fetchFeed(1);
    } catch (e) {
      const backendMsg = e?.response?.data?.message;
      messageApi.error(
        backendMsg ? (Array.isArray(backendMsg) ? backendMsg.join(", ") : backendMsg) : "Đăng bài thất bại",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!canPost) {
      messageApi.warning("Bạn cần đăng nhập");
      return;
    }

    try {
      await deleteFeedPost(id);
      messageApi.success("Đã xoá bài");
      fetchFeed(page);
    } catch (e) {
      const backendMsg = e?.response?.data?.message;
      messageApi.error(
        backendMsg ? (Array.isArray(backendMsg) ? backendMsg.join(", ") : backendMsg) : "Xoá thất bại",
      );
    }
  };

  const uploadProps = {
    multiple: true,
    beforeUpload: (file) => {
      setSelectedFiles((prev) => {
        const next = [...prev, file];
        return next.slice(0, 10);
      });
      return false;
    },
    onRemove: (file) => {
      setSelectedFiles((prev) => prev.filter((f) => f.uid !== file.uid));
    },
    fileList: selectedFiles,
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      {contextHolder}

      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Bản tin
          </Title>
          <Text type="secondary">Cập nhật tuyển dụng, sự kiện và bài viết từ cộng đồng</Text>
        </div>

        <Card>
          <Form form={form} layout="vertical" onFinish={onCreate} initialValues={{ type: "post" }}>
            <Form.Item name="type" label="Loại" rules={[{ required: true, message: "Chọn loại bài" }]}>
              <Select options={TYPE_OPTIONS} />
            </Form.Item>

            <Form.Item name="title" label="Tiêu đề (tuỳ chọn)">
              <Input placeholder="Nhập tiêu đề..." />
            </Form.Item>

            <Form.Item name="content" label="Nội dung" rules={[{ required: true, message: "Nhập nội dung" }]}>
              <TextArea rows={4} placeholder="Bạn đang nghĩ gì?" />
            </Form.Item>

            <Form.Item label="Ảnh (tuỳ chọn)">
              <Upload {...uploadProps} listType="picture">
                <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
              </Upload>
            </Form.Item>

            <Space>
              <Button type="primary" htmlType="submit" loading={creating} disabled={!canPost}>
                Đăng
              </Button>
              {!canPost && <Text type="secondary">Bạn cần đăng nhập để đăng bài</Text>}
            </Space>
          </Form>
        </Card>

        <Card>
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Space>
              <Select
                allowClear
                placeholder="Lọc loại"
                style={{ width: 160 }}
                options={TYPE_OPTIONS}
                value={type}
                onChange={(v) => {
                  setType(v);
                }}
              />
              <Input
                placeholder="Tìm kiếm..."
                style={{ width: 260 }}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onPressEnter={onSearch}
              />
              <Button onClick={onSearch}>Tìm</Button>
            </Space>
          </Space>

          <div style={{ marginTop: 16 }}>
            <List
              loading={loading}
              dataSource={items}
              locale={{ emptyText: <Empty description="Chưa có bài đăng" /> }}
              renderItem={(item) => {
                const authorName = item?.user?.name || "Người dùng";
                const role = item?.user?.role;
                const createdAt = item?.created_at;

                const canDelete =
                  Boolean(token) &&
                  (String(currentRole || "") === "admin" ||
                    String(item?.user?.id || "") === String(currentUserId || ""));

                const typeLabel =
                  item?.type === "job" ? "Tuyển dụng" : item?.type === "event" ? "Sự kiện" : "Bài viết";

                return (
                  <List.Item
                    key={item?.id}
                    actions={
                      canDelete
                        ? [
                            <Button key="delete" danger type="link" onClick={() => handleDelete(item.id)}>
                              Xoá
                            </Button>,
                          ]
                        : []
                    }
                  >
                    <List.Item.Meta
                      avatar={<Avatar>{String(authorName || "U").slice(0, 1).toUpperCase()}</Avatar>}
                      title={
                        <Space direction="vertical" size={0}>
                          <Space>
                            <Text strong>{authorName}</Text>
                            {role && <Text type="secondary">({role})</Text>}
                            <Text type="secondary">- {typeLabel}</Text>
                          </Space>
                          {item?.title ? <Text>{item.title}</Text> : null}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={6} style={{ width: "100%" }}>
                          <Text style={{ whiteSpace: "pre-wrap" }}>{item?.content}</Text>
                          {Array.isArray(item?.images) && item.images.length ? (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                              {item.images.slice(0, 4).map((src, idx) => (
                                <img
                                  key={`${item.id}-${idx}`}
                                  src={src}
                                  alt="feed"
                                  style={{ width: "100%", borderRadius: 8, objectFit: "cover" }}
                                />
                              ))}
                            </div>
                          ) : null}
                          {createdAt ? (
                            <Text type="secondary">{dayjs(createdAt).format("DD/MM/YYYY HH:mm")}</Text>
                          ) : null}
                        </Space>
                      }
                    />
                  </List.Item>
                );
              }}
            />

            <div style={{ marginTop: 16, textAlign: "center" }}>
              <Pagination
                current={page}
                pageSize={limit}
                total={total}
                showSizeChanger={false}
                onChange={(p) => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  fetchFeed(p);
                }}
              />
            </div>
          </div>
        </Card>
      </Space>
    </div>
  );
}

export default FeedPage;
