import { useEffect, useMemo, useState } from 'react'
import { View, Text, ActivityIndicator, FlatList, Pressable, TouchableOpacity } from 'react-native'
import { fetchCakes, type Cake } from '@/src/lib/cakes'
import { Link } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

type Tab = 'classic' | 'bento'

function formatRSD(rsd: number) {
  return rsd.toLocaleString('sr-RS', {
    style: 'currency',
    currency: 'RSD',
    maximumFractionDigits: 0,
  })
}

function Toggle({
  value,
  onChange,
}: {
  value: Tab
  onChange: (v: Tab) => void
}) {
  const handlePress = (newTab: Tab) => {
    try {
      onChange(newTab)
    } catch (error) {
      console.error('Toggle error:', error)
    }
  }

  return (
    <View className="flex-row rounded-2xl bg-gray-100 p-1.5 shadow-sm">
      {(['classic', 'bento'] as Tab[]).map((k) => {
        const active = value === k
        return (
          <TouchableOpacity
            key={k}
            onPress={() => handlePress(k)}
            activeOpacity={0.7}
            className={`flex-1 rounded-xl px-4 py-2.5 ${active ? 'bg-white shadow-md' : ''}`}
          >
            <Text className={`text-center font-bold text-base ${active ? 'text-gray-900' : 'text-gray-500'}`}>
              {k === 'classic' ? 'Classic' : 'Bento'}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

function SizeChip({ label, price }: { label: string; price: string }) {
  return (
    <View className="mr-2 mb-2 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm">
      <Text className="text-sm text-gray-800">
        <Text className="font-bold">{label}</Text> · <Text className="font-semibold text-gray-900">{price}</Text>
      </Text>
    </View>
  )
}

function getRadiusFromCode(code: string | null | undefined): string {
  if (!code) return '—'
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

export default function HomeScreen() {
  const [tab, setTab] = useState<Tab>('classic')
  const [cakes, setCakes] = useState<Cake[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleTabChange = (newTab: Tab) => {
    if (newTab !== tab) {
      setTab(newTab)
    }
  }

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setCakes([])
    setErrorMsg(null)
    
    ;(async () => {
      try {
        const data = await fetchCakes(tab)
        if (isMounted) {
          setCakes(Array.isArray(data) ? data : [])
        }
      } catch (e: any) {
        if (isMounted) {
          setErrorMsg(e?.message ?? String(e) ?? 'Unknown error')
          setCakes([])
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    })()
    
    return () => {
      isMounted = false
    }
  }, [tab])

  const title = useMemo(() => (tab === 'classic' ? 'Classic Cakes' : 'Bento Cakes'), [tab])
  
  const safeCakes = useMemo(() => {
    if (!Array.isArray(cakes)) return []
    return cakes.filter(c => c && typeof c === 'object' && c.id && typeof c.id === 'string')
  }, [cakes])

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center gap-3 p-6">
          <ActivityIndicator size="large" color="#000" />
          <Text className="text-gray-600 text-base">Loading cakes…</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (errorMsg) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center gap-3 p-6">
          <Text className="text-red-600 font-bold text-lg text-center">❌ {errorMsg}</Text>
          <Text className="text-gray-600 text-center text-sm px-4">
            Check: RLS SELECT policies, correct URL/key, and that categories have slugs "classic" + "bento".
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 px-5 pt-6 pb-4">
        <Text className="text-4xl font-extrabold text-gray-900 mb-1">{title}</Text>
        <Text className="text-gray-500 text-sm mb-6">Discover our delicious selection</Text>

        <View className="mb-6">
          <Toggle value={tab} onChange={handleTabChange} />
        </View>

        {safeCakes.length === 0 ? (
          <View className="py-16 items-center">
            <Text className="text-gray-500 text-center text-base">No cakes yet in this category.</Text>
          </View>
        ) : (
          <FlatList
            data={safeCakes}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <View className="h-4" />}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              if (!item || !item.id) return null
              
              try {
                const isBento = Boolean(item.is_bento)
                const variants = Array.isArray(item.cake_variants) ? item.cake_variants : []
                const name = String(item.name || 'Untitled')
                const basePrice = typeof item.base_price_rsd === 'number' ? item.base_price_rsd : null
                
                return (
                  <Link href={`/cake/${item.id}`} asChild>
                    <Pressable className="rounded-3xl border border-gray-200 bg-white p-5 shadow-md active:opacity-90 active:scale-[0.98] web:cursor-pointer">
                      <Text className="text-xl font-bold text-gray-900 mb-2">{name}</Text>

                      {item.ingredients && (
                        <Text className="mt-2 text-gray-600 text-sm leading-5">
                          <Text className="font-semibold text-gray-800">Ingredients:</Text> {String(item.ingredients)}
                        </Text>
                      )}

                      {isBento ? (
                        <View className="mt-4 flex-row items-center justify-between">
                          <Text className="text-2xl font-bold text-gray-900">
                            {basePrice != null ? formatRSD(basePrice) : '—'}
                          </Text>
                          <View className="bg-pink-100 px-3 py-1 rounded-full">
                            <Text className="text-pink-700 font-semibold text-xs">Bento</Text>
                          </View>
                        </View>
                      ) : (
                        <View className="mt-4 flex-row flex-wrap">
                          {variants.filter(v => v && v.id && v.cake_sizes).map((v) => (
                            <SizeChip
                              key={String(v.id)}
                              label={getRadiusFromCode(v.cake_sizes?.code)}
                              price={formatRSD(typeof v.price_rsd === 'number' ? v.price_rsd : 0)}
                            />
                          ))}
                        </View>
                      )}
                    </Pressable>
                  </Link>
                )
              } catch (error) {
                console.error('Render error for item:', item.id, error)
                return null
              }
            }}
          />
        )}
      </View>
    </SafeAreaView>
  )
}
