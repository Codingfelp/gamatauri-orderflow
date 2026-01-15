-- Create table for storing custom product colors
CREATE TABLE public.product_custom_colors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name TEXT NOT NULL,
  category TEXT,
  card_bg_color TEXT,
  card_text_color TEXT,
  modal_bg_color TEXT,
  modal_text_color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_name, category)
);

-- Enable RLS
ALTER TABLE public.product_custom_colors ENABLE ROW LEVEL SECURITY;

-- Allow public read access for all users to display colors
CREATE POLICY "Anyone can view custom colors" 
ON public.product_custom_colors 
FOR SELECT 
USING (true);

-- Only admins can modify colors
CREATE POLICY "Admins can insert colors" 
ON public.product_custom_colors 
FOR INSERT 
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update colors" 
ON public.product_custom_colors 
FOR UPDATE 
USING (public.is_admin());

CREATE POLICY "Admins can delete colors" 
ON public.product_custom_colors 
FOR DELETE 
USING (public.is_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_product_custom_colors_updated_at
BEFORE UPDATE ON public.product_custom_colors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_custom_colors;