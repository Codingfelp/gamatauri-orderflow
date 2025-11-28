-- Create function to update timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create user_addresses table for multiple saved addresses
CREATE TABLE public.user_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

-- Users can view their own addresses
CREATE POLICY "Users can view their own addresses"
ON public.user_addresses
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own addresses
CREATE POLICY "Users can insert their own addresses"
ON public.user_addresses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own addresses
CREATE POLICY "Users can update their own addresses"
ON public.user_addresses
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own addresses
CREATE POLICY "Users can delete their own addresses"
ON public.user_addresses
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_addresses_updated_at
BEFORE UPDATE ON public.user_addresses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_user_addresses_user_id ON public.user_addresses(user_id);
CREATE INDEX idx_user_addresses_primary ON public.user_addresses(user_id, is_primary) WHERE is_primary = true;