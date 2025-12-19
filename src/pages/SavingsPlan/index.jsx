import React, { useState } from "react";
import {
  Card,
  InputNumber,
  Button,
  Typography,
  Space,
  Select,
  Table,
  Divider,
  Alert,
} from "antd";
import {
  DollarOutlined,
  CalendarOutlined,
  PercentageOutlined,
  FileTextOutlined,
  LineChartOutlined,
} from "@ant-design/icons";
import "./style.css";

const { Title, Text } = Typography;
const { Option } = Select;

const formatCurrency = (value) => {
  return Number(value || 0).toLocaleString("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

// Tính số tiền cần tiết kiệm mỗi kỳ để đạt mục tiêu
// FV = PV * (1+r)^n + PMT * (((1+r)^n - 1) / r)
// PMT = (FV - PV * (1+r)^n) / (((1+r)^n - 1) / r)
const calculateMonthlyPayment = (goal, initial, years, rate, frequency) => {
  const goalVal = Number(goal || 0);
  const initialVal = Number(initial || 0);
  const yearsVal = Number(years || 0);
  const rateVal = Number(rate || 0) / 100;
  
  if (yearsVal <= 0) return 0;
  
  // Số kỳ trong năm
  const periodsPerYear = {
    "yearly": 1,
    "quarterly": 4,
    "monthly": 12,
  }[frequency] || 12;
  
  const totalPeriods = yearsVal * periodsPerYear;
  const ratePerPeriod = rateVal / periodsPerYear;
  
  if (ratePerPeriod === 0) {
    // Nếu không có lãi suất, tính đơn giản
    return (goalVal - initialVal) / totalPeriods;
  }
  
  // Giá trị tương lai của vốn ban đầu
  const futureValueOfInitial = initialVal * Math.pow(1 + ratePerPeriod, totalPeriods);
  
  // Tính số tiền cần gửi/rút mỗi kỳ
  const annuityFactor = (Math.pow(1 + ratePerPeriod, totalPeriods) - 1) / ratePerPeriod;
  const pmt = (goalVal - futureValueOfInitial) / annuityFactor;
  
  return pmt;
};

// Tính toán chi tiết theo từng năm
const calculateYearlyDetails = (goal, initial, years, rate, frequency, monthlyPayment) => {
  const goalVal = Number(goal || 0);
  const initialVal = Number(initial || 0);
  const yearsVal = Number(years || 0);
  const rateVal = Number(rate || 0) / 100;
  const pmt = Number(monthlyPayment || 0);
  
  const periodsPerYear = {
    "yearly": 1,
    "quarterly": 4,
    "monthly": 12,
  }[frequency] || 12;
  
  const ratePerPeriod = rateVal / periodsPerYear;
  
  const details = [];
  let currentBalance = initialVal;
  let totalAdditional = 0;
  
  // Năm 0
  details.push({
    year: 0,
    initialCapital: initialVal,
    totalSavings: initialVal,
    totalAdditional: 0,
  });
  
  // Tính từng năm
  for (let year = 1; year <= yearsVal; year++) {
    let yearBalance = currentBalance;
    let yearAdditional = 0;
    
    // Tính từng kỳ trong năm
    for (let period = 0; period < periodsPerYear; period++) {
      // Thêm tiền gửi/rút trước khi tính lãi
      yearBalance += pmt;
      yearAdditional += pmt;
      
      // Tính lãi suất kép sau khi thêm tiền
      if (ratePerPeriod > 0) {
        yearBalance = yearBalance * (1 + ratePerPeriod);
      }
    }
    
    currentBalance = yearBalance;
    totalAdditional += yearAdditional;
    
    details.push({
      year,
      initialCapital: currentBalance,
      totalSavings: currentBalance,
      totalAdditional: totalAdditional,
    });
  }
  
  return details;
};

function SavingsPlan() {
  const [goal, setGoal] = useState(10000000);
  const [initial, setInitial] = useState(100000000);
  const [years, setYears] = useState(1);
  const [rate, setRate] = useState(10);
  const [frequency, setFrequency] = useState("yearly");
  const [result, setResult] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleCalculate = () => {
    if (!goal || !initial || !years || !rate) {
      return;
    }

    const monthlyPayment = calculateMonthlyPayment(goal, initial, years, rate, frequency);
    const yearlyDetails = calculateYearlyDetails(goal, initial, years, rate, frequency, monthlyPayment);

    setResult({
      monthlyPayment,
      yearlyDetails,
      goal,
      initial,
      years,
      rate,
      frequency,
    });
    setShowDetails(false);
  };

  const frequencyLabel = {
    yearly: "Hàng năm",
    quarterly: "Hàng quý",
    monthly: "Hàng tháng",
  }[frequency] || "Hàng năm";

  const resultColumns = [
    {
      title: "Năm",
      dataIndex: "year",
      key: "year",
      render: (year) => `Năm ${year}`,
      width: "20%",
    },
    {
      title: "Vốn ban đầu theo năm (VNĐ)",
      dataIndex: "initialCapital",
      key: "initialCapital",
      align: "right",
      render: (value) => formatCurrency(value),
      width: "30%",
    },
    {
      title: "Tổng tiền tiết kiệm được (VNĐ)",
      dataIndex: "totalSavings",
      key: "totalSavings",
      align: "right",
      render: (value) => formatCurrency(value),
      width: "30%",
    },
    {
      title: "Tổng tiền bổ sung (VNĐ)",
      dataIndex: "totalAdditional",
      key: "totalAdditional",
      align: "right",
      render: (value) => formatCurrency(value),
      width: "20%",
    },
  ];

  return (
    <div className="savings-plan">
      <div className="savings-plan-container">
        <Card>
          <Title level={2} style={{ color: "#52c41a", marginBottom: 16 }}>
            Công cụ lập kế hoạch tiết kiệm ứng dụng lãi suất kép miễn phí chính xác nhất
          </Title>

          <Space direction="vertical" size="middle" style={{ width: "100%", marginBottom: 24 }}>
            <Text>
              Ứng dụng lãi suất kép để xây dựng kế hoạch tiết kiệm dựa trên mục tiêu và số năm
              tích lũy một cách chính xác với công cụ lập kế hoạch tiết kiệm trên TopCV hoàn toàn
              miễn phí.
            </Text>
            <Text>
              Hãy tính xem mỗi tháng bạn cần góp bao nhiêu để đạt được mục tiêu tiết kiệm của mình
              nhé!
            </Text>
          </Space>

          {/* Form nhập liệu */}
          <Card type="inner" style={{ marginBottom: 24 }}>
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              {/* Bước 1 */}
              <div className="savings-step">
                <div className="step-header">
                  <Title level={4} style={{ color: "#ffffff", margin: 0 }}>
                    Bước 1: Mục tiêu tiết kiệm
                  </Title>
                </div>
                <Text strong>Mục tiêu tiết kiệm (VNĐ)</Text>
                <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
                  Số tiền tiết kiệm cuối cùng mong muốn.
                </Text>
                <InputNumber
                  style={{ width: "100%" }}
                  prefix={<DollarOutlined />}
                  placeholder="VD: 10,000,000"
                  value={goal}
                  onChange={setGoal}
                  min={0}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                  size="large"
                  addonAfter="(VNĐ)"
                />
              </div>

              {/* Bước 2 */}
              <div className="savings-step">
                <div className="step-header">
                  <Title level={4} style={{ color: "#ffffff", margin: 0 }}>
                    Bước 2: Khoản đầu tư ban đầu
                  </Title>
                </div>
                <Text strong>Số tiền ban đầu (VNĐ)</Text>
                <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
                  Khoản tiền đầu tư lúc ban đầu bạn có.
                </Text>
                <InputNumber
                  style={{ width: "100%" }}
                  prefix={<DollarOutlined />}
                  placeholder="VD: 10,000,000"
                  value={initial}
                  onChange={setInitial}
                  min={0}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                  size="large"
                  addonAfter="(VNĐ)"
                />
              </div>

              {/* Bước 3 */}
              <div className="savings-step">
                <div className="step-header">
                  <Title level={4} style={{ color: "#ffffff", margin: 0 }}>
                    Bước 3: Khoảng thời gian ước tính
                  </Title>
                </div>
                <Text strong>Thời gian tiết kiệm (Năm)</Text>
                <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
                  Khoảng thời gian, tính bằng năm, mà bạn dự định tiết kiệm.
                </Text>
                <InputNumber
                  style={{ width: "100%" }}
                  prefix={<CalendarOutlined />}
                  placeholder="VD: 10"
                  value={years}
                  onChange={setYears}
                  min={1}
                  max={100}
                  size="large"
                />
              </div>

              {/* Bước 4 */}
              <div className="savings-step">
                <div className="step-header">
                  <Title level={4} style={{ color: "#ffffff", margin: 0 }}>
                    Bước 4: Lãi suất
                  </Title>
                </div>
                <Text strong>Lãi suất (%)</Text>
                <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
                  Lãi suất ước tính theo kỳ hạn gửi của bạn.
                </Text>
                <InputNumber
                  style={{ width: "100%" }}
                  prefix={<PercentageOutlined />}
                  placeholder="VD: 10"
                  value={rate}
                  onChange={setRate}
                  min={0}
                  max={100}
                  size="large"
                  addonAfter="(%)"
                />
              </div>

              {/* Bước 5 */}
              <div className="savings-step">
                <div className="step-header">
                  <Title level={4} style={{ color: "#ffffff", margin: 0 }}>
                    Bước 5: Kỳ hạn
                  </Title>
                </div>
                <Text strong>Định kỳ gửi</Text>
                <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
                  Kỳ hạn nhận lãi tiền gửi của bạn.
                </Text>
                <Select
                  style={{ width: "100%" }}
                  value={frequency}
                  onChange={setFrequency}
                  size="large"
                >
                  <Option value="yearly">Hàng năm</Option>
                  <Option value="quarterly">Hàng quý</Option>
                  <Option value="monthly">Hàng tháng</Option>
                </Select>
              </div>

              <Button
                type="primary"
                size="large"
                icon={<LineChartOutlined />}
                onClick={handleCalculate}
                block
                style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
              >
                Lập kế hoạch
              </Button>
            </Space>
          </Card>

          {/* Kết quả */}
          {result && (
            <>
              <Card type="inner" style={{ marginBottom: 24 }}>
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                  <div style={{ textAlign: "center", padding: "20px 0" }}>
                    <Text style={{ fontSize: "16px" }}>
                      Để đạt được{" "}
                      <Text strong style={{ color: "#52c41a", fontSize: "18px" }}>
                        {formatCurrency(result.goal)} (VNĐ)
                      </Text>{" "}
                      sau{" "}
                      <Text strong style={{ color: "#52c41a", fontSize: "18px" }}>
                        {result.years} năm
                      </Text>{" "}
                      với vốn đầu tư ban đầu{" "}
                      <Text strong style={{ color: "#52c41a", fontSize: "18px" }}>
                        {formatCurrency(result.initial)} (VNĐ)
                      </Text>{" "}
                      và mức lãi suất kỳ vọng{" "}
                      <Text strong style={{ color: "#52c41a", fontSize: "18px" }}>
                        {result.rate} (%/{frequency === "yearly" ? "năm" : frequency === "quarterly" ? "quý" : "tháng"})
                      </Text>{" "}
                      thì bạn cần tiết kiệm{" "}
                      <Text strong style={{ color: "#52c41a", fontSize: "20px" }}>
                        {formatCurrency(result.monthlyPayment)} (VNĐ)
                      </Text>{" "}
                      mỗi {frequency === "yearly" ? "năm" : frequency === "quarterly" ? "quý" : "tháng"}
                    </Text>
                  </div>

                  <Divider />

                  {/* Biểu đồ đơn giản */}
                  <div className="chart-container">
                    <div className="chart-legend">
                      <div className="legend-item">
                        <div className="legend-color" style={{ backgroundColor: "#52c41a" }}></div>
                        <Text>Tổng vốn đầu tư ban đầu (VNĐ)</Text>
                      </div>
                      <div className="legend-item">
                        <div className="legend-color" style={{ backgroundColor: "#1890ff" }}></div>
                        <Text>Tổng tiết kiệm cộng lại (VNĐ)</Text>
                      </div>
                      <div className="legend-item">
                        <div className="legend-color" style={{ backgroundColor: "#333" }}></div>
                        <Text>Tổng tiền bổ sung (VNĐ)</Text>
                      </div>
                    </div>
                    <div className="simple-chart">
                      <div className="chart-bars">
                        {result.yearlyDetails.map((detail, index) => (
                          <div key={index} className="chart-bar-group">
                            <div
                              className="chart-bar"
                              style={{
                                height: `${Math.max(0, (detail.initialCapital / result.goal) * 50)}px`,
                                backgroundColor: "#52c41a",
                              }}
                              title={`Vốn ban đầu: ${formatCurrency(detail.initialCapital)}`}
                            ></div>
                            <div
                              className="chart-bar"
                              style={{
                                height: `${Math.max(0, (detail.totalSavings / result.goal) * 50)}px`,
                                backgroundColor: "#1890ff",
                              }}
                              title={`Tổng tiết kiệm: ${formatCurrency(detail.totalSavings)}`}
                            ></div>
                            <div
                              className="chart-bar"
                              style={{
                                height: `${Math.max(0, Math.abs(detail.totalAdditional) / result.goal) * 50}px`,
                                backgroundColor: "#333",
                              }}
                              title={`Tổng bổ sung: ${formatCurrency(detail.totalAdditional)}`}
                            ></div>
                          </div>
                        ))}
                      </div>
                      <div className="chart-labels">
                        {result.yearlyDetails.map((detail, index) => (
                          <div key={index} className="chart-label">
                            Năm {detail.year}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Alert
                    message="Lưu ý"
                    description="Công cụ này chỉ mang tính chất tham khảo. Kết quả có thể khác với thực tế do biến động lãi suất và các yếu tố khác."
                    type="info"
                    showIcon
                    style={{ marginTop: 24 }}
                  />
                </Space>
              </Card>

              {/* Bảng chi tiết */}
              <Card type="inner">
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <Button
                    type="primary"
                    onClick={() => setShowDetails(!showDetails)}
                    style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                  >
                    {showDetails ? "Ẩn chi tiết" : "Hiện chi tiết"}
                  </Button>
                </div>

                {showDetails && (
                  <Table
                    columns={resultColumns}
                    dataSource={result.yearlyDetails.map((detail, index) => ({
                      ...detail,
                      key: index,
                    }))}
                    pagination={false}
                    bordered
                    size="middle"
                    summary={(pageData) => {
                      const lastRow = pageData[pageData.length - 1];
                      return (
                        <Table.Summary fixed>
                          <Table.Summary.Row>
                            <Table.Summary.Cell index={0}>
                              <Text strong>(Tổng {result.years} năm)</Text>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={1} align="right">
                              <Text strong>
                                {formatCurrency(lastRow?.initialCapital || 0)}
                              </Text>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={2} align="right">
                              <Text strong>
                                {formatCurrency(lastRow?.totalSavings || 0)}
                              </Text>
                              <br />
                              <Text type="secondary" style={{ fontSize: "12px" }}>
                                (Lãi suất kỳ vọng {result.rate}% /{" "}
                                {frequency === "yearly" ? "Năm" : frequency === "quarterly" ? "Quý" : "Tháng"})
                              </Text>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={3} align="right">
                              <Text strong>
                                {formatCurrency(lastRow?.totalAdditional || 0)}
                              </Text>
                              <br />
                              <Text type="secondary" style={{ fontSize: "12px" }}>
                                (Tổng số tiền bổ sung {frequency === "yearly" ? "hàng năm" : frequency === "quarterly" ? "hàng quý" : "hàng tháng"} tính đến nay)
                              </Text>
                            </Table.Summary.Cell>
                          </Table.Summary.Row>
                        </Table.Summary>
                      );
                    }}
                  />
                )}
              </Card>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

export default SavingsPlan;

