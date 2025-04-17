
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { FileSpreadsheet, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { ExcelTimeSheetData, EmployeeTimeData, ImportResult } from "@/lib/types";
import { parseExcelTimesheet } from "@/lib/excelParser";

interface ExcelImporterProps {
  onImport: (data: EmployeeTimeData) => void;
  disabled?: boolean;
}

export function ExcelImporter({ onImport, disabled = false }: ExcelImporterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      // Lê o arquivo Excel
      const data = await readExcelFile(file);
      
      // Processa os dados do Excel para o formato do dashboard
      const result = parseExcelTimesheet(data, file.name);
      
      if (result.success && result.data) {
        onImport(result.data);
        toast({
          title: "Arquivo importado com sucesso",
          description: `Dados de ${result.data.name} foram carregados.`,
        });
        setOpen(false);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Erro ao importar arquivo:", error);
      toast({
        variant: "destructive",
        title: "Erro ao importar arquivo",
        description: error instanceof Error ? error.message : "Formato de arquivo inválido",
      });
    } finally {
      setIsLoading(false);
      // Limpa o input do arquivo para permitir selecionar o mesmo arquivo novamente
      event.target.value = "";
    }
  };

  const readExcelFile = (file: File): Promise<ExcelTimeSheetData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          
          // Assume que a primeira planilha contém os dados
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          
          // Converte para JSON de forma bruta
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Aqui convertemos os dados brutos para o formato ExcelTimeSheetData
          // Esta conversão será feita em lib/excelParser.ts
          resolve(jsonData as unknown as ExcelTimeSheetData);
        } catch (error) {
          reject(new Error("Erro ao processar arquivo Excel"));
        }
      };
      
      reader.onerror = () => reject(new Error("Erro ao ler o arquivo"));
      
      reader.readAsArrayBuffer(file);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2" 
          disabled={disabled || isLoading}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Importar Planilha
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Importar Planilha de Ponto</DialogTitle>
          <DialogDescription>
            Importe planilhas de ponto no formato Excel (.xlsx)
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Selecionar arquivo</CardTitle>
              <CardDescription>
                Selecione a planilha de ponto para importar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="excel-file">Arquivo Excel (.xlsx)</Label>
                <Input
                  id="excel-file"
                  type="file"
                  accept=".xlsx"
                  disabled={isLoading}
                  onChange={handleFileUpload}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start pt-0">
              <p className="text-xs text-muted-foreground">
                Formato esperado: Planilha de Ponto Digital - Nome.xlsx
              </p>
            </CardFooter>
          </Card>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
