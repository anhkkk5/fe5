import React from "react";
import { routes } from "../routers";
import { useRoutes } from "react-router-dom";

function AllRouter() {
  const elements = useRoutes(routes);
  return <>{elements}</>;
}
export default AllRouter;
