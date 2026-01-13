import { useEffect, useMemo, useState } from 'react'
import { View, Text, ActivityIndicator, FlatList, Pressable } from 'react-native'
import { fetchCakes, type Cake } from '../../src/lib/cakes'

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
  return (
      <View className="flex-row rounded-2xl bg-gray-100 p-1">
        {(['classic', 'bento'] as Tab[]).map((k) => {
          const active = value === k
          return (
              <Pressable
                  key={k}
                  onPress={() => onChange(k)}
                  className={`flex-1 rounded-2xl px-3 py-2 ${active ? 'bg-white' : ''}`}
              >
                <Text className={`text-center font-semibold ${active ? 'text-gray-900' : 'text-gray-600'}`}>
                  {k === 'classic' ? 'Classic' : 'Bento'}
                </Text>
              </Pressable>
          )
        })}
      </View>
  )
}

function SizeChip({ label, price }: { label: string; price: string }) {
  return (
      <View className="mr-2 rounded-full border border-gray-200 bg-white px-3 py-1">
        <Text className="text-sm text-gray-800">
          <Text className="font-semibold">{label}</Text> · {price}
        </Text>
      </View>
  )
}

export default function HomeScreen() {
  const [tab, setTab] = useState<Tab>('classic')
  const [cakes, setCakes] = useState<Cake[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    ;(async () => {
      try {
        setErrorMsg(null)
        const data = await fetchCakes(tab)
        setCakes(data)
      } catch (e: any) {
        setErrorMsg(e.message ?? String(e))
      } finally {
        setLoading(false)
      }
    })()
  }, [tab])

  const title = useMemo(() => (tab === 'classic' ? 'Classic Cakes' : 'Bento Cakes'), [tab])

  if (loading) {
    return (
        <View className="flex-1 items-center justify-center gap-2 p-6">
          <ActivityIndicator />
          <Text className="text-gray-600">Loading cakes…</Text>
        </View>
    )
  }

  if (errorMsg) {
    return (
        <View className="flex-1 items-center justify-center gap-2 p-6">
          <Text className="text-red-600 font-semibold text-center">❌ {errorMsg}</Text>
          <Text className="text-gray-600 text-center">
            Check: RLS SELECT policies, correct URL/key, and that categories have slugs "classic" + "bento".
          </Text>
        </View>
    )
  }

  return (
      <View className="flex-1 bg-white px-4 pt-4">
        <Text className="text-3xl font-bold">{title}</Text>

        <View className="mt-3">
          <Toggle value={tab} onChange={setTab} />
        </View>

        <FlatList
            className="mt-4"
            data={cakes}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <View className="h-3" />}
            ListEmptyComponent={
              <View className="py-10">
                <Text className="text-gray-600 text-center">No cakes yet in this category.</Text>
              </View>
            }
            renderItem={({ item }) => (
                <Pressable className="rounded-2xl border border-gray-200 bg-white p-4 active:opacity-80">
                  <Text className="text-lg font-semibold">{item.name}</Text>

                  {!!item.ingredients && (
                      <Text className="mt-1 text-gray-600">
                        <Text className="font-semibold">Ingredients:</Text> {item.ingredients}
                      </Text>
                  )}

                  {item.is_bento ? (
                      <Text className="mt-3 text-base font-semibold">
                        {item.base_price_rsd != null ? formatRSD(item.base_price_rsd) : '—'}
                      </Text>
                  ) : (
                      <View className="mt-3 flex-row flex-wrap">
                        {item.cake_variants.map((v) => (
                            <SizeChip
                                key={v.id}
                                label={v.cake_sizes.code}
                                price={formatRSD(v.price_rsd)}
                            />
                        ))}
                      </View>
                  )}
                </Pressable>
            )}
        />
      </View>
  )
}
