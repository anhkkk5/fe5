import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllPosts } from "../../services/posts/postsServices";
import { Card, Empty, Spin } from "antd";
import { CalendarOutlined, UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import "./style.css";
import bannerImage from "../../assets/building-banner.png";

const { Meta } = Card;

function CareerGuide() {
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
        status: "published",
      });
      if (Array.isArray(data)) {
        const sorted = [...data].sort((a, b) => {
          const dateA = new Date(a.published_at || a.created_at || 0).getTime();
          const dateB = new Date(b.published_at || b.created_at || 0).getTime();
          return dateB - dateA;
        });
        setPosts(sorted.slice(0, 6));
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
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
          <h1 className="career-guide__title">Cẩm nang nghề nghiệp</h1>
          <p className="career-guide__subtitle">
            Khám phá những bí quyết và kinh nghiệm để phát triển sự nghiệp của bạn
          </p>
        </div>
      </div>

      <div className="career-guide__container">
        <div className="career-guide__content">
          {posts.length > 0 && (
            <div className="career-guide__section">
              <h2 className="career-guide__section-title">Bài viết mới nhất</h2>
              {loading ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <Spin size="large" />
                </div>
              ) : (
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
              )}
              <div style={{ textAlign: "center", marginTop: "24px" }}>
                <button
                  onClick={() => navigate("/posts")}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#c41e3a",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: "500",
                  }}
                >
                  Xem tất cả bài viết
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CareerGuide;

