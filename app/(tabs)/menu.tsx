import { useAuth } from "@/src/lib/auth-context";
import type { CakeSize, Category } from "@/src/lib/cakes";
import {
  createCake,
  deleteCake,
  fetchAllCakes,
  fetchCakeSizes,
  fetchCakeVariants,
  fetchCategories,
  updateCake,
  type CakeForAdmin,
  type CreateCakeInput,
  type SizePriceInput,
} from "@/src/lib/cakes-admin";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type CakeFormData = {
  name: string;
  ingredients: string;
  base_price_rsd: string;
  is_available: boolean;
  category_id: string;
  sizePrices: Record<string, string>; // size_id -> price string
};

export default function MenuScreen() {
  const { user } = useAuth();
  const [cakes, setCakes] = useState<CakeForAdmin[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cakeSizes, setCakeSizes] = useState<CakeSize[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCake, setEditingCake] = useState<CakeForAdmin | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<CakeFormData>({
    name: "",
    ingredients: "",
    base_price_rsd: "",
    is_available: true,
    category_id: "",
    sizePrices: {},
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cakesData, categoriesData, sizesData] = await Promise.all([
        fetchAllCakes(),
        fetchCategories(),
        fetchCakeSizes(),
      ]);
      setCakes(cakesData);
      setCategories(categoriesData);
      setCakeSizes(sizesData);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingCake(null);
    setSubmitting(false);
    setFormData({
      name: "",
      ingredients: "",
      base_price_rsd: "",
      is_available: true,
      category_id: categories[0]?.id || "",
      sizePrices: {},
    });
    setShowModal(true);
  };

  const openEditModal = async (cake: CakeForAdmin) => {
    setEditingCake(cake);
    setSubmitting(false);

    // Load existing variants for this cake
    let sizePrices: Record<string, string> = {};
    try {
      const variants = await fetchCakeVariants(cake.id);
      variants.forEach((variant) => {
        if (variant.cake_size_id) {
          sizePrices[variant.cake_size_id] = variant.price_rsd.toString();
        }
      });
    } catch (error) {
      console.warn("Failed to load variants:", error);
    }

    setFormData({
      name: cake.name,
      ingredients: cake.ingredients || "",
      base_price_rsd: cake.base_price_rsd?.toString() || "",
      is_available: cake.is_available,
      category_id: cake.category_id || categories[0]?.id || "",
      sizePrices,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSubmitting(false);
    setEditingCake(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Please enter a cake name");
      return;
    }

    if (!formData.category_id) {
      Alert.alert("Error", "Please select a category");
      return;
    }

    // Determine if bento based on category slug
    const selectedCategory = categories.find(
      (cat) => cat.id === formData.category_id,
    );
    if (!selectedCategory) {
      Alert.alert("Error", "Selected category not found");
      return;
    }
    const isBento = selectedCategory.slug === "bento";

    // Validation: Bento cakes need base price
    if (isBento) {
      if (!formData.base_price_rsd || !formData.base_price_rsd.trim()) {
        Alert.alert("Error", "Please enter a price for bento cake");
        return;
      }
      const price = parseFloat(formData.base_price_rsd);
      if (isNaN(price) || price <= 0) {
        Alert.alert("Error", "Please enter a valid price");
        return;
      }
    }

    // Validation: Classic cakes need at least one size with price
    if (!isBento) {
      const hasValidSize = Object.entries(formData.sizePrices).some(
        ([sizeId, price]) => {
          const priceNum = parseFloat(price);
          return !isNaN(priceNum) && priceNum > 0;
        },
      );
      if (!hasValidSize) {
        Alert.alert(
          "Error",
          "Please select at least one size and enter a price",
        );
        return;
      }
    }

    // Build variants array from selected sizes with prices
    const variants: SizePriceInput[] = Object.entries(formData.sizePrices)
      .filter(([sizeId, price]) => {
        // Only include sizes that have a valid price
        const priceNum = parseFloat(price);
        return !isNaN(priceNum) && priceNum > 0;
      })
      .map(([sizeId, price]) => ({
        size_id: sizeId,
        price_rsd: parseFloat(price),
      }));

    setSubmitting(true);
    try {
      if (editingCake) {
        // Update existing cake
        const updateInput = {
          name: formData.name.trim(),
          ingredients: formData.ingredients.trim() || null,
          base_price_rsd:
            formData.base_price_rsd && formData.base_price_rsd.trim()
              ? parseFloat(formData.base_price_rsd)
              : null,
          is_bento: isBento,
          is_available: formData.is_available,
          category_id: formData.category_id,
          variants,
        };
        console.log(
          "Updating cake:",
          editingCake.id,
          "with input:",
          updateInput,
        );
        await updateCake(editingCake.id, updateInput);
        Alert.alert("Uspešno!", "Torta izmenjena.");
      } else {
        // Create new cake
        const createInput: CreateCakeInput = {
          name: formData.name.trim(),
          ingredients: formData.ingredients.trim() || null,
          base_price_rsd:
            formData.base_price_rsd && formData.base_price_rsd.trim()
              ? parseFloat(formData.base_price_rsd)
              : null,
          is_bento: isBento,
          is_available: formData.is_available,
          category_id: formData.category_id,
          variants,
        };
        console.log("Creating cake with input:", createInput);
        await createCake(createInput);
        Alert.alert("Uspešno!", "Torta dodata.");
      }

      closeModal();
      await loadData();
    } catch (error: any) {
      console.error("Save error:", error);
      console.error("Error type:", typeof error);
      console.error("Error keys:", Object.keys(error || {}));
      console.error("Full error:", JSON.stringify(error, null, 2));

      let errorMessage = "Failed to save cake";
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error_description) {
        errorMessage = error.error_description;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.error?.message) {
        errorMessage = error.error.message;
      }

      Alert.alert("Error", errorMessage);
      setSubmitting(false);
    }
  };

  const handleDelete = (cake: CakeForAdmin) => {
    Alert.alert(
      "Obriši",
      `Da li ste sigurni da želite da obrišete "${cake.name}"?`,
      [
        { text: "Odustani", style: "cancel" },
        {
          text: "Obriši",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCake(cake.id);
              Alert.alert("Success", "Cake deleted successfully");
              await loadData();
            } catch (error: any) {
              Alert.alert("Error", error?.message || "Failed to delete cake");
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color="#000" />
          <Text style={{ marginTop: 12, color: "#6b7280" }}>Učitavanje</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 24 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <View>
            <Text style={{ fontSize: 32, fontWeight: "800", color: "#111827" }}>
              Upravljanje menijem
            </Text>
            <Text style={{ color: "#6b7280", marginTop: 4 }}>
              {user.email} ({user.role})
            </Text>
          </View>
          <Pressable
            onPress={openAddModal}
            style={{
              backgroundColor: "#000000",
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 16 }}>
              + Dodaj
            </Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {cakes.length === 0 ? (
            <View
              style={{
                padding: 32,
                alignItems: "center",
                backgroundColor: "#ffffff",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#e5e7eb",
              }}
            >
              <Text style={{ fontSize: 48, marginBottom: 16 }}>🍰</Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: "#111827",
                  marginBottom: 8,
                }}
              >
                Meni je prazan.
              </Text>
              <Text style={{ color: "#6b7280", textAlign: "center" }}>
                Klinki Dodaj za dodavanje torte.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {cakes.map((cake) => (
                <View
                  key={cake.id}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "700",
                          color: "#111827",
                          marginBottom: 4,
                        }}
                      >
                        {cake.name}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        {cake.categories?.slug === "bento" && (
                          <View
                            style={{
                              backgroundColor: "#fce7f3",
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 6,
                            }}
                          >
                            <Text
                              style={{
                                color: "#be185d",
                                fontSize: 12,
                                fontWeight: "600",
                              }}
                            >
                              Bento
                            </Text>
                          </View>
                        )}
                        {!cake.is_available && (
                          <View
                            style={{
                              backgroundColor: "#fee2e2",
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 6,
                            }}
                          >
                            <Text
                              style={{
                                color: "#991b1b",
                                fontSize: 12,
                                fontWeight: "600",
                              }}
                            >
                              Nedostupno
                            </Text>
                          </View>
                        )}
                        {cake.categories && (
                          <View
                            style={{
                              backgroundColor: "#f3f4f6",
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 6,
                            }}
                          >
                            <Text
                              style={{
                                color: "#374151",
                                fontSize: 12,
                                fontWeight: "600",
                              }}
                            >
                              {cake.categories.name}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {cake.ingredients && (
                    <Text
                      style={{
                        color: "#6b7280",
                        fontSize: 14,
                        marginBottom: 8,
                      }}
                    >
                      {cake.ingredients}
                    </Text>
                  )}

                  <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                    <Pressable
                      onPress={() => openEditModal(cake)}
                      style={{
                        flex: 1,
                        backgroundColor: "#f3f4f6",
                        paddingVertical: 10,
                        borderRadius: 8,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "#374151", fontWeight: "600" }}>
                        Izmeni
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDelete(cake)}
                      style={{
                        flex: 1,
                        backgroundColor: "#fee2e2",
                        paddingVertical: 10,
                        borderRadius: 8,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "#991b1b", fontWeight: "600" }}>
                        Obriši
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Add/Edit Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
          <View style={{ flex: 1, padding: 20 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <Text
                style={{ fontSize: 28, fontWeight: "800", color: "#111827" }}
              >
                {editingCake ? "Edit Cake" : "Add Cake"}
              </Text>
              <Pressable
                onPress={closeModal}
                style={{
                  padding: 8,
                }}
              >
                <Text style={{ fontSize: 24, color: "#6b7280" }}>✕</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ gap: 20 }}>
                <View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: 8,
                    }}
                  >
                    Name *
                  </Text>
                  <TextInput
                    value={formData.name}
                    onChangeText={(text) =>
                      setFormData({ ...formData, name: text })
                    }
                    placeholder="Naziv torte"
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: "#e5e7eb",
                    }}
                  />
                </View>

                <View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: 8,
                    }}
                  >
                    Sastojci
                  </Text>
                  <TextInput
                    value={formData.ingredients}
                    onChangeText={(text) =>
                      setFormData({ ...formData, ingredients: text })
                    }
                    placeholder="Sastojci (optional)"
                    multiline
                    numberOfLines={3}
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: "#e5e7eb",
                      minHeight: 80,
                    }}
                  />
                </View>

                {/* Only show base price for bento cakes */}
                {(() => {
                  const selectedCategory = categories.find(
                    (cat) => cat.id === formData.category_id,
                  );
                  const isBento = selectedCategory?.slug === "bento";

                  if (!isBento) {
                    return null; // Classic cakes use sizes, not base price
                  }

                  return (
                    <View>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: "#374151",
                          marginBottom: 8,
                        }}
                      >
                        Cena (RSD) *
                      </Text>
                      <TextInput
                        value={formData.base_price_rsd}
                        onChangeText={(text) =>
                          setFormData({ ...formData, base_price_rsd: text })
                        }
                        placeholder="Unesite cenu"
                        keyboardType="numeric"
                        style={{
                          backgroundColor: "#ffffff",
                          borderRadius: 12,
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          fontSize: 16,
                          borderWidth: 1,
                          borderColor: "#e5e7eb",
                        }}
                      />
                    </View>
                  );
                })()}

                <View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: 8,
                    }}
                  >
                    Kategorija
                  </Text>
                  <View
                    style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}
                  >
                    {categories.map((cat) => {
                      const currentCategory = categories.find(
                        (c) => c.id === formData.category_id,
                      );
                      const currentIsBento = currentCategory?.slug === "bento";
                      const newIsBento = cat.slug === "bento";

                      return (
                        <Pressable
                          key={cat.id}
                          onPress={() => {
                            // Clear irrelevant fields when switching category types
                            const updates: Partial<CakeFormData> = {
                              category_id: cat.id,
                            };
                            if (currentIsBento && !newIsBento) {
                              // Switching from bento to classic: clear base_price
                              updates.base_price_rsd = "";
                            } else if (!currentIsBento && newIsBento) {
                              // Switching from classic to bento: clear sizes
                              updates.sizePrices = {};
                            }
                            setFormData({ ...formData, ...updates });
                          }}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 8,
                            backgroundColor:
                              formData.category_id === cat.id
                                ? "#000000"
                                : "#f3f4f6",
                          }}
                        >
                          <Text
                            style={{
                              color:
                                formData.category_id === cat.id
                                  ? "#ffffff"
                                  : "#374151",
                              fontWeight: "600",
                            }}
                          >
                            {cat.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Only show sizes for non-bento cakes */}
                {(() => {
                  const selectedCategory = categories.find(
                    (cat) => cat.id === formData.category_id,
                  );
                  const isBento = selectedCategory?.slug === "bento";

                  if (isBento) {
                    return null; // Bento cakes use base_price_rsd, not sizes
                  }

                  return (
                    <View>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: "#374151",
                          marginBottom: 12,
                        }}
                      >
                        Veličine i cene
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          color: "#6b7280",
                          marginBottom: 12,
                        }}
                      >
                        Izaberite dostupne veličine i unesite cene za svaku
                      </Text>
                      <View style={{ gap: 12 }}>
                        {cakeSizes.map((size) => {
                          const isSelected =
                            formData.sizePrices[size.id] !== undefined;
                          const priceValue = formData.sizePrices[size.id] || "";

                          return (
                            <View
                              key={size.id}
                              style={{
                                backgroundColor: "#ffffff",
                                padding: 16,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: isSelected ? "#000000" : "#e5e7eb",
                              }}
                            >
                              <View
                                style={{
                                  flexDirection: "row",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginBottom: isSelected ? 12 : 0,
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 16,
                                    fontWeight: "600",
                                    color: "#374151",
                                  }}
                                >
                                  {size.name} ({size.code})
                                </Text>
                                <Switch
                                  value={isSelected}
                                  onValueChange={(value) => {
                                    const newSizePrices = {
                                      ...formData.sizePrices,
                                    };
                                    if (value) {
                                      newSizePrices[size.id] = "";
                                    } else {
                                      delete newSizePrices[size.id];
                                    }
                                    setFormData({
                                      ...formData,
                                      sizePrices: newSizePrices,
                                    });
                                  }}
                                />
                              </View>
                              {isSelected && (
                                <TextInput
                                  value={priceValue}
                                  onChangeText={(text) => {
                                    setFormData({
                                      ...formData,
                                      sizePrices: {
                                        ...formData.sizePrices,
                                        [size.id]: text,
                                      },
                                    });
                                  }}
                                  placeholder="Cena u RSD"
                                  keyboardType="numeric"
                                  style={{
                                    backgroundColor: "#f9fafb",
                                    borderRadius: 8,
                                    paddingHorizontal: 12,
                                    paddingVertical: 10,
                                    fontSize: 16,
                                    borderWidth: 1,
                                    borderColor: "#e5e7eb",
                                  }}
                                />
                              )}
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  );
                })()}

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "#ffffff",
                    padding: 16,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    Dostupno
                  </Text>
                  <Switch
                    value={formData.is_available}
                    onValueChange={(value) =>
                      setFormData({ ...formData, is_available: value })
                    }
                  />
                </View>
              </View>
            </ScrollView>

            <View style={{ marginTop: 24, gap: 12 }}>
              <Pressable
                onPress={handleSave}
                disabled={submitting}
                style={{
                  backgroundColor: "#000000",
                  paddingVertical: 16,
                  borderRadius: 12,
                  alignItems: "center",
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text
                    style={{
                      color: "#ffffff",
                      fontWeight: "700",
                      fontSize: 16,
                    }}
                  >
                    {editingCake ? "Update Cake" : "Create Cake"}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
