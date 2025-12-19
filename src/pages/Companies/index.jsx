import React from "react";
import { Card, Row, Col, Tag, Spin, Empty, Avatar, Button } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getAllCompany } from "../../services/getAllCompany/companyServices";

function CompaniesPage() {
  const [companies, setCompanies] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getAllCompany();
        const active = Array.isArray(data)
          ? data.filter((c) => c?.status === "active")
          : [];
        setCompanies(active);
      } catch {
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 16 }}>Công ty</h2>
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Spin />
        </div>
      ) : companies.length === 0 ? (
        <Empty description="Không có dữ liệu" />
      ) : (
        <Row gutter={[16, 16]}>
          {companies.map((c) => (
            <Col xs={24} sm={12} md={12} lg={8} key={c.id}>
              <Card
                hoverable
                onClick={() => navigate(`/companies/${c.id}`)}
                style={{ cursor: "pointer" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 8,
                  }}
                >
                  <Avatar src={c.logo} size={40} shape="square" />
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <h3 style={{ margin: 0 }}>{c.name}</h3>
                    <Tag color="red-inverse">Featured</Tag>
                  </div>
                </div>
                <div style={{ color: "#666", marginBottom: 12 }}>
                  <EnvironmentOutlined /> {c.address || "Đang cập nhật"}
                </div>
                <Button
                  block
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/companies/${c.id}`);
                  }}
                >
                  Open Position (0)
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}

export default CompaniesPage;
