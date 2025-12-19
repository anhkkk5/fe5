import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  message,
  Empty,
  Dropdown,
  Space,
} from "antd";
import {
  FileTextOutlined,
  EyeOutlined,
  DownloadOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getMyCVs, deleteCV } from "../../services/CVs/cvsServices";
import { getCookie } from "../../helpers/cookie";
import dayjs from "dayjs";
import "./style.css";

const { Title, Text } = Typography;

// Component để render preview CV nhỏ gọn
function CVPreview({ cv }) {
  let cvData = null;
  try {
    if (cv.summary) {
      cvData = JSON.parse(cv.summary);
    }
  } catch (e) {
    console.error("Error parsing CV data:", e);
  }

  const candidate = cvData?.candidate || {};
  const education = cvData?.education || [];
  const experience = cvData?.experience || [];
  const projects = cvData?.projects || [];

  return (
    <div className="cv-preview-container">
      <div className="cv-preview-header">
        <div className="cv-preview-avatar">
          {candidate.avatar || cv.avatarUrl ? (
            <img
              src={candidate.avatar || cv.avatarUrl}
              alt={candidate.fullName || "CV"}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "4px",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "#e0e0e0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "4px",
                color: "#999",
                fontSize: "12px",
              }}
            >
              {candidate.fullName?.charAt(0) || "?"}
            </div>
          )}
        </div>
        <div className="cv-preview-info">
          <div style={{ fontWeight: 600, fontSize: "14px", color: "#22c55e" }}>
            {candidate.fullName || cv.title || "CV"}
          </div>
          {candidate.position && (
            <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
              {candidate.position}
            </div>
          )}
        </div>
      </div>

      <div className="cv-preview-content">
        {education.length > 0 && (
          <div className="cv-preview-section">
            <div style={{ fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>
              HỌC VẤN
            </div>
            <div style={{ fontSize: "11px", color: "#666" }}>
              {education[0]?.name_education || education[0]?.school || ""}
            </div>
          </div>
        )}

        {experience.length > 0 && (
          <div className="cv-preview-section">
            <div style={{ fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>
              KINH NGHIỆM
            </div>
            <div style={{ fontSize: "11px", color: "#666" }}>
              {experience[0]?.company || ""} - {experience[0]?.position || ""}
            </div>
          </div>
        )}

        {projects.length > 0 && (
          <div className="cv-preview-section">
            <div style={{ fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>
              DỰ ÁN
            </div>
            <div style={{ fontSize: "11px", color: "#666" }}>
              {projects[0]?.project_name || projects[0]?.projectName || ""}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MyCVsPage() {
  const navigate = useNavigate();
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getCookie("token") || localStorage.getItem("token");
    if (!token) {
      message.error("Vui lòng đăng nhập để xem CV");
      navigate("/login");
      return;
    }

    fetchCVs();
  }, [navigate]);

  const fetchCVs = async () => {
    try {
      setLoading(false);
      const data = await getMyCVs();
      setCvs(data || []);
    } catch (error) {
      console.error("Error fetching CVs:", error);
      message.error("Không thể tải danh sách CV");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cvId, cvTitle) => {
    try {
      await deleteCV(cvId);
      message.success("Đã xóa CV thành công");
      fetchCVs();
    } catch (error) {
      console.error("Error deleting CV:", error);
      message.error("Không thể xóa CV");
    }
  };

  const handleViewCV = (cvId) => {
    navigate(`/cv/view/${cvId}`);
  };

  const handleEditCV = (cvId) => {
    navigate(`/cv?edit=${cvId}`);
  };

  const handleDownloadPDF = (cvId) => {
    navigate(`/cv/view/${cvId}`);
  };

  const getMenuItems = (cv) => [
    {
      key: "view",
      label: "Xem CV",
      icon: <EyeOutlined />,
      onClick: () => handleViewCV(cv.id),
    },
    {
      key: "edit",
      label: "Chỉnh sửa",
      icon: <EditOutlined />,
      onClick: () => handleEditCV(cv.id),
    },
    {
      key: "download",
      label: "Tải về",
      icon: <DownloadOutlined />,
      onClick: () => handleDownloadPDF(cv.id),
    },
    {
      type: "divider",
    },
    {
      key: "delete",
      label: "Xóa",
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa CV "${cv.title}"?`)) {
          handleDelete(cv.id, cv.title);
        }
      },
    },
  ];

  return (
    <div className="my-cvs-page">
      <div className="my-cvs-container">
        <div
          style={{
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Title level={2} style={{ margin: 0 }}>
              CV đã tạo trên TopCV
            </Title>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/cv")}
            size="large"
            style={{ backgroundColor: "#22c55e", borderColor: "#22c55e" }}
          >
            + Tạo CV
          </Button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <Text>Đang tải...</Text>
          </div>
        ) : cvs.length === 0 ? (
          <Card>
            <Empty
              description="Bạn chưa có CV nào. Hãy tạo CV đầu tiên!"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate("/cv")}
              >
                Tạo CV Mới
              </Button>
            </Empty>
          </Card>
        ) : (
          <Row gutter={[24, 24]}>
            {cvs.map((cv) => (
              <Col xs={24} sm={12} lg={12} key={cv.id}>
                <Card
                  className="cv-preview-card"
                  hoverable
                  style={{
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                  bodyStyle={{ padding: "16px" }}
                >
                  <div style={{ position: "relative" }}>
                    {/* Preview CV */}
                    <div
                      style={{
                        background: "#fff",
                        border: "1px solid #e0e0e0",
                        borderRadius: "4px",
                        padding: "12px",
                        marginBottom: "12px",
                        minHeight: "200px",
                      }}
                    >
                      <CVPreview cv={cv} />
                    </div>

                    {/* Footer với tên CV và ngày cập nhật */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "12px",
                        paddingTop: "12px",
                        borderTop: "1px solid #f0f0f0",
                      }}
                    >
                      <div>
                        <Text strong style={{ fontSize: "14px" }}>
                          {cv.title}
                        </Text>
                        <div style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}>
                          Cập nhật {dayjs(cv.updated_at || cv.created_at).format("DD-MM-YYYY")}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <Space>
                        <Button
                          type="text"
                          icon={<DownloadOutlined />}
                          onClick={() => handleDownloadPDF(cv.id)}
                          title="Tải về"
                        >
                          Tải về
                        </Button>
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => handleEditCV(cv.id)}
                          title="Chỉnh sửa"
                        >
                          Chỉnh sửa
                        </Button>
                        <Dropdown
                          menu={{ items: getMenuItems(cv) }}
                          trigger={["click"]}
                          placement="bottomRight"
                        >
                          <Button
                            type="text"
                            icon={<MoreOutlined />}
                            title="Thêm"
                          />
                        </Dropdown>
                      </Space>
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

export default MyCVsPage;
