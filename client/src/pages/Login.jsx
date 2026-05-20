import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/chat");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    const endpoint = isRegister ? "signup" : "login";
    try {
      const response = await fetch(`http://localhost:5000/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      if (!isRegister) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.user.username);
        navigate("/chat");
      } else {
        alert("Account created successfully! Please log in.");
        setIsRegister(false);
        setPassword("");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-rose-300 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-pink-100">
        <h2 className="text-3xl font-extrabold text-center text-pink-600 mb-2 tracking-wide">
          Our Place 💖
        </h2>
        <p className="text-gray-500 text-center text-sm mb-6">
          {isRegister ? "Create a secret account for you & sis" : "Enter your secret shared space"}
        </p>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-1">Username</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg shadow transition duration-200"
          >
            {isRegister ? "Sign Up" : "Log In"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <button
            onClick={() => { setIsRegister(!isRegister); setError(""); }}
            className="text-pink-600 hover:underline font-medium"
          >
            {isRegister ? "Already have an account? Log in" : "Need an account? Sign up here"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;