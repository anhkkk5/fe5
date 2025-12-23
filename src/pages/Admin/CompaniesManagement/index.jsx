import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Input,
  InputNumber,
  Space,
  Tag,
  Switch,
  message,
  Modal,
  Form,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import {
  getAllCompany,
  editCompany,
  deleteCompany,
} from "../../../services/getAllCompany/companyServices";
import { adminAdjustCompanyStars } from "../../../services/stars/starsServices";
import { useNavigate } from "react-router-dom";
import "./style.css";

function CompaniesManagement() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [editingCompany, setEditingCompany] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [starsModalOpen, setStarsModalOpen] = useState(false);
  const [starsTarget, setStarsTarget] = useState(null);
  const [starsAmount, setStarsAmount] = useState(10);
  const [starsSaving, setStarsSaving] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const data = await getAllCompany();
      setCompanies(data);
    } catch (error) {
      message.error("Không thể tải danh sách công ty!");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openStarsModal = (record) => {
    setStarsTarget(record);
    setStarsAmount(10);
    setStarsModalOpen(true);
  };

  const submitAdjustStars = async () => {
    if (!starsTarget?.id) return;
    try {
      setStarsSaving(true);
      await adminAdjustCompanyStars(starsTarget.id, Number(starsAmount || 0));
      message.success("Cập nhật sao thành công!");
      setStarsModalOpen(false);
      setStarsTarget(null);
      fetchCompanies();
    } catch (e) {
      message.error(e?.response?.data?.message || e?.message || "Cập nhật sao thất bại!");
    } finally {
      setStarsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa công ty này?",
      okText: "Xóa",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await deleteCompany(id);
          message.success("Xóa thành công!");
          fetchCompanies();
        } catch {
          message.error("Xóa thất bại!");
        }
      },
    });
  };

  const handleStatusChange = async (record, checked) => {
    try {
      await editCompany(record.id, {
        ...record,
        status: checked ? "active" : "inactive",
      });
      message.success("Cập nhật trạng thái thành công!");
      fetchCompanies();
    } catch {
      message.error("Cập nhật trạng thái thất bại!");
    }
  };

  const handleEdit = (record) => {
    setEditingCompany(record);
    form.setFieldsValue({
      ...record,
      status: record.status === "active",
      isPremium: !!record.isPremium,
    });
    setIsModalVisible(true);
  };

  const handleUpdate = async (values) => {
    try {
      await editCompany(editingCompany.id, {
        ...values,
        status: values.status ? "active" : "inactive",
      });
      message.success("Cập nhật thành công!");
      setIsModalVisible(false);
      setEditingCompany(null);
      form.resetFields();
      fetchCompanies();
    } catch {
      message.error("Cập nhật thất bại!");
    }
  };

  const filteredCompanies = companies.filter((company) => {
    const searchLower = searchText.toLowerCase();
    return (
      company.fullName?.toLowerCase().includes(searchLower) ||
      company.companyName?.toLowerCase().includes(searchLower) ||
      company.email?.toLowerCase().includes(searchLower) ||
      company.id?.toLowerCase().includes(searchLower)
    );
  });

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 100,
    },
    {
      title: "Tên công ty",
      dataIndex: "fullName",
      key: "fullName",
      width: 200,
      render: (text, record) => record.fullName || record.companyName || "N/A",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 200,
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      key: "address",
      width: 200,
    },
    {
      title: "Website",
      dataIndex: "website",
      key: "website",
      width: 200,
      render: (text) =>
        text ? (
          <a href={text} target="_blank" rel="noopener noreferrer">
            {text}
          </a>
        ) : (
          "N/A"
        ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status, record) => (
        <Switch
          checked={status === "active"}
          onChange={(checked) => handleStatusChange(record, checked)}
        />
      ),
    },
    {
      title: "Sao",
      dataIndex: "stars",
      key: "stars",
      width: 100,
      render: (v) => <Tag color="gold">{v ?? 0}</Tag>,
    },
    {
      title: "Premium",
      dataIndex: "isPremium",
      key: "isPremium",
      width: 110,
      render: (v) => (
        <Tag color={v ? "green" : "default"}>{v ? "Đã" : "Chưa"}</Tag>
      ),
    },
    {
      title: "Chi tiết thông tin",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/companies/${record.id}`)}
          >
            Truy cập
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Button type="link" onClick={() => openStarsModal(record)}>
            +/- Sao
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="admin-management-container">
      <div className="admin-header">
        <h1>Quản lý công ty</h1>
        <Input
          placeholder="Tìm kiếm công ty..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredCompanies}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, position: ["bottomCenter"] }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title="Chỉnh sửa công ty"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingCompany(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Cập nhật"
        cancelText="Hủy"
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          <Form.Item
            label="Tên công ty"
            name="fullName"
            rules={[{ required: true, message: "Vui lòng nhập tên công ty!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email!" },
              { type: "email", message: "Email không hợp lệ!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Địa chỉ" name="address">
            <Input />
          </Form.Item>

          <Form.Item label="Sao" name="stars">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label="Premium" name="isPremium" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item label="Website" name="website">
            <Input />
          </Form.Item>

          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item label="Trạng thái" name="status" valuePropName="checked">
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Tạm dừng" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Cộng/Trừ sao - ${starsTarget?.fullName || starsTarget?.companyName || ""}`}
        open={starsModalOpen}
        onCancel={() => {
          setStarsModalOpen(false);
          setStarsTarget(null);
        }}
        onOk={submitAdjustStars}
        okText="Cập nhật"
        cancelText="Hủy"
        confirmLoading={starsSaving}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div>
            Nhập số sao muốn cộng/trừ (âm để trừ):
          </div>
          <InputNumber value={starsAmount} onChange={(v) => setStarsAmount(v)} style={{ width: "100%" }} />
        </div>
      </Modal>
    </div>
  );
}

export default CompaniesManagement;
