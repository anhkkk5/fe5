import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Typography,
  Input,
  Button,
  Tag,
  Avatar,
  Rate,
  Empty,
  Spin,
  message,
} from "antd";
import {
  SearchOutlined,
  StarOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  ShopOutlined,
  CrownOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { getAllCompany } from "../../services/getAllCompany/companyServices";
import { getCompanyStats } from "../../services/companyReviews/companyReviewsServices";
import { getCookie } from "../../helpers/cookie";
import { decodeJwt } from "../../services/auth/authServices";
import "./style.css";

const { Title, Text } = Typography;
const { Search } = Input;

function CompanyReviewsPage() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [activeTab, setActiveTab] = useState("updated"); // updated, top
  const [userType, setUserType] = useState("");

  useEffect(() => {
    const token = getCookie("token") || localStorage.getItem("token") || "";
    const typeFromCookie = getCookie("userType") || "";
    if (typeFromCookie) {
      setUserType(typeFromCookie);
    } else if (token) {
      try {
        setUserType(decodeJwt(token)?.role || "");
      } catch (_e) {
        setUserType("");
      }
    }
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (userType && userType !== "candidate" && activeTab === "top") {
      setActiveTab("updated");
    }
  }, [userType, activeTab]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const data = await getAllCompany();
      
      // Lấy stats cho mỗi công ty
      const companiesWithStats = await Promise.all(
        (data || []).map(async (company) => {
          try {
            const stats = await getCompanyStats(company.id);
            return { ...company, stats };
          } catch (e) {
            return { ...company, stats: { averageRating: 0, totalReviews: 0 } };
          }
        })
      );

      setCompanies(companiesWithStats);
    } catch (error) {
      console.error("Error fetching companies:", error);
      message.error("Không thể tải danh sách công ty");
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter((company) =>
    company.companyName?.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  const topCompanies = [...filteredCompanies]
    .sort((a, b) => {
      const ratingDiff = (b.stats?.averageRating || 0) - (a.stats?.averageRating || 0);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.stats?.totalReviews || 0) - (a.stats?.totalReviews || 0);
    })
    .slice(0, 10);

  const sortedCompanies =
    activeTab === "top"
      ? [...filteredCompanies].sort(
          (a, b) => (b.stats?.averageRating || 0) - (a.stats?.averageRating || 0)
        )
      : [...filteredCompanies].sort(
          (a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
        );

  return (
    <div className="company-reviews-page">
      <div className="company-reviews-container">
        {/* Header */}
        <div className="reviews-header">
          <Title level={1} style={{ marginBottom: 8 }}>
            30k+ review từ 15.000 công ty khác nhau
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Đánh giá công ty và tìm kiếm nơi làm việc tốt nhất cho sự nghiệp của bạn
          </Text>
        </div>

        {/* Search Bar */}
        <div className="reviews-search-bar">
          <Search
            placeholder="Tìm kiếm công ty..."
            size="large"
            prefix={<SearchOutlined />}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ maxWidth: 600 }}
          />
        </div>

        {/* Tabs */}
        <div className="reviews-tabs">
          <Button
            type={activeTab === "updated" ? "primary" : "default"}
            onClick={() => setActiveTab("updated")}
          >
            Mới cập nhật
          </Button>
          {userType === "candidate" && (
            <Button
              type={activeTab === "top" ? "primary" : "default"}
              onClick={() => setActiveTab("top")}
            >
              Top công ty xịn
            </Button>
          )}
        </div>

        {userType === "candidate" && activeTab === "top" && !loading && (
          <div className="top-companies" style={{ marginTop: 16 }}>
            <div className="top-companies-hero">
              <div className="top-companies-hero-left">
                <div className="top-companies-badge">
                  <CrownOutlined />
                  <span>Top 10 công ty xịn</span>
                </div>
                <Title level={3} style={{ margin: "10px 0 0" }}>
                  Bảng xếp hạng theo số sao (cập nhật theo thời gian)
                </Title>
                <Text type="secondary">
                  Chọn công ty để xem chi tiết đánh giá và trải nghiệm làm việc.
                </Text>
              </div>
              <div className="top-companies-hero-right">
                <Button icon={<ReloadOutlined />} onClick={fetchCompanies}>
                  Làm mới
                </Button>
              </div>
            </div>

            {topCompanies.length === 0 ? (
              <Empty description="Chưa có dữ liệu xếp hạng" />
            ) : (
              <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                {topCompanies.map((company, idx) => (
                  <Col xs={24} sm={12} lg={idx < 3 ? 8 : 12} key={company.id}>
                    <Card
                      className={`top-company-card ${idx < 3 ? "top-company-card--podium" : ""}`}
                      hoverable
                      onClick={() => navigate(`/company-reviews/${company.id}`)}
                    >
                      <div className="top-company-rank">
                        <span className="top-company-rank-number">#{idx + 1}</span>
                        {idx === 0 && (
                          <span className="top-company-rank-icon">
                            <ThunderboltOutlined />
                          </span>
                        )}
                      </div>

                      <div className="top-company-header">
                        <Avatar
                          size={56}
                          src={company.logo}
                          style={{ backgroundColor: "#f0f0f0" }}
                        >
                          {company.companyName?.charAt(0) || "?"}
                        </Avatar>
                        <div className="top-company-info">
                          <Title level={5} style={{ margin: 0 }}>
                            {company.companyName}
                          </Title>
                          <div className="top-company-rating">
                            <Rate
                              disabled
                              value={company.stats?.averageRating || 0}
                              allowHalf
                              style={{ fontSize: 14 }}
                            />
                            <Text style={{ marginLeft: 8 }}>
                              {company.stats?.averageRating || 0}
                            </Text>
                          </div>
                        </div>
                      </div>

                      <div className="top-company-meta">
                        <Tag className="top-company-tag">
                          <StarOutlined /> {company.stats?.totalReviews || 0} review
                        </Tag>
                        <Text type="secondary" className="top-company-jobs">
                          <FileTextOutlined /> {Number(company.jobCount ?? company.jobs?.length ?? 0)} việc làm
                        </Text>
                        <Text type="secondary" className="top-company-address" title={company.address || ""}>
                          <EnvironmentOutlined /> {company.address || "Chưa cập nhật"}
                        </Text>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </div>
        )}

        {/* Company List */}
        {activeTab === "top" ? null : loading ? (
          <div style={{ textAlign: "center", padding: 50 }}>
            <Spin size="large" />
          </div>
        ) : sortedCompanies.length === 0 ? (
          <Empty description="Không tìm thấy công ty nào" />
        ) : (
          <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
            {sortedCompanies.map((company) => (
              <Col xs={24} sm={12} md={12} lg={8} key={company.id}>
                <Card
                  className="company-review-card"
                  hoverable
                  onClick={() => navigate(`/company-reviews/${company.id}`)}
                >
                  <div className="company-card-content">
                    <div className="company-card-badge">Mới cập nhật</div>
                    <div className="company-card-header">
                      <Avatar
                        size={64}
                        src={company.logo}
                        style={{ backgroundColor: "#f0f0f0" }}
                      >
                        {company.companyName?.charAt(0) || "?"}
                      </Avatar>
                      <div className="company-card-info">
                        <Title level={4} style={{ margin: 0 }}>
                          {company.companyName}
                        </Title>
                        <div className="company-rating">
                          <Rate
                            disabled
                            value={company.stats?.averageRating || 0}
                            allowHalf
                            style={{ fontSize: 14 }}
                          />
                          <Text style={{ marginLeft: 8 }}>
                            {company.stats?.averageRating || 0} sao |{" "}
                            {company.stats?.totalReviews || 0} review
                          </Text>
                        </div>
                      </div>
                    </div>

                    <div className="company-card-details">
                      <div className="company-detail-item">
                        <FileTextOutlined />{" "}
                        <Text>{Number(company.jobCount ?? company.jobs?.length ?? 0)} việc làm</Text>
                      </div>
                      <div className="company-detail-item">
                        <EnvironmentOutlined /> <Text>{company.address || "N/A"}</Text>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
}

export default CompanyReviewsPage;

