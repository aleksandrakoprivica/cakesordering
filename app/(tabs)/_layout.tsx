import { Tabs } from "expo-router";
import React from "react";
import { View, Text } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/src/lib/auth-context";
import { useCart } from "@/src/lib/cart";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const isAdmin = user.role === "admin";
  const items = useCart((s) => s.items);
  const cartCount = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          title: "Početna",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="birthday.cake.fill" color={color} />
          ),
          href: isAdmin ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Ponuda",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="menucard" color={color} />
          ),
          // Hide from admin tab bar
          href: isAdmin ? null : undefined,
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          title: "Korpa",
          tabBarIcon: ({ color }) => (
            <View style={{ position: "relative" }}>
              <IconSymbol size={28} name="cart" color={color} />
              {cartCount > 0 && !isAdmin && (
                <View
                  style={{
                    position: "absolute",
                    right: -8,
                    top: -4,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 999,
                    backgroundColor: "#ef4444",
                    justifyContent: "center",
                    alignItems: "center",
                    paddingHorizontal: 3,
                  }}
                >
                  <Text
                    style={{
                      color: "#ffffff",
                      fontSize: 10,
                      fontWeight: "700",
                    }}
                  >
                    {cartCount > 9 ? "9+" : cartCount}
                  </Text>
                </View>
              )}
            </View>
          ),
          href: isAdmin ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: "Menu",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="list.bullet.rectangle" color={color} />
          ),
          // Only show to admins
          href: isAdmin ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="tray.full.fill" color={color} />
          ),
          href: isAdmin ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.crop.circle" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
