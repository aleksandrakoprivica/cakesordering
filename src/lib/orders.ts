import { supabase } from './supabase'
import type { CartItem } from './cart'

export type PaymentMethod = 'card' | 'cash'

export type OrderItem = {
  cake_id: string
  cake_name: string
  variant_id: string | null
  size_label: string | null
  unit_price_rsd: number
  quantity: number
}

export type CreateOrderInput = {
  user_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  delivery_address: string
  delivery_city: string
  delivery_postal_code: string
  delivery_notes: string | null
  payment_method: PaymentMethod
  total_rsd: number
  items: OrderItem[]
}

export type Order = {
  id: string
  user_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  delivery_address: string
  delivery_city: string
  delivery_postal_code: string
  delivery_notes: string | null
  payment_method: PaymentMethod
  total_rsd: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  created_at: string
  items: OrderItem[]
}

/**
 * Create a new order
 */
export async function createOrder(input: CreateOrderInput): Promise<string> {
  try {
    // First, create the order record
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: input.user_id,
        customer_name: input.customer_name,
        customer_email: input.customer_email,
        customer_phone: input.customer_phone,
        delivery_address: input.delivery_address,
        delivery_city: input.delivery_city,
        delivery_postal_code: input.delivery_postal_code,
        delivery_notes: input.delivery_notes,
        payment_method: input.payment_method,
        total_rsd: input.total_rsd,
        status: 'pending',
      })
      .select('id')
      .single()

    if (orderError) {
      console.error('createOrder error:', orderError)
      throw new Error(orderError.message || 'Failed to create order')
    }

    if (!orderData?.id) {
      throw new Error('Failed to create order: no ID returned')
    }

    const orderId = orderData.id

    // Then, create the order items
    const orderItems = input.items.map((item) => ({
      order_id: orderId,
      cake_id: item.cake_id,
      cake_name: item.cake_name,
      variant_id: item.variant_id,
      size_label: item.size_label,
      unit_price_rsd: item.unit_price_rsd,
      quantity: item.quantity,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('createOrderItems error:', itemsError)
      // Try to delete the order if items creation fails
      await supabase.from('orders').delete().eq('id', orderId)
      throw new Error(itemsError.message || 'Failed to create order items')
    }

    return orderId
  } catch (error: any) {
    console.error('createOrder error:', error)
    throw error
  }
}

/**
 * Fetch all orders (for admin)
 */
export async function fetchAllOrders(): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        customer_name,
        customer_email,
        customer_phone,
        delivery_address,
        delivery_city,
        delivery_postal_code,
        delivery_notes,
        payment_method,
        total_rsd,
        status,
        created_at,
        order_items (
          cake_id,
          cake_name,
          variant_id,
          size_label,
          unit_price_rsd,
          quantity
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('fetchAllOrders error:', error)
      throw error
    }

    return (data ?? []).map((order: any) => ({
      id: order.id || '',
      user_id: order.user_id || '',
      customer_name: order.customer_name || '',
      customer_email: order.customer_email || '',
      customer_phone: order.customer_phone || '',
      delivery_address: order.delivery_address || '',
      delivery_city: order.delivery_city || '',
      delivery_postal_code: order.delivery_postal_code || '',
      delivery_notes: order.delivery_notes ?? null,
      payment_method: order.payment_method || 'cash',
      total_rsd: order.total_rsd || 0,
      status: order.status || 'pending',
      created_at: order.created_at || '',
      items: (order.order_items || []).map((item: any) => ({
        cake_id: item.cake_id || '',
        cake_name: item.cake_name || '',
        variant_id: item.variant_id ?? null,
        size_label: item.size_label ?? null,
        unit_price_rsd: item.unit_price_rsd || 0,
        quantity: item.quantity || 0,
      })),
    }))
  } catch (error: any) {
    console.error('fetchAllOrders error:', error)
    throw error
  }
}

/**
 * Convert cart items to order items
 */
export function cartItemsToOrderItems(cartItems: CartItem[]): OrderItem[] {
  return cartItems.map((item) => ({
    cake_id: item.cakeId,
    cake_name: item.cakeName,
    variant_id: item.variantId ?? null,
    size_label: item.sizeLabel ?? null,
    unit_price_rsd: item.unitPriceRsd,
    quantity: item.qty,
  }))
}

