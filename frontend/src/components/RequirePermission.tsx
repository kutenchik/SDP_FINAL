import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useHub } from "../hooks/useHub";
import { can } from "../utils/permissions";
import type { Permission } from "../utils/permissions";
export function RequirePermission({
  permission,
  children,
}: {
  permission: Permission;
  children: ReactNode;
}) {
  return can(useHub().role, permission) ? (
    children
  ) : (
    <Navigate to="/" replace />
  );
}
