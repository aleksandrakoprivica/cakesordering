import { SafeAreaView } from 'react-native-safe-area-context'
import { View, Text } from 'react-native'
import { useAuth } from '@/src/lib/auth-context'

export default function OrdersScreen() {
  const { user } = useAuth()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 24 }}>
        <Text style={{ fontSize: 32, fontWeight: '800', color: '#111827', marginBottom: 8 }}>
          Orders
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
            Admin orders dashboard (placeholder)
          </Text>
          <Text style={{ color: '#4b5563', fontSize: 14, lineHeight: 20 }}>
            This is where you will review and manage incoming cake orders. For now it is a simple
            placeholder so you can verify that only admins see this tab.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}



