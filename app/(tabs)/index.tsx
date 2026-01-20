import { useAuth } from "@/src/lib/auth-context";
import { fetchCakes, type Cake } from "@/src/lib/cakes";
import { useCart } from "@/src/lib/cart";
import { Link, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Tab = "classic" | "bento";

function formatRSD(rsd: number) {
  return rsd.toLocaleString("sr-RS", {
    style: "currency",
    currency: "RSD",
    maximumFractionDigits: 0,
  });
}

function Toggle({
  value,
  onChange,
}: {
  value: Tab;
  onChange: (v: Tab) => void;
}) {
  const handlePress = (newTab: Tab) => {
    try {
      onChange(newTab);
    } catch (error) {
      console.error("Toggle error:", error);
    }
  };

  // NOTE:
  // Using plain React Native styles here instead of NativeWind `className`
  // to avoid a known issue where certain NativeWind classes (e.g. shadow-*)
  // can break the navigation context when used with expo-router.
  return (
    <View
      style={{
        flexDirection: "row",
        borderRadius: 16,
        backgroundColor: "#f3f4f6",
        padding: 6,
      }}
    >
      {(["classic", "bento"] as Tab[]).map((k) => {
        const active = value === k;
        return (
          <TouchableOpacity
            key={k}
            onPress={() => handlePress(k)}
            activeOpacity={0.7}
            style={[
              {
                flex: 1,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 10,
                alignItems: "center",
                justifyContent: "center",
              },
              active && {
                backgroundColor: "#ffffff",
              },
            ]}
          >
            <Text
              style={{
                fontWeight: "700",
                fontSize: 16,
                color: active ? "#111827" : "#6b7280",
              }}
            >
              {k === "classic" ? "Classic" : "Bento"}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function SizeChip({ label, price }: { label: string; price: string }) {
  return (
    <View className="mr-2 mb-2 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm">
      <Text className="text-sm text-gray-800">
        <Text className="font-bold">{label}</Text> ·{" "}
        <Text className="font-semibold text-gray-900">{price}</Text>
      </Text>
    </View>
  );
}

function getRadiusFromCode(code: string | null | undefined): string {
  if (!code) return "—";
  const radiusMap: Record<string, string> = {
    S: "15 cm",
    M: "18 cm",
    L: "22 cm",
    s: "15 cm",
    m: "18 cm",
    l: "22 cm",
  };
  return radiusMap[code] || code;
}

export default function HomeScreen() {
  const [tab, setTab] = useState<Tab>("classic");
  const [cakes, setCakes] = useState<Cake[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const addItem = useCart((s) => s.addItem);
  const [justAddedKey, setJustAddedKey] = useState<string | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >({}); // cakeId -> variantId
  const { user } = useAuth();
  const isAdmin = user.role === "admin";

  // Debug: Log user role to verify it's being detected
  useEffect(() => {
    console.log(
      "HomeScreen - User role:",
      user.role,
      "isAdmin:",
      isAdmin,
      "userId:",
      user.id,
    );
  }, [user.role, isAdmin, user.id]);

  const handleTabChange = (newTab: Tab) => {
    if (newTab !== tab) {
      setTab(newTab);
    }
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setCakes([]);
    setErrorMsg(null);
    (async () => {
      try {
        const data = await fetchCakes(tab);
        if (isMounted) {
          setCakes(Array.isArray(data) ? data : []);
        }
      } catch (e: any) {
        if (isMounted) {
          setErrorMsg(e?.message ?? String(e) ?? "Unknown error");
          setCakes([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [tab]);

  const title = "TORTICA";

  const safeCakes = useMemo(() => {
    if (!Array.isArray(cakes)) return [];
    return cakes.filter(
      (c) => c && typeof c === "object" && c.id && typeof c.id === "string",
    );
  }, [cakes]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center gap-3 p-6">
          <ActivityIndicator size="large" color="#000" />
          <Text className="text-gray-600 text-base">Učitavanje...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMsg) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center gap-3 p-6">
          <Text className="text-red-600 font-bold text-lg text-center">
            ❌ {errorMsg}
          </Text>
          <Text className="text-gray-600 text-center text-sm px-4">
            Check: RLS SELECT policies, correct URL/key, and that categories
            have slugs classic + bento.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 px-5 pt-6 pb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-4xl font-extrabold text-gray-900">{title}</Text>
          {isAdmin && (
            <View className="bg-red-100 px-3 py-1.5 rounded-full border border-red-300">
              <Text className="text-red-700 font-bold text-xs">ADMIN</Text>
            </View>
          )}
        </View>
        <Text className="text-gray-500 text-sm mb-6">
          Da svaki dan bude sladak
        </Text>

        {isAdmin && (
          <View className="mb-4 rounded-2xl border-2 border-red-200 bg-red-50 p-4">
            <Text className="text-red-800 font-bold text-base mb-1">
              🔧 Admin stranica
            </Text>
            <Text className="text-red-700 text-sm">
              Pristupili ste admin stranici za izmenu i praćenje porudžbina.
            </Text>
          </View>
        )}

        <View className="mb-6">
          <Toggle value={tab} onChange={handleTabChange} />
        </View>

        {safeCakes.length === 0 ? (
          <View className="py-16 items-center">
            <Text className="text-gray-500 text-center text-base">
              Još uvek nema torti u ovoj kategoriji.
            </Text>
          </View>
        ) : (
          <FlatList
            data={safeCakes}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <View className="h-4" />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => {
              if (!item || !item.id) return null;

              try {
                const isBento = Boolean(item.is_bento);
                const variants = Array.isArray(item.cake_variants)
                  ? item.cake_variants
                  : [];
                const name = String(item.name || "Untitled");
                const basePrice =
                  typeof item.base_price_rsd === "number"
                    ? item.base_price_rsd
                    : null;

                return (
                  <View
                    className="rounded-3xl border border-gray-200 bg-white p-5 shadow-md"
                    style={{ overflow: "hidden", width: "100%" }}
                  >
                    <Link href={`/cake/${item.id}`} asChild>
                      <Pressable className="active:opacity-90 web:cursor-pointer">
                        <Text className="text-xl font-bold text-gray-900 mb-2">
                          {name}
                        </Text>

                        {item.ingredients && (
                          <Text className="mt-2 text-gray-600 text-sm leading-5">
                            <Text className="font-semibold text-gray-800">
                              Sastojci:{" "}
                            </Text>{" "}
                            {String(item.ingredients)}
                          </Text>
                        )}

                        {isBento ? (
                          <View className="mt-4">
                            <Text className="text-2xl font-bold text-gray-900">
                              {basePrice != null ? formatRSD(basePrice) : "—"}
                            </Text>
                          </View>
                        ) : (
                          <View className="mt-4">
                            {variants.length > 0 ? (
                              <View className="flex-row flex-wrap gap-2">
                                {variants
                                  .filter((v) => v && v.id && v.cake_sizes)
                                  .map((v) => {
                                    const isSelected =
                                      selectedVariants[item.id] === v.id;
                                    return (
                                      <Pressable
                                        key={String(v.id)}
                                        onPress={() => {
                                          setSelectedVariants((prev) => ({
                                            ...prev,
                                            [item.id]: v.id,
                                          }));
                                        }}
                                        style={{
                                          borderRadius: 12,
                                          borderWidth: 2,
                                          borderColor: isSelected
                                            ? "#000000"
                                            : "#d1d5db",
                                          backgroundColor: isSelected
                                            ? "#000000"
                                            : "#ffffff",
                                          paddingHorizontal: 16,
                                          paddingVertical: 8,
                                        }}
                                      >
                                        <Text
                                          style={{
                                            fontWeight: "700",
                                            fontSize: 14,
                                            color: isSelected
                                              ? "#ffffff"
                                              : "#111827",
                                          }}
                                        >
                                          {getRadiusFromCode(
                                            v.cake_sizes?.code,
                                          )}
                                        </Text>
                                        <Text
                                          style={{
                                            fontSize: 12,
                                            fontWeight: "600",
                                            color: isSelected
                                              ? "#e5e7eb"
                                              : "#4b5563",
                                          }}
                                        >
                                          {formatRSD(
                                            typeof v.price_rsd === "number"
                                              ? v.price_rsd
                                              : 0,
                                          )}
                                        </Text>
                                      </Pressable>
                                    );
                                  })}
                              </View>
                            ) : (
                              <Text className="text-gray-500 text-sm">
                                Nema dostupnih veličina
                              </Text>
                            )}
                          </View>
                        )}
                      </Pressable>
                    </Link>

                    <View className="mt-4" style={{ flex: 1, width: "100%" }}>
                      {isBento ? (
                        <Pressable
                          onPress={() => {
                            const key = `bento:${item.id}`;
                            addItem({
                              key: `bento:${item.id}`,
                              cakeId: item.id,
                              cakeName: name,
                              variantId: null,
                              sizeLabel: null,
                              unitPriceRsd: basePrice ?? 0,
                            });
                            setJustAddedKey(key);
                            setTimeout(
                              () =>
                                setJustAddedKey((current) =>
                                  current === key ? null : current,
                                ),
                              500,
                            );
                          }}
                          style={{
                            borderRadius: 12,
                            backgroundColor:
                              justAddedKey === `bento:${item.id}`
                                ? "#16a34a"
                                : "#000000",
                            paddingVertical: 12,
                            flex: 1,
                            alignSelf: "stretch",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text
                            style={{
                              textAlign: "center",
                              color: "#ffffff",
                              fontWeight: "700",
                              fontSize: 16,
                            }}
                          >
                            {justAddedKey === `bento:${item.id}`
                              ? "Dodato!"
                              : "Dodaj u korpu"}
                          </Text>
                        </Pressable>
                      ) : variants.length > 0 ? (
                        (() => {
                          const selectedVariantId = selectedVariants[item.id];
                          const selectedVariant = variants.find(
                            (v) => v.id === selectedVariantId,
                          );
                          const isDisabled = !selectedVariant;
                          const key = selectedVariant
                            ? `variant:${item.id}:${selectedVariant.id}`
                            : null;

                          return (
                            <Pressable
                              onPress={() => {
                                if (
                                  selectedVariant &&
                                  selectedVariant.cake_sizes
                                ) {
                                  addItem({
                                    key: key!,
                                    cakeId: item.id,
                                    cakeName: name,
                                    variantId: selectedVariant.id,
                                    sizeLabel: selectedVariant.cake_sizes.code,
                                    unitPriceRsd:
                                      typeof selectedVariant.price_rsd ===
                                      "number"
                                        ? selectedVariant.price_rsd
                                        : 0,
                                  });
                                  setJustAddedKey(key!);
                                  setTimeout(
                                    () =>
                                      setJustAddedKey((current) =>
                                        current === key ? null : current,
                                      ),
                                    500,
                                  );
                                }
                              }}
                              disabled={isDisabled}
                              style={{
                                borderRadius: 12,
                                backgroundColor: isDisabled
                                  ? "#d1d5db"
                                  : justAddedKey === key
                                    ? "#16a34a"
                                    : "#000000",
                                paddingVertical: 12,
                                flex: 1,
                                alignSelf: "stretch",
                                alignItems: "center",
                                justifyContent: "center",
                                opacity: isDisabled ? 0.6 : 1,
                              }}
                            >
                              <Text
                                style={{
                                  textAlign: "center",
                                  color: "#ffffff",
                                  fontWeight: "700",
                                  fontSize: 16,
                                }}
                              >
                                {justAddedKey === key
                                  ? "Dodato"
                                  : isDisabled
                                    ? "Izaberite veličinu"
                                    : "Dodaj u korpu"}
                              </Text>
                            </Pressable>
                          );
                        })()
                      ) : (
                        // Classic cake with no variants - navigate to detail page to select size
                        <Pressable
                          onPress={() => {
                            router.push(`/cake/${item.id}`);
                          }}
                          style={{
                            borderRadius: 12,
                            backgroundColor: "#000000",
                            paddingVertical: 12,
                            flex: 1,
                            alignSelf: "stretch",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text
                            style={{
                              textAlign: "center",
                              color: "#ffffff",
                              fontWeight: "700",
                              fontSize: 16,
                            }}
                          >
                            Izaberi veličinu
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              } catch (error) {
                console.error("Render error for item:", item.id, error);
                return null;
              }
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
