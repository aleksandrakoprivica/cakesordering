import { supabase } from './supabase'
import type { AppRole } from './auth'

export type { AppRole }

export type AdminUser = {
  id: string
  email: string | null
  role: AppRole
  first_name: string | null
  last_name: string | null
  created_at: string
  order_count: number
}

// Note: Email is stored in auth.users which we can't directly query
// We'll need to use a database function or store email in profiles table

/**
 * Fetch all users (admin only)
 * Uses RPC function if available, otherwise falls back to profiles table
 */
export async function fetchAllUsers(): Promise<AdminUser[]> {
  try {
    // Try to use RPC function first (if it exists)
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_users_with_emails')

    if (!rpcError && rpcData) {
      return rpcData.map((user: any) => ({
        id: user.id,
        email: user.email,
        role: (user.role ?? 'user') as AppRole,
        first_name: user.first_name,
        last_name: user.last_name,
        created_at: user.created_at || new Date().toISOString(),
        order_count: Number(user.order_count) || 0,
      }))
    }

    // Fallback: Get profiles with emails (if stored in profiles table)
    console.warn('RPC function not available, using fallback method')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, role, first_name, last_name, email')
      .order('id', { ascending: false })

    if (profilesError) {
      console.error('fetchAllUsers profiles error:', profilesError)
      throw profilesError
    }

    if (!profiles || profiles.length === 0) {
      return []
    }

    // Get user IDs
    const userIds = profiles.map((p) => p.id)

    // Get order counts for each user
    const orderCounts: Record<string, number> = {}
    if (userIds.length > 0) {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('user_id')
        .in('user_id', userIds)

      if (!ordersError && ordersData) {
        ordersData.forEach((order: any) => {
          orderCounts[order.user_id] = (orderCounts[order.user_id] || 0) + 1
        })
      }
    }

    return profiles.map((profile: any) => ({
      id: profile.id,
      email: profile.email || null, // Get email from profiles table
      role: (profile.role ?? 'user') as AppRole,
      first_name: profile.first_name,
      last_name: profile.last_name,
      created_at: new Date().toISOString(), // Use current date as fallback
      order_count: orderCounts[profile.id] || 0,
    }))
  } catch (error: any) {
    console.error('fetchAllUsers error:', error)
    throw error
  }
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(userId: string, newRole: AppRole): Promise<void> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) {
      console.error('updateUserRole error:', error)
      throw new Error(error.message || 'Failed to update user role')
    }
  } catch (error: any) {
    console.error('updateUserRole error:', error)
    throw error
  }
}

/**
 * Delete user account (admin only)
 * Uses Edge Function if available, otherwise falls back to deleting from profiles
 */
export async function deleteUser(userId: string): Promise<void> {
  try {
    // Try to use Edge Function first (if available and configured)
    const API_URL = process.env.EXPO_PUBLIC_API_URL?.trim()
    const isSupabaseUrl = API_URL?.includes('supabase.co/functions/v1')
    
    if (isSupabaseUrl) {
      try {
        const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
        if (!supabaseKey) {
          throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY is not set')
        }

        const endpoint = `${API_URL}/delete-user`
        const { data: session } = await supabase.auth.getSession()
        
        if (!session?.session?.access_token) {
          throw new Error('No active session')
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session.access_token}`,
            'apikey': supabaseKey,
          },
          body: JSON.stringify({ userId }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Failed to delete user: ${response.statusText}`)
        }

        return // Successfully deleted via Edge Function
      } catch (edgeError: any) {
        console.warn('Edge Function delete failed, trying direct delete:', edgeError)
        // Fall through to direct delete
      }
    }

    // Fallback: Delete from profiles directly
    // Note: This requires RLS policy to allow admin deletion
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (error) {
      console.error('deleteUser error:', error)
      throw new Error(error.message || 'Failed to delete user profile. Check RLS policies.')
    }
  } catch (error: any) {
    console.error('deleteUser error:', error)
    throw error
  }
}

/**
 * Update user profile information (admin only)
 */
export async function updateUserProfile(
  userId: string,
  fields: {
    first_name?: string | null
    last_name?: string | null
    role?: AppRole
  }
): Promise<void> {
  try {
    const updateData: Record<string, any> = {}
    
    if (fields.first_name !== undefined) {
      updateData.first_name = fields.first_name?.trim() || null
    }
    if (fields.last_name !== undefined) {
      updateData.last_name = fields.last_name?.trim() || null
    }
    if (fields.role !== undefined) {
      updateData.role = fields.role
    }

    if (Object.keys(updateData).length === 0) {
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)

    if (error) {
      console.error('updateUserProfile error:', error)
      throw new Error(error.message || 'Failed to update user profile')
    }
  } catch (error: any) {
    console.error('updateUserProfile error:', error)
    throw error
  }
}

