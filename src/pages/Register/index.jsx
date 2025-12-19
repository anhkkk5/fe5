import React from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Form, Input, Button, message, Typography } from "antd";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { registerCandidate } from "../../services/auth/authServices";
import "../../pages/login/style.css";

const { Title, Text } = Typography;

function Register() {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // Define validation rules
  const rules = [
    {
      required: true,
      message: "Trường này là bắt buộc!",
    },
  ];

  const onFinish = async (values) => {
    try {
      console.log("Registration attempt:", values);

      // Validate password confirmation
      if (values.password !== values.confirmPassword) {
        messageApi.error("Mật khẩu xác nhận không khớp!");
        return;
      }
      // Call backend register API
      const result = await registerCandidate({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });

      if (result) {
        messageApi.success("Đăng ký thành công! Vui lòng nhập OTP để xác thực tài khoản.");
        form.resetFields();
        setTimeout(() => {
          navigate(`/verify-otp?email=${encodeURIComponent(values.email)}`, {
            state: { email: values.email, otpExpiresAt: result?.otpExpiresAt },
          });
        }, 800);
      } else {
        messageApi.error("Đăng ký thất bại. Vui lòng thử lại!");
      }
    } catch (error) {
      const backendMsg = error?.response?.data?.message;
      if (backendMsg) messageApi.error(Array.isArray(backendMsg) ? backendMsg.join(", ") : backendMsg);
      else messageApi.error("Đã có lỗi xảy ra. Vui lòng thử lại!");
      console.error("Registration error:", error);
    }
  };

  return (
    <>
      {contextHolder}
      <div className="login-container">
        <Row className="login-row" gutter={0}>
          {/* Left Column - Registration Form */}
          <Col xs={24} lg={12} className="login-form-col">
            <div className="login-form-wrapper">
              {/* Logo Section */}
              <div className="logo-section">
                <img
                  src="/src/assets/logologin.png"
                  alt="RIKEI Edu Logo"
                  className="logo-image"
                />
              </div>

              {/* Heading */}
              <Title level={2} className="login-heading">
                Cùng Rikkei Education xây dựng hồ sơ nổi bật và nhận được các cơ
                hội sự nghiệp lý tưởng
              </Title>

              {/* Registration Form */}
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                className="login-form"
              >
                <Form.Item label="Họ tên" name="fullName" rules={rules}>
                  <Input placeholder="Nhập họ tên" className="login-input" />
                </Form.Item>

                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    ...rules,
                    {
                      type: "email",
                      message: "Email không hợp lệ!",
                    },
                  ]}
                >
                  <Input placeholder="abc@gmail.com" className="login-input" />
                </Form.Item>

                <Form.Item
                  label="Password"
                  name="password"
                  rules={[
                    ...rules,
                    {
                      min: 6,
                      message: "Mật khẩu phải có ít nhất 6 ký tự!",
                    },
                  ]}
                >
                  <Input.Password
                    placeholder="•••••••••••••"
                    className="login-input"
                    iconRender={(visible) =>
                      visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                    }
                  />
                </Form.Item>

                <Form.Item
                  label="Confirm password"
                  name="confirmPassword"
                  rules={[
                    ...rules,
                    {
                      min: 6,
                      message: "Mật khẩu phải có ít nhất 6 ký tự!",
                    },
                  ]}
                >
                  <Input.Password
                    placeholder="•••••••••••••"
                    className="login-input"
                    iconRender={(visible) =>
                      visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                    }
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    className="login-button"
                    style={{
                      backgroundColor: "red",
                      borderColor: "red",
                    }}
                  >
                    Đăng ký
                  </Button>
                </Form.Item>

                {/* Links */}
                <div className="login-links">
                  <Text className="signup-text">
                    Bạn đã có tài khoản?{" "}
                    <Text
                      className="signup-link"
                      onClick={() => navigate("/login")}
                      style={{ color: "red", cursor: "pointer" }}
                    >
                      Đăng nhập ngay
                    </Text>
                  </Text>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginTop: 12,
                      whiteSpace: "nowrap",
                      flexWrap: "nowrap",
                      justifyContent: "center",
                      width: "100%",
                    }}
                  >
                    <Text>Hoặc đăng kí bằng:</Text>
                    
                    <span
                      onClick={() => navigate("/registerCompany")}
                      style={{ color: "red", cursor: "pointer" }}
                    >
                      Công ty
                    </span>
                  </div>
                </div>
              </Form>
            </div>
          </Col>

          {/* Right Column - Illustration */}
          <Col xs={24} lg={12} className="login-illustration-col">
            <div className="illustration-wrapper">
              <img
                src="/src/assets/anhloginuser.png"
                alt="Career Growth Illustration"
                className="illustration-image"
                style={{
                  width: "80%",
                  maxWidth: "80%",
                  height: "auto",
                  display: "block",
                  margin: "0 auto",
                }}
              />
            </div>
          </Col>
        </Row>
      </div>
    </>
  );
}

export default Register;
