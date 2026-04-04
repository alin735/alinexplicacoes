import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './config';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(config.supabaseUrl, config.supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseInstance;
}

export interface DiscordSession {
  id: string;
  discord_user_id: string;
  profile_id: string;
  created_at: string;
  expires_at: string;
}

export interface MagicLinkToken {
  id: string;
  discord_user_id: string;
  token: string;
  email: string;
  created_at: string;
  expires_at: string;
  used: boolean;
}

// Create session table and magic link table if they don't exist
export async function initDatabase() {
  const supabase = getSupabase();
  
  // Check if discord_sessions table exists, create if not
  const { error: sessionTableError } = await supabase.rpc('create_discord_tables');
  
  if (sessionTableError && !sessionTableError.message.includes('already exists')) {
    console.log('Discord tables may need to be created manually. Run the SQL in discord-bot/schema.sql');
  }
}

// Get profile by Discord user ID (via session)
export async function getProfileByDiscordId(discordUserId: string) {
  const supabase = getSupabase();
  
  const { data: session } = await supabase
    .from('discord_sessions')
    .select('profile_id')
    .eq('discord_user_id', discordUserId)
    .gt('expires_at', new Date().toISOString())
    .single();
  
  if (!session) return null;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.profile_id)
    .single();
  
  return profile;
}

// Create a new user via Supabase Auth
export async function createUser(data: {
  email: string;
  password: string;
  fullName: string;
  username: string;
  newsletterOptIn: boolean;
  discordUserId: string;
}) {
  const supabase = getSupabase();
  
  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      full_name: data.fullName,
      username: data.username,
      newsletter_opt_in: data.newsletterOptIn,
      terms_accepted: true,
      terms_accepted_at: new Date().toISOString(),
      terms_version: 'v1',
    },
  });
  
  if (authError) {
    throw new Error(authError.message);
  }
  
  if (!authData.user) {
    throw new Error('Falha ao criar utilizador');
  }
  
  // Create Discord session
  const sessionExpiry = new Date();
  sessionExpiry.setDate(sessionExpiry.getDate() + 30); // 30 days
  
  await supabase.from('discord_sessions').insert({
    discord_user_id: data.discordUserId,
    profile_id: authData.user.id,
    expires_at: sessionExpiry.toISOString(),
  });
  
  // Update profile with discord_user_id
  await supabase
    .from('profiles')
    .update({ discord_user_id: data.discordUserId })
    .eq('id', authData.user.id);
  
  return authData.user;
}

// Create magic link for login
export async function createMagicLink(email: string, discordUserId: string): Promise<string | null> {
  const supabase = getSupabase();
  
  // Check if email exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email')
    .ilike('email', email)
    .single();
  
  if (!profile) {
    return null;
  }
  
  // Generate random token
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes
  
  // Store magic link
  await supabase.from('discord_magic_links').insert({
    discord_user_id: discordUserId,
    token,
    email: email.toLowerCase(),
    profile_id: profile.id,
    expires_at: expiresAt.toISOString(),
    used: false,
  });
  
  return token;
}

// Verify magic link token
export async function verifyMagicLink(token: string, discordUserId: string): Promise<boolean> {
  const supabase = getSupabase();
  
  const { data: magicLink } = await supabase
    .from('discord_magic_links')
    .select('*')
    .eq('token', token)
    .eq('discord_user_id', discordUserId)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .single();
  
  if (!magicLink) return false;
  
  // Mark as used
  await supabase
    .from('discord_magic_links')
    .update({ used: true })
    .eq('id', magicLink.id);
  
  // Create session
  const sessionExpiry = new Date();
  sessionExpiry.setDate(sessionExpiry.getDate() + 30);
  
  // Remove old sessions for this discord user
  await supabase
    .from('discord_sessions')
    .delete()
    .eq('discord_user_id', discordUserId);
  
  await supabase.from('discord_sessions').insert({
    discord_user_id: discordUserId,
    profile_id: magicLink.profile_id,
    expires_at: sessionExpiry.toISOString(),
  });
  
  // Update profile with discord_user_id
  await supabase
    .from('profiles')
    .update({ discord_user_id: discordUserId })
    .eq('id', magicLink.profile_id);
  
  return true;
}

// Get available slots for a date
export async function getAvailableSlots(date: string) {
  const supabase = getSupabase();
  
  const { data: slots } = await supabase
    .from('available_slots')
    .select('*')
    .eq('date', date)
    .eq('is_booked', false)
    .order('start_time', { ascending: true });
  
  return slots || [];
}

// Get available dates (days with slots)
export async function getAvailableDates(): Promise<string[]> {
  const supabase = getSupabase();
  
  const today = new Date().toISOString().split('T')[0];
  
  const { data: slots } = await supabase
    .from('available_slots')
    .select('date')
    .eq('is_booked', false)
    .gte('date', today)
    .order('date', { ascending: true });
  
  if (!slots) return [];
  
  // Get unique dates
  const dates = [...new Set(slots.map(s => s.date))];
  return dates;
}

// Create a booking
export async function createBooking(data: {
  profileId: string;
  subject: string;
  date: string;
  timeSlot: string;
  slotId: string;
  observations: string;
  paymentMethod: 'online' | 'in_person';
  price: number;
}) {
  const supabase = getSupabase();
  
  // Mark slot as booked
  const { error: slotError } = await supabase
    .from('available_slots')
    .update({ is_booked: true })
    .eq('id', data.slotId);
  
  if (slotError) {
    throw new Error('Horário já não está disponível');
  }
  
  // Create booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      student_id: data.profileId,
      subject: data.subject,
      date: data.date,
      time_slot: data.timeSlot,
      observations: data.observations,
      status: 'pending',
      payment_method: data.paymentMethod,
      payment_status: data.paymentMethod === 'in_person' ? 'pending_payment' : 'pending_payment',
      price: data.price,
    })
    .select()
    .single();
  
  if (bookingError) {
    // Revert slot
    await supabase
      .from('available_slots')
      .update({ is_booked: false })
      .eq('id', data.slotId);
    throw new Error('Falha ao criar marcação');
  }
  
  return booking;
}

// Logout (remove session)
export async function logout(discordUserId: string) {
  const supabase = getSupabase();
  
  await supabase
    .from('discord_sessions')
    .delete()
    .eq('discord_user_id', discordUserId);
}

// Helper to generate random token
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
