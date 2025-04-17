
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/dashboard/StatCard";
import { TimeDataTable } from "@/components/dashboard/TimeDataTable";
import { TimeMetricsChart } from "@/components/dashboard/TimeMetricsChart";
import { TeamSummaryCard } from "@/components/dashboard/TeamSummaryCard";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import { EmployeeSelector } from "@/components/dashboard/EmployeeSelector";
import { mockTeamData, getEmployeeMetrics } from "@/lib/mockData";
import { Clock, CheckCheck, Hourglass, Timer, Users } from "lucide-react";

const Index = () => {
  // State for filters
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    const currentDate = new Date();
    return currentDate.getMonth();
  });
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const currentDate = new Date();
    return currentDate.getFullYear();
  });
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  // Filter data based on current selection
  const filteredEmployees = mockTeamData.employees.map((employee) => ({
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
      ) / filteredEmployees.length,
    avgExtraHours:
      filteredEmployees.reduce(
        (sum, emp) => sum + getEmployeeMetrics(emp).avgExtra,
        0
      ) / filteredEmployees.length,
    avgLateHours:
      filteredEmployees.reduce(
        (sum, emp) => sum + getEmployeeMetrics(emp).avgLate,
        0
      ) / filteredEmployees.length,
    totalBalance: filteredEmployees.reduce(
      (sum, emp) => sum + getEmployeeMetrics(emp).balance,
      0
    ),
  };

  // Format numbers to display
  const formatNumber = (num: number) => num.toFixed(1);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-10 border-b bg-white shadow-sm">
        <div className="container mx-auto py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl font-bold text-blue-700">
              Tempo em Foco: Relatórios de Horas
            </h1>
            <div className="flex items-center gap-4">
              <MonthSelector
                month={selectedMonth}
                year={selectedYear}
                onChange={(month, year) => {
                  setSelectedMonth(month);
                  setSelectedYear(year);
                }}
              />
              <EmployeeSelector
                employees={mockTeamData.employees}
                selectedId={selectedEmployeeId}
                onSelect={setSelectedEmployeeId}
                includeAll={true}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto flex-1 p-4">
        <Tabs defaultValue="overview">
          <div className="mb-6 flex justify-between">
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="individual">Funcionário</TabsTrigger>
              <TabsTrigger value="team">Equipe</TabsTrigger>
            </TabsList>
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

            <TeamSummaryCard departments={mockTeamData.departments} />
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
