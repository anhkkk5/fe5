import React, { useEffect, useMemo, useState } from "react";
import { Card, Row, Col, Typography, Tag, Button, Space } from "antd";
import { useLocation, useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const templates = [
  { id: "classic", name: "Tiêu chuẩn", style: "simple", roles: ["all"], tags: ["ATS", "Đơn giản"], previewColor: "#3b82f6" },
  { id: "classic_exp", name: "Tiêu chuẩn (ít kinh nghiệm)", style: "simple", roles: ["all"], tags: ["ATS", "Đơn giản"], previewColor: "#16a34a" },
  { id: "modern", name: "Hiện đại", style: "modern", roles: ["developer", "all"], tags: ["Hiện đại", "Chuyên nghiệp"], previewColor: "#ef4444" },
  { id: "elegant", name: "Thanh lịch", style: "impressive", roles: ["sales", "all"], tags: ["Đơn giản"], previewColor: "#10b981" },
  { id: "professional", name: "Chuyên nghiệp", style: "professional", roles: ["accounting", "all"], tags: ["Chuyên nghiệp"], previewColor: "#8b5cf6" },
];

export default function CVTemplatesList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const qs = new URLSearchParams(location.search);
  const styleFilter = qs.get("style") || "all";
  const roleFilter = qs.get("role") || "all";
  const setFilter = (key, val) => {
    const next = new URLSearchParams(location.search);
    if (val === "all") next.delete(key); else next.set(key, val);
    navigate({ pathname: "/cv/templates", search: `?${next.toString()}` });
  };

  const filtered = useMemo(() => {
    return templates.filter(t =>
      (styleFilter === "all" || t.style === styleFilter) &&
      (roleFilter === "all" || t.roles.includes(roleFilter))
    );
  }, [styleFilter, roleFilter]);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <Title level={2} style={{ marginBottom: 8 }}>Mẫu CV</Title>
      <Text type="secondary">Chọn một mẫu để xem trước và áp dụng cho CV của bạn</Text>

      {/* Filter chips */}
      <div style={{ marginTop: 16, marginBottom: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Space wrap>
          <Button type={styleFilter === "all" ? "primary" : "default"} onClick={() => setFilter("style", "all")}>Tất cả</Button>
          <Button type={styleFilter === "simple" ? "primary" : "default"} onClick={() => setFilter("style", "simple")}>Đơn giản</Button>
          <Button type={styleFilter === "professional" ? "primary" : "default"} onClick={() => setFilter("style", "professional")}>Chuyên nghiệp</Button>
          <Button type={styleFilter === "modern" ? "primary" : "default"} onClick={() => setFilter("style", "modern")}>Hiện đại</Button>
          <Button type={styleFilter === "impressive" ? "primary" : "default"} onClick={() => setFilter("style", "impressive")}>Ấn tượng</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        {filtered.map((t) => (
          <Col xs={24} sm={12} md={8} key={t.id}>
            <Card
              hoverable
              loading={loading}
              onClick={() => navigate(`/cv/templates/${t.id}`)}
              cover={
                <div style={{ height: 220, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid #f0f0f0" }}>
                  <div style={{ width: 160, height: 200, border: "1px solid #e5e7eb", borderTop: `6px solid ${t.previewColor}`, background: "linear-gradient(#fff, #fafafa)", boxShadow: "0 4px 12px rgba(0,0,0,.06)" }} />
                </div>
              }
            >
              <Title level={4} style={{ marginBottom: 8 }}>{t.name}</Title>
              {t.tags.map((tag) => (
                <Tag key={tag} color="blue" style={{ marginBottom: 6 }}>{tag}</Tag>
              ))}
              <div style={{ marginTop: 12 }}>
                <Button type="primary" onClick={() => navigate(`/cv/templates/${t.id}`)}>Dùng mẫu</Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
