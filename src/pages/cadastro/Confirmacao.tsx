import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Gift, Loader2 } from 'lucide-react';
import { useRegistration } from '@/contexts/RegistrationContext';

export default function Confirmacao() {
  const navigate = useNavigate();
  const { bonusMessage, resetRegistration } = useRegistration();

  useEffect(() => {
    // Redirect to home after 3 seconds
    const timeout = setTimeout(() => {
      resetRegistration();
      navigate('/');
    }, 3000);

    return () => clearTimeout(timeout);
  }, [navigate, resetRegistration]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-green-500/10">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Conta criada com sucesso!</CardTitle>
          <CardDescription>
            Você será redirecionado para a página inicial...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {bonusMessage && (
            <Alert className="bg-green-500/10 border-green-500/30">
              <Gift className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-600 dark:text-green-400 font-medium">
                🎉 {bonusMessage}
              </AlertDescription>
            </Alert>
          )}
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
