import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AddressIncompleteAlertProps {
  reason: string;
}

export const AddressIncompleteAlert = ({ reason }: AddressIncompleteAlertProps) => {
  const navigate = useNavigate();
  
  return (
    <Alert className="bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 mb-0 rounded-none animate-in slide-in-from-top duration-500">
      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <span className="text-sm text-red-700 dark:text-red-300 flex-1">
          <strong>⚠️ Endereço incompleto:</strong> {reason}. Corrija seu endereço para fazer pedidos.
        </span>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => navigate('/addresses')}
          className="shrink-0"
        >
          Corrigir agora
        </Button>
      </AlertDescription>
    </Alert>
  );
};
