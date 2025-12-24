import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Table, Tag, Typography, Spin, message, Pagination } from "antd";
import { StarOutlined, StarFilled } from "@ant-design/icons";
import { getCookie } from "../../helpers/cookie";
import { getMyApplications } from "../../services/applications/applicationsServices";
import { getDetaiCompany } from "../../services/getAllCompany/companyServices";

const { Title, Text } = Typography;

const statusMap = {
  pending: { color: "gold", label: "Chưa xét" },
  approved: { color: "green", label: "Đã duyệt" },
  rejected: { color: "red", label: "Không duyệt" },
};

function AppliedJobs() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const token = getCookie("token") || localStorage.getItem("token");
    const userType = getCookie("userType");
    const userId = getCookie("id");
    if (!token || userType !== "candidate") {
      message.warning("Vui lòng đăng nhập bằng tài khoản ứng viên để xem danh sách đã ứng tuyển");
      navigate("/login");
      return;
    }

    const load = async () => {
      try {
        // load saved job ids từ localStorage
        const raw = userId ? localStorage.getItem(`saved_jobs_${userId}`) : null;
        const parsed = raw ? JSON.parse(raw) : [];
        setSavedIds(Array.isArray(parsed) ? parsed : []);

        const data = await getMyApplications();
        const base = (data || []).map((app) => ({
          key: app.id,
          id: app.id,
          status: app.status || "pending",
          appliedAt: app.created_at,
          jobId: app.job?.id,
          jobTitle: app.job?.title || "Công việc không xác định",
          companyName: app.job?.company || app.job?.postedBy?.name || "Công ty không xác định",
          companyId: app.job?.company_id,
        }));

        // Lấy địa chỉ công ty theo companyId
        const uniqueCompanyIds = Array.from(
          new Set(base.map((i) => i.companyId).filter(Boolean))
        );
        const companyMap = {};
        await Promise.all(
          uniqueCompanyIds.map(async (cid) => {
            try {
              const comp = await getDetaiCompany(cid);
              if (comp) {
                companyMap[cid] = comp;
              }
            } catch (_) {}
          })
        );

        const mapped = base.map((item) => ({
          ...item,
          location: item.companyId && companyMap[item.companyId]
            ? companyMap[item.companyId].address || ""
            : "",
        }));

        setItems(mapped);
      } catch (e) {
        console.error("Error loading applications", e);
        const backendMsg = e?.response?.data?.message;
        message.error(
          backendMsg
            ? Array.isArray(backendMsg)
              ? backendMsg.join(", ")
              : backendMsg
            : "Không thể tải danh sách việc đã ứng tuyển"
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  const toggleSave = (jobId) => {
    if (!jobId) return;
    const userId = getCookie("id");
    if (!userId) return;
    setSavedIds((prev) => {
      let next;
      if (prev.includes(jobId)) {
        next = prev.filter((id) => id !== jobId);
      } else {
        next = [...prev, jobId];
      }
      localStorage.setItem(`saved_jobs_${userId}`, JSON.stringify(next));
      return next;
    });
  };

  const columns = [
    {
      title: "",
      dataIndex: "favorite",
      key: "favorite",
      width: 60,
      align: "center",
      render: (_, record) => {
        const isSaved = record.jobId && savedIds.includes(record.jobId);
        const Icon = isSaved ? StarFilled : StarOutlined;
        return (
          <Icon
            style={{ color: isSaved ? "#faad14" : "#d9d9d9", fontSize: 18, cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              toggleSave(record.jobId);
            }}
          />
        );
      },
    },
    {
      title: "Công việc",
      dataIndex: "jobTitle",
      key: "jobTitle",
      render: (text, record) => (
        <span style={{ fontWeight: 500, cursor: record.jobId ? "pointer" : "default" }}
          onClick={() => record.jobId && navigate(`/jobs/${record.jobId}`)}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Công ty",
      dataIndex: "companyName",
      key: "companyName",
      render: (text) => <Text>{text}</Text>,
    },
    {
      title: "Địa điểm",
      dataIndex: "location",
      key: "location",
      render: (text) => <Text>{text || "-"}</Text>,
    },
    {
      title: "Ngày ứng tuyển",
      dataIndex: "appliedAt",
      key: "appliedAt",
      render: (value) => (
        <Text>{value ? new Date(value).toLocaleDateString() : "-"}</Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (value) => {
        const st = statusMap[value] || statusMap.pending;
        return <Tag color={st.color}>{st.label}</Tag>;
      },
    },
  ];

  const pageSize = 10;
  const paginatedItems = (Array.isArray(items) ? items : []).slice(
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
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <Card bodyStyle={{ padding: 24 }}>
        <Title level={3} style={{ marginBottom: 24 }}>
          Công việc đã ứng tuyển
        </Title>
        {items.length === 0 ? (
          <Text>Hiện bạn chưa ứng tuyển công việc nào.</Text>
        ) : (
          <>
            <Table
              columns={columns}
              dataSource={paginatedItems}
              pagination={false}
            />
            <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={(Array.isArray(items) ? items : []).length}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

export default AppliedJobs;
