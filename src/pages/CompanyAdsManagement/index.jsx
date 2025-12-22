import React, { useEffect, useState } from "react";
import { Card, Table, Tag, Button, message, Spin, Form, InputNumber, Input, Switch, Space } from "antd";
import { get, edit, post, del } from "../../utils/axios/request";
import "./style.css";

const statusColors = {
  pending: "gold",
  approved: "green",
  rejected: "red",
};

const paymentColors = {
  unpaid: "red",
  paid: "green",
};

function CompanyAdsManagement() {
  const [slot, setSlot] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingSlot, setSavingSlot] = useState(false);
  const [updatingBooking, setUpdatingBooking] = useState(false);
  const [form] = Form.useForm();

  const loadData = async () => {
    try {
      setLoading(true);
      const [slotData, bookingData] = await Promise.all([
        get("ad-slots/my"),
        get("ad-bookings/my"),
      ]);
      setSlot(slotData || null);
      setBookings(Array.isArray(bookingData) ? bookingData : []);
      if (slotData) {
        form.setFieldsValue({
          name: slotData.name,
          basePricePerMonth: slotData.basePricePerMonth,
          isActive: slotData.isActive,
        });
      }
    } catch (error) {
      console.error("Error loading ads management data", error);
      message.error("Không thể tải dữ liệu quảng cáo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSlot = async (values) => {
    try {
      setSavingSlot(true);
      await post("ad-slots/my", values);
      message.success("Lưu cấu hình vị trí quảng cáo thành công");
      loadData();
    } catch (error) {
      console.error("Error saving ad slot", error);
      const backendMsg = error?.response?.data?.message;
      message.error(
        backendMsg
          ? Array.isArray(backendMsg)
            ? backendMsg.join(", ")
            : backendMsg
          : "Lưu cấu hình thất bại"
      );
    } finally {
      setSavingSlot(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      setUpdatingBooking(true);
      await edit(`ad-bookings/${id}/status`, { status });
      message.success("Cập nhật trạng thái thành công");
      loadData();
    } catch (error) {
      console.error("Error updating booking status", error);
      message.error("Không thể cập nhật trạng thái");
    } finally {
      setUpdatingBooking(false);
    }
  };

  const handleDeleteBooking = async (id) => {
    const ok = window.confirm("Bạn có chắc muốn xóa yêu cầu thuê quảng cáo này?");
    if (!ok) return;
    try {
      setUpdatingBooking(true);
      await del(`ad-bookings/${id}`);
      message.success("Đã xóa yêu cầu");
      loadData();
    } catch (error) {
      console.error("Error deleting booking", error);
      message.error("Không thể xóa yêu cầu");
    } finally {
      setUpdatingBooking(false);
    }
  };

  const columns = [
    {
      title: "Người thuê",
      dataIndex: ["advertiser", "name"],
      key: "advertiser",
      render: (_, record) => record.advertiser?.name || "N/A",
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
      render: (value) => `${(value || 0).toLocaleString("vi-VN")} sao`,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag color={statusColors[status] || "default"}>{status}</Tag>,
    },
    {
      title: "Thanh toán",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      render: (p) => <Tag color={paymentColors[p] || "default"}>{p}</Tag>,
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <Space.Compact>
          {record.status === "pending" && (
            <>
              <Button size="small" type="primary" onClick={() => handleUpdateStatus(record.id, "approved")}>
                Duyệt
              </Button>
              <Button size="small" danger onClick={() => handleUpdateStatus(record.id, "rejected")}>
                Không duyệt
              </Button>
            </>
          )}
          <Button size="small" danger onClick={() => handleDeleteBooking(record.id)}>
            Xóa
          </Button>
        </Space.Compact>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="company-ads__loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="company-ads">
      <h1>Quản lý quảng cáo doanh nghiệp</h1>

      <Card title="Cấu hình vị trí quảng cáo" className="company-ads__slot-card">
        <Form
          form={form}
          layout="inline"
          onFinish={handleSaveSlot}
          initialValues={{ isActive: true }}
        >
          <Form.Item
            name="name"
            label="Tên vị trí"
            rules={[{ required: true, message: "Vui lòng nhập tên vị trí" }]}
          >
            <Input placeholder="Banner trang công ty" style={{ minWidth: 220 }} />
          </Form.Item>

          <Form.Item
            name="basePricePerMonth"
            label="Giá / tháng (sao)"
            rules={[{ required: true, message: "Vui lòng nhập giá" }]}
          >
            <InputNumber
              min={0}
              step={1}
              style={{ minWidth: 180 }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(value) => value.replace(/\s|\./g, "").replace(/,/g, "")}
            />
          </Form.Item>

          <Form.Item name="isActive" label="Mở cho thuê" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={savingSlot}>
              Lưu cấu hình
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="Các yêu cầu thuê quảng cáo" className="company-ads__bookings-card">
        <Table
          rowKey="id"
          dataSource={bookings}
          columns={columns}
          pagination={{ pageSize: 5 }}
          loading={updatingBooking}
        />
      </Card>
    </div>
  );
}

export default CompanyAdsManagement;
