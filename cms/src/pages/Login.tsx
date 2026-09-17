import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  CarIcon,
  EyeIcon,
  EyeOffIcon,
  Shield,
  Users,
  TrendingUp,
} from "lucide-react";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login, isLoading, user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    const success = await login(username, password);
    if (!success) {
      setError("Invalid username or password");
    }
  };

  // Handle navigation after successful login
  React.useEffect(() => {
    if (user) {
      console.log("User logged in:", user);
      if (user.role === "admin") {
        console.log("Redirecting to admin dashboard");
        navigate("/admin"); // Admin dashboard
      } else {
        console.log("Redirecting to user dashboard");
        navigate("/dashboard"); // User dashboard
      }
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Login Form Section */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 py-8 lg:py-0">
        <div className="max-w-md w-full space-y-6 sm:space-y-8">
          <div className="text-center">
            <div className="flex justify-center">
              {/* Gorgeous Car Logo */}
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 rounded-full flex items-center justify-center shadow-2xl relative z-10">
                  <CarIcon className="w-12 h-12 text-white" />
                </div>
                {/* Logo Glow Effect */}
                <div className="absolute inset-0 w-20 h-20 bg-primary-400 rounded-full blur-2xl opacity-40 animate-pulse"></div>
              </div>
            </div>
            <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Welcome Back
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Sign in to your CarSelling account
            </p>
          </div>

          <div className="space-y-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white transition-all text-base"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-4 py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white transition-all text-base"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 touch-manipulation"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

          </div>
        </div>
      </div>

      {/* Video Section */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        {/* Background video */}
        <div className="absolute inset-0 flex items-center justify-center">
          <video
            src="/login-bg.mp4"
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        </div>
      </div>

      {/* Mobile Video Section */}
      <div className="lg:hidden w-full h-68 sm:h-64 relative overflow-hidden">
        <video
          src="/login-bg.mp4"
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        />
      </div>
    </div>
  );
};

export default Login;
