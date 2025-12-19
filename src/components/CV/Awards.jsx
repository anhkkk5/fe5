import React from "react";
import { Card, Typography, Button } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

function Awards({ awardsList = [], onAdd, onDelete, readOnly = false }) {
  return (
    <Card className="section-card">
      <div className="section-header">
        <Title level={4}>Danh Hiệu và Giải Thưởng</Title>
      </div>
      {awardsList.length > 0 ? (
        <>
          {awardsList.map((award, index) => (
            <div
              key={index}
              style={{
                marginBottom: 15,
                paddingBottom: 15,
                borderBottom:
                  index < awardsList.length - 1 ? "1px solid #f0f0f0" : "none",
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
                    {award.award_name || award.awardName}
                  </Text>
                  <Text style={{ display: "block", color: "#666" }}>
                    {award.organization}
                  </Text>
                  <Text
                    type="secondary"
                    style={{ display: "block", fontSize: 12 }}
                  >
                    {award.started_at
                      ? dayjs(award.started_at).format("MMM DD, YYYY")
                      : award.startDate
                      ? dayjs(award.startDate).format("MMM DD, YYYY")
                      : ""}{" "}
                    {award.end_at || award.endDate
                      ? `- ${
                          award.end_at
                            ? dayjs(award.end_at).format("MMM DD, YYYY")
                            : dayjs(award.endDate).format("MMM DD, YYYY")
                        }`
                      : ""}
                  </Text>
                  {award.description && (
                    <Text style={{ display: "block", marginTop: 8 }}>
                      {award.description}
                    </Text>
                  )}
                </div>
                {!readOnly && (
                  <div className="action-icons">
                    <EditOutlined
                      className="edit-icon"
                      onClick={() => onAdd && onAdd(award)}
                    />
                    <DeleteOutlined
                      className="delete-icon"
                      onClick={() => onDelete && onDelete(award.id)}
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
                Thêm danh hiệu/giải thưởng
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
            Thêm các danh hiệu và giải thưởng bạn đã đạt được
          </Text>
          {!readOnly && (
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => onAdd && onAdd()}
              block
            >
              Thêm danh hiệu/giải thưởng
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

export default Awards;



