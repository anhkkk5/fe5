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
  Select,
  Upload,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  getAllPosts,
  deletePost,
  updatePost,
  createPost,
} from "../../../services/posts/postsServices";
import { uploadImage } from "../../../services/Cloudinary/cloudinaryServices";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "./style.css";

const { TextArea } = Input;
const { Option } = Select;

// Hàm chuyển đổi tiêu đề thành slug
const createSlug = (text) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Loại bỏ dấu tiếng Việt
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-z0-9]+/g, "-") // Thay thế ký tự đặc biệt bằng dấu gạch ngang
    .replace(/^-+|-+$/g, ""); // Loại bỏ dấu gạch ngang ở đầu và cuối
};

function PostsManagement() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [editingPost, setEditingPost] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await getAllPosts();
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      message.error("Không thể tải danh sách bài viết!");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa bài viết này?",
      okText: "Xóa",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await deletePost(id);
          message.success("Xóa thành công!");
          fetchPosts();
        } catch (error) {
          message.error("Xóa thất bại!");
        }
      },
    });
  };

  const handleStatusChange = async (record, checked) => {
    try {
      await updatePost(record.id, {
        ...record,
        status: checked ? "published" : "draft",
      });
      message.success("Cập nhật trạng thái thành công!");
      fetchPosts();
    } catch {
      message.error("Cập nhật trạng thái thất bại!");
    }
  };

  const handleEdit = (record) => {
    setEditingPost(record);
    form.setFieldsValue({
      ...record,
      published_at: record.published_at ? dayjs(record.published_at) : null,
      status: record.status || "draft",
    });
    setThumbnailPreview(record.thumbnail || null);
    setThumbnailFile(null);
    setSlugManuallyEdited(!!record.slug); // Nếu đã có slug thì coi như đã chỉnh sửa
    setIsModalVisible(true);
  };

  const handleCreate = () => {
    setEditingPost(null);
    form.resetFields();
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setSlugManuallyEdited(false);
    setIsModalVisible(true);
  };

  // Xử lý khi tiêu đề thay đổi - tự động tạo slug (chỉ khi chưa chỉnh sửa thủ công)
  const handleTitleChange = (e) => {
    const title = e.target.value;
    if (!slugManuallyEdited) {
      const slug = createSlug(title);
      form.setFieldsValue({ slug });
    }
  };

  // Xử lý khi slug được chỉnh sửa thủ công
  const handleSlugChange = (e) => {
    setSlugManuallyEdited(true);
  };

  // Xử lý upload ảnh thumbnail
  const handleThumbnailChange = (info) => {
    const file = info.file.originFileObj || info.file;
    
    if (file) {
      // Kiểm tra kích thước file (tối đa 5MB)
      if (file.size > 5 * 1024 * 1024) {
        message.error("Kích thước file không được vượt quá 5MB!");
        return;
      }

      // Kiểm tra định dạng file
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
      if (!validTypes.includes(file.type)) {
        message.error("Chỉ chấp nhận file JPG, PNG, GIF!");
        return;
      }

      setThumbnailFile(file);
      
      // Tạo preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const beforeUpload = () => {
    return false; // Ngăn upload tự động
  };

  const handleSubmit = async (values) => {
    try {
      // Kiểm tra thumbnail khi tạo mới
      if (!editingPost && !thumbnailFile && !thumbnailPreview) {
        message.error("Vui lòng chọn ảnh thumbnail!");
        return;
      }

      setUploading(true);
      let thumbnailUrl = editingPost?.thumbnail || thumbnailPreview;

      // Upload ảnh thumbnail nếu có file mới
      if (thumbnailFile) {
        try {
          const uploadResult = await uploadImage(thumbnailFile, "posts");
          thumbnailUrl = uploadResult.url || uploadResult.secure_url || uploadResult;
        } catch (error) {
          message.error("Upload ảnh thất bại!");
          setUploading(false);
          return;
        }
      }

      // Đảm bảo slug được tạo nếu chưa có
      const slug = values.slug || createSlug(values.title);

      const postData = {
        ...values,
        slug,
        thumbnail: thumbnailUrl,
        published_at: values.published_at
          ? values.published_at.format("YYYY-MM-DD")
          : null,
        status: values.status || "draft",
      };

      if (editingPost) {
        await updatePost(editingPost.id, postData);
        message.success("Cập nhật thành công!");
      } else {
        await createPost(postData);
        message.success("Tạo bài viết thành công!");
      }
      setIsModalVisible(false);
      setEditingPost(null);
      form.resetFields();
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setSlugManuallyEdited(false);
      fetchPosts();
    } catch (error) {
      message.error(editingPost ? "Cập nhật thất bại!" : "Tạo bài viết thất bại!");
    } finally {
      setUploading(false);
    }
  };

  const filteredPosts = posts.filter((post) => {
    const searchLower = searchText.toLowerCase();
    return (
      post.title?.toLowerCase().includes(searchLower) ||
      post.category?.toLowerCase().includes(searchLower) ||
      post.id?.toString().includes(searchLower)
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
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      width: 250,
      ellipsis: true,
    },
    {
      title: "Danh mục",
      dataIndex: "category",
      key: "category",
      width: 150,
      render: (category) => (
        <Tag color="blue">{category || "Chưa phân loại"}</Tag>
      ),
    },
    {
      title: "Tác giả",
      dataIndex: "author",
      key: "author",
      width: 150,
      render: (author) => author || "N/A",
    },
    {
      title: "Ngày xuất bản",
      dataIndex: "published_at",
      key: "published_at",
      width: 150,
      render: (text) => (text ? dayjs(text).format("DD/MM/YYYY") : "N/A"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status, record) => (
        <Switch
          checked={status === "published"}
          onChange={(checked) => handleStatusChange(record, checked)}
        />
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 200,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/posts/${record.id}`)}
          >
            Xem
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
        <h1>Quản lý bài viết</h1>
        <Space>
          <Input
            placeholder="Tìm kiếm bài viết..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Tạo bài viết mới
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredPosts}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: false, position: ["bottomCenter"] }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title={editingPost ? "Chỉnh sửa bài viết" : "Thêm bài viết mới"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingPost(null);
          form.resetFields();
          setThumbnailFile(null);
          setThumbnailPreview(null);
          setSlugManuallyEdited(false);
        }}
        onOk={() => form.submit()}
        okText={editingPost ? "Cập nhật" : "Tạo mới"}
        cancelText="Hủy"
        width={800}
        okButtonProps={{ loading: uploading }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label={
              <span>
                Tiêu đề <span style={{ color: "red" }}>*</span>
              </span>
            }
            name="title"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề!" }]}
          >
            <Input 
              placeholder="Nhập tiêu đề bài viết" 
              onChange={handleTitleChange}
            />
          </Form.Item>

          <Form.Item
            label="Slug"
            name="slug"
          >
            <Input 
              placeholder="bi-kip-tim-viec-lam"
              onChange={handleSlugChange}
            />
            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
              URL thân thiện cho bài viết (tự động tạo từ tiêu đề)
            </div>
          </Form.Item>

          <Form.Item
            label={
              <span>
                Ảnh thumbnail <span style={{ color: "red" }}>*</span>
              </span>
            }
            required
          >
            <Upload
              beforeUpload={beforeUpload}
              onChange={handleThumbnailChange}
              showUploadList={false}
              accept="image/jpeg,image/jpg,image/png,image/gif"
            >
              <Button icon={<UploadOutlined />}>Chọn tệp</Button>
            </Upload>
            {thumbnailPreview ? (
              <div style={{ marginTop: "8px" }}>
                <img 
                  src={thumbnailPreview} 
                  alt="Thumbnail preview" 
                  style={{ maxWidth: "200px", maxHeight: "150px", objectFit: "cover", borderRadius: "4px" }}
                />
              </div>
            ) : (
              <div style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}>
                Không có tệp nào được chọn
              </div>
            )}
            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
              Chọn ảnh từ máy tính (JPG, PNG, GIF - tối đa 5MB)
            </div>
          </Form.Item>

          <Form.Item
            label={
              <span>
                Mô tả ngắn <span style={{ color: "red" }}>*</span>
              </span>
            }
            name="excerpt"
            rules={[{ required: true, message: "Vui lòng nhập mô tả ngắn!" }]}
          >
            <TextArea
              rows={4}
              placeholder="Tóm tắt nội dung bài viết..."
            />
          </Form.Item>

          <Form.Item
            label={
              <span>
                Nội dung (HTML) <span style={{ color: "red" }}>*</span>
              </span>
            }
            name="content"
            rules={[{ required: true, message: "Vui lòng nhập nội dung!" }]}
          >
            <TextArea
              rows={10}
              placeholder="<h1>Nội dung bài viết...</h1><p>Chi tiết...</p>"
            />
          </Form.Item>

          <Form.Item
            label={
              <span>
                Danh mục <span style={{ color: "red" }}>*</span>
              </span>
            }
            name="category"
            rules={[{ required: true, message: "Vui lòng chọn danh mục!" }]}
          >
            <Select placeholder="Chọn danh mục">
              <Option value="Định hướng nghề nghiệp">Định hướng nghề nghiệp</Option>
              <Option value="Bí kíp tìm việc">Bí kíp tìm việc</Option>
              <Option value="Chế độ lương thưởng">Chế độ lương thưởng</Option>
              <Option value="Kiến thức chuyên ngành">Kiến thức chuyên ngành</Option>
              <Option value="Hành trang nghề nghiệp">Hành trang nghề nghiệp</Option>
              <Option value="Thị trường & xu hướng tuyển dụng">Thị trường & xu hướng tuyển dụng</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Tác giả"
            name="author"
            rules={[{ required: true, message: "Vui lòng nhập tên tác giả!" }]}
          >
            <Input placeholder="Nhập tên tác giả" />
          </Form.Item>

          <Form.Item
            label="Ngày xuất bản"
            name="published_at"
          >
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            label="Trạng thái"
            name="status"
          >
            <Select>
              <Option value="draft">Bản nháp</Option>
              <Option value="published">Đã xuất bản</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default PostsManagement;

