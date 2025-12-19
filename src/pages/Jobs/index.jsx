import React from "react";
import { Card, Tag, Row, Col, Spin, Empty, Button, Avatar } from "antd";
import {
  EnvironmentOutlined,
  StarOutlined,
  StarFilled,
} from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";
import { getCookie } from "../../helpers/cookie";
import { getAlljob } from "../../services/jobServices/jobServices";
import { getAllCompany } from "../../services/getAllCompany/companyServices";
function JobsPage() {
  const [jobs, setJobs] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [savedIds, setSavedIds] = React.useState([]);
  const [searchParams] = useSearchParams();
  const [companyMap, setCompanyMap] = React.useState({});

  React.useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        // Đọc query parameters từ URL
        const city = searchParams.get("city") || "";
        const keyword = searchParams.get("keyword") || "";
        const position = searchParams.get("position") || "";

        // Gửi params vào API
        const params = {};
        if (city) params.city = city;
        if (keyword) params.keyword = keyword;
        if (position) params.position = position;

        const [jobsData, companiesData] = await Promise.all([
          getAlljob(params),
          getAllCompany().catch(() => []),
        ]);

        setJobs(Array.isArray(jobsData) ? jobsData : []);

        if (Array.isArray(companiesData) && companiesData.length) {
          const map = {};
          companiesData.forEach((c) => {
            if (c && c.id != null) {
              map[String(c.id)] = c;
            }
          });
          setCompanyMap(map);
        } else {
          setCompanyMap({});
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
        setJobs([]);
        setCompanyMap({});
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [searchParams]);

  // Load saved jobs from localStorage
  React.useEffect(() => {
    const userId = getCookie("id");
    const parseArr = (raw) => {
      try {
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };
    const globalIds = parseArr(localStorage.getItem("saved_jobs"));
    const userIds = userId
      ? parseArr(localStorage.getItem(`saved_jobs_${userId}`))
      : [];
    setSavedIds([...globalIds, ...userIds]);
  }, []);

  const toggleSave = (jobId) => {
    if (!jobId) return;
    const userId = getCookie("id");
    const keys = ["saved_jobs"];
    if (userId) keys.push(`saved_jobs_${userId}`);

    const nextIds = new Set(savedIds);
    if (nextIds.has(jobId)) {
      nextIds.delete(jobId);
    } else {
      nextIds.add(jobId);
    }

    const updateKey = (key) => {
      try {
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : [];
        const arr = Array.isArray(parsed) ? parsed : [];
        const exists = arr.some((id) => String(id) === String(jobId));
        const next = exists
          ? arr.filter((id) => String(id) !== String(jobId))
          : [...arr, jobId];
        localStorage.setItem(key, JSON.stringify(next));
      } catch {}
    };
    keys.forEach(updateKey);
    setSavedIds([...nextIds]);
  };

  const getCompanyLogo = (job) => {
    if (!job) return null;
    if (job.company_logo) return job.company_logo;
    const companyId = job.company_id != null ? String(job.company_id) : null;
    if (companyId && companyMap[companyId]?.logo) {
      return companyMap[companyId].logo;
    }
    return null;
  };

  const getCompanyLocation = (job) => {
    if (!job) return "";
    const companyId = job.company_id != null ? String(job.company_id) : null;
    const company = companyId ? companyMap[companyId] : null;
    return company?.address || job.location || "";
  };

  return (
    <div style={{ padding: 24 }}>
      <div className="fj-wrapper">
        <h2 style={{ marginBottom: 16 }}>Danh sách công việc</h2>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
            <Spin />
          </div>
        ) : jobs.length === 0 ? (
          <Empty description="Không có dữ liệu" />
        ) : (
          <Row gutter={[24, 24]}>
            {jobs.map((job) => (
              <Col xs={24} sm={12} md={12} lg={6} key={job.id}>
                <Card
                  style={{ position: "relative" }}
                  hoverable
                  className="fj-card"
                  onClick={() => (window.location.href = `/jobs/${job.id}`)}
                >
                  <Button
                    type="text"
                    aria-label={
                      savedIds.some((id) => String(id) === String(job.id))
                        ? "Bo luu cong viec"
                        : "Luu cong viec"
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSave(job.id);
                    }}
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      border: "1px solid #d9d9d9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                    }}
                    icon={
                      savedIds.some((id) => String(id) === String(job.id)) ? (
                        <StarFilled style={{ color: "#52c41a" }} />
                      ) : (
                        <StarOutlined style={{ color: "#bfbfbf" }} />
                      )
                    }
                  />

                  <h3 style={{ marginTop: 0, marginBottom: 8 }}>
                    {job.title || job.name}
                  </h3>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
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
                    {job.salary ? (
                      <Tag color="geekblue" className="fj-tag">
                        Salary: {job.salary}
                      </Tag>
                    ) : null}
                    {job.level || job.jobLevel ? (
                      <Tag color="purple" className="fj-tag">
                        Vị trí: {job.level || job.jobLevel}
                      </Tag>
                    ) : null}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: "#666",
                      marginBottom: 8,
                    }}
                  >
                    <Avatar
                      size={40}
                      src={getCompanyLogo(job) || undefined}
                      style={{ backgroundColor: "#f0f0f0" }}
                    >
                      {(job.company || "?").charAt(0)}
                    </Avatar>
                    <span>{job.company}</span>
                  </div>

                  <div style={{ color: "#666" }}>
                    <EnvironmentOutlined /> {getCompanyLocation(job)}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
}

export default JobsPage;
