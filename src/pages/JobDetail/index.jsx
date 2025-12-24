import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Tag,
  Spin,
  Empty,
  Button,
  Form,
  Input,
  Select,
  Typography,
  Breadcrumb,
  Avatar,
  message,
  Modal,
  DatePicker,
  Space,
} from "antd";
import {
  EnvironmentOutlined,
  CalendarOutlined,
  ArrowRightOutlined,
  FacebookOutlined,
  TwitterOutlined,
  LinkedinOutlined,
  MailOutlined,
  LinkOutlined,
  FileTextOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { Document, Page, pdfjs } from "react-pdf";
import dayjs from "dayjs";
import { getDetaiJob, updateJob } from "../../services/jobServices/jobServices";
import { getDetaiCompany } from "../../services/getAllCompany/companyServices";
import { getLocationById } from "../../services/getAllLocation/locationServices";
import { getCookie } from "../../helpers/cookie";
import { get, edit, post, postForm } from "../../utils/axios/request";

import "./style.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const JOB_POSITIONS = [
  { key: "sales", label: "Nhân viên kinh doanh" },
  { key: "accounting", label: "Kế toán" },
  { key: "marketing", label: "Marketing" },
  { key: "hr", label: "Hành chính nhân sự" },
  { key: "customer-care", label: "Chăm sóc khách hàng" },
  { key: "banking", label: "Ngân hàng" },
  { key: "it", label: "IT" },
  { key: "labor", label: "Lao động phổ thông" },
  { key: "senior", label: "Senior" },
  { key: "construction", label: "Kỹ sư xây dựng" },
  { key: "design", label: "Thiết kế đồ họa" },
  { key: "real-estate", label: "Bất động sản" },
  { key: "education", label: "Giáo dục" },
  { key: "telesales", label: "Telesales" },
];

function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [loading, setLoading] = React.useState(false);
  const [job, setJob] = React.useState(null);
  const [company, setCompany] = React.useState(null);
  const [locationName, setLocationName] = React.useState("");
  const [appliedCandidates, setAppliedCandidates] = React.useState([]);
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [isCompany, setIsCompany] = React.useState(false);
  const [isCandidate, setIsCandidate] = React.useState(false);
  const [canEditJob, setCanEditJob] = React.useState(false);
  const [isFollowingJob, setIsFollowingJob] = React.useState(false);
  const [updating, setUpdating] = React.useState(false);
  const [loadingApplications, setLoadingApplications] = React.useState(false);
  const [unlockingCandidateId, setUnlockingCandidateId] = React.useState(null);
  const [hasApplied, setHasApplied] = React.useState(false);
  const [pdfModal, setPdfModal] = React.useState({
    open: false,
    url: "",
    name: "",
  });
  const [numPages, setNumPages] = React.useState(null);
  const [pageNumber, setPageNumber] = React.useState(1);

  // Check if user is company
  React.useEffect(() => {
    const userType = getCookie("userType");
    setIsCompany(userType === "company");
    setIsCandidate(userType === "candidate");
  }, []);

  React.useEffect(() => {
    if (!job) return;
    const userType = getCookie("userType");
    const myCompanyId = getCookie("companyId");
    const myUserId = getCookie("id");

    if (userType === "company") {
      const ownerByCompany = myCompanyId && String(job.company_id) === String(myCompanyId);
      const ownerByUser = myUserId && String(job?.postedBy?.id) === String(myUserId);
      setCanEditJob(!!(ownerByCompany || ownerByUser));
    } else {
      setCanEditJob(false);
    }

    const followKey = `followed_jobs_${myUserId || "anon"}`;
    try {
      const raw = localStorage.getItem(followKey);
      const list = raw ? JSON.parse(raw) : [];
      const exists = Array.isArray(list) && list.some((jid) => String(jid) === String(job.id));
      setIsFollowingJob(!!exists);
    } catch (_e) {
      setIsFollowingJob(false);
    }
  }, [job]);

  React.useEffect(() => {
    if (!id) return;
    const loadData = async () => {
      try {
        setLoading(true);

        // Fetch job data using service
        const jobData = await getDetaiJob(id);

        if (!jobData) {
          throw new Error("Job not found");
        }

        setJob(jobData);

        // Fetch company data if company_id exists
        if (jobData.company_id) {
          try {
            const companyData = await getDetaiCompany(jobData.company_id);
            if (companyData) {
              setCompany(companyData);
            }
          } catch (error) {
            console.error("Error fetching company:", error);
            setCompany({ id: jobData.company_id, name: "Unknown Company" });
          }
        }

        // Fetch location data if location_id exists, otherwise fall back to job.location text
        if (jobData.location_id) {
          try {
            const locationData = await getLocationById(jobData.location_id);
            if (locationData) {
              setLocationName(
                locationData.name || locationData.city || "Unknown Location"
              );
            }
          } catch (error) {
            console.error("Error fetching location:", error);
            setLocationName("Unknown Location");
          }
        } else if (jobData.location) {
          setLocationName(jobData.location);
        }

        // Populate form with current job data
        form.setFieldsValue({
          title: jobData.title || jobData.name,
          jobType: jobData.type || jobData.jobType,
          salary: jobData.salary,
          level: jobData.jobLevel || jobData.level || "Entry Level",
          position: jobData.position || "",
          description: jobData.description,
          requirements: jobData.requirements
            ? Array.isArray(jobData.requirements)
              ? jobData.requirements.join("\n")
              : jobData.requirements
            : "",
          experience: jobData.experience || "",
          education: jobData.education || "",
          desirable: jobData.desirable
            ? Array.isArray(jobData.desirable)
              ? jobData.desirable.join("\n")
              : jobData.desirable
            : "",
          benefits: jobData.benefits
            ? Array.isArray(jobData.benefits)
              ? jobData.benefits.join("\n")
              : jobData.benefits
            : "",
          location: jobData.location || jobData.location_id || "",
          status: jobData.status || "active",
          startDate: jobData.created_at ? dayjs(jobData.created_at) : dayjs(),
          endDate: jobData.expire_at
            ? dayjs(jobData.expire_at)
            : dayjs().add(30, "days"),
        });
      } catch (error) {
        console.error("Error loading job data:", error);
        message.error("Không thể tải thông tin công việc");
        setJob(null);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, form]);

  // Load real applications list for company users
  React.useEffect(() => {
    const loadApplications = async () => {
      if (!id || !isCompany) return;
      try {
        setLoadingApplications(true);
        const data = await get(`applications/job/${id}`);
        const formatted = (data || []).map((app) => ({
          id: app.id, // application id
          candidateId: app.candidate?.id,
          name: app.candidate?.fullName || app.candidate?.user?.name || "N/A",
          position: app.candidate?.introduction || "",
          experience: app.candidate?.experience || "",
          skills: [],
          language: "",
          location: app.candidate?.address || "",
          email: app.candidate?.email || "",
          phone: app.candidate?.phone || "",
          contactUnlocked: !!app.candidate?.contactUnlocked,
          status: app.status || "pending",
          cvPdfUrl: app.cvPdfUrl || null, // URL của PDF CV
        }));
        setAppliedCandidates(formatted);
      } catch (error) {
        console.error("Error loading applications:", error);
      } finally {
        setLoadingApplications(false);
      }
    };

    loadApplications();
  }, [id, isCompany]);

  const handleUnlockContact = async (candidate) => {
    const candidateId = candidate?.candidateId;
    if (!candidateId) return;
    try {
      setUnlockingCandidateId(candidateId);
      const res = await post("stars/unlock/contact", { candidateId });
      message.success(`Đã mở khóa liên hệ (còn ${res?.stars ?? "?"} sao)`);
      setAppliedCandidates((prev) =>
        prev.map((c) =>
          c.candidateId === candidateId
            ? {
                ...c,
                contactUnlocked: true,
                email: res?.contact?.email || c.email,
                phone: res?.contact?.phone || c.phone,
              }
            : c
        )
      );
    } catch (error) {
      const backendMsg = error?.response?.data?.message;
      message.error(
        backendMsg
          ? Array.isArray(backendMsg)
            ? backendMsg.join(", ")
            : backendMsg
          : "Mở khóa liên hệ thất bại"
      );
    } finally {
      setUnlockingCandidateId(null);
    }
  };

  // Check if current candidate already applied this job
  React.useEffect(() => {
    const loadMyApplications = async () => {
      if (!id || !isCandidate) return;
      try {
        const data = await get("applications/me");
        const list = Array.isArray(data) ? data : [];
        const numericId = Number(id);
        const applied = list.some((app) => {
          const appJobId = app.job?.id ?? app.jobId;
          return appJobId && Number(appJobId) === numericId;
        });
        setHasApplied(applied);
      } catch (error) {
        console.error("Error loading my applications", error);
      }
    };

    loadMyApplications();
  }, [id, isCandidate]);

  const copyJobLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      message.success("Đã copy link công việc!");
    });
  };

  const handleOpenPdfModal = (candidate) => {
    if (!candidate.cvPdfUrl) {
      message.error("Ứng viên chưa upload CV PDF");
      return;
    }
    setPdfModal({
      open: true,
      url: candidate.cvPdfUrl,
      name: candidate.name || "CV ứng viên",
    });
    setNumPages(null);
    setPageNumber(1);
  };

  const handleClosePdfModal = () => {
    setPdfModal({
      open: false,
      url: "",
      name: "",
    });
  };

  const handleDocumentLoadSuccess = ({ numPages: nextNumPages }) => {
    setNumPages(nextNumPages || 1);
    setPageNumber(1);
  };

  const showUpdateModal = () => {
    setIsModalVisible(true);
  };

  const handleFollowJob = () => {
    if (!job?.id) return;
    const myUserId = getCookie("id");
    const followKey = `followed_jobs_${myUserId || "anon"}`;
    try {
      const raw = localStorage.getItem(followKey);
      const list = raw ? JSON.parse(raw) : [];
      const next = Array.isArray(list) ? list : [];
      const exists = next.some((jid) => String(jid) === String(job.id));
      if (exists) {
        message.info("Bạn đã theo dõi công việc này rồi.");
        setIsFollowingJob(true);
        return;
      }
      next.push(job.id);
      localStorage.setItem(followKey, JSON.stringify(next));
      setIsFollowingJob(true);
      message.success("Đã theo dõi công việc.");
    } catch (_e) {
      message.error("Không thể theo dõi công việc.");
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleFollowCompany = () => {
    if (!company && !job?.company_id) {
      message.info("Không tìm thấy thông tin công ty để theo dõi.");
      return;
    }
    const companyId = company?.id || job?.company_id;
    if (companyId) {
      navigate(`/companies/${companyId}`);
    }
  };

  const handleApply = async () => {
    if (!job?.id) return;

    if (hasApplied) {
      message.info(
        "Bạn đã ứng tuyển công việc này. Hãy theo dõi cập nhật từ nhà tuyển dụng."
      );
      return;
    }

    // Hiển thị modal để upload PDF CV
    Modal.confirm({
      title: "Ứng tuyển công việc",
      content: (
        <div>
          <p style={{ marginBottom: 16 }}>
            Vui lòng tải lên file PDF CV của bạn để ứng tuyển.
          </p>
          <input
            type="file"
            id="cv-pdf-input"
            accept=".pdf"
            style={{ width: "100%" }}
          />
        </div>
      ),
      okText: "Ứng tuyển",
      cancelText: "Hủy",
      onOk: async () => {
        const fileInput = document.getElementById("cv-pdf-input");
        const file = fileInput?.files?.[0];

        if (!file) {
          message.error("Vui lòng chọn file PDF CV");
          return Promise.reject();
        }

        if (file.type !== "application/pdf") {
          message.error("Vui lòng chọn file PDF");
          return Promise.reject();
        }

        try {
          const formData = new FormData();
          formData.append("jobId", String(job.id));
          formData.append("cvPdf", file);

          await postForm("applications", formData);
          message.success("Ứng tuyển thành công!");
          setHasApplied(true);
        } catch (error) {
          const backendMsg = error?.response?.data?.message;
          message.error(
            backendMsg
              ? Array.isArray(backendMsg)
                ? backendMsg.join(", ")
                : backendMsg
              : "Ứng tuyển thất bại, vui lòng thử lại."
          );
          return Promise.reject();
        }
      },
    });
  };

  const handleUpdateApplicationStatus = async (applicationId, status) => {
    try {
      await edit(`applications/${applicationId}/status`, { status });
      message.success("Cập nhật trạng thái ứng tuyển thành công");
      // Cập nhật tại chỗ để chuyển card sang nhóm tương ứng
      setAppliedCandidates((prev) =>
        prev.map((c) => (c.id === applicationId ? { ...c, status } : c))
      );
      // Đồng bộ lại từ server (không bắt buộc) để đảm bảo dữ liệu mới nhất
      if (isCompany && id) {
        try {
          const data = await get(`applications/job/${id}`);
          const formatted = (data || []).map((app) => ({
            id: app.id,
            candidateId: app.candidate?.id,
            name: app.candidate?.fullName || app.candidate?.user?.name || "N/A",
            position: app.candidate?.introduction || "",
            experience: app.candidate?.experience || "",
            skills: [],
            language: "",
            location: app.candidate?.address || "",
            status: app.status || "pending",
          }));
          setAppliedCandidates(formatted);
        } catch (e) {
          console.error(
            "Failed to reload applications after status update:",
            e
          );
        }
      }
    } catch (error) {
      const backendMsg = error?.response?.data?.message;
      message.error(
        backendMsg
          ? Array.isArray(backendMsg)
            ? backendMsg.join(", ")
            : backendMsg
          : "Cập nhật trạng thái thất bại"
      );
    }
  };

  const handleUpdate = async (values) => {
    try {
      setUpdating(true);

      // Giữ nguyên tất cả các trường hiện có và chỉ cập nhật những trường được chỉnh sửa
      // Chuyển đổi string thành array cho requirements, desirable, benefits
      const convertToArray = (value) => {
        if (!value) return [];
        if (typeof value === "string") {
          return value.split("\n").filter((item) => item.trim() !== "");
        }
        return value;
      };

      const updateData = {
        // các field theo UpdateJobDto / CreateJobDto
        title: values.title,
        description: values.description,
        company: job.company,
        salary: values.salary,
        type: values.jobType,
        jobLevel: values.level,
        position: values.position,
        requirements: convertToArray(values.requirements),
        desirable: convertToArray(values.desirable),
        benefits: convertToArray(values.benefits),
        experience: values.experience || "",
        education: values.education || "",
        location_id: job.location_id || undefined,
        company_id: job.company_id || undefined,
        status: values.status || job.status || "active",
        expire_at: values.endDate
          ? values.endDate.format("YYYY-MM-DD")
          : job.expire_at,
      };

      await updateJob(id, updateData);
      message.success("Cập nhật thông tin công việc thành công!");
      setIsModalVisible(false);

      // Reload job data
      const jobData = await getDetaiJob(id);
      setJob(jobData);
      form.setFieldsValue({
        title: jobData.title || jobData.name,
        jobType: jobData.type || jobData.jobType,
        salary: jobData.salary,
        level: jobData.jobLevel || jobData.level || "Entry Level",
        position: jobData.position || "",
        description: jobData.description,
        requirements: jobData.requirements
          ? Array.isArray(jobData.requirements)
            ? jobData.requirements.join("\n")
            : jobData.requirements
          : "",
        experience: jobData.experience || "",
        education: jobData.education || "",
        desirable: jobData.desirable
          ? Array.isArray(jobData.desirable)
            ? jobData.desirable.join("\n")
            : jobData.desirable
          : "",
        benefits: jobData.benefits
          ? Array.isArray(jobData.benefits)
            ? jobData.benefits.join("\n")
            : jobData.benefits
          : "",
        location: jobData.location || jobData.location_id || "",
        status: jobData.status || "active",
        startDate: jobData.created_at ? dayjs(jobData.created_at) : dayjs(),
        endDate: jobData.expire_at
          ? dayjs(jobData.expire_at)
          : dayjs().add(30, "days"),
      });
    } catch (error) {
      console.error("Error updating job:", error);
      message.error("Không thể cập nhật thông tin công việc");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!job) {
    return <Empty description="Không tìm thấy công việc" />;
  }

  return (
    <div className="job-detail-container">
      {/* Breadcrumb */}
      <Breadcrumb style={{ marginBottom: 24 }}>
        <Breadcrumb.Item>Trang chủ</Breadcrumb.Item>
        <Breadcrumb.Item>Việc làm</Breadcrumb.Item>
        <Breadcrumb.Item>{job.title || "Chi tiết công việc"}</Breadcrumb.Item>
      </Breadcrumb>

      <Row gutter={[24, 24]}>
        {/* Main Content */}
        <Col xs={24} lg={16}>
          <Card className="job-detail-card">
            {/* Job Header */}
            <div className="job-header">
              <div className="job-header-left">
                <Avatar
                  size={60}
                  className="company-logo"
                  src={company?.logo || null}
                >
                  {(company?.companyName || company?.name)?.charAt(0) || "?"}
                </Avatar>
                <div className="job-title-section">
                  <Title level={2} className="job-title">
                    {job.title}
                  </Title>
                  <Text className="company-name">
                    at {company?.companyName || company?.name || "Unknown"}
                  </Text>
                  <div className="job-tags">
                    <Tag
                      color={
                        job.type === "FULL-TIME"
                          ? "green"
                          : job.type === "PART-TIME"
                          ? "blue"
                          : "orange"
                      }
                      className="job-tag"
                    >
                      {job.type || job.jobType}
                    </Tag>
                    <Tag color="red" className="job-tag">
                      Featured
                    </Tag>
                  </div>
                </div>
              </div>
            </div>

            {/* Job Description */}
            <div className="job-section">
              <Title level={4}>Job Description</Title>
              <Paragraph className="job-description">
                {job.description}
              </Paragraph>
            </div>

            {/* Requirements */}
            {job.requirements && (
              <div className="job-section">
                <Title level={4}>Requirements</Title>
                <ul className="job-list">
                  {Array.isArray(job.requirements) ? (
                    job.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))
                  ) : (
                    <li>{job.requirements}</li>
                  )}
                </ul>
              </div>
            )}

            {/* Desirable */}
            {job.desirable && (
              <div className="job-section">
                <Title level={4}>Desirable</Title>
                <ul className="job-list">
                  {Array.isArray(job.desirable) ? (
                    job.desirable.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))
                  ) : (
                    <li>{job.desirable}</li>
                  )}
                </ul>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && (
              <div className="job-section">
                <Title level={4}>Benefits</Title>
                <ul className="job-list">
                  {Array.isArray(job.benefits) ? (
                    job.benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))
                  ) : (
                    <li>{job.benefits}</li>
                  )}
                </ul>
              </div>
            )}
          </Card>
        </Col>

        {/* Sidebar */}
        <Col xs={24} lg={8}>
          <Card className="job-overview-card">
            {/* Update Button - Only show for company */}
            {isCompany && canEditJob && (
              <Button
                type="primary"
                onClick={showUpdateModal}
                style={{
                  width: "100%",
                  marginBottom: "20px",
                  backgroundColor: "#c41e3a",
                  borderColor: "#c41e3a",
                }}
              >
                Cập Nhật Thông Tin
              </Button>
            )}

            {isCompany && !canEditJob && (
              <Button
                type="default"
                onClick={handleFollowJob}
                style={{
                  width: "100%",
                  marginBottom: "20px",
                }}
              >
                {isFollowingJob ? "Đã theo dõi" : "Theo dõi công việc"}
              </Button>
            )}

            {/* Apply / Follow Company button - only for candidate */}
            {isCandidate && (
              <Button
                type="primary"
                onClick={hasApplied ? handleFollowCompany : handleApply}
                style={{
                  width: "100%",
                  marginBottom: "20px",
                  backgroundColor: "#52c41a",
                  borderColor: "#52c41a",
                }}
              >
                {hasApplied ? "Theo dõi công ty" : "Ứng tuyển ngay"}
              </Button>
            )}
            {/* Salary */}
            <div className="salary-section">
              <Text className="salary-label">Salary (USD)</Text>
              <Title level={3} className="salary-amount">
                {job.salary}
              </Title>
              <Text className="salary-period">Yearly salary</Text>
            </div>
            {/* Location */}
            <div className="location-section">
              <Text className="location-label">Job Location</Text>
              <Text className="location-value">
                {job.location || locationName || "Unknown"}
              </Text>
            </div>
            {/* Job Overview */}

            <div className="overview-section">
              <h4>Job Overview</h4>
              <div className="overview-grid">
                <div className="overview-item">
                  <div className="overview-item-label">
                    <CalendarOutlined className="overview-icon" />
                    JOB POSTED
                  </div>
                  <div className="overview-item-value">
                    {job.created_at
                      ? dayjs(job.created_at).format("DD MMM, YYYY")
                      : "N/A"}
                  </div>
                </div>
                {/* Tương tự cho các items khác */}
              </div>
            </div>
            {/* Share */}
            <div className="share-section">
              <Title level={4}>Share this job</Title>
              <div className="share-buttons">
                <Button
                  icon={<LinkOutlined />}
                  onClick={copyJobLink}
                  className="copy-link-btn"
                >
                  Copy Links
                </Button>
                <div className="social-buttons">
                  <Button
                    icon={<LinkedinOutlined />}
                    className="social-btn linkedin"
                  />
                  <Button
                    icon={<FacebookOutlined />}
                    className="social-btn facebook"
                  />
                  <Button
                    icon={<TwitterOutlined />}
                    className="social-btn twitter"
                  />
                  <Button
                    icon={<MailOutlined />}
                    className="social-btn email"
                  />
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Applied Candidates - Grouped by status for company */}
      {isCompany && (
        <div className="applied-candidates-section">
          <Title level={3}>Ứng viên đã nộp</Title>
          {loadingApplications ? (
            <Spin />
          ) : (
            <Row gutter={[16, 16]}>
              {[
                { key: "pending", title: "CV chưa xét", color: "gold" },
                { key: "approved", title: "CV đã duyệt", color: "green" },
                { key: "rejected", title: "CV không duyệt", color: "red" },
              ].map((group) => {
                const list = appliedCandidates.filter(
                  (c) => c.status === group.key
                );
                return (
                  <Col xs={24} md={8} key={group.key}>
                    <Card
                      title={
                        <span>
                          {group.title}{" "}
                          <Tag color={group.color}>{list.length}</Tag>
                        </span>
                      }
                    >
                      {list.length === 0 ? (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description="Trống"
                        />
                      ) : (
                        <Space direction="vertical" style={{ width: "100%" }}>
                          {list.map((candidate) => (
                            <Card
                              key={candidate.id}
                              size="small"
                              hoverable
                              onClick={() => handleOpenPdfModal(candidate)}
                            >
                              <div className="candidate-info">
                                <Avatar size={40} className="candidate-avatar">
                                  {candidate.name?.charAt(0) || "?"}
                                </Avatar>
                                <div className="candidate-details">
                                  <div className="candidate-name">
                                    {candidate.name}
                                  </div>
                                  {candidate.location && (
                                    <div className="candidate-location">
                                      <EnvironmentOutlined className="location-icon" />
                                      <Text>{candidate.location}</Text>
                                    </div>
                                  )}

                                  {(candidate.email || candidate.phone) && (
                                    <div style={{ marginTop: 4 }}>
                                      {candidate.email && (
                                        <div>
                                          <MailOutlined style={{ marginRight: 6 }} />
                                          <Text>{candidate.email}</Text>
                                        </div>
                                      )}
                                      {candidate.phone && (
                                        <div>
                                          <Text>SDT: {candidate.phone}</Text>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="candidate-actions">
                                  {candidate.cvPdfUrl && (
                                    <Button
                                      size="small"
                                      type="link"
                                      icon={<FileTextOutlined />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenPdfModal(candidate);
                                      }}
                                      title="Xem CV ứng viên"
                                    >
                                      Xem CV
                                    </Button>
                                  )}

                                  {!candidate.contactUnlocked && (
                                    <Button
                                      size="small"
                                      type="primary"
                                      loading={unlockingCandidateId === candidate.candidateId}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUnlockContact(candidate);
                                      }}
                                    >
                                      Mở khóa (1 sao)
                                    </Button>
                                  )}

                                  {group.key === "pending" && (
                                    <>
                                      <Button
                                        size="small"
                                        type="primary"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleUpdateApplicationStatus(
                                            candidate.id,
                                            "approved"
                                          );
                                        }}
                                      >
                                        Duyệt
                                      </Button>
                                      <Button
                                        size="small"
                                        danger
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleUpdateApplicationStatus(
                                            candidate.id,
                                            "rejected"
                                          );
                                        }}
                                      >
                                        Không duyệt
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </Space>
                      )}
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
        </div>
      )}

      {/* Update Job Modal */}
      <Modal
        title="Cập nhật thông tin công việc"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={800}
        style={{ top: 20 }}
        bodyStyle={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          <Form.Item
            label="Tên công việc"
            name="title"
            rules={[
              { required: true, message: "Vui lòng nhập tên công việc!" },
            ]}
          >
            <Input placeholder="Technical Support" />
          </Form.Item>

          <Form.Item
            label="Thời gian làm việc"
            name="jobType"
            rules={[
              { required: true, message: "Vui lòng chọn thời gian làm việc!" },
            ]}
          >
            <Select placeholder="Chọn thời gian">
              <Option value="FULL-TIME">Full-time</Option>
              <Option value="PART-TIME">Part-time</Option>
              <Option value="INTERN">Intern</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Mức lương"
            name="salary"
            rules={[{ required: true, message: "Vui lòng nhập mức lương!" }]}
          >
            <Input placeholder="$500 - $1,500" />
          </Form.Item>

          <Form.Item
            label="Cấp độ chuyên môn"
            name="level"
            rules={[{ required: true, message: "Vui lòng chọn cấp độ!" }]}
          >
            <Select placeholder="Chọn cấp độ">
              <Option value="Senior">Senior</Option>
              <Option value="Junior">Junior</Option>
              <Option value="Fresher">Fresher</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Danh mục công việc"
            name="position"
            rules={[{ required: true, message: "Vui lòng chọn danh mục công việc!" }]}
          >
            <Select placeholder="Chọn danh mục">
              {JOB_POSITIONS.map((pos) => (
                <Option key={pos.key} value={pos.key}>
                  {pos.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Mô tả công việc"
            name="description"
            rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}
          >
            <TextArea rows={4} placeholder="Hint text" />
          </Form.Item>

          <Form.Item label="Yêu cầu của công việc" name="requirements">
            <TextArea
              rows={4}
              placeholder="Nhập yêu cầu công việc (mỗi yêu cầu 1 dòng)"
            />
          </Form.Item>

          <Form.Item label="Kinh nghiệm yêu cầu" name="experience">
            <Input placeholder="Ví dụ: 2-3 năm" />
          </Form.Item>

          <Form.Item label="Trình độ học vấn" name="education">
            <Select placeholder="Chọn trình độ">
              <Option value="Đại học">Đại học</Option>
              <Option value="Cao đẳng">Cao đẳng</Option>
              <Option value="Trung cấp">Trung cấp</Option>
              <Option value="Không yêu cầu">Không yêu cầu</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Kỹ năng mong muốn (Desirable)" name="desirable">
            <TextArea
              rows={3}
              placeholder="Nhập các kỹ năng mong muốn (mỗi kỹ năng 1 dòng)"
            />
          </Form.Item>

          <Form.Item label="Quyền lợi (Benefits)" name="benefits">
            <TextArea
              rows={4}
              placeholder="Nhập các quyền lợi (mỗi quyền lợi 1 dòng)"
            />
          </Form.Item>

          <Form.Item label="Địa điểm làm việc" name="location">
            <Input placeholder="Ví dụ: Hà Nội" />
          </Form.Item>

          <Form.Item label="Trạng thái" name="status">
            <Select placeholder="Chọn trạng thái">
              <Option value="active">Đang tuyển</Option>
              <Option value="inactive">Ngừng tuyển</Option>
              <Option value="closed">Đã đóng</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Thời gian ứng tuyển" style={{ marginBottom: 0 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="startDate" label="Start Date">
                  <DatePicker
                    style={{ width: "100%" }}
                    format="MMM DD, YYYY"
                    disabled
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="endDate"
                  label="End Date"
                  rules={[
                    { required: true, message: "Vui lòng chọn ngày kết thúc!" },
                  ]}
                >
                  <DatePicker style={{ width: "100%" }} format="MMM DD, YYYY" />
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Button block onClick={handleCancel}>
                  Hủy Bỏ
                </Button>
              </Col>
              <Col span={12}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={updating}
                  style={{
                    backgroundColor: "#c41e3a",
                    borderColor: "#c41e3a",
                  }}
                >
                  Cập Nhật
                </Button>
              </Col>
            </Row>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={pdfModal.name || "CV ứng viên"}
        open={pdfModal.open}
        onCancel={handleClosePdfModal}
        footer={null}
        width={900}
        style={{ top: 20 }}
        bodyStyle={{ height: "80vh" }}
      >
        {!pdfModal.url ? (
          <div style={{ textAlign: "center", padding: 24 }}>
            Không có file CV để hiển thị.
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <span>
                Trang {pageNumber}/{numPages || "?"}
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  size="small"
                  disabled={!numPages || pageNumber <= 1}
                  onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
                >
                  Trang trước
                </Button>
                <Button
                  size="small"
                  disabled={!numPages || pageNumber >= numPages}
                  onClick={() =>
                    setPageNumber((prev) =>
                      numPages ? Math.min(prev + 1, numPages) : prev
                    )
                  }
                >
                  Trang sau
                </Button>
                <Button
                  size="small"
                  type="primary"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = pdfModal.url;
                    const safeName = (pdfModal.name || "ungvien").replace(
                      /[^a-zA-Z0-9-_]/g,
                      "_"
                    );
                    link.download = `CV_${safeName}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  Tải về
                </Button>
              </div>
            </div>
            <div
              style={{
                flex: 1,
                overflow: "auto",
                border: "1px solid #f0f0f0",
                borderRadius: 4,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Document
                file={pdfModal.url}
                onLoadSuccess={handleDocumentLoadSuccess}
                loading={
                  <div style={{ padding: 24, textAlign: "center" }}>
                    <Spin />
                  </div>
                }
                error={
                  <div style={{ padding: 24, textAlign: "center" }}>
                    Không thể hiển thị file PDF.
                  </div>
                }
              >
                <Page pageNumber={pageNumber} width={800} />
              </Document>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default JobDetail;
