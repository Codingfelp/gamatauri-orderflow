import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Download, FileJson, FileSpreadsheet, Loader2, CheckCircle2, XCircle, Database } from "lucide-react";

const ALL_TABLES = [
  "products",
  "orders",
  "order_items",
  "profiles",
  "user_addresses",
  "user_roles",
  "user_recommendations",
  "product_promotions",
  "product_bundles",
  "product_custom_colors",
  "coupons",
  "coupon_usage",
  "push_subscriptions",
  "store_settings",
] as const;

type TableName = typeof ALL_TABLES[number];

interface TableResult {
  table: string;
  rows: any[];
  count: number;
  status: "pending" | "loading" | "done" | "error";
  error?: string;
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h];
      const str = val === null ? "" : typeof val === "object" ? JSON.stringify(val) : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DataExport() {
  const [results, setResults] = useState<TableResult[]>(
    ALL_TABLES.map(t => ({ table: t, rows: [], count: 0, status: "pending" }))
  );
  const [exporting, setExporting] = useState(false);
  const [currentTable, setCurrentTable] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const exportAll = useCallback(async () => {
    setExporting(true);
    setProgress(0);

    const newResults: TableResult[] = ALL_TABLES.map(t => ({
      table: t, rows: [], count: 0, status: "pending",
    }));
    setResults([...newResults]);

    for (let i = 0; i < ALL_TABLES.length; i++) {
      const tableName = ALL_TABLES[i];
      setCurrentTable(tableName);
      newResults[i].status = "loading";
      setResults([...newResults]);

      try {
        const { data, error } = await (supabase.from(tableName) as any).select("*").limit(10000);
        if (error) throw error;
        newResults[i] = { table: tableName, rows: data || [], count: data?.length || 0, status: "done" };
      } catch (err: any) {
        newResults[i] = { table: tableName, rows: [], count: 0, status: "error", error: err.message };
      }

      setResults([...newResults]);
      setProgress(((i + 1) / ALL_TABLES.length) * 100);
    }

    setCurrentTable(null);
    setExporting(false);
  }, []);

  const downloadJSON = () => {
    const data: Record<string, any[]> = {};
    results.forEach(r => { if (r.status === "done") data[r.table] = r.rows; });
    const payload = { exported_at: new Date().toISOString(), tables: Object.keys(data).length, data };
    downloadFile(JSON.stringify(payload, null, 2), `database-export-${new Date().toISOString().slice(0,10)}.json`, "application/json");
  };

  const downloadCSV = (table: string) => {
    const r = results.find(r => r.table === table);
    if (!r || r.rows.length === 0) return;
    downloadFile(convertToCSV(r.rows), `${table}-${new Date().toISOString().slice(0,10)}.csv`, "text/csv");
  };

  const totalRows = results.reduce((s, r) => s + r.count, 0);
  const doneTables = results.filter(r => r.status === "done").length;
  const hasData = doneTables > 0;

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Exportação de Dados
          </CardTitle>
          <CardDescription>
            Exporte todas as tabelas do banco de dados em JSON ou CSV. Total de {ALL_TABLES.length} tabelas disponíveis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button onClick={exportAll} disabled={exporting} size="lg">
              {exporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {exporting ? "Exportando..." : "Exportar Todas as Tabelas"}
            </Button>

            {hasData && (
              <Button onClick={downloadJSON} variant="outline" size="lg">
                <FileJson className="mr-2 h-4 w-4" />
                Download JSON Consolidado
              </Button>
            )}
          </div>

          {exporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progresso: {doneTables}/{ALL_TABLES.length} tabelas</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
              {currentTable && (
                <p className="text-sm text-muted-foreground animate-pulse">
                  Exportando: <strong>{currentTable}</strong>...
                </p>
              )}
            </div>
          )}

          {hasData && (
            <p className="text-sm text-muted-foreground">
              ✅ {doneTables} tabelas exportadas • {totalRows.toLocaleString()} registros no total
            </p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-2">
        {results.map(r => (
          <Card key={r.table} className={r.status === "error" ? "border-destructive/50" : ""}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {r.status === "pending" && <div className="h-4 w-4 rounded-full bg-muted" />}
                {r.status === "loading" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                {r.status === "done" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                {r.status === "error" && <XCircle className="h-4 w-4 text-destructive" />}
                <div>
                  <span className="font-mono text-sm font-medium">{r.table}</span>
                  {r.status === "done" && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({r.count.toLocaleString()} registros)
                    </span>
                  )}
                  {r.status === "error" && (
                    <p className="text-xs text-destructive">{r.error}</p>
                  )}
                </div>
              </div>
              {r.status === "done" && r.count > 0 && (
                <Button variant="ghost" size="sm" onClick={() => downloadCSV(r.table)}>
                  <FileSpreadsheet className="mr-1 h-3 w-3" />
                  CSV
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4 text-xs text-muted-foreground space-y-1">
          <p><strong>⚠️ Limitações:</strong></p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Máximo de 10.000 registros por tabela</li>
            <li>Dados sujeitos a políticas RLS (apenas dados visíveis ao usuário logado)</li>
            <li>Secrets, storage e auth users não são exportáveis por esta página</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
