import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const login = async () => {
    if (!email || !password) {
      alert("Please fill all fields");
      return;
    }

    try {
      const res = await API.post("/auth/login", { email, password });

      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (error) {
      alert(error.response?.data?.message || "Login failed");
    }
  };

  const imageURL =
    "/login.png";

  return (
    <div className="auth-container">
      <div className="auth-box">

        <div className="auth-left">
          <img 
    src="/LOGO.png" 
    alt="welcome"
    className="top-image"
  />
          <h1>Hello Again!</h1>

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={login}>Sign In</button>

          <p>
            Don't have an account?{" "}
            <span onClick={() => navigate("/register")}>Register</span>
          </p>
        </div>

        <div className="auth-right">
   <img src={imageURL} alt="login illustration"/>
     </div>

      </div>
    </div>
  );
}

export default Login;