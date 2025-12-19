// Import các component và icon cần thiết từ thư viện Ant Design
import { Card, Tag, Space, Typography, Avatar, Divider, Button } from "antd";
import { Link } from "react-router-dom"; // Component Link để điều hướng
import {
  DollarOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  BankOutlined,
  CodeOutlined,
  EyeOutlined,
} from "@ant-design/icons";

// Destructuring để lấy Text và Title từ Typography của Ant Design
const { Text, Title } = Typography;

/**
 * Component JobItem - Hiển thị thông tin của một công việc dưới dạng card
 * @param {Object} props - Props được truyền vào component
 * @param {Object} props.item - Thông tin chi tiết của công việc
 * @param {Object} props.companyInfo - Thông tin công ty
 */
function JobItem(props) {
  // Destructuring để lấy item và companyInfo từ props
  const { item, companyInfo } = props;

  // Debug: In ra data để kiểm tra cấu trúc
  console.log('JobItem - item:', item);
  console.log('JobItem - companyInfo:', companyInfo);

  /**
   * Hàm định dạng ngày từ ISO string sang định dạng Việt Nam
   * @param {string} isoDate - Ngày ở định dạng ISO
   * @returns {string} - Ngày đã được format theo định dạng vi-VN
   */
  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString("vi-VN");
  };

  /**
   * Hàm định dạng lương từ số thành chuỗi có dấu phẩy và ký hiệu $
   * @param {number} salary - Mức lương
   * @returns {string} - Lương đã được format hoặc "Thỏa thuận" nếu không có
   */
  const formatSalary = (salary) => {
    if (!salary) return "Thỏa thuận";
    return `${salary.toLocaleString()}$`;
  };

  /**
   * Hàm tạo màu ngẫu nhiên cho các tag dựa theo loại và index
   * @param {number} index - Vị trí của tag trong mảng
   * @param {string} type - Loại tag ("tech" cho công nghệ, khác cho thành phố)
   * @returns {string} - Tên màu để áp dụng cho tag
   */
  const getTagColor = (index, type) => {
    // Mảng các màu cho tag công nghệ
    const techColors = ["blue", "cyan", "geekblue", "purple", "magenta"];
    // Mảng các màu cho tag thành phố
    const cityColors = ["orange", "gold", "lime", "green", "volcano"];

    if (type === "tech") {
      return techColors[index % techColors.length];
    }
    return cityColors[index % cityColors.length];
  };

  return (
    <Card
      hoverable // Cho phép card có hiệu ứng hover
      style={{
        borderRadius: "12px", // Bo góc card
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)", // Đổ bóng nhẹ
        border: "1px solid #f0f0f0", // Viền mỏng
        height: "100%", // Chiều cao 100% để các card có chiều cao đều nhau
        transition: "all 0.3s ease", // Hiệu ứng chuyển đổi mượt mà
      }}
      bodyStyle={{ padding: "20px" }} // Padding cho nội dung bên trong card
      actions={[
        // Phần actions của card chứa nút "Xem chi tiết"
        <Link to={`/job/${item.id}`} key="view">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            style={{
              borderRadius: "6px",
              fontWeight: "500",
            }}
          >
            Xem chi tiết
          </Button>
        </Link>,
      ]}
    >
      {/* Phần tiêu đề công việc */}
      <div style={{ marginBottom: "16px" }}>
        <Link to={`/job/${item.id}`} style={{ textDecoration: "none" }}>
          <Title
            level={4} // Cấp độ tiêu đề h4
            style={{
              margin: 0,
              color: "#1890ff", // Màu xanh chính của Ant Design
              fontSize: "16px",
              fontWeight: "600",
              lineHeight: "1.4",
              // CSS để giới hạn hiển thị tối đa 2 dòng
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
            className="job-title-hover" // Class để áp dụng hiệu ứng hover
          >
            {item.title || item.name || "Chưa có tiêu đề"}
          </Title>
        </Link>
      </div>

      {/* Phần thông tin công ty */}
      <div style={{ marginBottom: "16px" }}>
        <Space align="center" style={{ marginBottom: "8px" }}>
          <Avatar
            size="small"
            src={
              companyInfo?.logo ||
              item?.infoCompany?.logo ||
              undefined
            }
            icon={<BankOutlined />}
            style={{ backgroundColor: "#52c41a" }}
          />
          <Text strong style={{ color: "#262626" }}>
            {/* Hiển thị tên công ty, ưu tiên companyInfo.companyName, fallback về item.infoCompany.companyName */}
            {companyInfo?.companyName ||
              item?.infoCompany?.companyName ||
              "Chưa cập nhật"}
          </Text>
        </Space>
      </div>

      {/* Đường phân cách */}
      <Divider style={{ margin: "12px 0" }} />

      {/* Phần hiển thị các công nghệ */}
      {item.tags && item.tags.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            {/* Tiêu đề phần công nghệ */}
            <Space align="center">
              <CodeOutlined style={{ color: "#1890ff", fontSize: "14px" }} />
              <Text
                style={{
                  fontSize: "13px",
                  color: "#595959",
                  fontWeight: "500",
                }}
              >
                Công nghệ:
              </Text>
            </Space>
            {/* Danh sách các tag công nghệ */}
            <div>
              {/* Hiển thị tối đa 4 tag đầu tiên */}
              {item.tags.slice(0, 4).map((tag, index) => (
                <Tag
                  key={index}
                  color={getTagColor(index, "tech")} // Áp dụng màu cho tag công nghệ
                  style={{
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: "500",
                    marginBottom: "4px",
                    border: "none",
                  }}
                >
                  {tag}
                </Tag>
              ))}
              {/* Nếu có nhiều hơn 4 tag, hiển thị tag "+X" để báo có thêm */}
              {item.tags.length > 4 && (
                <Tag
                  style={{
                    borderRadius: "12px",
                    fontSize: "11px",
                    backgroundColor: "#f5f5f5",
                    color: "#595959",
                    border: "1px solid #d9d9d9",
                  }}
                >
                  +{item.tags.length - 4}
                </Tag>
              )}
            </div>
          </Space>
        </div>
      )}

      {/* Phần hiển thị địa điểm làm việc */}
      {item.city && item.city.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            {/* Tiêu đề phần địa điểm */}
            <Space align="center">
              <EnvironmentOutlined
                style={{ color: "#ff4d4f", fontSize: "14px" }} // Màu đỏ cho icon địa điểm
              />
              <Text
                style={{
                  fontSize: "13px",
                  color: "#595959",
                  fontWeight: "500",
                }}
              >
                Địa điểm:
              </Text>
            </Space>
            {/* Danh sách các tag thành phố */}
            <div>
              {item.city.map((city, index) => (
                <Tag
                  key={index}
                  color={getTagColor(index, "city")} // Áp dụng màu cho tag thành phố
                  style={{
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: "500",
                    marginBottom: "4px",
                    border: "none",
                  }}
                >
                  {city}
                </Tag>
              ))}
            </div>
          </Space>
        </div>
      )}

      {/* Đường phân cách thứ hai */}
      <Divider style={{ margin: "12px 0" }} />

      {/* Phần hiển thị lương và ngày đăng */}
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        {/* Thông tin lương */}
        <Space
          align="center"
          style={{ width: "100%", justifyContent: "space-between" }}
        >
          <Space align="center">
            <DollarOutlined style={{ color: "#52c41a", fontSize: "14px" }} />
            <Text style={{ fontSize: "13px", color: "#595959" }}>Lương:</Text>
          </Space>
          <Text
            strong
            style={{
              color: "#52c41a", // Màu xanh lá cho lương
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            {formatSalary(item.salary)}
          </Text>
        </Space>

        {/* Thông tin ngày đăng */}
        <Space
          align="center"
          style={{ width: "100%", justifyContent: "space-between" }}
        >
          <Space align="center">
            <CalendarOutlined style={{ color: "#faad14", fontSize: "14px" }} />
            <Text style={{ fontSize: "13px", color: "#595959" }}>
              Ngày đăng:
            </Text>
          </Space>
          <Text style={{ fontSize: "13px", color: "#8c8c8c" }}>
            {formatDate(item.created_at || item.createAt)}
          </Text>
        </Space>
      </Space>

      {/* CSS-in-JS để tạo hiệu ứng hover cho tiêu đề công việc */}
      <style jsx>{`
        .job-title-hover:hover {
          color: #40a9ff !important; // Màu xanh nhạt hơn khi hover
          text-decoration: underline; // Gạch chân khi hover
        }
      `}</style>
    </Card>
  );
}

export default JobItem;
