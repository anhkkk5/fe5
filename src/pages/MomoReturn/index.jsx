import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, Result, Spin } from "antd";
import { getPaymentStatus } from "../../services/payments/paymentsServices";

export default function MomoReturn() {
  const [searchParams] = useSearchParams();
  const orderId = useMemo(() => searchParams.get("orderId"), [searchParams]);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        if (!orderId) {
          setError("Thiếu orderId");
          return;
        }
        const res = await getPaymentStatus(orderId);
        if (mounted) setData(res);
      } catch (e) {
        if (mounted) setError(e?.response?.data?.message || e?.message || "Lỗi lấy trạng thái");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [orderId]);

  const status = data?.status;

  const resultProps = (() => {
    if (!orderId) return { status: "error", title: "Thiếu orderId" };
    if (loading) return { status: "info", title: "Đang kiểm tra thanh toán..." };
    if (error) return { status: "error", title: "Không lấy được trạng thái", subTitle: error };
    if (status === "SUCCESS") return { status: "success", title: "Thanh toán thành công" };
    if (status === "FAILED") return { status: "error", title: "Thanh toán thất bại", subTitle: data?.momoMessage || "" };
    return { status: "info", title: "Đang chờ xác nhận (IPN)" };
  })();

  return (
    <div style={{ maxWidth: 720, margin: "24px auto" }}>
      <Card>
        {loading ? (
          <div style={{ textAlign: "center", padding: 24 }}>
            <Spin />
          </div>
        ) : (
          <Result
            status={resultProps.status}
            title={resultProps.title}
            subTitle={resultProps.subTitle}
            extra={[
              <div key="info" style={{ marginBottom: 12 }}>
                <div>orderId: {orderId || ""}</div>
                {data ? (
                  <div>
                    <div>purpose: {data.purpose}</div>
                    <div>amount: {data.amount}</div>
                    <div>status: {data.status}</div>
                  </div>
                ) : null}
              </div>,
              <Link key="home" to="/">Về trang chủ</Link>,
            ]}
          />
        )}
      </Card>
    </div>
  );
}
