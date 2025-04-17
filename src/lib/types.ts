
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
