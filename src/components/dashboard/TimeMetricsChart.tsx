
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TimeEntry } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TimeMetricsChartProps {
  title: string;
  entries: TimeEntry[];
}

export function TimeMetricsChart({ entries, title }: TimeMetricsChartProps) {
  const chartData = entries.map((entry) => {
    const date = new Date(entry.date);
    return {
      date: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      trabalhado: parseFloat(entry.hoursWorked.toFixed(1)),
      extra: parseFloat(entry.extraHours.toFixed(1)),
      atraso: parseFloat(entry.lateHours.toFixed(1)),
      abono: parseFloat(entry.justifiedHours.toFixed(1)),
      previsto: parseFloat(entry.expectedHours.toFixed(1)),
    };
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                angle={-45}
                textAnchor="end"
              />
              <YAxis unit="h" />
              <Tooltip formatter={(value) => [`${value} horas`, ""]} />
              <Legend />
              <Bar
                dataKey="previsto"
                name="Horas Previstas"
                fill="#9CA3AF"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="trabalhado"
                name="Horas Trabalhadas"
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="extra"
                name="Horas Extras"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="atraso"
                name="Atrasos"
                fill="#EF4444"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="abono"
                name="Horas Abonadas"
                fill="#F59E0B"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
