import React, { useEffect, useRef, useState } from "react";
import { Button, Card, InputNumber, message, Space, Tag, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { getMyStars, upgradeAccountByStars } from "../../services/stars/starsServices";
import { createSepayTopup, getSepayTopupStatus } from "../../services/sepay/sepayServices";
import { getCookie } from "../../helpers/cookie";

const { Title, Text } = Typography;

export default function UpgradeAccount() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState(null);
  const [cost, setCost] = useState(10);
  const [buyStars, setBuyStars] = useState(10);
  const [topupLoading, setTopupLoading] = useState(false);
  const [topup, setTopup] = useState(null);
  const pollingRef = useRef(null);

  const load = async () => {
    try {
      const token = getCookie("token") || localStorage.getItem("token");
      if (!token) {
        message.warning("Vui lòng đăng nhập");
        navigate("/login");
        return;
      }
      const data = await getMyStars();
      setMe(data);
    } catch (e) {
      message.error(e?.response?.data?.message || "Không thể tải số sao");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  const onUpgrade = async () => {
    try {
      setLoading(true);
      const res = await upgradeAccountByStars(cost);
      message.success("Nâng cấp thành công!");
      setMe(res);
    } catch (e) {
      message.error(e?.response?.data?.message || e?.message || "Nâng cấp thất bại");
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (topupId) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    pollingRef.current = setInterval(async () => {
      try {
        const st = await getSepayTopupStatus(topupId);
        setTopup((prev) => ({ ...(prev || {}), ...st }));
        if (st?.status === "PAID") {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          message.success("Thanh toán thành công! Đang cập nhật số sao...");
          await load();
          setTimeout(() => {
            window.location.reload();
          }, 800);
        }
      } catch (_) {}
    }, 3000);
  };

  const onCreateTopup = async () => {
    try {
      setTopupLoading(true);
      const res = await createSepayTopup(buyStars);
      setTopup(res);
      message.success("Đã tạo đơn nạp sao. Vui lòng chuyển khoản đúng nội dung.");
      if (res?.id) startPolling(res.id);
    } catch (e) {
      message.error(e?.response?.data?.message || e?.message || "Tạo đơn nạp sao thất bại");
    } finally {
      setTopupLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: "24px auto", padding: 12 }}>
      <Card>
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          <Title level={3} style={{ marginBottom: 0 }}>Nâng cấp tài khoản</Title>
          <Text type="secondary">
            Nâng cấp bằng sao (stars). Admin có thể cộng sao cho bạn.
          </Text>

          <Card type="inner" title="Tài khoản của bạn">
            <Space size={12} wrap>
              <Tag color="blue">Role: {me?.role || "-"}</Tag>
              <Tag color="gold">Sao: {me?.stars ?? 0}</Tag>
              <Tag color={me?.isPremium ? "green" : "default"}>
                Premium: {me?.isPremium ? "Đã nâng cấp" : "Chưa"}
              </Tag>
            </Space>
          </Card>

          <Card type="inner" title="Gói nâng cấp (MVP)">
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text>Chi phí (sao):</Text>
              <InputNumber min={1} value={cost} onChange={(v) => setCost(v || 1)} />
              <Button type="primary" loading={loading} onClick={onUpgrade}>
                Nâng cấp ngay
              </Button>
            </Space>
          </Card>

          <Card type="inner" title="Mua sao (SePay)">
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text>Số sao muốn mua:</Text>
              <InputNumber min={1} value={buyStars} onChange={(v) => setBuyStars(v || 1)} />
              <Button type="primary" loading={topupLoading} onClick={onCreateTopup}>
                Tạo đơn thanh toán
              </Button>

              {topup ? (
                <Card type="inner" title="Thông tin chuyển khoản" style={{ marginTop: 8 }}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Text strong>Trạng thái: {topup?.status || "-"}</Text>
                    <Text>Số tiền (VND): {topup?.amount ?? "-"}</Text>
                    <Text>Nội dung chuyển khoản (bắt buộc): {topup?.paymentCode || "-"}</Text>

                    {topup?.status !== "PAID" && topup?.qrImageUrl ? (
                      <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                        <img
                          src={topup.qrImageUrl}
                          alt="QR thanh toán"
                          style={{ maxWidth: 320, width: "100%", height: "auto" }}
                        />
                      </div>
                    ) : null}

                    {topup?.qrContent ? (
                      <Text type="secondary">QR content: {topup.qrContent}</Text>
                    ) : null}

                    <Text>
                      Ngân hàng: {topup?.bank?.bankName || "-"}
                    </Text>
                    <Text>
                      STK: {topup?.bank?.accountNumber || "-"}
                    </Text>
                    <Text>
                      Chủ TK: {topup?.bank?.accountName || "-"}
                    </Text>
                    <Text type="secondary">*Hệ thống sẽ tự cộng sao sau khi SePay xác nhận giao dịch.</Text>
                  </Space>
                </Card>
              ) : null}
            </Space>
          </Card>
        </Space>
      </Card>
    </div>
  );
}
