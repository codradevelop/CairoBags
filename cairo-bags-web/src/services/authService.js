import axiosInstance from "../api/axios.js";
import { ENDPOINTS } from "../constants/endpoints.js";
import { handleServiceCall, persistAuthSession } from "../utils/index.js";

function mapAuthUser(dto) {
  if (!dto) return null;
  return {
    id: dto.id ?? dto.Id,
    userName: dto.userName ?? dto.UserName,
    name: dto.name ?? dto.Name,
    email: dto.email ?? dto.Email,
    phoneNumber: dto.phoneNumber ?? dto.PhoneNumber,
    profileImageUrl: dto.profileImageUrl ?? dto.ProfileImageUrl,
    role: dto.role ?? dto.Role ?? [],
    mustChangePassword: dto.mustChangePassword ?? dto.MustChangePassword ?? false,
    authProvider: dto.authProvider ?? dto.AuthProvider,
    hasPassword: dto.hasPassword ?? dto.HasPassword,
    isFirstLogin: dto.isFirstLogin ?? dto.IsFirstLogin,
    isGoogleUser: dto.isGoogleUser ?? dto.IsGoogleUser,
    notificationSettings: dto.notificationSettings ?? dto.NotificationSettings,
  };
}

function saveAuthResponse(data) {
  const user = mapAuthUser(data);
  persistAuthSession({
    token: data.token ?? data.Token,
    refreshToken: data.refreshToken ?? data.RefreshToken,
    user,
  });
  return { ...data, user };
}

export async function register(payload) {
  return handleServiceCall(
    axiosInstance.post(ENDPOINTS.account.register, payload).then(({ data }) => {
      const result = saveAuthResponse(data);
      const phoneFromPayload = payload?.phoneNumber?.trim();
      if (!result.user?.phoneNumber && phoneFromPayload) {
        const user = { ...result.user, phoneNumber: phoneFromPayload };
        persistAuthSession({ user });
        return { ...result, user };
      }
      return result;
    })
  );
}

export async function login(payload) {
  return handleServiceCall(
    axiosInstance.post(ENDPOINTS.account.login, payload).then(({ data }) => saveAuthResponse(data))
  );
}

export async function refreshToken(refreshTokenValue) {
  return handleServiceCall(
    axiosInstance
      .post(ENDPOINTS.account.refreshToken, { refreshToken: refreshTokenValue })
      .then(({ data }) => {
        persistAuthSession({
          token: data.token,
          refreshToken: data.refreshToken,
        });
        return data;
      })
  );
}

export async function logout() {
  return handleServiceCall(axiosInstance.post(ENDPOINTS.account.logout).then(({ data }) => data));
}

export async function getMe() {
  return handleServiceCall(
    axiosInstance.get(ENDPOINTS.account.me).then(({ data }) => {
      const user = mapAuthUser(data);
      persistAuthSession({ user });
      return user;
    })
  );
}

export async function updateMe(payload) {
  return handleServiceCall(
    axiosInstance.put(ENDPOINTS.account.me, payload).then(({ data }) => {
      const user = mapAuthUser(data);
      persistAuthSession({ user });
      return user;
    })
  );
}

export async function updateUsername(payload) {
  return handleServiceCall(
    axiosInstance.put(ENDPOINTS.account.updateUsername, payload).then(({ data }) => data)
  );
}

export async function forgotPasswordRequestCode(payload) {
  return handleServiceCall(
    axiosInstance.post(ENDPOINTS.account.forgotPasswordRequestCode, payload).then(({ data }) => data)
  );
}

export async function forgotPasswordComplete(payload) {
  return handleServiceCall(
    axiosInstance.post(ENDPOINTS.account.forgotPasswordComplete, payload).then(({ data }) => data)
  );
}

export async function changePassword(payload) {
  return handleServiceCall(
    axiosInstance.post(ENDPOINTS.account.changePassword, payload).then(({ data }) => data)
  );
}

export async function setPassword(payload) {
  return handleServiceCall(
    axiosInstance.post(ENDPOINTS.account.setPassword, payload).then(({ data }) => data)
  );
}

export async function markFirstLoginDone() {
  return handleServiceCall(
    axiosInstance.post(ENDPOINTS.account.markFirstLoginDone).then(({ data }) => data)
  );
}

export async function createAdmin(payload) {
  return handleServiceCall(
    axiosInstance.post(ENDPOINTS.account.createAdmin, payload).then(({ data }) => data)
  );
}
