-- Create properties table
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  rooms INTEGER NOT NULL DEFAULT 1,
  monthly_rent DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'Disponible' CHECK (status IN ('Disponible', 'Ocupado')),
  payment_day INTEGER CHECK (payment_day >= 1 AND payment_day <= 31),
  next_payment_date DATE,
  payment_status TEXT DEFAULT 'Pendiente' CHECK (payment_status IN ('Pagado', 'Pendiente', 'Atrasado')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tenants table
CREATE TABLE public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  contract_start DATE,
  contract_end DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('CEDULA', 'CARTA_TRABAJO', 'DATA_CREDITO', 'MOVIMIENTOS_BANCARIOS', 'CONTRATO', 'OTROS')),
  file_url TEXT NOT NULL,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for this demo - can be changed to user-specific later)
CREATE POLICY "Allow all operations on properties" ON public.properties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on tenants" ON public.tenants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on documents" ON public.documents FOR ALL USING (true) WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at
BEFORE UPDATE ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);

-- Create storage policies
CREATE POLICY "Allow public read access on documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
CREATE POLICY "Allow public upload on documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Allow public update on documents" ON storage.objects FOR UPDATE USING (bucket_id = 'documents');
CREATE POLICY "Allow public delete on documents" ON storage.objects FOR DELETE USING (bucket_id = 'documents');