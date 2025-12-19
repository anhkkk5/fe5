import React, { useEffect, useState, useRef } from "react";
import { Card, Row, Col, Typography, Button, message, Spin } from "antd";
import { DownloadOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { getMyCVs } from "../../services/CVs/cvsServices";
import { getCookie } from "../../helpers/cookie";
import html2pdf from "html2pdf.js";
import ProfileInfo from "../../components/CV/ProfileInfo";
import Introduction from "../../components/CV/Introduction";
import Education from "../../components/CV/Education";
import Experience from "../../components/CV/Experience";
import Activities from "../../components/CV/Activities";
import Projects from "../../components/CV/Projects";
import Certificates from "../../components/CV/Certificates";
import "./style.css";

const { Title } = Typography;

function ViewCVPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [cvData, setCvData] = useState(null);
  const [cvInfo, setCvInfo] = useState(null);
  const printAreaRef = useRef(null);

  useEffect(() => {
    const token = getCookie("token") || localStorage.getItem("token");
    if (!token) {
      message.error("Vui lòng đăng nhập để xem CV");
      navigate("/login");
      return;
    }

    fetchCV();
  }, [id, navigate]);

  const fetchCV = async () => {
    try {
      setLoading(true);
      const cvs = await getMyCVs();
      const cv = cvs.find((c) => c.id === parseInt(id));

      if (!cv) {
        message.error("Không tìm thấy CV");
        navigate("/my-cvs");
        return;
      }

      setCvInfo(cv);

      // Parse dữ liệu từ summary (JSON string)
      let parsedData = null;
      try {
        if (cv.summary) {
          parsedData = JSON.parse(cv.summary);
          console.log("Parsed CV data:", parsedData);
          console.log("Education count:", parsedData.education?.length || 0);
          console.log("Experience count:", parsedData.experience?.length || 0);
          console.log("Projects count:", parsedData.projects?.length || 0);
          console.log(
            "Certificates count:",
            parsedData.certificates?.length || 0
          );
          console.log("Activities count:", parsedData.activities?.length || 0);
          console.log("Candidate data:", parsedData.candidate);
        } else {
          console.warn("CV summary is empty or null");
        }
      } catch (e) {
        console.error("Error parsing CV summary:", e);
        console.log("Raw summary:", cv.summary);
        console.log("Summary type:", typeof cv.summary);
        console.log("Summary length:", cv.summary?.length);
      }

      // Nếu parse thành công và có dữ liệu
      if (parsedData && typeof parsedData === "object") {
        // Đảm bảo có đầy đủ các trường
        setCvData({
          intro: parsedData.intro || "",
          education: Array.isArray(parsedData.education)
            ? parsedData.education
            : [],
          experience: Array.isArray(parsedData.experience)
            ? parsedData.experience
            : [],
          projects: Array.isArray(parsedData.projects)
            ? parsedData.projects
            : [],
          certificates: Array.isArray(parsedData.certificates)
            ? parsedData.certificates
            : [],
          activities: Array.isArray(parsedData.activities)
            ? parsedData.activities
            : [],
          sectionOrder: Array.isArray(parsedData.sectionOrder)
            ? parsedData.sectionOrder
            : [
                "intro",
                "education",
                "experience",
                "projects",
                "certificates",
                "activities",
              ],
          candidate: {
            fullName: parsedData.candidate?.fullName || cv.title || "",
            name:
              parsedData.candidate?.fullName ||
              parsedData.candidate?.name ||
              cv.title ||
              "",
            position: parsedData.candidate?.position || cv.position || "",
            address: parsedData.candidate?.address || cv.location || "",
            avatar: parsedData.candidate?.avatar || cv.avatarUrl || "",
            phone: parsedData.candidate?.phone || cv.phone || "",
            email: parsedData.candidate?.email || cv.email || "",
            dob: parsedData.candidate?.dob || "",
            gender: parsedData.candidate?.gender || "",
            isOpen:
              parsedData.candidate?.isOpen !== undefined
                ? parsedData.candidate.isOpen
                : 1,
          },
        });
      } else {
        // Nếu không phải JSON hoặc không có dữ liệu, dùng fallback
        setCvData({
          intro: cv.summary || "",
          education: [],
          experience: [],
          projects: [],
          certificates: [],
          activities: [],
          sectionOrder: [
            "intro",
            "education",
            "experience",
            "projects",
            "certificates",
            "activities",
          ],
          candidate: {
            fullName: cv.title || "",
            name: cv.title || "",
            position: cv.position || "",
            address: cv.location || "",
            avatar: cv.avatarUrl || "",
            phone: cv.phone || "",
            email: cv.email || "",
            dob: "",
            gender: "",
            isOpen: 1,
          },
        });
      }
    } catch (error) {
      console.error("Error fetching CV:", error);
      message.error("Không thể tải CV");
      navigate("/my-cvs");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!printAreaRef.current) {
      message.warning("Không tìm thấy nội dung CV để tải");
      return;
    }

    const element = printAreaRef.current;
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `${cvInfo?.title || "CV"}_${new Date().getTime()}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf().set(opt).from(element).save();
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!cvData || !cvInfo) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Title level={3}>Không tìm thấy CV</Title>
        <Button onClick={() => navigate("/my-cvs")}>
          Quay lại danh sách CV
        </Button>
      </div>
    );
  }

  const candidate = cvData.candidate || {};
  const sectionOrder = cvData.sectionOrder || [
    "intro",
    "education",
    "experience",
    "projects",
    "certificates",
    "activities",
  ];

  return (
    <div className="view-cv-page">
      <div className="view-cv-container">
        <div
          style={{
            marginBottom: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/my-cvs")}
          >
            Quay lại
          </Button>
          <Title level={3} style={{ margin: 0, flex: 1, textAlign: "center" }}>
            {cvInfo.title}
          </Title>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleDownloadPDF}
          >
            Tải PDF
          </Button>
        </div>

        <div ref={printAreaRef} className="cv-print-area">
          <div id="section-profile">
            <ProfileInfo candidate={candidate} readOnly={true} />
          </div>

          {sectionOrder.map((key) => {
            if (key === "intro") {
              return (
                <div key={key}>
                  <Introduction intro={cvData.intro || ""} readOnly={true} />
                </div>
              );
            }
            if (key === "education") {
              return (
                <div key={key}>
                  <Education
                    educationList={cvData.education || []}
                    readOnly={true}
                  />
                </div>
              );
            }
            if (key === "experience") {
              return (
                <div key={key}>
                  <Experience
                    experienceList={cvData.experience || []}
                    readOnly={true}
                  />
                </div>
              );
            }
            if (key === "projects") {
              return (
                <div key={key}>
                  <Projects
                    projectsList={cvData.projects || []}
                    readOnly={true}
                  />
                </div>
              );
            }
            if (key === "certificates") {
              return (
                <div key={key}>
                  <Certificates
                    certificatesList={cvData.certificates || []}
                    readOnly={true}
                  />
                </div>
              );
            }
            if (key === "activities") {
              return (
                <div key={key}>
                  <Activities
                    activityList={cvData.activities || []}
                    readOnly={true}
                  />
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
}

export default ViewCVPage;
