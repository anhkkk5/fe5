import "./layoutDefault.scss";

import Header from "./Header.jsx";
import Main from "./Main.jsx";
import Footer from "./Footer.jsx";
function LayoutDefault() {
  return (
    <>
      <div className="Layout-default">
        <Header />
        <Main />
        <Footer />
      </div>
    </>
  );
}
export default LayoutDefault;
