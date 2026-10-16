import { supabase } from './supabase.js';

// All email goes through the `send-email` Supabase Edge Function, which holds
// the Resend API key server-side. Failures here never block the user's action.
export async function sendEmail(payload) {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', { body: payload });
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Email not sent:', err?.message || err);
    return { ok: false, error: err?.message || String(err) };
  }
}
