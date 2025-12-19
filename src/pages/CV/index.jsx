import React, { useEffect, useRef, useState } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Spin,
  message,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
} from "antd";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { getCookie } from "../../helpers/cookie";
import {
  getMyCandidateProfile,
  uploadMyAvatar,
  updateMyCandidateProfile,
} from "../../services/Candidates/candidatesServices";
import {
  getEducationByCandidate,
  createEducation,
  updateEducation,
  deleteEducation,
} from "../../services/educationServices/educationServices";
import {
  getExperienceByCandidate,
  createExperience,
  updateExperience,
  deleteExperience,
} from "../../services/Experience/ExperienceServices";
import {
  getProjectsByCandidate,
  createProject,
  updateProject,
  deleteProject,
} from "../../services/project/ProjectServices";
import {
  getCertificatesByCandidate,
  createCertificate,
  updateCertificate,
  deleteCertificate,
} from "../../services/Certificates/CertificatesServices";
import {
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
} from "../../services/Activities/ActivitiesServices";
import {
  getAwards,
  createAward,
  updateAward,
  deleteAward,
} from "../../services/Awards/AwardsServices";
import {
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill,
} from "../../services/Skills/SkillsServices";
import {
  getReferences,
  createReference,
  updateReference,
  deleteReference,
} from "../../services/References/ReferencesServices";
import {
  getHobbies,
  createHobby,
  updateHobby,
  deleteHobby,
} from "../../services/Hobbies/HobbiesServices";
import "./style.css";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const formatDateRange = (start, end) => {
  const s = start ? dayjs(start).format("MM/YYYY") : "";
  const e = end ? dayjs(end).format("MM/YYYY") : "Hiện tại";
  return [s, e].filter(Boolean).join(" - ");
};

const bulletize = (text) => {
  if (!text) return [];
  return text
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);
};

function CVPage() {
  const navigate = useNavigate();
  const printAreaRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [candidate, setCandidate] = useState(null);
  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);
  const [projects, setProjects] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [activities, setActivities] = useState([]);
  const [awards, setAwards] = useState([]);
  const [skills, setSkills] = useState([]);
  const [references, setReferences] = useState([]);
  const [hobbies, setHobbies] = useState([]);
  const [profileModal, setProfileModal] = useState(false);
  const [introModal, setIntroModal] = useState(false);
  const [formProfile] = Form.useForm();
  const [formIntro] = Form.useForm();
  const [eduModal, setEduModal] = useState(false);
  const [expModal, setExpModal] = useState(false);
  const [projModal, setProjModal] = useState(false);
  const [certModal, setCertModal] = useState(false);
  const [actModal, setActModal] = useState(false);
  const [awardModal, setAwardModal] = useState(false);
  const [skillModal, setSkillModal] = useState(false);
  const [refModal, setRefModal] = useState(false);
  const [hobbyModal, setHobbyModal] = useState(false);
  const [editingEdu, setEditingEdu] = useState(null);
  const [editingExp, setEditingExp] = useState(null);
  const [editingProj, setEditingProj] = useState(null);
  const [editingCert, setEditingCert] = useState(null);
  const [editingAct, setEditingAct] = useState(null);
  const [editingAward, setEditingAward] = useState(null);
  const [editingSkill, setEditingSkill] = useState(null);
  const [editingRef, setEditingRef] = useState(null);
  const [editingHobby, setEditingHobby] = useState(null);
  const [formEdu] = Form.useForm();
  const [formExp] = Form.useForm();
  const [formProj] = Form.useForm();
  const [formCert] = Form.useForm();
  const [formAct] = Form.useForm();
  const [formAward] = Form.useForm();
  const [formSkill] = Form.useForm();
  const [formRef] = Form.useForm();
  const [formHobby] = Form.useForm();

  const handleDownload = async () => {
    if (!printAreaRef.current) return;

    const sheetEl = printAreaRef.current;
    sheetEl.classList.add("pdf-export");

    try {
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `CV_${candidate?.fullName || "MyCV"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      await html2pdf().set(opt).from(sheetEl).save();
    } finally {
      sheetEl.classList.remove("pdf-export");
    }
  };

  const handleSaveProfile = async () => {
    try {
      const values = await formProfile.validateFields();
      await updateMyCandidateProfile({
        fullName: values.fullName,
        name: values.fullName,
        position: values.position,
        address: values.address,
        email: values.email,
        phone: values.phone,
        dob: values.dob ? values.dob.format("YYYY-MM-DD") : undefined,
        gender: values.gender,
      });
      setCandidate((prev) => ({
        ...prev,
        fullName: values.fullName,
        name: values.fullName,
        position: values.position,
        address: values.address,
        email: values.email,
        phone: values.phone,
        dob: values.dob ? values.dob.format("YYYY-MM-DD") : prev?.dob,
        gender: values.gender,
      }));
      message.success("Đã lưu thông tin");
      setProfileModal(false);
    } catch (err) {
      if (err?.errorFields) return;
      console.error(err);
      message.error("Lưu thất bại");
    }
  };

  const handleSaveIntro = async () => {
    try {
      const values = await formIntro.validateFields();
      await updateMyCandidateProfile({ introduction: values.introduction });
      setCandidate((prev) => ({ ...prev, introduction: values.introduction }));
      message.success("Đã lưu mục tiêu");
      setIntroModal(false);
    } catch (err) {
      if (err?.errorFields) return;
      console.error(err);
      message.error("Lưu thất bại");
    }
  };

  // đồng bộ form mỗi khi mở modal
  useEffect(() => {
    if (profileModal && candidate) {
      formProfile.setFieldsValue({
        fullName: candidate.fullName || candidate.name,
        position: candidate.position,
        address: candidate.address,
        email: candidate.email,
        phone: candidate.phone,
        dob: candidate.dob ? dayjs(candidate.dob) : null,
        gender: candidate.gender,
      });
    }
  }, [profileModal, candidate, formProfile]);

  useEffect(() => {
    if (introModal && candidate) {
      formIntro.setFieldsValue({
        introduction: candidate.introduction || "",
      });
    }
  }, [introModal, candidate, formIntro]);

  const handleSaveEducation = async () => {
    try {
      const values = await formEdu.validateFields();
      const payload = {
        name_education: values.school,
        major: values.major,
        started_at: values.startDate
          ? values.startDate.format("YYYY-MM-DD")
          : null,
        end_at: values.endDate ? values.endDate.format("YYYY-MM-DD") : null,
        info: values.description || "",
      };
      if (editingEdu && editingEdu.id) {
        await updateEducation(editingEdu.id, payload);
      } else {
        payload.candidate_id = candidate?.id;
        await createEducation(payload);
      }
      message.success("Đã lưu học vấn");
      setEduModal(false);
      setEditingEdu(null);
      formEdu.resetFields();
      await reloadSections();
    } catch (err) {
      if (err?.errorFields) return;
      console.error(err);
      message.error("Lưu học vấn thất bại");
    }
  };

  const handleSaveExperience = async () => {
    try {
      const values = await formExp.validateFields();
      const payload = {
        position: values.position,
        company: values.company,
        started_at: values.startDate
          ? values.startDate.format("YYYY-MM-DD")
          : null,
        end_at: values.endDate ? values.endDate.format("YYYY-MM-DD") : null,
        info: values.description || "",
      };
      if (editingExp && editingExp.id) {
        await updateExperience(editingExp.id, payload);
      } else {
        payload.candidate_id = candidate?.id;
        await createExperience(payload);
      }
      message.success("Đã lưu kinh nghiệm");
      setExpModal(false);
      setEditingExp(null);
      formExp.resetFields();
      await reloadSections();
    } catch (err) {
      if (err?.errorFields) return;
      console.error(err);
      message.error("Lưu kinh nghiệm thất bại");
    }
  };

  const handleSaveProject = async () => {
    try {
      const values = await formProj.validateFields();
      const payload = {
        project_name: values.projectName,
        demo_link: values.demoLink || undefined,
        started_at: values.startDate
          ? values.startDate.format("YYYY-MM-DD")
          : null,
        end_at: values.endDate ? values.endDate.format("YYYY-MM-DD") : null,
        description: values.description || "",
      };
      if (editingProj && editingProj.id) {
        await updateProject(editingProj.id, payload);
      } else {
        payload.candidate_id = candidate?.id;
        await createProject(payload);
      }
      message.success("Đã lưu dự án");
      setProjModal(false);
      setEditingProj(null);
      formProj.resetFields();
      await reloadSections();
    } catch (err) {
      if (err?.errorFields) return;
      console.error(err);
      message.error("Lưu dự án thất bại");
    }
  };

  const handleSaveCertificate = async () => {
    try {
      const values = await formCert.validateFields();
      const payload = {
        certificate_name: values.certificateName,
        organization: values.organization,
        started_at: values.startDate
          ? values.startDate.format("YYYY-MM-DD")
          : null,
        end_at: values.endDate ? values.endDate.format("YYYY-MM-DD") : null,
        description: values.description || "",
      };
      if (editingCert && editingCert.id) {
        await updateCertificate(editingCert.id, payload);
      } else {
        payload.candidate_id = candidate?.id;
        await createCertificate(payload);
      }
      message.success("Đã lưu chứng chỉ");
      setCertModal(false);
      setEditingCert(null);
      formCert.resetFields();
      await reloadSections();
    } catch (err) {
      if (err?.errorFields) return;
      console.error(err);
      message.error("Lưu chứng chỉ thất bại");
    }
  };

  const handleSaveActivity = async () => {
    try {
      const values = await formAct.validateFields();
      const payload = {
        organization: values.organization,
        role: values.role,
        started_at: values.startDate
          ? values.startDate.format("YYYY-MM-DD")
          : null,
        end_at: values.endDate ? values.endDate.format("YYYY-MM-DD") : null,
        description: values.description || "",
      };
      if (editingAct && editingAct.id) {
        await updateActivity(editingAct.id, payload);
      } else {
        payload.candidate_id = candidate?.id;
        await createActivity(payload);
      }
      message.success("Đã lưu hoạt động");
      setActModal(false);
      setEditingAct(null);
      formAct.resetFields();
      await reloadSections();
    } catch (err) {
      if (err?.errorFields) return;
      console.error(err);
      message.error("Lưu hoạt động thất bại");
    }
  };

  const handleSaveAward = async () => {
    try {
      const values = await formAward.validateFields();
      const payload = {
        title: values.awardName, // Backend expect 'title' not 'award_name'
        organization: values.organization || undefined,
        started_at: values.startDate
          ? values.startDate.format("YYYY-MM-DD")
          : undefined,
        end_at: values.endDate
          ? values.endDate.format("YYYY-MM-DD")
          : undefined,
        description: values.description || undefined,
      };
      console.log("Saving award with payload:", payload);
      console.log("Candidate ID:", candidate?.id);
      if (editingAward && editingAward.id) {
        await updateAward(editingAward.id, payload);
      } else {
        // Backend tự động lấy userId từ token, không cần candidate_id
        console.log("Creating award with full payload:", payload);
        await createAward(payload);
      }
      message.success("Đã lưu danh hiệu/giải thưởng");
      setAwardModal(false);
      setEditingAward(null);
      formAward.resetFields();
      await reloadSections();
    } catch (err) {
      if (err?.errorFields) return;
      console.error("Error saving award:", err);
      if (err?.response?.data) {
        console.error("Backend error response:", err.response.data);
        message.error(
          err.response.data?.error ||
            err.response.data?.message ||
            "Lưu danh hiệu/giải thưởng thất bại"
        );
      } else {
        message.error("Lưu danh hiệu/giải thưởng thất bại");
      }
    }
  };

  const handleSaveSkill = async () => {
    try {
      const values = await formSkill.validateFields();
      const payload = {
        name: values.skillName, // Backend expect 'name' not 'skill_name'
        level: values.level || "",
        description: values.description || "",
      };
      if (editingSkill && editingSkill.id) {
        await updateSkill(editingSkill.id, payload);
      } else {
        // Backend tự động lấy userId từ token, không cần candidate_id
        await createSkill(payload);
      }
      message.success("Đã lưu kỹ năng");
      setSkillModal(false);
      setEditingSkill(null);
      formSkill.resetFields();
      await reloadSections();
    } catch (err) {
      if (err?.errorFields) return;
      console.error(err);
      if (err?.response?.data) {
        console.error("Backend error response:", err.response.data);
        message.error(
          err.response.data?.error ||
            err.response.data?.message ||
            "Lưu kỹ năng thất bại"
        );
      } else {
        message.error("Lưu kỹ năng thất bại");
      }
    }
  };

  const handleSaveReference = async () => {
    try {
      const values = await formRef.validateFields();
      const payload = {
        full_name: values.fullName,
        position: values.position || undefined,
        company: values.company || undefined,
        email: values.email || undefined,
        phone: values.phone || undefined,
        description: values.description || undefined,
      };
      if (editingRef && editingRef.id) {
        await updateReference(editingRef.id, payload);
      } else {
        payload.candidate_id = candidate?.id;
        await createReference(payload);
      }
      message.success("Đã lưu người giới thiệu");
      setRefModal(false);
      setEditingRef(null);
      formRef.resetFields();
      await reloadSections();
    } catch (err) {
      if (err?.errorFields) return;
      console.error(err);
      if (err?.response?.data) {
        console.error("Backend error response:", err.response.data);
        message.error(
          err.response.data?.error ||
            err.response.data?.message ||
            "Lưu người giới thiệu thất bại"
        );
      } else {
        message.error("Lưu người giới thiệu thất bại");
      }
    }
  };

  const handleSaveHobby = async () => {
    try {
      const values = await formHobby.validateFields();
      const payload = {
        name: values.hobbyName, // Backend expect 'name' not 'hobby_name'
        description: values.description || undefined,
      };
      if (editingHobby && editingHobby.id) {
        await updateHobby(editingHobby.id, payload);
      } else {
        // Backend tự động lấy userId từ token, không cần candidate_id
        await createHobby(payload);
      }
      message.success("Đã lưu sở thích");
      setHobbyModal(false);
      setEditingHobby(null);
      formHobby.resetFields();
      await reloadSections();
    } catch (err) {
      if (err?.errorFields) return;
      console.error(err);
      if (err?.response?.data) {
        console.error("Backend error response:", err.response.data);
        message.error(
          err.response.data?.error ||
            err.response.data?.message ||
            "Lưu sở thích thất bại"
        );
      } else {
        message.error("Lưu sở thích thất bại");
      }
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadMyAvatar(file);
      const avatarUrl =
        res?.avatarUrl || res?.url || res?.data?.avatarUrl || res?.data?.url;
      if (avatarUrl) {
        setCandidate((prev) => ({ ...prev, avatar: avatarUrl }));
        message.success("Cập nhật ảnh đại diện thành công");
      } else {
        message.warning("Không nhận được URL ảnh");
      }
    } catch (err) {
      console.error(err);
      message.error("Tải ảnh thất bại");
    } finally {
      e.target.value = "";
    }
  };

  const reloadSections = async () => {
    try {
      const profile = await getMyCandidateProfile();
      const candidateId = profile?.id;
      const [
        eduData,
        expData,
        projData,
        certData,
        actData,
        awardData,
        skillData,
        refData,
        hobbyData,
      ] = await Promise.all([
        getEducationByCandidate(candidateId).catch(() => []),
        getExperienceByCandidate(candidateId).catch(() => []),
        getProjectsByCandidate(candidateId).catch(() => []),
        getCertificatesByCandidate(candidateId).catch(() => []),
        getActivities(candidateId).catch(() => []),
        getAwards().catch(() => []),
        getSkills().catch(() => []),
        getReferences().catch(() => []),
        getHobbies().catch(() => []),
      ]);
      setCandidate(profile);
      // Các bảng CV đã được backend filter theo user hiện tại, dùng trực tiếp
      setEducation(Array.isArray(eduData) ? eduData : []);
      setExperience(Array.isArray(expData) ? expData : []);
      setProjects(Array.isArray(projData) ? projData : []);
      setCertificates(Array.isArray(certData) ? certData : []);
      // Hoạt động đã được backend filter theo user hiện tại, không cần lọc thêm
      setActivities(Array.isArray(actData) ? actData : []);
      setAwards(Array.isArray(awardData) ? awardData : []);
      setSkills(Array.isArray(skillData) ? skillData : []);
      setReferences(Array.isArray(refData) ? refData : []);
      setHobbies(Array.isArray(hobbyData) ? hobbyData : []);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải lại dữ liệu");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const token = getCookie("token") || localStorage.getItem("token");
      if (!token) {
        message.error("Vui lòng đăng nhập");
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        const profile = await getMyCandidateProfile();
        const candidateId = profile?.id;

        const [
          eduData,
          expData,
          projData,
          certData,
          actData,
          awardData,
          skillData,
          refData,
          hobbyData,
        ] = await Promise.all([
          getEducationByCandidate(candidateId).catch(() => []),
          getExperienceByCandidate(candidateId).catch(() => []),
          getProjectsByCandidate(candidateId).catch(() => []),
          getCertificatesByCandidate(candidateId).catch(() => []),
          getActivities(candidateId).catch(() => []),
          getAwards().catch(() => []),
          getSkills().catch(() => []),
          getReferences().catch(() => []),
          getHobbies().catch(() => []),
        ]);

        setCandidate(profile);
        // Các bảng CV đã được backend filter theo user hiện tại, dùng trực tiếp
        setEducation(Array.isArray(eduData) ? eduData : []);
        setExperience(Array.isArray(expData) ? expData : []);
        setProjects(Array.isArray(projData) ? projData : []);
        setCertificates(Array.isArray(certData) ? certData : []);
        // Hoạt động đã được backend filter theo user hiện tại, không cần lọc thêm
        setActivities(Array.isArray(actData) ? actData : []);
        setAwards(Array.isArray(awardData) ? awardData : []);
        setSkills(Array.isArray(skillData) ? skillData : []);
        setReferences(Array.isArray(refData) ? refData : []);
        setHobbies(Array.isArray(hobbyData) ? hobbyData : []);
      } catch (err) {
        console.error(err);
        message.error("Không thể tải CV");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ padding: 50, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div style={{ padding: 50, textAlign: "center" }}>Không tìm thấy CV</div>
    );
  }

  const pickLatestByStartDate = (items) => {
    if (!Array.isArray(items) || items.length === 0) return null;
    return [...items].sort((a, b) => {
      const aStart = a.started_at || a.startDate;
      const bStart = b.started_at || b.startDate;
      const aDate = aStart ? new Date(aStart) : 0;
      const bDate = bStart ? new Date(bStart) : 0;
      return bDate - aDate;
    })[0];
  };

  const latestEducation = pickLatestByStartDate(education);
  const latestExperience = pickLatestByStartDate(experience);
  const latestProject = pickLatestByStartDate(projects);
  const latestActivity = pickLatestByStartDate(activities);
  const latestCertificate = pickLatestByStartDate(certificates);
  const latestAward = pickLatestByStartDate(awards);

  return (
    <div className="cv-wrapper">
      <div className="cv-toolbar">
        <Button onClick={() => setProfileModal(true)}>
          Chỉnh sửa thông tin
        </Button>
        <Button onClick={() => setIntroModal(true)}>Chỉnh sửa mục tiêu</Button>
        <Button
          onClick={() => document.getElementById("avatar-input")?.click()}
        >
          Đổi ảnh
        </Button>
        <input
          type="file"
          id="avatar-input"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleAvatarChange}
        />
        <Button type="primary" onClick={handleDownload}>
          Tải PDF
        </Button>
      </div>

      <div className="cv-sheet" ref={printAreaRef}>
        {/* Header */}
        <div className="cv-header">
          <div className="cv-avatar">
            <img
              src={
                candidate.avatar ||
                "https://res.cloudinary.com/demo/image/upload/v1691500000/sample.jpg"
              }
              alt="avatar"
            />
          </div>
          <div className="cv-summary">
            <Title level={2} className="cv-name">
              {candidate.fullName || candidate.name || "Họ và tên"}
            </Title>
            <Text className="cv-position">
              {candidate.position || "Business Development Executive"}
            </Text>
            <div className="cv-info-grid">
              <div className="cv-info-row">
                <span className="cv-info-label">Ngày sinh:</span>
                <span className="cv-info-value">
                  {candidate.dob
                    ? dayjs(candidate.dob).format("DD/MM/YYYY")
                    : ""}
                </span>
              </div>
              <div className="cv-info-row">
                <span className="cv-info-label">Giới tính:</span>
                <span className="cv-info-value">
                  {candidate.gender === 1
                    ? "Nam"
                    : candidate.gender === 0
                    ? "Nữ"
                    : ""}
                </span>
              </div>
              <div className="cv-info-row">
                <span className="cv-info-label">Số điện thoại:</span>
                <span className="cv-info-value">{candidate.phone || ""}</span>
              </div>
              <div className="cv-info-row">
                <span className="cv-info-label">Email:</span>
                <span className="cv-info-value">{candidate.email || ""}</span>
              </div>
              <div className="cv-info-row">
                <span className="cv-info-label">Website:</span>
                <span className="cv-info-value">
                  {candidate.linkedin || candidate.facebook || ""}
                </span>
              </div>
              <div className="cv-info-row">
                <span className="cv-info-label">Địa chỉ:</span>
                <span className="cv-info-value">
                  {candidate.address || "Chưa cập nhật"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mục tiêu nghề nghiệp */}
        <div className="cv-section">
          <div className="cv-section-title">MỤC TIÊU NGHỀ NGHIỆP</div>
          <Paragraph className="cv-paragraph">
            {candidate.introduction ||
              "Thêm mục tiêu nghề nghiệp của bạn để gây ấn tượng với nhà tuyển dụng."}
          </Paragraph>
        </div>

        {/* Học vấn */}
        <div className="cv-section">
          <div className="cv-section-title">HỌC VẤN</div>
          <div className="cv-entry-actions">
            <Button
              size="small"
              onClick={() => {
                setEditingEdu(null);
                formEdu.resetFields();
                setEduModal(true);
              }}
            >
              Thêm học vấn
            </Button>
          </div>
          {!latestEducation ? (
            <Text type="secondary">Chưa cập nhật</Text>
          ) : (
            <div
              className="cv-entry"
              key={`edu-${
                latestEducation.id || latestEducation.name_education
              }`}
            >
              <div className="cv-entry-time">
                {formatDateRange(
                  latestEducation.started_at || latestEducation.startDate,
                  latestEducation.end_at || latestEducation.endDate
                )}
              </div>
              <div className="cv-entry-body">
                <div className="cv-entry-title">
                  <span className="cv-field-label">Trường:</span>{" "}
                  {latestEducation.name_education || latestEducation.school}
                </div>
                <div className="cv-entry-subtitle">
                  Chuyên ngành: {latestEducation.major || ""}
                </div>
                {latestEducation.info || latestEducation.description ? (
                  <Paragraph className="cv-paragraph">
                    {latestEducation.info || latestEducation.description}
                  </Paragraph>
                ) : null}
                <div className="cv-entry-actions">
                  <Button
                    size="small"
                    type="link"
                    onClick={() => {
                      setEditingEdu(latestEducation);
                      formEdu.setFieldsValue({
                        school:
                          latestEducation.name_education ||
                          latestEducation.school,
                        major: latestEducation.major,
                        startDate: latestEducation.started_at
                          ? dayjs(latestEducation.started_at)
                          : latestEducation.startDate
                          ? dayjs(latestEducation.startDate)
                          : null,
                        endDate: latestEducation.end_at
                          ? dayjs(latestEducation.end_at)
                          : latestEducation.endDate
                          ? dayjs(latestEducation.endDate)
                          : null,
                        description:
                          latestEducation.info || latestEducation.description,
                      });
                      setEduModal(true);
                    }}
                  >
                    Sửa
                  </Button>
                  <Button
                    size="small"
                    type="link"
                    danger
                    onClick={async () => {
                      try {
                        await deleteEducation(latestEducation.id);
                        message.success("Đã xóa");
                        await reloadSections();
                      } catch (err) {
                        message.error("Xóa thất bại");
                      }
                    }}
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Kinh nghiệm làm việc */}
        <div className="cv-section">
          <div className="cv-section-title">KINH NGHIỆM LÀM VIỆC</div>
          <div className="cv-entry-actions">
            <Button
              size="small"
              onClick={() => {
                setEditingExp(null);
                formExp.resetFields();
                setExpModal(true);
              }}
            >
              Thêm kinh nghiệm
            </Button>
          </div>
          {!latestExperience ? (
            <Text type="secondary">Chưa cập nhật</Text>
          ) : (
            <div
              className="cv-entry"
              key={`exp-${latestExperience.id || latestExperience.company}`}
            >
              <div className="cv-entry-time">
                {formatDateRange(
                  latestExperience.started_at || latestExperience.startDate,
                  latestExperience.end_at || latestExperience.endDate
                )}
              </div>
              <div className="cv-entry-body">
                <div className="cv-entry-title">
                  <span className="cv-field-label">Công ty:</span>{" "}
                  {latestExperience.company}
                </div>
                <div className="cv-entry-subtitle">
                  {latestExperience.position || "Vị trí"}
                </div>
                {bulletize(
                  latestExperience.info || latestExperience.description
                ).length > 0 ? (
                  <ul className="cv-bullets">
                    {bulletize(
                      latestExperience.info || latestExperience.description
                    ).map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                ) : null}
                <div className="cv-entry-actions">
                  <Button
                    size="small"
                    type="link"
                    onClick={() => {
                      setEditingExp(latestExperience);
                      formExp.setFieldsValue({
                        position: latestExperience.position,
                        company: latestExperience.company,
                        startDate: latestExperience.started_at
                          ? dayjs(latestExperience.started_at)
                          : latestExperience.startDate
                          ? dayjs(latestExperience.startDate)
                          : null,
                        endDate: latestExperience.end_at
                          ? dayjs(latestExperience.end_at)
                          : latestExperience.endDate
                          ? dayjs(latestExperience.endDate)
                          : null,
                        description:
                          latestExperience.info || latestExperience.description,
                      });
                      setExpModal(true);
                    }}
                  >
                    Sửa
                  </Button>
                  <Button
                    size="small"
                    type="link"
                    danger
                    onClick={async () => {
                      try {
                        await deleteExperience(latestExperience.id);
                        message.success("Đã xóa");
                        await reloadSections();
                      } catch (err) {
                        message.error("Xóa thất bại");
                      }
                    }}
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dự án */}
        <div className="cv-section">
          <div className="cv-section-title">DỰ ÁN</div>
          <div className="cv-entry-actions">
            <Button
              size="small"
              onClick={() => {
                setEditingProj(null);
                formProj.resetFields();
                setProjModal(true);
              }}
            >
              Thêm dự án
            </Button>
          </div>
          {!latestProject ? (
            <Text type="secondary">Chưa cập nhật</Text>
          ) : (
            <div
              className="cv-entry"
              key={`proj-${latestProject.id || latestProject.project_name}`}
            >
              <div className="cv-entry-time">
                {formatDateRange(
                  latestProject.started_at || latestProject.startDate,
                  latestProject.end_at || latestProject.endDate
                )}
              </div>
              <div className="cv-entry-body">
                <div className="cv-entry-title">
                  <span className="cv-field-label">Dự án:</span>{" "}
                  {latestProject.project_name || latestProject.projectName}
                </div>
                {latestProject.demo_link || latestProject.demoLink ? (
                  <div className="cv-entry-link">
                    Link: {latestProject.demo_link || latestProject.demoLink}
                  </div>
                ) : null}
                {latestProject.description ? (
                  <Paragraph className="cv-paragraph">
                    {latestProject.description}
                  </Paragraph>
                ) : null}
                <div className="cv-entry-actions">
                  <Button
                    size="small"
                    type="link"
                    onClick={() => {
                      setEditingProj(latestProject);
                      formProj.setFieldsValue({
                        projectName:
                          latestProject.project_name ||
                          latestProject.projectName,
                        demoLink:
                          latestProject.demo_link || latestProject.demoLink,
                        startDate: latestProject.started_at
                          ? dayjs(latestProject.started_at)
                          : latestProject.startDate
                          ? dayjs(latestProject.startDate)
                          : null,
                        endDate: latestProject.end_at
                          ? dayjs(latestProject.end_at)
                          : latestProject.endDate
                          ? dayjs(latestProject.endDate)
                          : null,
                        description: latestProject.description,
                      });
                      setProjModal(true);
                    }}
                  >
                    Sửa
                  </Button>
                  <Button
                    size="small"
                    type="link"
                    danger
                    onClick={async () => {
                      try {
                        await deleteProject(latestProject.id);
                        message.success("Đã xóa");
                        await reloadSections();
                      } catch (err) {
                        message.error("Xóa thất bại");
                      }
                    }}
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hoạt động */}
        <div className="cv-section">
          <div className="cv-section-title">HOẠT ĐỘNG</div>
          <div className="cv-entry-actions">
            <Button
              size="small"
              onClick={() => {
                setEditingAct(null);
                formAct.resetFields();
                setActModal(true);
              }}
            >
              Thêm hoạt động
            </Button>
          </div>
          {!latestActivity ? (
            <Text type="secondary">Chưa cập nhật</Text>
          ) : (
            <div
              className="cv-entry"
              key={`act-${latestActivity.id || latestActivity.organization}`}
            >
              <div className="cv-entry-time">
                {formatDateRange(
                  latestActivity.started_at || latestActivity.startDate,
                  latestActivity.end_at || latestActivity.endDate
                )}
              </div>
              <div className="cv-entry-body">
                <div className="cv-entry-title">
                  <span className="cv-field-label">Tổ chức:</span>{" "}
                  {latestActivity.organization || "Tổ chức"}
                </div>
                {latestActivity.role ? (
                  <div className="cv-entry-subtitle">{latestActivity.role}</div>
                ) : null}
                {latestActivity.description ? (
                  <Paragraph className="cv-paragraph">
                    {latestActivity.description}
                  </Paragraph>
                ) : null}
                <div className="cv-entry-actions">
                  <Button
                    size="small"
                    type="link"
                    onClick={() => {
                      setEditingAct(latestActivity);
                      formAct.setFieldsValue({
                        organization: latestActivity.organization,
                        role: latestActivity.role,
                        startDate: latestActivity.started_at
                          ? dayjs(latestActivity.started_at)
                          : latestActivity.startDate
                          ? dayjs(latestActivity.startDate)
                          : null,
                        endDate: latestActivity.end_at
                          ? dayjs(latestActivity.end_at)
                          : latestActivity.endDate
                          ? dayjs(latestActivity.endDate)
                          : null,
                        description: latestActivity.description,
                      });
                      setActModal(true);
                    }}
                  >
                    Sửa
                  </Button>
                  <Button
                    size="small"
                    type="link"
                    danger
                    onClick={async () => {
                      try {
                        await deleteActivity(latestActivity.id);
                        message.success("Đã xóa");
                        await reloadSections();
                      } catch (err) {
                        message.error("Xóa thất bại");
                      }
                    }}
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="cv-section">
          <div className="cv-section-title">CHỨNG CHỈ</div>
          <div className="cv-entry-actions">
            <Button
              size="small"
              onClick={() => {
                setEditingCert(null);
                formCert.resetFields();
                setCertModal(true);
              }}
            >
              Thêm chứng chỉ
            </Button>
          </div>
          {!latestCertificate ? (
            <Text type="secondary">Chưa cập nhật</Text>
          ) : (
            <div
              className="cv-entry"
              key={`cert-${
                latestCertificate.id || latestCertificate.certificate_name
              }`}
            >
              <div className="cv-entry-time">
                {formatDateRange(
                  latestCertificate.started_at || latestCertificate.startDate,
                  latestCertificate.end_at || latestCertificate.endDate
                )}
              </div>
              <div className="cv-entry-body">
                <div className="cv-entry-title">
                  <span className="cv-field-label">Chứng chỉ:</span>{" "}
                  {latestCertificate.certificate_name ||
                    latestCertificate.certificateName}
                </div>
                {latestCertificate.organization ? (
                  <div className="cv-entry-subtitle">
                    {latestCertificate.organization}
                  </div>
                ) : null}
                {latestCertificate.description ? (
                  <Paragraph className="cv-paragraph">
                    {latestCertificate.description}
                  </Paragraph>
                ) : null}
                <div className="cv-entry-actions">
                  <Button
                    size="small"
                    type="link"
                    onClick={() => {
                      setEditingCert(latestCertificate);
                      formCert.setFieldsValue({
                        certificateName:
                          latestCertificate.certificate_name ||
                          latestCertificate.certificateName,
                        organization: latestCertificate.organization,
                        startDate: latestCertificate.started_at
                          ? dayjs(latestCertificate.started_at)
                          : latestCertificate.startDate
                          ? dayjs(latestCertificate.startDate)
                          : null,
                        endDate: latestCertificate.end_at
                          ? dayjs(latestCertificate.end_at)
                          : latestCertificate.endDate
                          ? dayjs(latestCertificate.endDate)
                          : null,
                        description: latestCertificate.description,
                      });
                      setCertModal(true);
                    }}
                  >
                    Sửa
                  </Button>
                  <Button
                    size="small"
                    type="link"
                    danger
                    onClick={async () => {
                      try {
                        await deleteCertificate(latestCertificate.id);
                        message.success("Đã xóa");
                        await reloadSections();
                      } catch (err) {
                        message.error("Xóa thất bại");
                      }
                    }}
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Danh hiệu & Giải thưởng */}
        <div className="cv-section">
          <div className="cv-section-title">DANH HIỆU VÀ GIẢI THƯỞNG</div>
          <div className="cv-entry-actions">
            <Button
              size="small"
              onClick={() => {
                setEditingAward(null);
                formAward.resetFields();
                setAwardModal(true);
              }}
            >
              Thêm danh hiệu/giải thưởng
            </Button>
          </div>
          {!latestAward ? (
            <Text type="secondary">Chưa cập nhật</Text>
          ) : (
            <div
              className="cv-entry"
              key={`award-${latestAward.id || latestAward.award_name}`}
            >
              <div className="cv-entry-time">
                {formatDateRange(
                  latestAward.started_at || latestAward.startDate,
                  latestAward.end_at || latestAward.endDate
                )}
              </div>
              <div className="cv-entry-body">
                <div className="cv-entry-title">
                  <span className="cv-field-label">Danh hiệu/Giải thưởng:</span>{" "}
                  {latestAward.title ||
                    latestAward.award_name ||
                    latestAward.awardName}
                </div>
                {latestAward.organization ? (
                  <div className="cv-entry-subtitle">
                    {latestAward.organization}
                  </div>
                ) : null}
                {latestAward.description ? (
                  <Paragraph className="cv-paragraph">
                    {latestAward.description}
                  </Paragraph>
                ) : null}
                <div className="cv-entry-actions">
                  <Button
                    size="small"
                    type="link"
                    onClick={() => {
                      setEditingAward(latestAward);
                      formAward.setFieldsValue({
                        awardName:
                          latestAward.title ||
                          latestAward.award_name ||
                          latestAward.awardName,
                        organization: latestAward.organization,
                        startDate: latestAward.started_at
                          ? dayjs(latestAward.started_at)
                          : latestAward.startDate
                          ? dayjs(latestAward.startDate)
                          : null,
                        endDate: latestAward.end_at
                          ? dayjs(latestAward.end_at)
                          : latestAward.endDate
                          ? dayjs(latestAward.endDate)
                          : null,
                        description: latestAward.description,
                      });
                      setAwardModal(true);
                    }}
                  >
                    Sửa
                  </Button>
                  <Button
                    size="small"
                    type="link"
                    danger
                    onClick={async () => {
                      try {
                        await deleteAward(latestAward.id);
                        message.success("Đã xóa");
                        await reloadSections();
                      } catch (err) {
                        message.error("Xóa thất bại");
                      }
                    }}
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Kỹ năng */}
        <div className="cv-section">
          <div className="cv-section-title">KỸ NĂNG</div>
          <div className="cv-entry-actions">
            <Button
              size="small"
              onClick={() => {
                setEditingSkill(null);
                formSkill.resetFields();
                setSkillModal(true);
              }}
            >
              Thêm kỹ năng
            </Button>
          </div>
          {skills.length === 0 ? (
            <Text type="secondary">Chưa cập nhật</Text>
          ) : (
            <div>
              {skills.map((skill) => (
                <div
                  className="cv-entry"
                  key={`skill-${skill.id || skill.skill_name}`}
                >
                  <div className="cv-entry-body">
                    <div className="cv-entry-title">
                      <span className="cv-field-label">Kỹ năng:</span>{" "}
                      {skill.name || skill.skill_name || skill.skillName}
                    </div>
                    {skill.level ? (
                      <div className="cv-entry-subtitle">
                        Mức độ: {skill.level}
                      </div>
                    ) : null}
                    {skill.description ? (
                      <Paragraph className="cv-paragraph">
                        {skill.description}
                      </Paragraph>
                    ) : null}
                    <div className="cv-entry-actions">
                      <Button
                        size="small"
                        type="link"
                        onClick={() => {
                          setEditingSkill(skill);
                          formSkill.setFieldsValue({
                            skillName:
                              skill.name || skill.skill_name || skill.skillName,
                            level: skill.level,
                            description: skill.description,
                          });
                          setSkillModal(true);
                        }}
                      >
                        Sửa
                      </Button>
                      <Button
                        size="small"
                        type="link"
                        danger
                        onClick={async () => {
                          try {
                            await deleteSkill(skill.id);
                            message.success("Đã xóa");
                            await reloadSections();
                          } catch (err) {
                            message.error("Xóa thất bại");
                          }
                        }}
                      >
                        Xóa
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Người giới thiệu */}
        <div className="cv-section">
          <div className="cv-section-title">NGƯỜI GIỚI THIỆU</div>
          <div className="cv-entry-actions">
            <Button
              size="small"
              onClick={() => {
                setEditingRef(null);
                formRef.resetFields();
                setRefModal(true);
              }}
            >
              Thêm người giới thiệu
            </Button>
          </div>
          {references.length === 0 ? (
            <Text type="secondary">Chưa cập nhật</Text>
          ) : (
            <div>
              {references.map((ref) => (
                <div
                  className="cv-entry"
                  key={`ref-${ref.id || ref.full_name}`}
                >
                  <div className="cv-entry-body">
                    <div className="cv-entry-title">
                      <span className="cv-field-label">Tên:</span>{" "}
                      {ref.full_name || ref.fullName || ref.name}
                    </div>
                    {ref.position ? (
                      <div className="cv-entry-subtitle">
                        Vị trí: {ref.position}
                      </div>
                    ) : null}
                    {ref.company ? (
                      <div className="cv-entry-subtitle">
                        Công ty: {ref.company}
                      </div>
                    ) : null}
                    {ref.email ? (
                      <div className="cv-entry-subtitle">
                        Email: {ref.email}
                      </div>
                    ) : null}
                    {ref.phone ? (
                      <div className="cv-entry-subtitle">
                        Điện thoại: {ref.phone}
                      </div>
                    ) : null}
                    {ref.description ? (
                      <Paragraph className="cv-paragraph">
                        {ref.description}
                      </Paragraph>
                    ) : null}
                    <div className="cv-entry-actions">
                      <Button
                        size="small"
                        type="link"
                        onClick={() => {
                          setEditingRef(ref);
                          formRef.setFieldsValue({
                            fullName: ref.full_name || ref.fullName || ref.name,
                            position: ref.position || "",
                            company: ref.company || "",
                            email: ref.email || "",
                            phone: ref.phone || "",
                            description: ref.description || "",
                          });
                          setRefModal(true);
                        }}
                      >
                        Sửa
                      </Button>
                      <Button
                        size="small"
                        type="link"
                        danger
                        onClick={async () => {
                          try {
                            await deleteReference(ref.id);
                            message.success("Đã xóa");
                            await reloadSections();
                          } catch (err) {
                            message.error("Xóa thất bại");
                          }
                        }}
                      >
                        Xóa
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sở thích */}
        <div className="cv-section">
          <div className="cv-section-title">SỞ THÍCH</div>
          <div className="cv-entry-actions">
            <Button
              size="small"
              onClick={() => {
                setEditingHobby(null);
                formHobby.resetFields();
                setHobbyModal(true);
              }}
            >
              Thêm sở thích
            </Button>
          </div>
          {hobbies.length === 0 ? (
            <Text type="secondary">Chưa cập nhật</Text>
          ) : (
            <div>
              {hobbies.map((hobby) => (
                <div
                  className="cv-entry"
                  key={`hobby-${hobby.id || hobby.hobby_name}`}
                >
                  <div className="cv-entry-body">
                    <div className="cv-entry-title">
                      <span className="cv-field-label">Sở thích:</span>{" "}
                      {hobby.name || hobby.hobby_name || hobby.hobbyName}
                    </div>
                    {hobby.description ? (
                      <Paragraph className="cv-paragraph">
                        {hobby.description}
                      </Paragraph>
                    ) : null}
                    <div className="cv-entry-actions">
                      <Button
                        size="small"
                        type="link"
                        onClick={() => {
                          setEditingHobby(hobby);
                          formHobby.setFieldsValue({
                            hobbyName:
                              hobby.name || hobby.hobby_name || hobby.hobbyName,
                            description: hobby.description,
                          });
                          setHobbyModal(true);
                        }}
                      >
                        Sửa
                      </Button>
                      <Button
                        size="small"
                        type="link"
                        danger
                        onClick={async () => {
                          try {
                            await deleteHobby(hobby.id);
                            message.success("Đã xóa");
                            await reloadSections();
                          } catch (err) {
                            message.error("Xóa thất bại");
                          }
                        }}
                      >
                        Xóa
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals for sections */}
      <Modal
        title={editingEdu ? "Sửa học vấn" : "Thêm học vấn"}
        open={eduModal}
        onCancel={() => {
          setEduModal(false);
          setEditingEdu(null);
          formEdu.resetFields();
        }}
        onOk={handleSaveEducation}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form layout="vertical" form={formEdu}>
          <Form.Item
            label="Trường"
            name="school"
            rules={[{ required: true, message: "Nhập tên trường" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Chuyên ngành"
            name="major"
            rules={[{ required: true, message: "Nhập chuyên ngành" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Thời gian">
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item
                  name="startDate"
                  noStyle
                  rules={[{ required: true, message: "Chọn ngày bắt đầu" }]}
                >
                  <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="endDate"
                  noStyle
                  rules={[{ required: true, message: "Chọn ngày kết thúc" }]}
                >
                  <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingExp ? "Sửa kinh nghiệm" : "Thêm kinh nghiệm"}
        open={expModal}
        onCancel={() => {
          setExpModal(false);
          setEditingExp(null);
          formExp.resetFields();
        }}
        onOk={handleSaveExperience}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form layout="vertical" form={formExp}>
          <Form.Item
            label="Vị trí"
            name="position"
            rules={[{ required: true, message: "Nhập vị trí" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Công ty"
            name="company"
            rules={[{ required: true, message: "Nhập công ty" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Thời gian">
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item
                  name="startDate"
                  noStyle
                  rules={[{ required: true, message: "Chọn ngày bắt đầu" }]}
                >
                  <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="endDate"
                  noStyle
                  rules={[{ required: true, message: "Chọn ngày kết thúc" }]}
                >
                  <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>
          <Form.Item label="Mô tả chi tiết" name="description">
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingProj ? "Sửa dự án" : "Thêm dự án"}
        open={projModal}
        onCancel={() => {
          setProjModal(false);
          setEditingProj(null);
          formProj.resetFields();
        }}
        onOk={handleSaveProject}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form layout="vertical" form={formProj}>
          <Form.Item
            label="Tên dự án"
            name="projectName"
            rules={[{ required: true, message: "Nhập tên dự án" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Link demo" name="demoLink">
            <Input />
          </Form.Item>
          <Form.Item label="Thời gian">
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item
                  name="startDate"
                  noStyle
                  rules={[{ required: true, message: "Chọn ngày bắt đầu" }]}
                >
                  <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="endDate"
                  noStyle
                  rules={[{ required: true, message: "Chọn ngày kết thúc" }]}
                >
                  <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingCert ? "Sửa chứng chỉ" : "Thêm chứng chỉ"}
        open={certModal}
        onCancel={() => {
          setCertModal(false);
          setEditingCert(null);
          formCert.resetFields();
        }}
        onOk={handleSaveCertificate}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form layout="vertical" form={formCert}>
          <Form.Item
            label="Tên chứng chỉ"
            name="certificateName"
            rules={[{ required: true, message: "Nhập tên chứng chỉ" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Tổ chức"
            name="organization"
            rules={[{ required: true, message: "Nhập tổ chức" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Thời gian">
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item
                  name="startDate"
                  noStyle
                  rules={[{ required: true, message: "Chọn ngày bắt đầu" }]}
                >
                  <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="endDate"
                  noStyle
                  rules={[{ required: true, message: "Chọn ngày kết thúc" }]}
                >
                  <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingAct ? "Sửa hoạt động" : "Thêm hoạt động"}
        open={actModal}
        onCancel={() => {
          setActModal(false);
          setEditingAct(null);
          formAct.resetFields();
        }}
        onOk={handleSaveActivity}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form layout="vertical" form={formAct}>
          <Form.Item
            label="Tổ chức"
            name="organization"
            rules={[{ required: true, message: "Nhập tổ chức" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Vai trò" name="role">
            <Input />
          </Form.Item>
          <Form.Item label="Thời gian">
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item
                  name="startDate"
                  noStyle
                  rules={[{ required: true, message: "Chọn ngày bắt đầu" }]}
                >
                  <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="endDate"
                  noStyle
                  rules={[{ required: true, message: "Chọn ngày kết thúc" }]}
                >
                  <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          editingAward
            ? "Sửa danh hiệu/giải thưởng"
            : "Thêm danh hiệu/giải thưởng"
        }
        open={awardModal}
        onCancel={() => {
          setAwardModal(false);
          setEditingAward(null);
          formAward.resetFields();
        }}
        onOk={handleSaveAward}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form layout="vertical" form={formAward}>
          <Form.Item
            label="Tên danh hiệu/giải thưởng"
            name="awardName"
            rules={[
              { required: true, message: "Nhập tên danh hiệu/giải thưởng" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Tổ chức"
            name="organization"
            rules={[{ required: true, message: "Nhập tổ chức" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Thời gian">
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item
                  name="startDate"
                  noStyle
                  rules={[{ required: true, message: "Chọn ngày bắt đầu" }]}
                >
                  <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="endDate" noStyle>
                  <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingSkill ? "Sửa kỹ năng" : "Thêm kỹ năng"}
        open={skillModal}
        onCancel={() => {
          setSkillModal(false);
          setEditingSkill(null);
          formSkill.resetFields();
        }}
        onOk={handleSaveSkill}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form layout="vertical" form={formSkill}>
          <Form.Item
            label="Tên kỹ năng"
            name="skillName"
            rules={[{ required: true, message: "Nhập tên kỹ năng" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Mức độ" name="level">
            <Select placeholder="Chọn mức độ">
              <Select.Option value="Cơ bản">Cơ bản</Select.Option>
              <Select.Option value="Trung bình">Trung bình</Select.Option>
              <Select.Option value="Khá">Khá</Select.Option>
              <Select.Option value="Tốt">Tốt</Select.Option>
              <Select.Option value="Xuất sắc">Xuất sắc</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingRef ? "Sửa người giới thiệu" : "Thêm người giới thiệu"}
        open={refModal}
        onCancel={() => {
          setRefModal(false);
          setEditingRef(null);
          formRef.resetFields();
        }}
        onOk={handleSaveReference}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form layout="vertical" form={formRef}>
          <Form.Item
            label="Họ và tên"
            name="fullName"
            rules={[{ required: true, message: "Nhập họ và tên" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Vị trí" name="position">
            <Input />
          </Form.Item>
          <Form.Item label="Công ty" name="company">
            <Input />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ type: "email", message: "Email không hợp lệ" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Điện thoại" name="phone">
            <Input />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingHobby ? "Sửa sở thích" : "Thêm sở thích"}
        open={hobbyModal}
        onCancel={() => {
          setHobbyModal(false);
          setEditingHobby(null);
          formHobby.resetFields();
        }}
        onOk={handleSaveHobby}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form layout="vertical" form={formHobby}>
          <Form.Item
            label="Tên sở thích"
            name="hobbyName"
            rules={[{ required: true, message: "Nhập tên sở thích" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal chỉnh thông tin */}
      <Modal
        title="Chỉnh sửa thông tin cá nhân"
        open={profileModal}
        onCancel={() => setProfileModal(false)}
        onOk={handleSaveProfile}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form
          layout="vertical"
          form={formProfile}
          initialValues={{
            fullName: candidate.fullName || candidate.name,
            position: candidate.position,
            address: candidate.address,
            email: candidate.email,
            phone: candidate.phone,
            dob: candidate.dob ? dayjs(candidate.dob) : null,
            gender: candidate.gender,
          }}
        >
          <Form.Item
            label="Họ tên"
            name="fullName"
            rules={[{ required: true, message: "Nhập họ tên" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Chức danh" name="position">
            <Input />
          </Form.Item>
          <Form.Item label="Địa chỉ" name="address">
            <Input />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ type: "email", message: "Email không hợp lệ" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Số điện thoại" name="phone">
            <Input />
          </Form.Item>
          <Form.Item label="Ngày sinh" name="dob">
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Giới tính" name="gender">
            <Select allowClear>
              <Select.Option value={1}>Nam</Select.Option>
              <Select.Option value={0}>Nữ</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal chỉnh mục tiêu */}
      <Modal
        title="Chỉnh sửa mục tiêu"
        open={introModal}
        onCancel={() => setIntroModal(false)}
        onOk={handleSaveIntro}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form
          layout="vertical"
          form={formIntro}
          initialValues={{
            introduction: candidate.introduction,
          }}
        >
          <Form.Item
            label="Mục tiêu nghề nghiệp"
            name="introduction"
            rules={[{ required: true, message: "Nhập mục tiêu" }]}
          >
            <TextArea rows={6} placeholder="Mục tiêu nghề nghiệp của bạn..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default CVPage;
