import React, { useEffect, useState } from "react";
import { Card, Button, Spin, Empty, Tag, message, Modal, Form, Input, InputNumber, Upload, Table, Space } from "antd";
import { StarOutlined, GlobalOutlined, EnvironmentOutlined, UploadOutlined } from "@ant-design/icons";
import { get, post } from "../../utils/axios/request";
import { uploadImage } from "../../services/Cloudinary/cloudinaryServices";
import "./style.css";

function AdsRent() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [payingBookingId, setPayingBookingId] = useState(null);
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

    const fetchMyBookings = async () => {
      try {
        setLoadingBookings(true);
        const data = await get("ad-bookings/advertiser/me");
        setMyBookings(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error loading my ad bookings", error);
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchSlots();
    fetchMyBookings();
  }, []);

  const refreshMyBookings = async () => {
    try {
      setLoadingBookings(true);
      const data = await get("ad-bookings/advertiser/me");
      setMyBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading my ad bookings", error);
    } finally {
      setLoadingBookings(false);
    }
  };

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
      refreshMyBookings();
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

  const handlePayBooking = async (bookingId) => {
    try {
      setPayingBookingId(bookingId);
      await post(`ad-bookings/${bookingId}/pay`);
      message.success("Thanh toán bằng sao thành công");
      refreshMyBookings();
    } catch (error) {
      console.error("Error paying booking", error);
      const backendMsg = error?.response?.data?.message;
      message.error(
        backendMsg
          ? Array.isArray(backendMsg)
            ? backendMsg.join(", ")
            : backendMsg
          : "Thanh toán thất bại"
      );
    } finally {
      setPayingBookingId(null);
    }
  };

  const isBookingActiveNow = (record) => {
    if (!record?.startDate || !record?.endDate) return false;
    const now = new Date();
    const start = new Date(record.startDate);
    const end = new Date(record.endDate);
    return start <= now && end >= now;
  };

  const bookingColumns = [
    {
      title: "Công ty",
      dataIndex: ["slot", "company", "companyName"],
      key: "company",
      render: (_, record) => record.slot?.company?.companyName || "N/A",
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Số tháng",
      dataIndex: "months",
      key: "months",
    },
    {
      title: "Tổng sao",
      dataIndex: "totalPrice",
      key: "totalPrice",
      render: (v) => `${(v || 0).toLocaleString("vi-VN")} sao`,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (s) => <Tag color={s === "approved" ? "green" : s === "rejected" ? "red" : "gold"}>{s}</Tag>,
    },
    {
      title: "Thanh toán",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      render: (p) => <Tag color={p === "paid" ? "green" : "red"}>{p}</Tag>,
    },
    {
      title: "Thời hạn",
      key: "duration",
      render: (_, record) => {
        if (record.status !== "approved" || record.paymentStatus !== "paid") {
          return <Tag>Chưa chạy</Tag>;
        }
        return isBookingActiveNow(record) ? <Tag color="green">Đang chạy</Tag> : <Tag color="red">Hết hạn</Tag>;
      },
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <Space>
          {record.status === "approved" && record.paymentStatus === "unpaid" && (
            <Button
              type="primary"
              onClick={() => handlePayBooking(record.id)}
              loading={payingBookingId === record.id}
            >
              Thanh toán bằng sao
            </Button>
          )}
          {record.status === "approved" && record.paymentStatus === "paid" && !isBookingActiveNow(record) && (
            <Button onClick={() => handleOpenRentModal(record.slot)}>
              Gia hạn / Thuê mới
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="ads-rent">
      <div className="ads-rent__header">
        <h1>Thuê quảng cáo</h1>
        <p>Chọn doanh nghiệp và thuê vị trí quảng cáo nổi bật trên trang công ty.</p>
      </div>

      <Card title="Yêu cầu thuê quảng cáo của tôi" style={{ marginBottom: 16 }}>
        <Table
          rowKey="id"
          dataSource={myBookings}
          columns={bookingColumns}
          pagination={{ pageSize: 5 }}
          loading={loadingBookings}
        />
      </Card>

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
                  <Tag icon={<StarOutlined />} color="green">
                    {slot.basePricePerMonth.toLocaleString("vi-VN")} sao / tháng
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
