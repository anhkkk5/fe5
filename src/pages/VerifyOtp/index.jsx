import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Form, Input, Space, Typography, message } from "antd";
import { resendOtp, verifyOtp } from "../../services/auth/authServices";
import "../../pages/login/style.css";

const { Title, Text } = Typography;

function VerifyOtp() {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [otpExpiresAt, setOtpExpiresAt] = useState(null);
  const cooldownTimerRef = useRef(null);
  const expiryTimerRef = useRef(null);
  const [expirySecondsLeft, setExpirySecondsLeft] = useState(null);

  const emailFromState = location?.state?.email;
  const emailFromQuery = useMemo(() => {
    try {
      const sp = new URLSearchParams(location.search);
      return sp.get("email") || "";
    } catch (_) {
      return "";
    }
  }, [location.search]);

  const initialEmail = emailFromState || emailFromQuery || "";

  const otpExpiresAtFromState = location?.state?.otpExpiresAt;

  useEffect(() => {
    if (otpExpiresAtFromState) {
      setOtpExpiresAt(otpExpiresAtFromState);
    }
  }, [otpExpiresAtFromState]);

  useEffect(() => {
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    cooldownTimerRef.current = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!otpExpiresAt) return;
    if (expiryTimerRef.current) clearInterval(expiryTimerRef.current);
    const tick = () => {
      const t = new Date(otpExpiresAt).getTime();
      if (Number.isNaN(t)) {
        setExpirySecondsLeft(null);
        return;
      }
      const diff = Math.max(0, Math.floor((t - Date.now()) / 1000));
      setExpirySecondsLeft(diff);
    };
    tick();
    expiryTimerRef.current = setInterval(tick, 1000);
    return () => {
      if (expiryTimerRef.current) clearInterval(expiryTimerRef.current);
    };
  }, [otpExpiresAt]);

  const formatMMSS = (seconds) => {
    if (seconds === null || seconds === undefined) return "";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const rules = [
    {
      required: true,
      message: "Trường này là bắt buộc!",
    },
  ];

  const onFinish = async (values) => {
    try {
      setLoading(true);
      await verifyOtp({ email: values.email, otp: values.otp });
      messageApi.success("Xác thực OTP thành công! Vui lòng đăng nhập.");
      form.resetFields();
      setTimeout(() => navigate("/login"), 800);
    } catch (error) {
      const backendMsg = error?.response?.data?.message;
      if (backendMsg) messageApi.error(Array.isArray(backendMsg) ? backendMsg.join(", ") : backendMsg);
      else messageApi.error("Xác thực OTP thất bại. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const email = form.getFieldValue("email") || initialEmail;
    if (!email) {
      messageApi.error("Vui lòng nhập email trước khi gửi lại mã.");
      return;
    }
    try {
      setResending(true);
      const res = await resendOtp({ email });
      messageApi.success("Đã gửi lại mã OTP. Vui lòng kiểm tra email.");
      const cd = Number(res?.cooldownSeconds);
      setCooldown(Number.isFinite(cd) && cd > 0 ? cd : 60);
      if (res?.otpExpiresAt) setOtpExpiresAt(res.otpExpiresAt);
    } catch (error) {
      const backendMsg = error?.response?.data?.message;
      if (backendMsg) messageApi.error(Array.isArray(backendMsg) ? backendMsg.join(", ") : backendMsg);
      else messageApi.error("Gửi lại OTP thất bại. Vui lòng thử lại!");
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      {contextHolder}
      <div className="login-container">
        <div className="login-row" style={{ maxWidth: 520, margin: "0 auto" }}>
          <div className="login-form-wrapper" style={{ width: "100%" }}>
            <div className="logo-section">
              <img
                src="/src/assets/logologin.png"
                alt="RIKEI Edu Logo"
                className="logo-image"
              />
            </div>

            <Title level={3} className="login-heading" style={{ marginBottom: 8 }}>
              Xác thực OTP
            </Title>
            <Text type="secondary" style={{ display: "block", marginBottom: 20 }}>
              Nhập mã OTP đã được gửi về email của bạn.
            </Text>

            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              className="login-form"
              initialValues={{ email: initialEmail }}
            >
              <Form.Item label="Email" name="email" rules={[...rules, { type: "email", message: "Email không hợp lệ!" }]}>
                <Input placeholder="abc@gmail.com" className="login-input" disabled={!!initialEmail} />
              </Form.Item>

              <Form.Item label="OTP" name="otp" rules={rules}>
                <Input placeholder="Nhập mã OTP" className="login-input" maxLength={6} />
              </Form.Item>

              <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text type="secondary">
                  {typeof expirySecondsLeft === "number" ? `OTP hết hạn sau: ${formatMMSS(expirySecondsLeft)}` : ""}
                </Text>
                <Space size={8}>
                  <Button
                    onClick={handleResend}
                    disabled={cooldown > 0 || resending}
                    loading={resending}
                  >
                    {cooldown > 0 ? `Gửi lại mã (${cooldown}s)` : "Gửi lại mã"}
                  </Button>
                </Space>
              </div>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  className="login-button"
                  loading={loading}
                  style={{ backgroundColor: "red", borderColor: "red" }}
                >
                  Xác thực
                </Button>
              </Form.Item>

              <div className="login-links">
                <Text className="signup-text">
                  Quay lại{" "}
                  <Text
                    className="signup-link"
                    onClick={() => navigate("/login")}
                    style={{ color: "red", cursor: "pointer" }}
                  >
                    Đăng nhập
                  </Text>
                </Text>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </>
  );
}

export default VerifyOtp;
