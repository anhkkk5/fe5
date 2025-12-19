import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllPosts } from "../../services/posts/postsServices";
import { Card, Empty, Spin } from "antd";
import { CalendarOutlined, UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import "../CareerGuide/style.css";
import bannerImage from "../../assets/building-banner.png";

const { Meta } = Card;

function MarketTrends() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await getAllPosts({
        category: "Thị trường & xu hướng tuyển dụng",
        status: "published",
      });
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching market trends posts:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePostClick = (post) => {
    navigate(`/posts/${post.slug || post.id}`);
  };

  return (
    <div className="career-guide">
      <div
        className="career-guide__banner-full"
        style={{ backgroundImage: `url(${bannerImage})` }}
      >
        <div className="career-guide__banner-inner">
          <h1 className="career-guide__title">Thị trường & xu hướng tuyển dụng</h1>
          <p className="career-guide__subtitle">
            Cập nhật những xu hướng mới nhất trong thị trường lao động và tuyển dụng
          </p>
        </div>
      </div>

      <div className="career-guide__container">
        <div className="career-guide__content">
          <div className="career-guide__section">
            <h2 className="career-guide__section-title">Bài viết</h2>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <Spin size="large" />
              </div>
            ) : posts.length > 0 ? (
              <div className="career-guide__posts-grid">
                {posts.map((post) => (
                  <Card
                    key={post.id}
                    hoverable
                    className="career-guide__post-card"
                    cover={
                      post.thumbnail ? (
                        <img
                          alt={post.title}
                          src={post.thumbnail}
                          className="career-guide__post-thumbnail"
                        />
                      ) : null
                    }
                    onClick={() => handlePostClick(post)}
                  >
                    <Meta
                      title={post.title}
                      description={
                        <div>
                          <p
                            style={{
                              fontSize: "14px",
                              color: "#666",
                              margin: "8px 0",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrientation: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {post.excerpt || "Không có mô tả"}
                          </p>
                          <div
                            style={{
                              display: "flex",
                              gap: "12px",
                              fontSize: "12px",
                              color: "#999",
                              marginTop: "8px",
                            }}
                          >
                            <span>
                              <UserOutlined /> {post.author || "Admin"}
                            </span>
                            {post.published_at && (
                              <span>
                                <CalendarOutlined />{" "}
                                {dayjs(post.published_at).format("DD/MM/YYYY")}
                              </span>
                            )}
                          </div>
                        </div>
                      }
                    />
                  </Card>
                ))}
              </div>
            ) : (
              <Empty description="Chưa có bài viết nào" style={{ marginTop: 40 }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarketTrends;

