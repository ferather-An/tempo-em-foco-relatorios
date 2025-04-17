
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DepartmentSummary } from "@/lib/types";

interface TeamSummaryCardProps {
  departments: DepartmentSummary[];
}

export function TeamSummaryCard({ departments }: TeamSummaryCardProps) {
  // Format number with 1 decimal place
  const formatNumber = (num: number) => {
    return num.toFixed(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo por Departamento</CardTitle>
        <CardDescription>
          Médias e totais de horas por departamento
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Departamento</TableHead>
              <TableHead>Funcionários</TableHead>
              <TableHead>Média de Horas Trabalhadas</TableHead>
              <TableHead>Média de Horas Extras</TableHead>
              <TableHead>Média de Atrasos</TableHead>
              <TableHead>Saldo Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((dept) => (
              <TableRow key={dept.name}>
                <TableCell className="font-medium">{dept.name}</TableCell>
                <TableCell>{dept.totalEmployees}</TableCell>
                <TableCell>{formatNumber(dept.avgWorkedHours)}</TableCell>
                <TableCell>{formatNumber(dept.avgExtraHours)}</TableCell>
                <TableCell>{formatNumber(dept.avgLateHours)}</TableCell>
                <TableCell
                  className={
                    dept.totalBalance > 0
                      ? "text-green-500"
                      : dept.totalBalance < 0
                      ? "text-red-500"
                      : ""
                  }
                >
                  {dept.totalBalance > 0 ? "+" : ""}
                  {formatNumber(dept.totalBalance)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
