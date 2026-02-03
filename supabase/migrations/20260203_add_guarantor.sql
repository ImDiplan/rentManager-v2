-- Create guarantors table
CREATE TABLE public.guarantors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add document_owner column to documents table to distinguish between tenant and guarantor documents
ALTER TABLE public.documents ADD COLUMN document_owner TEXT DEFAULT 'tenant' CHECK (document_owner IN ('tenant', 'guarantor'));

-- Enable Row Level Security for guarantors
ALTER TABLE public.guarantors ENABLE ROW LEVEL SECURITY;

-- Create policy for public access to guarantors
CREATE POLICY "Allow all operations on guarantors" ON public.guarantors FOR ALL USING (true) WITH CHECK (true);

-- Create trigger for automatic timestamp updates on guarantors
CREATE TRIGGER update_guarantors_updated_at
BEFORE UPDATE ON public.guarantors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
