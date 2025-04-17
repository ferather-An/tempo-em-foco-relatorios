
// Types for the dashboard data
export interface EmployeeData {
  id: string;
  name: string;
  department: string;
}

export interface TimeEntry {
  date: string;
  hoursWorked: number;
  expectedHours: number;
  lateHours: number;
  extraHours: number;
  justifiedHours: number;
  balance: number;
  justification?: {
    code: string;
    description: string;
  };
  extraTypes?: {
    code: string;
    description: string;
    hours: number;
  }[];
}

export interface EmployeeTimeData extends EmployeeData {
  timeEntries: TimeEntry[];
}

export interface DepartmentSummary {
  name: string;
  totalEmployees: number;
  avgWorkedHours: number;
  avgExtraHours: number;
  avgLateHours: number;
  totalBalance: number;
}

export interface TeamData {
  departments: DepartmentSummary[];
  employees: EmployeeTimeData[];
}

// Tipos para importação de Excel
export interface ExcelTimeSheetData {
  employee: {
    name: string;
    position: string;
    month: string;
    year: string;
  };
  entries: ExcelDayEntry[];
  totals: {
    totalWorkedHours: string;
    previousMonthBalance: string;
    currentMonthBalance: string;
    nextMonthBalance: string;
  };
}

export interface ExcelDayEntry {
  day: number;
  weekday: string;
  morningEntry?: string;
  morningExit?: string;
  afternoonEntry?: string;
  afternoonExit?: string;
  extraEntry?: string;
  extraExit?: string;
  hoursWorked: string;
  extraHours: string;
  observation?: string;
}

export interface ImportResult {
  success: boolean;
  message: string;
  data?: EmployeeTimeData;
}
