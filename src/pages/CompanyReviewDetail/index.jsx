import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Avatar,
  Rate,
  Button,
  Spin,
  message,
  Modal,
} from "antd";
import {
  EnvironmentOutlined,
  UserOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  StarOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  TeamOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { getDetaiCompany } from "../../services/getAllCompany/companyServices";
import { getCompanyStats, getAllReviews } from "../../services/companyReviews/companyReviewsServices";
import { getListJob } from "../../services/jobServices/jobServices";
import { getCookie } from "../../helpers/cookie";
import dayjs from "dayjs";
import CompanyReviewsList from "./CompanyReviewsList";
import CompanyReviewForm from "./CompanyReviewForm";
import "./style.css";

const { Title, Text, Paragraph } = Typography;

function CompanyReviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [stats, setStats] = useState(null);
  const [jobsCount, setJobsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    const token = getCookie("token") || localStorage.getItem("token");
    setIsLoggedIn(!!token);
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [companyData, statsData, jobsList] = await Promise.all([
        getDetaiCompany(id),
        getCompanyStats(id),
        getListJob(id).catch(() => []),
      ]);
      setCompany(companyData);
      setStats(statsData);
      setJobsCount(Array.isArray(jobsList) ? jobsList.length : 0);
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Không thể tải thông tin công ty");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!company) {
    return <div>Không tìm thấy công ty</div>;
  }


  return (
    <div className="company-review-detail-page">
      <div className="company-review-detail-container">
        {/* Header Banner */}
        <div className="company-banner">
          <div className="company-banner-content">
            <div className="company-header-info">
              <Avatar size={80} src={company.logo} style={{ backgroundColor: "#f0f0f0" }}>
                {company.companyName?.charAt(0) || "?"}
              </Avatar>
              <div className="company-header-text">
                <Title level={2} style={{ margin: 0, color: "#262626" }}>
                  {company.companyName}
                </Title>
                <div className="company-rating-header">
                  <Rate disabled value={stats?.averageRating || 0} allowHalf />
                  <Text style={{ marginLeft: 8, fontSize: 16, color: "#262626" }}>
                    {stats?.averageRating || 0}
                  </Text>
                </div>
                <div className="company-info-row">
                  <Text
                    className="company-info-item"
                    style={{ color: "#666" }}
                    ellipsis={{ tooltip: company.address || "N/A" }}
                  >
                    <EnvironmentOutlined style={{ marginRight: 4 }} /> {company.address || "N/A"}
                  </Text>
                  <Text style={{ color: "#666" }}>
                    <UserOutlined style={{ marginRight: 4 }} /> 25 - 100 nhân viên
                  </Text>
                  <Text style={{ color: "#666" }}>
                    <FileTextOutlined style={{ marginRight: 4 }} /> {jobsCount} việc làm
                  </Text>
                  {company.website && (
                    <a
                      className="company-info-item"
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#1890ff" }}
                      title={company.website}
                    >
                      <GlobalOutlined style={{ marginRight: 4 }} /> Xem trang web
                    </a>
                  )}
                </div>
                <Tag
                  color="success"
                  className="company-desc-tag"
                  style={{ marginTop: 8 }}
                >
                  <span className="company-desc-text" title={company.description || "Công ty"}>
                    {company.description || "Công ty"}
                  </span>
                </Tag>
              </div>
            </div>
            <div className="company-header-actions">
              {isLoggedIn && (
                <>
                  <Button>Theo dõi</Button>
                  <Button
                    type="primary"
                    onClick={() => setShowReviewForm(true)}
                  >
                    + Đánh giá
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Overview Section */}
        <div className="company-overview" style={{ marginTop: 24 }}>
          <Card>
            <Title level={4} style={{ marginBottom: 20 }}>
              Thông tin tổng quan
            </Title>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <div className="overview-item overview-item--website">
                  <div className="overview-item-icon overview-icon-website">
                    <GlobalOutlined />
                  </div>
                  <div className="overview-item-content">
                    <div className="overview-item-label">Website</div>
                    <div className="overview-item-value">
                      {company.website ? (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#1890ff" }}
                        >
                          {company.website}
                        </a>
                      ) : (
                        <Text type="secondary">Chưa cập nhật</Text>
                      )}
                    </div>
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <div className="overview-item overview-item--email">
                  <div className="overview-item-icon overview-icon-email">
                    <MailOutlined />
                  </div>
                  <div className="overview-item-content">
                    <div className="overview-item-label">Email</div>
                    <div className="overview-item-value">
                      {company.email ? (
                        <a href={`mailto:${company.email}`} style={{ color: "#1890ff" }}>
                          {company.email}
                        </a>
                      ) : (
                        <Text type="secondary">Chưa cập nhật</Text>
                      )}
                    </div>
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <div className="overview-item overview-item--location">
                  <div className="overview-item-icon overview-icon-location">
                    <EnvironmentOutlined />
                  </div>
                  <div className="overview-item-content">
                    <div className="overview-item-label">Trụ sở chính</div>
                    <div className="overview-item-value">
                      {company.address || <Text type="secondary">Chưa cập nhật</Text>}
                    </div>
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <div className="overview-item overview-item--team">
                  <div className="overview-item-icon overview-icon-team">
                    <TeamOutlined />
                  </div>
                  <div className="overview-item-content">
                    <div className="overview-item-label">Quy mô</div>
                    <div className="overview-item-value">
                      <Text>25 - 100 nhân viên</Text>
                    </div>
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <div className="overview-item overview-item--field">
                  <div className="overview-item-icon overview-icon-field">
                    <FileTextOutlined />
                  </div>
                  <div className="overview-item-content">
                    <div className="overview-item-label">Lĩnh vực hoạt động</div>
                    <div className="overview-item-value overview-item-value--multiline">
                      {company.description ? (
                        <Tag color="processing" className="overview-multiline-tag">
                          {company.description}
                        </Tag>
                      ) : (
                        <Text type="secondary">Chưa cập nhật</Text>
                      )}
                    </div>
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <div className="overview-item overview-item--calendar">
                  <div className="overview-item-icon overview-icon-calendar">
                    <CalendarOutlined />
                  </div>
                  <div className="overview-item-content">
                    <div className="overview-item-label">Thành lập</div>
                    <div className="overview-item-value">
                      {company.created_at
                        ? dayjs(company.created_at).format("YYYY")
                        : <Text type="secondary">Chưa cập nhật</Text>}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>

            {company.description && (
              <div className="overview-description" style={{ marginTop: 24 }}>
                <Title level={5} style={{ marginBottom: 12 }}>
                  Giới thiệu về công ty
                </Title>
                <Paragraph style={{ fontSize: 14, lineHeight: 1.8, color: "#595959" }}>
                  {company.description}
                </Paragraph>
              </div>
            )}
          </Card>
        </div>

        {/* Reviews Section */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0 }}>
              Đánh giá công ty ({stats?.totalReviews || 0})
            </Title>
            {isLoggedIn && (
              <Button
                type="primary"
                onClick={() => setShowReviewForm(true)}
              >
                + Đánh giá
              </Button>
            )}
          </div>
          <CompanyReviewsList companyId={id} />
        </div>

        {/* Review Form Modal */}
        <Modal
          title="Đánh giá công ty"
          open={showReviewForm}
          onCancel={() => setShowReviewForm(false)}
          footer={null}
          width={800}
        >
          <CompanyReviewForm
            companyId={id}
            onSuccess={() => {
              setShowReviewForm(false);
              fetchData();
              setActiveTab("reviews");
            }}
          />
        </Modal>
      </div>
    </div>
  );
}

export default CompanyReviewDetail;

