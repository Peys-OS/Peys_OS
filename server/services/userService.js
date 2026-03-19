const bcrypt = require('bcrypt');
const { supabase } = require('./utils/supabase');

async function getUserByPhone(phoneNumber) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('phone_number', phoneNumber)
    .single();
  
  if (error || !data) return null;
  return data;
}

async function createUser(phoneNumber, name, pinHash, walletAddress) {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      phone_number: phoneNumber,
      passcode_hash: pinHash,
      name: name,
      wallet_address: walletAddress
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

async function updateUserBalance(phoneNumber, newBalance) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ balance: newBalance })
    .eq('phone_number', phoneNumber)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

async function createTransaction(data) {
  const { result, error } = await supabase
    .from('transactions')
    .insert(data)
    .select()
    .single();
  
  if (error) throw error;
  return result;
}

async function verifyPin(phoneNumber, pin) {
  const user = await getUserByPhone(phoneNumber);
  if (!user) return false;
  return bcrypt.compare(pin, user.passcode_hash);
}

module.exports = {
  getUserByPhone,
  createUser,
  updateUserBalance,
  createTransaction,
  verifyPin
};
