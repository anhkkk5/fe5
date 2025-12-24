import React from "react";
import { Layout, Breadcrumb } from "antd";
import { useNavigate, useLocation, Link, Outlet } from "react-router-dom";
import { getCookie } from "../../helpers/cookie";
import Header from "../LayoutDefault/Header";
import Footer from "../LayoutDefault/Footer";
import "../LayoutDefault/layoutDefault.scss";
import "./style.css";

const { Content } = Layout;

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const userType = getCookie("userType");

  // Check if user is admin
  if (userType !== "admin") {
    navigate("/login");
    return null;
  }

  

  const getBreadcrumbItems = () => {
    const path = location.pathname;
    if (path === "/admin" || path.includes("/admin/dashboard")) {
      return [{ title: <Link to="/admin/dashboard">Dashboard</Link> }];
    }
    if (path.includes("/admin/jobs")) {
      return [
        { title: <Link to="/admin/dashboard">Dashboard</Link> },
        { title: "Quản lý việc làm" },
      ];
    } else if (path.includes("/admin/users")) {
      return [
        { title: <Link to="/admin/dashboard">Dashboard</Link> },
        { title: "Quản lý người dùng" },
      ];
    } else if (path.includes("/admin/companies")) {
      return [
        { title: <Link to="/admin/dashboard">Dashboard</Link> },
        { title: "Quản lý công ty" },
      ];
    } else if (path.includes("/admin/company-reviews")) {
      return [
        { title: <Link to="/admin/dashboard">Dashboard</Link> },
        { title: "Duyệt đánh giá công ty" },
      ];
    }
    return [{ title: <Link to="/admin/dashboard">Dashboard</Link> }];
  };

  return (
    <div className="Layout-default admin-layout">
      <Header />
      <Layout style={{ minHeight: "calc(100vh - 200px)", marginTop: 0 }}>
        <Layout style={{ padding: "24px", background: "#f0f2f5" }}>
          <Breadcrumb
            items={getBreadcrumbItems()}
            style={{ marginBottom: "16px" }}
          />
          <Content className="admin-content">
            <Outlet />
          </Content>
        </Layout>
      </Layout>
      <Footer />
    </div>
  );
}

export default AdminLayout;
