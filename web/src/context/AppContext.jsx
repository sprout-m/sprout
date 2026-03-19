import { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  projectsApi,
  adminApi,
  clearToken,
  getToken,
  setToken,
} from '../api/client';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [projects, setProjects] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminProjects, setAdminProjects] = useState([]);

  // ── Session restore ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!getToken()) {
      setInitializing(false);
      return;
    }
    auth
      .me()
      .then((u) => setUser(u))
      .catch(() => clearToken())
      .finally(() => setInitializing(false));
  }, []);

  // ── Load role data when user changes ──────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    loadUserData(user);
  }, [user?.id]);

  async function loadUserData(u) {
    const myProjects = await projectsApi.list().catch(() => []);
    setProjects(myProjects);

    if (u.role === 'admin') {
      const [stats, users, allProjects] = await Promise.all([
        adminApi.stats().catch(() => null),
        adminApi.users().catch(() => []),
        adminApi.allProjects().catch(() => []),
      ]);
      setAdminStats(stats);
      setAdminUsers(users);
      setAdminProjects(allProjects);
    }
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  async function loginUser({ email, password }) {
    const { token, user: u } = await auth.login({ email, password });
    setToken(token);
    setUser(u);
  }

  async function registerUser({ email, handle, password, role, hedera_account_id }) {
    const { token, user: u } = await auth.register({ email, handle, password, role, hedera_account_id });
    setToken(token);
    setUser(u);
  }

  function logoutUser() {
    clearToken();
    setUser(null);
    setProjects([]);
    setAdminStats(null);
    setAdminUsers([]);
    setAdminProjects([]);
  }

  // ── Project actions ───────────────────────────────────────────────────────
  async function createProject(data) {
    const result = await projectsApi.create(data);
    setProjects((prev) => [result.project, ...prev]);
    return result;
  }

  async function refreshProjects() {
    const ps = await projectsApi.list().catch(() => []);
    setProjects(ps);
    return ps;
  }

  const value = {
    user,
    initializing,
    loginUser,
    registerUser,
    logoutUser,
    projects,
    createProject,
    refreshProjects,
    adminStats,
    adminUsers,
    adminProjects,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
