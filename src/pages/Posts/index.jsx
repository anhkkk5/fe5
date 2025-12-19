import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getAllPosts } from "../../services/posts/postsServices";
import { Card, Input, Empty, Spin, Tag, Pagination } from "antd";
import { SearchOutlined, CalendarOutlined, UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import "./style.css";
import bannerImage from "../../assets/building-banner.png";

const { Meta } = Card;

function PostsList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category");
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, [category]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await getAllPosts({
        category: category || undefined,
        status: "published",
      });
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      post.title?.toLowerCase().includes(searchLower) ||
      post.excerpt?.toLowerCase().includes(searchLower) ||
      post.category?.toLowerCase().includes(searchLower)
    );
  });

  const pageSize = 20;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPosts = filteredPosts.slice(startIndex, startIndex + pageSize);

  const handlePostClick = (post) => {
    navigate(`/posts/${post.slug || post.id}`);
  };

  if (loading) {
    return (
      <div className="posts-loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="posts-page">
      <div
        className="posts-banner"
        style={{ backgroundImage: `url(${bannerImage})` }}
      >
        <div className="posts-banner-inner">
          <h1 className="posts-title">
            {category ? `Bài viết: ${category}` : "Cẩm nang nghề nghiệp"}
          </h1>
          <Input
            placeholder="Tìm kiếm bài viết..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="posts-search-input"
            size="large"
          />
        </div>
      </div>

      <div className="posts-container">
        {filteredPosts.length === 0 ? (
        <Empty description="Chưa có bài viết nào" style={{ marginTop: 60 }} />
      ) : (
        <>
          <div className="posts-grid">
            {paginatedPosts.map((post) => (
              <Card
                key={post.id}
                hoverable
                className="post-card"
                cover={
                  post.thumbnail ? (
                    <img
                      alt={post.title}
                      src={post.thumbnail}
                      className="post-thumbnail"
                    />
                  ) : (
                    <div className="post-thumbnail-placeholder">
                      <span>Không có ảnh</span>
                    </div>
                  )
                }
                onClick={() => handlePostClick(post)}
              >
                <Tag color="blue" className="post-category">
                  {post.category}
                </Tag>
                <Meta
                  title={post.title}
                  description={
                    <div>
                      <p className="post-excerpt">
                        {post.excerpt || "Không có mô tả"}
                      </p>
                      <div className="post-meta">
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
          <div style={{ marginTop: 32, textAlign: "center" }}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredPosts.length}
              showSizeChanger={false}
              onChange={(page) => {
                window.scrollTo({ top: 0, behavior: "smooth" });
                setCurrentPage(page);
              }}
            />
          </div>
        </>
        )}
      </div>
    </div>
  );
}

export default PostsList;

