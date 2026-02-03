import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// CPF validation function
export function validateCPF(cpf: string): boolean {
  const cpfClean = cpf.replace(/[^\d]/g, '');
  
  if (cpfClean.length !== 11) return false;
  
  // Check for known invalid CPFs (all same digits)
  if (/^(\d)\1{10}$/.test(cpfClean)) return false;
  
  // Calculate first verification digit
  let sum1 = 0;
  for (let i = 0; i < 9; i++) {
    sum1 += parseInt(cpfClean[i]) * (10 - i);
  }
  let digit1 = 11 - (sum1 % 11);
  if (digit1 >= 10) digit1 = 0;
  
  // Calculate second verification digit
  let sum2 = 0;
  for (let i = 0; i < 10; i++) {
    sum2 += parseInt(cpfClean[i]) * (11 - i);
  }
  let digit2 = 11 - (sum2 % 11);
  if (digit2 >= 10) digit2 = 0;
  
  return cpfClean[9] === digit1.toString() && cpfClean[10] === digit2.toString();
}

// Mask functions
export function maskCPF(value: string): string {
  const numbers = value.replace(/[^\d]/g, '').slice(0, 11);
  return numbers
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function maskPhone(value: string): string {
  const numbers = value.replace(/[^\d]/g, '').slice(0, 11);
  if (numbers.length <= 10) {
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return numbers
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

export function maskCEP(value: string): string {
  const numbers = value.replace(/[^\d]/g, '').slice(0, 8);
  return numbers.replace(/(\d{5})(\d)/, '$1-$2');
}

export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export interface PersonalData {
  fullName: string;
  whatsapp: string;
  cpf: string;
  birthDate: string;
  email: string;
  password: string;
  confirmPassword: string;
  avatarFile: File | null;
  avatarPreview: string | null;
}

export interface AddressData {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  lgpdConsent: boolean;
}

interface RegistrationContextType {
  // Personal data
  personalData: PersonalData;
  setPersonalData: (data: Partial<PersonalData>) => void;
  
  // Address data
  addressData: AddressData;
  setAddressData: (data: Partial<AddressData>) => void;
  
  // Referral
  referralCode: string | null;
  
  // Registration result
  bonusMessage: string | null;
  setBonusMessage: (message: string | null) => void;
  
  // Reset
  resetRegistration: () => void;
  
  // Step completion status
  isPersonalDataComplete: boolean;
}

const defaultPersonalData: PersonalData = {
  fullName: '',
  whatsapp: '',
  cpf: '',
  birthDate: '',
  email: '',
  password: '',
  confirmPassword: '',
  avatarFile: null,
  avatarPreview: null,
};

const defaultAddressData: AddressData = {
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  lgpdConsent: false,
};

const RegistrationContext = createContext<RegistrationContextType | null>(null);

export function RegistrationProvider({ children }: { children: ReactNode }) {
  const [searchParams] = useSearchParams();
  const referralCodeFromUrl = searchParams.get('ref');
  
  const [personalData, setPersonalDataState] = useState<PersonalData>(defaultPersonalData);
  const [addressData, setAddressDataState] = useState<AddressData>(defaultAddressData);
  const [bonusMessage, setBonusMessage] = useState<string | null>(null);
  
  // Store referral code in localStorage
  useEffect(() => {
    if (referralCodeFromUrl) {
      localStorage.setItem('pending_referral_code', referralCodeFromUrl.toUpperCase());
    }
  }, [referralCodeFromUrl]);
  
  const referralCode = referralCodeFromUrl || localStorage.getItem('pending_referral_code');
  
  const setPersonalData = (data: Partial<PersonalData>) => {
    setPersonalDataState(prev => ({ ...prev, ...data }));
  };
  
  const setAddressData = (data: Partial<AddressData>) => {
    setAddressDataState(prev => ({ ...prev, ...data }));
  };
  
  const resetRegistration = () => {
    setPersonalDataState(defaultPersonalData);
    setAddressDataState(defaultAddressData);
    setBonusMessage(null);
  };
  
  // Check if personal data step is complete
  const isPersonalDataComplete = Boolean(
    personalData.fullName &&
    personalData.whatsapp &&
    personalData.cpf &&
    personalData.birthDate &&
    personalData.email &&
    personalData.password &&
    personalData.confirmPassword
  );
  
  return (
    <RegistrationContext.Provider value={{
      personalData,
      setPersonalData,
      addressData,
      setAddressData,
      referralCode,
      bonusMessage,
      setBonusMessage,
      resetRegistration,
      isPersonalDataComplete,
    }}>
      {children}
    </RegistrationContext.Provider>
  );
}

export function useRegistration() {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
}
