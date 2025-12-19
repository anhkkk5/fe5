import { useState } from "react";
import {
  Modal,
  Input,
  Button,
  Form,
  Select,
  message,
  Table,
  Space,
  Typography,
  Card,
  Alert,
} from "antd";
import { UploadOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { questionsServices } from "../../services/questions/questionsServices";

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const CATEGORIES = [
  "Kỹ năng văn phòng",
  "Công nghệ",
  "Kỹ năng mềm",
];

// Parse text thành các câu hỏi
function parseQuestions(text) {
  const questions = [];
  const lines = text.split("\n").map((line) => line.trim()).filter((line) => line);

  let currentQuestion = null;
  let currentOptions = [];
  let currentAnswer = null;
  let isCollectingQuestion = false;
  let isCollectingOptions = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Kiểm tra xem có phải là câu hỏi mới không (bắt đầu bằng số)
    const questionMatch = line.match(/^(\d+)\.\s*(.+)$/);
    if (questionMatch) {
      // Lưu câu hỏi trước đó nếu có
      if (currentQuestion) {
        questions.push({
          content: currentQuestion.trim(),
          options: currentOptions,
          correctAnswer: currentAnswer,
        });
      }

      // Bắt đầu câu hỏi mới
      currentQuestion = questionMatch[2];
      currentOptions = [];
      currentAnswer = null;
      isCollectingQuestion = true;
      isCollectingOptions = false;
      continue;
    }

    // Kiểm tra xem có phải là lựa chọn không (A., B., C., ...)
    const optionMatch = line.match(/^([A-Z])\.\s*(.+)$/);
    if (optionMatch) {
      isCollectingQuestion = false;
      isCollectingOptions = true;
      const optionLetter = optionMatch[1];
      const optionText = optionMatch[2];
      currentOptions.push({
        letter: optionLetter,
        text: optionText,
      });
      continue;
    }

    // Kiểm tra xem có phải là đáp án đúng không (nhiều format)
    const answerMatch1 = line.match(/^Đáp án đúng:\s*([A-Z])(?:\s*\((.+)\))?/);
    const answerMatch2 = line.match(/^Đáp án đúng:\s*([A-Z])/);
    const answerMatch = answerMatch1 || answerMatch2;
    if (answerMatch) {
      isCollectingQuestion = false;
      isCollectingOptions = false;
      currentAnswer = answerMatch[1];
      continue;
    }

    // Nếu đang thu thập câu hỏi (sau khi gặp số thứ tự nhưng chưa gặp lựa chọn)
    if (isCollectingQuestion && !isCollectingOptions && currentQuestion) {
      currentQuestion += " " + line;
      continue;
    }

    // Nếu đang thu thập lựa chọn (sau khi gặp lựa chọn nhưng chưa gặp đáp án)
    if (isCollectingOptions && currentOptions.length > 0) {
      // Có thể là phần tiếp theo của lựa chọn trước đó
      const lastOption = currentOptions[currentOptions.length - 1];
      lastOption.text += " " + line;
      continue;
    }
  }

  // Lưu câu hỏi cuối cùng
  if (currentQuestion) {
    questions.push({
      content: currentQuestion.trim(),
      options: currentOptions,
      correctAnswer: currentAnswer,
    });
  }

  return questions;
}

function BulkQuestionImport({ visible, onCancel, onSuccess }) {
  const [form] = Form.useForm();
  const [text, setText] = useState("");
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  const handleParse = () => {
    if (!text.trim()) {
      message.warning("Vui lòng nhập nội dung câu hỏi");
      return;
    }

    try {
      const questions = parseQuestions(text);
      console.log("Raw parsed questions:", questions);
      
      if (questions.length === 0) {
        message.warning("Không tìm thấy câu hỏi nào. Vui lòng kiểm tra lại format.");
        return;
      }

      // Validate questions
      const validQuestions = questions.filter((q) => {
        if (!q.content || q.content.trim() === "") return false;
        if (!q.options || q.options.length < 2) return false;
        if (!q.correctAnswer) return false;
        return true;
      });

      console.log("Valid questions:", validQuestions);
      console.log("Valid questions count:", validQuestions.length);

      if (validQuestions.length === 0) {
        message.warning("Không có câu hỏi hợp lệ nào được tìm thấy.");
        setParsedQuestions([]);
        return;
      }

      setParsedQuestions(validQuestions);
      setPreviewVisible(true);
      message.success(`Đã parse được ${validQuestions.length} câu hỏi. Bạn có thể xem trước và tạo câu hỏi.`);
      console.log("Parsed questions state set:", validQuestions.length);
    } catch (error) {
      console.error("Error parsing questions:", error);
      message.error("Có lỗi xảy ra khi parse câu hỏi");
      setParsedQuestions([]);
    }
  };

  const handleSubmit = async (values) => {
    if (parsedQuestions.length === 0) {
      message.warning("Vui lòng parse câu hỏi trước");
      return;
    }

    try {
      setLoading(true);
      const { category, skillCategory } = values;

      // Tạo từng câu hỏi
      const createdQuestions = [];
      const errors = [];
      
      for (const q of parsedQuestions) {
        // Chuyển đổi options thành format phù hợp với backend
        const options = q.options.map((opt, index) => ({
          id: index + 1,
          text: opt.text,
        }));

        // Tìm ID của đáp án đúng
        const correctAnswerId = q.options.findIndex(
          (opt) => opt.letter === q.correctAnswer
        ) + 1;

        if (correctAnswerId === 0) {
          errors.push(`Câu hỏi "${q.content.substring(0, 50)}...": Không tìm thấy đáp án đúng`);
          continue;
        }

        // Backend chỉ nhận category (string), không có skillCategory
        // Lưu skillCategory vào category field
        const questionData = {
          content: q.content,
          type: "multiple_choice",
          options: options,
          correctAnswer: correctAnswerId,
          category: skillCategory || category, // Lưu skillCategory vào category field
          point: 1,
        };

        try {
          console.log("Creating question with data:", questionData);
          const created = await questionsServices.createQuestion(questionData);
          createdQuestions.push(created);
        } catch (error) {
          console.error(`Error creating question: ${q.content}`, error);
          console.error("Error details:", error?.response?.data);
          const errorMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message || "Lỗi không xác định";
          errors.push(`Câu hỏi "${q.content.substring(0, 50)}...": ${errorMsg}`);
        }
      }

      if (createdQuestions.length > 0) {
        message.success(`Đã tạo thành công ${createdQuestions.length}/${parsedQuestions.length} câu hỏi`);
      }
      
      if (errors.length > 0) {
        console.error("Errors:", errors);
        message.warning(`${errors.length} câu hỏi không thể tạo. Xem console để biết chi tiết.`);
      }

      if (createdQuestions.length > 0) {
        onSuccess && onSuccess();
        handleCancel();
      }
    } catch (error) {
      console.error("Error submitting questions:", error);
      const errorMsg = error?.response?.data?.message || error?.message || "Có lỗi xảy ra khi tạo câu hỏi";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setText("");
    setParsedQuestions([]);
    setPreviewVisible(false);
    form.resetFields();
    onCancel && onCancel();
  };

  const previewColumns = [
    {
      title: "STT",
      key: "index",
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Nội dung câu hỏi",
      dataIndex: "content",
      key: "content",
      ellipsis: true,
    },
    {
      title: "Số lựa chọn",
      key: "optionsCount",
      width: 100,
      render: (_, record) => record.options?.length || 0,
    },
    {
      title: "Đáp án đúng",
      key: "correctAnswer",
      width: 120,
      render: (_, record) => (
        <Text strong style={{ color: "#52c41a" }}>
          {record.correctAnswer}
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 100,
      render: (_, record) => {
        const isValid =
          record.content &&
          record.options &&
          record.options.length >= 2 &&
          record.correctAnswer;
        return isValid ? (
          <CheckOutlined style={{ color: "#52c41a" }} />
        ) : (
          <CloseOutlined style={{ color: "#ff4d4f" }} />
        );
      },
    },
  ];

  return (
    <Modal
      title="Import hàng loạt câu hỏi"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={900}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Alert
          message="Hướng dẫn format"
          description={
            <div>
              <p>Format câu hỏi:</p>
              <pre style={{ background: "#f5f5f5", padding: "8px", borderRadius: "4px" }}>
                {`1. Câu hỏi của bạn?
A. Lựa chọn A
B. Lựa chọn B
C. Lựa chọn C

Đáp án đúng: B (giải thích)`}
              </pre>
            </div>
          }
          type="info"
          style={{ marginBottom: 16 }}
        />

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
          name="skillCategory"
          label="Kỹ năng cụ thể"
          rules={[{ required: true, message: "Vui lòng nhập kỹ năng cụ thể" }]}
        >
          <Input placeholder="Ví dụ: Git, Word, Excel" />
        </Form.Item>

        <Form.Item label="Nội dung câu hỏi (dán text vào đây)">
          <TextArea
            rows={12}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Dán nội dung câu hỏi vào đây..."
            style={{ fontFamily: "monospace" }}
          />
        </Form.Item>

        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={handleParse} icon={<UploadOutlined />}>
            Parse câu hỏi
          </Button>
          {parsedQuestions.length > 0 && (
            <Text type="secondary">
              Đã parse được {parsedQuestions.length} câu hỏi
            </Text>
          )}
        </Space>

        {previewVisible && parsedQuestions.length > 0 && (
          <Card
            title="Xem trước câu hỏi"
            style={{ marginBottom: 16 }}
            extra={
              <Button
                size="small"
                onClick={() => setPreviewVisible(false)}
              >
                Ẩn
              </Button>
            }
          >
            <Table
              dataSource={parsedQuestions}
              columns={previewColumns}
              rowKey={(_, index) => index}
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        )}

        <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
          <Space>
            <Button onClick={handleCancel}>Hủy</Button>
            <Button
              type="primary"
              loading={loading}
              disabled={parsedQuestions.length === 0 || loading}
              onClick={async () => {
                if (parsedQuestions.length === 0) {
                  message.warning("Vui lòng parse câu hỏi trước");
                  return;
                }
                
                // Validate form trước khi submit
                try {
                  const values = await form.validateFields();
                  await handleSubmit(values);
                } catch (error) {
                  if (error.errorFields) {
                    message.warning("Vui lòng điền đầy đủ thông tin danh mục và kỹ năng");
                  }
                }
              }}
            >
              {parsedQuestions.length > 0 
                ? `Tạo ${parsedQuestions.length} câu hỏi` 
                : "Vui lòng parse câu hỏi trước"}
            </Button>
          </Space>
        </Form.Item>
        
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ marginTop: 8, fontSize: '12px', color: '#999' }}>
            Debug: parsedQuestions.length = {parsedQuestions.length}
          </div>
        )}
      </Form>
    </Modal>
  );
}

export default BulkQuestionImport;

