import "./layoutDefault.scss";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import SearchListJob from "../../components/SearchForm/searchJob";
import { getCookie, setCookie } from "../../helpers/cookie";
import { useEffect, useState } from "react";

import {
  BellOutlined,
  EllipsisOutlined,
  BookOutlined,
  CrownOutlined,
  FileTextOutlined,
  LikeOutlined,
  SearchOutlined,
  ShopOutlined,
  UnorderedListOutlined,
  UserOutlined,
  WalletOutlined,
  CalculatorOutlined,
  LineChartOutlined,
  SafetyCertificateOutlined,
  MobileOutlined,
  SolutionOutlined,

  // icons từ develop
  AppstoreOutlined,
  HighlightOutlined,
  StarOutlined,
  RadarChartOutlined,
  UploadOutlined,
  ReadOutlined,
  EditOutlined,

  // icons cho cẩm nang nghề nghiệp
  ClockCircleOutlined,
  BulbOutlined,
  DollarOutlined,
  CarryOutOutlined,
  BarChartOutlined,
} from "@ant-design/icons";

import { Avatar, Badge, Dropdown, Spin } from "antd";

import { getAllCompany, getMyCompany, updateMyCompany } from "../../services/getAllCompany/companyServices";
import { getMyCandidateProfile } from "../../services/Candidates/candidatesServices";
import { decodeJwt } from "../../services/auth/authServices";
import { deleteNotification, getMyNotifications, markNotificationRead } from "../../services/notifications/notificationsServices";
import { connectSocket, disconnectSocket } from "../../realtime/socketClient";
import logoImage from "../../assets/logologin.png";

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState("");
  const [userType, setUserType] = useState("");
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifItems, setNotifItems] = useState([]);
  const [notifTab, setNotifTab] = useState("all");
  const [notifActionOpenId, setNotifActionOpenId] = useState(null);
  const [companyId, setCompanyId] = useState("");
  const [companies, setCompanies] = useState([]);
  const [isJobMenuOpen, setIsJobMenuOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isCareerGuideMenuOpen, setIsCareerGuideMenuOpen] = useState(false);

  const formatRelativeTime = (input) => {
    if (!input) return "";
    const dt = new Date(input);
    if (Number.isNaN(dt.getTime())) return "";
    const diffMs = Date.now() - dt.getTime();
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));
    if (diffSec < 60) return "Vừa xong";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} giờ`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay} ngày`;
  };

  const loadNotifPanel = async () => {
    if (!isLoggedIn) return;
    setNotifLoading(true);
    try {
      const data = await getMyNotifications();
      setNotifItems(Array.isArray(data) ? data : []);
    } catch (_e) {
      setNotifItems([]);
    } finally {
      setNotifLoading(false);
    }
  };

  const handleNotifClick = async (n) => {
    try {
      if (!n?.read) {
        await markNotificationRead(n.id);
        setNotifItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: 1 } : x)));
        setUnreadNotifications((prev) => Math.max(0, (Number(prev) || 0) - 1));
      }
    } catch (_e) {}

    setNotifOpen(false);
    if (n?.link) {
      navigate(n.link);
      return;
    }
    navigate("/notifications");
  };

  const handleNotifAction = async (key, n) => {
    if (!n?.id) return;
    if (key === "mark_read") {
      try {
        if (!n?.read) {
          await markNotificationRead(n.id);
          setNotifItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: 1 } : x)));
          setUnreadNotifications((prev) => Math.max(0, (Number(prev) || 0) - 1));
        }
      } catch (_e) {
      } finally {
        setNotifActionOpenId(null);
      }
      return;
    }

    if (key === "delete") {
      try {
        await deleteNotification(n.id);
        setNotifItems((prev) => prev.filter((x) => x.id !== n.id));
        if (!n?.read) {
          setUnreadNotifications((prev) => Math.max(0, (Number(prev) || 0) - 1));
        }
      } catch (_e) {
      } finally {
        setNotifActionOpenId(null);
      }
    }
  };

  const notifList = (notifTab === "unread" ? notifItems.filter((n) => !n?.read) : notifItems).slice(0, 8);

  const notifOverlay = (
    <div className="header__notif-panel" onClick={(e) => e.stopPropagation()}>
      <div className="header__notif-panel-header">
        <div className="header__notif-panel-title">Thông báo</div>
        <button
          type="button"
          className="header__notif-panel-more"
          onClick={() => navigate("/notifications")}
        >
          ...
        </button>
      </div>

      <div className="header__notif-panel-tabs">
        <button
          type="button"
          className={`header__notif-tab ${notifTab === "all" ? "is-active" : ""}`}
          onClick={() => setNotifTab("all")}
        >
          Tất cả
        </button>
        <button
          type="button"
          className={`header__notif-tab ${notifTab === "unread" ? "is-active" : ""}`}
          onClick={() => setNotifTab("unread")}
        >
          Chưa đọc
        </button>

        <button
          type="button"
          className="header__notif-viewall"
          onClick={() => {
            setNotifOpen(false);
            navigate("/notifications");
          }}
        >
          Xem tất cả
        </button>
      </div>

      <div className="header__notif-panel-body">
        {notifLoading ? (
          <div className="header__notif-loading">
            <Spin size="small" />
          </div>
        ) : notifList.length === 0 ? (
          <div className="header__notif-empty">Chưa có thông báo</div>
        ) : (
          notifList.map((n) => (
            <div
              key={n.id}
              className={`header__notif-item ${n?.read ? "is-read" : "is-unread"}`}
              onClick={() => handleNotifClick(n)}
              role="button"
              tabIndex={0}
            >
              <div className="header__notif-item-avatar">
                <Avatar
                  size={44}
                  src={n?.sender?.avatarUrl}
                  icon={!n?.sender?.avatarUrl ? <BellOutlined /> : null}
                >
                  {n?.sender?.name?.charAt?.(0) || ""}
                </Avatar>
              </div>
              <div className="header__notif-item-content">
                <div className="header__notif-item-top">
                  <div className="header__notif-item-title">
                    {n?.sender?.name ? `${n.sender.name}: ${n.title || ""}` : n.title || "Thông báo"}
                  </div>
                  <div className="header__notif-item-time">{formatRelativeTime(n.created_at)}</div>
                </div>
                <div className="header__notif-item-message">{n.message || ""}</div>
              </div>
              <div className="header__notif-item-actions" onClick={(e) => e.stopPropagation()}>
                <Dropdown
                  trigger={["click"]}
                  open={notifActionOpenId === n.id}
                  onOpenChange={(open) => setNotifActionOpenId(open ? n.id : null)}
                  getPopupContainer={(triggerNode) => triggerNode?.closest?.(".header__notif-panel") || document.body}
                  menu={{
                    items: [
                      {
                        key: "mark_read",
                        label: "Đánh dấu là đã đọc",
                        disabled: !!n?.read,
                      },
                      {
                        key: "delete",
                        label: "Xóa thông báo này",
                        danger: true,
                      },
                    ],
                    onClick: ({ key }) => handleNotifAction(key, n),
                  }}
                >
                  <button
                    type="button"
                    className="header__notif-item-more"
                    aria-label="Tùy chọn thông báo"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <EllipsisOutlined />
                  </button>
                </Dropdown>
                {!n?.read ? <div className="header__notif-dot" /> : null}
              </div>
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        className="header__notif-footer"
        onClick={() => {
          setNotifOpen(false);
          navigate("/notifications");
        }}
      >
        Xem thông báo trước đó
      </button>
    </div>
  );

  // ----- MENU DỮ LIỆU -----
  const jobShortcuts = [
    { key: "search-job", icon: <SearchOutlined />, label: "Tìm việc làm", path: "/jobs" },
    { key: "saved", icon: <BookOutlined />, label: "Việc làm đã lưu", path: "/saved-jobs" },
    { key: "applied", icon: <FileTextOutlined />, label: "Việc làm đã ứng tuyển", path: "/jobs" },
    { key: "match", icon: <LikeOutlined />, label: "Việc làm phù hợp", path: "/jobs" },
  ];

  const toolShortcuts = [
    { key: "skill-assessment", icon: <RadarChartOutlined />, label: "Đánh giá năng lực", path: "/skill-assessment" },
    { key: "gross-net", icon: <WalletOutlined />, label: "Tính lương Gross - Net", path: "/gross-net" },
    { key: "tax", icon: <CalculatorOutlined />, label: "Tính thuế thu nhập cá nhân", path: "/personal-income-tax" },
    { key: "compound", icon: <LineChartOutlined />, label: "Tính lãi suất kép", path: "/compound-interest" },
    { key: "unemployment", icon: <SafetyCertificateOutlined />, label: "Tính bảo hiểm thất nghiệp", path: "/unemployment-insurance" },
    { key: "social", icon: <SolutionOutlined />, label: "Tính bảo hiểm xã hội một lần" },
    { key: "saving-plan", icon: <CalculatorOutlined />, label: "Lập kế hoạch tiết kiệm", path: "/savings-plan" },
    { key: "company-reviews", icon: <StarOutlined />, label: "Review công ty", path: "/company-reviews" },
    { key: "ads-rent", icon: <MobileOutlined />, label: "Thuê quảng cáo", path: "/ads/rent" },
  ];

  const companyShortcuts = [
    { key: "companies", icon: <UnorderedListOutlined />, label: "Danh sách công ty", path: "/companies" },
    { key: "top-companies", icon: <CrownOutlined />, label: "Top công ty", path: "/companies" },
  ];

  const careerGuideShortcuts = [
    { key: "career-orientation", icon: <ClockCircleOutlined />, label: "Định hướng nghề nghiệp", path: "/career-guide/orientation" },
    { key: "job-search-tips", icon: <BulbOutlined />, label: "Bí kíp tìm việc", path: "/career-guide/job-search-tips" },
    { key: "salary-benefits", icon: <DollarOutlined />, label: "Chế độ lương thưởng", path: "/career-guide/salary-benefits" },
    { key: "professional-knowledge", icon: <BookOutlined />, label: "Kiến thức chuyên ngành", path: "/career-guide/professional-knowledge" },
    { key: "career-toolkit", icon: <CarryOutOutlined />, label: "Hành trang nghề nghiệp", path: "/career-guide/toolkit" },
    { key: "market-trends", icon: <BarChartOutlined />, label: "Thị trường & xu hướng tuyển dụng", path: "/career-guide/market-trends" },
  ];

  const jobPositions = [
    { key: "sales", label: "Việc làm Nhân viên kinh doanh" },
    { key: "accounting", label: "Việc làm Kế toán" },
    { key: "marketing", label: "Việc làm Marketing" },
    { key: "hr", label: "Việc làm Hành chính nhân sự" },
    { key: "customer-care", label: "Việc làm Chăm sóc khách hàng" },
    { key: "banking", label: "Việc làm Ngân hàng" },
    { key: "it", label: "Việc làm IT" },
    { key: "labor", label: "Việc làm Lao động phổ thông" },
    { key: "senior", label: "Việc làm Senior" },
    { key: "construction", label: "Việc làm Kỹ sư xây dựng" },
    { key: "design", label: "Việc làm Thiết kế đồ hoạ" },
    { key: "real-estate", label: "Việc làm Bất động sản" },
    { key: "education", label: "Việc làm Giáo dục" },
    { key: "telesales", label: "Việc làm telesales" },
  ];

  // ----- XỬ LÝ TOKEN & USER -----
  useEffect(() => {
    const cookieToken = getCookie("token");
    const lsToken = localStorage.getItem("token");
    const token = cookieToken || lsToken || "";

    if (!token) {
      setIsLoggedIn(false);
      setUserType("");
      setUserName("");
      setUserAvatar("");
      setCompanyId("");
      setUnreadNotifications(0);
      return;
    }

    setIsLoggedIn(true);

    let type = getCookie("userType");
    if (!type) {
      try {
        const payload = decodeJwt(token);
        type = payload?.role || "";
      } catch (_e) {
        type = "";
      }
    }
    setUserType(type);

    const fullName = getCookie("fullName");
    const companyName = getCookie("companyName");
    const id = getCookie("companyId");

    if (type === "admin" && !fullName) {
      try {
        const payload = decodeJwt(token);
        const adminName = payload?.fullName || payload?.name || payload?.email || "";
        if (adminName) {
          setCookie("fullName", adminName, 1);
        }
      } catch {}
    }

    const resolvedFullName = getCookie("fullName");
    const resolvedAvatar = getCookie("avatarUrl") || "";

    const name = type === "admin" ? "admin" : type === "candidate" ? resolvedFullName : companyName;
    setUserName(name || "");
    setUserAvatar(resolvedAvatar || "");
    if (type === "company" && id) {
      setCompanyId(id);
    }

    const loadUnreadNotifications = async () => {
      try {
        const data = await getMyNotifications();
        const list = Array.isArray(data) ? data : [];
        const unread = list.filter((n) => {
          const raw =
            typeof n?.read !== "undefined"
              ? n.read
              : typeof n?.isRead !== "undefined"
              ? n.isRead
              : // fallback (some APIs use snake_case)
                n?.is_read;

          if (raw === null || typeof raw === "undefined") return true;
          if (raw === false) return true;
          const num = Number(raw);
          return Number.isNaN(num) ? !raw : num === 0;
        }).length;
        setUnreadNotifications(unread);
      } catch (_e) {
        setUnreadNotifications(0);
      }
    };
    loadUnreadNotifications();

    // connect socket for realtime notifications
    connectSocket();
  }, [location.pathname]);

  useEffect(() => {
    const onNewNotification = () => {
      setUnreadNotifications((prev) => (Number(prev) || 0) + 1);
    };

    try {
      window.addEventListener("notification:new", onNewNotification);
    } catch (_e) {}

    return () => {
      try {
        window.removeEventListener("notification:new", onNewNotification);
      } catch (_e) {}

      const token = getCookie("token") || localStorage.getItem("token");
      if (!token) disconnectSocket();
    };
  }, []);

  // Company auto fetch
  useEffect(() => {
    const maybeFetch = async () => {
      const token = getCookie("token") || localStorage.getItem("token");
      const type = getCookie("userType") || (token ? decodeJwt(token)?.role : "");
      const cachedId = getCookie("companyId");
      const cachedName = getCookie("companyName");
      const cachedAvatar = getCookie("avatarUrl");
      if (!token || type !== "company" || (cachedId && cachedName && cachedAvatar)) return;
      try {
        const comp = await getMyCompany();
        if (comp?.id) {
          setCookie("companyId", comp.id, 1);
          setCookie("companyName", comp.companyName || comp.fullName, 1);
          if (comp?.logo) {
            setCookie("avatarUrl", comp.logo, 1);
            setUserAvatar(comp.logo);
          }
          setCompanyId(String(comp.id));
          setUserName(comp.companyName || comp.fullName || "");
        }
      } catch {}
    };
    maybeFetch();
  }, []);

  // Candidate auto fetch
  useEffect(() => {
    const loadCandidateName = async () => {
      const token = getCookie("token") || localStorage.getItem("token");
      const type = getCookie("userType") || (token ? decodeJwt(token)?.role : "");
      const fullName = getCookie("fullName");
      const avatarUrl = getCookie("avatarUrl");
      if (!token || type !== "candidate" || (fullName && avatarUrl)) return;
      try {
        const me = await getMyCandidateProfile();
        if (me?.fullName) {
          setCookie("fullName", me.fullName, 1);
          setUserName(me.fullName);
        }
        if (me?.avatarUrl) {
          setCookie("avatarUrl", me.avatarUrl, 1);
          setUserAvatar(me.avatarUrl);
        }
      } catch {}
    };
    loadCandidateName();
  }, []);

  // Fetch company list
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const result = await getAllCompany();
        if (result) setCompanies(result);
      } catch (error) {
        console.error("Error fetching companies:", error);
      }
    };

    if (isLoggedIn && userType === "candidate") fetchCompanies();
  }, [isLoggedIn, userType]);

  // ----- HANDLERS -----
  const handleLogout = () => navigate("/logout");

  // Tùy loại user mà ẩn/bớt một số công cụ
  const visibleToolShortcuts = toolShortcuts.filter((item) => {
    if (item.key === "company-reviews") {
      return userType === "candidate";
    }
    if (userType === "company" && item.key === "skill-assessment") return false;
    return true;
  });

  const handleNavigateAndClose = (path) => {
    if (path) navigate(path);
    setIsJobMenuOpen(false);
    setIsToolsMenuOpen(false);
    setIsCareerGuideMenuOpen(false);
  };

  const handleGoCompany = async () => {
    if (companyId) {
      navigate(`/companies/${companyId}`);
      return;
    }
    try {
      const comp = await getMyCompany();
      if (comp?.id) {
        setCookie("companyId", comp.id, 1);
        setCookie("companyName", comp.companyName || comp.fullName, 1);
        if (comp?.logo) {
          setCookie("avatarUrl", comp.logo, 1);
          setUserAvatar(comp.logo);
        }
        navigate(`/companies/${comp.id}`);
      }
    } catch (e) {
      const status = e?.response?.status;
      if (status === 404) {
        try {
          const token = getCookie("token") || localStorage.getItem("token");
          const email = token ? decodeJwt(token)?.email : "";
          const raw = email ? localStorage.getItem(`companyDraft:${email}`) : null;
          const draft = raw ? JSON.parse(raw) : null;
          if (draft && (draft.fullName || draft.companyName || draft.email)) {
            const created = await updateMyCompany(draft);
            if (created?.id) {
              setCookie("companyId", created.id, 1);
              setCookie("companyName", created.companyName || created.fullName, 1);
              navigate(`/companies/${created.id}`);
              return;
            }
          }
        } catch (_) {}
        navigate("/registerCompany");
      }
    }
  };

  const userMenuItems = [
    ...(userType === "company"
      ? [
          {
            key: "my-company",
            label: "Thông tin doanh nghiệp",
            onClick: handleGoCompany,
          },
          {
            key: "company-interviews",
            label: "Lịch phỏng vấn",
            onClick: () => navigate("/company/interviews"),
          },
          {
            key: "manage-quizzes",
            label: "Quản lý đánh giá năng lực",
            onClick: () => navigate("/company/quiz"),
          },
          {
            key: "upgrade",
            label: "Nâng cấp tài khoản",
            onClick: () => navigate("/upgrade"),
          },
        ]
      : []),
    ...(userType === "candidate"
      ? [
          {
            key: "my-applications",
            label: "Công việc đã ứng tuyển",
            onClick: () => navigate("/applications"),
          },
          {
            key: "my-interviews",
            label: "Lịch phỏng vấn",
            onClick: () => navigate("/interviews"),
          },
          {
            key: "saved-jobs",
            label: "Công việc đã lưu",
            onClick: () => navigate("/saved-jobs"),
          },
          {
            key: "upgrade",
            label: "Nâng cấp tài khoản",
            onClick: () => navigate("/upgrade"),
          },
        ]
      : []),
    ...(userType === "candidate"
      ? [
          {
            key: "profile",
            label: "Thông tin cá nhân",
            onClick: () => navigate("/profile"),
          },
        ]
      : []),
    ...(["candidate", "company"].includes(String(userType || "").toLowerCase())
      ? [
          {
            key: "friends",
            label: "Bạn bè",
            onClick: () => navigate("/friends"),
          },
          {
            key: "chat",
            label: "Chat",
            onClick: () => navigate("/chat"),
          },
        ]
      : []),
    {
      key: "logout",
      label: "Đăng xuất",
      onClick: handleLogout,
    },
  ];

  // ===================== RENDER =====================
  return (
    <header className="header">

      {/* TOP BAR */}
      <div className="header__top-bar">
        <div className="header__top-bar-content">
          <nav className="header__top-nav">
            {userType === "admin" ? (
              <>
                <NavLink to="/admin/dashboard" className="header__top-link">Dashboard</NavLink>
                <NavLink to="/admin/jobs" className="header__top-link">Quản lý việc làm</NavLink>
                <NavLink to="/admin/companies" className="header__top-link">Quản lý công ty</NavLink>
                <NavLink to="/admin/users" className="header__top-link">Quản lý người dùng</NavLink>
                <NavLink to="/admin/posts" className="header__top-link">Quản lý bài viết</NavLink>
                <NavLink to="/admin/company-reviews" className="header__top-link">Duyệt đánh giá</NavLink>
              </>
            ) : (
              <>
                <NavLink to="/" className="header__top-link">
                  Trang chủ
                </NavLink>

                <NavLink
                  to="/feed"
                  className={`header__top-link ${
                    location.pathname.startsWith("/feed") ? "header__top-link--active" : ""
                  }`}
                >
                  Bản tin
                </NavLink>

                {/* JOB MENU */}
                <div
                  className={`header__job-menu ${isJobMenuOpen ? "header__job-menu--open" : ""}`}
                  onMouseEnter={() => setIsJobMenuOpen(true)}
                  onMouseLeave={() => setIsJobMenuOpen(false)}
                >
                  <NavLink
                    to="/jobs"
                    className={`header__top-link ${
                      location.pathname.startsWith("/jobs") ? "header__top-link--active" : ""
                    }`}
                  >
                    Việc làm
                  </NavLink>

                  <div className="header__job-dropdown">
                    <div className="header__job-dropdown-left">
                      <div className="header__job-group">
                        <div className="header__job-group-title">VIỆC LÀM</div>
                        <div className="header__job-list">
                          {jobShortcuts.map((item) => (
                            <button key={item.key} className="header__job-item"
                              onClick={() => handleNavigateAndClose(item.path)}
                            >
                              <span className="header__job-item-icon">{item.icon}</span>
                              <span>{item.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="header__job-group">
                        <div className="header__job-group-title">CÔNG TY</div>
                        <div className="header__job-list">
                          {companyShortcuts.map((item) => (
                            <button key={item.key} className="header__job-item"
                              onClick={() => handleNavigateAndClose(item.path)}
                            >
                              <span className="header__job-item-icon">{item.icon}</span>
                              <span>{item.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="header__job-dropdown-right">
                      <div className="header__job-group">
                        <div className="header__job-group-title">VIỆC LÀM THEO VỊ TRÍ</div>
                        <div className="header__job-position-grid">
                          {jobPositions.map((item) => (
                            <button
                              key={item.key}
                              className="header__job-position"
                              onClick={() => handleNavigateAndClose(`/jobs?position=${item.key}`)}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TOOLS MENU */}
                <div
                  className={`header__tools-menu ${isToolsMenuOpen ? "header__tools-menu--open" : ""}`}
                  onMouseEnter={() => setIsToolsMenuOpen(true)}
                  onMouseLeave={() => setIsToolsMenuOpen(false)}
                >
                  <span className="header__top-link" style={{ cursor: "pointer" }}>
                    Công cụ
                  </span>

                  <div className="header__tools-dropdown">
                    <div className="header__tools-title">CÔNG CỤ</div>
                    <div className="header__tools-grid">
                      {visibleToolShortcuts.map((item) => (
                        <button key={item.key} className="header__tools-item"
                          onClick={() => handleNavigateAndClose(item.path)}
                        >
                          <span className="header__tools-icon">{item.icon}</span>
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CAREER GUIDE MENU */}
                <div
                  className={`header__tools-menu ${isCareerGuideMenuOpen ? "header__tools-menu--open" : ""}`}
                  onMouseEnter={() => setIsCareerGuideMenuOpen(true)}
                  onMouseLeave={() => setIsCareerGuideMenuOpen(false)}
                >
                  <NavLink
                    to="/career-guide"
                    className={`header__top-link ${
                      location.pathname.startsWith("/career-guide") ? "header__top-link--active" : ""
                    }`}
                  >
                    Cẩm nang nghề nghiệp
                  </NavLink>

                  <div className="header__tools-dropdown">
                    <div className="header__tools-title">CẨM NANG NGHỀ NGHIỆP</div>
                    <div className="header__tools-grid">
                      {careerGuideShortcuts.map((item) => (
                        <button key={item.key} className="header__tools-item"
                          onClick={() => handleNavigateAndClose(item.path)}
                        >
                          <span className="header__tools-icon">{item.icon}</span>
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {userType !== "company" && (
                  <NavLink to="/cv" className="header__top-link">
                    CV của bạn
                  </NavLink>
                )}

                {isLoggedIn && userType === "company" && (
                  <NavLink to="/company-ads" className="header__top-link">
                    Quản lý quảng cáo
                  </NavLink>
                )}

                {/* TẠO CV MENU */}
                {isLoggedIn && userType === "candidate" && (
                  <Dropdown
                    overlay={
                      <div style={{ background: "#fff", padding: 16, borderRadius: 8, boxShadow: "0 12px 24px rgba(0,0,0,.12)", width: 520 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                          <div>
                            <div style={{ color: "#16a34a", fontWeight: 700, marginBottom: 8 }}>
                              Mẫu CV theo style →
                            </div>

                            <div className="createcv-item" onClick={() => navigate("/cv/templates?style=simple")}>
                              <AppstoreOutlined style={{ marginRight: 8 }} />
                              <span>Mẫu CV Đơn giản</span>
                            </div>

                            <div className="createcv-item" onClick={() => navigate("/cv/templates?style=impressive")}>
                              <HighlightOutlined style={{ marginRight: 8 }} />
                              <span>Mẫu CV Ấn tượng</span>
                            </div>

                            <div className="createcv-item" onClick={() => navigate("/cv/templates?style=professional")}>
                              <StarOutlined style={{ marginRight: 8 }} />
                              <span>Mẫu CV Chuyên nghiệp</span>
                            </div>

                            <div className="createcv-item" onClick={() => navigate("/cv/templates?style=modern")}>
                              <RadarChartOutlined style={{ marginRight: 8 }} />
                              <span>Mẫu CV Hiện đại</span>
                            </div>

                            <div style={{ color: "#16a34a", fontWeight: 700, margin: "12px 0 8px" }}>
                              Mẫu CV theo vị trí ứng tuyển →
                            </div>

                            <div className="createcv-item" onClick={() => navigate("/cv/templates?role=sales")}>
                              <AppstoreOutlined style={{ marginRight: 8 }} />
                              <span>Nhân viên kinh doanh</span>
                            </div>

                            <div className="createcv-item" onClick={() => navigate("/cv/templates?role=developer")}>
                              <AppstoreOutlined style={{ marginRight: 8 }} />
                              <span>Lập trình viên</span>
                            </div>

                            <div className="createcv-item" onClick={() => navigate("/cv/templates?role=accounting")}>
                              <AppstoreOutlined style={{ marginRight: 8 }} />
                              <span>Nhân viên kế toán</span>
                            </div>

                            <div className="createcv-item" onClick={() => navigate("/cv/templates?role=marketing")}>
                              <AppstoreOutlined style={{ marginRight: 8 }} />
                              <span>Chuyên viên marketing</span>
                            </div>
                          </div>

                          <div>
                            <div className="createcv-item" onClick={() => navigate("/cv")}>
                              <FileTextOutlined style={{ marginRight: 8 }} />
                              <span>Quản lý CV</span>
                            </div>

                            <div className="createcv-item" onClick={() => navigate("/cv/templates")}>
                              <UploadOutlined style={{ marginRight: 8 }} />
                              <span>Tải CV lên</span>
                            </div>

                            <div className="createcv-item" onClick={() => navigate("/cv/guide")}>
                              <ReadOutlined style={{ marginRight: 8 }} />
                              <span>Hướng dẫn viết CV</span>
                            </div>

                            <div className="createcv-item" onClick={() => navigate("/cv/cover-letter")}>
                              <EditOutlined style={{ marginRight: 8 }} />
                              <span>Quản lý Cover Letter</span>
                            </div>

                            <div className="createcv-item" onClick={() => navigate("/cv/cover-letter/templates")}>
                              <EditOutlined style={{ marginRight: 8 }} />
                              <span>Mẫu Cover Letter</span>
                            </div>
                          </div>
                        </div>

                        <style>{`
                          .createcv-item {
                            display: flex;
                            align-items: center;
                            padding: 6px 8px;
                            border-radius: 6px;
                            cursor: pointer;
                          }
                          .createcv-item:hover {
                            background: #f5f5f5;
                          }
                        `}</style>
                      </div>
                    }
                    trigger={["hover"]}
                    placement="bottom"
                  >
                    <span className="header__top-link" style={{ cursor: "pointer" }}>
                      Tạo CV
                    </span>
                  </Dropdown>
                )}

                {/* COMPANY DROPDOWN */}
                {isLoggedIn ? (
                  userType === "company" ? (
                    <span className="header__top-link" style={{ cursor: "pointer" }} onClick={handleGoCompany}>
                      Thông tin doanh nghiệp
                    </span>
                  ) : (
                    <Dropdown
                      menu={{
                        items:
                          companies.length > 0
                            ? companies.map((company) => ({
                                key: company.id,
                                label: (
                                  <div
                                    style={{ display: "flex", alignItems: "center", gap: "10px" }}
                                    onClick={() => navigate(`/companies/${company.id}`)}
                                  >
                                    <ShopOutlined />
                                    <span>{company.fullName}</span>
                                  </div>
                                ),
                              }))
                            : [
                                {
                                  key: "empty",
                                  label: "Không có công ty nào",
                                  disabled: true,
                                },
                              ],
                      }}
                      trigger={["click"]}
                    >
                      <span className="header__top-link" style={{ cursor: "pointer" }}>
                        Thông tin doanh nghiệp
                      </span>
                    </Dropdown>
                  )
                ) : (
                  <NavLink to="/support" className="header__top-link">
                    Customer Supports
                  </NavLink>
                )}
              </>
            )}
          </nav>

          <div className="header__top-contact">
            <span className="header__phone">
              <i className="header__phone-icon">📞</i>
              +1-202-555-0178
            </span>
            <div className="header__language">
              <span className="header__flag">🇺🇸</span>
              <span>English</span>
              <span className="header__dropdown">▼</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN HEADER */}
      <div className="header__main">
        <div className="header__main-content">
          <div className="header__logo">
            <NavLink to="/" className="header__logo-link">
              <img src={logoImage} alt="Logo" className="header__logo-image"
                style={{ height: "60px", objectFit: "contain" }} />
            </NavLink>
          </div>

          <div className="header__search">
            <div className="header__search-box">
              <SearchListJob reverse={true} showButton={false} />
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="header__actions">
            {isLoggedIn ? (
              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <Badge
                  count={unreadNotifications}
                  overflowCount={99}
                  size="small"
                  offset={[0, 2]}
                  showZero={false}
                >
                  <Dropdown
                    trigger={["click"]}
                    open={notifOpen}
                    onOpenChange={(open) => {
                      setNotifOpen(open);
                      if (open) loadNotifPanel();
                    }}
                    placement="bottomRight"
                    dropdownRender={() => notifOverlay}
                  >
                    <BellOutlined
                      style={{ fontSize: "24px", color: "#c41e3a", cursor: "pointer" }}
                    />
                  </Dropdown>
                </Badge>

                <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        backgroundColor: "#c41e3a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        overflow: "hidden",
                      }}
                    >
                      {userAvatar ? (
                        <img
                          src={userAvatar}
                          alt="avatar"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <UserOutlined style={{ fontSize: "20px" }} />
                      )}
                    </div>
                    <span style={{ color: "#c41e3a", fontWeight: "500" }}>{userName || "User"}</span>
                  </div>
                </Dropdown>
              </div>
            ) : (
              <>
                <button className="header__btn header__btn--login">
                  <NavLink to="/login">Đăng Nhập</NavLink>
                </button>

                <button className="header__btn header__btn--register">
                  <NavLink to="/register">Đăng Kí</NavLink>
                </button>

                <button className="header__btn header__btn--post">
                  <NavLink to="/Post">Đăng tuyển</NavLink>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

    </header>
  );
}

export default Header;
