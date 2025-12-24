import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Modal,
  Pagination,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";
import { getCookie } from "../../helpers/cookie";
import {
  createInterviewSchedule,
  deleteInterviewSchedule,
  getCompanyApprovedApplications,
  getCompanyInterviewSchedules,
  rescheduleInterview,
} from "../../services/interviewSchedules/interviewSchedulesServices";
import {
  getScorecardBySchedule,
  upsertScorecard,
} from "../../services/interviewScorecards/interviewScorecardsServices";

const { Title, Text } = Typography;

const scheduleStatusMap = {
  pending: { color: "gold", label: "Chờ xác nhận" },
  confirmed: { color: "green", label: "Đã xác nhận" },
  reschedule_requested: { color: "orange", label: "Ứng viên xin đổi lịch" },
  rescheduled: { color: "blue", label: "Đã đổi lịch" },
  cancelled: { color: "red", label: "Đã huỷ" },
};

function CompanyInterviewSchedules() {
  const [loading, setLoading] = useState(true);
  const [approvedApps, setApprovedApps] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [scorecardOpen, setScorecardOpen] = useState(false);
  const [activeSchedule, setActiveSchedule] = useState(null);

  const [createForm] = Form.useForm();
  const [rescheduleForm] = Form.useForm();
  const [scorecardForm] = Form.useForm();

  const userType = getCookie("userType");

  const load = async () => {
    setLoading(true);
    try {
      const [apps, sch] = await Promise.all([
        getCompanyApprovedApplications(),
        getCompanyInterviewSchedules(),
      ]);
      setApprovedApps(Array.isArray(apps) ? apps : []);
      setSchedules(Array.isArray(sch) ? sch : []);
    } catch (e) {
      const backendMsg = e?.response?.data?.message;
      message.error(
        backendMsg
          ? Array.isArray(backendMsg)
            ? backendMsg.join(", ")
            : backendMsg
          : "Không thể tải dữ liệu lịch phỏng vấn",
      );
    } finally {
      setLoading(false);
    }
  };

  const openScorecard = async (schedule) => {
    setActiveSchedule(schedule);
    setScorecardOpen(true);
    scorecardForm.resetFields();

    try {
      const existing = await getScorecardBySchedule(schedule.id);
      if (existing) {
        scorecardForm.setFieldsValue({
          technicalScore: existing.technicalScore,
          communicationScore: existing.communicationScore,
          cultureFitScore: existing.cultureFitScore,
          strengths: existing.strengths,
          weaknesses: existing.weaknesses,
          notes: existing.notes,
          decision: existing.decision,
          nextRound: existing.nextRound,
        });
      }
    } catch (_) {
      // ignore if not existing
    }
  };

  const onUpsertScorecard = async (values) => {
    try {
      if (!activeSchedule?.id) return;
      const payload = {
        technicalScore: values.technicalScore !== undefined ? Number(values.technicalScore) : undefined,
        communicationScore: values.communicationScore !== undefined ? Number(values.communicationScore) : undefined,
        cultureFitScore: values.cultureFitScore !== undefined ? Number(values.cultureFitScore) : undefined,
        strengths: values.strengths,
        weaknesses: values.weaknesses,
        notes: values.notes,
        decision: values.decision,
        nextRound: values.decision === "next_round" ? Number(values.nextRound) : undefined,
      };

      await upsertScorecard(activeSchedule.id, payload);
      message.success("Đã lưu đánh giá/ quyết định");
      setScorecardOpen(false);
      setActiveSchedule(null);
      scorecardForm.resetFields();
    } catch (e) {
      const backendMsg = e?.response?.data?.message;
      message.error(
        backendMsg
          ? Array.isArray(backendMsg)
            ? backendMsg.join(", ")
            : backendMsg
          : "Lưu đánh giá thất bại",
      );
    }
  };

  useEffect(() => {
    if (userType !== "company" && userType !== "admin") {
      message.warning("Vui lòng đăng nhập bằng tài khoản công ty để quản lý lịch phỏng vấn");
      return;
    }
    load();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [schedules.length]);

  const scheduledApplicationIds = useMemo(() => {
    const set = new Set();
    (Array.isArray(schedules) ? schedules : []).forEach((s) => {
      if (!s) return;
      // If a schedule exists (not cancelled), we consider this application already scheduled
      if (String(s.status || "") === "cancelled") return;
      const id = s.applicationId ?? s.application?.id ?? s.application_id;
      if (id !== null && typeof id !== "undefined") {
        set.add(String(id));
      }
    });
    return set;
  }, [schedules]);

  const availableApprovedApps = useMemo(() => {
    return (Array.isArray(approvedApps) ? approvedApps : []).filter((a) => {
      const id = a?.id;
      if (id === null || typeof id === "undefined") return false;
      return !scheduledApplicationIds.has(String(id));
    });
  }, [approvedApps, scheduledApplicationIds]);

  const appOptions = useMemo(() => {
    return availableApprovedApps.map((a) => {
      const candidateName = a.candidate?.fullName || a.candidate?.user?.name || "Ứng viên";
      const jobTitle = a.job?.title || "Công việc";
      return {
        label: `${candidateName} - ${jobTitle} (Application #${a.id})`,
        value: a.id,
      };
    });
  }, [availableApprovedApps]);

  const onCreate = async (values) => {
    try {
      const payload = {
        applicationId: values.applicationId,
        round: Number(values.round || 1),
        scheduledAt: values.scheduledAt?.toISOString(),
        mode: values.mode,
        address: values.mode === "offline" ? values.address : undefined,
        meetingLink: values.mode === "online" ? values.meetingLink : undefined,
        durationMinutes: values.durationMinutes ? Number(values.durationMinutes) : undefined,
      };

      await createInterviewSchedule(payload);
      message.success("Tạo lịch phỏng vấn thành công");
      setCreateOpen(false);
      createForm.resetFields();
      await load();
    } catch (e) {
      const backendMsg = e?.response?.data?.message;
      message.error(
        backendMsg
          ? Array.isArray(backendMsg)
            ? backendMsg.join(", ")
            : backendMsg
          : "Tạo lịch phỏng vấn thất bại",
      );
    }
  };

  const openReschedule = (schedule) => {
    setActiveSchedule(schedule);
    setRescheduleOpen(true);

    const dt = schedule?.scheduledAt ? dayjs(schedule.scheduledAt) : null;
    rescheduleForm.setFieldsValue({
      scheduledAt: dt,
      mode: schedule?.mode || "offline",
      address: schedule?.address,
      meetingLink: schedule?.meetingLink,
      note: "",
      durationMinutes: 30,
    });
  };

  const onReschedule = async (values) => {
    try {
      if (!activeSchedule?.id) return;
      const payload = {
        scheduledAt: values.scheduledAt?.toISOString(),
        mode: values.mode,
        address: values.mode === "offline" ? values.address : undefined,
        meetingLink: values.mode === "online" ? values.meetingLink : undefined,
        durationMinutes: values.durationMinutes ? Number(values.durationMinutes) : undefined,
        note: values.note,
      };

      await rescheduleInterview(activeSchedule.id, payload);
      message.success("Đổi lịch phỏng vấn thành công");
      setRescheduleOpen(false);
      setActiveSchedule(null);
      rescheduleForm.resetFields();
      await load();
    } catch (e) {
      const backendMsg = e?.response?.data?.message;
      message.error(
        backendMsg
          ? Array.isArray(backendMsg)
            ? backendMsg.join(", ")
            : backendMsg
          : "Đổi lịch thất bại",
      );
    }
  };

  const scheduleColumns = [
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
      title: "Ứng viên",
      dataIndex: "candidate",
      key: "candidate",
      width: 160,
      ellipsis: true,
      render: (_, r) => {
        const name = r.candidate?.fullName || r.candidate?.user?.name || "-";
        return <Text ellipsis={{ tooltip: name }}>{name}</Text>;
      },
    },
    {
      title: "Vòng",
      dataIndex: "round",
      key: "round",
      width: 80,
      render: (v) => <Text>{v || 1}</Text>,
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
      width: 180,
      render: (v) => {
        const st = scheduleStatusMap[v] || scheduleStatusMap.pending;
        return <Tag color={st.color}>{st.label}</Tag>;
      },
    },
    {
      title: "Hành động",
      key: "actions",
      width: 220,
      render: (_, r) => (
        <Space wrap size="small">
          <Button type="link" size="small" onClick={() => openReschedule(r)}>
            Đổi lịch
          </Button>
          <Button type="link" size="small" onClick={() => openScorecard(r)}>
            Chấm điểm
          </Button>
          <Button
            type="link"
            size="small"
            danger
            onClick={() => {
              Modal.confirm({
                title: "Xoá lịch phỏng vấn?",
                content: "Hành động này sẽ xoá lịch. Bạn chắc chắn muốn tiếp tục?",
                okText: "Xoá",
                okButtonProps: { danger: true },
                cancelText: "Huỷ",
                onOk: async () => {
                  try {
                    await deleteInterviewSchedule(r.id);
                    message.success("Đã xoá lịch phỏng vấn");
                    await load();
                  } catch (e) {
                    const backendMsg = e?.response?.data?.message;
                    message.error(
                      backendMsg
                        ? Array.isArray(backendMsg)
                          ? backendMsg.join(", ")
                          : backendMsg
                        : "Xoá lịch thất bại",
                    );
                  }
                },
              });
            }}
          >
            Xoá
          </Button>
        </Space>
      ),
    },
  ];

  const pageSize = 10;
  const paginatedSchedules = (Array.isArray(schedules) ? schedules : []).slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
      <Card bodyStyle={{ padding: 24 }}>
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Title level={3} style={{ margin: 0 }}>
            Quản lý lịch phỏng vấn
          </Title>
          <Space>
            <Button onClick={load}>Tải lại</Button>
            <Button
              type="primary"
              onClick={() => {
                createForm.resetFields();
                setCreateOpen(true);
              }}
            >
              Tạo lịch
            </Button>
          </Space>
        </Space>

        <div style={{ marginTop: 16 }}>
          <Table
            columns={scheduleColumns}
            dataSource={(paginatedSchedules || []).map((s) => ({ ...s, key: s.id }))}
            pagination={false}
            tableLayout="fixed"
            scroll={{ x: 1200 }}
          />
          <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={(Array.isArray(schedules) ? schedules : []).length}
              onChange={(page) => setCurrentPage(page)}
              showSizeChanger={false}
            />
          </div>
        </div>
      </Card>

      <Modal
        title="Tạo lịch phỏng vấn"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => createForm.submit()}
        okText="Tạo"
      >
        <Form form={createForm} layout="vertical" onFinish={onCreate}>
          <Form.Item
            label="Ứng viên đã duyệt"
            name="applicationId"
            rules={[{ required: true, message: "Chọn ứng viên" }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Chọn application"
              options={appOptions}
            />
          </Form.Item>

          <div style={{ marginTop: -12, marginBottom: 12 }}>
            <Text type="secondary">
              Các ứng viên đã có lịch phỏng vấn sẽ được ẩn để tránh tạo lịch trùng.
            </Text>
          </div>

          <Form.Item label="Vòng" name="round" initialValue={1}>
            <Input type="number" min={1} max={20} />
          </Form.Item>

          <Form.Item
            label="Thời gian"
            name="scheduledAt"
            rules={[{ required: true, message: "Chọn thời gian" }]}
          >
            <DatePicker showTime style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Hình thức"
            name="mode"
            initialValue="offline"
            rules={[{ required: true, message: "Chọn hình thức" }]}
          >
            <Select
              options={[
                { label: "Offline", value: "offline" },
                { label: "Online", value: "online" },
              ]}
            />
          </Form.Item>

          <Form.Item shouldUpdate noStyle>
            {({ getFieldValue }) => {
              const mode = getFieldValue("mode");
              return (
                <>
                  {mode === "offline" ? (
                    <Form.Item
                      label="Địa chỉ"
                      name="address"
                      rules={[{ required: true, message: "Nhập địa chỉ" }]}
                    >
                      <Input placeholder="VD: 123 Nguyễn Trãi, Q1" />
                    </Form.Item>
                  ) : (
                    <Form.Item
                      label="Link meeting"
                      name="meetingLink"
                      rules={[{ required: true, message: "Nhập link meeting" }]}
                    >
                      <Input placeholder="https://meet.google.com/..." />
                    </Form.Item>
                  )}
                </>
              );
            }}
          </Form.Item>

          <Form.Item label="Thời lượng (phút)" name="durationMinutes" initialValue={30}>
            <Input type="number" min={15} max={240} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Đổi lịch phỏng vấn"
        open={rescheduleOpen}
        onCancel={() => {
          setRescheduleOpen(false);
          setActiveSchedule(null);
        }}
        onOk={() => rescheduleForm.submit()}
        okText="Cập nhật"
      >
        <Form form={rescheduleForm} layout="vertical" onFinish={onReschedule}>
          <Form.Item
            label="Thời gian mới"
            name="scheduledAt"
            rules={[{ required: true, message: "Chọn thời gian" }]}
          >
            <DatePicker showTime style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Hình thức"
            name="mode"
            rules={[{ required: true, message: "Chọn hình thức" }]}
          >
            <Select
              options={[
                { label: "Offline", value: "offline" },
                { label: "Online", value: "online" },
              ]}
            />
          </Form.Item>

          <Form.Item shouldUpdate noStyle>
            {({ getFieldValue }) => {
              const mode = getFieldValue("mode");
              return (
                <>
                  {mode === "offline" ? (
                    <Form.Item
                      label="Địa chỉ"
                      name="address"
                      rules={[{ required: true, message: "Nhập địa chỉ" }]}
                    >
                      <Input placeholder="VD: 123 Nguyễn Trãi, Q1" />
                    </Form.Item>
                  ) : (
                    <Form.Item
                      label="Link meeting"
                      name="meetingLink"
                      rules={[{ required: true, message: "Nhập link meeting" }]}
                    >
                      <Input placeholder="https://meet.google.com/..." />
                    </Form.Item>
                  )}
                </>
              );
            }}
          </Form.Item>

          <Form.Item label="Thời lượng (phút)" name="durationMinutes" initialValue={30}>
            <Input type="number" min={15} max={240} />
          </Form.Item>

          <Form.Item label="Ghi chú" name="note">
            <Input.TextArea rows={3} placeholder="(tuỳ chọn)" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Đánh giá phỏng vấn (Scorecard)"
        open={scorecardOpen}
        onCancel={() => {
          setScorecardOpen(false);
          setActiveSchedule(null);
        }}
        onOk={() => scorecardForm.submit()}
        okText="Lưu"
        width={760}
      >
        <Form form={scorecardForm} layout="vertical" onFinish={onUpsertScorecard}>
          <Row gutter={16}>
            <Form.Item
              label="Technical (0-10)"
              name="technicalScore"
              style={{ width: "33.33%" }}
            >
              <Input type="number" min={0} max={10} />
            </Form.Item>
            <Form.Item
              label="Communication (0-10)"
              name="communicationScore"
              style={{ width: "33.33%" }}
            >
              <Input type="number" min={0} max={10} />
            </Form.Item>
            <Form.Item
              label="Culture fit (0-10)"
              name="cultureFitScore"
              style={{ width: "33.33%" }}
            >
              <Input type="number" min={0} max={10} />
            </Form.Item>
          </Row>

          <Row gutter={16}>
            <Form.Item label="Điểm mạnh" name="strengths" style={{ width: "50%" }}>
              <Input.TextArea rows={3} placeholder="(tuỳ chọn)" />
            </Form.Item>
            <Form.Item label="Điểm yếu" name="weaknesses" style={{ width: "50%" }}>
              <Input.TextArea rows={3} placeholder="(tuỳ chọn)" />
            </Form.Item>
          </Row>

          <Form.Item label="Ghi chú" name="notes">
            <Input.TextArea rows={3} placeholder="(tuỳ chọn)" />
          </Form.Item>

          <Row gutter={16}>
            <Form.Item
              label="Quyết định"
              name="decision"
              rules={[{ required: true, message: "Chọn quyết định" }]}
              style={{ width: "50%" }}
            >
              <Select
                options={[
                  { label: "Đạt", value: "pass" },
                  { label: "Không đạt", value: "fail" },
                  { label: "Qua vòng tiếp theo", value: "next_round" },
                ]}
              />
            </Form.Item>

            <Form.Item shouldUpdate noStyle>
              {({ getFieldValue }) => {
                const decision = getFieldValue("decision");
                if (decision !== "next_round") return <div style={{ width: "50%" }} />;
                return (
                  <Form.Item
                    label="Vòng tiếp theo"
                    name="nextRound"
                    rules={[{ required: true, message: "Nhập vòng tiếp theo" }]}
                    style={{ width: "50%" }}
                  >
                    <Input type="number" min={1} max={20} />
                  </Form.Item>
                );
              }}
            </Form.Item>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}

export default CompanyInterviewSchedules;
