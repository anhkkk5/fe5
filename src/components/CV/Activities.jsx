import React from "react";
import { Card, Typography, Button } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

function Activities({ activityList = [], onAdd, onDelete, readOnly = false }) {
  return (
    <Card className="section-card">
      <div className="section-header">
        <Title level={4}>Hoạt động</Title>
      </div>
      {activityList.length > 0 ? (
        <>
          {activityList.map((act, index) => (
            <div
              key={index}
              style={{
                marginBottom: 15,
                paddingBottom: 15,
                borderBottom:
                  index < activityList.length - 1
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
                    {act.organization}
                  </Text>
                  <Text style={{ display: "block", color: "#666" }}>
                    {act.role}
                  </Text>
                  <Text
                    type="secondary"
                    style={{ display: "block", fontSize: 12 }}
                  >
                    {act.started_at
                      ? dayjs(act.started_at).format("MMM DD, YYYY")
                      : act.startDate
                      ? dayjs(act.startDate).format("MMM DD, YYYY")
                      : ""}{" "}
                    -{" "}
                    {act.end_at
                      ? dayjs(act.end_at).format("MMM DD, YYYY")
                      : act.endDate
                      ? dayjs(act.endDate).format("MMM DD, YYYY")
                      : "Hiện tại"}
                  </Text>
                  {(act.description ||
                    (act.bullets && act.bullets.length > 0)) && (
                    <div style={{ marginTop: 8 }}>
                      {act.description && (
                        <Text style={{ display: "block" }}>
                          {act.description}
                        </Text>
                      )}
                      {Array.isArray(act.bullets) && act.bullets.length > 0 && (
                        <ul style={{ marginTop: 4, paddingLeft: 18 }}>
                          {act.bullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
                {!readOnly && (
                  <div className="action-icons">
                    <EditOutlined
                      className="edit-icon"
                      onClick={() => onAdd && onAdd(act)}
                    />
                    <DeleteOutlined
                      className="delete-icon"
                      onClick={() => onDelete && onDelete(act.id)}
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
                Thêm hoạt động
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
            Thêm hoạt động, CLB, tổ chức bạn đã tham gia
          </Text>
          {!readOnly && (
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => onAdd && onAdd()}
              block
            >
              Thêm hoạt động
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

export default Activities;
