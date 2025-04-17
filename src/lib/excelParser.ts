
import { ExcelTimeSheetData, EmployeeTimeData, ImportResult, ExcelDayEntry, TimeEntry } from "./types";

// Função para converter os dados brutos do Excel para o formato ExcelTimeSheetData
export function parseExcelTimesheet(rawData: any, fileName: string): ImportResult {
  try {
    console.log("Dados brutos recebidos:", rawData);
    
    // Nome está na célula D3 (índice 2,3)
    let employeeName = "";
    let employeePosition = "";
    let month = "";
    let year = "";
    
    // Procura o nome na linha 3
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row) continue;
      
      // Procura a linha que contém "Nome:"
      if (row[0] === "Nome:") {
        employeeName = row[3] || "";
        month = row[10] || "";
      } 
      // Procura a linha que contém "Função:"
      else if (row[0] === "Função:") {
        employeePosition = row[3] || "";
        year = row[10] || "";
      }
    }
    
    // Validar se encontramos as informações básicas
    if (!employeeName || !month || !year) {
      return {
        success: false,
        message: "Formato de planilha inválido. Não foi possível encontrar informações do funcionário."
      };
    }
    
    // Encontrar a linha de cabeçalho com "DIA", "JORNADA", etc
    let headerRowIndex = -1;
    for (let i = 0; i < rawData.length; i++) {
      if (rawData[i] && 
          rawData[i][0] === "DIA") {
        headerRowIndex = i;
        break;
      }
    }
    
    if (headerRowIndex === -1) {
      return {
        success: false,
        message: "Formato de planilha inválido. Cabeçalho da tabela não encontrado."
      };
    }
    
    // Começar a ler as entradas de dias a partir da linha após o cabeçalho (pulando a linha de subtítulos)
    const entries: ExcelDayEntry[] = [];
    let currentRow = headerRowIndex + 2; // Pular a linha de subtítulos (ENTRADA, SAÍDA, etc)
    
    // Ler até encontrar "TOTAL:" ou até o final da planilha
    while (currentRow < rawData.length) {
      const row = rawData[currentRow];
      if (!row || !row[0] || row[0] === "TOTAL:") break;
      
      // Verificar se a primeira coluna é um número (dia do mês)
      if (typeof row[0] === "number") {
        // Determinar se há uma observação que indica um dia não trabalhado
        const observation = row[11] || "";
        const isHoliday = observation.toUpperCase().includes("FERIADO");
        const isVacation = observation.toUpperCase().includes("FÉRIAS");
        const isSick = observation.toUpperCase().includes("FALTA") || observation.toUpperCase().includes("DOENTE") || observation.toUpperCase().includes("VIROSE");
        const isNonWorkingDay = row[2] === 0 || isHoliday || isVacation || isSick;
        
        const entry: ExcelDayEntry = {
          day: Number(row[0]),
          weekday: row[1] || "",
          morningEntry: formatTimeValue(row[3]),
          morningExit: formatTimeValue(row[4]),
          afternoonEntry: formatTimeValue(row[5]),
          afternoonExit: formatTimeValue(row[6]),
          extraEntry: formatTimeValue(row[7]),
          extraExit: formatTimeValue(row[8]),
          hoursWorked: formatTimeValue(row[9]),
          extraHours: formatTimeValue(row[10]),
          observation: observation
        };
        
        entries.push(entry);
      }
      
      currentRow++;
    }
    
    // Encontrar os totais na planilha
    let totalRow = -1;
    let previousBalanceRow = -1;
    let currentBalanceRow = -1;
    let nextBalanceRow = -1;
    
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row) continue;
      
      if (row[0] === "TOTAL:" || (row[9] === "TOTAL:" && row[10] !== undefined)) {
        totalRow = i;
      }
      if (row[5] === "SALDO DO MÊS ANTERIOR") {
        previousBalanceRow = i;
      }
      if (row[5] === "SALDO DO MÊS ATUAL") {
        currentBalanceRow = i;
      }
      if (row[5] === "SALDO PARA O PRÓXIMO MÊS") {
        nextBalanceRow = i;
      }
    }
    
    const totalWorkedHours = totalRow !== -1 && rawData[totalRow] ? formatTimeValue(rawData[totalRow][9] || rawData[totalRow][10]) : "0:00";
    const previousMonthBalance = previousBalanceRow !== -1 && rawData[previousBalanceRow] ? formatTimeValue(rawData[previousBalanceRow][10]) : "0:00";
    const currentMonthBalance = currentBalanceRow !== -1 && rawData[currentBalanceRow] ? formatTimeValue(rawData[currentBalanceRow][10]) : "0:00";
    const nextMonthBalance = nextBalanceRow !== -1 && rawData[nextBalanceRow] ? formatTimeValue(rawData[nextBalanceRow][10]) : "0:00";
    
    // Criar o objeto ExcelTimeSheetData
    const excelData: ExcelTimeSheetData = {
      employee: {
        name: employeeName.trim(),
        position: employeePosition.trim(),
        month: month.trim(),
        year: String(year)
      },
      entries: entries,
      totals: {
        totalWorkedHours,
        previousMonthBalance,
        currentMonthBalance,
        nextMonthBalance
      }
    };
    
    // Converter para o formato EmployeeTimeData para o dashboard
    const employeeTimeData = convertExcelToEmployeeTimeData(excelData, fileName);
    
    return {
      success: true,
      message: "Dados importados com sucesso",
      data: employeeTimeData
    };
  } catch (error) {
    console.error("Erro ao processar planilha:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido ao processar planilha"
    };
  }
}

// Função para formatar valores decimais de tempo para string HH:MM
function formatTimeValue(value: any): string {
  if (value === null || value === undefined) {
    return "0:00";
  }
  
  // Se for um número decimal (ex: 0.3333333)
  if (typeof value === "number") {
    // No Excel, 1 = 24 horas, então multiplicamos por 24 para obter horas
    const totalHours = value * 24;
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    
    // Lidar com casos onde os minutos arredondam para 60
    if (minutes === 60) {
      return `${hours + 1}:00`;
    }
    
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  }
  
  // Se já for uma string, retorna como está
  return String(value);
}

// Converter do formato Excel para o formato do Dashboard
function convertExcelToEmployeeTimeData(excelData: ExcelTimeSheetData, fileName: string): EmployeeTimeData {
  // Extrair ID a partir do nome do arquivo ou gerar um aleatório
  const employeeId = fileName.replace(/\.[^/.]+$/, "").split(" - ").pop() || 
                     `EMP${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

  // Extrair departamento (da posição)
  const department = excelData.employee.position || "Sem departamento";
  
  // Converter as entradas
  const timeEntries = excelData.entries.map(entry => {
    // Converter strings de hora (HH:MM) para números decimais (horas)
    const hoursWorked = convertTimeStringToDecimal(entry.hoursWorked);
    const extraHours = convertTimeStringToDecimal(entry.extraHours);
    
    // Verificar se é um dia de trabalho ou não
    const isWorkDay = !(entry.weekday === "S" || entry.weekday === "D" || 
                      entry.observation?.toUpperCase().includes("FERIADO") ||
                      entry.observation?.toUpperCase().includes("FÉRIAS"));
    
    // Calcular horas previstas (jornada)
    // No formato Excel, a jornada está na coluna 2 (índice 2)
    // Se for 0, é um dia não trabalhado ou feriado
    const rawExpectedHours = typeof entry.weekday === "number" ? entry.weekday : 0;
    let expectedHours = rawExpectedHours * 24; // Converter de fração de dia para horas
    
    if (expectedHours === 0 && isWorkDay) {
      // Se for um dia de trabalho regular sem jornada especificada, assumir 8 horas
      expectedHours = 9; // Jornada padrão no Brasil (8h + 1h almoço)
    }
    
    // Calcular atrasos e horas justificadas
    // Atraso seria a diferença entre o esperado e o trabalhado, se negativa
    let lateHours = 0;
    if (isWorkDay && hoursWorked < expectedHours) {
      lateHours = expectedHours - hoursWorked;
    }
    
    // Horas justificadas (se houver observação, consideramos como justificada)
    const justifiedHours = entry.observation ? lateHours : 0;
    const actualLateHours = justifiedHours > 0 ? 0 : lateHours;
    
    // Calcular o saldo do dia
    // Se houver um valor explícito de horas extras, usar esse valor
    const balance = extraHours;
    
    // Construir a data (YYYY-MM-DD)
    const monthIndex = getMonthIndex(excelData.employee.month);
    const date = `${excelData.employee.year}-${(monthIndex + 1).toString().padStart(2, '0')}-${entry.day.toString().padStart(2, '0')}`;
    
    const timeEntry: TimeEntry = {
      date,
      hoursWorked,
      expectedHours,
      lateHours: actualLateHours,
      extraHours,
      justifiedHours,
      balance,
      justification: entry.observation ? {
        code: isWorkDay ? "J001" : "J002",
        description: entry.observation
      } : undefined,
      extraTypes: extraHours > 0 ? [
        {
          code: "910",
          description: "Extra registrada",
          hours: extraHours
        }
      ] : []
    };
    
    return timeEntry;
  });
  
  return {
    id: employeeId,
    name: excelData.employee.name,
    department,
    timeEntries
  };
}

// Função para converter string de hora (HH:MM) para decimal
function convertTimeStringToDecimal(timeStr: string): number {
  if (!timeStr || timeStr === "0:00") return 0;
  
  // Verificar se é um valor negativo
  const isNegative = timeStr.startsWith("-");
  const cleanTimeStr = isNegative ? timeStr.substring(1) : timeStr;
  
  const [hours, minutes] = cleanTimeStr.split(":").map(Number);
  let decimal = hours + (minutes / 60);
  
  return isNegative ? -decimal : decimal;
}

// Função para obter o índice do mês a partir do nome
function getMonthIndex(monthName: string): number {
  const months = [
    "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", 
    "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"
  ];
  
  const normalizedMonth = monthName.toUpperCase().trim();
  const index = months.findIndex(month => normalizedMonth.includes(month));
  
  return index !== -1 ? index : new Date().getMonth();
}
