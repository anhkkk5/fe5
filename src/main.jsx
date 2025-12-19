import React from "react";
import "@ant-design/v5-patch-for-react-19";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { createStore } from "redux";
import { Provider } from "react-redux"; // ✅ Now available

import allReducers from "./reducers/index";

const store = createStore(allReducers);

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <Provider store={store}>
    {" "}
    {/* ✅ Provider can now be used */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
);
