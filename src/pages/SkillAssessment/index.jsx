import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Select, Button, Spin, Empty, Tag, message, Space } from "antd";
import {
  CheckCircleOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { quizzesServices } from "../../services/quizzes/quizzesServices";
import "./style.css";

const { Option } = Select;

const CATEGORIES = [
  "Kỹ năng văn phòng",
  "Công nghệ",
  "Kỹ năng mềm",
];

function SkillAssessment() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [completionFilter, setCompletionFilter] = useState("all");
  const [attempts, setAttempts] = useState([]);

  useEffect(() => {
    loadData();
  }, [categoryFilter, completionFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [quizzesData, resultsData] = await Promise.all([
        quizzesServices.getQuizzesForCandidate(
          categoryFilter || null,
          completionFilter
        ),
        quizzesServices.getMyResults(),
      ]);
      setQuizzes(quizzesData || []);
      setAttempts(resultsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      message.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyText = (quiz) => {
    const count = quiz.questions?.length || 0;
    if (count <= 10) return "Cơ bản";
    if (count <= 20) return "Trung bình";
    return "Nâng cao";
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "cơ bản":
      case "basic":
        return "green";
      case "trung bình":
      case "average":
        return "orange";
      case "nâng cao":
      case "advanced":
        return "red";
      default:
        return "blue";
    }
  };

  const hasCompleted = (quizId) => {
    return attempts.some((attempt) => attempt.quiz?.id === quizId);
  };

  const getAttemptInfo = (quizId) => {
    return attempts.find((attempt) => attempt.quiz?.id === quizId);
  };

  const handleStartQuiz = (quizId) => {
    navigate(`/skill-assessment/take/${quizId}`);
  };

  const handleViewResult = (quizId) => {
    navigate(`/skill-assessment/result/${quizId}`);
  };

  const handleRetakeQuiz = async (quizId) => {
    try {
      await quizzesServices.deleteAttempt(quizId);
      message.success("Đã xóa bài làm cũ. Bạn có thể làm lại bài test.");
      loadData();
    } catch (error) {
      console.error("Error deleting attempt:", error);
      message.error("Không thể xóa bài làm cũ");
    }
  };

  return (
    <div className="skill-assessment">
      <div className="skill-assessment__header">
        <h1>Đánh giá năng lực</h1>
        <p>Kiểm tra và nâng cao kỹ năng của bạn</p>
      </div>

      <div className="skill-assessment__filters">
        <div className="skill-assessment__filter-group">
          <label>Danh mục:</label>
          <Select
            placeholder="Tất cả kỹ năng"
            value={categoryFilter}
            onChange={setCategoryFilter}
            style={{ width: 200 }}
            allowClear
          >
            {CATEGORIES.map((cat) => (
              <Option key={cat} value={cat}>
                {cat}
              </Option>
            ))}
          </Select>
        </div>

        <div className="skill-assessment__filter-group">
          <label>Trạng thái:</label>
          <Select
            value={completionFilter}
            onChange={setCompletionFilter}
            style={{ width: 200 }}
          >
            <Option value="all">Tất cả</Option>
            <Option value="completed">Đã hoàn thành</Option>
            <Option value="not_completed">Chưa hoàn thành</Option>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="skill-assessment__loading">
          <Spin size="large" />
        </div>
      ) : quizzes.length === 0 ? (
        <Empty description="Không có bài test nào" />
      ) : (
        <div className="skill-assessment__grid">
          {quizzes.map((quiz) => {
            const completed = hasCompleted(quiz.id);
            const attempt = getAttemptInfo(quiz.id);
            const difficulty = getDifficultyText(quiz);
            const questionCount = quiz.questions?.length || 0;

            return (
              <Card
                key={quiz.id}
                className="skill-assessment__card"
                hoverable
                cover={
                  <div className="skill-assessment__card-cover">
                    {quiz.imageUrl ? (
                      <img
                        src={quiz.imageUrl}
                        alt={quiz.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div className="skill-assessment__card-image">
                        <PlayCircleOutlined />
                      </div>
                    )}
                  </div>
                }
                actions={[
                  completed ? (
                    <Space direction="vertical" style={{ width: "100%", padding: "8px" }}>
                      <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleViewResult(quiz.id)}
                        block
                      >
                        Xem kết quả
                      </Button>
                      <Button
                        onClick={() => handleRetakeQuiz(quiz.id)}
                        block
                      >
                        Làm lại
                      </Button>
                    </Space>
                  ) : (
                    <Button
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      onClick={() => handleStartQuiz(quiz.id)}
                      block
                    >
                      Làm bài thi →
                    </Button>
                  ),
                ]}
              >
                <div className="skill-assessment__card-content">
                  <h3>{quiz.title}</h3>
                  <div className="skill-assessment__card-meta">
                    <Tag color="blue">{quiz.category}</Tag>
                    {quiz.skillCategory && (
                      <Tag color="cyan">{quiz.skillCategory}</Tag>
                    )}
                    <Tag color={getDifficultyColor(difficulty)}>
                      {difficulty}
                    </Tag>
                    <span>{questionCount} câu hỏi</span>
                    <span>{quiz.duration} phút</span>
                  </div>
                  {quiz.description && (
                    <p className="skill-assessment__card-description">
                      {quiz.description}
                    </p>
                  )}
                  {completed && attempt && (
                    <div className="skill-assessment__card-score">
                      <strong>Điểm: {parseFloat(attempt.score).toFixed(1)}/10</strong>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SkillAssessment;

