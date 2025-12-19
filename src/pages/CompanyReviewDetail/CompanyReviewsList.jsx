import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Rate,
  Tag,
  Button,
  Input,
  Avatar,
  Space,
  message,
  Spin,
} from "antd";
import {
  FlagOutlined,
  ShareAltOutlined,
  SendOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { getAllReviews, addComment, markHelpful } from "../../services/companyReviews/companyReviewsServices";
import { getCookie } from "../../helpers/cookie";
import dayjs from "dayjs";

const { Text, Paragraph, Title } = Typography;
const { TextArea } = Input;

function CompanyReviewsList({ companyId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentInputs, setCommentInputs] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = getCookie("token") || localStorage.getItem("token");
    setIsLoggedIn(!!token);
    fetchReviews();
  }, [companyId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await getAllReviews(companyId);
      setReviews(data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      message.error("Không thể tải reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (reviewId) => {
    const content = commentInputs[reviewId];
    if (!content?.trim()) {
      message.warning("Vui lòng nhập nội dung bình luận");
      return;
    }

    try {
      await addComment(reviewId, content);
      message.success("Đã thêm bình luận");
      setCommentInputs({ ...commentInputs, [reviewId]: "" });
      fetchReviews();
    } catch (error) {
      message.error("Không thể thêm bình luận");
    }
  };

  const handleMarkHelpful = async (reviewId) => {
    try {
      await markHelpful(reviewId);
      fetchReviews();
    } catch (error) {
      message.error("Không thể đánh dấu hữu ích");
    }
  };

  if (loading) {
    return <Spin />;
  }

  return (
    <div className="reviews-list">
      {reviews.length === 0 ? (
        <Card>
          <Text>Chưa có review nào</Text>
        </Card>
      ) : (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {reviews.map((review) => (
            <Card key={review.id} className="review-card">
              <div className="review-header">
                <div className="review-rating-header">
                  <Rate disabled value={review.overallRating} allowHalf />
                  <Text strong style={{ fontSize: 18, marginLeft: 8 }}>
                    {review.overallRating}
                  </Text>
                </div>
                <Tag color={review.employmentStatus === "current" ? "success" : "default"}>
                  {review.employmentStatus === "current" ? "Nhân viên hiện tại" : "Nhân viên cũ"}
                </Tag>
              </div>

              {review.title && (
                <Title level={4} style={{ marginTop: 16 }}>
                  {review.title}
                </Title>
              )}

              <div className="review-job-info">
                <Text type="secondary">
                  {review.jobTitle} - {review.location} -{" "}
                  {dayjs(review.created_at).format("DD/MM/YYYY")}
                </Text>
              </div>

              <div className="review-recommendations">
                {review.recommendToFriends && (
                  <Tag icon={<CheckCircleOutlined />} color="success">
                    Đề xuất cho bạn bè
                  </Tag>
                )}
                {review.ceoRating && (
                  <Tag icon={<CheckCircleOutlined />} color="processing">
                    Đánh giá hiệu quả CEO
                  </Tag>
                )}
                {review.businessOutlook && (
                  <Tag icon={<CheckCircleOutlined />} color="warning">
                    Triển vọng kinh doanh
                  </Tag>
                )}
              </div>

              {review.pros && (
                <div className="review-section">
                  <Text strong style={{ color: "#ff4d4f" }}>
                    Ưu điểm:
                  </Text>
                  <Paragraph>{review.pros}</Paragraph>
                </div>
              )}

              {review.cons && (
                <div className="review-section">
                  <Text strong style={{ color: "#ff4d4f" }}>
                    Nhược điểm:
                  </Text>
                  <Paragraph>{review.cons}</Paragraph>
                </div>
              )}

              <div className="review-helpful">
                <Text>Đánh giá này có hữu ích không?</Text>
                <Space>
                  <Button
                    size="small"
                    onClick={() => handleMarkHelpful(review.id)}
                  >
                    Có {review.helpfulCount || 0}
                  </Button>
                  <Button size="small">Không</Button>
                </Space>
              </div>

              {/* Comments Section */}
              <div className="review-comments">
                {review.comments && review.comments.length > 0 && (
                  <div className="comments-list">
                    {review.comments.map((comment) => (
                      <div key={comment.id} className="comment-item">
                        <Avatar size={32}>{comment.user?.name?.charAt(0) || "?"}</Avatar>
                        <div className="comment-content">
                          <Text strong>{comment.user?.name || "Anonymous"}</Text>
                          <Paragraph style={{ margin: 0 }}>{comment.content}</Paragraph>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {dayjs(comment.created_at).format("DD/MM/YYYY HH:mm")}
                          </Text>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {isLoggedIn && (
                  <div className="comment-input-section">
                    <Avatar size={32}>{getCookie("name")?.charAt(0) || "A"}</Avatar>
                    <TextArea
                      placeholder="Bạn có bình luận gì không?"
                      rows={2}
                      value={commentInputs[review.id] || ""}
                      onChange={(e) =>
                        setCommentInputs({ ...commentInputs, [review.id]: e.target.value })
                      }
                      style={{ flex: 1 }}
                    />
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={() => handleAddComment(review.id)}
                    >
                      Gửi
                    </Button>
                  </div>
                )}
              </div>

              <div className="review-actions">
                <Button type="text" icon={<FlagOutlined />}>
                  Báo cáo
                </Button>
                <Button type="text" icon={<ShareAltOutlined />}>
                  Chia sẻ
                </Button>
              </div>
            </Card>
          ))}
        </Space>
      )}
    </div>
  );
}

export default CompanyReviewsList;



