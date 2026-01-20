/**
 * Stripe payment utilities
 * 
 * Note: This implementation uses Stripe Checkout (hosted payment page).
 * You'll need to set up a backend endpoint to create Stripe Checkout Sessions.
 * 
 * For production, create a Supabase Edge Function or API endpoint that:
 * 1. Creates a Stripe Checkout Session
 * 2. Returns the session URL
 * 3. Handles the webhook for payment confirmation
 */

export type CheckoutData = {
  customerName: string
  customerEmail: string
  customerPhone: string
  deliveryAddress: string
  deliveryCity: string
  deliveryPostalCode: string
  deliveryNotes: string | null
  totalRsd: number
  items: Array<{
    cakeName: string
    quantity: number
    unitPriceRsd: number
  }>
}

/**
 * Create a Stripe Checkout Session
 * 
 * This calls your backend API that creates a Stripe Checkout Session.
 * 
 * Setup required:
 * 1. Set EXPO_PUBLIC_API_URL in your .env file or Expo config
 * 2. Create backend endpoint: POST /api/create-checkout-session
 * 3. See STRIPE_SETUP.md for implementation details
 */
export async function createCheckoutSession(
  checkoutData: CheckoutData
): Promise<{ sessionId: string; url: string }> {
  const API_URL = process.env.EXPO_PUBLIC_API_URL?.trim()
  
  // Development mode: skip payment and create order directly
  if (API_URL === 'dev' || API_URL === 'development') {
    // Return a mock session for development
    return {
      sessionId: `dev_session_${Date.now()}`,
      url: 'cakesordering://payment?session_id=dev_session&dev=true',
    }
  }
  
  if (!API_URL || API_URL === '' || API_URL === 'http://localhost:3000' || API_URL.includes('your-api')) {
    throw new Error(
      'EXPO_PUBLIC_API_URL is not configured. Please:\n' +
      '1. Open .env file in the project root\n' +
      '2. Set EXPO_PUBLIC_API_URL to your backend API URL (e.g., https://your-api.com)\n' +
      '   OR set it to "dev" for development mode (skips payment)\n' +
      '3. Restart your Expo development server\n' +
      '4. See STRIPE_SETUP.md for backend setup instructions'
    )
  }
  
  try {
    // Determine the endpoint URL
    // If it's a Supabase URL, use /functions/v1/function-name
    // Otherwise, use /api/endpoint-name
    const isSupabaseUrl = API_URL.includes('supabase.co/functions/v1')
    const endpoint = isSupabaseUrl
      ? `${API_URL}/create-checkout-session`
      : `${API_URL}/api/create-checkout-session`
    
    // For Supabase Edge Functions, we need to include the anon key
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (isSupabaseUrl) {
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
      
      if (!supabaseKey) {
        throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY is not set in .env file')
      }
      
      // Supabase Edge Functions require these headers
      headers['apikey'] = supabaseKey
      headers['Authorization'] = `Bearer ${supabaseKey}`
      headers['x-client-info'] = 'cakesordering-app'
      
      // Also add the Supabase URL for reference
      if (supabaseUrl) {
        headers['x-supabase-url'] = supabaseUrl
      }
    }
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(checkoutData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.error || errorData.message || 
        `Failed to create checkout session: ${response.statusText}`
      )
    }

    const data = await response.json()
    
    if (!data.sessionId || !data.url) {
      throw new Error('Invalid response from payment server')
    }
    
    return {
      sessionId: data.sessionId,
      url: data.url,
    }
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    throw new Error(
      error.message || 'Failed to create checkout session. Please try again.'
    )
  }
}

/**
 * Verify payment status
 * 
 * This calls your backend to verify if a payment was successful.
 * Your backend should verify with Stripe using the session ID.
 */
export async function verifyPayment(sessionId: string): Promise<boolean> {
  const API_URL = process.env.EXPO_PUBLIC_API_URL?.trim()
  
  // Development mode: auto-approve payments
  if (API_URL === 'dev' || API_URL === 'development' || sessionId.startsWith('dev_session')) {
    return true
  }
  
  if (!API_URL || API_URL === '' || API_URL === 'http://localhost:3000' || API_URL.includes('your-api')) {
    console.error('EXPO_PUBLIC_API_URL is not configured. Please set it in your .env file.')
    return false
  }
  
  try {
    // Determine the endpoint URL
    // If it's a Supabase URL, use /functions/v1/function-name
    // Otherwise, use /api/endpoint-name
    const isSupabaseUrl = API_URL.includes('supabase.co/functions/v1')
    const endpoint = isSupabaseUrl
      ? `${API_URL}/verify-payment?sessionId=${encodeURIComponent(sessionId)}`
      : `${API_URL}/api/verify-payment?sessionId=${encodeURIComponent(sessionId)}`
    
    // For Supabase Edge Functions, we need to include the anon key
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (isSupabaseUrl) {
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
      
      if (!supabaseKey) {
        console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY is not set in .env file')
        return false
      }
      
      // Supabase Edge Functions require these headers
      headers['apikey'] = supabaseKey
      headers['Authorization'] = `Bearer ${supabaseKey}`
      headers['x-client-info'] = 'cakesordering-app'
      
      // Also add the Supabase URL for reference
      if (supabaseUrl) {
        headers['x-supabase-url'] = supabaseUrl
      }
    }
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      console.error('Payment verification failed:', response.statusText)
      return false
    }

    const data = await response.json()
    return data.paid === true
  } catch (error) {
    console.error('Error verifying payment:', error)
    return false
  }
}

