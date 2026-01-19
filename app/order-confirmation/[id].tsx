import { useState, useEffect } from 'react'
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { fetchOrderById, type Order } from '@/src/lib/orders'

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
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function OrderConfirmationScreen() {
  const params = useLocalSearchParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadOrder = async () => {
      if (!params.id) {
        setError('Order ID is missing')
        setLoading(false)
        return
      }

      try {
        const orderData = await fetchOrderById(params.id)
        if (!orderData) {
          setError('Order not found')
        } else {
          setOrder(orderData)
        }
      } catch (err: any) {
        console.error('Error loading order:', err)
        setError(err.message || 'Failed to load order')
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [params.id])

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#000000" />
          <Text className="mt-4 text-gray-600">Loading order details...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error || !order) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-6xl mb-4">❌</Text>
          <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
            {error || 'Order not found'}
          </Text>
          <Text className="text-gray-600 text-center mb-6">
            We couldn't find the order you're looking for.
          </Text>
          <Pressable
            onPress={() => router.replace('/(tabs)/')}
            className="rounded-2xl bg-black px-8 py-4"
          >
            <Text className="text-white font-bold text-lg">Go to Home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 py-6">
          {/* Success Header */}
          <View className="items-center mb-8">
            <Text className="text-7xl mb-4">✅</Text>
            <Text className="text-3xl font-extrabold text-gray-900 mb-2 text-center">
              Order Confirmed!
            </Text>
            <Text className="text-gray-600 text-center text-base">
              Your order has been placed successfully
            </Text>
          </View>

          {/* Order Details Card */}
          <View className="bg-white rounded-3xl border border-gray-200 p-6 mb-6 shadow-md">
            <Text className="text-xl font-bold text-gray-900 mb-4">Order Details</Text>
            
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-500 mb-1">Order ID</Text>
              <Text className="text-base font-mono text-gray-900">{order.id}</Text>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-500 mb-1">Order Date</Text>
              <Text className="text-base text-gray-900">{formatDate(order.created_at)}</Text>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-500 mb-1">Status</Text>
              <View className="flex-row items-center mt-1">
                <View className="bg-yellow-100 px-3 py-1 rounded-full">
                  <Text className="text-yellow-800 font-semibold capitalize">
                    {order.status}
                  </Text>
                </View>
              </View>
            </View>

            <View>
              <Text className="text-sm font-semibold text-gray-500 mb-1">Payment Method</Text>
              <Text className="text-base text-gray-900 capitalize">{order.payment_method}</Text>
            </View>
          </View>

          {/* Order Items */}
          <View className="bg-white rounded-3xl border border-gray-200 p-6 mb-6 shadow-md">
            <Text className="text-xl font-bold text-gray-900 mb-4">Order Items</Text>
            {order.items.map((item, index) => (
              <View
                key={index}
                className={`flex-row justify-between items-start pb-4 ${
                  index < order.items.length - 1 ? 'border-b border-gray-100 mb-4' : ''
                }`}
              >
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900 mb-1">{item.cake_name}</Text>
                  {item.size_label && (
                    <Text className="text-sm text-gray-500 mb-1">Size: {item.size_label}</Text>
                  )}
                  <Text className="text-sm text-gray-500">Quantity: {item.quantity}</Text>
                </View>
                <Text className="font-bold text-gray-900 ml-3">
                  {formatRSD(item.unit_price_rsd * item.quantity)}
                </Text>
              </View>
            ))}
            <View className="flex-row justify-between items-center mt-4 pt-4 border-t border-gray-200">
              <Text className="text-xl font-bold text-gray-900">Total</Text>
              <Text className="text-2xl font-extrabold text-gray-900">
                {formatRSD(order.total_rsd)}
              </Text>
            </View>
          </View>

          {/* Delivery Information */}
          <View className="bg-white rounded-3xl border border-gray-200 p-6 mb-6 shadow-md">
            <Text className="text-xl font-bold text-gray-900 mb-4">Delivery Information</Text>
            
            <View className="mb-3">
              <Text className="text-sm font-semibold text-gray-500 mb-1">Name</Text>
              <Text className="text-base text-gray-900">{order.customer_name}</Text>
            </View>

            <View className="mb-3">
              <Text className="text-sm font-semibold text-gray-500 mb-1">Email</Text>
              <Text className="text-base text-gray-900">{order.customer_email}</Text>
            </View>

            <View className="mb-3">
              <Text className="text-sm font-semibold text-gray-500 mb-1">Phone</Text>
              <Text className="text-base text-gray-900">{order.customer_phone}</Text>
            </View>

            <View className="mb-3">
              <Text className="text-sm font-semibold text-gray-500 mb-1">Address</Text>
              <Text className="text-base text-gray-900">{order.delivery_address}</Text>
            </View>

            <View className="mb-3">
              <Text className="text-sm font-semibold text-gray-500 mb-1">City</Text>
              <Text className="text-base text-gray-900">
                {order.delivery_city}, {order.delivery_postal_code}
              </Text>
            </View>

            {order.delivery_notes && (
              <View>
                <Text className="text-sm font-semibold text-gray-500 mb-1">Delivery Notes</Text>
                <Text className="text-base text-gray-900">{order.delivery_notes}</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View className="gap-4 mb-6">
            <Pressable
              onPress={() => router.replace('/(tabs)/orders')}
              className="rounded-2xl bg-black py-4 active:opacity-90"
            >
              <Text className="text-center text-white font-bold text-lg">View All Orders</Text>
            </Pressable>

            <Pressable
              onPress={() => router.replace('/(tabs)/')}
              className="rounded-2xl bg-gray-100 py-4 active:opacity-70 border border-gray-200"
            >
              <Text className="text-center text-gray-900 font-bold text-lg">Continue Shopping</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

