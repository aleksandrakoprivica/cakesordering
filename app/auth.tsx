import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, SafeAreaView, Text, TextInput, View } from 'react-native'
import { useAuth } from '@/src/lib/auth-context'

export default function AuthScreen() {
  const { signIn, signUp, setGuestMode } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password.')
      return
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password should be at least 6 characters long.')
      return
    }
    setSubmitting(true)
    try {
      if (isSignUp && !isAdminMode) {
        await signUp(email.trim(), password)
        Alert.alert('Success', 'Account created! You are now signed in.')
      } else {
        await signIn(email.trim(), password)
        Alert.alert('Success', isAdminMode ? 'Admin signed in.' : 'You are now signed in.')
      }
      setPassword('')
    } catch (e: any) {
      // Log full error details to console
      console.error('Auth error:', e)
      console.error('Error message:', e?.message)
      console.error('Error code:', e?.code)
      console.error('Full error object:', JSON.stringify(e, null, 2))
      
      // Show detailed error to user
      const errorMessage = e?.message || e?.error_description || JSON.stringify(e) || 'Unknown error'
      Alert.alert(
        isSignUp ? 'Sign up failed' : 'Sign in failed',
        errorMessage,
        [{ text: 'OK' }]
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleContinueAsGuest = () => {
    setGuestMode()
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 }}>
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <Text style={{ fontSize: 48, fontWeight: '800', color: '#111827', marginBottom: 8 }}>
            🎂
          </Text>
          <Text style={{ fontSize: 32, fontWeight: '800', color: '#111827', marginBottom: 8 }}>
            {isAdminMode ? 'Admin Panel' : 'CakesOrdering'}
          </Text>
          <Text style={{ fontSize: 16, color: '#6b7280', textAlign: 'center' }}>
            {isAdminMode
              ? 'Admin sign in. Use your admin email and password.'
              : 'Welcome! Sign in to continue or browse as a guest.'}
          </Text>
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
            Email
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 16,
              borderWidth: 1,
              borderColor: '#e5e7eb',
            }}
          />
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
            Password
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 16,
              borderWidth: 1,
              borderColor: '#e5e7eb',
            }}
          />
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={{
            backgroundColor: '#000000',
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: 'center',
            marginBottom: 16,
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700' }}>
              {isAdminMode ? 'Admin Sign In' : isSignUp ? 'Sign Up' : 'Sign In'}
            </Text>
          )}
        </Pressable>

        {!isAdminMode && (
          <Pressable
            onPress={() => setIsSignUp(!isSignUp)}
            style={{ alignItems: 'center', marginBottom: 24 }}
          >
            <Text style={{ color: '#6b7280', fontSize: 14 }}>
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </Text>
          </Pressable>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: '#e5e7eb' }} />
          <Text style={{ marginHorizontal: 16, color: '#9ca3af', fontSize: 14 }}>or</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: '#e5e7eb' }} />
        </View>

        <Pressable
          onPress={handleContinueAsGuest}
          style={{
            backgroundColor: '#f3f4f6',
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#e5e7eb',
          }}
        >
          <Text style={{ color: '#374151', fontSize: 16, fontWeight: '600' }}>
            Continue as Guest
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setIsAdminMode((prev) => !prev)
            setIsSignUp(false)
          }}
          style={{ alignItems: 'center', marginTop: 12 }}
        >
          <Text style={{ color: '#6b7280', fontSize: 13 }}>
            {isAdminMode ? 'Back to user sign in' : 'Admin login'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

