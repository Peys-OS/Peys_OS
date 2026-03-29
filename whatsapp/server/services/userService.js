/**
 * User Service for WhatsApp Bot
 * 
 * Handles user profile operations and authentication.
 * Uses ESM imports.
 */

import { createHash } from 'crypto';

/**
 * Get user by phone number
 */
export async function getUserByPhone(supabase, phoneNumber) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('phone_number', phoneNumber)
    .single();
  
  if (error || !data) return null;
  return data;
}

/**
 * Create a new user profile
 */
export async function createUser(supabase, phoneNumber, name, passcodeHash, walletAddress) {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      phone_number: phoneNumber,
      passcode_hash: passcodeHash,
      name: name,
      wallet_address: walletAddress
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Update user balance
 */
export async function updateUserBalance(supabase, phoneNumber, newBalance) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ balance: newBalance })
    .eq('phone_number', phoneNumber)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Create transaction record
 */
export async function createTransactionRecord(supabase, transactionData) {
  const { data, error } = await supabase
    .from('transactions')
    .insert(transactionData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Verify PIN against stored hash
 * Note: For WhatsApp bot, we use PBKDF2 from databaseService
 * This is kept for compatibility with existing code
 */
export async function verifyPin(supabase, phoneNumber, pin) {
  const user = await getUserByPhone(supabase, phoneNumber);
  if (!user || !user.passcode_hash) return false;
  
  // Check if hash is in PBKDF2 format (salt:hash)
  if (user.passcode_hash.includes(':')) {
    // Use PBKDF2 verification from databaseService
    const { verifyPasscode } = await import('./databaseService.js');
    return await verifyPasscode(pin, user.passcode_hash);
  }
  
  // Fallback to bcrypt comparison (if old format)
  // Note: bcrypt is not included, so we'll use SHA256 as fallback
  const hash = createHash('sha256').update(pin).digest('hex');
  return hash === user.passcode_hash;
}

export default {
  getUserByPhone,
  createUser,
  updateUserBalance,
  createTransaction: createTransactionRecord,
  verifyPin
};
