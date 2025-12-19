import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Tag,
  Switch,
  message,
  DatePicker,
  Modal,
  Form,
  InputNumber,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import {
  getAlljob,
  deleteJob,
  updateJob,
} from "../../../services/jobServices/jobServices";
import { getAllCompany } from "../../../services/getAllCompany/companyServices";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "./style.css";

const { RangePicker } = DatePicker;

function JobsManagement() {
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [editingJob, setEditingJob] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
    fetchCompanies();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await getAlljob();
      setJobs(data);
    } catch (error) {
      message.error("Không thể tải danh sách việc làm!");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const data = await getAllCompany();
      setCompanies(data);
    } catch (error) {
      console.error(error);
    }
  };

  const getCompanyName = (companyId) => {
    const company = companies.find(
      (c) => String(c.id) === String(companyId)
    );
    return company ? company.fullName || company.companyName : "N/A";
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa việc làm này?",
      okText: "Xóa",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await deleteJob(id);
          message.success("Xóa thành công!");
          fetchJobs();
        } catch (error) {
          message.error("Xóa thất bại!");
        }
      },
    });
  };

  const handleStatusChange = async (record, checked) => {
    try {
      await updateJob(record.id, {
        ...record,
        status: checked ? "active" : "inactive",
      });
      message.success("Cập nhật trạng thái thành công!");
      fetchJobs();
    } catch {
      message.error("Cập nhật trạng thái thất bại!");
    }
  };

  const handleEdit = (record) => {
    setEditingJob(record);
    form.setFieldsValue({
      ...record,
      expire_at: record.expire_at ? dayjs(record.expire_at) : null,
      salaryMin: record.salary
        ? parseInt(record.salary.split("-")[0]?.replace(/[^\d]/g, ""))
        : null,
      salaryMax: record.salary
        ? parseInt(record.salary.split("-")[1]?.replace(/[^\d]/g, ""))
        : null,
      status: record.status === "active",
    });
    setIsModalVisible(true);
  };

  const handleUpdate = async (values) => {
    try {
      const salaryRange =
        values.salaryMin && values.salaryMax
          ? `$${values.salaryMin.toLocaleString()} - $${values.salaryMax.toLocaleString()}`
          : editingJob.salary;

      await updateJob(editingJob.id, {
        ...values,
        expire_at: values.expire_at
          ? values.expire_at.format("YYYY-MM-DD")
          : editingJob.expire_at,
        salary: salaryRange,
        status: values.status ? "active" : "inactive",
        salaryMin: undefined,
        salaryMax: undefined,
      });
      message.success("Cập nhật thành công!");
      setIsModalVisible(false);
      setEditingJob(null);
      form.resetFields();
      fetchJobs();
    } catch {
      message.error("Cập nhật thất bại!");
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const searchLower = searchText.toLowerCase();
    return (
      job.title?.toLowerCase().includes(searchLower) ||
      getCompanyName(job.company_id)?.toLowerCase().includes(searchLower) ||
      job.id?.toLowerCase().includes(searchLower)
    );
  });

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "Tên công việc",
      dataIndex: "title",
      key: "title",
      width: 200,
    },
    {
      title: "Công ty",
      key: "company",
      width: 150,
      render: (_, record) => getCompanyName(record.company_id),
    },
    {
      title: "Email liên hệ",
      key: "email",
      width: 180,
      render: (_, record) => {
        const company = companies.find(
          (c) => String(c.id) === String(record.company_id)
        );
        return company?.email || "N/A";
      },
    },
    {
      title: "Thời hạn ứng tuyển",
      dataIndex: "expire_at",
      key: "expire_at",
      width: 150,
      render: (text) => (text ? dayjs(text).format("DD/MM/YYYY") : "N/A"),
    },
    {
      title: "Khoảng lương",
      dataIndex: "salary",
      key: "salary",
      width: 180,
      render: (text) => text || "N/A",
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
      title: "Chi tiết thông tin",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/jobs/${record.id}`)}
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
        <h1>Quản lý việc làm</h1>
        <Input
          placeholder="Tìm kiếm công việc, công ty..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredJobs}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title="Chỉnh sửa việc làm"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingJob(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Cập nhật"
        cancelText="Hủy"
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          <Form.Item
            label="Tên công việc"
            name="title"
            rules={[
              { required: true, message: "Vui lòng nhập tên công việc!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Thời hạn ứng tuyển" name="expire_at">
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item label="Khoảng lương">
            <Space>
              <Form.Item name="salaryMin" noStyle>
                <InputNumber
                  placeholder="Tối thiểu"
                  prefix="$"
                  style={{ width: 150 }}
                  min={0}
                />
              </Form.Item>
              <span>-</span>
              <Form.Item name="salaryMax" noStyle>
                <InputNumber
                  placeholder="Tối đa"
                  prefix="$"
                  style={{ width: 150 }}
                  min={0}
                />
              </Form.Item>
            </Space>
          </Form.Item>

          <Form.Item
            label="Trạng thái"
            name="status"
            valuePropName="checked"
            getValueFromEvent={(checked) => (checked ? "active" : "inactive")}
            getValueProps={(value) => ({ checked: value === "active" })}
          >
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Tạm dừng" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default JobsManagement;
