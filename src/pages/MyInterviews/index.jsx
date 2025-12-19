import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Modal,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { getCookie } from "../../helpers/cookie";
import {
  confirmInterview,
  getMyInterviewSchedules,
  requestRescheduleInterview,
} from "../../services/interviewSchedules/interviewSchedulesServices";
import { getMyScorecards } from "../../services/interviewScorecards/interviewScorecardsServices";

const { Title, Text } = Typography;

const scheduleStatusMap = {
  pending: { color: "gold", label: "Chờ xác nhận" },
  confirmed: { color: "green", label: "Đã xác nhận" },
  reschedule_requested: { color: "orange", label: "Bạn đã xin đổi lịch" },
  rescheduled: { color: "blue", label: "Đã đổi lịch" },
  cancelled: { color: "red", label: "Đã huỷ" },
};

const decisionMap = {
  pass: { color: "green", label: "Đạt" },
  fail: { color: "red", label: "Không đạt" },
  next_round: { color: "blue", label: "Qua vòng tiếp theo" },
};

function MyInterviews() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [scorecardMap, setScorecardMap] = useState({});

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [scorecardOpen, setScorecardOpen] = useState(false);
  const [active, setActive] = useState(null);
  const [activeScorecard, setActiveScorecard] = useState(null);

  const [confirmForm] = Form.useForm();
  const [rescheduleForm] = Form.useForm();

  const userType = getCookie("userType");

  const load = async () => {
    setLoading(true);
    try {
      const [data, scorecards] = await Promise.all([
        getMyInterviewSchedules(),
        getMyScorecards(),
      ]);
      const scheduleList = Array.isArray(data) ? data : [];
      setItems(scheduleList);

      const map = {};
      (Array.isArray(scorecards) ? scorecards : []).forEach((sc) => {
        const sid = sc?.schedule?.id;
        if (sid) map[sid] = sc;
      });
      setScorecardMap(map);
    } catch (e) {
      const backendMsg = e?.response?.data?.message;
      message.error(
        backendMsg
          ? Array.isArray(backendMsg)
            ? backendMsg.join(", ")
            : backendMsg
          : "Không thể tải lịch phỏng vấn",
      );
    } finally {
      setLoading(false);
    }
  };

  const openScorecard = (record) => {
    const sc = scorecardMap?.[record?.id];
    if (!sc) {
      message.info("Chưa có kết quả/đánh giá cho lịch này");
      return;
    }
    setActive(record);
    setActiveScorecard(sc);
    setScorecardOpen(true);
  };

  useEffect(() => {
    if (userType !== "candidate") {
      message.warning("Vui lòng đăng nhập bằng tài khoản ứng viên để xem lịch phỏng vấn");
      return;
    }
    load();
  }, []);

  const openConfirm = (record) => {
    setActive(record);
    setConfirmOpen(true);
    confirmForm.setFieldsValue({ note: "" });
  };

  const openRequestReschedule = (record) => {
    setActive(record);
    setRescheduleOpen(true);
    rescheduleForm.setFieldsValue({ reason: "" });
  };

  const onConfirm = async (values) => {
    try {
      if (!active?.id) return;
      await confirmInterview(active.id, { note: values.note });
      message.success("Đã xác nhận lịch phỏng vấn");
      setConfirmOpen(false);
      setActive(null);
      confirmForm.resetFields();
      await load();
    } catch (e) {
      const backendMsg = e?.response?.data?.message;
      message.error(
        backendMsg
          ? Array.isArray(backendMsg)
            ? backendMsg.join(", ")
            : backendMsg
          : "Xác nhận thất bại",
      );
    }
  };

  const onRequestReschedule = async (values) => {
    try {
      if (!active?.id) return;
      await requestRescheduleInterview(active.id, { reason: values.reason });
      message.success("Đã gửi yêu cầu xin đổi lịch");
      setRescheduleOpen(false);
      setActive(null);
      rescheduleForm.resetFields();
      await load();
    } catch (e) {
      const backendMsg = e?.response?.data?.message;
      message.error(
        backendMsg
          ? Array.isArray(backendMsg)
            ? backendMsg.join(", ")
            : backendMsg
          : "Gửi yêu cầu đổi lịch thất bại",
      );
    }
  };

  const columns = [
    {
      title: "Vị trí",
      dataIndex: "job",
      key: "job",
      width: 180,
      ellipsis: true,
      render: (_, r) => (
        <Text ellipsis={{ tooltip: r.job?.title }}>{r.job?.title || "-"}</Text>
      ),
    },
    {
      title: "Công ty",
      dataIndex: "company",
      key: "company",
      width: 160,
      ellipsis: true,
      render: (_, r) => {
        const name = r.company?.companyName || r.company?.fullName || "-";
        return <Text ellipsis={{ tooltip: name }}>{name}</Text>;
      },
    },
    {
      title: "Thời gian",
      dataIndex: "scheduledAt",
      key: "scheduledAt",
      width: 170,
      render: (v) => <Text>{v ? new Date(v).toLocaleString("vi-VN") : "-"}</Text>,
    },
    {
      title: "Hình thức",
      dataIndex: "mode",
      key: "mode",
      width: 100,
      render: (v) => (v === "online" ? <Tag color="blue">Online</Tag> : <Tag>Offline</Tag>),
    },
    {
      title: "Địa điểm/Link",
      key: "place",
      width: 260,
      ellipsis: true,
      render: (_, r) => (
        <Text
          ellipsis={{
            tooltip: r.mode === "online" ? r.meetingLink || "-" : r.address || "-",
          }}
        >
          {r.mode === "online" ? (
            r.meetingLink ? (
              <a href={r.meetingLink} target="_blank" rel="noreferrer">
                {r.meetingLink}
              </a>
            ) : (
              "-"
            )
          ) : (
            r.address || "-"
          )}
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 170,
      render: (v) => {
        const st = scheduleStatusMap[v] || scheduleStatusMap.pending;
        return <Tag color={st.color}>{st.label}</Tag>;
      },
    },
    {
      title: "Kết quả",
      key: "decision",
      width: 160,
      render: (_, r) => {
        const sc = scorecardMap?.[r.id];
        if (!sc?.decision) return <Text type="secondary">-</Text>;
        const dm = decisionMap[sc.decision] || { color: "default", label: sc.decision };
        const label =
          sc.decision === "next_round" && sc.nextRound
            ? `${dm.label} (V${sc.nextRound})`
            : dm.label;
        return <Tag color={dm.color}>{label}</Tag>;
      },
    },
    {
      title: "Hành động",
      key: "actions",
      width: 260,
      render: (_, r) => (
        <Space wrap size="small">
          <Button
            type="primary"
            size="small"
            disabled={r.status === "confirmed"}
            onClick={() => openConfirm(r)}
          >
            Xác nhận
          </Button>
          <Button size="small" onClick={() => openRequestReschedule(r)}>
            Xin đổi lịch
          </Button>
          <Button type="link" size="small" onClick={() => openScorecard(r)}>
            Xem kết quả
          </Button>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 32px" }}>
      <Card bodyStyle={{ padding: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 24px 0 24px",
          }}
        >
          <Title level={3} style={{ margin: 0, paddingLeft: 16 }}>
            Lịch phỏng vấn của tôi
          </Title>
          <Button onClick={load}>Tải lại</Button>
        </div>

        <div style={{ padding: "12px 24px 24px 24px", overflowX: "auto" }}>
          <Table
            columns={columns}
            dataSource={(items || []).map((s) => ({ ...s, key: s.id }))}
            pagination={{ pageSize: 10 }}
            tableLayout="fixed"
            scroll={{ x: "max-content" }}
          />
        </div>
      </Card>

      <Modal
        title="Xác nhận tham gia phỏng vấn"
        open={confirmOpen}
        onCancel={() => {
          setConfirmOpen(false);
          setActive(null);
        }}
        onOk={() => confirmForm.submit()}
        okText="Xác nhận"
      >
        <Form form={confirmForm} layout="vertical" onFinish={onConfirm}>
          <Form.Item label="Ghi chú" name="note">
            <Input.TextArea rows={3} placeholder="(tuỳ chọn)" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Xin đổi lịch phỏng vấn"
        open={rescheduleOpen}
        onCancel={() => {
          setRescheduleOpen(false);
          setActive(null);
        }}
        onOk={() => rescheduleForm.submit()}
        okText="Gửi yêu cầu"
      >
        <Form form={rescheduleForm} layout="vertical" onFinish={onRequestReschedule}>
          <Form.Item
            label="Lý do"
            name="reason"
            rules={[{ required: true, message: "Nhập lý do" }]}
          >
            <Input.TextArea rows={3} placeholder="VD: Trùng lịch, bận đột xuất..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Kết quả/Đánh giá phỏng vấn"
        open={scorecardOpen}
        onCancel={() => {
          setScorecardOpen(false);
          setActive(null);
          setActiveScorecard(null);
        }}
        footer={null}
      >
        {activeScorecard ? (
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Quyết định">
              {(() => {
                const dm = decisionMap[activeScorecard.decision] || {
                  color: "default",
                  label: activeScorecard.decision,
                };
                const label =
                  activeScorecard.decision === "next_round" && activeScorecard.nextRound
                    ? `${dm.label} (V${activeScorecard.nextRound})`
                    : dm.label;
                return <Tag color={dm.color}>{label}</Tag>;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="Technical">
              {activeScorecard.technicalScore ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Communication">
              {activeScorecard.communicationScore ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Culture fit">
              {activeScorecard.cultureFitScore ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Điểm mạnh">
              {activeScorecard.strengths || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Điểm yếu">
              {activeScorecard.weaknesses || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú">
              {activeScorecard.notes || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Cập nhật lúc">
              {activeScorecard.updated_at
                ? new Date(activeScorecard.updated_at).toLocaleString("vi-VN")
                : "-"}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Text type="secondary">Không có dữ liệu</Text>
        )}
      </Modal>
    </div>
  );
}

export default MyInterviews;
