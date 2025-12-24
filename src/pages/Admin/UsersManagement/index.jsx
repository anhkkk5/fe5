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
  Pagination,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import {
  getAllCandidates,
  editCandidates,
  deleteCandidates,
} from "../../../services/Candidates/candidatesServices";
import { adminAdjustCandidateStars } from "../../../services/stars/starsServices";
import { useNavigate } from "react-router-dom";
import "./style.css";

function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUser, setEditingUser] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [starsModalOpen, setStarsModalOpen] = useState(false);
  const [starsTarget, setStarsTarget] = useState(null);
  const [starsAmount, setStarsAmount] = useState(10);
  const [starsSaving, setStarsSaving] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllCandidates();
      setUsers(data);
    } catch (error) {
      message.error("Không thể tải danh sách người dùng!");
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
      await adminAdjustCandidateStars(starsTarget.id, Number(starsAmount || 0));
      message.success("Cập nhật sao thành công!");
      setStarsModalOpen(false);
      setStarsTarget(null);
      fetchUsers();
    } catch (e) {
      message.error(e?.response?.data?.message || e?.message || "Cập nhật sao thất bại!");
    } finally {
      setStarsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa người dùng này?",
      okText: "Xóa",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await deleteCandidates(id);
          message.success("Xóa thành công!");
          fetchUsers();
        } catch {
          message.error("Xóa thất bại!");
        }
      },
    });
  };

  const handleStatusChange = async (record, checked) => {
    try {
      await editCandidates(record.id, {
        ...record,
        status: checked ? "active" : "inactive",
      });
      message.success("Cập nhật trạng thái thành công!");
      fetchUsers();
    } catch {
      message.error("Cập nhật trạng thái thất bại!");
    }
  };

  const handleEdit = (record) => {
    setEditingUser(record);
    form.setFieldsValue({
      ...record,
      status: record.status === "active",
      isPremium: !!record.isPremium,
    });
    setIsModalVisible(true);
  };

  const handleUpdate = async (values) => {
    try {
      await editCandidates(editingUser.id, {
        ...values,
        status: values.status ? "active" : "inactive",
      });
      message.success("Cập nhật thành công!");
      setIsModalVisible(false);
      setEditingUser(null);
      form.resetFields();
      fetchUsers();
    } catch {
      message.error("Cập nhật thất bại!");
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchText.toLowerCase();
    return (
      user.fullName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.id?.toLowerCase().includes(searchLower) ||
      user.phone?.toLowerCase().includes(searchLower)
    );
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, users.length]);

  const pageSize = 10;
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 100,
    },
    {
      title: "Họ và tên",
      dataIndex: "fullName",
      key: "fullName",
      width: 200,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 200,
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      width: 150,
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      key: "address",
      width: 200,
    },
    {
      title: "Ngày sinh",
      dataIndex: "dob",
      key: "dob",
      width: 120,
      render: (text) =>
        text ? new Date(text).toLocaleDateString("vi-VN") : "N/A",
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
            onClick={() => navigate(`/cv`)}
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
        <h1>Quản lý người dùng</h1>
        <Input
          placeholder="Tìm kiếm người dùng..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
      </div>

      <div className="admin-table-container">
        <Table
          columns={columns}
          dataSource={paginatedUsers}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 1200 }}
        />
      </div>

      <div className="admin-pagination">
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={filteredUsers.length}
          onChange={(page) => setCurrentPage(page)}
          showSizeChanger={false}
        />
      </div>

      <Modal
        title="Chỉnh sửa người dùng"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingUser(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Cập nhật"
        cancelText="Hủy"
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          <Form.Item
            label="Họ và tên"
            name="fullName"
            rules={[{ required: true, message: "Vui lòng nhập họ và tên!" }]}
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

          <Form.Item label="Số điện thoại" name="phone">
            <Input />
          </Form.Item>

          <Form.Item label="Sao" name="stars">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label="Premium" name="isPremium" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item label="Địa chỉ" name="address">
            <Input />
          </Form.Item>

          <Form.Item label="Trạng thái" name="status" valuePropName="checked">
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Tạm dừng" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Cộng/Trừ sao - ${starsTarget?.fullName || ""}`}
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

export default UsersManagement;
