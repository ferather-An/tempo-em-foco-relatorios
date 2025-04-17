
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
        
        // Para debug
        console.log(`Dia ${row[0]}: Raw data`, {
          day: row[0],
          weekday: row[1],
          jornada: row[2],
          manhãEntrada: row[3],
          manhãSaída: row[4],
          tardeEntrada: row[5],
          tardeSaída: row[6],
          extraEntrada: row[7],
          extraSaída: row[8],
          horaTrabalhada: row[9],
          horaExtra: row[10],
          observação: row[11]
        });
        
        const entry: ExcelDayEntry = {
          day: Number(row[0]),
          weekday: row[1] || "",
          expectedHours: row[2], // Guardar o valor bruto da jornada
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
    
    console.log("Saldos encontrados:", {
      totalWorkedHours,
      previousMonthBalance,
      currentMonthBalance,
      nextMonthBalance
    });
    
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
      },
      rawData: rawData // Incluir dados brutos para facilitar debug
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
    // Usar diretamente os valores brutos da planilha
    const expectedHoursRaw = entry.expectedHours || 0;
    const expectedHours = expectedHoursRaw * 24; // Converter de fração de dia para horas
    
    // Verificar se é um dia de trabalho ou não
    const isWorkDay = !(entry.weekday === "S" || entry.weekday === "D" || 
                      entry.observation?.toUpperCase().includes("FERIADO") ||
                      entry.observation?.toUpperCase().includes("FÉRIAS"));
    
    // Extrair horas trabalhadas e horas extras diretamente dos valores brutos
    // Converter strings de hora (HH:MM) para números decimais (horas)
    const hoursWorkedRaw = convertRawExcelNumberToDecimal(entry.hoursWorked);
    const extraHoursRaw = convertRawExcelNumberToDecimal(entry.extraHours);
    
    console.log(`Dia ${entry.day}: Processamento`, {
      hoursWorkedRaw,
      extraHoursRaw,
      expectedHoursRaw,
      expectedHours,
      isWorkDay
    });
    
    // Calcular atrasos e horas justificadas
    let lateHours = 0;
    if (isWorkDay && expectedHours > 0 && hoursWorkedRaw < expectedHours) {
      lateHours = expectedHours - hoursWorkedRaw;
    }
    
    // Horas justificadas (se houver observação, consideramos como justificada)
    const justifiedHours = (entry.observation && lateHours > 0) ? lateHours : 0;
    const actualLateHours = justifiedHours > 0 ? 0 : lateHours;
    
    // Usar o valor de horas extras diretamente da planilha
    const extraHours = extraHoursRaw; 
    
    // Calcular o saldo do dia
    const balance = extraHours;
    
    // Construir a data (YYYY-MM-DD)
    const monthIndex = getMonthIndex(excelData.employee.month);
    const date = `${excelData.employee.year}-${(monthIndex + 1).toString().padStart(2, '0')}-${entry.day.toString().padStart(2, '0')}`;
    
    const timeEntry: TimeEntry = {
      date,
      hoursWorked: hoursWorkedRaw,
      expectedHours: expectedHours,
      lateHours: actualLateHours,
      extraHours: extraHours,
      justifiedHours: justifiedHours,
      balance: balance,
      rawValues: {
        hoursWorked: entry.hoursWorked,
        extraHours: entry.extraHours,
        expectedHours: expectedHoursRaw
      },
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
    timeEntries,
    rawData: excelData.rawData
  };
}

// Função para converter valores brutos de Excel para números decimais
function convertRawExcelNumberToDecimal(value: string | number): number {
  // Se for string "HH:MM", converter para decimal
  if (typeof value === "string") {
    const [hours, minutes] = value.split(":").map(Number);
    if (!isNaN(hours) && !isNaN(minutes)) {
      return hours + (minutes / 60);
    }
    return 0;
  }
  
  // Se for número decimal direto do Excel (fração de dia)
  if (typeof value === "number") {
    // Excel: 1 = 24 horas
    return value * 24;
  }
  
  return 0;
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
