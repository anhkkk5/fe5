import React from "react";
import { Card, Button, Row, Col, Spin, Avatar } from "antd";
import {
  EnvironmentOutlined,
  ArrowRightOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getAllCompany } from "../../services/getAllCompany/companyServices";
import "./style.css";

function FeaturedCompanies() {
  const [companies, setCompanies] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const companiesData = await getAllCompany();
        const activeCompanies = Array.isArray(companiesData)
          ? companiesData.filter((c) => c?.status === "active")
          : [];
        setCompanies(activeCompanies);
      } catch (error) {
        console.error("FeaturedCompanies fetch error:", error);
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="fc-wrapper">
      <div className="fc-header">
        <h2 className="fc-title">Công ty nổi bật</h2>
        <Button
          type="link"
          className="fc-view-more"
          onClick={() => navigate("/companies")}
        >
          Xem Thêm <ArrowRightOutlined />
        </Button>
      </div>
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Spin />
        </div>
      ) : (
        <Row gutter={[24, 24]}>
          {companies.map((company) => (
          <Col xs={24} sm={12} md={12} lg={6} key={company.id}>
              <Card
                hoverable
                className="fc-card"
                onClick={() => navigate(`/companies/${company.id}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="fc-top">
                  <Avatar
                    src={company.logo}
                    size={44}
                    shape="square"
                    className="fc-logo-avatar"
                  />
                  <div className="fc-top-info">
                    <div className="fc-name">{company.fullName}</div>
                    <span className="fc-chip">Featured</span>
                  </div>
                </div>
                <div className="fc-location">
                  <EnvironmentOutlined /> {company.address}
                </div>
                <div className="fc-description">{company.description}</div>
                <Button
                  className="fc-button"
                  block
                  icon={<GlobalOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(company.website, "_blank");
                  }}
                >
                  Truy cập website
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}

export default FeaturedCompanies;
