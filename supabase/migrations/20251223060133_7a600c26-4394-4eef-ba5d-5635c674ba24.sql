-- Fix linter WARN: set immutable search_path for validate_coupon
ALTER FUNCTION public.validate_coupon(text, uuid, numeric) SET search_path = public;