import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Row, Col, Typography, Spin, Empty } from "antd";
import { get } from "../../utils/axios/request";
import "./style.css";
import ProfileInfo from "../../components/CV/ProfileInfo";
import Introduction from "../../components/CV/Introduction";
import Education from "../../components/CV/Education";
import Experience from "../../components/CV/Experience";
import Projects from "../../components/CV/Projects";
import Certificates from "../../components/CV/Certificates";

const { Text } = Typography;

function CandidateDetail() {
  const { id } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cvData, setCvData] = useState({
    intro: "",
    education: [],
    experience: [],
    projects: [],
    certificates: [],
  });

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // Lấy thông tin candidate từ API
        const candidateData = await get(`candidates/${id}`);
        if (!candidateData) {
          setCandidate(null);
          return;
        }
        setCandidate(candidateData);

        // Lấy thông tin education, experience, projects, certificates
        try {
          const [education, experience, projects, certificates] = await Promise.all([
            get(`education/candidate/${id}`).catch(() => []),
            get(`experiences/candidate/${id}`).catch(() => []),
            get(`projects/candidate/${id}`).catch(() => []),
            get(`certificates/candidate/${id}`).catch(() => []),
          ]);

          setCvData({
            intro: candidateData.introduction || "",
            education: Array.isArray(education) ? education : [],
            experience: Array.isArray(experience) ? experience : [],
            projects: Array.isArray(projects) ? projects : [],
            certificates: Array.isArray(certificates) ? certificates : [],
          });
        } catch (e) {
          console.error("Error loading CV sections:", e);
          setCvData({
            intro: candidateData.introduction || "",
            education: [],
            experience: [],
            projects: [],
            certificates: [],
          });
        }
      } catch (e) {
        console.error("Error loading candidate:", e);
        setCandidate(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div style={{ padding: 40 }}>
        <Empty description="Không tìm thấy thông tin ứng viên" />
      </div>
    );
  }

  return (
    <div className="cv-page">
      <div className="cv-container">
        <div className="breadcrumb">
          <Text>Trang chủ / Thông tin ứng viên</Text>
        </div>

        <Row gutter={24}>
          {/* Bên trái: thông tin tổng quan */}
          <Col xs={24} md={8}></Col>

          {/* Bên phải: CV chi tiết (chỉ đọc, không có icon chỉnh sửa) */}
          <Col xs={24} md={16}>
            <ProfileInfo candidate={candidate} readOnly={true} />

            <Introduction intro={cvData.intro} readOnly={true} />

            <Education educationList={cvData.education} readOnly={true} />

            <Experience experienceList={cvData.experience} readOnly={true} />

            <Projects projectsList={cvData.projects} readOnly={true} />

            <Certificates certificatesList={cvData.certificates} readOnly={true} />
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default CandidateDetail;
