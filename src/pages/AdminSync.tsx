import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function AdminSync() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const executeSync = async () => {
    try {
      setLoading(true);
      setResult(null);
      
      console.log('Calling admin-sync function...');
      
      const { data, error } = await supabase.functions.invoke('admin-sync', {
        method: 'POST',
      });

      if (error) {
        console.error('Error calling admin-sync:', error);
        toast.error(`Erro: ${error.message}`);
        return;
      }

      console.log('Sync result:', data);
      setResult(data);
      
      if (data.success) {
        toast.success(`Sync concluído! ${data.stats.images_added} imagens adicionadas`);
      } else {
        toast.error(`Erro no sync: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Exception calling admin-sync:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Sincronização de Produtos</CardTitle>
          <CardDescription>
            Executa sync com a API externa para atualizar produtos e imagens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={executeSync} 
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Sincronizando...' : 'Executar Sync'}
          </Button>

          {result && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Resultado:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
