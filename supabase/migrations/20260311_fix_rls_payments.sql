-- Fix RLS policy for payments table to allow public inserts
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can create payments" ON public.payments;

-- Create a more permissive insert policy
CREATE POLICY "Anyone can create payments" ON public.payments
FOR INSERT WITH CHECK (true);

-- Also make sure select is public
DROP POLICY IF EXISTS "Anyone can view payments" ON public.payments;
CREATE POLICY "Anyone can view payments" ON public.payments FOR SELECT USING (true);

-- Make updates also public for pending payments
DROP POLICY IF EXISTS "Recipients can claim payments" ON public.payments;
CREATE POLICY "Anyone can update pending payments" ON public.payments 
FOR UPDATE USING (status = 'pending');
