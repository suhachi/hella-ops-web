import * as admin from "firebase-admin";

/**
 * Firestore 접근 래퍼 및 경로 유틸
 */
export const FirestoreUtils = {
  db: admin.firestore(),
  
  user(uid: string) {
    return this.db.collection("users").doc(uid);
  },
  schedule(id: string) {
    return this.db.collection("schedules").doc(id);
  },
  scheduleWorker(id: string) {
    return this.db.collection("schedule_workers").doc(id);
  },
  scheduleClosing(id: string) {
    return this.db.collection("schedule_closings").doc(id);
  },
  equipment(id: string) {
    return this.db.collection("equipments").doc(id);
  },
  nfcMapping(tagId: string) {
    return this.db.collection("nfc_tag_mappings").doc(tagId);
  },
  equipmentLogs() {
    return this.db.collection("equipment_logs");
  }
};
