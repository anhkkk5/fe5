import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPostDetail, getAllPosts } from "../../services/posts/postsServices";
import { Spin, Tag, Empty, Card } from "antd";
import { CalendarOutlined, UserOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { Button } from "antd";
import dayjs from "dayjs";
import "./detail.css";

function PostDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      // Thử lấy theo slug trước
      let postData;
      try {
        postData = await getPostDetail(slug);
      } catch (error) {
        // Nếu không tìm thấy theo slug, thử tìm theo ID
        const allPosts = await getAllPosts({ status: "published" });
        postData = Array.isArray(allPosts)
          ? allPosts.find((p) => p.id === parseInt(slug) || p.slug === slug)
          : null;
      }

      if (postData) {
        setPost(postData);
        // Lấy bài viết liên quan
        fetchRelatedPosts(postData.category, postData.id);
      }
    } catch (error) {
      console.error("Error fetching post:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedPosts = async (category, excludeId) => {
    try {
      const data = await getAllPosts({
        category,
        status: "published",
      });
      const related = Array.isArray(data)
        ? data.filter((p) => p.id !== excludeId).slice(0, 3)
        : [];
      setRelatedPosts(related);
    } catch (error) {
      console.error("Error fetching related posts:", error);
    }
  };

  if (loading) {
    return (
      <div className="post-detail-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="post-detail-container">
        <Empty description="Không tìm thấy bài viết" />
      </div>
    );
  }

  return (
    <div className="post-detail-container">
      <div className="post-detail-content">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ marginBottom: 24 }}
        >
          Quay lại
        </Button>

        <article className="post-article">
          {post.thumbnail && (
            <img
              src={post.thumbnail}
              alt={post.title}
              className="post-detail-thumbnail"
            />
          )}

          <div className="post-detail-header">
            <Tag color="blue" className="post-detail-category">
              {post.category}
            </Tag>
            <h1 className="post-detail-title">{post.title}</h1>
            <div className="post-detail-meta">
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

          {post.excerpt && (
            <div className="post-detail-excerpt">
              <p>{post.excerpt}</p>
            </div>
          )}

          <div
            className="post-detail-content-html"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>

        {relatedPosts.length > 0 && (
          <div className="related-posts">
            <h2 className="related-posts-title">Bài viết liên quan</h2>
            <div className="related-posts-slider">
              <div className="related-posts-track">
                {[...relatedPosts, ...relatedPosts].map((relatedPost, index) => (
                  <Card
                    key={`${relatedPost.id}-${index}`}
                    hoverable
                    className="related-post-card"
                    cover={
                      relatedPost.thumbnail ? (
                        <img
                          alt={relatedPost.title}
                          src={relatedPost.thumbnail}
                          className="related-post-thumbnail"
                        />
                      ) : null
                    }
                    onClick={() => navigate(`/posts/${relatedPost.slug || relatedPost.id}`)}
                  >
                    <Card.Meta
                      title={relatedPost.title}
                      description={
                        <div>
                          <Tag color="blue" style={{ marginBottom: 8 }}>
                            {relatedPost.category}
                          </Tag>
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#666",
                              margin: 0,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrientation: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {relatedPost.excerpt || "Không có mô tả"}
                          </p>
                        </div>
                      }
                    />
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PostDetail;

