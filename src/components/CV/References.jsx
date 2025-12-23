import React from "react";
import { Card, Typography, Button } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

function References({
  referencesList = [],
  onAdd,
  onDelete,
  readOnly = false,
}) {
  return (
    <Card className="section-card">
      <div className="section-header">
        <Title level={4}>Người Giới Thiệu</Title>
      </div>
      {referencesList.length > 0 ? (
        <>
          {referencesList.map((ref, index) => (
            <div
              key={index}
              style={{
                marginBottom: 15,
                paddingBottom: 15,
                borderBottom:
                  index < referencesList.length - 1
                    ? "1px solid #f0f0f0"
                    : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                }}
              >
                <div style={{ flex: 1 }}>
                  <Text strong style={{ display: "block", fontSize: 16 }}>
                    {ref.full_name || ref.fullName || ref.name}
                  </Text>
                  {ref.position && (
                    <Text style={{ display: "block", color: "#666" }}>
                      {ref.position}
                    </Text>
                  )}
                  {ref.company && (
                    <Text style={{ display: "block", color: "#666" }}>
                      {ref.company}
                    </Text>
                  )}
                  {ref.email && (
                    <Text style={{ display: "block", fontSize: 12 }}>
                      Email: {ref.email}
                    </Text>
                  )}
                  {ref.phone && (
                    <Text style={{ display: "block", fontSize: 12 }}>
                      Điện thoại: {ref.phone}
                    </Text>
                  )}
                  {ref.description && (
                    <Text style={{ display: "block", marginTop: 8 }}>
                      {ref.description}
                    </Text>
                  )}
                </div>
                {!readOnly && (
                  <div className="action-icons">
                    <EditOutlined
                      className="edit-icon"
                      onClick={() => onAdd && onAdd(ref)}
                    />
                    <DeleteOutlined
                      className="delete-icon"
                      onClick={() => onDelete && onDelete(ref.id)}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
          {!readOnly && (
            <div style={{ marginTop: 12 }}>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => onAdd && onAdd()}
                block
              >
                Thêm người giới thiệu
              </Button>
            </div>
          )}
        </>
      ) : (
        <div>
          <Text
            className="section-description"
            type="secondary"
            style={{ display: "block", marginBottom: 12 }}
          >
            Thêm thông tin người có thể giới thiệu bạn
          </Text>
          {!readOnly && (
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => onAdd && onAdd()}
              block
            >
              Thêm người giới thiệu
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

export default References;





