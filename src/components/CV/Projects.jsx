import React from "react";
import { Card, Typography, Button } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

function Projects({ projectsList, onAdd, onDelete, readOnly = false }) {
  return (
    <Card className="section-card">
      <div className="section-header">
        <Title level={4}>Dự Án Cá Nhân</Title>
      </div>
      {projectsList.length > 0 ? (
        <>
          {projectsList.map((project, index) => (
            <div
              key={index}
              style={{
                marginBottom: 15,
                paddingBottom: 15,
                borderBottom:
                  index < projectsList.length - 1
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
                    {project.project_name || project.projectName}
                  </Text>
                  {(project.demo_link || project.demoLink) && (
                    <a
                      href={project.demo_link || project.demoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "block", color: "#1890ff" }}
                    >
                      {project.demo_link || project.demoLink}
                    </a>
                  )}
                  <Text
                    type="secondary"
                    style={{ display: "block", fontSize: 12 }}
                  >
                    {project.started_at
                      ? dayjs(project.started_at).format("MMM DD, YYYY")
                      : project.startDate
                      ? dayjs(project.startDate).format("MMM DD, YYYY")
                      : ""}{" "}
                    -{" "}
                    {project.end_at
                      ? dayjs(project.end_at).format("MMM DD, YYYY")
                      : project.endDate
                      ? dayjs(project.endDate).format("MMM DD, YYYY")
                      : ""}
                  </Text>
                  {project.description && (
                    <Text style={{ display: "block", marginTop: 8 }}>
                      {project.description}
                    </Text>
                  )}
                </div>
                {!readOnly && (
                  <div className="action-icons">
                    <EditOutlined
                      className="edit-icon"
                      onClick={() => onAdd && onAdd(project)}
                    />
                    <DeleteOutlined
                      className="delete-icon"
                      onClick={() => onDelete && onDelete(project.id)}
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
                Thêm dự án
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
            Thêm dự án cá nhân của bạn
          </Text>
          {!readOnly && (
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => onAdd && onAdd()}
              block
            >
              Thêm dự án
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

export default Projects;
