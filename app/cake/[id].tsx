import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { View, Text, ActivityIndicator, Pressable } from 'react-native'
import { supabase } from '@/src/lib/supabase'

type CakeSize = {
    id: string
    name: string
    code: string
    sort_order: number
}

type CakeVariant = {
    id: string
    price_rsd: number
    cake_sizes: CakeSize
}

type CakeDetail = {
    id: string
    name: string
    ingredients: string | null
    base_price_rsd: number | null
    is_bento: boolean
    cake_variants: CakeVariant[]
}

function formatRSD(rsd: number) {
    return rsd.toLocaleString('sr-RS', {
        style: 'currency',
        currency: 'RSD',
        maximumFractionDigits: 0,
    })
}

export default function CakeDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const [cake, setCake] = useState<CakeDetail | null>(null)
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        ;(async () => {
            const { data, error } = await supabase
                .from('cakes')
                .select(`
    id,name,ingredients,base_price_rsd,is_bento,
    cake_variants (
      id,price_rsd,
      cake_sizes ( id,name,code,sort_order )
    )
  `)
                .eq('id', id)
                .single()

            if (!error && data) {
                const normalized: CakeDetail = {
                    id: data.id,
                    name: data.name,
                    ingredients: data.ingredients ?? null,
                    base_price_rsd: data.base_price_rsd ?? null,
                    is_bento: !!data.is_bento,
                    cake_variants: (data.cake_variants ?? [])
                        .map((v: any) => ({
                            id: v.id,
                            price_rsd: v.price_rsd,
                            // if cake_sizes comes back as array, take first; otherwise use object
                            cake_sizes: Array.isArray(v.cake_sizes) ? v.cake_sizes[0] : v.cake_sizes,
                        }))
                        .filter((v: any) => v.cake_sizes)
                        .sort((a: any, b: any) => (a.cake_sizes.sort_order ?? 0) - (b.cake_sizes.sort_order ?? 0)),
                }

                setCake(normalized)
            }

        })()
    }, [id])

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center">
                <ActivityIndicator />
            </View>
        )
    }

    if (!cake) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text>Not found</Text>
            </View>
        )
    }

    return (
        <View className="flex-1 bg-white p-4">
            <Text className="text-3xl font-bold">{cake.name}</Text>

            {!!cake.ingredients && (
                <Text className="mt-2 text-gray-600">
                    <Text className="font-semibold">Ingredients:</Text> {cake.ingredients}
                </Text>
            )}

            {/* BENTO */}
            {cake.is_bento ? (
                <View className="mt-6">
                    <Text className="text-xl font-semibold">
                        {formatRSD(cake.base_price_rsd!)}
                    </Text>

                    <Pressable className="mt-4 rounded-2xl bg-black py-4">
                        <Text className="text-center text-white font-semibold">
                            Add to cart
                        </Text>
                    </Pressable>
                </View>
            ) : (
                /* CLASSIC CAKE */
                <View className="mt-6">
                    <Text className="text-lg font-semibold">Choose size</Text>

                    <View className="mt-3 flex-row gap-3">
                        {cake.cake_variants.map((v) => {
                            const selected = selectedVariantId === v.id
                            return (
                                <Pressable
                                    key={v.id}
                                    onPress={() => setSelectedVariantId(v.id)}
                                    className={`rounded-xl border px-4 py-2 ${
                                        selected ? 'border-black bg-black' : 'border-gray-300'
                                    }`}
                                >
                                    <Text className={selected ? 'text-white' : 'text-black'}>
                                        {v.cake_sizes.code}
                                    </Text>
                                    <Text
                                        className={`text-sm ${
                                            selected ? 'text-white' : 'text-gray-600'
                                        }`}
                                    >
                                        {formatRSD(v.price_rsd)}
                                    </Text>
                                </Pressable>
                            )
                        })}
                    </View>

                    <Pressable
                        disabled={!selectedVariantId}
                        className={`mt-6 rounded-2xl py-4 ${
                            selectedVariantId ? 'bg-black' : 'bg-gray-300'
                        }`}
                    >
                        <Text className="text-center text-white font-semibold">
                            Add to cart
                        </Text>
                    </Pressable>
                </View>
            )}
        </View>
    )
}
