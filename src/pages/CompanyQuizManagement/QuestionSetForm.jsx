import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Table,
  Space,
  message,
  Spin,
} from "antd";
import { questionSetsServices } from "../../services/question-sets/questionSetsServices";
import { questionsServices } from "../../services/questions/questionsServices";
import "./questionSetForm.css";

const { Option } = Select;
const { TextArea } = Input;

const CATEGORIES = [
  "Kỹ năng văn phòng",
  "Công nghệ",
  "Kỹ năng mềm",
];

function QuestionSetForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [category, setCategory] = useState("");
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const isEdit = id && id !== "new";

  useEffect(() => {
    if (isEdit) {
      loadQuestionSet();
    }
  }, [id]);

  useEffect(() => {
    if (category) {
      loadQuestions();
    }
  }, [category]);

  const loadQuestionSet = async () => {
    try {
      setLoading(true);
      const data = await questionSetsServices.getQuestionSetById(id);
      form.setFieldsValue({
        name: data.name,
        description: data.description,
        category: data.category,
        skillCategory: data.skillCategory,
      });
      setCategory(data.category);
      setSelectedQuestions(data.questions?.map((q) => q.id) || []);
      setLoading(false);
    } catch (error) {
      message.error("Không thể tải dữ liệu");
      navigate("/company/quiz");
    }
  };

  const loadQuestions = async () => {
    try {
      setLoadingQuestions(true);
      const data = await questionsServices.getAllQuestions(category);
      setQuestions(data || []);
    } catch (error) {
      message.error("Không thể tải câu hỏi");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSubmit = async (values) => {
    if (selectedQuestions.length === 0) {
      message.warning("Vui lòng chọn ít nhất một câu hỏi");
      return;
    }

    try {
      setLoading(true);
      const data = {
        ...values,
        questionIds: selectedQuestions,
      };

      if (isEdit) {
        await questionSetsServices.updateQuestionSet(id, data);
        message.success("Cập nhật thành công");
      } else {
        await questionSetsServices.createQuestionSet(data);
        message.success("Tạo thành công");
      }
      navigate("/company/quiz");
    } catch (error) {
      message.error("Không thể lưu");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Nội dung câu hỏi",
      dataIndex: "content",
      key: "content",
      ellipsis: true,
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      render: (type) => {
        const types = {
          multiple_choice: "Trắc nghiệm",
          checkbox: "Nhiều đáp án",
          text: "Tự luận",
        };
        return types[type] || type;
      },
    },
    {
      title: "Điểm",
      dataIndex: "point",
      key: "point",
    },
  ];

  const rowSelection = {
    selectedRowKeys: selectedQuestions,
    onChange: (selectedRowKeys) => {
      setSelectedQuestions(selectedRowKeys);
    },
  };

  return (
    <div className="question-set-form">
      <Card>
        <h2>
          {isEdit ? "Sửa danh sách câu hỏi" : "Tạo danh sách câu hỏi mới"}
        </h2>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ category: "" }}
        >
          <Form.Item
            name="name"
            label="Tên danh sách"
            rules={[{ required: true, message: "Vui lòng nhập tên" }]}
          >
            <Input placeholder="VD: Git, Word, Excel..." />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <TextArea rows={3} placeholder="Mô tả về danh sách câu hỏi" />
          </Form.Item>

          <Form.Item
            name="category"
            label="Danh mục"
            rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
          >
            <Select
              placeholder="Chọn danh mục"
              onChange={(value) => setCategory(value)}
            >
              {CATEGORIES.map((cat) => (
                <Option key={cat} value={cat}>
                  {cat}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="skillCategory" label="Kỹ năng cụ thể (tùy chọn)">
            <Input placeholder="VD: Git, HTML, Agile, Word, Excel..." />
          </Form.Item>

          {category && (
            <div className="question-set-form__questions">
              <h3>Chọn câu hỏi ({selectedQuestions.length} đã chọn)</h3>
              {loadingQuestions ? (
                <Spin />
              ) : questions.length === 0 ? (
                <p>Không có câu hỏi nào cho danh mục {category}</p>
              ) : (
                <Table
                  rowSelection={rowSelection}
                  columns={columns}
                  dataSource={questions}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              )}
            </div>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {isEdit ? "Cập nhật" : "Tạo mới"}
              </Button>
              <Button onClick={() => navigate("/company/quiz")}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default QuestionSetForm;

