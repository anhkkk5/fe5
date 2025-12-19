import React from "react";
import { Row, Col, Card, InputNumber, Radio, Button, Typography, Space, Divider, Alert } from "antd";
import "./style.css";

const REGION_MIN_WAGE = {
  I: 4680000,
  II: 4160000,
  III: 3640000,
  IV: 3250000,
};
const PERSONAL_DEDUCTION = 11000000;
const DEPENDENT_DEDUCTION = 4400000;

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("vi-VN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const incomeTax = (taxable) => {
  const v = Number(taxable || 0);
  if (v <= 0) return 0;
  const brackets = [
    { cap: 5000000, rate: 0.05, quick: 0 },
    { cap: 10000000, rate: 0.1, quick: 250000 },
    { cap: 18000000, rate: 0.15, quick: 750000 },
    { cap: 32000000, rate: 0.2, quick: 1950000 },
    { cap: 52000000, rate: 0.25, quick: 4750000 },
    { cap: 80000000, rate: 0.3, quick: 9750000 },
    { cap: Infinity, rate: 0.35, quick: 18150000 },
  ];
  const bracket = brackets.find((b) => v <= b.cap);
  return bracket ? bracket.rate * v - bracket.quick : 0;
};

const clampInsuranceBase = (base, region) => {
  const min = REGION_MIN_WAGE[region] || REGION_MIN_WAGE.I;
  const max = min * 20;
  return Math.min(Math.max(Number(base || 0), min), max);
};

const calculateDeductions = (salary, insuranceBase, region) => {
  const base = clampInsuranceBase(insuranceBase || salary, region);
  const si = base * 0.08;
  const hi = base * 0.015;
  const ui = base * 0.01;
  return { si, hi, ui, base };
};

const calculateNetFromGross = ({ gross, dependents, region, insuranceBase }) => {
  const grossVal = Number(gross || 0);
  const deps = Number(dependents || 0);
  const { si, hi, ui, base } = calculateDeductions(grossVal, insuranceBase, region);
  const taxableIncome = grossVal - si - hi - ui - PERSONAL_DEDUCTION - DEPENDENT_DEDUCTION * deps;
  const tax = incomeTax(taxableIncome);
  const net = grossVal - si - hi - ui - tax;
  return { net, tax, si, hi, ui, insuranceBaseUsed: base, taxableIncome, gross: grossVal };
};

const calculateGrossFromNet = ({ net, dependents, region, insuranceBase }) => {
  const target = Number(net || 0);
  let low = target;
  let high = target * 2.2 + 20000000;
  let best = target;
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    const { net: estimated } = calculateNetFromGross({
      gross: mid,
      dependents,
      region,
      insuranceBase,
    });
    if (estimated >= target) {
      best = mid;
      high = mid;
    } else {
      low = mid;
    }
  }
  return best;
};

function GrossNetPage() {
  const [income, setIncome] = React.useState(5000000);
  const [dependents, setDependents] = React.useState(1);
  const [region, setRegion] = React.useState("I");
  const [useCustomBase, setUseCustomBase] = React.useState(false);
  const [customBase, setCustomBase] = React.useState(null);
  const [result, setResult] = React.useState(null);
  const [mode, setMode] = React.useState("gross-net");
  const [error, setError] = React.useState("");

  const insuranceBase = useCustomBase ? customBase || 0 : income;

  const handleGrossToNet = () => {
    try {
      setError("");
      const computed = calculateNetFromGross({
        gross: income || 0,
        dependents: dependents || 0,
        region,
        insuranceBase,
      });
      setMode("gross-net");
      setResult(computed);
    } catch (e) {
      setError("Không tính được, vui lòng kiểm tra lại dữ liệu.");
    }
  };

  const handleNetToGross = () => {
    try {
      setError("");
      const gross = calculateGrossFromNet({
        net: income || 0,
        dependents: dependents || 0,
        region,
        insuranceBase,
      });
      const computed = calculateNetFromGross({
        gross,
        dependents: dependents || 0,
        region,
        insuranceBase,
      });
      setMode("net-gross");
      setResult(computed);
    } catch (e) {
      setError("Không tính được, vui lòng kiểm tra lại dữ liệu.");
    }
  };

  const summary = result
    ? [
        { label: "Lương gross", value: result.gross || income },
        { label: "Lương net", value: result.net },
        { label: "BHXH (8%)", value: result.si },
        { label: "BHYT (1.5%)", value: result.hi },
        { label: "BHTN (1%)", value: result.ui },
        { label: "Thuế TNCN", value: result.tax },
      ]
    : [];

  return (
    <div className="grossnet-page">
      <div className="grossnet-page__container">
        <div className="grossnet">
      <div className="grossnet__header">
        <Card className="grossnet__card">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <div className="grossnet__info">
                <div className="grossnet__info-label">Lương cơ sở:</div>
                <div className="grossnet__info-value">2,340,000đ</div>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="grossnet__info">
                <div className="grossnet__info-label">Giảm trừ gia cảnh bản thân:</div>
                <div className="grossnet__info-value">{formatCurrency(PERSONAL_DEDUCTION)}đ</div>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="grossnet__info">
                <div className="grossnet__info-label">Người phụ thuộc:</div>
                <div className="grossnet__info-value">{formatCurrency(DEPENDENT_DEDUCTION)}đ</div>
              </div>
            </Col>
          </Row>
        </Card>
      </div>

      <div className="grossnet__form">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Typography.Text strong>Thu Nhập:</Typography.Text>
            <InputNumber
              value={income}
              onChange={(v) => setIncome(Number(v) || 0)}
              min={0}
              formatter={(v) => `${formatCurrency(v)} đ`}
              parser={(v) => (v || "").replace(/[^\d]/g, "")}
              className="grossnet__input"
            />
          </Col>
          <Col xs={24} md={12}>
            <Typography.Text strong>Số người phụ thuộc:</Typography.Text>
            <InputNumber
              value={dependents}
              onChange={(v) => setDependents(Number(v) || 0)}
              min={0}
              className="grossnet__input"
            />
          </Col>
        </Row>

        <div className="grossnet__section">
          <Typography.Text strong>Mức lương đóng bảo hiểm:</Typography.Text>
          <Radio.Group
            onChange={(e) => setUseCustomBase(e.target.value === "custom")}
            value={useCustomBase ? "custom" : "official"}
            className="grossnet__radio-row"
          >
            <Radio value="official">Trên lương chính thức</Radio>
            <Radio value="custom">Khác:</Radio>
          </Radio.Group>
          {useCustomBase && (
            <InputNumber
              value={customBase}
              onChange={(v) => setCustomBase(Number(v) || 0)}
              min={0}
              formatter={(v) => `${formatCurrency(v)} đ`}
              parser={(v) => (v || "").replace(/[^\d]/g, "")}
              className="grossnet__input"
            />
          )}
        </div>

        <div className="grossnet__section">
          <Typography.Text strong>Vùng:</Typography.Text>
          <Radio.Group
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="grossnet__radio-row"
          >
            <Radio value="I">I</Radio>
            <Radio value="II">II</Radio>
            <Radio value="III">III</Radio>
            <Radio value="IV">IV</Radio>
          </Radio.Group>
        </div>

        <Space size="large" style={{ marginTop: 12 }}>
          <Button type="primary" size="large" onClick={handleGrossToNet}>
            GROSS → NET
          </Button>
          <Button size="large" onClick={handleNetToGross}>
            NET → GROSS
          </Button>
        </Space>
        {error ? <Alert style={{ marginTop: 12 }} type="error" message={error} showIcon /> : null}
      </div>

      {result && (
        <Card className="grossnet__result">
          <Typography.Title level={4} style={{ marginBottom: 12 }}>
            Kết quả ({mode === "gross-net" ? "Gross → Net" : "Net → Gross"})
          </Typography.Title>
          <Row gutter={[16, 16]}>
            {summary.map((item) => (
              <Col xs={24} md={12} lg={8} key={item.label}>
                <div className="grossnet__summary-item">
                  <div className="grossnet__summary-label">{item.label}</div>
                  <div className="grossnet__summary-value">{formatCurrency(item.value)} đ</div>
                </div>
              </Col>
            ))}
          </Row>
          <Divider />
          <Typography.Text type="secondary">
            Lưu ý: kết quả mang tính tham khảo, có thể chênh lệch tùy chính sách cụ thể.
          </Typography.Text>
        </Card>
      )}
        </div>
      </div>
    </div>
  );
}

export default GrossNetPage;
