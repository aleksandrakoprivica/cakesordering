import { useEffect, useState } from 'react'
import { View, Text, ActivityIndicator, Alert, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useAuth } from '@/src/lib/auth-context'
import { useCart } from '@/src/lib/cart'
import { createOrder, cartItemsToOrderItems } from '@/src/lib/orders'
import { createCheckoutSession, verifyPayment, type CheckoutData } from '@/src/lib/stripe'

// Complete web browser authentication when done
WebBrowser.maybeCompleteAuthSession()

export default function PaymentScreen() {
  const params = useLocalSearchParams<{
    customerName?: string
    customerEmail?: string
    customerPhone?: string
    deliveryAddress?: string
    deliveryCity?: string
    deliveryPostalCode?: string
    deliveryNotes?: string
    total?: string
  }>()
  
  const { user } = useAuth()
  const { items, clear } = useCart()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Validate required parameters
        if (!params.customerName || !params.customerEmail || !params.customerPhone ||
            !params.deliveryAddress || !params.deliveryCity || !params.deliveryPostalCode) {
          setError('Missing required information')
          setLoading(false)
          return
        }

        const total = parseFloat(params.total || '0')
        if (total <= 0 || items.length === 0) {
          setError('Invalid order total or empty cart')
          setLoading(false)
          return
        }

        // Prepare checkout data
        const checkoutData: CheckoutData = {
          customerName: params.customerName,
          customerEmail: params.customerEmail,
          customerPhone: params.customerPhone,
          deliveryAddress: params.deliveryAddress,
          deliveryCity: params.deliveryCity,
          deliveryPostalCode: params.deliveryPostalCode,
          deliveryNotes: params.deliveryNotes || null,
          totalRsd: total,
          items: items.map(item => ({
            cakeName: item.cakeName,
            quantity: item.qty,
            unitPriceRsd: item.unitPriceRsd,
          })),
        }

        // Create Stripe Checkout Session
        const { sessionId, url } = await createCheckoutSession(checkoutData)

        // Check if we're in development mode (skips actual Stripe payment)
        const isDevMode = url.includes('dev=true') || sessionId.startsWith('dev_session')

        if (isDevMode) {
          // Development mode: skip browser redirect and directly verify/create order
          setLoading(false)
          
          // Verify payment (will return true in dev mode)
          const isPaid = await verifyPayment(sessionId)

          if (isPaid) {
            // Create order
            const orderItems = cartItemsToOrderItems(items)
            const orderId = await createOrder({
              user_id: user.id,
              customer_name: params.customerName,
              customer_email: params.customerEmail,
              customer_phone: params.customerPhone,
              delivery_address: params.deliveryAddress,
              delivery_city: params.deliveryCity,
              delivery_postal_code: params.deliveryPostalCode,
              delivery_notes: params.deliveryNotes || null,
              payment_method: 'card',
              total_rsd: total,
              items: orderItems,
            })

            clear()
            // Redirect to confirmation page
            router.replace(`/order-confirmation/${orderId}`)
          } else {
            setError('Payment verification failed in development mode')
          }
          return
        }

        // Production mode: Open Stripe Checkout in browser
        // The callback URL should match your app's scheme (configured in app.json)
        const result = await WebBrowser.openAuthSessionAsync(
          url,
          'cakesordering://payment'
        )

        setLoading(false)

        if (result.type === 'success' && result.url) {
          // Parse the callback URL to get session ID
          // Stripe redirects with session_id in query params
          let returnedSessionId = sessionId
          try {
            const urlObj = new URL(result.url)
            const sessionIdParam = urlObj.searchParams.get('session_id')
            if (sessionIdParam) {
              returnedSessionId = sessionIdParam
            }
          } catch (e) {
            // If URL parsing fails, use the original sessionId
            console.warn('Could not parse callback URL:', e)
          }

          // Verify payment
          const isPaid = await verifyPayment(returnedSessionId)

          if (isPaid) {
            // Create order
            const orderItems = cartItemsToOrderItems(items)
            const orderId = await createOrder({
              user_id: user.id,
              customer_name: params.customerName,
              customer_email: params.customerEmail,
              customer_phone: params.customerPhone,
              delivery_address: params.deliveryAddress,
              delivery_city: params.deliveryCity,
              delivery_postal_code: params.deliveryPostalCode,
              delivery_notes: params.deliveryNotes || null,
              payment_method: 'card',
              total_rsd: total,
              items: orderItems,
            })

            clear()
            // Redirect to confirmation page
            router.replace(`/order-confirmation/${orderId}`)
          } else {
            Alert.alert(
              'Payment Failed',
              'Your payment could not be verified. Please try again.',
              [
                {
                  text: 'OK',
                  onPress: () => router.back(),
                },
              ]
            )
          }
        } else if (result.type === 'cancel') {
          // User cancelled payment
          Alert.alert(
            'Payment Cancelled',
            'You cancelled the payment. Your order was not placed.',
            [
              {
                text: 'OK',
                onPress: () => router.back(),
              },
            ]
          )
        } else {
          setError('Payment process was interrupted')
        }
      } catch (err: any) {
        console.error('Payment error:', err)
        setError(err.message || 'An error occurred during payment')
        setLoading(false)
      }
    }

    processPayment()
  }, [])

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-5">
          <ActivityIndicator size="large" color="#000000" />
          <Text className="mt-4 text-gray-600 text-center">
            Redirecting to payment...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-6xl mb-4">❌</Text>
          <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
            Payment Error
          </Text>
          <Text className="text-gray-600 text-center mb-6">{error}</Text>
          <Pressable
            onPress={() => router.back()}
            className="rounded-2xl bg-black px-8 py-4"
          >
            <Text className="text-white font-bold text-lg">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  return null
}

