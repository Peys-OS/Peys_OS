-- Add blockchain_payment_id column to payments table
ALTER TABLE public.payments
ADD COLUMN blockchain_payment_id TEXT;

-- Update existing payments to have empty string for blockchain_payment_id (or NULL)
UPDATE public.payments SET blockchain_payment_id = '' WHERE blockchain_payment_id IS NULL;

-- Make it NOT NULL after filling data (if needed, but allowing NULL for now might be safer)
-- ALTER TABLE public.payments ALTER COLUMN blockchain_payment_id SET NOT NULL;
