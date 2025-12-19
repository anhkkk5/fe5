import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Card, Tag, Empty, Spin, Button, Space, Typography, Table, message } from "antd";
import { EnvironmentOutlined, DeleteOutlined, StarFilled } from "@ant-design/icons";
import { getCookie } from "../../helpers/cookie";
import { getAlljob, getDetaiJob } from "../../services/jobServices/jobServices";

const STORAGE_KEY = "saved_jobs";
const { Title, Text } = Typography;

const statusTag = (status) => {
  if (status === "active") return <Tag color="green">Đang tuyển</Tag>;
  if (status === "closed") return <Tag color="red">Đã đóng</Tag>;
  if (status === "inactive") return <Tag>Ngừng tuyển</Tag>;
  return null;
};

// READ SAVED JOBS
const readSaved = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_e) {
    return [];
  }
};

function SavedJobsPage() {
  const navigate = useNavigate();
  const [savedData, setSavedData] = useState(readSaved());
  const [allJobs, setAllJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  // Fetch full jobs list to hydrate saved IDs with current data
  useEffect(() => {
    let mounted = true;
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const data = await getAlljob();
        if (mounted && Array.isArray(data)) {
          setAllJobs(data);
        }
      } catch (_e) {
        if (mounted) {
          setAllJobs([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchJobs();
    return () => {
      mounted = false;
    };
  }, []);

  const savedJobs = React.useMemo(() => {
    const ids = savedData
      .filter((item) => typeof item === "number" || typeof item === "string")
      .map((item) => String(item));
    const objects = savedData.filter((item) => item && typeof item === "object");

    const matchedFromIds = allJobs.filter((job) => ids.includes(String(job.id)));
    const merged = [...matchedFromIds];

    objects.forEach((obj) => {
      const alreadyHas = merged.some((job) => String(job.id) === String(obj.id));
      if (!alreadyHas) {
        merged.push(obj);
      }
    });
    return merged;
  }, [savedData, allJobs]);

  const handleRemove = (jobId) => {
    const next = savedData.filter((item) => String(item?.id ?? item) !== String(jobId));
    setSavedData(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  // Fetch saved jobs
  useEffect(() => {
    const token = getCookie("token") || localStorage.getItem("token");
    const userType = getCookie("userType");
    const userId = getCookie("id");
    if (!token || userType !== "candidate") {
      message.warning("Vui lòng đăng nhập bằng tài khoản ứng viên để xem danh sách đã lưu");
      navigate("/login");
      return;
    }

    const load = async () => {
      try {
        const raw = userId ? localStorage.getItem(`saved_jobs_${userId}`) : null;
        const ids = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(ids) || ids.length === 0) {
          setItems([]);
          return;
        }

        const jobs = [];
        await Promise.all(
          ids.map(async (jid) => {
            try {
              const job = await getDetaiJob(jid);
              if (job) jobs.push(job);
            } catch (_) {}
          })
        );

        const mapped = jobs.map((job) => ({
          key: job.id,
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          status: job.status,
        }));
        setItems(mapped);
      } catch (e) {
        console.error("Error loading saved jobs", e);
        message.error("Không thể tải danh sách công việc đã lưu");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  const columns = [
    {
      title: "",
      dataIndex: "favorite",
      key: "favorite",
      width: 60,
      align: "center",
      render: () => <StarFilled style={{ color: "#faad14", fontSize: 18 }} />,
    },
    {
      title: "Công việc",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <span
          style={{ fontWeight: 500, cursor: "pointer" }}
          onClick={() => navigate(`/jobs/${record.id}`)}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Công ty",
      dataIndex: "company",
      key: "company",
      render: (text) => <Text>{text}</Text>,
    },
    {
      title: "Địa điểm",
      dataIndex: "location",
      key: "location",
      render: (text) => <Text>{text || "-"}</Text>,
    },
    {
      title: "Trạng thái tin tuyển dụng",
      dataIndex: "status",
      key: "status",
      render: (value) => statusTag(value),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <Card bodyStyle={{ padding: 24 }}>
        <Title level={3} style={{ marginBottom: 24 }}>
          Công việc đã lưu
        </Title>
        {savedJobs.length === 0 ? (
          <Empty description="Chưa có việc làm nào được lưu" />
        ) : (
          <Row gutter={[16, 16]}>
            {savedJobs.map((job) => (
              <Col xs={24} sm={12} md={12} lg={8} key={job.id || job.title}>
                <Card
                  hoverable
                  onClick={() => (window.location.href = `/jobs/${job.id}`)}
                  actions={[
                    <Button
                      key="remove"
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(job.id);
                      }}
                    >
                      Bỏ lưu
                    </Button>,
                  ]}
                >
                  <Space direction="vertical" size={10} style={{ width: "100%" }}>
                    <Space size={8} wrap>
                      {job.type ? (
                        <Tag
                          color={
                            job.type === "FULL-TIME"
                              ? "green"
                              : job.type === "PART-TIME"
                              ? "blue"
                              : "orange"
                          }
                        >
                          {job.type}
                        </Tag>
                      ) : null}
                      {job.salary ? <Tag color="gold">Salary: {job.salary}</Tag> : null}
                    </Space>
                    <Typography.Title level={4} style={{ margin: 0 }}>
                      {job.title || job.name || "Chưa có tiêu đề"}
                    </Typography.Title>
                    {job.company ? (
                      <Typography.Text style={{ color: "#666" }}>{job.company}</Typography.Text>
                    ) : null}
                    {job.location ? (
                      <Typography.Text style={{ color: "#666" }}>
                        <EnvironmentOutlined /> {job.location}
                      </Typography.Text>
                    ) : null}
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>
    </div>
  );
}

export default SavedJobsPage;
