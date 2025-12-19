import React from "react";
import { Card, Typography, Button } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

function Certificates({ certificatesList, onAdd, onDelete, readOnly = false }) {
  return (
    <Card className="section-card">
      <div className="section-header">
        <Title level={4}>Chứng Chỉ</Title>
      </div>
      {certificatesList.length > 0 ? (
        <>
          {certificatesList.map((cert, index) => (
            <div
              key={index}
              style={{
                marginBottom: 15,
                paddingBottom: 15,
                borderBottom:
                  index < certificatesList.length - 1
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
                    {cert.certificate_name || cert.certificateName}
                  </Text>
                  <Text style={{ display: "block", color: "#666" }}>
                    {cert.organization}
                  </Text>
                  <Text
                    type="secondary"
                    style={{ display: "block", fontSize: 12 }}
                  >
                    {cert.started_at
                      ? dayjs(cert.started_at).format("MMM DD, YYYY")
                      : cert.startDate
                      ? dayjs(cert.startDate).format("MMM DD, YYYY")
                      : ""}{" "}
                    -{" "}
                    {cert.end_at
                      ? dayjs(cert.end_at).format("MMM DD, YYYY")
                      : cert.endDate
                      ? dayjs(cert.endDate).format("MMM DD, YYYY")
                      : ""}
                  </Text>
                  {cert.description && (
                    <Text style={{ display: "block", marginTop: 8 }}>
                      {cert.description}
                    </Text>
                  )}
                </div>
                {!readOnly && (
                  <div className="action-icons">
                    <EditOutlined
                      className="edit-icon"
                      onClick={() => onAdd && onAdd(cert)}
                    />
                    <DeleteOutlined
                      className="delete-icon"
                      onClick={() => onDelete && onDelete(cert.id)}
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
                Thêm chứng chỉ
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
            Bổ sung chứng chỉ tiêu chuẩn để nâng cao năng lực của bạn
          </Text>
          {!readOnly && (
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => onAdd && onAdd()}
              block
            >
              Thêm chứng chỉ
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

export default Certificates;
