import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Card,
  Space,
  message,
  Radio,
  Checkbox,
} from "antd";
import { questionsServices } from "../../services/questions/questionsServices";
import "./questionForm.css";

const { Option } = Select;
const { TextArea } = Input;

const CATEGORIES = [
  "Kỹ năng văn phòng",
  "Công nghệ",
  "Kỹ năng mềm",
];

function QuestionForm() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [questionType, setQuestionType] = useState("multiple_choice");
  const [options, setOptions] = useState([{ id: 1, text: "" }]);
  const [correctAnswer, setCorrectAnswer] = useState(null);

  const handleAddOption = () => {
    setOptions([...options, { id: options.length + 1, text: "" }]);
  };

  const handleRemoveOption = (id) => {
    setOptions(options.filter((opt) => opt.id !== id));
  };

  const handleOptionChange = (id, text) => {
    setOptions(options.map((opt) => (opt.id === id ? { ...opt, text } : opt)));
  };

  const handleSubmit = async (values) => {
    if (questionType !== "text" && options.filter((o) => o.text).length < 2) {
      message.warning("Vui lòng thêm ít nhất 2 lựa chọn");
      return;
    }

    if (!correctAnswer && questionType !== "text") {
      message.warning("Vui lòng chọn đáp án đúng");
      return;
    }

    try {
      setLoading(true);
      const data = {
        ...values,
        type: questionType,
        options: questionType !== "text" ? options.filter((o) => o.text) : null,
        correctAnswer: questionType === "text" ? values.correctAnswerText : correctAnswer,
        category: values.category,
      };
      await questionsServices.createQuestion(data);
      message.success("Tạo câu hỏi thành công");
      navigate("/company/quiz");
    } catch (error) {
      message.error("Không thể tạo câu hỏi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="question-form">
      <Card>
        <h2>Tạo câu hỏi mới</h2>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ point: 1 }}
        >
          <Form.Item
            name="content"
            label="Nội dung câu hỏi"
            rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
          >
            <TextArea rows={4} placeholder="Nhập nội dung câu hỏi..." />
          </Form.Item>

          <Form.Item
            name="category"
            label="Danh mục"
            rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
          >
            <Select placeholder="Chọn danh mục">
              {CATEGORIES.map((cat) => (
                <Option key={cat} value={cat}>
                  {cat}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="type"
            label="Loại câu hỏi"
            rules={[{ required: true }]}
          >
            <Select
              value={questionType}
              onChange={setQuestionType}
              placeholder="Chọn loại câu hỏi"
            >
              <Option value="multiple_choice">Trắc nghiệm 1 đáp án</Option>
              <Option value="checkbox">Trắc nghiệm nhiều đáp án</Option>
              <Option value="text">Tự luận</Option>
            </Select>
          </Form.Item>

          {questionType !== "text" && (
            <>
              <Form.Item label="Các lựa chọn">
                {options.map((option) => (
                  <div key={option.id} style={{ marginBottom: 8 }}>
                    <Space>
                      <Input
                        placeholder={`Lựa chọn ${option.id}`}
                        value={option.text}
                        onChange={(e) =>
                          handleOptionChange(option.id, e.target.value)
                        }
                        style={{ width: 400 }}
                      />
                      <Button
                        danger
                        onClick={() => handleRemoveOption(option.id)}
                        disabled={options.length <= 2}
                      >
                        Xóa
                      </Button>
                    </Space>
                  </div>
                ))}
                <Button type="dashed" onClick={handleAddOption}>
                  + Thêm lựa chọn
                </Button>
              </Form.Item>

              <Form.Item label="Đáp án đúng">
                {questionType === "multiple_choice" ? (
                  <Radio.Group
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                  >
                    <Space direction="vertical">
                      {options
                        .filter((o) => o.text)
                        .map((option) => (
                          <Radio key={option.id} value={option.id}>
                            {option.text}
                          </Radio>
                        ))}
                    </Space>
                  </Radio.Group>
                ) : (
                  <Checkbox.Group
                    value={correctAnswer || []}
                    onChange={setCorrectAnswer}
                  >
                    <Space direction="vertical">
                      {options
                        .filter((o) => o.text)
                        .map((option) => (
                          <Checkbox key={option.id} value={option.id}>
                            {option.text}
                          </Checkbox>
                        ))}
                    </Space>
                  </Checkbox.Group>
                )}
              </Form.Item>
            </>
          )}

          {questionType === "text" && (
            <Form.Item
              name="correctAnswerText"
              label="Đáp án đúng (tham khảo)"
            >
              <TextArea rows={3} placeholder="Nhập đáp án đúng..." />
            </Form.Item>
          )}

          <Form.Item
            name="point"
            label="Điểm số"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} max={10} defaultValue={1} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Tạo câu hỏi
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

export default QuestionForm;
