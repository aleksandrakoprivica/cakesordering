import { useAuth } from '@/src/lib/auth-context'
import { fetchOrdersByUserId, type Order } from '@/src/lib/orders'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

function formatRSD(rsd: number) {
  return rsd.toLocaleString('sr-RS', {
    style: 'currency',
    currency: 'RSD',
    maximumFractionDigits: 0,
  })
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('sr-RS', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function OrderCard({ order }: { order: Order }) {
  return (
    <Pressable
      onPress={() => router.push(`/order-confirmation/${order.id}`)}
      className="rounded-2xl border border-gray-200 bg-white p-5 mb-4 shadow-sm active:opacity-80"
    >
      {/* Header */}
      <View className="flex-row items-start justify-between mb-4">
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900 mb-1">
            Porudžbina #{order.id.slice(0, 8)}
          </Text>
          <Text className="text-sm text-gray-500">
            {formatDate(order.created_at)}
          </Text>
        </View>
        <View className="bg-gray-100 px-3 py-1 rounded-full">
          <Text className="text-xs font-semibold text-gray-700">
            {order.payment_method === 'card' ? 'Kartica' : 'Gotovina'}
          </Text>
        </View>
      </View>

      {/* Order Items Summary */}
      <View className="mb-4 pb-4 border-b border-gray-100">
        {order.items.slice(0, 2).map((item, index) => (
          <View key={index} className="flex-row justify-between items-start mb-2">
            <View className="flex-1">
              <Text className="text-base text-gray-900 font-medium">
                {item.cake_name}
              </Text>
              {item.size_label && (
                <Text className="text-sm text-gray-500">
                  Veličina: {item.size_label}
                </Text>
              )}
              <Text className="text-sm text-gray-500">
                Količina: {item.quantity}
              </Text>
            </View>
            <Text className="text-base font-semibold text-gray-900">
              {formatRSD(item.unit_price_rsd * item.quantity)}
            </Text>
          </View>
        ))}
        {order.items.length > 2 && (
          <Text className="text-sm text-gray-500 italic">
            +{order.items.length - 2} više artikala
          </Text>
        )}
      </View>

      {/* Total */}
      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-gray-600">Ukupno</Text>
        <Text className="text-xl font-extrabold text-gray-900">
          {formatRSD(order.total_rsd)}
        </Text>
      </View>
    </Pressable>
  )
}

export default function MyOrdersScreen() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadOrders = async () => {
    if (!user.id || user.id === 'guest') {
      setLoading(false)
      return
    }

    try {
      const data = await fetchOrdersByUserId(user.id)
      setOrders(data)
    } catch (error: any) {
      console.error('Failed to load orders:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [user.id])

  const onRefresh = () => {
    setRefreshing(true)
    loadOrders()
  }

  if (user.role === 'guest') {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 px-5 pt-6">
          <View className="flex-row items-center mb-6">
            <Pressable
              onPress={() => router.back()}
              className="mr-4 rounded-xl bg-gray-100 px-4 py-2 active:opacity-70"
            >
              <Text className="font-semibold text-gray-700">← Nazad</Text>
            </Pressable>
            <Text className="text-4xl font-extrabold text-gray-900">
              Moje Porudžbine
            </Text>
          </View>
          <Text className="text-gray-600">
            Morate biti prijavljeni da biste videli svoje porudžbine.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 px-5 pt-6">
        <View className="flex-row items-center mb-6">
          <Pressable
            onPress={() => router.back()}
            className="mr-4 rounded-xl bg-gray-100 px-4 py-2 active:opacity-70"
          >
            <Text className="font-semibold text-gray-700">← Nazad</Text>
          </Pressable>
          <Text className="text-4xl font-extrabold text-gray-900">
            Moje Porudžbine
          </Text>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#000" />
            <Text className="text-gray-500 mt-4">Učitavanje porudžbina...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-6xl mb-4">📦</Text>
            <Text className="text-gray-500 text-center text-lg font-medium">
              Još uvek nema porudžbina.
            </Text>
            <Text className="text-gray-400 text-center text-sm mt-2">
              Vaše porudžbine će biti vidljive ovde.
            </Text>
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <OrderCard order={item} />}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    </SafeAreaView>
  )
}



