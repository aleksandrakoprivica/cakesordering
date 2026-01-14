import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from './supabase'
import { AppRole, AppUser, fetchUserProfile, signInWithEmail, signOut, signUpWithEmail } from './auth'

const GUEST_MODE_KEY = '@cakesordering:guest_mode'

type AuthContextValue =
  | {
      user: AppUser
      loading: false
      hasInitialized: boolean
      signIn: (email: string, password: string) => Promise<void>
      signUp: (email: string, password: string) => Promise<void>
      signOutUser: () => Promise<void>
      setGuestMode: () => Promise<void>
    }
  | {
      user: AppUser
      loading: true
      hasInitialized: boolean
      signIn: (email: string, password: string) => Promise<void>
      signUp: (email: string, password: string) => Promise<void>
      signOutUser: () => Promise<void>
      setGuestMode: () => Promise<void>
    }

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const guestUser: AppUser = {
  id: 'guest',
  email: null,
  role: 'guest',
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser>(guestUser)
  const [loading, setLoading] = useState(true)
  const [hasInitialized, setHasInitialized] = useState(false)

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      setLoading(true)
      try {
        // Check if user has previously chosen guest mode
        const guestMode = await AsyncStorage.getItem(GUEST_MODE_KEY)
        if (guestMode === 'true' && isMounted) {
          setHasInitialized(true)
          setLoading(false)
          return
        }

        const { data } = await supabase.auth.getSession()
        const session = data.session

        if (session?.user && isMounted) {
          const role: AppRole = await fetchUserProfile(session.user.id)
          setUser({
            id: session.user.id,
            email: session.user.email ?? null,
            role,
          })
          setHasInitialized(true)
        } else if (isMounted) {
          setUser(guestUser)
          // Don't set hasInitialized to true if no session and no guest mode
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    void init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setUser(guestUser)
        // Clear guest mode if user signs out
        await AsyncStorage.removeItem(GUEST_MODE_KEY)
        setHasInitialized(false)
        return
      }
      const role: AppRole = await fetchUserProfile(session.user.id)
      setUser({
        id: session.user.id,
        email: session.user.email ?? null,
        role,
      })
      setHasInitialized(true)
      // Clear guest mode when user signs in
      await AsyncStorage.removeItem(GUEST_MODE_KEY)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSignIn = async (email: string, password: string) => {
    await signInWithEmail(email, password)
    // Session listener will update user.
  }

  const handleSignUp = async (email: string, password: string) => {
    await signUpWithEmail(email, password)
    // Depending on Supabase email confirmation settings, user may need to confirm email.
  }

  const handleSignOut = async () => {
    await signOut()
    setUser(guestUser)
    await AsyncStorage.removeItem(GUEST_MODE_KEY)
    setHasInitialized(false)
  }

  const handleSetGuestMode = async () => {
    await AsyncStorage.setItem(GUEST_MODE_KEY, 'true')
    setUser(guestUser)
    setHasInitialized(true)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        hasInitialized,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOutUser: handleSignOut,
        setGuestMode: handleSetGuestMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}


