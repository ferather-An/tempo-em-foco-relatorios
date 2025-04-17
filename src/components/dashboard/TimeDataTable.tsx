
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TimeEntry } from "@/lib/types";

interface TimeDataTableProps {
  entries: TimeEntry[];
  caption?: string;
  showRawValues?: boolean;
}

export function TimeDataTable({ entries, caption, showRawValues = false }: TimeDataTableProps) {
  // Format date to Brazilian format
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR");
  };

  // Format hours with 1 decimal place
  const formatHours = (hours: number) => {
    return hours.toFixed(1);
  };

  return (
    <div className="rounded-md border">
      <Table>
        {caption && <TableCaption>{caption}</TableCaption>}
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Jornada Prevista</TableHead>
            <TableHead>Horas Trabalhadas</TableHead>
            <TableHead>Horas Extra</TableHead>
            <TableHead>Atrasos/Faltas</TableHead>
            <TableHead>Horas Abonadas</TableHead>
            <TableHead>Saldo</TableHead>
            <TableHead>Justificativa</TableHead>
            {showRawValues && <TableHead>Valores Brutos</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.date}>
              <TableCell>{formatDate(entry.date)}</TableCell>
              <TableCell>{formatHours(entry.expectedHours)}</TableCell>
              <TableCell>{formatHours(entry.hoursWorked)}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{formatHours(entry.extraHours)}</span>
                  {entry.extraTypes &&
                    entry.extraTypes.map((type) => (
                      <span
                        key={type.code}
                        className="text-xs text-muted-foreground"
                      >
                        {type.code} - {type.description}
                      </span>
                    ))}
                </div>
              </TableCell>
              <TableCell
                className={entry.lateHours > 0 ? "text-red-500" : ""}
              >
                {entry.lateHours > 0 ? formatHours(entry.lateHours) : "-"}
              </TableCell>
              <TableCell>
                {entry.justifiedHours > 0
                  ? formatHours(entry.justifiedHours)
                  : "-"}
              </TableCell>
              <TableCell
                className={
                  entry.balance > 0
                    ? "text-green-500"
                    : entry.balance < 0
                    ? "text-red-500"
                    : ""
                }
              >
                {entry.balance > 0 ? "+" : ""}
                {formatHours(entry.balance)}
              </TableCell>
              <TableCell>
                {entry.justification
                  ? `${entry.justification.code} - ${entry.justification.description}`
                  : "-"}
              </TableCell>
              {showRawValues && (
                <TableCell className="text-xs">
                  {entry.rawValues ? (
                    <div className="flex flex-col gap-1">
                      <span>Jornada: {entry.rawValues.expectedHours}</span>
                      <span>Trabalhado: {entry.rawValues.hoursWorked}</span>
                      <span>Extra: {entry.rawValues.extraHours}</span>
                    </div>
                  ) : "-"}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
