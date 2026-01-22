import { getUserProfile } from '@/src/lib/auth'
import { useAuth } from '@/src/lib/auth-context'
import { useCart } from '@/src/lib/cart'
import { cartItemsToOrderItems, createOrder, type PaymentMethod } from '@/src/lib/orders'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

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
  const [userProfile, setUserProfile] = useState<{ first_name: string | null; last_name: string | null } | null>(null)

  // Load user profile to pre-fill name
  useEffect(() => {
    if (user.id && user.id !== 'guest') {
      getUserProfile(user.id).then(profile => {
        setUserProfile(profile)
        // Pre-fill name if available
        if (profile.first_name || profile.last_name) {
          const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ')
          if (fullName) {
            setCustomerName(fullName)
          }
        }
      }).catch(err => console.error('Failed to load user profile:', err))
    }
  }, [user.id])

  // Customer info
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState(user.email || '')
  const [customerPhone, setCustomerPhone] = useState('')

  // Phone number format validation - Serbian format: +381XXXXXXXXX or 06XXXXXXXXX
  const formatPhoneNumber = (text: string) => {
    // Remove all non-digit characters except +
    let cleaned = text.replace(/[^\d+]/g, '')
    
    // If it starts with +, keep it, otherwise remove +
    if (!cleaned.startsWith('+')) {
      cleaned = cleaned.replace(/\+/g, '')
    }
    
    // Limit length (max 13 digits with +, or 10 digits without)
    if (cleaned.startsWith('+')) {
      if (cleaned.length > 13) cleaned = cleaned.slice(0, 13)
    } else {
      if (cleaned.length > 10) cleaned = cleaned.slice(0, 10)
    }
    
    return cleaned
  }

  const validatePhoneNumber = (phone: string): boolean => {
    // Serbian phone number formats:
    // +381XXXXXXXXX (international)
    // 06XXXXXXXXX (domestic with leading 0)
    // 6XXXXXXXXX (domestic without leading 0)
    const phoneRegex = /^(\+381[6-9]\d{8}|0[6-9]\d{8}|[6-9]\d{8})$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  }

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
    if (!validatePhoneNumber(customerPhone.trim())) {
      Alert.alert('Error', 'Please enter a valid Serbian phone number\nFormat: +381XXXXXXXXX or 06XXXXXXXXX')
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

    // If card payment, redirect to Stripe payment page
    if (paymentMethod === 'card') {
      // Replace modal with payment screen to close modal
      router.replace({
        pathname: '/payment',
        params: {
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.trim(),
          deliveryAddress: deliveryAddress.trim(),
          deliveryCity: deliveryCity.trim(),
          deliveryPostalCode: deliveryPostalCode.trim(),
          deliveryNotes: deliveryNotes.trim() || '',
          total: total.toString(),
        },
      })
      return
    }

    // For cash payment, create order directly
    setLoading(true)
    try {
      const orderItems = cartItemsToOrderItems(items)
      const orderId = await createOrder({
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
      // Redirect to confirmation page, replacing current route
      router.replace(`/order-confirmation/${orderId}`)
    } catch (error: any) {
      console.error('Checkout error:', error)
      Alert.alert('Error', error.message || 'Failed to place order. Please try again.')
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
                    onChangeText={(text) => setCustomerPhone(formatPhoneNumber(text))}
                    placeholder="+381XXXXXXXXX or 06XXXXXXXXX"
                    className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
                    keyboardType="phone-pad"
                  />
                  <Text className="text-xs text-gray-500 mt-1">
                    Format: +381XXXXXXXXX or 06XXXXXXXXX
                  </Text>
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
