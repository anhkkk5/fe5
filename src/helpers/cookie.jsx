//hàm tạo cookie
export function setCookie(name, value, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
  var expires = "expires=" + d.toUTCString();
  // Đảm bảo cookie được lưu trữ với path=/ và các thuộc tính bảo mật phù hợp
  // Thêm secure=false để hoạt động trên HTTP và HTTPS
  // Thêm domain để đảm bảo cookie hoạt động trên tất cả subdomain
  document.cookie = name + "=" + value + "; " + expires + "; path=/; SameSite=None; secure=false";
}
//lấy cookie
export function getCookie(name) {
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookies = decodedCookie.split(";");

  for (let i = 0; i < cookies.length; i++) {
    let c = cookies[i].trim();

    if (c.indexOf(name + "=") === 0) {
      return c.substring((name + "=").length);
    }
  }

  return ""; // Trả về chuỗi rỗng nếu không tìm thấy
}
//xóa cookie
export function deleteAllCookies() {
  const cookies = document.cookie.split(";");

  for (let i = 0; i < cookies.length; i++) {
    const cookieName = cookies[i].split("=")[0].trim();
    document.cookie =
      cookieName + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  }
}
