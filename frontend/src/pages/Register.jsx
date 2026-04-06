import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const imageURL = "/Team collaboration on a task dashboard.png";

  const register = async () => {
    if (!email || !password) {
      alert("Please fill all fields");
      return;
    }

    try {
      const res = await API.post("/auth/register", { email, password });
      console.log(res.data);

      navigate("/");
    } catch (error) {
      console.error(error);
      alert("Registration failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">

        {/* LEFT SIDE IMAGE */}
        <div className="auth-right">
          <img src={imageURL} alt="register illustration" />
        </div>

        {/* RIGHT SIDE FORM */}
        <div className="auth-left">
          <img 
    src="/LOGO.png" 
    alt="welcome"
    className="top-image"
  />
          <h1>Create Account</h1>

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

          <button onClick={register}>Register</button>

          <p>
            Already have an account?{" "}
            <span onClick={() => navigate("/")}>
              Login
            </span>
          </p>
        </div>

      </div>
    </div>
  );
}

export default Register;