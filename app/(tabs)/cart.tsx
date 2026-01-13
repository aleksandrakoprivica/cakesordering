import { View, Text, Pressable, FlatList } from 'react-native'
import { useMemo } from 'react'
import { useCart } from '../../src/lib/cart'

function formatRSD(rsd: number) {
    return rsd.toLocaleString('sr-RS', {
        style: 'currency',
        currency: 'RSD',
        maximumFractionDigits: 0,
    })
}

export default function CartScreen() {
    const { items, setQty, removeItem, clear } = useCart()

    const total = useMemo(
        () => items.reduce((sum, i) => sum + i.unitPriceRsd * i.qty, 0),
        [items]
    )

    return (
        <View className="flex-1 bg-white px-4 pt-4">
            <View className="flex-row items-center justify-between">
                <Text className="text-3xl font-bold">Cart</Text>
                {items.length > 0 ? (
                    <Pressable onPress={clear} className="rounded-xl bg-gray-100 px-3 py-2">
                        <Text className="font-semibold">Clear</Text>
                    </Pressable>
                ) : null}
            </View>

            <FlatList
                className="mt-4"
                data={items}
                keyExtractor={(i) => i.key}
                ItemSeparatorComponent={() => <View className="h-3" />}
                ListEmptyComponent={
                    <View className="py-10">
                        <Text className="text-gray-600 text-center">Your cart is empty.</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View className="rounded-2xl border border-gray-200 p-4">
                        <Text className="text-lg font-semibold">{item.cakeName}</Text>
                        {item.sizeLabel ? <Text className="text-gray-600">Size: {item.sizeLabel}</Text> : null}
                        <Text className="mt-1 font-semibold">{formatRSD(item.unitPriceRsd)}</Text>

                        <View className="mt-3 flex-row items-center justify-between">
                            <View className="flex-row items-center gap-3">
                                <Pressable
                                    onPress={() => setQty(item.key, item.qty - 1)}
                                    className="h-10 w-10 items-center justify-center rounded-xl bg-gray-100"
                                >
                                    <Text className="text-xl">−</Text>
                                </Pressable>

                                <Text className="text-base font-semibold">{item.qty}</Text>

                                <Pressable
                                    onPress={() => setQty(item.key, item.qty + 1)}
                                    className="h-10 w-10 items-center justify-center rounded-xl bg-gray-100"
                                >
                                    <Text className="text-xl">+</Text>
                                </Pressable>
                            </View>

                            <Pressable onPress={() => removeItem(item.key)} className="rounded-xl bg-red-50 px-3 py-2">
                                <Text className="font-semibold text-red-600">Remove</Text>
                            </Pressable>
                        </View>
                    </View>
                )}
            />

            {items.length > 0 ? (
                <View className="border-t border-gray-200 py-4">
                    <View className="flex-row items-center justify-between">
                        <Text className="text-lg font-semibold">Total</Text>
                        <Text className="text-lg font-bold">{formatRSD(total)}</Text>
                    </View>
                </View>
            ) : null}
        </View>
    )
}
