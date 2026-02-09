export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Roles for the unified users table
// Note: This Reports & Analytics system only allows "admin" role access
// Other roles (client, receptionist, manager, etc.) are used in other systems
export const APP_ROLES = {
  CLIENT: "client",
  RECEPTIONIST: "receptionist",
  MANAGER: "manager",
  INVENTORY_CONTROLLER: "inventory-controller",
  KITCHEN_STAFF: "kitchen-staff",
  PURCHASING_OFFICER: "purchasing-officer",
  ADMIN: "admin",
} as const;

export type AppRole = (typeof APP_ROLES)[keyof typeof APP_ROLES];