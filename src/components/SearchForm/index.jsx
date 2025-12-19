import React, { useEffect, useState } from "react";
import { Row, Col } from "antd";
import {
  ProfileOutlined,
  BankOutlined,
  TeamOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getAlljob } from "../../services/jobServices/jobServices";
import { getAllCompany } from "../../services/getAllCompany/companyServices";
import { getAllCandidates } from "../../services/Candidates/candidatesServices";
import SearchListJob from "./searchJob";
import heroImg from "../../assets/anh1.png";
import "./style.css";

function Search() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({
    jobs: 0,
    companies: 0,
    candidates: 0,
    newJobs: 0,
  });

  const suggestions = [
    { label: "Thiết kế" },
    { label: "Lập trình", highlighted: true },
    { label: "Marketing số" },
    { label: "Video" },
    { label: "Hoạt hình" },
  ];

  const handleSuggestionClick = (text) => {
    navigate(`/search?city=&keyword=${encodeURIComponent(text)}`);
  };

  useEffect(() => {
    const loadCounts = async () => {
      const results = await Promise.allSettled([
        getAlljob(),
        getAllCompany(),
        getAllCandidates(),
      ]);
      const jobs = results[0].status === "fulfilled" ? results[0].value : [];
      const companies =
        results[1].status === "fulfilled" ? results[1].value : [];
      const candidates =
        results[2].status === "fulfilled" ? results[2].value : [];

      if (results[2].status === "rejected") {
        // Có thể API /candidates yêu cầu quyền → bỏ qua, không chặn các số khác
        // console.warn("Cannot load candidates count:", results[2].reason);
      }

      const jobsArr = Array.isArray(jobs) ? jobs : [];
      const companiesArr = Array.isArray(companies) ? companies : [];
      const candidatesArr = Array.isArray(candidates) ? candidates : [];

      // Tính số việc mới 7 ngày qua
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const isRecent = (j) => {
        const t =
          j?.created_at ||
          j?.createdAt ||
          j?.posted_at ||
          j?.postedAt ||
          j?.updated_at ||
          j?.updatedAt;
        if (!t) return false;
        const d = new Date(t);
        return !isNaN(d.getTime()) && d >= sevenDaysAgo;
      };
      const newJobsCount = jobsArr.filter(isRecent).length;

      setCounts({
        jobs: jobsArr.length,
        companies: companiesArr.length,
        candidates: candidatesArr.length,
        newJobs: newJobsCount,
      });
    };
    console.log("counts", counts);
    console.log("counts.newJobs", counts.newJobs);
    loadCounts();
  }, []);

  const fmt = (n) => (typeof n === "number" ? n.toLocaleString("vi-VN") : n);

  const stats = [
    {
      icon: <ProfileOutlined />,
      number: fmt(counts.jobs),
      label: "Việc làm",
      variant: "soft",
    },
    {
      icon: <BankOutlined />,
      number: fmt(counts.companies),
      label: "Công ty",
      variant: "filled",
    },
    {
      icon: <TeamOutlined />,
      number: fmt(counts.candidates),
      label: "Ứng viên",
      variant: "soft",
    },
    {
      icon: <InboxOutlined />,
      number: fmt(counts.newJobs),
      label: "Việc mới",
      variant: "soft",
    },
  ];

  return (
    <div className="search-job-container">
      <Row gutter={[24, 24]} align="middle" className="hero-section">
        <Col xs={24} md={14} className="hero-content">
          <h1 className="hero-title">
            Tìm kiếm công việc phù hợp với năng lực của bạn cùng chúng tôi
          </h1>
          <p className="hero-description">
            Chúng tôi cung cấp nền tảng kết nối doanh nghiệp và ứng viên, giúp
            bạn tìm được công việc phù hợp với kỹ năng và mong muốn của mình.
          </p>

          <div className="search-form-container">
            <div className="search-form">
              <SearchListJob reverse={true} />
            </div>
          </div>

          <div className="suggestions">
            <span className="suggestions-label">Gợi ý:</span>
            {suggestions.map((s, idx) => (
              <span
                key={s.label}
                className={`suggestion-item ${
                  s.highlighted ? "highlighted" : ""
                }`}
                onClick={() => handleSuggestionClick(s.label)}
              >
                {s.label}
                {idx < suggestions.length - 1 ? "," : ""}
              </span>
            ))}
          </div>
        </Col>
        <Col xs={24} md={10} className="hero-illustration">
          <img src={heroImg} alt="Hero" className="illustration-image" />
        </Col>
      </Row>

      <Row gutter={[20, 20]} className="stats-section">
        {stats.map((item) => (
          <Col key={item.label} xs={12} sm={12} md={6}>
            <div className="stat-card">
              <div className="stat-content-left">
                <div
                  className={`stat-icon-box ${
                    item.variant === "filled" ? "filled" : "soft"
                  }`}
                >
                  <span className="stat-icon">{item.icon}</span>
                </div>
                <div className="stat-text">
                  <div className="stat-number">{item.number}</div>
                  <div className="stat-label">{item.label}</div>
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
}
export default Search;
