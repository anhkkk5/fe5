import React, { useEffect, useState } from "react";
import { Card, Row, Col, Typography, Tag, Spin, message, Button, Divider } from "antd";
import { MailOutlined, PhoneOutlined, EnvironmentOutlined, CalendarOutlined, UserOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getCookie } from "../../helpers/cookie";
import { getMyCandidateProfile } from "../../services/Candidates/candidatesServices";

const { Title, Text, Paragraph } = Typography;

function CandidateProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const token = getCookie("token") || localStorage.getItem("token");
    if (!token) {
      message.warning("Vui lòng đăng nhập để xem thông tin cá nhân");
      navigate("/login");
      return;
    }
    const fetchMe = async () => {
      try {
        const me = await getMyCandidateProfile();
        setData(me || {});
      } catch (e) {
        message.error("Không thể tải thông tin cá nhân");
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{
                width: 140,
                height: 140,
                borderRadius: "50%",
                background: "#f0f2f5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
                overflow: "hidden",
                border: "1px solid #eee",
              }}>
                <UserOutlined style={{ fontSize: 56, color: "#8c8c8c" }} />
              </div>
              <Title level={4} style={{ marginBottom: 4 }}>{data?.fullName || "Chưa cập nhật"}</Title>
              <Text type="secondary">{data?.title || "Ứng viên"}</Text>
              <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                <Tag color="gold">Sao: {data?.stars ?? 0}</Tag>
                <Tag color={data?.isPremium ? "green" : "default"}>
                  Premium: {data?.isPremium ? "Đã nâng cấp" : "Chưa"}
                </Tag>
              </div>
            </div>
            <Divider style={{ margin: "12px 0" }}>Liên hệ</Divider>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
              <MailOutlined style={{ color: "#8c8c8c", marginRight: 8 }} />
              <Text>{data?.email || "Chưa cập nhật"}</Text>
            </div>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
              <PhoneOutlined style={{ color: "#8c8c8c", marginRight: 8 }} />
              <Text>{data?.phone || "Chưa cập nhật"}</Text>
            </div>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
              <EnvironmentOutlined style={{ color: "#8c8c8c", marginRight: 8 }} />
              <Text>{data?.address || "Chưa cập nhật"}</Text>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <CalendarOutlined style={{ color: "#8c8c8c", marginRight: 8 }} />
              <Text>{data?.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString() : "Chưa cập nhật"}</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card title="Giới thiệu">
            <Paragraph style={{ whiteSpace: "pre-wrap" }}>
              {data?.introduction || "Chưa có giới thiệu."}
            </Paragraph>
          </Card>

          {!!(data?.skills && data.skills.length) && (
            <Card title="Kỹ năng" style={{ marginTop: 16 }}>
              {data.skills.map((s, i) => (
                <Tag key={i} color="blue" style={{ marginBottom: 8 }}>
                  {s}
                </Tag>
              ))}
            </Card>
          )}

          <div style={{ marginTop: 16, textAlign: "right" }}>
            <Button type="primary" onClick={() => navigate("/cv")}>Chỉnh sửa hồ sơ chi tiết</Button>
          </div>
        </Col>
      </Row>
    </div>
  );
}

export default CandidateProfile;
