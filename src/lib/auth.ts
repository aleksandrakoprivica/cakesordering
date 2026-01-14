import { supabase } from './supabase'

export type AppRole = 'guest' | 'user' | 'admin'

export type AppUser = {
  id: string
  email: string | null
  role: AppRole
}

type ProfileRow = {
  id: string
  role: AppRole | null
  first_name: string | null
  last_name: string | null
}

export type UserProfile = {
  id: string
  role: AppRole
  first_name: string | null
  last_name: string | null
}

/**
 * Fetch user profile from the `profiles` table.
 *
 * Expected table structure (to be created in Supabase):
 *   create table public.profiles (
 *     id uuid primary key references auth.users(id) on delete cascade,
 *     role text check (role in ('guest','user','admin')) default 'user',
 *     first_name text,
 *     last_name text
 *   );
 */
export async function fetchUserProfile(userId: string): Promise<AppRole> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .maybeSingle<ProfileRow>()

  if (error) {
    console.warn('fetchUserProfile error:', error.message)
    return 'user'
  }

  if (!data) {
    // No explicit profile row yet – treat as regular user.
    return 'user'
  }

  return data.role ?? 'user'
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, first_name, last_name')
    .eq('id', userId)
    .maybeSingle<ProfileRow>()

  if (error) {
    console.warn('getUserProfile error:', error.message)
    return {
      id: userId,
      role: 'user',
      first_name: null,
      last_name: null,
    }
  }

  if (!data) {
    return {
      id: userId,
      role: 'user',
      first_name: null,
      last_name: null,
    }
  }

  return {
    id: data.id,
    role: data.role ?? 'user',
    first_name: data.first_name,
    last_name: data.last_name,
  }
}

export async function upsertUserProfile(userId: string, fields: { first_name: string | null; last_name: string | null }) {
  const { error } = await supabase.from('profiles').upsert(
    {
      id: userId,
      ...fields,
    },
    {
      onConflict: 'id',
    }
  )

  if (error) {
    console.error('upsertUserProfile error:', error)
    throw error
  }
}

export async function signUpWithEmail(email: string, password: string) {
  console.log('Attempting sign up with email:', email)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    console.error('Supabase signUp error:', error)
    console.error('Error message:', error.message)
    console.error('Error status:', error.status)
    throw error
  }
  
  console.log('Sign up successful, user:', data.user?.id)
  return data
}

export async function signInWithEmail(email: string, password: string) {
  console.log('Attempting sign in with email:', email)
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Supabase signIn error:', error)
    console.error('Error message:', error.message)
    console.error('Error status:', error.status)
    throw error
  }
  
  console.log('Sign in successful, user:', data.user?.id)
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}


