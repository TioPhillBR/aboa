import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function CadastroIndex() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    // Preserve query params (like referral code) when redirecting
    const queryString = searchParams.toString();
    const redirectUrl = queryString 
      ? `/cadastro/dados-pessoais?${queryString}` 
      : '/cadastro/dados-pessoais';
    
    navigate(redirectUrl, { replace: true });
  }, [navigate, searchParams]);

  return null;
}
