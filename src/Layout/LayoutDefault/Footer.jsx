function Footer() {
  return (
    <footer className="footer">
      <div className="footer__main">
        <div className="footer__content">
          {/* Left Column - Company Info */}
          <div className="footer__column footer__column--company">
            <div className="footer__logo">
              <h3 className="footer__logo-text">RKEIEdu</h3>
              <p className="footer__tagline">where dreams come true</p>
            </div>

            <div className="footer__contact">
              <p className="footer__address">
                Tầng 7 tháp A toà Sông Đà, đường Phạm Hùng, quận Nam Từ Liêm, Hà
                Nội
              </p>
              <p className="footer__phone">0862 069 233</p>
              <p className="footer__email">academy@rikkeisoft.com</p>
            </div>

            <div className="footer__social">
              <span className="footer__social-icon">f</span>
              <span className="footer__social-icon">▶</span>
            </div>
          </div>

          {/* Second Column - Courses */}
          <div className="footer__column">
            <h4 className="footer__title">Khóa học</h4>
            <ul className="footer__links">
              <li>
                <a href="#" className="footer__link">
                  Làm quen với Code
                </a>
              </li>
              <li>
                <a href="#" className="footer__link">
                  Bootcamp Fulltime
                </a>
              </li>
              <li>
                <a href="#" className="footer__link">
                  Bootcamp Parttime
                </a>
              </li>
              <li>
                <a href="#" className="footer__link">
                  Kỹ sư CNTT - PTIT
                </a>
              </li>
              <li>
                <a href="#" className="footer__link">
                  Bổ trợ cho nghề
                </a>
              </li>
            </ul>
          </div>

          {/* Third Column - Learning Resources */}
          <div className="footer__column">
            <h4 className="footer__title">Tài nguyên học tập</h4>
            <ul className="footer__links">
              <li>
                <a href="#" className="footer__link">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="footer__link">
                  Ebook - Report
                </a>
              </li>
              <li>
                <a href="#" className="footer__link">
                  Khóa học miễn phí
                </a>
              </li>
              <li>
                <a href="#" className="footer__link">
                  Sự kiện - Webinar
                </a>
              </li>
              <li>
                <a href="#" className="footer__link">
                  Cộng đồng
                </a>
              </li>
            </ul>
          </div>

          {/* Fourth Column - Why Choose */}
          <div className="footer__column">
            <h4 className="footer__title">Vì sao chọn Rikkei Academy</h4>
            <ul className="footer__links">
              <li>
                <a href="#" className="footer__link">
                  Về Rikkei Academy
                </a>
              </li>
              <li>
                <a href="#" className="footer__link">
                  Hệ sinh thái Rikkei
                </a>
              </li>
              <li>
                <a href="#" className="footer__link">
                  Cơ hội nghề nghiệp
                </a>
              </li>
              <li>
                <a href="#" className="footer__link">
                  Tấm gương sáng
                </a>
              </li>
              <li>
                <a href="#" className="footer__link">
                  Liên hệ
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright Section */}
      <div className="footer__copyright">
        <p>Copyright 2023 © Rikkei Education. All Rights Reserved.</p>
      </div>
    </footer>
  );
}
export default Footer;
