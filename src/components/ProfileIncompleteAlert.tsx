import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ProfileIncompleteAlertProps {
  missingFields: string[];
}

export const ProfileIncompleteAlert = ({ missingFields }: ProfileIncompleteAlertProps) => {
  const navigate = useNavigate();

  if (missingFields.length === 0) return null;

  return (
    <Alert className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-0 mb-0 rounded-none shadow-sm">
      <AlertCircle className="h-4 w-4 text-indigo-600" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <span className="text-sm text-slate-700">
          Complete seu perfil para aproveitar <strong className="text-indigo-700">todas as funcionalidades</strong>
        </span>
        <Button
          variant="default"
          size="sm"
          onClick={() => navigate('/settings')}
          className="ml-4 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
        >
          Completar agora
        </Button>
      </AlertDescription>
    </Alert>
  );
};
