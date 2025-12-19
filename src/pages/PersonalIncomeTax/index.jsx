import React, { useState } from "react";
import {
  Card,
  Radio,
  InputNumber,
  Button,
  Typography,
  Space,
  Row,
  Col,
  Alert,
  Divider,
  Table,
} from "antd";
import {
  InfoCircleOutlined,
  DollarOutlined,
  UserOutlined,
  CalculatorOutlined,
} from "@ant-design/icons";
import "./style.css";

const { Title, Text } = Typography;

// Các hằng số theo quy định
const PERSONAL_DEDUCTION_2024 = 11000000; // 11 triệu/tháng
const DEPENDENT_DEDUCTION_2024 = 4400000; // 4.4 triệu/người/tháng
const PERSONAL_DEDUCTION_2025 = 15500000; // 15.5 triệu/tháng (từ 2026)
const DEPENDENT_DEDUCTION_2025 = 6200000; // 6.2 triệu/người/tháng (từ 2026)

// Mức lương tối thiểu vùng (từ 01/07/2024)
const REGION_MIN_WAGE = {
  I: 4680000,
  II: 4160000,
  III: 3640000,
  IV: 3250000,
};

// Bảng thuế suất theo bậc (7 bậc)
const TAX_BRACKETS = [
  { bracket: 1, min: 0, max: 5000000, rate: 0.05, quick: 0 },
  { bracket: 2, min: 5000000, max: 10000000, rate: 0.1, quick: 250000 },
  { bracket: 3, min: 10000000, max: 18000000, rate: 0.15, quick: 750000 },
  { bracket: 4, min: 18000000, max: 32000000, rate: 0.2, quick: 1950000 },
  { bracket: 5, min: 32000000, max: 52000000, rate: 0.25, quick: 4750000 },
  { bracket: 6, min: 52000000, max: 80000000, rate: 0.3, quick: 9750000 },
  { bracket: 7, min: 80000000, max: Infinity, rate: 0.35, quick: 18150000 },
];

const formatCurrency = (value) => {
  return Number(value || 0).toLocaleString("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

// Tính thuế theo bậc (sử dụng công thức rút gọn: Thuế = Thuế suất × TNTT - Số tiền giảm trừ)
const calculateTax = (taxableIncome) => {
  const income = Number(taxableIncome || 0);
  if (income <= 0) return { tax: 0, bracket: TAX_BRACKETS[0] };

  // Tìm bậc thuế phù hợp
  let bracket = null;
  for (let i = 0; i < TAX_BRACKETS.length; i++) {
    const b = TAX_BRACKETS[i];
    if (income > b.min && income <= b.max) {
      bracket = b;
      break;
    }
  }

  // Nếu không tìm thấy (vượt quá bậc cao nhất), dùng bậc cuối cùng
  if (!bracket) {
    bracket = TAX_BRACKETS[TAX_BRACKETS.length - 1];
  }

  // Tính thuế theo công thức: Thuế = Thuế suất × TNTT - Số tiền giảm trừ
  const tax = Math.max(0, bracket.rate * income - bracket.quick);

  return {
    tax,
    bracket,
  };
};

// Tính các khoản bảo hiểm
const calculateInsurance = (insuranceBase) => {
  const base = Number(insuranceBase || 0);
  return {
    socialInsurance: base * 0.08, // 8% BHXH
    healthInsurance: base * 0.015, // 1.5% BHYT
    unemploymentInsurance: base * 0.01, // 1% BHTN
    total: base * 0.105, // Tổng 10.5%
  };
};

function PersonalIncomeTax() {
  const [regulation, setRegulation] = useState("2024-2025"); // "2024-2025" hoặc "2025"
  const [grossIncome, setGrossIncome] = useState(null);
  const [insuranceMode, setInsuranceMode] = useState("official"); // "official" hoặc "other"
  const [customInsuranceBase, setCustomInsuranceBase] = useState(null);
  const [region, setRegion] = useState("I");
  const [dependents, setDependents] = useState(0);
  const [result, setResult] = useState(null);

  // Xác định mức giảm trừ theo quy định
  const personalDeduction =
    regulation === "2025" ? PERSONAL_DEDUCTION_2025 : PERSONAL_DEDUCTION_2024;
  const dependentDeduction =
    regulation === "2025"
      ? DEPENDENT_DEDUCTION_2025
      : DEPENDENT_DEDUCTION_2024;

  // Tính toán mức lương đóng bảo hiểm
  const insuranceBase =
    insuranceMode === "official"
      ? grossIncome || 0
      : customInsuranceBase || 0;

  // Giới hạn mức lương đóng bảo hiểm theo vùng
  const minWage = REGION_MIN_WAGE[region] || REGION_MIN_WAGE.I;
  const maxInsuranceBase = minWage * 20; // Tối đa 20 lần mức lương tối thiểu
  const clampedInsuranceBase = Math.min(
    Math.max(insuranceBase, minWage),
    maxInsuranceBase
  );

  const handleCalculate = () => {
    if (!grossIncome || grossIncome <= 0) {
      return;
    }

    // Tính các khoản bảo hiểm
    const insurance = calculateInsurance(clampedInsuranceBase);

    // Thu nhập trước thuế = Tổng thu nhập - Các khoản bảo hiểm
    const preTaxIncome = grossIncome - insurance.total;

    // Thu nhập chịu thuế = Thu nhập trước thuế - Các khoản giảm trừ
    const totalDeductions =
      personalDeduction + dependentDeduction * dependents;
    const taxableIncome = Math.max(0, preTaxIncome - totalDeductions);

    // Tính thuế
    const { tax, bracket } = calculateTax(taxableIncome);

    // Thu nhập thực nhận (Net)
    const netIncome = grossIncome - insurance.total - tax;

    setResult({
      grossIncome,
      insurance,
      insuranceBase: clampedInsuranceBase,
      preTaxIncome,
      totalDeductions,
      personalDeduction,
      dependentDeduction: dependentDeduction * dependents,
      dependents,
      taxableIncome,
      tax,
      bracket,
      netIncome,
    });
  };

  // Tính toán tiền nộp cho từng bậc thuế
  const calculateTaxForBracket = (bracket, taxableIncome) => {
    const income = Number(taxableIncome || 0);
    if (income <= bracket.min) return 0;
    if (income >= bracket.max) {
      // Tính thuế cho phần trong bậc này
      const bracketIncome = bracket.max - bracket.min;
      return bracketIncome * bracket.rate;
    }
    // Tính thuế cho phần thu nhập trong bậc này
    return (income - bracket.min) * bracket.rate;
  };

  const resultColumns = [
    {
      title: "Khoản mục",
      dataIndex: "label",
      key: "label",
      width: "60%",
    },
    {
      title: "Số tiền",
      dataIndex: "value",
      key: "value",
      align: "right",
      render: (value) => (
        <Text strong style={{ color: "#333" }}>
          {formatCurrency(value)}
        </Text>
      ),
    },
  ];

  const resultData = result
    ? [
        {
          key: "1",
          label: "Lương GROSS",
          value: result.grossIncome,
        },
        {
          key: "2",
          label: "Bảo hiểm xã hội (8%)",
          value: result.insurance.socialInsurance,
        },
        {
          key: "3",
          label: "Bảo hiểm y tế (1.5%)",
          value: result.insurance.healthInsurance,
        },
        {
          key: "4",
          label: "Bảo hiểm thất nghiệp (1%)",
          value: result.insurance.unemploymentInsurance,
        },
        {
          key: "5",
          label: "Thu nhập trước thuế",
          value: result.preTaxIncome,
        },
        {
          key: "6",
          label: "Giảm trừ gia cảnh bản thân",
          value: result.personalDeduction,
        },
        {
          key: "7",
          label: "Giảm trừ gia cảnh người phụ thuộc",
          value: result.dependentDeduction,
        },
        {
          key: "8",
          label: "Thu nhập chịu thuế",
          value: result.taxableIncome,
        },
        {
          key: "9",
          label: "Thuế thu nhập cá nhân(*)",
          value: result.tax,
        },
      ]
    : [];

  // Bảng chi tiết các bậc thuế
  const taxBracketColumns = [
    {
      title: "Mức chịu thuế",
      dataIndex: "range",
      key: "range",
      width: "50%",
    },
    {
      title: "Thuế suất",
      dataIndex: "rate",
      key: "rate",
      align: "center",
      width: "25%",
    },
    {
      title: "Tiền nộp",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      width: "25%",
      render: (value) => formatCurrency(value),
    },
  ];

  const taxBracketData = result
    ? TAX_BRACKETS.map((bracket) => {
        const amount = calculateTaxForBracket(bracket, result.taxableIncome);
        let rangeText = "";
        if (bracket.max === Infinity) {
          rangeText = `Trên ${formatCurrency(bracket.min)} VNĐ`;
        } else {
          rangeText = `Trên ${formatCurrency(bracket.min)} VNĐ đến ${formatCurrency(bracket.max)} VNĐ`;
        }
        if (bracket.bracket === 1) {
          rangeText = `Đến ${formatCurrency(bracket.max)} VNĐ`;
        }

        return {
          key: bracket.bracket,
          range: rangeText,
          rate: `${(bracket.rate * 100).toFixed(0)}%`,
          amount: amount,
        };
      })
    : [];

  return (
    <div className="personal-income-tax">
      <div className="tax-container">
        <Card>
          <Title level={2} style={{ color: "#52c41a", marginBottom: 24 }}>
            Công cụ tính Thuế thu nhập cá nhân chuẩn 2025
          </Title>

          {/* Quy định áp dụng */}
          <Card
            type="inner"
            title="Áp dụng quy định:"
            style={{ marginBottom: 24 }}
          >
            <Radio.Group
              value={regulation}
              onChange={(e) => setRegulation(e.target.value)}
            >
              <Space direction="vertical">
                <Radio value="2024-2025">
                  Từ 01/07/2024 - 30/06/2025
                </Radio>
                <Radio value="2025">Từ 01/07/2025 (Mới nhất)</Radio>
              </Space>
            </Radio.Group>

            <Divider />

            <Space direction="vertical" size="small">
              <div>
                <InfoCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} />
                <Text>
                  Áp dụng mức lương cơ sở mới nhất có hiệu lực từ ngày 01/07/2024
                  (Theo Nghị định số 73/2024/NĐ-CP)
                </Text>
              </div>
              <div>
                <InfoCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} />
                <Text>
                  Áp dụng mức lương tối thiểu vùng mới nhất có hiệu lực từ ngày
                  01/07/2024 (Theo Nghị định 74/2024/NĐ-CP)
                </Text>
              </div>
              <div>
                <InfoCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} />
                <Text>
                  Áp dụng mức giảm trừ gia cảnh mới nhất{" "}
                  {formatCurrency(personalDeduction)} đ/tháng (
                  {formatCurrency(personalDeduction * 12)} đ/năm) với người nộp
                  thuế và {formatCurrency(dependentDeduction)} đ/tháng với mỗi
                  người phụ thuộc (Theo Nghị Quyết số 954/2020/UBTVQH14)
                </Text>
              </div>
            </Space>

            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Text strong>Giảm trừ gia cảnh bản thân:</Text>
                <Text style={{ color: "#52c41a", marginLeft: 8 }}>
                  {formatCurrency(personalDeduction)}đ
                </Text>
              </Col>
              <Col span={12}>
                <Text strong>Người phụ thuộc:</Text>
                <Text style={{ color: "#52c41a", marginLeft: 8 }}>
                  {formatCurrency(dependentDeduction)}₫
                </Text>
              </Col>
            </Row>
          </Card>

          {/* Form nhập liệu */}
          <Card type="inner" title="Thông tin tính thuế" style={{ marginBottom: 24 }}>
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <div>
                <Text strong>Thu Nhập (Gross):</Text>
                <InputNumber
                  style={{ width: "100%", marginTop: 8 }}
                  prefix={<DollarOutlined />}
                  placeholder="VD: 10,000,000 VND"
                  value={grossIncome}
                  onChange={setGrossIncome}
                  min={0}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                  size="large"
                />
              </div>

              <div>
                <Text strong>Mức lương đóng bảo hiểm:</Text>
                <Radio.Group
                  value={insuranceMode}
                  onChange={(e) => setInsuranceMode(e.target.value)}
                  style={{ marginTop: 8, display: "block" }}
                >
                  <Space direction="vertical">
                    <Radio value="official">Trên lương chính thức</Radio>
                    <Radio value="other">
                      Khác
                      {insuranceMode === "other" && (
                        <InputNumber
                          style={{ width: 200, marginLeft: 8 }}
                          prefix={<DollarOutlined />}
                          value={customInsuranceBase}
                          onChange={setCustomInsuranceBase}
                          min={minWage}
                          max={maxInsuranceBase}
                          formatter={(value) =>
                            `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                          }
                          parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                        />
                      )}
                    </Radio>
                  </Space>
                </Radio.Group>
              </div>

              <div>
                <Text strong>Vùng: (Giải thích)</Text>
                <Radio.Group
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  style={{ marginTop: 8, display: "block" }}
                >
                  <Space>
                    <Radio value="I">I</Radio>
                    <Radio value="II">II</Radio>
                    <Radio value="III">III</Radio>
                    <Radio value="IV">IV</Radio>
                  </Space>
                </Radio.Group>
                <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
                  Mức lương tối thiểu vùng {region}:{" "}
                  {formatCurrency(minWage)} đ/tháng
                </Text>
              </div>

              <div>
                <Text strong>Số người phụ thuộc:</Text>
                <InputNumber
                  style={{ width: "100%", marginTop: 8 }}
                  prefix={<UserOutlined />}
                  value={dependents}
                  onChange={setDependents}
                  min={0}
                  max={20}
                  placeholder="0 Người"
                  size="large"
                />
              </div>

              <Button
                type="primary"
                size="large"
                icon={<CalculatorOutlined />}
                onClick={handleCalculate}
                disabled={!grossIncome || grossIncome <= 0}
                block
              >
                Tính thuế TNCN
              </Button>
            </Space>
          </Card>

          {/* Kết quả */}
          {result && (
            <>
              <Card
                type="inner"
                title="Kết quả tính thuế"
                style={{ marginTop: 24 }}
              >
                <Table
                  columns={resultColumns}
                  dataSource={resultData}
                  pagination={false}
                  bordered
                  size="middle"
                  rowClassName={(record, index) =>
                    index % 2 === 0 ? "even-row" : "odd-row"
                  }
                />
              </Card>

              <Card
                type="inner"
                title="(*) Chi tiết thuế thu nhập cá nhân (VNĐ)"
                style={{ marginTop: 24 }}
              >
                <Table
                  columns={taxBracketColumns}
                  dataSource={taxBracketData}
                  pagination={false}
                  bordered
                  size="middle"
                  rowClassName={(record, index) =>
                    index % 2 === 0 ? "even-row" : "odd-row"
                  }
                />
              </Card>

              <Alert
                message="Lưu ý"
                description="Công cụ này chỉ mang tính chất tham khảo. Để biết chính xác số thuế phải nộp, vui lòng liên hệ với cơ quan thuế hoặc kế toán viên."
                type="info"
                showIcon
                style={{ marginTop: 24 }}
              />
            </>
          )}

          {/* Thông tin về Luật thuế TNCN sửa đổi */}
          <Card
            type="inner"
            title="Luật thuế thu nhập cá nhân (TNCN) sửa đổi mới nhất 2025"
            style={{ marginTop: 24 }}
          >
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <div>
                <Title level={4}>Nâng mức giảm trừ gia cảnh</Title>
                <Text>
                  Ủy ban Thường vụ Quốc hội ban hành Nghị quyết số 110/2025/UBTVQH15
                  để điều chỉnh mức giảm trừ gia cảnh theo quy định tại Khoản 1 Điều 19
                  Luật Thuế thu nhập cá nhân.
                </Text>
                <ul style={{ marginTop: 12, paddingLeft: 20 }}>
                  <li>
                    <Text>
                      Đối với người nộp thuế:{" "}
                      <Text strong style={{ color: "#52c41a" }}>
                        15,5 triệu đồng/tháng (186 triệu đồng/năm)
                      </Text>
                    </Text>
                  </li>
                  <li>
                    <Text>
                      Đối với mỗi người phụ thuộc:{" "}
                      <Text strong style={{ color: "#52c41a" }}>
                        6,2 triệu đồng/tháng
                      </Text>
                    </Text>
                  </li>
                </ul>
                <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
                  Nghị quyết số 110/2025/UBTVQH15 sẽ có hiệu lực từ ngày 01/01/2026 và
                  áp dụng từ kỳ tính thuế năm 2026.
                </Text>
              </div>

              <Divider />

              <div>
                <Title level={4}>
                  Dự thảo giảm biểu thuế TNCN từ 7 bậc xuống còn 5 bậc, mức cao nhất là
                  35%
                </Title>
                <Text>
                  Trong Dự thảo Luật Thuế thu nhập cá nhân (sửa đổi), Bộ Tài chính đề xuất
                  hai phương án sửa đổi biểu thuế. Hai phương án này đều nhằm giảm số bậc
                  thuế từ 7 bậc (với các mức thuế suất 5%, 10%, 15%, 20%, 25%, 30%, 35%)
                  xuống còn 5 bậc (với các mức thuế suất 5%, 15%, 25%, 30%, 35%), đồng
                  thời mở rộng khoảng cách giữa các bậc thuế.
                </Text>
                <Text style={{ display: "block", marginTop: 12 }}>
                  Hai phương án sửa đổi biểu thuế cụ thể như sau:
                </Text>

                <Card
                  type="inner"
                  title="BẢNG SO SÁNH HAI PHƯƠNG ÁN BIỂU THUẾ TNCN (DỰ THẢO)"
                  style={{ marginTop: 16 }}
                >
                  <Table
                    columns={[
                      {
                        title: "Bậc thuế",
                        dataIndex: "bracket",
                        key: "bracket",
                        align: "center",
                        width: "15%",
                      },
                      {
                        title: "Thuế suất (%)",
                        dataIndex: "rate",
                        key: "rate",
                        align: "center",
                        width: "15%",
                      },
                      {
                        title:
                          "Phương án 1 – Khoảng thu nhập tính thuế (triệu đồng/tháng)",
                        dataIndex: "option1",
                        key: "option1",
                        width: "35%",
                      },
                      {
                        title:
                          "Phương án 2 – Khoảng thu nhập tính thuế (triệu đồng/tháng)",
                        dataIndex: "option2",
                        key: "option2",
                        width: "35%",
                      },
                    ]}
                    dataSource={[
                      {
                        key: "1",
                        bracket: "1",
                        rate: "5%",
                        option1: "Trên 5 - 10",
                        option2: "Trên 5 - 10",
                      },
                      {
                        key: "2",
                        bracket: "2",
                        rate: "15%",
                        option1: "Trên 10 - 30",
                        option2: "Trên 10 - 30",
                      },
                      {
                        key: "3",
                        bracket: "3",
                        rate: "25%",
                        option1: "Trên 30 - 50",
                        option2: "Trên 30 - 60",
                      },
                      {
                        key: "4",
                        bracket: "4",
                        rate: "30%",
                        option1: "Trên 50 - 80",
                        option2: "Trên 60 - 100",
                      },
                      {
                        key: "5",
                        bracket: "5",
                        rate: "35%",
                        option1: "Trên 80",
                        option2: "Trên 100",
                      },
                    ]}
                    pagination={false}
                    bordered
                    size="middle"
                  />
                </Card>
              </div>
            </Space>
          </Card>

          {/* Giải thích về Thuế TNCN */}
          <Card
            type="inner"
            title="Thuế thu nhập cá nhân là gì? Tại sao cần đóng thuế thu nhập cá nhân? Công thức tính thuế thu nhập cá nhân như thế nào?"
            style={{ marginTop: 24 }}
          >
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <div>
                <Title level={4}>Thuế thu nhập cá nhân là gì?</Title>
                <Text>
                  Thuế thu nhập cá nhân (Tiếng Anh: Personal income tax) là khoản tiền mà
                  người có thu nhập cần trích từ lương và các nguồn thu khác (nếu có) của
                  mình để nộp vào ngân sách nhà nước sau khi đã được giảm trừ.
                </Text>
                <Text style={{ display: "block", marginTop: 12 }}>
                  Thuế thu nhập cá nhân không đánh vào tất cả các đối tượng mà có mức lương
                  quy định cần đóng riêng, góp phần thu hẹp khoảng cách giữa các tầng lớp
                  trong xã hội.
                </Text>
              </div>

              <Divider />

              <div>
                <Title level={4}>Công cụ tính thuế thu nhập cá nhân</Title>
                <Text>
                  Trước khi tính thuế thu nhập cá nhân chúng ta cần xác định đối tượng cần
                  đóng thuế thu nhập cá nhân. Đối tượng cần đóng thuế thu nhập cá nhân chia
                  ra hai đối tượng chính là{" "}
                  <Text strong>cá nhân cư trú</Text> và{" "}
                  <Text strong>cá nhân không cư trú</Text>.
                </Text>
              </div>

              <div>
                <Title level={4}>Cá nhân cư trú</Title>
                <Title level={5}>Cá nhân cư trú là gì?</Title>
                <Text>
                  Cá nhân cư trú bao gồm cá nhân đáp ứng một trong hai điều kiện sau:
                </Text>
                <ol style={{ marginTop: 12, paddingLeft: 20 }}>
                  <li>
                    <Text>
                      <Text strong>Cá nhân có nơi ở thường xuyên tại Việt Nam</Text>, bao
                      gồm:
                      <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                        <li>
                          Có nhà thuê tại Việt Nam theo quy định của pháp luật về nhà ở, với
                          thời hạn hợp đồng thuê từ 183 ngày trở lên trong năm tính thuế.
                        </li>
                        <li>
                          Có nơi ở thường trú theo quy định của pháp luật về cư trú.
                        </li>
                      </ul>
                    </Text>
                  </li>
                  <li>
                    <Text>
                      <Text strong>
                        Cá nhân có mặt tại Việt Nam từ 183 ngày trở lên tính trong một năm
                        dương lịch hoặc trong 12 tháng liên tục kể từ ngày đầu tiên có mặt
                        tại Việt Nam
                      </Text>
                      . Trong đó:
                      <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                        <li>
                          Ngày đến và ngày đi được tính là 01 ngày.
                        </li>
                        <li>
                          Ngày đến và ngày đi được căn cứ vào chứng thực của cơ quan quản
                          lý xuất nhập cảnh trên hộ chiếu (hoặc giấy thông hành) khi người
                          nước ngoài vào và ra Việt Nam.
                        </li>
                        <li>
                          Trường hợp nhập cảnh và xuất cảnh trong cùng một ngày thì được tính
                          là 01 ngày cư trú.
                        </li>
                      </ul>
                    </Text>
                  </li>
                </ol>
              </div>

              <Divider />

              <div>
                <Title level={4}>
                  Công thức tính thuế thu nhập cá nhân của cá nhân cư trú
                </Title>
                <Text>
                  Vậy tính thuế thu nhập cá nhân tính như thế nào? Bạn có thể tham khảo
                  thông tin dưới đây để tính thuế thu nhập cá nhân một cách chính xác.
                </Text>

                <Card
                  type="inner"
                  title="A. Đối với cá nhân ký hợp đồng lao động từ 03 tháng trở lên:"
                  style={{ marginTop: 16 }}
                >
                  <div
                    style={{
                      background: "#f0f9ff",
                      padding: "20px",
                      borderRadius: "8px",
                      textAlign: "center",
                      marginBottom: 16,
                    }}
                  >
                    <Text strong style={{ fontSize: "18px", color: "#1890ff" }}>
                      Thuế thu nhập cá nhân phải nộp = Thu nhập tính thuế × Thuế suất
                    </Text>
                  </div>

                  <Title level={5}>* Diễn giải công thức:</Title>
                  <Space direction="vertical" size="small" style={{ width: "100%" }}>
                    <Text>
                      <Text strong>Thu nhập tính thuế</Text> = Thu nhập chịu thuế - Các
                      khoản giảm trừ
                    </Text>
                    <Text>
                      <Text strong>Thu nhập chịu thuế TNCN</Text> = Tổng thu nhập - Các
                      khoản thu nhập được miễn thuế TNCN
                    </Text>
                    <Text>
                      <Text strong>Tổng thu nhập</Text> được xác định theo quy định tại
                      Khoản 2 Điều 2 Thông tư 111/2013/TT-BTC và Khoản 1, 2, 3, 4, 5 Điều
                      11 Thông tư 92/2015/TT-BTC.
                    </Text>
                    <Text>
                      <Text strong>Các khoản thu nhập được miễn thuế</Text> được xác định là
                      thu nhập từ phần tiền lương, tiền công làm việc ban đêm, làm thêm giờ
                      được trả cao hơn so với tiền lương, tiền công làm việc ban ngày, làm
                      việc trong giờ theo quy định của pháp luật. (Xem thêm tại Điểm i Khoản
                      1 Điều 3 Thông tư 111/2013/TT-BTC).
                    </Text>
                  </Space>

                  <Title level={5} style={{ marginTop: 16 }}>
                    Các khoản giảm trừ bao gồm các khoản giảm trừ gia cảnh:
                  </Title>
                  <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                    <li>
                      <Text>
                        Đối với người nộp thuế: Mức giảm trừ gia cảnh là{" "}
                        <Text strong style={{ color: "#52c41a" }}>
                          11 triệu đồng/tháng, 132 triệu đồng/năm
                        </Text>
                        .
                      </Text>
                    </li>
                    <li>
                      <Text>
                        Đối với người phụ thuộc: Mức giảm trừ gia cảnh là{" "}
                        <Text strong style={{ color: "#52c41a" }}>
                          4,4 triệu đồng/người/tháng
                        </Text>
                        .
                      </Text>
                    </li>
                    <li>
                      <Text>
                        Ngoài ra, giảm trừ gia cảnh còn bao gồm các khoản đóng bảo hiểm, quỹ
                        hưu trí tự nguyện theo hướng dẫn tại Khoản 2 Điều 9 Thông tư
                        111/2013/TT-BTC. Và các khoản đóng góp từ thiện, nhân đạo, khuyến học
                        theo hướng dẫn tại Khoản 3 Điều 9 Thông tư 111/2013/TT-BTC.
                      </Text>
                    </li>
                  </ul>
                </Card>
              </div>
            </Space>
          </Card>

          {/* Thuế suất lũy tiến từng phần (7 bậc hiện hành) */}
          <Card
            type="inner"
            title="Thuế suất lũy tiến từng phần (7 bậc hiện hành)"
            style={{ marginTop: 24 }}
          >
            <Table
              pagination={false}
              bordered
              size="middle"
              columns={[
                { title: "Bậc", dataIndex: "b", key: "b", align: "center", width: "10%" },
                {
                  title: "Phần thu nhập tính thuế/năm (triệu đồng)",
                  dataIndex: "year",
                  key: "year",
                  width: "30%",
                },
                {
                  title: "Phần thu nhập tính thuế/tháng (triệu đồng)",
                  dataIndex: "month",
                  key: "month",
                  width: "30%",
                },
                { title: "Thuế suất (%)", dataIndex: "rate", key: "rate", align: "center", width: "15%" },
              ]}
              dataSource={[
                { key: "b1", b: 1, year: "Đến 60", month: "Đến 5", rate: 5 },
                { key: "b2", b: 2, year: "Trên 60 đến 120", month: "Trên 5 đến 10", rate: 10 },
                { key: "b3", b: 3, year: "Trên 120 đến 216", month: "Trên 10 đến 18", rate: 15 },
                { key: "b4", b: 4, year: "Trên 216 đến 384", month: "Trên 18 đến 32", rate: 20 },
                { key: "b5", b: 5, year: "Trên 384 đến 624", month: "Trên 32 đến 52", rate: 25 },
                { key: "b6", b: 6, year: "Trên 624 đến 960", month: "Trên 52 đến 80", rate: 30 },
                { key: "b7", b: 7, year: "Trên 960", month: "Trên 80", rate: 35 },
              ]}
              rowClassName={(record, index) => (index % 2 === 0 ? "even-row" : "odd-row")}
            />
          </Card>

          {/* Công thức rút gọn (Cách 1 / Cách 2) */}
          <Card
            type="inner"
            title="Công thức tính thuế rút gọn (tham khảo)"
            style={{ marginTop: 24 }}
          >
            <Table
              pagination={false}
              bordered
              size="middle"
              columns={[
                { title: "Bậc", dataIndex: "b", key: "b", align: "center", width: "10%" },
                { title: "Thu nhập tính thuế/tháng", dataIndex: "range", key: "range", width: "30%" },
                { title: "Thuế suất", dataIndex: "rate", key: "rate", align: "center", width: "10%" },
                { title: "Tính số thuế phải nộp - Cách 1", dataIndex: "c1", key: "c1", width: "25%" },
                { title: "Tính số thuế phải nộp - Cách 2", dataIndex: "c2", key: "c2", width: "25%" },
              ]}
              dataSource={[
                { key: "r1", b: 1, range: "Đến 5 triệu đồng", rate: "5%", c1: "0 trđ + 5% TNTT", c2: "5% TNTT" },
                {
                  key: "r2",
                  b: 2,
                  range: "Trên 5 đến 10 trđ",
                  rate: "10%",
                  c1: "0,25 trđ + 10% TNTT trên 5 trđ",
                  c2: "10% TNTT - 0,25 trđ",
                },
                {
                  key: "r3",
                  b: 3,
                  range: "Trên 10 đến 18 trđ",
                  rate: "15%",
                  c1: "0,75 trđ + 15% TNTT trên 10 trđ",
                  c2: "15% TNTT - 0,75 trđ",
                },
                {
                  key: "r4",
                  b: 4,
                  range: "Trên 18 đến 32 trđ",
                  rate: "20%",
                  c1: "1,95 trđ + 20% TNTT trên 18 trđ",
                  c2: "20% TNTT - 1,65 trđ",
                },
                {
                  key: "r5",
                  b: 5,
                  range: "Trên 32 đến 52 trđ",
                  rate: "25%",
                  c1: "4,75 trđ + 25% TNTT trên 32 trđ",
                  c2: "25% TNTT - 3,25 trđ",
                },
                {
                  key: "r6",
                  b: 6,
                  range: "Trên 52 đến 80 trđ",
                  rate: "30%",
                  c1: "9,75 trđ + 30% TNTT trên 52 trđ",
                  c2: "30% TNTT - 5,85 trđ",
                },
                {
                  key: "r7",
                  b: 7,
                  range: "Trên 80 trđ",
                  rate: "35%",
                  c1: "18,15 trđ + 35% TNTT trên 80 trđ",
                  c2: "35% TNTT - 9,85 trđ",
                },
              ]}
              rowClassName={(record, index) => (index % 2 === 0 ? "even-row" : "odd-row")}
            />
          </Card>

          {/* Mức lương bao nhiêu phải nộp thuế? (có người phụ thuộc) */}
          <Card
            type="inner"
            title="Mức lương bao nhiêu phải nộp thuế? (tham khảo theo số người phụ thuộc)"
            style={{ marginTop: 24 }}
          >
            <Table
              pagination={false}
              bordered
              size="middle"
              columns={[
                { title: "STT", dataIndex: "stt", key: "stt", align: "center", width: "10%" },
                { title: "Số người phụ thuộc", dataIndex: "dep", key: "dep", width: "30%" },
                {
                  title: "Thu nhập từ tiền công, tiền lương/tháng",
                  dataIndex: "month",
                  key: "month",
                  width: "30%",
                },
                {
                  title: "Tổng thu nhập từ tiền công, tiền lương/năm",
                  dataIndex: "year",
                  key: "year",
                  width: "30%",
                },
              ]}
              dataSource={[
                { key: "m1", stt: 1, dep: "Không có người phụ thuộc", month: "> 11 triệu đồng", year: "> 132 triệu đồng" },
                { key: "m2", stt: 2, dep: "Có 1 người phụ thuộc", month: "> 15,4 triệu đồng", year: "> 184,8 triệu đồng" },
                { key: "m3", stt: 3, dep: "Có 2 người phụ thuộc", month: "> 19,8 triệu đồng", year: "> 237,6 triệu đồng" },
                { key: "m4", stt: 4, dep: "Có 3 người phụ thuộc", month: "> 24,2 triệu đồng", year: "> 290,4 triệu đồng" },
                { key: "m5", stt: 5, dep: "Có 4 người phụ thuộc", month: "> 28,4 triệu đồng", year: "> 343,2 triệu đồng" },
              ]}
              rowClassName={(record, index) => (index % 2 === 0 ? "even-row" : "odd-row")}
            />
            <Text type="secondary" style={{ display: "block", marginTop: 12 }}>
              Lưu ý: Thu nhập trong bảng đã trừ các khoản bảo hiểm bắt buộc, khoản không tính thuế như phụ cấp ăn trưa, gửi xe,...
            </Text>
          </Card>

          {/* Cá nhân không ký hợp đồng hoặc HĐ dưới 3 tháng */}
          <Card
            type="inner"
            title="B. Đối với cá nhân không ký hợp đồng lao động hoặc hợp đồng lao động dưới 3 tháng"
            style={{ marginTop: 24 }}
          >
            <div
              style={{
                background: "#f0f9ff",
                padding: 16,
                borderRadius: 8,
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              <Text strong>Thuế thu nhập cá nhân phải nộp = 10% × Tổng thu nhập trước khi trả</Text>
            </div>
            <Text>
              Thu nhập chịu thuế là tổng thu nhập nhận được; không áp dụng giảm trừ gia cảnh. Doanh nghiệp khấu trừ 10% trên tổng thu nhập chi trả.
            </Text>
          </Card>

          {/* Cá nhân không cư trú */}
          <Card
            type="inner"
            title="Cá nhân không cư trú"
            style={{ marginTop: 24 }}
          >
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Text>
                Cá nhân không cư trú là người nước ngoài không đáp ứng điều kiện cư trú tại Việt Nam theo Điều 2 Luật Thuế thu nhập cá nhân 2007.
              </Text>
              <div
                style={{
                  background: "#f0f9ff",
                  padding: 16,
                  borderRadius: 8,
                  textAlign: "center",
                }}
              >
                <Text strong>Thuế TNCN phải nộp = Thu nhập chịu thuế TNCN × Thuế suất 20%</Text>
              </div>
              <Text>
                Thu nhập chịu thuế từ tiền lương, tiền công của cá nhân không cư trú xác định tương tự cá nhân cư trú; thời điểm xác định thu nhập tính thuế là thời điểm chi trả.
              </Text>
              <Card type="inner" title="Cách xác định thu nhập phát sinh tại Việt Nam (tóm tắt)" style={{ marginTop: 8 }}>
                <Space direction="vertical" size="small" style={{ width: "100%" }}>
                  <Text strong>Đối với cá nhân nước ngoài hiện diện tại Việt Nam:</Text>
                  <div
                    style={{
                      background: "#fff7e6",
                      padding: 12,
                      borderRadius: 8,
                    }}
                  >
                    <Text>
                      Thu nhập phát sinh tại Việt Nam = (Số ngày làm việc tại VN / Số ngày làm việc trong năm) × Thu nhập toàn cầu (trước thuế)
                    </Text>
                  </div>
                  <Text strong>Đối với cá nhân nước ngoài không hiện diện tại Việt Nam:</Text>
                  <div
                    style={{
                      background: "#fff7e6",
                      padding: 12,
                      borderRadius: 8,
                    }}
                  >
                    <Text>
                      Thu nhập phát sinh tại Việt Nam = (Số ngày có mặt ở VN / 365 ngày) × Thu nhập toàn cầu + Thu nhập chịu thuế khác (trước thuế) phát sinh tại VN
                    </Text>
                  </div>
                  <Text type="secondary">
                    Thu nhập chịu thuế khác (trước thuế) phát sinh tại Việt Nam bao gồm lợi ích khác bằng tiền hoặc không bằng tiền.
                  </Text>
                </Space>
              </Card>
              <Text>
                Cá nhân không cư trú không được giảm trừ gia cảnh; chỉ cần có thu nhập chịu thuế là phải nộp 20% thuế TNCN.
              </Text>
            </Space>
          </Card>

          {/* Các khoản phụ cấp, trợ cấp không tính thuế */}
          <Card
            type="inner"
            title="Những quy định thu nhập cá nhân khác (phụ cấp, trợ cấp không tính thuế)"
            style={{ marginTop: 24 }}
          >
            <ul style={{ paddingLeft: 20 }}>
              <li>Trợ cấp, phụ cấp ưu đãi hàng tháng theo pháp luật ưu đãi người có công.</li>
              <li>Trợ cấp khó khăn, tai nạn lao động, bệnh nghề nghiệp; trợ cấp thôi việc, mất việc.</li>
              <li>Trợ cấp một lần khi sinh con hoặc nhận nuôi con nuôi; trợ cấp dưỡng sức, phục hồi sức khỏe sau thai sản.</li>
              <li>Phụ cấp công tác phí theo quy định; phụ cấp trang phục, điện thoại, xăng xe trong mức cho phép.</li>
              <li>Phụ cấp cho người làm thêm giờ được trả cao hơn so với tiền lương làm việc ban ngày/giờ hành chính theo quy định.</li>
            </ul>
          </Card>

          {/* Thử việc / Tăng ca */}
          <Card
            type="inner"
            title="Thử việc, làm thêm giờ có bị tính thuế?"
            style={{ marginTop: 24 }}
          >
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <div>
                <Title level={5}>Thử việc có cần đóng thuế TNCN?</Title>
                <Text>
                  Nếu thu nhập từ tiền lương, tiền công đạt từ 2.000.000đ/lần trở lên thì doanh nghiệp khấu trừ 10% trước khi trả cho người lao động (theo Thông tư 111/2013/TT-BTC).
                </Text>
              </div>
              <div>
                <Title level={5}>Tiền tăng ca, làm thêm giờ</Title>
                <Text>
                  Phần tiền lương làm thêm giờ được trả cao hơn so với tiền lương làm việc trong giờ được miễn thuế. Phần tiền tương ứng với mức lương làm trong giờ vẫn tính thuế.
                </Text>
              </div>
            </Space>
          </Card>
        </Card>
      </div>
    </div>
  );
}

export default PersonalIncomeTax;

