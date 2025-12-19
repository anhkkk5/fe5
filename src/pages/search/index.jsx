import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tag } from "antd";
import SearchList from "../search/searchList";
import { get } from "../../utils/axios/request";

/**
 * Component Search - Trang tìm kiếm công việc
 *
 * Chức năng chính:
 * - Đọc query parameters từ URL (city, keyword)
 * - Fetch tất cả jobs từ API
 * - Lọc jobs theo điều kiện search
 * - Hiển thị kết quả tìm kiếm
 *
 * URL example: /search?city=Hanoi&keyword=react
 */
function Search() {
  // Hook để đọc query parameters từ URL
  // VD: /search?city=Hanoi&keyword=react
  const [searchParams] = useSearchParams();

  // State lưu trữ danh sách jobs đã được filter
  const [data, setData] = useState([]);

  // Lấy giá trị city từ URL parameter
  // Nếu không có thì default là chuỗi rỗng
  const citySearch = searchParams.get("city") || "";

  // Lấy giá trị keyword từ URL parameter
  // Nếu không có thì default là chuỗi rỗng
  const keywordSearch = searchParams.get("keyword") || "";

  // Lấy giá trị position từ URL parameter
  const positionSearch = searchParams.get("position") || "";

  // useEffect chạy khi component mount hoặc khi search parameters thay đổi
  useEffect(() => {
    const fetchApi = async () => {
      try {
        const params = new URLSearchParams();
        if (citySearch) params.set("city", citySearch);
        if (keywordSearch) params.set("keyword", keywordSearch);
        if (positionSearch) params.set("position", positionSearch);
        const result = await get(`jobs?${params.toString()}`);
        setData(Array.isArray(result) ? result : []);
      } catch (error) {
        console.error("Error fetching jobs:", error);
        setData([]);
      }
    };
    fetchApi();
  }, [citySearch, keywordSearch, positionSearch]);

  return (
    <>
      {/* Search Results Header - Hiển thị tiêu đề và các tag tìm kiếm */}
      <div>
        <strong>Kết quả tìm kiếm</strong>

        {/* Hiển thị tag city nếu có search theo city */}
        {citySearch && (
          <Tag color="blue" style={{ marginLeft: "8px" }}>
            📍 {citySearch}
          </Tag>
        )}

        {/* Hiển thị tag keyword nếu có search theo keyword */}
        {keywordSearch && (
          <Tag color="green" style={{ marginLeft: "8px" }}>
            🔍 {keywordSearch}
          </Tag>
        )}

        {/* Hiển thị tag position nếu có search theo position */}
        {positionSearch && (
          <Tag color="purple" style={{ marginLeft: "8px" }}>
            💼 Vị trí: {positionSearch}
          </Tag>
        )}
      </div>

      {/* Search Results List - Hiển thị danh sách kết quả */}
      {/* Chỉ render SearchList khi có data */}
      {data && data.length > 0 && <SearchList data={data} />}

      {/* Có thể thêm empty state khi không có kết quả */}
      {data && data.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p>Không tìm thấy công việc phù hợp với từ khóa tìm kiếm</p>
        </div>
      )}
    </>
  );
}

export default Search;

/**
 * 💡 GIẢI THÍCH LOGIC FILTER:
 *
 * 1. CITY FILTER:
 *    - Fetch danh sách Locations để map tên thành phố với location_id
 *    - Nếu có citySearch: tìm location có tên khớp (Hà Nội → LOC001)
 *    - So sánh job.location_id với location.id tìm được
 *    - Nếu không tìm thấy location, thử so sánh trực tiếp với location_id
 *    - Nếu không có citySearch: bỏ qua (return true)
 *
 * 2. KEYWORD FILTER:
 *    - Fetch danh sách Companies để tìm kiếm theo tên công ty
 *    - Normalize keyword và fields: loại bỏ khoảng trắng, chuyển lowercase
 *    - "Full stack" → "fullstack", "Fullstack Developer" → "fullstackdeveloper"
 *    - Tìm trong: title, description, jobLevel, type, VÀ tên công ty (case-insensitive, space-insensitive)
 *    - Nếu không có keywordSearch: bỏ qua (return true)
 *
 * 3. KẾT QUỢ:
 *    - Job được hiển thị khi: cityMatch && keyword = true
 *    - Array được reverse để hiển thị jobs mới nhất trước
 *
 * 📝 VÍ DỤ:
 * URL: /search?city=Hà Nội&keyword=fpt
 *
 * - citySearch = "Hà Nội" → tìm location có name="Hà Nội" → location.id="LOC001"
 * - keywordSearch = "fpt"
 * - Filter: jobs có location_id="LOC001" và (title/description/companyName chứa "fpt")
 * - Kết quả: Hiển thị tất cả jobs của FPT Software tại Hà Nội
 */
