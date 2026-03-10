-- Fix sender_user_id to allow null values (forced)
ALTER TABLE public.payments ALTER COLUMN sender_user_id DROP NOT NULL;
