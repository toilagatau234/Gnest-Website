-- Add name_template column to product_spec_templates
-- Stores a {field_key} interpolation string for auto-generating product names.
-- Example: "{container_type} {capacity_ml}ml Phi {neck_diameter_mm}"
ALTER TABLE public.product_spec_templates
  ADD COLUMN IF NOT EXISTS name_template text;
