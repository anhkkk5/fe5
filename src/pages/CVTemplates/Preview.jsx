import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Typography, Row, Col, Tag, Avatar, Upload, Button, message, Space } from "antd";
import { getMyCandidateProfile, updateMyCandidateProfile, uploadMyAvatar } from "../../services/Candidates/candidatesServices";
import { getEducationByCandidate } from "../../services/educationServices/educationServices";
import { getExperienceByCandidate } from "../../services/Experience/ExperienceServices";
import { getProjectsByCandidate } from "../../services/project/ProjectServices";
import { getCertificatesByCandidate } from "../../services/Certificates/CertificatesServices";
import { getActivities } from "../../services/Activities/ActivitiesServices";
import { UploadOutlined, CheckCircleTwoTone } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

function ClassicTemplate({ data, education = [], experience = [], projects = [], certificates = [], activities = [] }) {
  const PI = [
    { label: "Ngày sinh", value: data.dob || data.dateOfBirth || "06/12/1998" },
    { label: "Giới tính", value: data.gender === 1 ? "Nam" : data.gender === 0 ? "Nữ" : "Nam" },
    { label: "Số điện thoại", value: data.phone || "0123456789" },
    { label: "Email", value: data.email || "emailcuaban@mail.vn" },
    { label: "Website", value: data.website || "linkedin.com/in/profile" },
    { label: "Địa chỉ", value: data.address || "Hà Nội" },
  ];

  return (
    <Card style={{ borderTop: "6px solid #22c55e", padding: 24 }}>
      <style>{`
        .cv-classic h4 { font-weight: 700; margin: 18px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #111; }
        .cv-classic .row { display: grid; grid-template-columns: 140px 1fr; gap: 16px; }
        .cv-classic .muted { color: #555; }
        .cv-classic .line { height: 1px; background:#e5e7eb; margin: 8px 0; }
        .cv-classic .entry { display:grid; grid-template-columns: 140px 1fr; gap:16px; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
        .cv-classic .entry:last-child { border-bottom: none; }
        .cv-classic ul { margin: 6px 0 0 18px; }
        .cv-classic li { margin: 2px 0; }
      `}</style>
      <div className="cv-classic">
        {/* Header with avatar and personal info */}
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 16, alignItems: "start" }}>
          <Avatar shape="square" size={120} src={data.avatar || data.photoUrl} style={{ borderRadius: 8 }} />
          <div>
            <Title level={2} style={{ margin: 0 }}>{data.fullName || "Lê Quang Dũng"}</Title>
            <Text className="muted">{data.title || "Business Development Executive"}</Text>
            <div className="line" />
            <div className="row">
              <div className="muted">Ngày sinh:</div>
              <div>{PI[0].value}</div>
              <div className="muted">Giới tính:</div>
              <div>{PI[1].value}</div>
              <div className="muted">Số điện thoại:</div>
              <div>{PI[2].value}</div>
              <div className="muted">Email:</div>
              <div>{PI[3].value}</div>
              <div className="muted">Website:</div>
              <div>{PI[4].value}</div>
              <div className="muted">Địa chỉ:</div>
              <div>{PI[5].value}</div>
            </div>
          </div>
        </div>

        {/* Objective */}
        <h4>MỤC TIÊU NGHỀ NGHIỆP</h4>
        <Paragraph>
          {data.introduction ||
            "Với hơn 4 năm kinh nghiệm công tác ở vị trí Nhân viên phát triển kinh doanh tại các doanh nghiệp lớn trong và ngoài nước, tôi có khả năng xây dựng, phát triển chiến lược kinh doanh và mở rộng mạng lưới khách hàng tiềm năng. Trong năm 2024, tôi đã đóng góp vào việc tăng trưởng 15% doanh thu của Công ty TNHH ABC khi hoàn thành 120% KPI trong 4 tháng liên tiếp. Mục tiêu của tôi trong 2 năm tới là trở thành Trưởng nhóm Phát triển kinh doanh, dẫn dắt đội ngũ hoàn thành các mục tiêu chiến lược của Quý công ty."}
        </Paragraph>

        {/* Education - from real data */}
        <h4>HỌC VẤN</h4>
        {(education || []).length === 0 && (
          <Paragraph className="muted">Chưa cập nhật học vấn</Paragraph>
        )}
        {(education || []).map((ed) => (
          <div className="entry" key={ed.id}>
            <div className="muted">
              {(ed.started_at || ed.startDate || "")} - {(ed.end_at || ed.endDate || "Hiện tại")}
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{ed.name_education || ed.school}</div>
              <div style={{ marginTop: 4 }}>{ed.major}</div>
              {ed.info || ed.description ? (
                <Paragraph style={{ marginTop: 4 }}>{ed.info || ed.description}</Paragraph>
              ) : null}
            </div>
          </div>
        ))}

        {/* Experience - from real data */}
        <h4>KINH NGHIỆM LÀM VIỆC</h4>
        {(experience || []).length === 0 && (
          <Paragraph className="muted">Chưa cập nhật kinh nghiệm</Paragraph>
        )}
        {(experience || []).map((ex) => (
          <div className="entry" key={ex.id}>
            <div className="muted">
              {(ex.started_at || ex.startDate || "")} - {(ex.end_at || ex.endDate || "Hiện tại")}
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{ex.company}</div>
              <div style={{ fontWeight: 600 }}>{ex.position}</div>
              {ex.info || ex.description ? (
                <Paragraph style={{ marginTop: 4 }}>{ex.info || ex.description}</Paragraph>
              ) : null}
            </div>
          </div>
        ))}

        {/* Projects - from real data */}
        <h4>DỰ ÁN</h4>
        {(projects || []).length === 0 && (
          <Paragraph className="muted">Chưa cập nhật dự án</Paragraph>
        )}
        {(projects || []).map((prj) => (
          <div className="entry" key={prj.id}>
            <div className="muted">
              {(prj.started_at || prj.startDate || "")} - {(prj.end_at || prj.endDate || "Hiện tại")}
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{prj.project_name || prj.projectName}</div>
              {prj.demo_link && (
                <div style={{ marginTop: 4 }}>Link demo: {prj.demo_link}</div>
              )}
              {prj.description ? (
                <Paragraph style={{ marginTop: 4 }}>{prj.description}</Paragraph>
              ) : null}
            </div>
          </div>
        ))}

        {/* Certificates - from real data */}
        <h4>CHỨNG CHỈ</h4>
        {(certificates || []).length === 0 && (
          <Paragraph className="muted">Chưa cập nhật chứng chỉ</Paragraph>
        )}
        {(certificates || []).map((cer) => (
          <div className="entry" key={cer.id}>
            <div className="muted">
              {(cer.started_at || cer.startDate || "")} - {(cer.end_at || cer.endDate || "")}
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{cer.certificate_name || cer.certificateName}</div>
              {cer.organization && <div>{cer.organization}</div>}
              {cer.description && <Paragraph style={{ marginTop: 4 }}>{cer.description}</Paragraph>}
            </div>
          </div>
        ))}

        {/* Activities - from real data */}
        <h4>HOẠT ĐỘNG</h4>
        {(activities || []).length === 0 && (
          <Paragraph className="muted">Chưa cập nhật hoạt động</Paragraph>
        )}
        {(activities || []).map((act) => (
          <div className="entry" key={act.id}>
            <div className="muted">
              {(act.started_at || act.startDate || "")} - {(act.end_at || act.endDate || "Hiện tại")}
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{act.organization}</div>
              {act.role && <div style={{ fontWeight: 500 }}>{act.role}</div>}
              {act.description && (
                <Paragraph style={{ marginTop: 4 }}>{act.description}</Paragraph>
              )}
              {Array.isArray(act.bullets) && act.bullets.length > 0 && (
                <ul>
                  {act.bullets.map((b, idx) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ModernTemplate({ data }) {
  return (
    <Card style={{ borderTop: "6px solid #ef4444" }}>
      <Row gutter={16}>
        <Col span={8}>
          <Title level={3} style={{ marginBottom: 8 }}>{data.fullName || "Họ và tên"}</Title>
          <div><Text>{data.email}</Text></div>
          <div><Text>{data.phone}</Text></div>
          <div><Text>{data.address}</Text></div>
          <div style={{ marginTop: 12 }}>
            <Tag color="geekblue">React</Tag>
            <Tag color="geekblue">Node</Tag>
          </div>
        </Col>
        <Col span={16}>
          <Title level={4} style={{ marginTop: 0 }}>Tóm tắt</Title>
          <Paragraph>{data.introduction || "Tóm tắt kinh nghiệm, kỹ năng nổi bật..."}</Paragraph>
          <Title level={4}>Kinh nghiệm</Title>
          <Paragraph>Ví dụ: Công ty - Vị trí - Mô tả</Paragraph>
          <Title level={4}>Dự án</Title>
          <Paragraph>Ví dụ: Tên dự án - Link - Mô tả</Paragraph>
        </Col>
      </Row>
    </Card>
  );
}

function ElegantTemplate({ data }) {
  return (
    <Card style={{ borderTop: "6px solid #10b981" }}>
      <Title level={2} style={{ letterSpacing: 1 }}>{data.fullName || "Họ và tên"}</Title>
      <Text strong>{data.title || "Chức danh"}</Text>
      <Paragraph style={{ marginTop: 12 }}>{data.introduction || "Giới thiệu bản thân ngắn gọn..."}</Paragraph>
      <Row gutter={16}>
        <Col span={12}>
          <Title level={4}>Học vấn</Title>
          <Paragraph>...</Paragraph>
        </Col>
        <Col span={12}>
          <Title level={4}>Kỹ năng</Title>
          <Paragraph>React, Node, SQL...</Paragraph>
        </Col>
      </Row>
    </Card>
  );
}

const components = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  elegant: ElegantTemplate,
};

export default function CVTemplatePreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState({});
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await getMyCandidateProfile();
        setData(me || {});
        setAvatarUrl(me?.avatar || me?.photoUrl || "");
      } catch (_) {
        setData({});
      }
    };
    load();
  }, []);

  const Comp = components[id] || ClassicTemplate;

  const beforeUpload = async (file) => {
    const isImg = file.type.startsWith("image/");
    if (!isImg) {
      message.error("Vui lòng chọn file ảnh");
      return Upload.LIST_IGNORE;
    }
    try {
      const res = await uploadMyAvatar(file);
      const url = res?.avatarUrl || res?.url || res?.data?.avatarUrl;
      if (url) {
        setAvatarUrl(url);
        // avatar chung của hồ sơ đã được cập nhật trên backend
      }
    } catch (e) {
      message.error("Không thể đọc ảnh");
    }
    return Upload.LIST_IGNORE;
  };

  const handleUseTemplate = async () => {
    try {
      setSaving(true);
      await updateMyCandidateProfile({ templateId: id });
      message.success("Đã áp dụng mẫu");
      navigate("/cv");
    } catch (e) {
      message.error("Không lưu được mẫu, thử lại sau");
    } finally {
      setSaving(false);
    }
  };

  // inject avatarUrl into data for preview
  const previewData = { ...data, avatar: avatarUrl || data.avatar };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Xem trước mẫu: {id}</Title>
        <Space>
          <Upload showUploadList={false} beforeUpload={beforeUpload} accept="image/*">
            <Button icon={<UploadOutlined />}>Tải ảnh đại diện</Button>
          </Upload>
          <Button type="primary" icon={<CheckCircleTwoTone twoToneColor="#fff" />} loading={saving} onClick={handleUseTemplate}>
            Dùng mẫu này
          </Button>
        </Space>
      </div>
      <Comp data={previewData} />
    </div>
  );
}
