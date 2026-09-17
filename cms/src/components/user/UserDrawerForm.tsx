import React, { useEffect, useState } from "react";
import {
  User,
  CreateUserPayload,
  UpdateUserPayload,
} from "../../services/userApi";

interface UserDrawerFormProps {
  user?: User | null;
  onSubmit: (data: CreateUserPayload | UpdateUserPayload) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const emptyCreate = (): CreateUserPayload => ({
  name: "",
  username: "",
  email: "",
  password: "",
  role: "user",
});

const UserDrawerForm: React.FC<UserDrawerFormProps> = ({
  user,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setUsername(user.username);
      setEmail(user.email);
      setPassword("");
      setRole((user.role === "admin" ? "admin" : "user") as "admin" | "user");
    } else {
      const z = emptyCreate();
      setName(z.name);
      setUsername(z.username);
      setEmail(z.email);
      setPassword(z.password);
      setRole(z.role);
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      const payload: UpdateUserPayload = {
        name,
        username,
        email,
        role,
      };
      if (password.trim()) {
        payload.password = password;
      }
      onSubmit(payload);
    } else {
      onSubmit({
        name,
        username,
        email,
        password,
        role,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Full name
        </label>
        <input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Username
        </label>
        <input
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {user ? "New password (optional)" : "Password"}
        </label>
        <input
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required={!user}
          minLength={user ? undefined : 8}
          autoComplete={user ? "new-password" : "new-password"}
          placeholder={user ? "Leave blank to keep current" : ""}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Role
        </label>
        <select
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value as "admin" | "user")}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="flex gap-3 border-t border-gray-200 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
        >
          {isSubmitting
            ? "Saving…"
            : user
              ? "Update user"
              : "Create user"}
        </button>
      </div>
    </form>
  );
};

export default UserDrawerForm;
