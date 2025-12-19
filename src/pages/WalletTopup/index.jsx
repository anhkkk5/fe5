import React, { useState } from "react";
import { Button, Card, Form, InputNumber, Select, message } from "antd";
import { createMomoPayment } from "../../services/payments/paymentsServices";

export default function WalletTopup() {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const res = await createMomoPayment(values);
      if (res?.payUrl) {
        window.location.href = res.payUrl;
        return;
      }
      message.error("Không nhận được payUrl");
    } catch (e) {
      message.error(e?.response?.data?.message || e?.message || "Lỗi tạo thanh toán");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "24px auto" }}>
      <Card title="MoMo Sandbox - Nạp ví / Mua lượt đăng tin">
        <Form
          layout="vertical"
          initialValues={{ purpose: "TOPUP", amount: 50000, jobCredits: 5 }}
          onFinish={onFinish}
        >
          <Form.Item name="purpose" label="Mục đích" rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: "TOPUP", label: "Nạp ví (TOPUP)" },
                { value: "BUY_JOB_CREDITS", label: "Mua lượt đăng tin (BUY_JOB_CREDITS)" },
              ]}
            />
          </Form.Item>

          <Form.Item name="amount" label="Số tiền" rules={[{ required: true }]}>
            <InputNumber min={1000} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item shouldUpdate={(prev, cur) => prev.purpose !== cur.purpose} noStyle>
            {({ getFieldValue }) => {
              const purpose = getFieldValue("purpose");
              if (purpose !== "BUY_JOB_CREDITS") return null;
              return (
                <Form.Item name="jobCredits" label="Số lượt đăng tin" rules={[{ required: true }]}>
                  <InputNumber min={1} style={{ width: "100%" }} />
                </Form.Item>
              );
            }}
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={loading}>
            Thanh toán MoMo
          </Button>
        </Form>
      </Card>
    </div>
  );
}
