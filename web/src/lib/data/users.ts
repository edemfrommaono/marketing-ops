import { apiClient } from "@/lib/api-client";
import { UserRole } from "@/types/api";

export interface UserRow {
  id:        string;
  name:      string | null;
  email:     string | null;
  role:      UserRole;
  createdAt: string;
}

export async function getUsers(): Promise<UserRow[]> {
  const response = await apiClient.get<UserRow[]>("/users");
  
  if (response.error || !response.data) {
    console.error("Failed to fetch users:", response.error);
    return [];
  }

  return response.data;
}
