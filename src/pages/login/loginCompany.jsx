import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function LoginCompany() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/login", { replace: true });
  }, []);

  return null;
}

export default LoginCompany;
