export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const APP_ROLES = {
  HOTEL_MANAGER: "hotel_manager",
  FINANCE_MANAGER: "finance_manager",
  OPERATIONS_MANAGER: "operations_manager",
} as const;

export type AppRole = (typeof APP_ROLES)[keyof typeof APP_ROLES];
