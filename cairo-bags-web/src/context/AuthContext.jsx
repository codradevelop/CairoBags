import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import * as authService from "../services/authService.js";
import * as cartService from "../services/cartService.js";
import {
  clearAuthStorage,
  getAccessToken,
  getStoredUser,
  isAdmin as checkIsAdmin,
  isAuthenticated as checkIsAuthenticated,
  isCustomer as checkIsCustomer,
  persistAuthSession,
} from "../utils/authStorage.js";
import { getGuestSessionId } from "../utils/sessionId.js";
import { normalizeError } from "../utils/normalizeError.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const bootstrap = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const profile = await authService.getMe();
      setUser(profile);
      setError(null);
    } catch (err) {
      const normalized = normalizeError(err);
      if (normalized.isAuthError) {
        clearAuthStorage();
        setUser(null);
      } else {
        setError(normalized);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const mergeGuestCartAfterAuth = useCallback(async () => {
    const sessionId = getGuestSessionId();
    if (!sessionId) return;
    try {
      await cartService.mergeCart(sessionId);
    } catch {
      /* cart merge must not block auth */
    }
  }, []);

  const handleAuthSuccess = useCallback(
    async (authResponse) => {
      const nextUser = authResponse.user ?? getStoredUser();
      setUser(nextUser);
      setError(null);
      await mergeGuestCartAfterAuth();
      return authResponse;
    },
    [mergeGuestCartAfterAuth]
  );

  const login = useCallback(
    async (credentials) => {
      setLoading(true);
      setError(null);
      try {
        const response = await authService.login(credentials);
        return await handleAuthSuccess(response);
      } catch (err) {
        const normalized = normalizeError(err);
        setError(normalized);
        throw normalized;
      } finally {
        setLoading(false);
      }
    },
    [handleAuthSuccess]
  );

  const register = useCallback(
    async (payload) => {
      setLoading(true);
      setError(null);
      try {
        const response = await authService.register(payload);
        return await handleAuthSuccess(response);
      } catch (err) {
        const normalized = normalizeError(err);
        setError(normalized);
        throw normalized;
      } finally {
        setLoading(false);
      }
    },
    [handleAuthSuccess]
  );

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await authService.logout();
    } catch {
      /* always clear local session */
    } finally {
      clearAuthStorage();
      setUser(null);
      setLoading(false);
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const refreshProfile = useCallback(async () => {
    const profile = await authService.getMe();
    setUser(profile);
    return profile;
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const profile = await authService.updateMe(payload);
    setUser(profile);
    return profile;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      isAuthenticated: checkIsAuthenticated() && Boolean(user),
      isAdmin: checkIsAdmin(user),
      isCustomer: checkIsCustomer(user),
      isGuest: !getAccessToken(),
      login,
      register,
      logout,
      refreshProfile,
      updateProfile,
      updateUsername: authService.updateUsername,
      changePassword: authService.changePassword,
      setPassword: authService.setPassword,
      markFirstLoginDone: authService.markFirstLoginDone,
      forgotPasswordRequestCode: authService.forgotPasswordRequestCode,
      forgotPasswordComplete: authService.forgotPasswordComplete,
      createAdmin: authService.createAdmin,
      setSession: (session) => {
        persistAuthSession(session);
        if (session.user) setUser(session.user);
      },
    }),
    [user, loading, error, login, register, logout, refreshProfile, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
