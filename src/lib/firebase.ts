import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import config from '../../firebase-applet-config.json';
import { Device, Student, CheckInLog } from '../types';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(config) : getApp();

// Initialize Firestore with specific database ID if specified in config
export const db = config.firestoreDatabaseId
  ? getFirestore(app, config.firestoreDatabaseId)
  : getFirestore(app);

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
  });
}

// --- Student CRUD Operations ---

export async function fsSaveStudent(student: Student) {
  const docRef = doc(db, STUDENTS_COL, student.id);
  await setDoc(docRef, student, { merge: true });
}

export async function fsUpdateStudent(student: Student) {
  const docRef = doc(db, STUDENTS_COL, student.id);
  await setDoc(docRef, student, { merge: true });
}

export async function fsDeleteStudent(studentId: string) {
  const docRef = doc(db, STUDENTS_COL, studentId);
  await deleteDoc(docRef);
}

export async function fsBulkDeleteStudents(studentIds: string[]) {
  const batch = writeBatch(db);
  studentIds.forEach((id) => {
    const docRef = doc(db, STUDENTS_COL, id);
    batch.delete(docRef);
  });
  await batch.commit();
}

export async function fsSyncStudentsList(incomingStudents: Student[]) {
  const batch = writeBatch(db);
  incomingStudents.forEach((student) => {
    const id = student.id || `stu-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const docRef = doc(db, STUDENTS_COL, id);
    batch.set(docRef, { ...student, id }, { merge: true });
  });
  await batch.commit();
}

// --- Device CRUD Operations ---

export async function fsSaveDevice(device: Device) {
  const docRef = doc(db, DEVICES_COL, device.id);
  await setDoc(docRef, device, { merge: true });
}

export async function fsUpdateDevice(device: Device) {
  const docRef = doc(db, DEVICES_COL, device.id);
  await setDoc(docRef, device, { merge: true });
}

export async function fsDeleteDevice(deviceId: string) {
  const docRef = doc(db, DEVICES_COL, deviceId);
  await deleteDoc(docRef);
}

export async function fsBulkImportDevices(incomingDevices: Device[]) {
  const batch = writeBatch(db);
  incomingDevices.forEach((dev) => {
    const id = dev.id || `dev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const docRef = doc(db, DEVICES_COL, id);
    batch.set(docRef, { ...dev, id }, { merge: true });
  });
  await batch.commit();
}

// --- CheckIn Log Operations ---

export async function fsAddLog(log: CheckInLog) {
  const docRef = doc(db, LOGS_COL, log.id);
  await setDoc(docRef, log, { merge: true });
}
