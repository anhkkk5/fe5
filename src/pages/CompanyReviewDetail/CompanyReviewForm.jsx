import React, { useState } from "react";
import { Form, Rate, Input, Radio, Button, Card, Typography, message, Checkbox } from "antd";
import { createReview } from "../../services/companyReviews/companyReviewsServices";
import { StarOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
const { TextArea } = Input;

function CompanyReviewForm({ companyId, onSuccess }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      await createReview({
        companyId: parseInt(companyId),
        ...values,
        overallRating: parseFloat(values.overallRating),
        workLifeBalance: values.workLifeBalance ? parseFloat(values.workLifeBalance) : undefined,
        salaryBenefits: values.salaryBenefits ? parseFloat(values.salaryBenefits) : undefined,
        jobStability: values.jobStability ? parseFloat(values.jobStability) : undefined,
        management: values.management ? parseFloat(values.management) : undefined,
        culture: values.culture ? parseFloat(values.culture) : undefined,
      });
      message.success("Đánh giá thành công!");
      form.resetFields();
      if (onSuccess) onSuccess();
    } catch (error) {
      message.error(error?.response?.data?.message || "Không thể gửi đánh giá");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Title level={3}>Đánh giá Công ty</Title>
      <Text type="secondary">
        Chỉ mất một phút thôi! Và đánh giá ẩn danh của bạn sẽ giúp những người tìm việc khác.
      </Text>

      <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 24 }}>
        <Form.Item
          label="Đánh giá tổng thể *"
          name="overallRating"
          rules={[{ required: true, message: "Vui lòng đánh giá tổng thể" }]}
        >
          <Rate />
        </Form.Item>

        <Form.Item label="Công việc/Cân bằng cuộc sống" name="workLifeBalance">
          <Rate />
        </Form.Item>

        <Form.Item label="Lương thưởng/Phúc lợi" name="salaryBenefits">
          <Rate />
        </Form.Item>

        <Form.Item label="Công việc ổn định/thăng tiến" name="jobStability">
          <Rate />
        </Form.Item>

        <Form.Item label="Quản lý" name="management">
          <Rate />
        </Form.Item>

        <Form.Item label="Văn hóa công việc" name="culture">
          <Rate />
        </Form.Item>

        <Form.Item
          label="Bạn là nhân viên hiện tại hay nhân viên cũ?"
          name="employmentStatus"
          rules={[{ required: true, message: "Vui lòng chọn" }]}
        >
          <Radio.Group>
            <Radio value="current">Nhân viên hiện tại</Radio>
            <Radio value="former">Nhân viên cũ</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item label="Vị trí công việc" name="jobTitle">
          <Input placeholder="Ví dụ: PHP Developer" />
        </Form.Item>

        <Form.Item label="Địa điểm" name="location">
          <Input placeholder="Ví dụ: Hồ Chí Minh" />
        </Form.Item>

        <Form.Item label="Loại hợp đồng" name="contractType">
          <Input placeholder="Ví dụ: Full-time" />
        </Form.Item>

        <Form.Item label="Tiêu đề review" name="title">
          <Input placeholder="Tóm tắt đánh giá của bạn" />
        </Form.Item>

        <Form.Item label="Ưu điểm" name="pros">
          <TextArea rows={4} placeholder="Nhập các ưu điểm..." />
        </Form.Item>

        <Form.Item label="Nhược điểm" name="cons">
          <TextArea rows={4} placeholder="Nhập các nhược điểm..." />
        </Form.Item>

        <Form.Item name="recommendToFriends" valuePropName="checked">
          <Checkbox>Đề xuất cho bạn bè</Checkbox>
        </Form.Item>

        <Form.Item name="ceoRating" valuePropName="checked">
          <Checkbox>Đánh giá hiệu quả CEO</Checkbox>
        </Form.Item>

        <Form.Item name="businessOutlook" valuePropName="checked">
          <Checkbox>Triển vọng kinh doanh</Checkbox>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Gửi đánh giá
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

export default CompanyReviewForm;



