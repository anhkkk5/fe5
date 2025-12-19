import React from "react";
import { Card, Button, Row, Col, Spin, Empty, Avatar, Typography, Tag } from "antd";
import {
  EnvironmentOutlined,
  ArrowRightOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getAlljob } from "../../services/jobServices/jobServices";
import { getAllCompany } from "../../services/getAllCompany/companyServices";
import "./style.css";

function FeaturedJobs() {
  const [jobs, setJobs] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [companyMap, setCompanyMap] = React.useState({});
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [jobsData, companiesData] = await Promise.all([
          getAlljob(),
          getAllCompany().catch(() => []),
        ]);

        if (Array.isArray(jobsData) && jobsData.length) {
          const activeJobs = jobsData.filter((j) => j?.status === "active");
          setJobs(activeJobs.slice(0, 12));
        } else {
          setJobs([]);
        }

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
        console.error("Error fetching jobs or companies:", error);
        setJobs([]);
        setCompanyMap({});
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const badgeClass = (type) => {
    switch (type) {
      case "FULL-TIME":
        return "full";
      case "PART-TIME":
        return "part";
      case "INTERNSHIP":
        return "intern";
      default:
        return "full";
    }
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
    <div className="fj-wrapper">
      <div className="fj-header">
        <h2 className="fj-title">Công việc nổi bật</h2>
        <Button
          type="link"
          className="fj-view-more"
          onClick={() => navigate("/jobs")}
        >
          Xem Thêm <ArrowRightOutlined />
        </Button>
      </div>
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Spin />
        </div>
      ) : jobs.length === 0 ? (
        <Row gutter={[24, 24]}>
          {jobs.map((job) => (
          <Col xs={24} sm={12} md={12} lg={6} key={job.id}>
              <Card hoverable className="fj-card">
                <div className="fj-card-top">
                  <Typography.Title level={4} className="fj-job-title">
                    {job.title}
                  </Typography.Title>
                  <StarOutlined className="fj-bookmark" />
                </div>

                <div className="fj-meta-line">
                  <span className={`fj-badge ${badgeClass(job.type)}`}>
                    {job.type}
                  </span>
                  <span className="fj-salary">Salary: {job.salary}</span>
                </div>

                <div className="fj-company">
                  <Avatar size={40} className="fj-avatar">
                    G
                  </Avatar>
                  <div className="fj-company-info">
                    <div className="fj-company-name">{job.company}</div>
                    <div className="fj-location">
                      <EnvironmentOutlined /> {job.location}
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Row gutter={[24, 24]}>
          {jobs.map((job) => (
          <Col xs={24} sm={12} md={12} lg={6} key={job.id}>
              <Card
                hoverable
                className="fj-card"
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                <div className="fj-card-top">
                  <Typography.Title level={4} className="fj-job-title">
                    {job.title || job.name}
                  </Typography.Title>
                  <StarOutlined className="fj-bookmark" />
                </div>

                <div className="fj-meta-line">
                  {job.type ? (
                    <span className={`fj-badge ${badgeClass(job.type)}`}>
                      {job.type}
                    </span>
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

                <div className="fj-company">
                  <Avatar
                    size={40}
                    className="fj-avatar"
                    src={getCompanyLogo(job) || undefined}
                  >
                    {(job.company || "?").charAt(0)}
                  </Avatar>
                  <div className="fj-company-info">
                    <div className="fj-company-name">{job.company}</div>
                    <div className="fj-location">
                      <EnvironmentOutlined /> {getCompanyLocation(job)}
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}

export default FeaturedJobs;
