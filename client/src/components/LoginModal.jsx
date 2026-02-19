import { useState } from "react";
import Button from "./ui/Button";

const USERS_KEY = "nixtio-users";

function getStoredUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveUser(userId, password, name) {
  const users = getStoredUsers();
  users[userId] = { password, name };
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function verifyUser(userId, password) {
  const users = getStoredUsers();
  const user = users[userId];
  if (!user || user.password !== password) return null;
  return user;
}

function LoginModal({ onLogin, onClose }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const inputClass =
    "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const uid = userId.trim().toLowerCase();
    const pwd = password;

    if (!uid) {
      setError("User ID is required.");
      return;
    }
    if (!pwd) {
      setError("Password is required.");
      return;
    }

    if (mode === "signup") {
      const trimmedName = name.trim();
      if (!trimmedName) {
        setError("Name is required for sign up.");
        return;
      }
      if (pwd.length < 4) {
        setError("Password must be at least 4 characters.");
        return;
      }
      if (pwd !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      const users = getStoredUsers();
      if (users[uid]) {
        setError("This User ID is already registered. Please sign in.");
        return;
      }
      saveUser(uid, pwd, trimmedName);
      onLogin({ userId: uid, password: pwd, name: trimmedName });
      onClose();
      return;
    }

    // Login
    const user = verifyUser(uid, pwd);
    if (!user) {
      setError("Invalid User ID or password.");
      return;
    }
    onLogin({ userId: uid, name: user.name });
    onClose();
  };

  const canSubmit =
    mode === "login"
      ? userId.trim() && password
      : userId.trim() && password && name.trim() && password === confirmPassword && password.length >= 4;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          {mode === "login" ? "Sign in" : "Create account"}
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {mode === "login"
            ? "Sign in with your User ID and password to save and restore analysis history."
            : "Create an account to save your fraud detection analysis history."}
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="login-userid" className="block text-xs font-medium text-slate-600 dark:text-slate-300">
              User ID
            </label>
            <input
              id="login-userid"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter your user ID"
              autoComplete="username"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-medium text-slate-600 dark:text-slate-300">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className={inputClass}
            />
          </div>

          {mode === "signup" && (
            <>
              <div>
                <label htmlFor="signup-name" className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                  Name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="signup-confirm" className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                  Confirm Password
                </label>
                <input
                  id="signup-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  className={inputClass}
                />
              </div>
            </>
          )}

          {error && (
            <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button type="submit" disabled={!canSubmit}>
                {mode === "login" ? "Sign in" : "Sign up"}
              </Button>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            </div>
            <button
              type="button"
              onClick={() => {
                setMode((m) => (m === "login" ? "signup" : "login"));
                setError("");
                setPassword("");
                setConfirmPassword("");
              }}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginModal;
