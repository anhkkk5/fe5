import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  message,
  Breadcrumb,
  Row,
  Col,
} from "antd";
import { getCookie } from "../../helpers/cookie";
import { createJob } from "../../services/jobServices/jobServices";
import { getLocation } from "../../services/getAllLocation/locationServices";
import { getMyCompany } from "../../services/getAllCompany/companyServices";
import { getMyStars } from "../../services/stars/starsServices";
import dayjs from "dayjs";
import "./style.css";

const { TextArea } = Input;
const { RangePicker } = DatePicker;
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

function CreateJob() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const companyId = getCookie("companyId") || getCookie("id");
  const companyName = getCookie("companyName") || "";
  const [locations, setLocations] = useState([]);
  const [postCost, setPostCost] = useState(4);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const data = await getLocation();
        setLocations(Array.isArray(data) ? data : []);
      } catch (e) {
        setLocations([]);
      }
    };
    fetchLocations();
  }, []);

  useEffect(() => {
    const fetchCost = async () => {
      try {
        const company = await getMyCompany();
        const isPremium = !!company?.isPremium;
        setPostCost(isPremium ? 2 : 4);
        return;
      } catch (_e) {
        try {
          const starsInfo = await getMyStars();
          const isPremium = !!starsInfo?.isPremium;
          setPostCost(isPremium ? 2 : 4);
        } catch (_e2) {
          setPostCost(4);
        }
      }
    };
    fetchCost();
  }, []);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const selectedLocation = locations.find(
        (loc) => String(loc.id) === String(values.location)
      );

      const jobData = {
        title: values.title,
        description: values.description,
        company: companyName,
        salary: values.salary,
        // lưu tên city để FE dễ hiển thị fallback, đồng thời gán location_id đúng ID
        location: selectedLocation?.name || selectedLocation?.city || undefined,
        location_id: values.location,
        type: values.type,
        jobLevel: values.level,
        position: values.position,
        company_id: companyId,
        expire_at: values.dateRange
          ? values.dateRange[1].format("YYYY-MM-DD")
          : undefined,
        created_at: new Date().toISOString().split("T")[0],
        status: "active",
      };

      await createJob(jobData);
      message.success("Thêm việc làm mới thành công!");
      navigate(`/companies/${companyId}`);
    } catch (error) {
      console.error("Error creating job:", error);
      const status = error?.response?.status;
      const serverMsg = error?.response?.data?.message;
      const msgText = Array.isArray(serverMsg) ? serverMsg.join(" ") : String(serverMsg || "");
      const isInsufficientStars =
        status === 403 &&
        (msgText.toLowerCase().includes("không đủ sao") || msgText.toLowerCase().includes("cần"));

      if (isInsufficientStars) {
        message.error("Bạn chưa đủ sao cần nâng cấp thêm");
      } else {
        message.error(serverMsg || "Thêm việc làm thất bại. Vui lòng thử lại!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-job-page">
      <Breadcrumb style={{ marginBottom: 24 }}>
        <Breadcrumb.Item>
          <a href="/">Trang chủ</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <a href="/thong-tin-doanh-nghiep">Thông tin doanh nghiệp</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item>Thêm việc làm mới</Breadcrumb.Item>
      </Breadcrumb>

      <h1 className="page-title">Thêm việc làm mới</h1>

      <Card className="create-job-card">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="create-job-form"
        >
          <Row gutter={[24, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Tên công việc"
                name="title"
                rules={[
                  { required: true, message: "Vui lòng nhập tên công việc" },
                ]}
              >
                <Input placeholder="Title" size="large" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Thời gian làm việc"
                name="type"
                rules={[
                  { required: true, message: "Vui lòng chọn thời gian làm việc" },
                ]}
              >
                <Select placeholder="Full-time" size="large">
                  <Option value="FULL-TIME">Full-time</Option>
                  <Option value="PART-TIME">Part-time</Option>
                  <Option value="INTERNSHIP">Internship</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 0]}>
            <Col xs={24} md={8}>
              <Form.Item
                label="Địa điểm"
                name="location"
                rules={[
                  { required: true, message: "Vui lòng chọn địa điểm" },
                ]}
              >
                <Select
                  placeholder="Chọn thành phố"
                  size="large"
                  loading={locations.length === 0}
                  showSearch
                  optionFilterProp="children"
                >
                  {locations.map((loc) => (
                    <Option key={loc.id} value={String(loc.id)}>
                      {loc.name || loc.city}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label="Chi phí đăng tin">
                <Input value={`${postCost} sao`} size="large" disabled />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label="Thông tin mức lương"
                name="salary"
                rules={[
                  { required: true, message: "Vui lòng nhập mức lương" },
                ]}
              >
                <Input placeholder="$100 - $1500" size="large" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label="Thời hạn ứng tuyển"
                name="dateRange"
                rules={[
                  { required: true, message: "Vui lòng chọn thời hạn ứng tuyển" },
                ]}
              >
                <RangePicker 
                  size="large" 
                  style={{ width: "100%" }}
                  format="DD MMM YYYY"
                  placeholder={["28 Dec 22", "30 Jun 23"]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Cấp độ"
                name="level"
                rules={[
                  { required: true, message: "Vui lòng chọn cấp độ" },
                ]}
              >
                <Select placeholder="Senior" size="large">
                  <Option value="Intern">Intern</Option>
                  <Option value="Fresher">Fresher</Option>
                  <Option value="Junior">Junior</Option>
                  <Option value="Middle">Middle</Option>
                  <Option value="Senior">Senior</Option>
                  <Option value="Leader">Leader</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Vị trí công việc"
                name="position"
                rules={[
                  { required: true, message: "Vui lòng chọn vị trí công việc" },
                ]}
              >
                <Select placeholder="Chọn vị trí" size="large">
                  {JOB_POSITIONS.map((pos) => (
                    <Option key={pos.key} value={pos.key}>
                      {pos.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Mô tả công việc"
            name="description"
            rules={[
              { required: true, message: "Vui lòng nhập mô tả công việc" },
            ]}
          >
            <TextArea
              placeholder="Mô tả công việc..."
              rows={8}
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 32 }}>
            <Button
              type="primary"
              danger
              size="large"
              htmlType="submit"
              loading={loading}
              className="submit-btn"
            >
              Thêm Mới
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Related Jobs Section */}
      <div className="related-jobs-section">
        <h2 className="section-title">Ứng viên nổi bật</h2>
        <Row gutter={[16, 16]}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Col xs={24} sm={12} md={8} lg={4} key={item}>
              <Card className="candidate-card" hoverable>
                <div className="candidate-avatar">
                  <div className="avatar-placeholder">D</div>
                  <span className="featured-badge">Featured</span>
                </div>
                <div className="candidate-info">
                  <div className="candidate-name">Dribbble</div>
                  <div className="candidate-location">
                    📍 Dhaka, Bangladesh
                  </div>
                  <Button block className="view-position-btn">
                    Open Position (3)
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
}

export default CreateJob;
