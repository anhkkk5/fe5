import { Input, Button, Space, Select } from "antd";
import { SearchOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import React from "react";
import { getLocation } from "../../services/getAllLocation/locationServices";

function SearchListJob({ reverse = false, showButton = true }) {
 const navigate = useNavigate();
 
  const [city, setCity] = React.useState([]);
  const [selectedCity, setSelectedCity] = React.useState("");
  const [keyword, setKeyword] = React.useState("");


  React.useEffect(() => {
    const featchApi = async () => {
      const response = await getLocation(); // Gọi API lấy danh sách thành phố từ backend
      if (response) {
        // Map dữ liệu sang format của Ant Design Select
        const cityOptions = response.map(item => ({
          label: item.name || item.city,  // Hiển thị tên thành phố
          value: item.name || item.city   // Giá trị khi chọn
        }));
        
        const objAll = {
          label: "Tất cả thành phố",
          value: "All"
        };
        
        setCity([objAll, ...cityOptions]); // Cập nhật state city
      }
    };
    featchApi();
  }, []);
  const handleSearch = () => {
    // Nếu chọn "All" thì bỏ qua giá trị city trong query
    let cityValue = selectedCity === "All" ? "" : (selectedCity || "");

    // Chuyển hướng đến trang /search với query parameters city và keyword
    navigate(`/search?city=${cityValue}&keyword=${keyword || ""}`);
  };

 

  return (
    <>
      <div className="search-from">
        {/* Chỉ hiển thị form khi danh sách city đã có */}
        {city && city.length > 0 && (
          <div className="job-search-section">
            <Space.Compact style={{ width: "100%" }}>
              {reverse ? (
                // Thứ tự đảo ngược: Search trước, Select sau
                <>
                  {/* Search input cho keyword - có button tìm kiếm bên trái */}
                  <Input
                    placeholder="Tìm kiếm công việc, công ty..."
                    prefix={
                      <SearchOutlined 
                        onClick={handleSearch}
                        style={{ cursor: 'pointer', color: '#ff4d4f' }}
                      />
                    }
                    style={{ flex: 1 }}
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onPressEnter={handleSearch}
                  />
                  
                  {/* Select cho vị trí/thành phố */}
                  <Select
                    placeholder="Chọn thành phố"
                    style={{ width: 150 }}
                    options={city}
                    value={selectedCity || undefined}
                    onChange={(value) => setSelectedCity(value)}
                  />
                </>
              ) : (
                // Thứ tự bình thường: Select trước, Search sau
                <>
                  {/* Select cho vị trí/thành phố */}
                  <Select
                    placeholder="Chọn thành phố"
                    style={{ width: 150 }}
                    options={city}
                    value={selectedCity || undefined}
                    onChange={(value) => setSelectedCity(value)}
                  />
                  
                  {/* Search input cho keyword - có button tìm kiếm bên trái */}
                  <Input
                    placeholder="Tìm kiếm công việc, công ty..."
                    prefix={
                      <SearchOutlined 
                        onClick={handleSearch}
                        style={{ cursor: 'pointer', color: '#ff4d4f' }}
                      />
                    }
                    style={{ flex: 1 }}
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onPressEnter={handleSearch}
                  />
                </>
              )}
              
              {/* Nút tìm kiếm - chỉ hiển thị ở trang Home */}
              {showButton && (
                <Button 
                  type="primary" 
                  danger
                  onClick={handleSearch}
                >
                  Find Job
                </Button>
              )}
            </Space.Compact>
          </div>
        )}
      </div>
    </>
  );
}
export default SearchListJob;
