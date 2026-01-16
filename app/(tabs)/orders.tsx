import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from "react-native";
import { useAuth } from "@/src/lib/auth-context";
import { fetchAllOrders, type Order } from "@/src/lib/orders";

function formatRSD(rsd: number) {
  return rsd.toLocaleString("sr-RS", {
    style: "currency",
    currency: "RSD",
    maximumFractionDigits: 0,
  });
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("sr-RS", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusColor(status: Order["status"]) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "confirmed":
      return "bg-blue-100 text-blue-800";
    case "preparing":
      return "bg-purple-100 text-purple-800";
    case "ready":
      return "bg-green-100 text-green-800";
    case "delivered":
      return "bg-gray-100 text-gray-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function OrderCard({ order }: { order: Order }) {
  return (
    <View className="rounded-2xl border border-gray-200 bg-white p-5 mb-4 shadow-sm">
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
        <View
          className={`px-3 py-1 rounded-full ${getStatusColor(order.status)}`}
        >
          <Text className="text-xs font-semibold capitalize">
            {order.status}
          </Text>
        </View>
      </View>

      {/* Customer Info */}
      <View className="mb-4 pb-4 border-b border-gray-100">
        <Text className="text-sm font-semibold text-gray-700 mb-2">
          Informacije o kupcu
        </Text>
        <Text className="text-base text-gray-900">{order.customer_name}</Text>
        <Text className="text-sm text-gray-600">{order.customer_email}</Text>
        <Text className="text-sm text-gray-600">{order.customer_phone}</Text>
      </View>

      {/* Delivery Info */}
      <View className="mb-4 pb-4 border-b border-gray-100">
        <Text className="text-sm font-semibold text-gray-700 mb-2">
          Informacije o dostavi
        </Text>
        <Text className="text-base text-gray-900">
          {order.delivery_address}
        </Text>
        <Text className="text-sm text-gray-600">
          {order.delivery_city}, {order.delivery_postal_code}
        </Text>
        {order.delivery_notes && (
          <Text className="text-sm text-gray-500 italic mt-1">
            Note: {order.delivery_notes}
          </Text>
        )}
      </View>

      {/* Order Items */}
      <View className="mb-4 pb-4 border-b border-gray-100">
        <Text className="text-sm font-semibold text-gray-700 mb-2">Items</Text>
        {order.items.map((item, index) => (
          <View
            key={index}
            className="flex-row justify-between items-start mb-2"
          >
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
      </View>

      {/* Payment & Total */}
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-sm text-gray-600">
            Plaćanje: {order.payment_method.toUpperCase()}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-sm text-gray-600 mb-1">Total</Text>
          <Text className="text-xl font-extrabold text-gray-900">
            {formatRSD(order.total_rsd)}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function OrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = async () => {
    try {
      const data = await fetchAllOrders();
      setOrders(data);
    } catch (error: any) {
      console.error("Failed to load orders:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user.role === "admin") {
      loadOrders();
    }
  }, [user.role]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  if (user.role !== "admin") {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 px-5 pt-6">
          <Text className="text-4xl font-extrabold text-gray-900 mb-4">
            Porudžbine
          </Text>
          <Text className="text-gray-600">
            Morate biti admin da biste videli porudžbine.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 px-5 pt-6">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-4xl font-extrabold text-gray-900">
            Porudžbine
          </Text>
          <Pressable
            onPress={onRefresh}
            className="rounded-xl bg-gray-100 px-4 py-2 active:opacity-70"
          >
            <Text className="font-semibold text-gray-700">Refresh</Text>
          </Pressable>
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
              No orders yet
            </Text>
            <Text className="text-gray-400 text-center text-sm mt-2">
              Porudžbine će biti vidljive ovde.
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
  );
}
