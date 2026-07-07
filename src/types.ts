export type UserRole = 'teacher' | 'parent' | 'admin' | 'student';

export interface Student {
  id: string;
  name: string;
  avatar: string; // Monster emoji or icon name
  points: number;
  parentEmail: string;
  parentName: string;
}

export interface PointCategory {
  id: string;
  name: string;
  points: number; // positive or negative
  type: 'positive' | 'negative';
  icon: string;
}

export interface PointLog {
  id: string;
  studentId: string;
  categoryName: string;
  points: number;
  description: string;
  timestamp: string;
  type: 'positive' | 'negative';
}

export interface Message {
  id: string;
  senderId: string; // 'teacher_1' or parent email
  senderName: string;
  receiverId: string;
  content: string;
  timestamp: string;
  attachment?: {
    name: string;
    size: string;
    type: string;
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  category: 'event' | 'holiday' | 'exam' | 'meeting';
  isLocalOnly?: boolean; // For offline synchronization tracking
}

export interface WebhookConfig {
  id: string;
  url: string;
  name: string;
  events: string[];
  active: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
}

export interface PaymentItem {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid';
  category: 'material' | 'trip' | 'tuition';
}

export interface TranslationSchema {
  classroom: string;
  students: string;
  behavior: string;
  messages: string;
  calendar: string;
  reports: string;
  adminPanel: string;
  payment: string;
  offlineMode: string;
  onlineMode: string;
  positive: string;
  negative: string;
  points: string;
  searchPlaceholder: string;
  all: string;
  addStudent: string;
  exportPdf: string;
  exportExcel: string;
  chatAssistant: string;
  aiHelp: string;
  offlineNotice: string;
  twoFactorAuth: string;
  biometricLogin: string;
  webhookLogs: string;
  securitySettings: string;
  darkTheme: string;
  lightTheme: string;
  languageLabel: string;
  logout: string;
  loginAs: string;
  enter2FA: string;
  simulateBiometrics: string;
}
