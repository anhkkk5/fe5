import React, { useState, useEffect } from "react";
import { getAllCompany } from "../../services/getAllCompany/companyServices";
import { Col, Row } from "antd";
import JobItem from "../../components/JobItem";

function SearchList(props) {
  const { data = [] } = props;
  const [dataFinal, setDataFinal] = useState([]);

  useEffect(() => {
    const fetchApi = async () => {
      if (!data || data.length === 0) return; // nếu data rỗng thì không làm gì cả

      const company = await getAllCompany();
      const newData = data.map((item) => {
        const infoCompany = company.find(
          (itemCompany) => itemCompany.id == item.company_id
        );
        return {
          infoCompany: infoCompany,
          ...item,
        };
      });
      setDataFinal(newData);
    };
    fetchApi();
  }, [data]);

  return (
    <>
      {dataFinal.length > 0 ? (
        <div className="mt-20">
          <Row gutter={[20, 20]}>
            {dataFinal.map((item) => (
              <Col span={8} key={item.id}>
                <JobItem item={item} />
              </Col>
            ))}
          </Row>
        </div>
      ) : (
        <div className="mt-20">Không tìm thấy việc</div>
      )}
    </>
  );
}

export default SearchList;
