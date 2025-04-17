
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/dashboard/StatCard";
import { TimeDataTable } from "@/components/dashboard/TimeDataTable";
import { TimeMetricsChart } from "@/components/dashboard/TimeMetricsChart";
import { TeamSummaryCard } from "@/components/dashboard/TeamSummaryCard";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import { EmployeeSelector } from "@/components/dashboard/EmployeeSelector";
import { ExcelImporter } from "@/components/dashboard/ExcelImporter";
import { mockTeamData, getEmployeeMetrics } from "@/lib/mockData";
import { EmployeeTimeData, TeamData } from "@/lib/types";
import { Clock, CheckCheck, Hourglass, Timer, Users } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const Index = () => {
  // State for filters and data
  const [teamData, setTeamData] = useState<TeamData>(mockTeamData);
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    const currentDate = new Date();
    return currentDate.getMonth();
  });
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const currentDate = new Date();
    return currentDate.getFullYear();
  });
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [importedEmployees, setImportedEmployees] = useState<EmployeeTimeData[]>([]);
  const [showRawValues, setShowRawValues] = useState(false);
  
  // Use local storage to persist imported employees
  useEffect(() => {
    const savedEmployees = localStorage.getItem('importedEmployees');
    if (savedEmployees) {
      try {
        const parsedData = JSON.parse(savedEmployees);
        setImportedEmployees(parsedData);
      } catch (e) {
        console.error("Erro ao carregar dados salvos:", e);
      }
    }
  }, []);
  
  useEffect(() => {
    // Save imported employees to local storage
    if (importedEmployees.length > 0) {
      localStorage.setItem('importedEmployees', JSON.stringify(importedEmployees));
    }
  }, [importedEmployees]);
  
  // Combine mock data with imported data
  const combinedTeamData: TeamData = {
    departments: teamData.departments,
    employees: [...teamData.employees, ...importedEmployees]
  };

  // Filter data based on current selection
  const filteredEmployees = combinedTeamData.employees.map((employee) => ({
    ...employee,
    timeEntries: employee.timeEntries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getMonth() === selectedMonth &&
        entryDate.getFullYear() === selectedYear
      );
    }),
  }));

  const currentEmployee = selectedEmployeeId
    ? filteredEmployees.find((emp) => emp.id === selectedEmployeeId)
    : filteredEmployees[0];

  // Calculate metrics for the current selection
  const teamMetrics = {
    totalEmployees: filteredEmployees.length,
    avgWorkedHours:
      filteredEmployees.reduce(
        (sum, emp) => sum + getEmployeeMetrics(emp).avgDaily,
        0
      ) / (filteredEmployees.length || 1), // Evitar divisão por zero
    avgExtraHours:
      filteredEmployees.reduce(
        (sum, emp) => sum + getEmployeeMetrics(emp).avgExtra,
        0
      ) / (filteredEmployees.length || 1),
    avgLateHours:
      filteredEmployees.reduce(
        (sum, emp) => sum + getEmployeeMetrics(emp).avgLate,
        0
      ) / (filteredEmployees.length || 1),
    totalBalance: filteredEmployees.reduce(
      (sum, emp) => sum + getEmployeeMetrics(emp).balance,
      0
    ),
  };

  // Format numbers to display
  const formatNumber = (num: number) => num.toFixed(1);
  
  // Handle Excel import
  const handleImportExcel = (employeeData: EmployeeTimeData) => {
    // Check if employee already exists
    const existingIndex = importedEmployees.findIndex(e => 
      e.name === employeeData.name && e.department === employeeData.department
    );
    
    if (existingIndex >= 0) {
      // Update existing employee data
      const updatedEmployees = [...importedEmployees];
      updatedEmployees[existingIndex] = employeeData;
      setImportedEmployees(updatedEmployees);
      toast({ 
        title: "Dados atualizados", 
        description: `Os dados de ${employeeData.name} foram atualizados.` 
      });
    } else {
      // Add new employee
      setImportedEmployees([...importedEmployees, employeeData]);
      toast({ 
        title: "Funcionário adicionado", 
        description: `${employeeData.name} foi adicionado ao dashboard.` 
      });
    }
    
    // Auto-select the imported employee
    setSelectedEmployeeId(employeeData.id);
  };
  
  // Clear imported data
  const handleClearData = () => {
    if (window.confirm("Tem certeza que deseja limpar todos os dados importados?")) {
      setImportedEmployees([]);
      localStorage.removeItem('importedEmployees');
      setSelectedEmployeeId(null);
      toast({ 
        title: "Dados limpos", 
        description: "Todos os dados importados foram removidos." 
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-10 border-b bg-white shadow-sm">
        <div className="container mx-auto py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl font-bold text-blue-700">
              Tempo em Foco: Relatórios de Horas
            </h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <MonthSelector
                month={selectedMonth}
                year={selectedYear}
                onChange={(month, year) => {
                  setSelectedMonth(month);
                  setSelectedYear(year);
                }}
              />
              <EmployeeSelector
                employees={combinedTeamData.employees}
                selectedId={selectedEmployeeId}
                onSelect={setSelectedEmployeeId}
                includeAll={true}
              />
              <div className="flex gap-2">
                <ExcelImporter onImport={handleImportExcel} />
                {importedEmployees.length > 0 && (
                  <button 
                    onClick={handleClearData}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Limpar dados
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto flex-1 p-4">
        <Tabs defaultValue="overview">
          <div className="mb-6 flex flex-wrap justify-between items-center gap-2">
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="individual">Funcionário</TabsTrigger>
              <TabsTrigger value="team">Equipe</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="raw-values" 
                checked={showRawValues} 
                onCheckedChange={setShowRawValues}
              />
              <Label htmlFor="raw-values">Exibir valores brutos</Label>
            </div>
          </div>

          {/* Visão Geral Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Média de Horas Diárias"
                value={formatNumber(teamMetrics.avgWorkedHours)}
                description="Média de horas trabalhadas por dia"
                icon={<Clock />}
              />
              <StatCard
                title="Média de Horas Extras"
                value={formatNumber(teamMetrics.avgExtraHours)}
                description="Média de horas extras por dia"
                icon={<Timer />}
                valueClassName="text-green-600"
              />
              <StatCard
                title="Média de Atrasos"
                value={formatNumber(teamMetrics.avgLateHours)}
                description="Média de horas de atraso por dia"
                icon={<CheckCheck />}
                valueClassName="text-red-500"
              />
              <StatCard
                title="Saldo Total do Período"
                value={
                  (teamMetrics.totalBalance > 0 ? "+" : "") +
                  formatNumber(teamMetrics.totalBalance)
                }
                description="Saldo líquido de horas"
                icon={<Hourglass />}
                valueClassName={
                  teamMetrics.totalBalance > 0
                    ? "text-green-600"
                    : teamMetrics.totalBalance < 0
                    ? "text-red-500"
                    : ""
                }
              />
            </div>

            <TimeMetricsChart
              title="Histórico de Horas no Período"
              entries={
                currentEmployee
                  ? currentEmployee.timeEntries
                  : filteredEmployees
                      .flatMap((emp) => emp.timeEntries)
                      .sort((a, b) => a.date.localeCompare(b.date))
              }
            />

            <Card>
              <CardHeader>
                <CardTitle>
                  Detalhes do Período:{" "}
                  {currentEmployee ? currentEmployee.name : "Todos os Funcionários"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TimeDataTable
                  entries={
                    currentEmployee
                      ? currentEmployee.timeEntries
                      : filteredEmployees
                          .flatMap((emp) => emp.timeEntries)
                          .sort((a, b) => a.date.localeCompare(b.date))
                  }
                  showRawValues={showRawValues}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Individual Tab */}
          <TabsContent value="individual" className="space-y-6">
            {currentEmployee && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Detalhes do Funcionário: {currentEmployee.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <StatCard
                        title="Total Trabalhado"
                        value={
                          formatNumber(getEmployeeMetrics(currentEmployee).totalWorked) +
                          "h"
                        }
                        description="Total de horas trabalhadas no período"
                        icon={<Clock />}
                      />
                      <StatCard
                        title="Total de Extras"
                        value={
                          formatNumber(getEmployeeMetrics(currentEmployee).totalExtra) +
                          "h"
                        }
                        description="Total de horas extras no período"
                        icon={<Timer />}
                        valueClassName="text-green-600"
                      />
                      <StatCard
                        title="Total de Atrasos"
                        value={
                          formatNumber(getEmployeeMetrics(currentEmployee).totalLate) +
                          "h"
                        }
                        description="Total de horas de atraso no período"
                        icon={<CheckCheck />}
                        valueClassName="text-red-500"
                      />
                      <StatCard
                        title="Saldo"
                        value={
                          (getEmployeeMetrics(currentEmployee).balance > 0 ? "+" : "") +
                          formatNumber(getEmployeeMetrics(currentEmployee).balance) +
                          "h"
                        }
                        description="Saldo de horas no período"
                        icon={<Hourglass />}
                        valueClassName={
                          getEmployeeMetrics(currentEmployee).balance > 0
                            ? "text-green-600"
                            : getEmployeeMetrics(currentEmployee).balance < 0
                            ? "text-red-500"
                            : ""
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <TimeMetricsChart
                  title={`Histórico de Horas - ${currentEmployee.name}`}
                  entries={currentEmployee.timeEntries}
                />

                <TimeDataTable
                  entries={currentEmployee.timeEntries}
                  caption={`Detalhamento diário - ${currentEmployee.name}`}
                  showRawValues={showRawValues}
                />
              </>
            )}
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Visão Geral da Equipe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    title="Total de Funcionários"
                    value={teamMetrics.totalEmployees}
                    description="Número de funcionários ativos"
                    icon={<Users />}
                  />
                  <StatCard
                    title="Média de Horas Diárias"
                    value={formatNumber(teamMetrics.avgWorkedHours) + "h"}
                    description="Média de horas trabalhadas por dia"
                    icon={<Clock />}
                  />
                  <StatCard
                    title="Média de Horas Extras"
                    value={formatNumber(teamMetrics.avgExtraHours) + "h"}
                    description="Média de horas extras por dia"
                    icon={<Timer />}
                    valueClassName="text-green-600"
                  />
                  <StatCard
                    title="Média de Atrasos"
                    value={formatNumber(teamMetrics.avgLateHours) + "h"}
                    description="Média de horas de atraso por dia"
                    icon={<CheckCheck />}
                    valueClassName="text-red-500"
                  />
                </div>
              </CardContent>
            </Card>

            <TeamSummaryCard departments={teamData.departments} />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t bg-white py-4">
        <div className="container mx-auto text-center text-sm text-gray-500">
          Tempo em Foco: Relatórios de Horas © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};

export default Index;
