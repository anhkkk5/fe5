import React from "react";
import { Card, Typography, Button } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

function Education({ educationList, onAdd, onDelete, readOnly = false }) {
  return (
    <Card className="section-card">
      <div className="section-header">
        <Title level={4}>Học Vấn</Title>
      </div>
      {educationList.length > 0 ? (
        <>
          {educationList.map((edu, index) => (
            <div
              key={index}
              style={{
                marginBottom: 15,
                paddingBottom: 15,
                borderBottom:
                  index < educationList.length - 1
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
                    {edu.name_education || edu.school}
                  </Text>
                  <Text style={{ display: "block", color: "#666" }}>
                    {edu.major}
                  </Text>
                  <Text
                    type="secondary"
                    style={{ display: "block", fontSize: 12 }}
                  >
                    {edu.started_at
                      ? dayjs(edu.started_at).format("MMM DD, YYYY")
                      : edu.startDate
                      ? dayjs(edu.startDate).format("MMM DD, YYYY")
                      : ""}{" "}
                    -{" "}
                    {edu.end_at
                      ? dayjs(edu.end_at).format("MMM DD, YYYY")
                      : edu.endDate
                      ? dayjs(edu.endDate).format("MMM DD, YYYY")
                      : ""}
                  </Text>
                  {(edu.info || edu.description) && (
                    <Text style={{ display: "block", marginTop: 8 }}>
                      {edu.info || edu.description}
                    </Text>
                  )}
                </div>
                {!readOnly && (
                  <div className="action-icons">
                    <EditOutlined
                      className="edit-icon"
                      onClick={() => onAdd && onAdd(edu)}
                    />
                    <DeleteOutlined
                      className="delete-icon"
                      onClick={() => onDelete && onDelete(edu.id)}
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
                Thêm học vấn
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
            Thêm thông tin học vấn của bạn
          </Text>
          {!readOnly && (
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => onAdd && onAdd()}
              block
            >
              Thêm học vấn
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

export default Education;
