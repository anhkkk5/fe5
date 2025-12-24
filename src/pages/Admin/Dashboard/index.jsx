import React, { useEffect, useMemo, useState } from "react";
import { Card, Col, Row, Space, Spin, Statistic, Typography, message } from "antd";
import { Area, Bar, Column, DualAxes, Line, Pie, Rose } from "@ant-design/plots";
import dayjs from "dayjs";

import { getAlljob } from "../../../services/jobServices/jobServices";
import { getAllCandidates } from "../../../services/Candidates/candidatesServices";
import { getAllCompany } from "../../../services/getAllCompany/companyServices";
import { getAllPosts } from "../../../services/posts/postsServices";
import { adminGetReviews } from "../../../services/companyReviews/companyReviewsServices";

const { Title, Text } = Typography;

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [posts, setPosts] = useState([]);
  const [reviews, setReviews] = useState([]);

  const safeArray = (v) => (Array.isArray(v) ? v : []);

  const getDate = (obj) => {
    const candidates = [
      obj?.created_at,
      obj?.createdAt,
      obj?.createdDate,
      obj?.published_at,
      obj?.publishedAt,
      obj?.updated_at,
      obj?.updatedAt,
    ];
    const val = candidates.find(Boolean);
    if (!val) return null;
    const d = dayjs(val);
    return d.isValid() ? d : null;
  };

  const getStatus = (obj) => String(obj?.status || "").toLowerCase();

  const getCompanyIdFromJob = (job) => {
    return (
      job?.company_id ||
      job?.companyId ||
      job?.company?.id ||
      job?.postedBy?.id ||
      job?.postedBy?.companyId ||
      null
    );
  };

  const getCompanyNameById = (companyId) => {
    if (!companyId) return "N/A";
    const list = safeArray(companies);
    const found = list.find((c) => String(c?.id) === String(companyId));
    return found?.companyName || found?.fullName || `Company #${companyId}`;
  };

  const buildDailySeries = (rawList, days) => {
    const end = dayjs().startOf("day");
    const start = end.subtract(days - 1, "day");

    const base = Array.from({ length: days }).map((_, idx) => {
      const d = start.add(idx, "day");
      return {
        date: d.format("DD/MM"),
        count: 0,
      };
    });

    const idxMap = new Map(base.map((x, idx) => [x.date, idx]));

    safeArray(rawList).forEach((item) => {
      const d = getDate(item);
      if (!d) return;
      const day = d.startOf("day");
      if (day.isBefore(start) || day.isAfter(end)) return;
      const key = day.format("DD/MM");
      const i = idxMap.get(key);
      if (i === undefined) return;
      base[i] = { ...base[i], count: (base[i].count || 0) + 1 };
    });

    return base;
  };

  const load = async () => {
    setLoading(true);
    try {
      const [jobsData, usersData, companiesData, postsData, reviewsData] = await Promise.all([
        getAlljob(),
        getAllCandidates(),
        getAllCompany(),
        getAllPosts(),
        adminGetReviews({}),
      ]);

      setJobs(safeArray(jobsData));
      setUsers(safeArray(usersData));
      setCompanies(safeArray(companiesData));
      setPosts(safeArray(postsData));
      setReviews(safeArray(reviewsData));
    } catch (e) {
      const backendMsg = e?.response?.data?.message;
      message.error(
        backendMsg
          ? Array.isArray(backendMsg)
            ? backendMsg.join(", ")
            : backendMsg
          : "Không thể tải dữ liệu dashboard",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const kpi = useMemo(() => {
    const j = safeArray(jobs);
    const u = safeArray(users);
    const c = safeArray(companies);
    const p = safeArray(posts);
    const r = safeArray(reviews);

    const activeJobs = j.filter((x) => getStatus(x) === "active").length;
    const inactiveJobs = j.filter((x) => getStatus(x) === "inactive").length;
    const otherJobs = Math.max(0, j.length - activeJobs - inactiveJobs);

    const publishedPosts = p.filter((x) => getStatus(x) === "published").length;
    const draftPosts = p.filter((x) => getStatus(x) === "draft").length;
    const otherPosts = Math.max(0, p.length - publishedPosts - draftPosts);

    const pendingReviews = r.filter((x) => getStatus(x) === "pending").length;
    const approvedReviews = r.filter((x) => getStatus(x) === "approved").length;
    const rejectedReviews = r.filter((x) => getStatus(x) === "rejected").length;

    const premiumUsers = u.filter((x) => !!x?.isPremium).length;
    const normalUsers = Math.max(0, u.length - premiumUsers);

    const activeCompanies = c.filter((x) => getStatus(x) === "active").length;
    const inactiveCompanies = c.filter((x) => getStatus(x) === "inactive").length;
    const otherCompanies = Math.max(0, c.length - activeCompanies - inactiveCompanies);

    return {
      totalJobs: j.length,
      activeJobs,
      inactiveJobs,
      otherJobs,
      totalUsers: u.length,
      premiumUsers,
      normalUsers,
      totalCompanies: c.length,
      activeCompanies,
      inactiveCompanies,
      otherCompanies,
      totalPosts: p.length,
      publishedPosts,
      draftPosts,
      otherPosts,
      totalReviews: r.length,
      pendingReviews,
      approvedReviews,
      rejectedReviews,
    };
  }, [jobs, users, companies, posts, reviews]);

  const jobsByStatusData = useMemo(() => {
    return [
      { type: "Active", value: kpi.activeJobs },
      { type: "Inactive", value: kpi.inactiveJobs },
      { type: "Other", value: kpi.otherJobs },
    ];
  }, [kpi.activeJobs, kpi.inactiveJobs, kpi.otherJobs]);

  const postsByStatusData = useMemo(() => {
    return [
      { type: "Published", value: kpi.publishedPosts },
      { type: "Draft", value: kpi.draftPosts },
      { type: "Other", value: kpi.otherPosts },
    ];
  }, [kpi.publishedPosts, kpi.draftPosts, kpi.otherPosts]);

  const reviewsStatusData = useMemo(() => {
    const r = safeArray(reviews);
    const counts = r.reduce(
      (acc, item) => {
        const s = String(item?.status || "pending").toLowerCase();
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0 },
    );

    return [
      { type: "Pending", value: counts.pending || 0 },
      { type: "Approved", value: counts.approved || 0 },
      { type: "Rejected", value: counts.rejected || 0 },
    ];
  }, [reviews]);

  const jobsTrendData = useMemo(() => buildDailySeries(jobs, 14), [jobs]);
  const postsTrendData = useMemo(() => buildDailySeries(posts, 14), [posts]);
  const usersTrendData = useMemo(() => buildDailySeries(users, 30), [users]);

  const jobsVsPostsData = useMemo(() => {
    const base = jobsTrendData.map((x) => ({ date: x.date, jobs: x.count, posts: 0 }));
    const idxMap = new Map(base.map((x, idx) => [x.date, idx]));
    postsTrendData.forEach((p) => {
      const i = idxMap.get(p.date);
      if (i === undefined) return;
      base[i] = { ...base[i], posts: p.count };
    });
    return base;
  }, [jobsTrendData, postsTrendData]);

  const premiumUsersData = useMemo(() => {
    return [
      { type: "Premium", value: kpi.premiumUsers },
      { type: "Normal", value: kpi.normalUsers },
    ];
  }, [kpi.premiumUsers, kpi.normalUsers]);

  const companiesByStatusData = useMemo(() => {
    return [
      { type: "Active", value: kpi.activeCompanies },
      { type: "Inactive", value: kpi.inactiveCompanies },
      { type: "Other", value: kpi.otherCompanies },
    ];
  }, [kpi.activeCompanies, kpi.inactiveCompanies, kpi.otherCompanies]);

  const topCompaniesByJobsData = useMemo(() => {
    const counter = new Map();
    safeArray(jobs).forEach((j) => {
      const cid = getCompanyIdFromJob(j);
      if (!cid) return;
      counter.set(cid, (counter.get(cid) || 0) + 1);
    });

    const rows = Array.from(counter.entries()).map(([cid, count]) => ({
      company: getCompanyNameById(cid),
      value: count,
    }));

    return rows.sort((a, b) => b.value - a.value).slice(0, 8);
  }, [jobs, companies]);

  const columnConfig = (data, color) => ({
    data,
    xField: "type",
    yField: "value",
    autoFit: true,
    color,
    label: {
      position: "middle",
      style: { fill: "#fff", opacity: 0.9, fontWeight: 600 },
    },
    xAxis: { label: { autoHide: true, autoRotate: false } },
    yAxis: { nice: true },
    legend: false,
    columnStyle: { radius: [8, 8, 0, 0] },
  });

  const lineConfig = {
    data: jobsTrendData,
    xField: "date",
    yField: "count",
    autoFit: true,
    smooth: true,
    point: { size: 4, shape: "circle" },
    tooltip: { showMarkers: true },
    xAxis: { tickCount: 7 },
    yAxis: { nice: true },
    color: "#1677ff",
  };

  const areaUsersConfig = {
    data: usersTrendData,
    xField: "date",
    yField: "count",
    autoFit: true,
    smooth: true,
    color: "#13c2c2",
    areaStyle: { fillOpacity: 0.18 },
    xAxis: { tickCount: 10 },
    yAxis: { nice: true },
  };

  const dualAxesConfig = {
    data: [
      jobsVsPostsData.map((x) => ({ date: x.date, value: x.jobs })),
      jobsVsPostsData.map((x) => ({ date: x.date, value: x.posts })),
    ],
    xField: "date",
    yField: ["value", "value"],
    geometryOptions: [
      {
        geometry: "column",
        color: "#1677ff",
        columnStyle: { radius: [6, 6, 0, 0] },
      },
      {
        geometry: "line",
        color: "#722ed1",
        smooth: true,
        point: { size: 3, shape: "circle" },
      },
    ],
    legend: { position: "bottom" },
    xAxis: { tickCount: 7 },
    yAxis: [{ nice: true }, { nice: true }],
  };

  const topCompaniesBarConfig = {
    data: topCompaniesByJobsData,
    xField: "value",
    yField: "company",
    autoFit: true,
    color: "#52c41a",
    legend: false,
    xAxis: { nice: true },
    yAxis: { label: { autoHide: true } },
    barStyle: { radius: [6, 6, 6, 6] },
  };

  const pieConfig = {
    data: reviewsStatusData,
    angleField: "value",
    colorField: "type",
    autoFit: true,
    innerRadius: 0.62,
    radius: 0.95,
    legend: { position: "bottom" },
    color: ["#f59e0b", "#22c55e", "#ef4444"],
    statistic: {
      title: { content: "Reviews" },
      content: {
        content: String(kpi.totalReviews || 0),
      },
    },
    label: {
      type: "inner",
      offset: "-30%",
      content: ({ percent }) => `${Math.round(percent * 100)}%`,
      style: { fontSize: 12, textAlign: "center", fill: "#fff", fontWeight: 600 },
    },
  };

  const premiumDonutConfig = {
    data: premiumUsersData,
    angleField: "value",
    colorField: "type",
    autoFit: true,
    innerRadius: 0.68,
    radius: 0.95,
    legend: { position: "bottom" },
    color: ["#fa8c16", "#1677ff"],
    statistic: {
      title: { content: "Users" },
      content: {
        content: `${kpi.totalUsers || 0}`,
      },
    },
    label: {
      type: "inner",
      offset: "-30%",
      content: ({ percent }) => `${Math.round(percent * 100)}%`,
      style: { fontSize: 12, textAlign: "center", fill: "#fff", fontWeight: 600 },
    },
  };

  const companiesRoseConfig = {
    data: companiesByStatusData,
    xField: "type",
    yField: "value",
    seriesField: "type",
    radius: 0.9,
    innerRadius: 0.22,
    color: ["#52c41a", "#ff4d4f", "#8c8c8c"],
    autoFit: true,
    legend: { position: "bottom" },
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 8 }}>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Dashboard
            </Title>
            <Text type="secondary">Tổng quan hệ thống (Jobs, Users, Companies, Posts, Reviews)</Text>
          </div>
          <Text type="secondary">Cập nhật: {dayjs().format("DD/MM/YYYY HH:mm")}</Text>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic title="Tổng việc làm" value={kpi.totalJobs} />
              <Text type="secondary">Active: {kpi.activeJobs}</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic title="Người dùng" value={kpi.totalUsers} />
              <Text type="secondary">Premium: {kpi.premiumUsers} ({kpi.totalUsers ? Math.round((kpi.premiumUsers / kpi.totalUsers) * 100) : 0}%)</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic title="Công ty" value={kpi.totalCompanies} />
              <Text type="secondary">Active: {kpi.activeCompanies}</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic title="Đánh giá" value={kpi.totalReviews} />
              <Text type="secondary">Pending: {kpi.pendingReviews}</Text>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic title="Bài viết" value={kpi.totalPosts} />
              <Text type="secondary">Published: {kpi.publishedPosts}</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic title="Reviews approved" value={kpi.approvedReviews} />
              <Text type="secondary">Rejected: {kpi.rejectedReviews}</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic title="Jobs inactive" value={kpi.inactiveJobs} />
              <Text type="secondary">Other: {kpi.otherJobs}</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic title="Companies inactive" value={kpi.inactiveCompanies} />
              <Text type="secondary">Other: {kpi.otherCompanies}</Text>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="Xu hướng đăng việc (14 ngày)" bordered={false} style={{ borderRadius: 12 }}>
              <Line {...lineConfig} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Phân bổ trạng thái đánh giá" bordered={false} style={{ borderRadius: 12 }}>
              <Pie {...pieConfig} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="Jobs vs Posts (14 ngày)" bordered={false} style={{ borderRadius: 12 }}>
              <DualAxes {...dualAxesConfig} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Xu hướng người dùng mới (30 ngày)" bordered={false} style={{ borderRadius: 12 }}>
              <Area {...areaUsersConfig} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="Việc làm theo trạng thái" bordered={false} style={{ borderRadius: 12 }}>
              <Column {...columnConfig(jobsByStatusData, ["#22c55e", "#ef4444", "#94a3b8"])} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Bài viết theo trạng thái" bordered={false} style={{ borderRadius: 12 }}>
              <Column {...columnConfig(postsByStatusData, ["#1677ff", "#f59e0b", "#94a3b8"])} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="Top công ty theo số việc làm" bordered={false} style={{ borderRadius: 12 }}>
              <Bar {...topCompaniesBarConfig} />
            </Card>
          </Col>
          <Col xs={24} lg={6}>
            <Card title="Premium Users" bordered={false} style={{ borderRadius: 12 }}>
              <Pie {...premiumDonutConfig} />
            </Card>
          </Col>
          <Col xs={24} lg={6}>
            <Card title="Trạng thái công ty" bordered={false} style={{ borderRadius: 12 }}>
              <Rose {...companiesRoseConfig} />
            </Card>
          </Col>
        </Row>
      </Space>
    </div>
  );
}

export default AdminDashboard;
