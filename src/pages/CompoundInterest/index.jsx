import React from "react";
import { Row, Col, Card, InputNumber, Select, Button, Typography, Divider } from "antd";
import "./style.css";

const { Title, Text } = Typography;

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const calculateCompoundInterest = ({ principal, monthly, years, rate, frequency }) => {
  const P = Number(principal || 0);
  const PMT = Number(monthly || 0);
  const r = Number(rate || 0) / 100;
  const nMap = {
    yearly: 1,
    quarterly: 4,
    monthly: 12,
    daily: 365,
  };
  const n = nMap[frequency] || 1;
  const t = Number(years || 0);

  if (r <= 0 || t <= 0 || (!P && !PMT)) {
    return {
      futureValue: 0,
      totalContribution: 0,
      interest: 0,
    };
  }

  const compoundPeriods = n * t;
  const growth = Math.pow(1 + r / n, compoundPeriods);

  const futurePrincipal = P * growth;
  const futureAnnuity = PMT > 0 ? PMT * ((growth - 1) / (r / n)) : 0;

  const futureValue = futurePrincipal + futureAnnuity;
  const totalContribution = P + PMT * compoundPeriods;
  const interest = futureValue - totalContribution;

  return { futureValue, totalContribution, interest };
};

function CompoundInterestPage() {
  const [principal, setPrincipal] = React.useState(5000000);
  const [monthly, setMonthly] = React.useState(10000000);
  const [years, setYears] = React.useState(10);
  const [rate, setRate] = React.useState(10);
  const [frequency, setFrequency] = React.useState("yearly");
  const [result, setResult] = React.useState(null);

  const handleCalculate = () => {
    const values = calculateCompoundInterest({ principal, monthly, years, rate, frequency });
    setResult(values);
  };

  return (
    <div className="compound-page">
      <div className="compound-page__container">
        <Title level={3} className="compound-page__title">
        Công cụ tính Lãi Kép, Giá trị tiền gửi, Lợi nhuận đầu tư Miễn Phí
        </Title>
        <Text type="secondary" className="compound-page__subtitle">
        Công cụ ứng dụng lãi suất kép để tính toán tiền gửi, lợi nhuận đầu tư thu được trong tương lai dựa trên kế hoạch
        tiết kiệm, đầu tư hàng tháng và lãi suất kỳ vọng.
        </Text>

        <div className="compound-page__steps">
        <Card className="compound-page__card">
          <div className="compound-page__step-header">Bước 1: Đầu tư ban đầu</div>
          <Row gutter={16} align="middle">
            <Col xs={24} md={12}>
              <div className="compound-page__label">Số tiền gốc ban đầu (VND)</div>
              <div className="compound-page__description">Số tiền bạn có sẵn để bắt đầu đầu tư.</div>
            </Col>
            <Col xs={24} md={12}>
              <InputNumber
                value={principal}
                onChange={(v) => setPrincipal(Number(v) || 0)}
                min={0}
                className="compound-page__input"
                formatter={(v) => `${formatCurrency(v)} đ`}
                parser={(v) => (v || "").replace(/[^\d]/g, "")}
              />
            </Col>
          </Row>
        </Card>

        <Card className="compound-page__card">
          <div className="compound-page__step-header">Bước 2: Khoản đóng góp</div>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <div className="compound-page__label">Số tiền gửi mỗi tháng (VND)</div>
              <div className="compound-page__description">Số tiền bạn định thêm vào tiền gốc hàng tháng.</div>
            </Col>
            <Col xs={24} md={12}>
              <InputNumber
                value={monthly}
                onChange={(v) => setMonthly(Number(v) || 0)}
                min={0}
                className="compound-page__input"
                formatter={(v) => `${formatCurrency(v)} đ`}
                parser={(v) => (v || "").replace(/[^\d]/g, "")}
              />
            </Col>
            <Col xs={24} md={12}>
              <div className="compound-page__label">Thời gian gửi (Năm)</div>
              <div className="compound-page__description">Khoảng thời gian, tính bằng năm, mà bạn dự định tiết kiệm.</div>
            </Col>
            <Col xs={24} md={12}>
              <InputNumber
                value={years}
                onChange={(v) => setYears(Number(v) || 0)}
                min={1}
                className="compound-page__input"
              />
            </Col>
          </Row>
        </Card>

        <Card className="compound-page__card">
          <div className="compound-page__step-header">Bước 3: Lãi suất</div>
          <Row gutter={16} align="middle">
            <Col xs={24} md={12}>
              <div className="compound-page__label">Lãi suất (%/năm)</div>
              <div className="compound-page__description">Lãi suất ước tính theo kỳ hạn gửi của bạn.</div>
            </Col>
            <Col xs={24} md={12}>
              <InputNumber
                value={rate}
                onChange={(v) => setRate(Number(v) || 0)}
                min={0}
                max={100}
                className="compound-page__input"
              />
            </Col>
          </Row>
        </Card>

        <Card className="compound-page__card">
          <div className="compound-page__step-header">Bước 4: Kỳ hạn</div>
          <Row gutter={16} align="middle">
            <Col xs={24} md={12}>
              <div className="compound-page__label">Định kỳ gửi lãi</div>
              <div className="compound-page__description">Kỳ hạn nhận lãi tiền gửi của bạn.</div>
            </Col>
            <Col xs={24} md={12}>
              <Select
                value={frequency}
                onChange={setFrequency}
                className="compound-page__select"
                options={[
                  { value: "yearly", label: "Hàng năm" },
                  { value: "quarterly", label: "Hàng quý" },
                  { value: "monthly", label: "Hàng tháng" },
                  { value: "daily", label: "Hàng ngày" },
                ]}
              />
            </Col>
          </Row>
        </Card>
        </div>

        <div className="compound-page__actions">
        <Button type="primary" size="large" onClick={handleCalculate}>
          Tính lãi
        </Button>
        </div>

        {result && (
          <Card className="compound-page__result">
          <Title level={4} className="compound-page__result-title">
            Kết quả ước tính
          </Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <div className="compound-page__result-item">
                <div className="compound-page__result-label">Tổng giá trị tương lai</div>
                <div className="compound-page__result-value">{formatCurrency(result.futureValue)} đ</div>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="compound-page__result-item">
                <div className="compound-page__result-label">Tổng số tiền đã gửi</div>
                <div className="compound-page__result-value">{formatCurrency(result.totalContribution)} đ</div>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="compound-page__result-item">
                <div className="compound-page__result-label">Tổng lãi ước tính</div>
                <div className="compound-page__result-value">{formatCurrency(result.interest)} đ</div>
              </div>
            </Col>
          </Row>
          <Divider />
          <Text type="secondary">
            Kết quả chỉ mang tính tham khảo, có thể khác thực tế tùy theo biểu phí và chính sách của ngân hàng.
          </Text>
          </Card>
        )}
      </div>
    </div>
  );
}

export default CompoundInterestPage;
