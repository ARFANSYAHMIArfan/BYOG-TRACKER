import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocFromServer
} from 'firebase/firestore';
import config from '../../firebase-applet-config.json';
import { Device, Student, CheckInLog } from '../types';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(config) : getApp();

// Initialize Firestore with specific database ID if specified in config
export const db = config.firestoreDatabaseId
  ? getFirestore(app, config.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);

// Connection test on init
async function testConnection() {
  try {
    await getDocFromServer(doc(db, '_health_check', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Collection References
const STUDENTS_COL = 'students';
const DEVICES_COL = 'devices';
const LOGS_COL = 'logs';

// --- Realtime Subscriptions ---

export function subscribeStudents(onUpdate: (students: Student[]) => void) {
  const colRef = collection(db, STUDENTS_COL);
  return onSnapshot(colRef, (snapshot) => {
    const list: Student[] = [];
    snapshot.forEach((doc) => {
      list.push({ ...doc.data(), id: doc.id } as Student);
    });
    onUpdate(list);
  }, (err) => {
    console.error('Error listening to students collection:', err);
    handleFirestoreError(err, OperationType.LIST, STUDENTS_COL);
  });
}

export function subscribeDevices(onUpdate: (devices: Device[]) => void) {
  const colRef = collection(db, DEVICES_COL);
  return onSnapshot(colRef, (snapshot) => {
    const list: Device[] = [];
    snapshot.forEach((doc) => {
      list.push({ ...doc.data(), id: doc.id } as Device);
    });
    onUpdate(list);
  }, (err) => {
    console.error('Error listening to devices collection:', err);
    handleFirestoreError(err, OperationType.LIST, DEVICES_COL);
  });
}

export function subscribeLogs(onUpdate: (logs: CheckInLog[]) => void) {
  const colRef = collection(db, LOGS_COL);
  return onSnapshot(colRef, (snapshot) => {
    const list: CheckInLog[] = [];
    snapshot.forEach((doc) => {
      list.push({ ...doc.data(), id: doc.id } as CheckInLog);
    });
    // Sort logs descending by timestamp
    list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    onUpdate(list);
  }, (err) => {
    console.error('Error listening to logs collection:', err);
    handleFirestoreError(err, OperationType.LIST, LOGS_COL);
  });
}

// --- Student CRUD Operations ---

export async function fsSaveStudent(student: Student) {
  try {
    const docRef = doc(db, STUDENTS_COL, student.id);
    await setDoc(docRef, student, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${STUDENTS_COL}/${student.id}`);
  }
}

export async function fsUpdateStudent(student: Student) {
  try {
    const docRef = doc(db, STUDENTS_COL, student.id);
    await setDoc(docRef, student, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${STUDENTS_COL}/${student.id}`);
  }
}

export async function fsDeleteStudent(studentId: string) {
  try {
    const docRef = doc(db, STUDENTS_COL, studentId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${STUDENTS_COL}/${studentId}`);
  }
}

export async function fsBulkDeleteStudents(studentIds: string[]) {
  try {
    const batch = writeBatch(db);
    studentIds.forEach((id) => {
      const docRef = doc(db, STUDENTS_COL, id);
      batch.delete(docRef);
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, STUDENTS_COL);
  }
}

export async function fsSyncStudentsList(incomingStudents: Student[]) {
  try {
    const batch = writeBatch(db);
    incomingStudents.forEach((student) => {
      const id = student.id || `stu-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const docRef = doc(db, STUDENTS_COL, id);
      batch.set(docRef, { ...student, id }, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, STUDENTS_COL);
  }
}

// --- Device CRUD Operations ---

export async function fsSaveDevice(device: Device) {
  try {
    const docRef = doc(db, DEVICES_COL, device.id);
    await setDoc(docRef, device, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${DEVICES_COL}/${device.id}`);
  }
}

export async function fsUpdateDevice(device: Device) {
  try {
    const docRef = doc(db, DEVICES_COL, device.id);
    await setDoc(docRef, device, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${DEVICES_COL}/${device.id}`);
  }
}

export async function fsDeleteDevice(deviceId: string) {
  try {
    const docRef = doc(db, DEVICES_COL, deviceId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${DEVICES_COL}/${deviceId}`);
  }
}

export async function fsBulkImportDevices(incomingDevices: Device[]) {
  try {
    const batch = writeBatch(db);
    incomingDevices.forEach((dev) => {
      const id = dev.id || `dev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const docRef = doc(db, DEVICES_COL, id);
      batch.set(docRef, { ...dev, id }, { merge: true });
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, DEVICES_COL);
  }
}

// --- CheckIn Log Operations ---

export async function fsAddLog(log: CheckInLog) {
  try {
    const docRef = doc(db, LOGS_COL, log.id);
    await setDoc(docRef, log, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${LOGS_COL}/${log.id}`);
  }
}
