-- Add currency column to properties table
ALTER TABLE public.properties 
ADD COLUMN currency TEXT NOT NULL DEFAULT 'RD$' 
CHECK (currency IN ('RD$', 'USD'));

-- Create index for faster queries
CREATE INDEX idx_properties_currency ON public.properties(currency);
