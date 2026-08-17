-- Add x and y coordinates to the existing photo_tags table
ALTER TABLE public.photo_tags ADD COLUMN IF NOT EXISTS x float NOT NULL DEFAULT 50.0;
ALTER TABLE public.photo_tags ADD COLUMN IF NOT EXISTS y float NOT NULL DEFAULT 50.0;
