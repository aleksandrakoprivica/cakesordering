import { useAuth } from "@/src/lib/auth-context";
import { fetchAllOrders, updateOrderStatus, type Order } from "@/src/lib/orders";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
    case "received":
      return "bg-yellow-100 text-yellow-800";
    case "done":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function OrderCard({ 
  order, 
  onMarkAsDone 
}: { 
  order: Order
  onMarkAsDone: (orderId: string) => void
}) {
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
            {order.status === 'received' ? 'Primljena' : 'Završena'}
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
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <View className="flex-row items-center gap-2">
            <Text className="text-sm text-gray-600">
              Plaćanje: {order.payment_method.toUpperCase()}
            </Text>
            {order.payment_method === 'card' && (
              <View className="bg-green-100 px-2 py-0.5 rounded-full">
                <Text className="text-green-700 font-semibold text-xs">✓ Plaćeno</Text>
              </View>
            )}
          </View>
        </View>
        <View className="items-end">
          <Text className="text-sm text-gray-600 mb-1">Total</Text>
          <Text className="text-xl font-extrabold text-gray-900">
            {formatRSD(order.total_rsd)}
          </Text>
        </View>
      </View>

      {/* Mark as Done Button */}
      {order.status === 'received' && (
        <Pressable
          onPress={() => onMarkAsDone(order.id)}
          className="rounded-xl bg-green-600 py-3 active:opacity-80"
        >
          <Text className="text-center text-white font-bold text-base">
            Označi kao završeno
          </Text>
        </Pressable>
      )}
    </View>
  );
}

type OrderTab = 'received' | 'done';

export default function OrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tableError, setTableError] = useState(false);
  const [activeTab, setActiveTab] = useState<OrderTab>('received');

  const loadOrders = async () => {
    try {
      setTableError(false);
      const data = await fetchAllOrders();
      setOrders(data);
    } catch (error: any) {
      console.error("Failed to load orders:", error);
      // Check if it's a table missing error
      if (
        error?.code === "PGRST205" ||
        error?.message?.includes("Could not find the table")
      ) {
        setTableError(true);
      }
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

  const handleMarkAsDone = async (orderId: string) => {
    Alert.alert(
      'Označi kao završeno',
      'Da li ste sigurni da želite da označite ovu porudžbinu kao završenu?',
      [
        {
          text: 'Otkaži',
          style: 'cancel',
        },
        {
          text: 'Potvrdi',
          onPress: async () => {
            try {
              await updateOrderStatus(orderId, 'done');
              // Reload orders
              await loadOrders();
            } catch (error: any) {
              Alert.alert('Greška', error.message || 'Neuspešno ažuriranje statusa porudžbine');
            }
          },
        },
      ]
    );
  };

  const filteredOrders = orders.filter((order) => order.status === activeTab);

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

        {/* Tabs */}
        <View className="flex-row gap-3 mb-6">
          <Pressable
            onPress={() => setActiveTab('received')}
            className={`flex-1 rounded-xl py-3 ${
              activeTab === 'received'
                ? 'bg-black'
                : 'bg-white border border-gray-300'
            }`}
          >
            <Text
              className={`text-center font-bold text-base ${
                activeTab === 'received' ? 'text-white' : 'text-gray-900'
              }`}
            >
              Primljene ({orders.filter((o) => o.status === 'received').length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('done')}
            className={`flex-1 rounded-xl py-3 ${
              activeTab === 'done'
                ? 'bg-black'
                : 'bg-white border border-gray-300'
            }`}
          >
            <Text
              className={`text-center font-bold text-base ${
                activeTab === 'done' ? 'text-white' : 'text-gray-900'
              }`}
            >
              Završene ({orders.filter((o) => o.status === 'done').length})
            </Text>
          </Pressable>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#000" />
            <Text className="text-gray-500 mt-4">Učitavanje porudžbina...</Text>
          </View>
        ) : tableError ? (
          <View className="flex-1 items-center justify-center py-20 px-6">
            <Text className="text-6xl mb-4">⚠️</Text>
            <Text className="text-gray-900 text-center text-lg font-bold mb-2">
              Tabele u bazi podataka nisu pronađene
            </Text>
            <Text className="text-gray-600 text-center text-sm mb-4">
              Potrebno je kreirati tabele za porudžbine u Supabase bazi podataka.
            </Text>
            <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-4">
              <Text className="text-yellow-800 text-xs font-semibold mb-2">
                Pokrenite SQL u Supabase SQL Editoru:
              </Text>
              <Text className="text-yellow-900 text-xs font-mono">
                Pogledajte database-setup.sql fajl
              </Text>
            </View>
          </View>
        ) : filteredOrders.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-6xl mb-4">📦</Text>
            <Text className="text-gray-500 text-center text-lg font-medium">
              {activeTab === 'received'
                ? 'Nema primljenih porudžbina.'
                : 'Nema završenih porudžbina.'}
            </Text>
            <Text className="text-gray-400 text-center text-sm mt-2">
              Porudžbine će biti vidljive ovde.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <OrderCard order={item} onMarkAsDone={handleMarkAsDone} />
            )}
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
