export type UserRole = "EMPLOYEE" | "LEADER" | "ADMIN" | "SUPER_ADMIN";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  phone?: string;
  profileImageUrl?: string;
  createdAt: any;
  updatedAt: any;
}

export interface AuditLog {
  actorUserId: string;
  action: string;
  status: "SUCCESS" | "FAILURE";
  payload: any;
  error?: string | null;
  timestamp: any;
}

export interface EquipmentLog {
  equipmentId: string;
  action: "CHECKOUT" | "CHECKIN" | "REPAIR" | "LOSS";
  actorUserId: string;
  actorName: string;
  timestamp: any;
}
