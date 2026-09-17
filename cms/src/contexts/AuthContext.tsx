import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../config/api";
import { User } from "../types";

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  validateToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const validateToken = async (): Promise<boolean> => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("AuthContext: No token found for validation");
      return false;
    }

    try {
      const response = await axios.get(API_ENDPOINTS.AUTH.USER, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        const data = response.data;
        if (data.success && data.data.user) {
          console.log("AuthContext: Token is valid, user:", data.data.user);
          // Update user data if needed
          const userData: User = {
            id: data.data.user.id.toString(),
            username: data.data.user.username,
            role: data.data.user.role,
            email: data.data.user.email,
            name: data.data.user.name,
          };
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
          return true;
        }
      } else {
        console.log(
          "AuthContext: Token validation failed, status:",
          response.status
        );
        // Token is invalid, clear it
        logout();
        return false;
      }
    } catch (error) {
      console.error("AuthContext: Error validating token:", error);
      // Network error, clear token to be safe
      logout();
      return false;
    }

    return false;
  };

  useEffect(() => {
    // Check for stored user data and token on app load
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    console.log("AuthContext: Checking stored auth data:", {
      storedUser: !!storedUser,
      token: !!token,
    });

    if (storedUser && token) {
      try {
        const userData = JSON.parse(storedUser);
        console.log("AuthContext: Setting user from localStorage:", userData);
        setUser(userData);

        // Validate token with backend
        validateToken().then((isValid) => {
          if (!isValid) {
            console.log(
              "AuthContext: Stored token is invalid, user logged out"
            );
          }
        });
      } catch (error) {
        console.error("AuthContext: Error parsing stored user data:", error);
        // Clear invalid data
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    } else {
      console.log("AuthContext: No stored auth data found");
    }
    setIsLoading(false);
  }, []);

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    setIsLoading(true);

    try {
      const response = await axios.post(
        API_ENDPOINTS.AUTH.LOGIN,
        {
          username,
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;

      if (data.success && data.data.token) {
        const userData: User = {
          id: data.data.user.id.toString(),
          username: data.data.user.username,
          role: data.data.user.role,
          email: data.data.user.email,
          name: data.data.user.name,
        };

        // Store user data and token
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", data.data.token);

        setUser(userData);
        setIsLoading(false);
        return true;
      } else {
        console.error("Login failed:", data.message);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    try {
      // Clear user state
      setUser(null);
      // Remove user data and token from localStorage
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      // Clear any other user-related data that might be stored
      localStorage.removeItem("cart");
      // You can add more cleanup here if needed
    } catch (error) {
      console.error("Error during logout:", error);
      // Even if there's an error, ensure user is logged out
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isLoading, validateToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};
