-- Create promotions table to store product promotions from external system
CREATE TABLE public.product_promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL,
  promotional_price NUMERIC NOT NULL,
  original_price NUMERIC NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_promotions ENABLE ROW LEVEL SECURITY;

-- Allow public read access (promotions are visible to everyone)
CREATE POLICY "Promotions are viewable by everyone" 
ON public.product_promotions 
FOR SELECT 
USING (true);

-- Create index for efficient queries
CREATE INDEX idx_product_promotions_product_id ON public.product_promotions(product_id);
CREATE INDEX idx_product_promotions_dates ON public.product_promotions(start_date, end_date);
CREATE INDEX idx_product_promotions_active ON public.product_promotions(is_active, start_date, end_date);

-- Add trigger for updated_at
CREATE TRIGGER update_product_promotions_updated_at
BEFORE UPDATE ON public.product_promotions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for promotions
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_promotions;

-- Add delivery_type column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT 'delivery';