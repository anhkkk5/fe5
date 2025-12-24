import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  message,
  Tabs,
  Spin,
  Pagination,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { questionSetsServices } from "../../services/question-sets/questionSetsServices";
import { quizzesServices } from "../../services/quizzes/quizzesServices";
import { questionsServices } from "../../services/questions/questionsServices";
import BulkQuestionImport from "./BulkQuestionImport";
import "./style.css";

function CompanyQuizManagement() {
  const navigate = useNavigate();
  const [questionSets, setQuestionSets] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [groupedQuestionSets, setGroupedQuestionSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("question-sets");
  const [bulkImportVisible, setBulkImportVisible] = useState(false);
  const [questionSetsPage, setQuestionSetsPage] = useState(1);
  const [quizzesPage, setQuizzesPage] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setQuestionSetsPage(1);
  }, [groupedQuestionSets.length]);

  useEffect(() => {
    setQuizzesPage(1);
  }, [quizzes.length]);

  // Nhóm questions theo skillCategory (category field)
  const groupQuestionsBySkill = (questionsList) => {
    const grouped = {};
    
    questionsList.forEach((question) => {
      const skillCategory = question.category || "Khác";
      
      if (!grouped[skillCategory]) {
        grouped[skillCategory] = {
          skillCategory: skillCategory,
          questions: [],
          count: 0,
        };
      }
      
      grouped[skillCategory].questions.push(question);
      grouped[skillCategory].count += 1;
    });

    // Chuyển đổi thành mảng và xác định category chính
    const CATEGORIES = ["Kỹ năng văn phòng", "Công nghệ", "Kỹ năng mềm"];
    return Object.values(grouped).map((group) => {
      // Xác định category chính dựa trên skillCategory hoặc để mặc định
      // Có thể cần logic phức tạp hơn nếu có mapping
      let mainCategory = "Công nghệ"; // Mặc định
      
      // Có thể thêm logic để map skillCategory -> category nếu cần
      // Ví dụ: Git, HTML, Java -> Công nghệ
      // Word, Excel -> Kỹ năng văn phòng
      
      return {
        id: `skill-${group.skillCategory}`, // ID giả để làm key
        name: group.skillCategory, // Tên danh sách = kỹ năng cụ thể
        category: mainCategory, // Danh mục chính
        skillCategory: group.skillCategory, // Kỹ năng cụ thể
        questions: group.questions, // Danh sách câu hỏi
        questionCount: group.count, // Số câu hỏi
      };
    });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [setsData, quizzesData, questionsData] = await Promise.all([
        questionSetsServices.getAllQuestionSets(),
        quizzesServices.getAllQuizzes(),
        questionsServices.getAllQuestions(),
      ]);
      setQuestionSets(setsData || []);
      setQuizzes(quizzesData || []);
      setQuestions(questionsData || []);
      
      // Nhóm questions theo skillCategory
      const grouped = groupQuestionsBySkill(questionsData || []);
      setGroupedQuestionSets(grouped);
    } catch (error) {
      message.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestionSet = (id) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa danh sách câu hỏi này?",
      onOk: async () => {
        try {
          await questionSetsServices.deleteQuestionSet(id);
          message.success("Xóa thành công");
          loadData();
        } catch (error) {
          message.error("Không thể xóa");
        }
      },
    });
  };

  const handleDeleteQuiz = (id) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa bài test này?",
      onOk: async () => {
        try {
          await quizzesServices.deleteQuiz(id);
          message.success("Xóa thành công");
          loadData();
        } catch (error) {
          message.error("Không thể xóa");
        }
      },
    });
  };

  const handleDeleteQuestion = (id) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa câu hỏi này?",
      onOk: async () => {
        try {
          await questionsServices.deleteQuestion(id);
          message.success("Xóa thành công");
          loadData();
        } catch (error) {
          message.error("Không thể xóa");
        }
      },
    });
  };

  const questionsColumns = [
    {
      title: "Nội dung câu hỏi",
      dataIndex: "content",
      key: "content",
      ellipsis: true,
      render: (text) => (
        <div style={{ maxWidth: 400 }}>
          {text}
        </div>
      ),
    },
    {
      title: "Kỹ năng",
      dataIndex: "category",
      key: "category",
      render: (skill) => skill ? <Tag color="cyan">{skill}</Tag> : "-",
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      render: (type) => {
        const typeMap = {
          multiple_choice: "Trắc nghiệm 1 đáp án",
          checkbox: "Trắc nghiệm nhiều đáp án",
          text: "Tự luận",
        };
        return <Tag>{typeMap[type] || type}</Tag>;
      },
    },
    {
      title: "Số lựa chọn",
      key: "optionsCount",
      render: (_, record) => {
        if (record.type === "text") return "-";
        return record.options?.length || 0;
      },
    },
    {
      title: "Điểm",
      dataIndex: "point",
      key: "point",
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() =>
              navigate(`/company/quiz/questions/${record.id}`)
            }
          >
            Sửa
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteQuestion(record.id)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  const pageSize = 10;
  const paginatedQuestionSets = (Array.isArray(groupedQuestionSets) ? groupedQuestionSets : []).slice(
    (questionSetsPage - 1) * pageSize,
    questionSetsPage * pageSize,
  );

  const paginatedQuizzes = (Array.isArray(quizzes) ? quizzes : []).slice(
    (quizzesPage - 1) * pageSize,
    quizzesPage * pageSize,
  );

  const handleDeleteQuestionGroup = (skillCategory) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc chắn muốn xóa tất cả câu hỏi của kỹ năng "${skillCategory}"?`,
      onOk: async () => {
        try {
          // Lấy tất cả questions có skillCategory này
          const questionsToDelete = questions.filter(
            (q) => q.category === skillCategory
          );
          
          // Xóa từng câu hỏi
          for (const question of questionsToDelete) {
            await questionsServices.deleteQuestion(question.id);
          }
          
          message.success(`Đã xóa ${questionsToDelete.length} câu hỏi`);
          loadData();
        } catch (error) {
          message.error("Không thể xóa");
        }
      },
    });
  };

  const questionSetsColumns = [
    {
      title: "Tên danh sách",
      dataIndex: "name",
      key: "name",
      render: (name) => <strong>{name}</strong>,
    },
    {
      title: "Danh mục",
      dataIndex: "category",
      key: "category",
      render: (category) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: "Kỹ năng",
      dataIndex: "skillCategory",
      key: "skillCategory",
      render: (skill) => skill ? <Tag color="cyan">{skill}</Tag> : "-",
    },
    {
      title: "Số câu hỏi",
      key: "questionCount",
      render: (_, record) => record.questionCount || 0,
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            onClick={() => {
              // Xem chi tiết các câu hỏi trong bộ này
              // Có thể mở modal hoặc navigate đến trang chi tiết
              message.info(`Bộ "${record.skillCategory}" có ${record.questionCount} câu hỏi`);
            }}
          >
            Xem chi tiết
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteQuestionGroup(record.skillCategory)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  const quizzesColumns = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Danh mục",
      dataIndex: "category",
      key: "category",
      render: (category) => <Tag color="green">{category}</Tag>,
    },
    {
      title: "Kỹ năng",
      dataIndex: "skillCategory",
      key: "skillCategory",
      render: (skill) => skill ? <Tag color="cyan">{skill}</Tag> : "-",
    },
    {
      title: "Số câu hỏi",
      key: "questionCount",
      render: (_, record) => record.questions?.length || 0,
    },
    {
      title: "Thời gian (phút)",
      dataIndex: "duration",
      key: "duration",
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/company/quiz/quizzes/${record.id}`)}
          >
            Sửa
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteQuiz(record.id)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="company-quiz-management__loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="company-quiz-management">
      <div className="company-quiz-management__header">
        <h1>Quản lý đánh giá năng lực</h1>
        <Space>
          <Button
            type="primary"
            danger
            icon={<UploadOutlined />}
            onClick={() => setBulkImportVisible(true)}
          >
            Import hàng loạt
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/company/quiz/quizzes/new")}
          >
            Tạo bài test
          </Button>
        </Space>
      </div>

      <BulkQuestionImport
        visible={bulkImportVisible}
        onCancel={() => setBulkImportVisible(false)}
        onSuccess={() => {
          setBulkImportVisible(false);
          loadData();
        }}
      />

      <Tabs
        activeKey={activeTab}
        onChange={(k) => {
          setActiveTab(k);
          if (k === "question-sets") setQuestionSetsPage(1);
          if (k === "quizzes") setQuizzesPage(1);
        }}
        items={[
          {
            key: "question-sets",
            label: "Danh sách câu hỏi (Bộ)",
            children: (
              <>
                <Table
                  dataSource={paginatedQuestionSets}
                  columns={questionSetsColumns}
                  rowKey="id"
                  pagination={false}
                />
                <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
                  <Pagination
                    current={questionSetsPage}
                    pageSize={pageSize}
                    total={(Array.isArray(groupedQuestionSets) ? groupedQuestionSets : []).length}
                    onChange={(p) => setQuestionSetsPage(p)}
                    showSizeChanger={false}
                  />
                </div>
              </>
            ),
          },
          {
            key: "quizzes",
            label: "Bài test",
            children: (
              <>
                <Table
                  dataSource={paginatedQuizzes}
                  columns={quizzesColumns}
                  rowKey="id"
                  pagination={false}
                />
                <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
                  <Pagination
                    current={quizzesPage}
                    pageSize={pageSize}
                    total={(Array.isArray(quizzes) ? quizzes : []).length}
                    onChange={(p) => setQuizzesPage(p)}
                    showSizeChanger={false}
                  />
                </div>
              </>
            ),
          },
        ]}
      />
    </div>
  );
}

export default CompanyQuizManagement;

