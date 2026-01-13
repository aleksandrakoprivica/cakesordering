import { useEffect, useState } from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { supabase } from '@/src/lib/supabase'

export default function HomeScreen() {
  const [status, setStatus] = useState('Checking...')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const { error } = await supabase.auth.getSession()
        if (error) throw error
        setStatus('✅ Connected to Supabase')
      } catch (e: any) {
        setStatus(`❌ ${e.message}`)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
      <View style={styles.container}>
        {loading ? <ActivityIndicator /> : <Text style={styles.text}>{status}</Text>}
      </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 18 },
})
