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
} from "@ant-design/icons";
import { getAllCompany } from "../../services/getAllCompany/companyServices";
import { getCompanyStats } from "../../services/companyReviews/companyReviewsServices";
import "./style.css";

const { Title, Text } = Typography;
const { Search } = Input;

function CompanyReviewsPage() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [activeTab, setActiveTab] = useState("updated"); // updated, top

  useEffect(() => {
    fetchCompanies();
  }, []);

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
          <Button
            type={activeTab === "top" ? "primary" : "default"}
            onClick={() => setActiveTab("top")}
          >
            Top công ty xịn
          </Button>
        </div>

        {/* Company List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 50 }}>
            <Spin size="large" />
          </div>
        ) : sortedCompanies.length === 0 ? (
          <Empty description="Không tìm thấy công ty nào" />
        ) : (
          <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
            {sortedCompanies.map((company) => (
              <Col xs={24} sm={12} lg={12} key={company.id}>
                <Card
                  className="company-review-card"
                  hoverable
                  onClick={() => navigate(`/company-reviews/${company.id}`)}
                >
                  <div className="company-card-content">
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
                        <Text>{company.jobs?.length || 0} việc làm</Text>
                      </div>
                      <div className="company-detail-item">
                        <ShopOutlined /> <Text>{company.address || "N/A"}</Text>
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

