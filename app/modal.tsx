import { useState } from 'react'
import { View, Text, TextInput, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useAuth } from '@/src/lib/auth-context'
import { useCart } from '@/src/lib/cart'
import { createOrder, cartItemsToOrderItems, type PaymentMethod } from '@/src/lib/orders'

function formatRSD(rsd: number) {
  return rsd.toLocaleString('sr-RS', {
    style: 'currency',
    currency: 'RSD',
    maximumFractionDigits: 0,
  })
}

export default function CheckoutModal() {
  const { user } = useAuth()
  const { items, clear } = useCart()
  const [loading, setLoading] = useState(false)

  // Customer info
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState(user.email || '')
  const [customerPhone, setCustomerPhone] = useState('')

  // Delivery info
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryCity, setDeliveryCity] = useState('')
  const [deliveryPostalCode, setDeliveryPostalCode] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')

  const total = items.reduce((sum, i) => sum + i.unitPriceRsd * i.qty, 0)

  const handleSubmit = async () => {
    // Validation
    if (!customerName.trim()) {
      Alert.alert('Error', 'Please enter your name')
      return
    }
    if (!customerEmail.trim()) {
      Alert.alert('Error', 'Please enter your email')
      return
    }
    if (!customerPhone.trim()) {
      Alert.alert('Error', 'Please enter your phone number')
      return
    }
    if (!deliveryAddress.trim()) {
      Alert.alert('Error', 'Please enter delivery address')
      return
    }
    if (!deliveryCity.trim()) {
      Alert.alert('Error', 'Please enter delivery city')
      return
    }
    if (!deliveryPostalCode.trim()) {
      Alert.alert('Error', 'Please enter postal code')
      return
    }
    if (items.length === 0) {
      Alert.alert('Error', 'Your cart is empty')
      return
    }

    setLoading(true)
    try {
      const orderItems = cartItemsToOrderItems(items)
      await createOrder({
        user_id: user.id,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        customer_phone: customerPhone.trim(),
        delivery_address: deliveryAddress.trim(),
        delivery_city: deliveryCity.trim(),
        delivery_postal_code: deliveryPostalCode.trim(),
        delivery_notes: deliveryNotes.trim() || null,
        payment_method: paymentMethod,
        total_rsd: total,
        items: orderItems,
      })

      clear()
      Alert.alert('Success', 'Your order has been placed!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ])
    } catch (error: any) {
      console.error('Checkout error:', error)
      Alert.alert('Error', error.message || 'Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-4 border-b border-gray-200 bg-white">
          <Text className="text-3xl font-extrabold text-gray-900">Checkout</Text>
          <Pressable
            onPress={() => router.back()}
            className="rounded-xl bg-gray-100 px-4 py-2 active:opacity-70"
          >
            <Text className="font-semibold text-gray-700">Cancel</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-5 py-6">
            {/* Customer Information */}
            <View className="mb-8">
              <Text className="text-2xl font-bold text-gray-900 mb-4">Customer Information</Text>
              <View>
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Full Name *</Text>
                  <TextInput
                    value={customerName}
                    onChangeText={setCustomerName}
                    placeholder="Enter your full name"
                    className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
                    autoCapitalize="words"
                  />
                </View>
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Email *</Text>
                  <TextInput
                    value={customerEmail}
                    onChangeText={setCustomerEmail}
                    placeholder="Enter your email"
                    className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Phone Number *</Text>
                  <TextInput
                    value={customerPhone}
                    onChangeText={setCustomerPhone}
                    placeholder="Enter your phone number"
                    className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </View>

            {/* Delivery Information */}
            <View className="mb-8">
              <Text className="text-2xl font-bold text-gray-900 mb-4">Delivery Information</Text>
              <View>
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Address *</Text>
                  <TextInput
                    value={deliveryAddress}
                    onChangeText={setDeliveryAddress}
                    placeholder="Enter delivery address"
                    className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
                    autoCapitalize="words"
                  />
                </View>
                <View className="flex-row gap-4 mb-4">
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">City *</Text>
                    <TextInput
                      value={deliveryCity}
                      onChangeText={setDeliveryCity}
                      placeholder="Enter city"
                      className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
                      autoCapitalize="words"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Postal Code *</Text>
                    <TextInput
                      value={deliveryPostalCode}
                      onChangeText={setDeliveryPostalCode}
                      placeholder="Enter postal code"
                      className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Delivery Notes (Optional)</Text>
                  <TextInput
                    value={deliveryNotes}
                    onChangeText={setDeliveryNotes}
                    placeholder="Any special delivery instructions..."
                    className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </View>

            {/* Payment Method */}
            <View className="mb-8">
              <Text className="text-2xl font-bold text-gray-900 mb-4">Payment Method</Text>
              <View className="flex-row gap-4">
                <Pressable
                  onPress={() => setPaymentMethod('cash')}
                  className={`flex-1 rounded-xl border-2 p-4 ${
                    paymentMethod === 'cash'
                      ? 'border-black bg-black'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  <Text
                    className={`text-center font-bold text-lg ${
                      paymentMethod === 'cash' ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    Cash
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setPaymentMethod('card')}
                  className={`flex-1 rounded-xl border-2 p-4 ${
                    paymentMethod === 'card'
                      ? 'border-black bg-black'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  <Text
                    className={`text-center font-bold text-lg ${
                      paymentMethod === 'card' ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    Card
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Order Summary */}
            <View className="mb-8">
              <Text className="text-2xl font-bold text-gray-900 mb-4">Order Summary</Text>
              <View className="bg-white rounded-2xl border border-gray-200 p-5">
                {items.map((item) => (
                  <View key={item.key} className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900">{item.cakeName}</Text>
                      {item.sizeLabel && (
                        <Text className="text-sm text-gray-500">Size: {item.sizeLabel}</Text>
                      )}
                      <Text className="text-sm text-gray-500">Qty: {item.qty}</Text>
                    </View>
                    <Text className="font-bold text-gray-900">{formatRSD(item.unitPriceRsd * item.qty)}</Text>
                  </View>
                ))}
                <View className="flex-row justify-between items-center mt-4 pt-4 border-t border-gray-200">
                  <Text className="text-xl font-bold text-gray-900">Total</Text>
                  <Text className="text-2xl font-extrabold text-gray-900">{formatRSD(total)}</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer with Submit Button */}
        <View className="border-t border-gray-200 bg-white px-5 py-6">
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className="rounded-2xl bg-black py-4 active:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-center text-white font-bold text-lg">Place Order</Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  )
}
