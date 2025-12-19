import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Radio,
  Checkbox,
  Button,
  Input,
  Spin,
  message,
  Progress,
  Space,
} from "antd";
import { quizzesServices } from "../../services/quizzes/quizzesServices";
import "./takeQuiz.css";

const { TextArea } = Input;

function TakeQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    loadQuiz();
  }, [id]);

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleSubmit(true);
    }
  }, [timeLeft]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      const data = await quizzesServices.getQuizById(id);
      setQuiz(data);
      setTimeLeft(data.duration * 60);
      const initialAnswers = {};
      data.questions?.forEach((q) => {
        if (q.type === "checkbox") {
          initialAnswers[q.id] = [];
        } else {
          initialAnswers[q.id] = "";
        }
      });
      setAnswers(initialAnswers);
    } catch (error) {
      message.error("Không thể tải bài test");
      navigate("/skill-assessment");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (autoSubmit) {
      message.warning("Hết thời gian làm bài!");
    }

    try {
      setSubmitting(true);
      await quizzesServices.submitQuiz(id, answers);
      message.success("Nộp bài thành công!");
      navigate(`/skill-assessment/result/${id}`);
    } catch (error) {
      message.error("Không thể nộp bài");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="take-quiz__loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!quiz) {
    return null;
  }

  const progress = quiz.questions
    ? (Object.keys(answers).filter((k) => {
        const ans = answers[k];
        return Array.isArray(ans) ? ans.length > 0 : ans !== "";
      }).length /
        quiz.questions.length) *
      100
    : 0;

  return (
    <div className="take-quiz">
      <div className="take-quiz__header">
        <h1>{quiz.title}</h1>
        <div className="take-quiz__timer">
          <Space>
            <span>Thời gian còn lại:</span>
            <strong
              style={{
                color: timeLeft < 300 ? "#ff4d4f" : "#16a34a",
                fontSize: "18px",
              }}
            >
              {formatTime(timeLeft)}
            </strong>
          </Space>
        </div>
      </div>

      <div className="take-quiz__progress">
        <Progress percent={Math.round(progress)} status="active" />
        <span>
          {Object.keys(answers).filter((k) => {
            const ans = answers[k];
            return Array.isArray(ans) ? ans.length > 0 : ans !== "";
          }).length}{" "}
          / {quiz.questions?.length || 0} câu đã trả lời
        </span>
      </div>

      <div className="take-quiz__questions">
        {quiz.questions?.map((question, index) => (
          <Card key={question.id} className="take-quiz__question-card">
            <div className="take-quiz__question-header">
              <span className="take-quiz__question-number">
                Câu {index + 1}
              </span>
              <span className="take-quiz__question-point">
                ({question.point} điểm)
              </span>
            </div>
            <div className="take-quiz__question-content">
              {question.content}
            </div>

            {question.type === "multiple_choice" && (
              <Radio.Group
                value={answers[question.id]}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              >
                <Space direction="vertical" style={{ width: "100%" }}>
                  {question.options?.map((option) => (
                    <Radio key={option.id} value={option.id}>
                      {option.text}
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            )}

            {question.type === "checkbox" && (
              <Checkbox.Group
                value={answers[question.id] || []}
                onChange={(values) => handleAnswerChange(question.id, values)}
              >
                <Space direction="vertical" style={{ width: "100%" }}>
                  {question.options?.map((option) => (
                    <Checkbox key={option.id} value={option.id}>
                      {option.text}
                    </Checkbox>
                  ))}
                </Space>
              </Checkbox.Group>
            )}

            {question.type === "text" && (
              <TextArea
                rows={4}
                value={answers[question.id] || ""}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder="Nhập câu trả lời của bạn..."
              />
            )}
          </Card>
        ))}
      </div>

      <div className="take-quiz__actions">
        <Button
          type="primary"
          size="large"
          loading={submitting}
          onClick={() => handleSubmit(false)}
        >
          Nộp bài
        </Button>
      </div>
    </div>
  );
}

export default TakeQuiz;

