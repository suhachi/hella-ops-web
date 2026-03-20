import * as admin from "firebase-admin";

admin.initializeApp();

// Shared Utilities Export List
export * from "./shared/baseHandler";
export * from "./shared/types";
export * from "./shared/auth";
export * from "./shared/roles";
export * from "./shared/errors";
export * from "./shared/validators";
export * from "./shared/statusGuards";
export * from "./shared/fieldMasks";
export * from "./shared/transaction";
export * from "./shared/response";
export * from "./shared/logger";
export * from "./shared/firestore";
export * from "./shared/timestamps";
export * from "./shared/audit";
export * from "./shared/ids";

// Module Exports: Schedule (F1)
export * from "./modules/schedule/createScheduleWithWorkers";
export * from "./modules/schedule/updateScheduleAndWorkers";
export * from "./modules/schedule/cancelSchedule";
