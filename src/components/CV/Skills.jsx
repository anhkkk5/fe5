import React from "react";
import { Card, Typography, Button } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

function Skills({ skillsList = [], onAdd, onDelete, readOnly = false }) {
  return (
    <Card className="section-card">
      <div className="section-header">
        <Title level={4}>Kỹ Năng</Title>
      </div>
      {skillsList.length > 0 ? (
        <>
          {skillsList.map((skill, index) => (
            <div
              key={index}
              style={{
                marginBottom: 15,
                paddingBottom: 15,
                borderBottom:
                  index < skillsList.length - 1 ? "1px solid #f0f0f0" : "none",
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
                    {skill.skill_name || skill.skillName}
                  </Text>
                  {skill.level && (
                    <Text style={{ display: "block", color: "#666" }}>
                      Mức độ: {skill.level}
                    </Text>
                  )}
                  {skill.description && (
                    <Text style={{ display: "block", marginTop: 8 }}>
                      {skill.description}
                    </Text>
                  )}
                </div>
                {!readOnly && (
                  <div className="action-icons">
                    <EditOutlined
                      className="edit-icon"
                      onClick={() => onAdd && onAdd(skill)}
                    />
                    <DeleteOutlined
                      className="delete-icon"
                      onClick={() => onDelete && onDelete(skill.id)}
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
                Thêm kỹ năng
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
            Thêm các kỹ năng của bạn để thể hiện năng lực
          </Text>
          {!readOnly && (
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => onAdd && onAdd()}
              block
            >
              Thêm kỹ năng
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

export default Skills;





