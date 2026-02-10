export function demoUser(role = "EMPLOYEE") {
  // Used only to keep the frontend fully navigable without backend.
  const id = role === "ADMIN" ? "admin-001" : "emp-001";
  return {
    id,
    name: role === "ADMIN" ? "Admin User" : "Employee User",
    email: role === "ADMIN" ? "admin@inshift.local" : "employee@inshift.local",
    role,
  };
}