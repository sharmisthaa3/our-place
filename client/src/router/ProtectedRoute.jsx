import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  
  if (!token) {
    return <Navigate tf="/" replace />;
  }
  
  return children;
};

export default ProtectedRoute;