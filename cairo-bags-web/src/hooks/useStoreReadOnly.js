import { useAuth } from "../context/AuthContext.jsx";
import { isStoreReadOnly } from "../utils/storePermissions.js";

export function useStoreReadOnly() {
  const { user } = useAuth();
  return isStoreReadOnly(user);
}
