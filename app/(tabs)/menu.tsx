import { SafeAreaView } from 'react-native-safe-area-context'
import { View, Text } from 'react-native'
import { useAuth } from '@/src/lib/auth-context'

export default function MenuScreen() {
  const { user } = useAuth()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 24 }}>
        <Text style={{ fontSize: 32, fontWeight: '800', color: '#111827', marginBottom: 8 }}>
          Menu editor
        </Text>
        <Text style={{ color: '#6b7280', marginBottom: 24 }}>
          You are signed in as <Text style={{ fontWeight: '700' }}>{user.email ?? 'admin'}</Text> (
          {user.role}).
        </Text>

        <View
          style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#e5e7eb',
            backgroundColor: '#ffffff',
            padding: 16,
          }}
        >
          <Text style={{ fontWeight: '700', fontSize: 16, color: '#111827', marginBottom: 4 }}>
            Admin menu management (placeholder)
          </Text>
          <Text style={{ color: '#4b5563', fontSize: 14, lineHeight: 20 }}>
            Here you will be able to create, edit and toggle availability of cakes, categories and
            sizes. For now this is just a placeholder screen to confirm the admin tab layout is
            working.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}



