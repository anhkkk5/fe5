import React, { useEffect, useState } from "react";
import { Card, Button, Spin, Empty, Tag, message, Modal, Form, Input, InputNumber, Upload } from "antd";
import { DollarOutlined, GlobalOutlined, EnvironmentOutlined, UploadOutlined } from "@ant-design/icons";
import { get, post } from "../../utils/axios/request";
import { uploadImage } from "../../services/Cloudinary/cloudinaryServices";
import "./style.css";

function AdsRent() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rentModalOpen, setRentModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bannerUrl, setBannerUrl] = useState("");
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        setLoading(true);
        const data = await get("ad-slots/available");
        setSlots(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error loading ad slots", error);
        message.error("Không thể tải danh sách quảng cáo");
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, []);

  const handleOpenRentModal = (slot) => {
    setSelectedSlot(slot);
    setBannerUrl("");
    form.resetFields();
    setRentModalOpen(true);
  };

  const handleUploadBanner = async (file) => {
    try {
      setUploadingBanner(true);
      const result = await uploadImage(file, "ad-banners");
      if (result?.url) {
        setBannerUrl(result.url);
        message.success("Upload banner thành công");
      } else {
        message.error("Upload banner thất bại");
      }
    } catch (error) {
      console.error("Upload banner error", error);
      message.error("Không thể upload banner");
    } finally {
      setUploadingBanner(false);
    }
    return false; // chặn upload mặc định của antd
  };

  const handleSubmitRent = async (values) => {
    if (!selectedSlot) return;
    try {
      setSubmitting(true);
      await post("ad-bookings", {
        slotId: selectedSlot.id,
        title: values.title,
        content: values.content,
        targetUrl: values.targetUrl,
        imageUrl: bannerUrl || undefined,
        months: values.months,
      });
      message.success("Gửi yêu cầu thuê quảng cáo thành công");
      setRentModalOpen(false);
    } catch (error) {
      console.error("Error creating ad booking", error);
      const backendMsg = error?.response?.data?.message;
      message.error(
        backendMsg
          ? Array.isArray(backendMsg)
            ? backendMsg.join(", ")
            : backendMsg
          : "Gửi yêu cầu thuê thất bại"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ads-rent">
      <div className="ads-rent__header">
        <h1>Thuê quảng cáo</h1>
        <p>Chọn doanh nghiệp và thuê vị trí quảng cáo nổi bật trên trang công ty.</p>
      </div>

      {loading ? (
        <div className="ads-rent__loading">
          <Spin size="large" />
        </div>
      ) : slots.length === 0 ? (
        <Empty description="Hiện chưa có doanh nghiệp nào mở cho thuê quảng cáo" />
      ) : (
        <div className="ads-rent__grid">
          {slots.map((slot) => (
            <Card
              key={slot.id}
              className="ads-rent__card"
              hoverable
              cover={
                <div className="ads-rent__card-cover">
                  {slot.company?.logo ? (
                    <img
                      src={slot.company.logo}
                      alt={slot.company.companyName}
                      className="ads-rent__card-image"
                    />
                  ) : (
                    <div className="ads-rent__card-image ads-rent__card-image--placeholder">
                      <GlobalOutlined />
                    </div>
                  )}
                </div>
              }
              actions={[
                <Button
                  type="primary"
                  danger
                  block
                  onClick={() => handleOpenRentModal(slot)}
                  key="rent"
                >
                  Thuê quảng cáo tại công ty này
                </Button>,
              ]}
            >
              <div className="ads-rent__card-content">
                <h3>{slot.company?.companyName || "Doanh nghiệp"}</h3>
                <div className="ads-rent__card-meta">
                  <Tag color="red">Banner trang công ty</Tag>
                  <Tag icon={<DollarOutlined />} color="green">
                    {slot.basePricePerMonth.toLocaleString("vi-VN")} VND / tháng
                  </Tag>
                </div>
                {slot.company?.address && (
                  <div className="ads-rent__card-address">
                    <EnvironmentOutlined /> {slot.company.address}
                  </div>
                )}
                <p className="ads-rent__card-description">
                  Quảng cáo sẽ được hiển thị nổi bật trong trang thông tin doanh nghiệp, giúp tăng độ nhận diện thương hiệu của bạn.
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
      {/* Rent Ad Modal */}
      <Modal
        title={selectedSlot ? `Thuê quảng cáo tại ${selectedSlot.company?.companyName}` : "Thuê quảng cáo"}
        open={rentModalOpen}
        onCancel={() => setRentModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitRent}
        >
          <Form.Item
            name="title"
            label="Tiêu đề quảng cáo"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
          >
            <Input placeholder="Ví dụ: Quảng cáo khóa học React" />
          </Form.Item>

          <Form.Item
            name="content"
            label="Mô tả nội dung"
          >
            <Input.TextArea rows={3} placeholder="Mô tả ngắn gọn về nội dung quảng cáo" />
          </Form.Item>

          <Form.Item
            name="targetUrl"
            label="Link khi người dùng click vào"
            rules={[{ type: "url", message: "Vui lòng nhập URL hợp lệ" }]}
          >
            <Input placeholder="https://example.com/landing-page" />
          </Form.Item>

          <Form.Item
            name="months"
            label="Số tháng thuê"
            rules={[{ required: true, message: "Vui lòng nhập số tháng" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label="Banner quảng cáo (tùy chọn)">
            <Upload
              accept="image/*"
              showUploadList={false}
              beforeUpload={handleUploadBanner}
            >
              <Button icon={<UploadOutlined />} loading={uploadingBanner}>
                Upload banner
              </Button>
            </Upload>
            {bannerUrl && (
              <div className="ads-rent__banner-preview">
                <img src={bannerUrl} alt="Banner preview" />
              </div>
            )}
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>
              Gửi yêu cầu thuê quảng cáo
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default AdsRent;
