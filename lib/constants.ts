export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const APP_ROLES = {
  HOTEL_MANAGER: "hotel_manager",
  FINANCE_MANAGER: "finance_manager",
  OPERATIONS_MANAGER: "operations_manager",
} as const;

export type AppRole = (typeof APP_ROLES)[keyof typeof APP_ROLES];

// Default role assigned when a new account is created
export const DEFAULT_APP_ROLE: AppRole = APP_ROLES.HOTEL_MANAGER;

// Define the landing page for each role. These can be adjusted per subsystem.
// Example: replace "/inventory" with the actual Inventory app path when ready.
export const ROLE_LANDING_PAGES: Record<AppRole, string> = {
  [APP_ROLES.HOTEL_MANAGER]: "/dashboard",
  [APP_ROLES.FINANCE_MANAGER]: "/revenue",
  [APP_ROLES.OPERATIONS_MANAGER]: "/inventory",
};

// Placeholder subsystem targets that can be swapped with real paths later.
export const SUBSYSTEM_PLACEHOLDERS = [
  { value: "/inventory", label: "Inventory subsystem (placeholder)" },
  { value: "/reception", label: "Reception subsystem (placeholder)" },
  { value: "/dashboard", label: "Reports dashboard (default)" },
];