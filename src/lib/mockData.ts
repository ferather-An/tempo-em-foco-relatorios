
import { EmployeeTimeData, TeamData } from "./types";

// Mock data for demonstration
export const generateMockData = (): TeamData => {
  const departments = ["TI", "Marketing", "RH", "Financeiro"];
  const employees: EmployeeTimeData[] = [];
  
  // Generate employees and time entries
  for (let i = 1; i <= 12; i++) {
    const deptIndex = Math.floor(Math.random() * departments.length);
    const employee: EmployeeTimeData = {
      id: `EMP${i.toString().padStart(3, '0')}`,
      name: `Funcionário ${i}`,
      department: departments[deptIndex],
      timeEntries: []
    };
    
    // Generate time entries for the current month
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      if (date > today) continue; // Don't generate future dates
      
      const isLate = Math.random() < 0.3;
      const hasExtra = Math.random() < 0.4;
      const hasJustification = isLate && Math.random() < 0.6;
      
      const expectedHours = 8;
      const lateHours = isLate ? Math.round((Math.random() * 2) * 4) / 4 : 0; // Round to nearest 0.25
      const extraHours = hasExtra ? Math.round((Math.random() * 3) * 4) / 4 : 0;
      const justifiedHours = hasJustification ? Math.min(lateHours, Math.round((Math.random() * lateHours) * 4) / 4) : 0;
      const actualLate = lateHours - justifiedHours;
      const hoursWorked = Math.max(0, expectedHours - actualLate) + extraHours;
      
      const entry = {
        date: `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
        hoursWorked,
        expectedHours,
        lateHours: actualLate,
        extraHours,
        justifiedHours,
        balance: hoursWorked - expectedHours,
        justification: hasJustification ? {
          code: ["J001", "J002", "J003", "J004", "J005"][Math.floor(Math.random() * 5)],
          description: ["Consulta médica", "Problema familiar", "Transporte público", "Tráfego intenso", "Outros"][Math.floor(Math.random() * 5)]
        } : undefined,
        extraTypes: hasExtra ? [
          {
            code: Math.random() < 0.5 ? "910" : "920",
            description: Math.random() < 0.5 ? "Extra não autorizada manhã" : "Extra não autorizada noite",
            hours: extraHours
          }
        ] : []
      };
      
      employee.timeEntries.push(entry);
    }
    
    employees.push(employee);
  }
  
  // Generate department summaries
  const departmentSummaries = departments.map(dept => {
    const deptEmployees = employees.filter(emp => emp.department === dept);
    const totalEmployees = deptEmployees.length;
    
    let totalWorkedHours = 0;
    let totalExtraHours = 0;
    let totalLateHours = 0;
    let totalBalanceHours = 0;
    let totalWorkDays = 0;
    
    deptEmployees.forEach(emp => {
      emp.timeEntries.forEach(entry => {
        totalWorkedHours += entry.hoursWorked;
        totalExtraHours += entry.extraHours;
        totalLateHours += entry.lateHours;
        totalBalanceHours += entry.balance;
        totalWorkDays++;
      });
    });
    
    // Calculate averages
    const avgDays = totalWorkDays / totalEmployees;
    const avgWorkedHours = totalWorkedHours / totalWorkDays;
    const avgExtraHours = totalExtraHours / totalWorkDays;
    const avgLateHours = totalLateHours / totalWorkDays;
    
    return {
      name: dept,
      totalEmployees,
      avgWorkedHours: Math.round(avgWorkedHours * 100) / 100,
      avgExtraHours: Math.round(avgExtraHours * 100) / 100,
      avgLateHours: Math.round(avgLateHours * 100) / 100,
      totalBalance: Math.round(totalBalanceHours * 100) / 100
    };
  });
  
  return {
    departments: departmentSummaries,
    employees
  };
};

export const mockTeamData = generateMockData();

// Utility functions to calculate metrics
export const getEmployeeMetrics = (employee: EmployeeTimeData) => {
  let totalWorked = 0;
  let totalExpected = 0;
  let totalLate = 0;
  let totalExtra = 0;
  let totalJustified = 0;
  const workDays = employee.timeEntries.length;
  
  employee.timeEntries.forEach(entry => {
    totalWorked += entry.hoursWorked;
    totalExpected += entry.expectedHours;
    totalLate += entry.lateHours;
    totalExtra += entry.extraHours;
    totalJustified += entry.justifiedHours;
  });
  
  return {
    totalWorked: Math.round(totalWorked * 100) / 100,
    totalExpected: Math.round(totalExpected * 100) / 100,
    totalLate: Math.round(totalLate * 100) / 100,
    totalExtra: Math.round(totalExtra * 100) / 100,
    totalJustified: Math.round(totalJustified * 100) / 100,
    balance: Math.round((totalWorked - totalExpected) * 100) / 100,
    avgDaily: workDays ? Math.round((totalWorked / workDays) * 100) / 100 : 0,
    avgExtra: workDays ? Math.round((totalExtra / workDays) * 100) / 100 : 0,
    avgLate: workDays ? Math.round((totalLate / workDays) * 100) / 100 : 0,
    workDays
  };
};
