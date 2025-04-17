
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmployeeData } from "@/lib/types";

interface EmployeeSelectorProps {
  employees: EmployeeData[];
  selectedId: string | null;
  onSelect: (employeeId: string) => void;
  includeAll?: boolean;
}

export function EmployeeSelector({
  employees,
  selectedId,
  onSelect,
  includeAll = false,
}: EmployeeSelectorProps) {
  // Group employees by department
  const departments = Array.from(
    new Set(employees.map((emp) => emp.department))
  ).sort();

  const handleValueChange = (value: string) => {
    onSelect(value);
  };

  return (
    <Select value={selectedId || ""} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Selecione um funcionário" />
      </SelectTrigger>
      <SelectContent>
        {includeAll && (
          <SelectItem value="all">Todos os Funcionários</SelectItem>
        )}
        {departments.map((dept) => (
          <SelectGroup key={dept}>
            <SelectLabel>{dept}</SelectLabel>
            {employees
              .filter((emp) => emp.department === dept)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.name}
                </SelectItem>
              ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
