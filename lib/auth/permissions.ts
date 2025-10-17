import { UserProfile } from "./auth-context"

export const DEFAULT_PERMISSIONS = {
  owner: [
    "admin.access",
    "admin.users.view",
    "admin.users.create",
    "admin.users.edit",
    "admin.users.delete",
    "admin.companies.view",
    "admin.companies.create",
    "admin.companies.edit",
    "admin.companies.delete",
    "gpts.view",
    "gpts.create",
    "gpts.edit",
    "gpts.delete",
    "knowledge.view",
    "knowledge.upload",
    "knowledge.edit",
    "knowledge.delete",
    "chat.access",
    "chat.history.view",
    "dashboard.view",
    "eos.view",
    "eos.edit",
    "company.users.view",
    "company.users.create",
    "company.users.edit",
    "company.users.delete",
  ],
  admin: [
    "admin.access",
    "admin.users.view",
    "admin.users.create",
    "admin.users.edit",
    "admin.companies.view",
    "admin.companies.create",
    "admin.companies.edit",
    "gpts.view",
    "gpts.create",
    "gpts.edit",
    "gpts.delete",
    "knowledge.view",
    "knowledge.upload",
    "knowledge.edit",
    "knowledge.delete",
    "chat.access",
    "chat.history.view",
    "dashboard.view",
    "eos.view",
    "eos.edit",
    "company.users.view",
    "company.users.create",
    "company.users.edit",
    "company.users.delete",
  ],
  company_owner: [
    "admin.access",
    "gpts.view",
    "knowledge.view",
    "chat.access",
    "chat.history.view",
    "dashboard.view",
    "eos.view",
    "eos.edit",
    "company.users.view",
    "company.users.create",
    "company.users.edit",
    "company.users.delete",
  ],
  employee: ["chat.access", "dashboard.view"],
}

export function getDefaultPermissions(role: UserProfile["role"]): string[] {
  return DEFAULT_PERMISSIONS[role] || []
}

export function hasAdminAccess(role: UserProfile["role"]): boolean {
  return ["owner", "admin", "company_owner"].includes(role)
}

export function canViewAllCompanies(role: UserProfile["role"]): boolean {
  return ["owner", "admin"].includes(role)
}

export function canManageUsers(role: UserProfile["role"]): boolean {
  return ["owner", "admin", "company_owner"].includes(role)
}

export function canCreateCompanies(role: UserProfile["role"]): boolean {
  return ["owner", "admin"].includes(role)
}

export function canModifyOwnerRole(role: UserProfile["role"]): boolean {
  return role === "owner"
}
