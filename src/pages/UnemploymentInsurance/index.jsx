import React, { useMemo, useState } from "react";
import {
  Card,
  Radio,
  InputNumber,
  Button,
  Typography,
  Space,
  Row,
  Col,
  Table,
  Select,
  Alert,
} from "antd";
import { InfoCircleOutlined, DollarOutlined, CalculatorOutlined } from "@ant-design/icons";
import "./style.css";

const { Title, Text } = Typography;

// Lương cơ sở (đơn vị: VND/tháng)
const BASE_SALARY = {
  "2024-2025": 1800000, // giả định giai đoạn 01/07/2024 - 30/06/2025
  "2025": 2340000, // theo hình minh họa
};

// Lương tối thiểu vùng (VND/tháng) - dùng cho doanh nghiệp tư nhân
const REGION_MIN_WAGE = {
  I: 5200000,
  II: 4600000,
  III: 4100000,
  IV: 3700000,
};

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

// Tính số tháng hưởng BHTN theo Luật hiện hành:
// 12 -> 3 tháng; mỗi 12 tháng sau đó +1 tháng; tối đa 12 tháng
const calcBenefitMonths = (months) => {
  const m = Math.floor(Number(months || 0));
  if (m < 12) return 0;
  const extra = Math.floor((m - 12) / 12);
  return Math.min(3 + extra, 12);
};

function UnemploymentInsurance() {
  const [regulation, setRegulation] = useState("2025");
  const [salaryStable, setSalaryStable] = useState(true);
  const [avgSalary, setAvgSalary] = useState(6000000);
  const [contribMonths, setContribMonths] = useState(12);
  const [salaryMode, setSalaryMode] = useState("state"); // state | private
  const [region, setRegion] = useState("I");
  const [result, setResult] = useState(null);

  const baseSalary = useMemo(() => BASE_SALARY[regulation] || BASE_SALARY["2024-2025"], [regulation]);
  const regionMinWage = useMemo(() => REGION_MIN_WAGE[region] || REGION_MIN_WAGE.I, [region]);

  const handleCalculate = () => {
    const safeAvg = Number(avgSalary || 0);
    if (safeAvg <= 0) return;

    // Mức lương tháng đóng BHTN tối đa
    const maxSalary = 20 * (salaryMode === "state" ? baseSalary : regionMinWage);
    // Mức lương tháng áp dụng tính BHTN (không vượt quá tối đa)
    const appliedSalary = Math.min(safeAvg, maxSalary);

    // Mức trợ cấp hàng tháng = 60% * lương áp dụng
    const monthlyAllowance = appliedSalary * 0.6;

    const monthsBenefit = calcBenefitMonths(contribMonths);

    setResult({
      avgSalary: safeAvg,
      maxSalary,
      appliedSalary,
      monthlyAllowance,
      monthsBenefit,
      salaryMode,
      baseSalary,
      regionMinWage,
      contribMonths,
      regulation,
    });
  };

  const summaryData = result
    ? [
        {
          key: "1",
          bhtnSalary: result.avgSalary,
          contribMonths: `${result.contribMonths} (tháng)`,
          salaryMode: result.salaryMode === "state" ? "Doanh nghiệp nhà nước" : "Doanh nghiệp tư nhân",
          monthlyAllowance: result.monthlyAllowance,
          monthsBenefit: `${result.monthsBenefit} (tháng)`,
        },
      ]
    : [];

  const detailData = result
    ? [
        { key: "d1", label: "(1) Tiền lương đóng BHTN", value: result.avgSalary },
        { key: "d2", label: "(2) Lương cơ sở", value: result.baseSalary },
        {
          key: "d3",
          label: "(3) Mức lương tháng đóng BHTN tối đa (= 20 * (2) hoặc 20 * lương tối thiểu vùng)",
          value: result.maxSalary,
        },
        {
          key: "d4",
          label: "(4) Mức lương tháng áp dụng tính BHTN (Không vượt quá mức lương tối đa tại (3))",
          value: result.appliedSalary,
        },
        {
          key: "d5",
          label: "(5) Mức trợ cấp thất nghiệp hàng tháng tối đa (= 5 * (2))",
          value: result.baseSalary * 5,
        },
        { key: "d6", label: "(6) Thời gian đóng BHTN chưa hưởng", value: `${result.contribMonths} (tháng)` },
        {
          key: "d7",
          label: "(7) Chế độ lương",
          value: result.salaryMode === "state" ? "Doanh nghiệp nhà nước" : "Doanh nghiệp tư nhân",
        },
        {
          key: "d8",
          label: "(8) Mức trợ cấp hàng tháng theo mức lương áp dụng (= 0.6 * (4))",
          value: result.monthlyAllowance,
        },
        {
          key: "d9",
          label: "(9) Mức hưởng BHTN hàng tháng thực nhận (Không vượt quá (5))",
          value: Math.min(result.monthlyAllowance, result.baseSalary * 5),
        },
        {
          key: "d10",
          label: "(10) Số tháng hưởng BHTN",
          value: `${result.monthsBenefit} (tháng)`,
        },
      ]
    : [];

  return (
    <div className="ui-page">
      <div className="ui-container">
        <Card>
          <Title level={2} style={{ color: "#52c41a", marginBottom: 16 }}>
            Công cụ tính mức hưởng bảo hiểm thất nghiệp chính xác nhất 2025
          </Title>

          {/* Quy định áp dụng */}
          <div className="ui-section">
            <Text strong style={{ color: "#000000" }}>Áp dụng quy định:</Text>
            <Radio.Group
              style={{ display: "block", marginTop: 8 }}
              value={regulation}
              onChange={(e) => setRegulation(e.target.value)}
            >
              <Space direction="vertical">
                <Radio value="2024-2025" style={{ color: "#000000" }}>Từ 01/07/2024 - 30/06/2025</Radio>
                <Radio value="2025" style={{ color: "#000000" }}>Từ 01/07/2025 (Mới nhất)</Radio>
              </Space>
            </Radio.Group>
          </div>

          <div className="ui-section note">
            <Space direction="vertical" size="small">
              <Text style={{ color: "#000000" }}>
                <InfoCircleOutlined /> Áp dụng mức lương cơ sở mới nhất có hiệu lực từ ngày 01/07/2024 (NĐ 73/2024/NĐ-CP)
              </Text>
              <Text style={{ color: "#000000" }}>
                <InfoCircleOutlined /> Áp dụng mức lương tối thiểu vùng mới nhất có hiệu lực từ ngày 01/07/2025 (NĐ 128/2025/NĐ-CP)
              </Text>
              <Text style={{ color: "#000000" }}>
                <InfoCircleOutlined /> Mức hưởng BHTN quy định tại Điều 50, Luật việc làm 2013; hướng dẫn chi tiết tại Điều 8, Nghị định 28/2015/NĐ-CP
              </Text>
            </Space>
          </div>

          {/* Lương đóng BHTN */}
          <div className="ui-section">
            <Text strong style={{ color: "#000000" }}>Lương đóng BHTN:</Text>
            <Radio.Group
              style={{ display: "block", marginTop: 8 }}
              value={salaryStable ? "stable" : "change"}
              onChange={(e) => setSalaryStable(e.target.value === "stable")}
            >
              <Space direction="vertical">
                <Radio value="stable" style={{ color: "#000000" }}>Lương đóng BH không thay đổi trong 6 tháng</Radio>
                <Radio value="change" style={{ color: "#000000" }}>Lương đóng BH thay đổi trong 6 tháng</Radio>
              </Space>
            </Radio.Group>
            <Text type="secondary" style={{ display: "block", marginTop: 8, color: "#000000" }}>
              (Bình quân tiền lương tháng đóng BHTN của 06 tháng liền kề trước khi thất nghiệp)
            </Text>

            <InputNumber
              style={{ width: "100%", marginTop: 8 }}
              prefix={<DollarOutlined />}
              value={avgSalary}
              onChange={setAvgSalary}
              min={0}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(v) => v.replace(/,/g, "")}
              size="large"
            />
          </div>

          {/* Thời gian đóng BHTN */}
          <div className="ui-section">
            <Text strong style={{ color: "#000000" }}>Tổng thời gian đóng BHTN chưa hưởng:</Text>
            <InputNumber
              style={{ width: "100%", marginTop: 8 }}
              value={contribMonths}
              onChange={setContribMonths}
              min={1}
              max={120}
              suffix="tháng"
              size="large"
            />
            <Text type="secondary" style={{ display: "block", marginTop: 8, color: "#000000" }}>
              (Thời gian đóng BHTN – Thời gian đã hưởng trợ cấp thất nghiệp)
            </Text>
          </div>

          {/* Chế độ lương & Vùng */}
          <Row gutter={16} className="ui-section">
            <Col xs={24} md={12}>
              <Text strong style={{ color: "#000000" }}>Chế độ tiền lương</Text>
              <Radio.Group
                style={{ display: "block", marginTop: 8 }}
                value={salaryMode}
                onChange={(e) => setSalaryMode(e.target.value)}
              >
                <Space direction="vertical">
                  <Radio value="state" style={{ color: "#000000" }}>Doanh nghiệp nhà nước</Radio>
                  <Radio value="private" style={{ color: "#000000" }}>Doanh nghiệp tư nhân</Radio>
                </Space>
              </Radio.Group>
            </Col>
            <Col xs={24} md={12}>
              <Text strong style={{ color: "#000000" }}>
                Vùng <Text type="secondary" style={{ color: "#000000" }}>(Giải thích):</Text>
              </Text>
              <Select
                style={{ width: "100%", marginTop: 8 }}
                value={region}
                onChange={setRegion}
                options={[
                  { value: "I", label: "Vùng 1" },
                  { value: "II", label: "Vùng 2" },
                  { value: "III", label: "Vùng 3" },
                  { value: "IV", label: "Vùng 4" },
                ]}
                size="large"
              />
            </Col>
          </Row>

          <Button
            type="primary"
            size="large"
            icon={<CalculatorOutlined />}
            block
            style={{ marginTop: 12 }}
            onClick={handleCalculate}
          >
            Tính bảo hiểm
          </Button>

          {/* Kết quả */}
          {result && (
            <>
              <Card type="inner" title="Kết quả" style={{ marginTop: 24 }}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong style={{ color: "#000000" }}>
                    * Mức hưởng BHTN hàng tháng:{" "}
                    <Text style={{ color: "#52c41a" }}>{formatCurrency(result.monthlyAllowance)} (Đồng)</Text>
                  </Text>
                  <br />
                  <Text strong style={{ color: "#000000" }}>
                    * Số tháng hưởng BHTN:{" "}
                    <Text style={{ color: "#52c41a" }}>{result.monthsBenefit} (Tháng)</Text>
                  </Text>
                </div>
                <Table
                  pagination={false}
                  bordered
                  size="middle"
                  columns={[
                    { title: "Tiền lương đóng BHTN", dataIndex: "bhtnSalary", key: "b1", width: "20%" },
                    { title: "Thời gian đóng BHTN chưa hưởng", dataIndex: "contribMonths", key: "b2", width: "20%" },
                    { title: "Chế độ lương", dataIndex: "salaryMode", key: "b3", width: "20%" },
                    { title: "Mức hưởng BHTN hàng tháng", dataIndex: "monthlyAllowance", key: "b4", width: "20%", render: (v) => formatCurrency(v) },
                    { title: "Số tháng hưởng BHTN", dataIndex: "monthsBenefit", key: "b5", width: "20%" },
                  ]}
                  dataSource={summaryData}
                  rowClassName={(record, index) => (index % 2 === 0 ? "even-row" : "odd-row")}
                />
              </Card>

              <Card type="inner" title="(*) Diễn giải chi tiết" style={{ marginTop: 24 }}>
                <Table
                  pagination={false}
                  bordered
                  size="middle"
                  columns={[
                    { title: "Mục", dataIndex: "label", key: "l1", width: "65%" },
                    { title: "Giá trị", dataIndex: "value", key: "l2", width: "35%", render: (v) => (typeof v === "string" ? v : `${formatCurrency(v)} (Đồng)`) },
                  ]}
                  dataSource={detailData}
                  rowClassName={(record, index) => (index % 2 === 0 ? "even-row" : "odd-row")}
                />
              </Card>
            </>
          )}

          {!result && (
            <Alert
              style={{ marginTop: 16 }}
              message="Hướng dẫn"
              description="Nhập lương bình quân 6 tháng, chọn thời gian đóng BHTN và nhấn 'Tính bảo hiểm' để xem kết quả."
              type="info"
              showIcon
            />
          )}
        </Card>
      </div>
    </div>
  );
}

export default UnemploymentInsurance;

