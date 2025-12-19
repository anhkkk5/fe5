import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Button, Spin, Tag, Progress, message } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { quizzesServices } from "../../services/quizzes/quizzesServices";
import "./result.css";

function Result() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResult();
  }, [id]);

  const loadResult = async () => {
    try {
      setLoading(true);
      const [resultData, quizData] = await Promise.all([
        quizzesServices.getQuizResult(id),
        quizzesServices.getQuizById(id),
      ]);
      setAttempt(resultData);
      setQuiz(quizData);
    } catch (error) {
      message.error("Không thể tải kết quả");
      navigate("/skill-assessment");
    } finally {
      setLoading(false);
    }
  };

  const getQuestionResult = (questionId) => {
    const userAnswer = attempt?.answers?.[questionId.toString()];
    const question = quiz?.questions?.find((q) => q.id === questionId);
    if (!question) return null;

    const correctAnswer = question.correctAnswer;
    let isCorrect = false;

    if (Array.isArray(correctAnswer) && Array.isArray(userAnswer)) {
      isCorrect =
        correctAnswer.length === userAnswer.length &&
        correctAnswer.every((ans) => userAnswer.includes(ans));
    } else {
      isCorrect = correctAnswer === userAnswer;
    }

    return {
      question,
      userAnswer,
      correctAnswer,
      isCorrect,
    };
  };

  if (loading) {
    return (
      <div className="result__loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!attempt || !quiz) {
    return null;
  }

  const score = parseFloat(attempt.score || 0);
  const scorePercent = (score / 10) * 100;
  const getScoreColor = () => {
    if (score >= 8) return "#16a34a";
    if (score >= 6) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className="result">
      <div className="result__header">
        <h1>Kết quả bài thi</h1>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/skill-assessment")}
        >
          Quay lại
        </Button>
      </div>

      <Card className="result__summary">
        <div className="result__score">
          <div className="result__score-circle">
            <Progress
              type="circle"
              percent={scorePercent}
              format={() => `${score.toFixed(1)}`}
              strokeColor={getScoreColor()}
              size={120}
            />
            <div className="result__score-label">Điểm số / 10</div>
          </div>
          <div className="result__score-details">
            <h2>{quiz.title}</h2>
            <div className="result__score-stats">
              <div>
                <strong>{attempt.correctAnswers}</strong>
                <span>câu đúng</span>
              </div>
              <div>
                <strong>{attempt.totalQuestions - attempt.correctAnswers}</strong>
                <span>câu sai</span>
              </div>
              <div>
                <strong>{attempt.totalQuestions}</strong>
                <span>tổng câu hỏi</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="result__questions">
        <h2>Chi tiết câu trả lời</h2>
        {quiz.questions?.map((question, index) => {
          const result = getQuestionResult(question.id);
          if (!result) return null;

          return (
            <Card
              key={question.id}
              className={`result__question-card ${
                result.isCorrect
                  ? "result__question-card--correct"
                  : "result__question-card--incorrect"
              }`}
            >
              <div className="result__question-header">
                <span className="result__question-number">Câu {index + 1}</span>
                {result.isCorrect ? (
                  <Tag color="success" icon={<CheckCircleOutlined />}>
                    Đúng
                  </Tag>
                ) : (
                  <Tag color="error" icon={<CloseCircleOutlined />}>
                    Sai
                  </Tag>
                )}
              </div>
              <div className="result__question-content">{question.content}</div>

              <div className="result__answer-section">
                <div className="result__answer-item">
                  <strong>Đáp án của bạn:</strong>
                  <div className="result__answer-value">
                    {Array.isArray(result.userAnswer)
                      ? question.options
                          ?.filter((opt) =>
                            result.userAnswer.includes(opt.id)
                          )
                          .map((opt) => opt.text)
                          .join(", ") || "Không trả lời"
                      : result.userAnswer || "Không trả lời"}
                  </div>
                </div>
                {!result.isCorrect && (
                  <div className="result__answer-item">
                    <strong>Đáp án đúng:</strong>
                    <div className="result__answer-value result__answer-value--correct">
                      {Array.isArray(result.correctAnswer)
                        ? question.options
                            ?.filter((opt) =>
                              result.correctAnswer.includes(opt.id)
                            )
                            .map((opt) => opt.text)
                            .join(", ")
                        : result.correctAnswer}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default Result;
