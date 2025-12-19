import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function LoginAdmin() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/login", { replace: true });
  }, []);

  return null;
}

export default LoginAdmin;
