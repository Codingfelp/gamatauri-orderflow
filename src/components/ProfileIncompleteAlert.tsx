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
    <Alert className="bg-yellow-50 border-yellow-200 mb-0 rounded-none border-x-0 border-t-0">
      <AlertCircle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-sm text-yellow-800">
          <strong>Complete seu perfil</strong> para aproveitar todas as funcionalidades
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/settings')}
          className="ml-4 border-yellow-300 hover:bg-yellow-100"
        >
          Completar agora
        </Button>
      </AlertDescription>
    </Alert>
  );
};
