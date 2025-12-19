import React from "react";
import { Card, Row, Col, Typography } from "antd";
import { EditOutlined } from "@ant-design/icons";


const { Title, Text } = Typography;

function ProfileInfo({ candidate, onEdit, readOnly = false }) {
  return (
    <Card className="profile-card">
      <div className="profile-header">
        <div className="profile-avatar">
          <img src={candidate.avatar || "/src/assets/logologin.png"} alt="Avatar" />
          <Text className="company-label">Software</Text>
        </div>
        <div className="profile-info">
          <Title level={3}>{candidate.fullName || candidate.name || "Chưa cập nhật"}</Title>
          <Text className="profile-position">Full-Stack Developer</Text>
          <Row gutter={[16, 8]} style={{ marginTop: 10 }}>
            <Col span={12}>
              <Text>📧 {candidate.email}</Text>
            </Col>
            <Col span={12}>
              <Text>📞 {candidate.phone || "Chưa cập nhật"}</Text>
            </Col>
            <Col span={12}>
              <Text>📅 {candidate.dob || "Chưa cập nhật"}</Text>
            </Col>
            <Col span={12}>
              <Text>👤 {candidate.gender === 1 ? "Nam" : candidate.gender === 0 ? "Nữ" : "Chưa cập nhật"}</Text>
            </Col>
            <Col span={12}>
              <Text>📍 {candidate.address || "Chưa cập nhật"}</Text>
            </Col>
            <Col span={12}>
              <Text>🏢 {candidate.isOpen === 1 ? "Đang tìm việc" : "Không tìm việc"}</Text>
            </Col>
          </Row>
        </div>
        {!readOnly && onEdit && (
          <EditOutlined className="edit-icon" onClick={onEdit} />
        )}
      </div>
    </Card>
  );
}

export default ProfileInfo;
