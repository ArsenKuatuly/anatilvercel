const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function isConfigured() {
  return Boolean(url && anonKey);
}

function isAdminConfigured() {
  return Boolean(url && serviceRoleKey);
}

function getAnonClient() {
  if (!isConfigured()) {
    throw new Error('Supabase auth is not configured');
  }

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getAdminClient() {
  if (!isAdminConfigured()) {
    throw new Error('Supabase admin is not configured');
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function signInWithPassword(email, password) {
  const client = getAnonClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function createAuthUser({ email, password, emailConfirm = true }) {
  const client = getAdminClient();
  const { data, error } = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: emailConfirm,
  });
  if (error) throw error;
  return data.user;
}

async function deleteAuthUser(userId) {
  if (!userId) return;
  const client = getAdminClient();
  const { error } = await client.auth.admin.deleteUser(userId);
  if (error) throw error;
}

async function sendPasswordReset(email, redirectTo) {
  const client = getAnonClient();
  const { data, error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  if (error) throw error;
  return data;
}

module.exports = {
  isConfigured,
  isAdminConfigured,
  url,
  anonKey,
  signInWithPassword,
  createAuthUser,
  deleteAuthUser,
  sendPasswordReset,
};
