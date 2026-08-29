export interface Paginated<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface Student {
  id: string;
  nis: string;
  fullName: string;
  classGrade: string;
  gender: 'L' | 'P' | null;
  dateOfBirth: string | null;
  photoUrl: string | null;
  qrToken: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Coach {
  id: string;
  userId: string;
  employeeNumber: string | null;
  specialization: string | null;
  bio: string | null;
  user: {
    id: string;
    fullName: string;
    email: string | null;
    phoneNumber: string | null;
    isActive: boolean;
    lastLoginAt: string | null;
  };
}

export interface ScheduleItem {
  id: string;
  dayOfWeek: number;
  dayLabel: string;
  startTime: string;
  endTime: string;
  location: string | null;
  isActive: boolean;
}

export interface ExtracurricularListItem {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  defaultCoachId: string | null;
  defaultCoachName: string | null;
  maxCapacity: number | null;
  isActive: boolean;
  memberCount: number;
  scheduleCount: number;
  createdAt: string;
}

export interface ExtracurricularDetail extends Omit<ExtracurricularListItem, 'scheduleCount'> {
  schedules: ScheduleItem[];
}

export interface MemberItem {
  membershipId: string;
  status: string;
  joinedDate: string;
  student: { id: string; nis: string; fullName: string; classGrade: string; isActive: boolean };
}

export const DAY_OPTIONS = [
  { value: 1, label: 'Senin' },
  { value: 2, label: 'Selasa' },
  { value: 3, label: 'Rabu' },
  { value: 4, label: 'Kamis' },
  { value: 5, label: 'Jumat' },
  { value: 6, label: 'Sabtu' },
  { value: 7, label: 'Minggu' },
];
