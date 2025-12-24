import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Modal,
  Empty,
  Form,
  Input,
  List,
  Pagination,
  Popover,
  Select,
  Space,
  Tag,
  Tabs,
  Tooltip,
  Typography,
  Upload,
  message,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { getCookie } from "../../helpers/cookie";
import { decodeJwt } from "../../services/auth/authServices";
import { uploadImage } from "../../services/Cloudinary/cloudinaryServices";
import { createFeedPost, deleteFeedPost, getFeedPosts } from "../../services/feedPosts/feedPostsServices";
import { getOrCreateConversationWith, sendChatMessage } from "../../services/chat/chatServices.jsx";
import { getMyFriends } from "../../services/friends/friendsServices.jsx";
import {
  getFeedPostReactionSummary,
  getMyFeedPostReaction,
  listFriendsReactions,
  reactFeedPost,
} from "../../services/feedPostReactions/feedPostReactionsServices.jsx";
import { createFeedPostComment, getFeedPostComments } from "../../services/feedPostComments/feedPostCommentsServices.jsx";

const { Title, Text } = Typography;
const { TextArea } = Input;

const TYPE_OPTIONS = [
  { value: "post", label: "Viết bài" },
  { value: "job", label: "Tuyển dụng" },
  { value: "event", label: "Sự kiện" },
];

const TYPE_FILTER_OPTIONS = [{ value: "all", label: "Tất cả" }, ...TYPE_OPTIONS];

const REACTIONS = [
  { type: "like", emoji: "👍", label: "Thích" },
  { type: "love", emoji: "❤️", label: "Yêu thích" },
  { type: "haha", emoji: "😆", label: "Haha" },
  { type: "wow", emoji: "😮", label: "Wow" },
  { type: "sad", emoji: "😢", label: "Buồn" },
  { type: "angry", emoji: "😡", label: "Phẫn nộ" },
];

const REACTION_TABS = [
  { key: "all", label: "Tất cả" },
  ...REACTIONS.map((r) => ({ key: r.type, label: r.emoji })),
];

function FeedPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [type, setType] = useState(undefined);
  const [keyword, setKeyword] = useState("");
  const [uploadFileList, setUploadFileList] = useState([]);

  const [reactionSummaryByPostId, setReactionSummaryByPostId] = useState({});
  const [myReactionByPostId, setMyReactionByPostId] = useState({});

  const [reactionsModalOpen, setReactionsModalOpen] = useState(false);
  const [reactionsModalPostId, setReactionsModalPostId] = useState(null);
  const [reactionsModalTab, setReactionsModalTab] = useState("all");
  const [reactionsModalLoading, setReactionsModalLoading] = useState(false);
  const [reactionsModalItems, setReactionsModalItems] = useState([]);

  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [commentsModalPost, setCommentsModalPost] = useState(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsTree, setCommentsTree] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [replyToId, setReplyToId] = useState(null);
  const [replyText, setReplyText] = useState("");

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareModalPost, setShareModalPost] = useState(null);
  const [shareFriendsLoading, setShareFriendsLoading] = useState(false);
  const [shareFriends, setShareFriends] = useState([]);
  const [shareSendingUserId, setShareSendingUserId] = useState(null);

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
  const canChat = Boolean(token) && String(currentRole || "").toLowerCase() === "candidate";

  const canUseFriends = Boolean(token) && String(currentRole || "").toLowerCase() === "candidate";

  const uploadedImages = useMemo(() => {
    return (Array.isArray(uploadFileList) ? uploadFileList : [])
      .filter((f) => f.status === "done")
      .map((f) => f.url || f?.response?.secure_url || f?.response?.url)
      .filter(Boolean);
  }, [uploadFileList]);

  const isUploadingImages = useMemo(() => {
    return (Array.isArray(uploadFileList) ? uploadFileList : []).some((f) => f.status === "uploading");
  }, [uploadFileList]);

  const fetchFeed = async (nextPage = page) => {
    setLoading(true);
    try {
      const res = await getFeedPosts({
        page: nextPage,
        limit,
        type: type || undefined,
        keyword: keyword?.trim() ? keyword.trim() : undefined,
      });

      const nextItems = Array.isArray(res?.items) ? res.items : [];
      setItems(nextItems);
      setTotal(Number(res?.total || 0));
      setPage(Number(res?.page || nextPage));

      const ids = nextItems.map((it) => it?.id).filter(Boolean);
      if (ids.length) {
        const [summaryResults, myResults] = await Promise.all([
          Promise.allSettled(ids.map((id) => getFeedPostReactionSummary(id))),
          token
            ? Promise.allSettled(ids.map((id) => getMyFeedPostReaction(id)))
            : Promise.resolve([]),
        ]);

        const nextSummaryMap = {};
        (summaryResults || []).forEach((r, idx) => {
          const id = ids[idx];
          if (r.status === "fulfilled") nextSummaryMap[id] = r.value;
        });
        setReactionSummaryByPostId((prev) => ({ ...prev, ...nextSummaryMap }));

        if (token) {
          const nextMyMap = {};
          (myResults || []).forEach((r, idx) => {
            const id = ids[idx];
            if (r.status === "fulfilled") nextMyMap[id] = r.value?.type || null;
          });
          setMyReactionByPostId((prev) => ({ ...prev, ...nextMyMap }));
        }
      }
    } catch (e) {
      messageApi.error("Không thể tải bản tin");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const getReactionMeta = (t) => {
    return REACTIONS.find((r) => r.type === t) || null;
  };

  const renderReactionIcon = (t, size = 16) => {
    const meta = getReactionMeta(t);
    if (!meta) return null;
    return (
      <span style={{ fontSize: size, lineHeight: 1 }} aria-label={meta.label}>
        {meta.emoji}
      </span>
    );
  };

  const refreshReactionsForPost = async (postId) => {
    try {
      const [summary, my] = await Promise.all([
        getFeedPostReactionSummary(postId),
        token ? getMyFeedPostReaction(postId) : Promise.resolve({ type: null }),
      ]);

      setReactionSummaryByPostId((prev) => ({ ...prev, [postId]: summary }));
      if (token) setMyReactionByPostId((prev) => ({ ...prev, [postId]: my?.type || null }));
    } catch (_e) {}
  };

  const handleReact = async (postId, reactionType) => {
    if (!token) {
      messageApi.warning("Bạn cần đăng nhập để thả cảm xúc");
      return;
    }
    try {
      await reactFeedPost(postId, reactionType);
      await refreshReactionsForPost(postId);
    } catch (_e) {
      messageApi.error("Không thể thả cảm xúc");
    }
  };

  const openReactionsModal = async (postId) => {
    if (!canUseFriends) {
      messageApi.warning("Chỉ ứng viên mới xem được bạn bè đã thả cảm xúc");
      return;
    }

    setReactionsModalPostId(postId);
    setReactionsModalTab("all");
    setReactionsModalItems([]);
    setReactionsModalOpen(true);

    if (!reactionSummaryByPostId[postId]) {
      await refreshReactionsForPost(postId);
    }
  };

  const loadReactionsModalList = async (postId, tabKey) => {
    if (!postId) return;
    setReactionsModalLoading(true);
    try {
      const data = await listFriendsReactions(postId, tabKey === "all" ? undefined : tabKey);
      setReactionsModalItems(Array.isArray(data?.items) ? data.items : []);
    } catch (_e) {
      setReactionsModalItems([]);
    } finally {
      setReactionsModalLoading(false);
    }
  };

  useEffect(() => {
    if (!reactionsModalOpen) return;
    if (!reactionsModalPostId) return;
    loadReactionsModalList(reactionsModalPostId, reactionsModalTab);
  }, [reactionsModalOpen, reactionsModalPostId, reactionsModalTab]);

  const openCommentsModal = async (post) => {
    setCommentsModalPost(post);
    setCommentsModalOpen(true);
    setCommentsTree([]);
    setCommentText("");
    setReplyToId(null);
    setReplyText("");
    if (!post?.id) return;
    setCommentsLoading(true);
    try {
      const data = await getFeedPostComments(post.id);
      setCommentsTree(Array.isArray(data?.items) ? data.items : []);
    } catch (_e) {
      setCommentsTree([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const submitComment = async () => {
    if (!token) {
      messageApi.warning("Bạn cần đăng nhập để bình luận");
      return;
    }

    const content = (commentText || "").trim();
    if (!content) return;
    const postId = commentsModalPost?.id;
    if (!postId) return;

    try {
      await createFeedPostComment(postId, { content });
      setCommentText("");
      const data = await getFeedPostComments(postId);
      setCommentsTree(Array.isArray(data?.items) ? data.items : []);
    } catch (_e) {
      messageApi.error("Không thể bình luận");
    }
  };

  const submitReply = async () => {
    if (!token) {
      messageApi.warning("Bạn cần đăng nhập để trả lời bình luận");
      return;
    }

    const content = (replyText || "").trim();
    if (!content) return;
    const postId = commentsModalPost?.id;
    if (!postId || !replyToId) return;

    try {
      await createFeedPostComment(postId, { content, parentId: replyToId });
      setReplyText("");
      setReplyToId(null);
      const data = await getFeedPostComments(postId);
      setCommentsTree(Array.isArray(data?.items) ? data.items : []);
    } catch (_e) {
      messageApi.error("Không thể trả lời bình luận");
    }
  };

  const openShareModal = async (post) => {
    if (!canUseFriends) {
      messageApi.warning("Chỉ ứng viên mới chia sẻ cho bạn bè");
      return;
    }

    setShareModalPost(post);
    setShareModalOpen(true);
    setShareFriends([]);
    setShareSendingUserId(null);
    setShareFriendsLoading(true);
    try {
      const data = await getMyFriends();
      const list = Array.isArray(data) ? data : [];
      setShareFriends(list);
    } catch (_e) {
      setShareFriends([]);
    } finally {
      setShareFriendsLoading(false);
    }
  };

  const handleShareToFriend = async (friendUserId) => {
    const postId = shareModalPost?.id;
    if (!postId) return;
    try {
      setShareSendingUserId(friendUserId);
      const conv = await getOrCreateConversationWith(friendUserId);
      if (!conv?.id) {
        messageApi.error("Không thể bắt đầu chat");
        return;
      }

      const link = `${window.location.origin}/feed#post-${postId}`;
      const title = (shareModalPost?.title || "").trim();
      const content = title ? `Chia sẻ bài viết: ${title}\n${link}` : `Chia sẻ bài viết:\n${link}`;
      await sendChatMessage(conv.id, content);
      messageApi.success("Đã gửi vào đoạn chat");
      setShareModalOpen(false);
      navigate(`/chat?conversationId=${conv.id}`);
    } catch (e) {
      if (e?.response?.status === 403) {
        messageApi.error("Bạn cần kết bạn trước khi chat");
        return;
      }
      messageApi.error("Chia sẻ thất bại");
    } finally {
      setShareSendingUserId(null);
    }
  };

  const handleChatWith = async (otherUserId) => {
    if (!canChat) {
      messageApi.warning("Bạn cần đăng nhập bằng tài khoản ứng viên để chat");
      return;
    }

    if (!otherUserId || String(otherUserId) === String(currentUserId || "")) return;

    try {
      const conv = await getOrCreateConversationWith(otherUserId);
      if (!conv?.id) {
        messageApi.error("Không thể bắt đầu chat");
        return;
      }
      navigate(`/chat?conversationId=${conv.id}`);
    } catch (e) {
      if (e?.response?.status === 403) {
        messageApi.error("Bạn cần kết bạn trước khi chat");
        return;
      }
      messageApi.error("Không thể bắt đầu chat");
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

    if (isUploadingImages) {
      messageApi.warning("Ảnh đang upload, vui lòng đợi...");
      return;
    }

    setCreating(true);
    try {
      await createFeedPost({
        type: values.type,
        title: values.title || "",
        content: values.content,
        images: uploadedImages,
      });

      messageApi.success("Đăng bài thành công");
      form.resetFields();
      setUploadFileList([]);
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
    accept: "image/jpeg,image/jpg,image/png,image/gif",
    listType: "picture-card",
    fileList: uploadFileList,
    onChange: ({ file, fileList }) => {
      const next = (fileList || []).slice(0, 10).map((f) => {
        if (!f.url && (f?.response?.secure_url || f?.response?.url)) {
          return { ...f, url: f.response.secure_url || f.response.url };
        }
        return f;
      });
      setUploadFileList(next);
      if (file?.status === "error") {
        messageApi.error("Upload ảnh thất bại");
      }
    },
    beforeUpload: (file) => {
      if (file?.size > 5 * 1024 * 1024) {
        messageApi.error("Kích thước ảnh tối đa 5MB");
        return Upload.LIST_IGNORE;
      }
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
      if (!validTypes.includes(file.type)) {
        messageApi.error("Chỉ chấp nhận JPG, PNG, GIF");
        return Upload.LIST_IGNORE;
      }
      return true;
    },
    customRequest: async ({ file, onSuccess, onError, onProgress }) => {
      try {
        onProgress?.({ percent: 30 });
        const res = await uploadImage(file, "feed_posts");
        onProgress?.({ percent: 100 });
        onSuccess?.(res);
      } catch (e) {
        onError?.(e);
      }
    },
  };

  const renderTypeTag = (t) => {
    if (t === "job") return <Tag color="blue">Tuyển dụng</Tag>;
    if (t === "event") return <Tag color="gold">Sự kiện</Tag>;
    return <Tag color="default">Bài viết</Tag>;
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
              <Upload {...uploadProps}>
                {uploadFileList.length >= 10 ? null : (
                  <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
                )}
              </Upload>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">Ảnh sẽ được upload ngay khi chọn (tối đa 10 ảnh, mỗi ảnh ≤ 5MB)</Text>
              </div>
            </Form.Item>

            <Space>
              <Button type="primary" htmlType="submit" loading={creating} disabled={!canPost || isUploadingImages}>
                Đăng
              </Button>
              {!canPost && <Text type="secondary">Bạn cần đăng nhập để đăng bài</Text>}
              {isUploadingImages && <Text type="secondary">Đang upload ảnh...</Text>}
            </Space>
          </Form>
        </Card>

        <Card>
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Space>
              <Select
                placeholder="Lọc loại"
                style={{ width: 160 }}
                options={TYPE_FILTER_OPTIONS}
                value={type || "all"}
                onChange={(v) => {
                  setType(v === "all" ? undefined : v);
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

                const reactionSummary = reactionSummaryByPostId[item?.id] || null;
                const myReaction = myReactionByPostId[item?.id] || null;
                const counts = reactionSummary?.counts || {};
                const totalReactions = Number(reactionSummary?.total || 0);
                const iconTypes = REACTIONS.map((r) => r.type).filter((t) => Number(counts?.[t] || 0) > 0);
                const topIcons = iconTypes.slice(0, 2);

                const canDelete =
                  Boolean(token) &&
                  (String(currentRole || "") === "admin" ||
                    String(item?.user?.id || "") === String(currentUserId || ""));

                const typeLabel =
                  item?.type === "job" ? "Tuyển dụng" : item?.type === "event" ? "Sự kiện" : "Bài viết";

                return (
                  <List.Item
                    key={item?.id}
                    style={{ padding: 0, border: "none" }}
                  >
                    <Card id={`post-${item?.id}`} style={{ width: "100%" }} bodyStyle={{ padding: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ display: "flex", gap: 12, minWidth: 0, flex: 1 }}>
                          <Avatar size={40}>{String(authorName || "U").slice(0, 1).toUpperCase()}</Avatar>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <Text strong style={{ fontSize: 14 }}>
                                {authorName}
                              </Text>
                              {role ? <Text type="secondary">({role})</Text> : null}
                              {renderTypeTag(item?.type)}
                            </div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {createdAt ? dayjs(createdAt).format("DD/MM/YYYY HH:mm") : ""}
                            </Text>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {canDelete ? (
                            <Button danger type="link" onClick={() => handleDelete(item.id)}>
                              Xoá
                            </Button>
                          ) : null}
                        </div>
                      </div>

                      {item?.title ? (
                        <div style={{ marginTop: 12 }}>
                          <Text strong style={{ fontSize: 16, wordBreak: "break-word" }}>
                            {item.title}
                          </Text>
                        </div>
                      ) : null}

                      <div style={{ marginTop: 8 }}>
                        <Text style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{item?.content}</Text>
                      </div>

                      {Array.isArray(item?.images) && item.images.length ? (
                        <div
                          style={{
                            marginTop: 12,
                            display: "grid",
                            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                            gap: 8,
                          }}
                        >
                          {item.images.slice(0, 4).map((src, idx) => (
                            <img
                              key={`${item.id}-${idx}`}
                              src={src}
                              alt="feed"
                              style={{ width: "100%", borderRadius: 10, objectFit: "cover", maxHeight: 260 }}
                            />
                          ))}
                        </div>
                      ) : null}

                      {totalReactions > 0 ? (
                        <div
                          onClick={() => openReactionsModal(item.id)}
                          style={{
                            marginTop: 12,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            cursor: canUseFriends ? "pointer" : "default",
                            userSelect: "none",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                              {topIcons.map((t) => (
                                <span key={t} style={{ display: "inline-flex" }}>
                                  {renderReactionIcon(t, 16)}
                                </span>
                              ))}
                            </div>
                            <Text type="secondary">{totalReactions}</Text>
                          </div>

                          <Text type="secondary"> </Text>
                        </div>
                      ) : null}

                      <div
                        style={{
                          marginTop: 8,
                          paddingTop: 8,
                          borderTop: "1px solid #f0f0f0",
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 8,
                        }}
                      >
                        <Popover
                          trigger={["hover"]}
                          placement="topLeft"
                          content={
                            <div style={{ display: "flex", gap: 8, padding: 6 }}>
                              {REACTIONS.map((r) => (
                                <Tooltip key={r.type} title={r.label}>
                                  <span
                                    style={{
                                      fontSize: 22,
                                      cursor: "pointer",
                                      transform: "scale(1)",
                                      transition: "transform 0.12s ease",
                                    }}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleReact(item.id, r.type);
                                    }}
                                    onMouseEnter={(e) => {
                                      try {
                                        e.currentTarget.style.transform = "scale(1.2)";
                                      } catch (_e) {}
                                    }}
                                    onMouseLeave={(e) => {
                                      try {
                                        e.currentTarget.style.transform = "scale(1)";
                                      } catch (_e) {}
                                    }}
                                  >
                                    {r.emoji}
                                  </span>
                                </Tooltip>
                              ))}
                            </div>
                          }
                        >
                          <Button
                            type="text"
                            onClick={() => {
                              handleReact(item.id, "like");
                            }}
                          >
                            {myReaction ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                {renderReactionIcon(myReaction, 16)}
                                <span>{getReactionMeta(myReaction)?.label || "Thích"}</span>
                              </span>
                            ) : (
                              "Thích"
                            )}
                          </Button>
                        </Popover>

                        <Button type="text" onClick={() => openCommentsModal(item)}>
                          Bình luận
                        </Button>

                        <Button type="text" onClick={() => openShareModal(item)}>
                          Chia sẻ
                        </Button>
                      </div>

                      <div
                        style={{
                          marginTop: 10,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {typeLabel}
                        </Text>

                        {canChat && item?.user?.id && String(item.user.id) !== String(currentUserId || "") ? (
                          <Button type="link" onClick={() => handleChatWith(item.user.id)}>
                            Chat trực tiếp
                          </Button>
                        ) : null}
                      </div>
                    </Card>
                  </List.Item>
                );
              }}
            />

            <Modal
              open={reactionsModalOpen}
              onCancel={() => setReactionsModalOpen(false)}
              footer={null}
              title="Cảm xúc"
              width={720}
            >
              <Tabs
                activeKey={reactionsModalTab}
                onChange={(k) => setReactionsModalTab(k)}
                items={REACTION_TABS.map((t) => {
                  const summary = reactionsModalPostId ? reactionSummaryByPostId[reactionsModalPostId] : null;
                  const c = summary?.counts || {};
                  const total = Number(summary?.total || 0);
                  const count = t.key === "all" ? total : Number(c?.[t.key] || 0);
                  const label = t.key === "all" ? `${t.label} ${count}` : `${t.label} ${count}`;
                  return { key: t.key, label };
                })}
              />

              {reactionsModalLoading ? (
                <div style={{ padding: 20, textAlign: "center" }}>
                  <Text type="secondary">Đang tải...</Text>
                </div>
              ) : null}

              {!reactionsModalLoading && (!reactionsModalItems || reactionsModalItems.length === 0) ? (
                <Empty description="Không có bạn bè của bạn thả cảm xúc ở mục này" />
              ) : null}

              {!reactionsModalLoading && reactionsModalItems && reactionsModalItems.length ? (
                <List
                  dataSource={reactionsModalItems}
                  renderItem={(it) => {
                    const u = it?.user;
                    return (
                      <List.Item>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
                          <Avatar>{String(u?.name || "U").slice(0, 1).toUpperCase()}</Avatar>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Text strong>{u?.name || "Người dùng"}</Text>
                          </div>
                          <div style={{ width: 36, textAlign: "right" }}>{renderReactionIcon(it?.type, 18)}</div>
                        </div>
                      </List.Item>
                    );
                  }}
                />
              ) : null}
            </Modal>

            <Modal
              open={commentsModalOpen}
              onCancel={() => setCommentsModalOpen(false)}
              footer={null}
              title="Bình luận"
              width={760}
            >
              <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: 6 }}>
                {commentsLoading ? (
                  <div style={{ padding: 16, textAlign: "center" }}>
                    <Text type="secondary">Đang tải...</Text>
                  </div>
                ) : null}

                {!commentsLoading && (!commentsTree || commentsTree.length === 0) ? (
                  <Empty description="Chưa có bình luận" />
                ) : null}

                {!commentsLoading && commentsTree && commentsTree.length ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {(commentsTree || []).map((c) => (
                      <div key={c.id}>
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <Avatar size={34}>{String(c?.user?.name || "U").slice(0, 1).toUpperCase()}</Avatar>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                background: "#f5f5f5",
                                borderRadius: 12,
                                padding: "8px 12px",
                              }}
                            >
                              <Text strong>{c?.user?.name || "Người dùng"}</Text>
                              <div style={{ whiteSpace: "pre-wrap" }}>{c?.content}</div>
                            </div>
                            <div style={{ marginTop: 6, display: "flex", gap: 10 }}>
                              <Button type="link" size="small" onClick={() => setReplyToId(c.id)}>
                                Trả lời
                              </Button>
                            </div>

                            {replyToId === c.id ? (
                              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                                <Input
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Viết trả lời..."
                                  onPressEnter={(e) => {
                                    e.preventDefault();
                                    submitReply();
                                  }}
                                />
                                <Button type="primary" onClick={submitReply}>
                                  Gửi
                                </Button>
                              </div>
                            ) : null}

                            {Array.isArray(c?.replies) && c.replies.length ? (
                              <div style={{ marginTop: 10, paddingLeft: 34, display: "flex", flexDirection: "column", gap: 10 }}>
                                {c.replies.map((r) => (
                                  <div key={r.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                    <Avatar size={28}>{String(r?.user?.name || "U").slice(0, 1).toUpperCase()}</Avatar>
                                    <div style={{ flex: 1 }}>
                                      <div
                                        style={{
                                          background: "#f5f5f5",
                                          borderRadius: 12,
                                          padding: "8px 12px",
                                        }}
                                      >
                                        <Text strong>{r?.user?.name || "Người dùng"}</Text>
                                        <div style={{ whiteSpace: "pre-wrap" }}>{r?.content}</div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
                <Input.TextArea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  placeholder="Viết bình luận..."
                  onPressEnter={(e) => {
                    if (e.shiftKey) return;
                    e.preventDefault();
                    submitComment();
                  }}
                />
                <Button type="primary" onClick={submitComment}>
                  Gửi
                </Button>
              </div>
            </Modal>

            <Modal
              open={shareModalOpen}
              onCancel={() => setShareModalOpen(false)}
              footer={null}
              title="Chia sẻ cho bạn bè"
              width={720}
            >
              {shareFriendsLoading ? (
                <div style={{ padding: 16, textAlign: "center" }}>
                  <Text type="secondary">Đang tải...</Text>
                </div>
              ) : null}

              {!shareFriendsLoading && (!shareFriends || shareFriends.length === 0) ? (
                <Empty description="Bạn chưa có bạn bè" />
              ) : null}

              {!shareFriendsLoading && shareFriends && shareFriends.length ? (
                <List
                  grid={{ gutter: 12, xs: 2, sm: 3, md: 4, lg: 4 }}
                  dataSource={shareFriends}
                  renderItem={(f) => {
                    const u = f?.friend;
                    return (
                      <List.Item>
                        <Card
                          hoverable
                          bodyStyle={{ padding: 10, textAlign: "center" }}
                          onClick={() => handleShareToFriend(u?.id)}
                        >
                          <Avatar size={46} style={{ marginBottom: 8 }}>
                            {String(u?.name || "U").slice(0, 1).toUpperCase()}
                          </Avatar>
                          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {u?.name || "Người dùng"}
                          </div>
                          <Button type="primary" size="small" loading={String(shareSendingUserId || "") === String(u?.id || "")}>
                            Gửi
                          </Button>
                        </Card>
                      </List.Item>
                    );
                  }}
                />
              ) : null}
            </Modal>

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
