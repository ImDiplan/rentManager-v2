export interface Property {
  id: string;
  name: string;
  address: string;
  rooms: number;
  monthly_rent: number;
  currency: 'RD$' | 'USD';
  status: 'Disponible' | 'Ocupado';
  payment_day: number | null;
  next_payment_date: string | null;
  payment_status: 'Pagado' | 'Pendiente' | 'Atrasado' | null;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  property_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  contract_start: string | null;
  contract_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface Guarantor {
  id: string;
  property_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  property_id: string | null;
  type: 'CEDULA' | 'CARTA_TRABAJO' | 'DATA_CREDITO' | 'MOVIMIENTOS_BANCARIOS' | 'CONTRATO' | 'OTROS';
  file_url: string;
  file_name: string | null;
  document_owner: 'tenant' | 'guarantor';
  created_at: string;
}

export interface PropertyWithTenant extends Property {
  tenant?: Tenant | null;
  guarantor?: Guarantor | null;
  documents?: Document[];
}

export const DOCUMENT_TYPES = [
  { value: 'CEDULA', label: 'Cédula' },
  { value: 'CARTA_TRABAJO', label: 'Carta de Trabajo' },
  { value: 'DATA_CREDITO', label: 'Data Crédito' },
  { value: 'MOVIMIENTOS_BANCARIOS', label: 'Movimientos Bancarios' },
  { value: 'CONTRATO', label: 'Contrato' },
  { value: 'OTROS', label: 'Otros' },
] as const;
