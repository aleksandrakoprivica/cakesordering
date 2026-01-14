import { useLocalSearchParams, Stack, router } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { View, Text, ActivityIndicator, Pressable, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/src/lib/supabase'
import { useCart } from '@/src/lib/cart'

type CakeSize = { id: string; name: string; code: string; sort_order: number }
type CakeVariant = { id: string; price_rsd: number; cake_sizes: CakeSize }
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

function getRadiusFromCode(code: string): string {
    const radiusMap: Record<string, string> = {
        'S': '15 cm',
        'M': '18 cm',
        'L': '22 cm',
        's': '15 cm',
        'm': '18 cm',
        'l': '22 cm',
    }
    return radiusMap[code] || code
}

export default function CakeDetailScreen() {
    const params = useLocalSearchParams<{ id?: string | string[] }>()
    const cakeId = useMemo(() => {
        const raw = params.id
        return Array.isArray(raw) ? raw[0] : raw
    }, [params.id])

    const addItem = useCart((s) => s.addItem)

    const [cake, setCake] = useState<CakeDetail | null>(null)
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    useEffect(() => {
        if (!cakeId) return

        setLoading(true)
        setErrorMsg(null)

        ;(async () => {
            try {
                const { data, error } = await supabase
                    .from('cakes')
                    .select(`
            id,name,ingredients,base_price_rsd,is_bento,
            cake_variants (
              id,price_rsd,
              cake_sizes ( id,name,code,sort_order )
            )
          `)
                    .eq('id', cakeId)
                    .single()

                if (error) throw error
                if (!data) throw new Error('No data returned')

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
                            cake_sizes: Array.isArray(v.cake_sizes) ? v.cake_sizes[0] : v.cake_sizes,
                        }))
                        .filter((v: any) => v.cake_sizes)
                        .sort((a: any, b: any) => (a.cake_sizes.sort_order ?? 0) - (b.cake_sizes.sort_order ?? 0)),
                }

                setCake(normalized)
            } catch (e: any) {
                setErrorMsg(e?.message ?? String(e))
            } finally {
                setLoading(false)
            }
        })()
    }, [cakeId])

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <Stack.Screen options={{ title: 'Cake Details' }} />
            
            {!cakeId ? (
                <View className="flex-1 items-center justify-center gap-4 p-6">
                    <Text className="text-red-600 font-bold text-lg">Missing cake id</Text>
                    <Pressable 
                        onPress={() => router.back()} 
                        style={{
                            borderRadius: 12,
                            backgroundColor: '#f3f4f6',
                            paddingHorizontal: 24,
                            paddingVertical: 12,
                        }}
                    >
                        <Text style={{ fontWeight: '600', color: '#374151' }}>Go back</Text>
                    </Pressable>
                </View>
            ) : loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#000" />
                </View>
            ) : errorMsg ? (
                <View className="flex-1 items-center justify-center gap-4 p-6">
                    <Text className="text-red-600 font-bold text-lg text-center">❌ {errorMsg}</Text>
                    <Text className="text-gray-600 text-center text-sm px-4">
                        If it says "JSON object requested, multiple (or no) rows returned", the id didn't match any cake.
                    </Text>
                    <Pressable 
                        onPress={() => router.back()} 
                        style={{
                            borderRadius: 12,
                            backgroundColor: '#f3f4f6',
                            paddingHorizontal: 24,
                            paddingVertical: 12,
                        }}
                    >
                        <Text style={{ fontWeight: '600', color: '#374151' }}>Go back</Text>
                    </Pressable>
                </View>
            ) : !cake ? (
                <View className="flex-1 items-center justify-center">
                    <Text className="text-gray-600 text-lg">Cake not found</Text>
                </View>
            ) : (
                <ScrollView 
                    className="flex-1" 
                    contentContainerClassName="p-5"
                    showsVerticalScrollIndicator={false}
                >
                    <View className="bg-white rounded-3xl p-6 shadow-md mb-4">
                        <Text className="text-3xl font-extrabold text-gray-900 mb-3">{cake.name}</Text>
                        
                        {cake.is_bento && (
                            <View className="self-start bg-pink-100 px-3 py-1 rounded-full mb-3">
                                <Text className="text-pink-700 font-semibold text-xs">Bento Cake</Text>
                            </View>
                        )}

                        {!!cake.ingredients && (
                            <View className="mt-4 p-4 bg-gray-50 rounded-2xl">
                                <Text className="font-bold text-gray-900 mb-2">Ingredients</Text>
                                <Text className="text-gray-700 leading-6">{cake.ingredients}</Text>
                            </View>
                        )}
                    </View>

                    {cake.is_bento ? (
                        <View className="bg-white rounded-3xl p-6 shadow-md">
                            <View className="flex-row items-baseline justify-between mb-6">
                                <Text className="text-gray-600 font-medium text-lg">Price</Text>
                                <Text className="text-3xl font-extrabold text-gray-900">
                                    {formatRSD(cake.base_price_rsd ?? 0)}
                                </Text>
                            </View>

                            <Pressable
                                onPress={() => {
                                    addItem({
                                        key: `bento:${cake.id}`,
                                        cakeId: cake.id,
                                        cakeName: cake.name,
                                        variantId: null,
                                        sizeLabel: null,
                                        unitPriceRsd: cake.base_price_rsd ?? 0,
                                    })
                                    router.push('/(tabs)/cart')
                                }}
                                style={{
                                    borderRadius: 16,
                                    backgroundColor: '#000000',
                                    paddingVertical: 16,
                                }}
                            >
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        color: '#ffffff',
                                        fontWeight: '700',
                                        fontSize: 18,
                                    }}
                                >
                                    Add to Cart
                                </Text>
                            </Pressable>
                        </View>
                    ) : (
                        <View className="bg-white rounded-3xl p-6 shadow-md">
                            <Text className="text-xl font-bold text-gray-900 mb-4">Choose Size</Text>

                            <View className="flex-row flex-wrap gap-3 mb-6">
                                {cake.cake_variants.map((v) => {
                                    const selected = selectedVariantId === v.id
                                    return (
                                        <Pressable
                                            key={v.id}
                                            onPress={() => setSelectedVariantId(v.id)}
                                            style={[
                                                {
                                                    borderRadius: 16,
                                                    borderWidth: 2,
                                                    paddingHorizontal: 20,
                                                    paddingVertical: 12,
                                                    minWidth: 100,
                                                    alignItems: 'center',
                                                },
                                                selected
                                                    ? {
                                                          borderColor: '#000000',
                                                          backgroundColor: '#000000',
                                                      }
                                                    : {
                                                          borderColor: '#d1d5db',
                                                          backgroundColor: '#ffffff',
                                                      },
                                            ]}
                                        >
                                            <Text
                                                style={{
                                                    fontWeight: '700',
                                                    fontSize: 16,
                                                    marginBottom: 4,
                                                    color: selected ? '#ffffff' : '#111827',
                                                }}
                                            >
                                                {getRadiusFromCode(v.cake_sizes.code)}
                                            </Text>
                                            <Text
                                                style={{
                                                    fontSize: 14,
                                                    fontWeight: '600',
                                                    color: selected ? '#e5e7eb' : '#4b5563',
                                                }}
                                            >
                                                {formatRSD(v.price_rsd)}
                                            </Text>
                                        </Pressable>
                                    )
                                })}
                            </View>

                            <Pressable
                                disabled={!selectedVariantId}
                                onPress={() => {
                                    const v = cake.cake_variants.find((x) => x.id === selectedVariantId)
                                    if (!v) return
                                    addItem({
                                        key: `variant:${cake.id}:${v.id}`,
                                        cakeId: cake.id,
                                        cakeName: cake.name,
                                        variantId: v.id,
                                        sizeLabel: v.cake_sizes.code,
                                        unitPriceRsd: v.price_rsd,
                                    })
                                    router.push('/(tabs)/cart')
                                }}
                                style={{
                                    borderRadius: 16,
                                    paddingVertical: 16,
                                    backgroundColor: selectedVariantId ? '#000000' : '#d1d5db',
                                }}
                            >
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        color: '#ffffff',
                                        fontWeight: '700',
                                        fontSize: 18,
                                    }}
                                >
                                    {selectedVariantId ? 'Add to Cart' : 'Select a Size'}
                                </Text>
                            </Pressable>
                        </View>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    )
}
