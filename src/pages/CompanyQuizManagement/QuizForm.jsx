import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Card,
  Space,
  message,
  Spin,
  Checkbox,
  Divider,
  Upload,
} from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import { quizzesServices } from "../../services/quizzes/quizzesServices";
import { questionSetsServices } from "../../services/question-sets/questionSetsServices";
import { questionsServices } from "../../services/questions/questionsServices";
import { uploadImage, deleteImage } from "../../services/Cloudinary/cloudinaryServices";
import "./quizForm.css";

const { Option } = Select;
const { TextArea } = Input;

const CATEGORIES = [
  "Kỹ năng văn phòng",
  "Công nghệ",
  "Kỹ năng mềm",
];

function QuizForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [questionSets, setQuestionSets] = useState([]);
  const [selectedQuestionSets, setSelectedQuestionSets] = useState([]);
  const [questionsFromSets, setQuestionsFromSets] = useState([]);
  const [category, setCategory] = useState("");
  const [skillCategory, setSkillCategory] = useState("");
  const [skillCategories, setSkillCategories] = useState([]);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);

  const isEdit = id && id !== "new";

  useEffect(() => {
    if (isEdit) {
      loadQuiz();
    }
  }, [id]);

  useEffect(() => {
    if (category) {
      loadQuestionSets();
      loadSkillCategories();
    }
  }, [category]);

  useEffect(() => {
    if (selectedQuestionSets.length > 0) {
      loadQuestionsFromSets();
    } else {
      setQuestionsFromSets([]);
    }
  }, [selectedQuestionSets]);

  useEffect(() => {
    // Chỉ tự động load khi skillCategory thay đổi và không phải đang load quiz
    // Khi load quiz, sẽ gọi trực tiếp loadQuestionsBySkill trong loadQuiz
    if (skillCategory && !isLoadingQuiz) {
      loadQuestionsBySkill([]);
    } else if (!skillCategory && !isLoadingQuiz) {
      setAvailableQuestions([]);
      // Chỉ reset selectedQuestionIds nếu không phải đang edit
      if (!isEdit) {
        setSelectedQuestionIds([]);
      }
    }
  }, [skillCategory, isLoadingQuiz]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      setIsLoadingQuiz(true);
      const data = await quizzesServices.getQuizById(id);
      form.setFieldsValue({
        title: data.title,
        description: data.description,
        duration: data.duration,
        category: data.category,
        skillCategory: data.skillCategory,
        imageUrl: data.imageUrl,
      });
      setCategory(data.category);
      setImageUrl(data.imageUrl || "");
      
      // Load lại các câu hỏi đã chọn
      let questionIds = [];
      if (data.questions && data.questions.length > 0) {
        questionIds = data.questions.map(q => q.id);
      }
      
      // Nếu có skillCategory, set nó và load questions với questionIds đã chọn
      if (data.skillCategory) {
        setSkillCategory(data.skillCategory);
        // Gọi trực tiếp loadQuestionsBySkill với questionIds để set lại các câu hỏi đã chọn
        if (questionIds.length > 0) {
          await loadQuestionsBySkill(questionIds);
        } else {
          await loadQuestionsBySkill([]);
        }
      } else if (questionIds.length > 0) {
        // Nếu không có skillCategory, set questionIds trực tiếp
        setSelectedQuestionIds(questionIds);
      }
      
      setIsLoadingQuiz(false);
      
      setLoading(false);
    } catch (error) {
      message.error("Không thể tải dữ liệu");
      navigate("/company/quiz");
      setIsLoadingQuiz(false);
    }
  };

  const handleImageUpload = async (file) => {
    try {
      setUploading(true);
      const result = await uploadImage(file, "quizzes");
      if (result && result.url) {
        setImageUrl(result.url);
        form.setFieldsValue({ imageUrl: result.url });
        message.success("Upload ảnh thành công");
        return false; // Prevent default upload
      } else {
        message.error("Upload ảnh thất bại");
        return false;
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      message.error("Không thể upload ảnh");
      return false;
    } finally {
      setUploading(false);
    }
  };

  const handleImageRemove = async () => {
    if (imageUrl && imageUrl.includes("cloudinary.com")) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = imageUrl.split("/");
        const uploadIndex = urlParts.findIndex((part) => part === "upload");
        if (uploadIndex !== -1 && uploadIndex + 1 < urlParts.length) {
          const versionIndex = uploadIndex + 1;
          const folderAndFile = urlParts.slice(versionIndex + 1).join("/");
          const publicId = folderAndFile.split(".")[0];
          await deleteImage(publicId);
        }
      } catch (error) {
        console.error("Error deleting image:", error);
      }
    }
    setImageUrl("");
    form.setFieldsValue({ imageUrl: "" });
  };

  const loadQuestionSets = async () => {
    try {
      setLoadingData(true);
      const data = await questionSetsServices.getAllQuestionSets(category);
      setQuestionSets(data || []);
    } catch (error) {
      message.error("Không thể tải danh sách câu hỏi");
    } finally {
      setLoadingData(false);
    }
  };

  const loadSkillCategories = async () => {
    try {
      setLoadingSkills(true);
      const data = await questionsServices.getSkillCategories();
      setSkillCategories(data || []);
    } catch (error) {
      console.error("Error loading skill categories:", error);
      setSkillCategories([]);
    } finally {
      setLoadingSkills(false);
    }
  };

  const loadQuestionsBySkill = async (preselectedIds = []) => {
    try {
      setLoadingData(true);
      const data = await questionsServices.getQuestionsBySkill(skillCategory);
      setAvailableQuestions(data || []);
      
      // Nếu có preselectedIds, set lại selectedQuestionIds
      if (preselectedIds.length > 0) {
        // Chỉ lấy các IDs có trong availableQuestions
        const validIds = preselectedIds.filter(id => 
          data.some(q => q.id === id)
        );
        if (validIds.length > 0) {
          setSelectedQuestionIds(validIds);
        }
      } else if (preselectedIds.length === 0 && !isLoadingQuiz) {
        // Chỉ reset nếu không có preselectedIds và không phải đang load quiz
        setSelectedQuestionIds([]);
      }
    } catch (error) {
      console.error("Error loading questions by skill:", error);
      message.error("Không thể tải câu hỏi theo kỹ năng");
      setAvailableQuestions([]);
    } finally {
      setLoadingData(false);
    }
  };

  const loadQuestionsFromSets = async () => {
    try {
      setLoadingData(true);
      const allQuestionsFromSets = [];
      for (const setId of selectedQuestionSets) {
        const questions = await questionSetsServices.getQuestionsFromSet(setId);
        allQuestionsFromSets.push(...(questions || []));
      }
      const uniqueQuestions = Array.from(
        new Map(allQuestionsFromSets.map((q) => [q.id, q])).values()
      );
      setQuestionsFromSets(uniqueQuestions);
    } catch (error) {
      message.error("Không thể tải câu hỏi từ danh sách");
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (values) => {
    // Phải chọn ít nhất một trong hai: questionSets hoặc questions trực tiếp
    if (selectedQuestionSets.length === 0 && selectedQuestionIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất một danh sách câu hỏi hoặc câu hỏi riêng lẻ");
      return;
    }

    try {
      setLoading(true);
      const data = {
        ...values,
        imageUrl: imageUrl || undefined,
        questionSetIds: selectedQuestionSets.length > 0 ? selectedQuestionSets : undefined,
        questionIds: selectedQuestionIds.length > 0 ? selectedQuestionIds : undefined,
      };

      if (isEdit) {
        await quizzesServices.updateQuiz(id, data);
        message.success("Cập nhật thành công");
      } else {
        await quizzesServices.createQuiz(data);
        message.success("Tạo thành công");
      }
      navigate("/company/quiz");
    } catch (error) {
      console.error("Error saving quiz:", error);
      message.error("Không thể lưu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="quiz-form">
      <Card>
        <h2>{isEdit ? "Sửa bài test" : "Tạo bài test mới"}</h2>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ duration: 30, category: "" }}
        >
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
          >
            <Input placeholder="VD: Bài test Git cơ bản" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <TextArea rows={3} placeholder="Mô tả về bài test" />
          </Form.Item>

          <Form.Item name="imageUrl" label="Ảnh bài test">
            <div>
              {imageUrl ? (
                <div style={{ marginBottom: 16 }}>
                  <img
                    src={imageUrl}
                    alt="Quiz preview"
                    style={{
                      width: "100%",
                      maxWidth: 400,
                      height: 200,
                      objectFit: "cover",
                      borderRadius: 8,
                      marginBottom: 8,
                    }}
                  />
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleImageRemove}
                  >
                    Xóa ảnh
                  </Button>
                </div>
              ) : (
                <Upload
                  beforeUpload={handleImageUpload}
                  showUploadList={false}
                  accept="image/*"
                >
                  <Button icon={<UploadOutlined />} loading={uploading}>
                    Upload ảnh
                  </Button>
                </Upload>
              )}
            </div>
          </Form.Item>

          <Form.Item
            name="duration"
            label="Thời gian làm bài (phút)"
            rules={[{ required: true, message: "Vui lòng nhập thời gian" }]}
          >
            <InputNumber min={1} max={300} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="category"
            label="Danh mục"
            rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
          >
            <Select
              placeholder="Chọn danh mục"
              onChange={(value) => {
                setCategory(value);
                setSelectedQuestionSets([]);
                setSkillCategory("");
                form.setFieldsValue({ skillCategory: undefined });
                setAvailableQuestions([]);
                setSelectedQuestionIds([]);
              }}
            >
              {CATEGORIES.map((cat) => (
                <Option key={cat} value={cat}>
                  {cat}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {category && (
            <Form.Item
              name="skillCategory"
              label="Kỹ năng cụ thể"
              rules={[{ required: true, message: "Vui lòng chọn kỹ năng cụ thể" }]}
            >
              <Select
                placeholder="Chọn kỹ năng cụ thể"
                loading={loadingSkills}
                onChange={(value) => {
                  setSkillCategory(value);
                  // Chỉ reset selectedQuestionIds nếu không phải đang load quiz
                  if (!isLoadingQuiz) {
                    setSelectedQuestionIds([]);
                  }
                }}
                allowClear
              >
                {skillCategories.map((skill) => (
                  <Option key={skill} value={skill}>
                    {skill}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {skillCategory && availableQuestions.length > 0 && (
            <>
              <Divider>Chọn câu hỏi từ kỹ năng "{skillCategory}"</Divider>
              <div className="quiz-form__questions">
                <h3>
                  Danh sách câu hỏi ({selectedQuestionIds.length} đã chọn / {availableQuestions.length} tổng cộng)
                </h3>
                <Checkbox.Group
                  value={selectedQuestionIds}
                  onChange={setSelectedQuestionIds}
                  style={{ width: "100%" }}
                >
                  <Space direction="vertical" style={{ width: "100%" }}>
                    {availableQuestions.map((q) => (
                      <Checkbox key={q.id} value={q.id}>
                        <div style={{ marginLeft: 8 }}>
                          <div style={{ fontWeight: 500 }}>{q.content}</div>
                          {q.options && Array.isArray(q.options) && (
                            <div style={{ fontSize: "12px", color: "#666", marginTop: 4 }}>
                              {q.options.length} lựa chọn
                            </div>
                          )}
                        </div>
                      </Checkbox>
                    ))}
                  </Space>
                </Checkbox.Group>
              </div>
            </>
          )}

          {skillCategory && availableQuestions.length === 0 && !loadingData && (
            <div style={{ padding: "16px", background: "#f5f5f5", borderRadius: "4px", marginBottom: "16px" }}>
              <p>Chưa có câu hỏi nào cho kỹ năng "{skillCategory}". Vui lòng import câu hỏi trước.</p>
            </div>
          )}

          {category && (
            <>
              <Divider>Hoặc chọn danh sách câu hỏi</Divider>

              <div className="quiz-form__question-sets">
                <h3>
                  Danh sách câu hỏi ({selectedQuestionSets.length} đã chọn)
                </h3>
                {loadingData ? (
                  <Spin />
                ) : questionSets.length === 0 ? (
                  <p>Chưa có danh sách câu hỏi nào cho {category}</p>
                ) : (
                  <Checkbox.Group
                    value={selectedQuestionSets}
                    onChange={setSelectedQuestionSets}
                    style={{ width: "100%" }}
                  >
                    <Space direction="vertical" style={{ width: "100%" }}>
                      {questionSets.map((set) => (
                        <Checkbox key={set.id} value={set.id}>
                          {set.name} ({set.questions?.length || 0} câu hỏi)
                        </Checkbox>
                      ))}
                    </Space>
                  </Checkbox.Group>
                )}
              </div>

              {questionsFromSets.length > 0 && (
                <>
                  <Divider>
                    Câu hỏi từ danh sách đã chọn ({questionsFromSets.length}{" "}
                    câu)
                  </Divider>
                  <div className="quiz-form__questions-preview">
                    <ul>
                      {questionsFromSets.map((q) => (
                        <li key={q.id}>{q.content}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </>
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

export default QuizForm;
