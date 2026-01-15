import { View, Text, Pressable, FlatList, Alert } from "react-native";
import { useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/src/lib/auth-context";
import { useCart } from "@/src/lib/cart";

function formatRSD(rsd: number) {
  return rsd.toLocaleString("sr-RS", {
    style: "currency",
    currency: "RSD",
    maximumFractionDigits: 0,
  });
}

export default function CartScreen() {
  const { items, setQty, removeItem, clear } = useCart();
  const { user } = useAuth();

  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.unitPriceRsd * i.qty, 0),
    [items],
  );

  const handleCheckout = () => {
    if (!items.length) return;

    if (user.role === "guest") {
      router.push({
        pathname: "/auth",
        params: {
          from: "checkout",
          message: "You have to log in to place the order.",
        },
      });
      return;
    }

    // Logged-in user (user or admin) – placeholder order flow
    Alert.alert("Order placed", "Thank you for your order!");
    clear();
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 px-5 pt-6">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-4xl font-extrabold text-gray-900">Cart</Text>
          {items.length > 0 ? (
            <Pressable
              onPress={clear}
              className="rounded-xl bg-gray-100 px-4 py-2 active:opacity-70"
            >
              <Text className="font-semibold text-gray-700">Clear</Text>
            </Pressable>
          ) : null}
        </View>

        <FlatList
          data={items}
          keyExtractor={(i) => i.key}
          ItemSeparatorComponent={() => <View className="h-4" />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="py-20 items-center">
              <Text className="text-6xl mb-4">🛒</Text>
              <Text className="text-gray-500 text-center text-lg font-medium">
                Korpa je prazna.
              </Text>
              <Text className="text-gray-400 text-center text-sm mt-2">
                Dodajte Vašu omiljenu tortu!
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="rounded-3xl border border-gray-200 bg-white p-5 shadow-md">
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1">
                  <Text className="text-xl font-bold text-gray-900 mb-1">
                    {item.cakeName}
                  </Text>
                  {item.sizeLabel ? (
                    <Text className="text-gray-500 text-sm">
                      Size: {item.sizeLabel}
                    </Text>
                  ) : (
                    <Text className="text-gray-500 text-sm">Bento Torta</Text>
                  )}
                </View>
                <Text className="text-lg font-bold text-gray-900 ml-3">
                  {formatRSD(item.unitPriceRsd)}
                </Text>
              </View>

              <View className="mt-4 flex-row items-center justify-between">
                <View className="flex-row items-center gap-4">
                  <Pressable
                    onPress={() => setQty(item.key, item.qty - 1)}
                    className="h-11 w-11 items-center justify-center rounded-xl bg-gray-100 active:bg-gray-200"
                  >
                    <Text className="text-2xl font-semibold text-gray-700">
                      −
                    </Text>
                  </Pressable>

                  <View className="min-w-[40px] items-center">
                    <Text className="text-lg font-bold text-gray-900">
                      {item.qty}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => setQty(item.key, item.qty + 1)}
                    className="h-11 w-11 items-center justify-center rounded-xl bg-gray-100 active:bg-gray-200"
                  >
                    <Text className="text-2xl font-semibold text-gray-700">
                      +
                    </Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={() => removeItem(item.key)}
                  className="rounded-xl bg-red-50 px-4 py-2.5 active:bg-red-100"
                >
                  <Text className="font-semibold text-red-600">
                    Izbaci iz korpe
                  </Text>
                </Pressable>
              </View>

              <View className="mt-4 pt-4 border-t border-gray-100 flex-row items-center justify-between">
                <Text className="text-gray-600 font-medium">Subtotal</Text>
                <Text className="text-lg font-bold text-gray-900">
                  {formatRSD(item.unitPriceRsd * item.qty)}
                </Text>
              </View>
            </View>
          )}
        />

        {items.length > 0 ? (
          <View className="border-t border-gray-200 bg-white px-5 py-6 mt-4 rounded-t-3xl shadow-lg">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900">Total</Text>
              <Text className="text-2xl font-extrabold text-gray-900">
                {formatRSD(total)}
              </Text>
            </View>
            <Pressable
              onPress={handleCheckout}
              className="rounded-2xl bg-black py-4 active:opacity-90"
            >
              <Text className="text-center text-white font-bold text-lg">
                Poruči
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
