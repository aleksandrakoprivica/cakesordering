// Profile page now only shows basic account info and auth actions.
import { useAuth } from "@/src/lib/auth-context";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from "react-native";

export default function ProfileScreen() {
  const { user, loading, signIn, signUp, signOutUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password.");
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      Alert.alert("Success", "You are now signed in.");
      setPassword("");
    } catch (e: any) {
      Alert.alert("Sign in failed", e?.message ?? String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password should be at least 6 characters long.");
      return;
    }
    setSubmitting(true);
    try {
      await signUp(email.trim(), password);
      Alert.alert(
        "Registracija uspešna",
        "Check your email for verification (depending on Supabase settings).",
      );
    } catch (e: any) {
      Alert.alert("Sign up failed", e?.message ?? String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setSubmitting(true);
    try {
      await signOutUser();
      // Sign out successful - user state is already updated in auth context
    } catch (e: any) {
      // Even if there's an error, the auth context should have cleared the user
      // Only show error if it's not a session-related issue
      if (
        e?.message &&
        !e.message.includes("session") &&
        !e.message.includes("missing")
      ) {
        Alert.alert("Error", e.message);
      }
      // Otherwise, silently succeed - user is effectively signed out
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <ActivityIndicator size="large" color="#000" />
          <Text style={{ color: "#4b5563" }}>Učitavanje...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isGuest = user.role === "guest";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 24 }}>
        <Text
          style={{
            fontSize: 32,
            fontWeight: "800",
            color: "#111827",
            marginBottom: 4,
          }}
        >
          Profile
        </Text>
        <Text style={{ color: "#6b7280", marginBottom: 24 }}>
          Role: <Text style={{ fontWeight: "700" }}>{user.role}</Text>
          {user.email ? `  (${user.email})` : null}
        </Text>

        {isGuest ? (
          <>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#111827",
                marginBottom: 12,
              }}
            >
              Prijavi se ili napravi profil.
            </Text>

            <View style={{ gap: 12, marginBottom: 24 }}>
              <View>
                <Text
                  style={{
                    marginBottom: 4,
                    color: "#374151",
                    fontWeight: "500",
                  }}
                >
                  Email
                </Text>
                <TextInput
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  style={{
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#d1d5db",
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    backgroundColor: "#ffffff",
                  }}
                />
              </View>

              <View>
                <Text
                  style={{
                    marginBottom: 4,
                    color: "#374151",
                    fontWeight: "500",
                  }}
                >
                  Password
                </Text>
                <TextInput
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  style={{
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#d1d5db",
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    backgroundColor: "#ffffff",
                  }}
                />
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable
                disabled={submitting}
                onPress={handleSignIn}
                style={{
                  flex: 1,
                  borderRadius: 12,
                  backgroundColor: "#000000",
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#ffffff", fontWeight: "700" }}>
                  {submitting ? "Working…" : "Sign in"}
                </Text>
              </Pressable>

              <Pressable
                disabled={submitting}
                onPress={handleSignUp}
                style={{
                  flex: 1,
                  borderRadius: 12,
                  backgroundColor: "#111827",
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#ffffff", fontWeight: "700" }}>
                  {submitting ? "Working…" : "Sign up"}
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <View style={{ paddingVertical: 16, marginBottom: 16 }}>
              <Text style={{ color: "#374151", marginBottom: 8 }}>
                You are signed in as:
              </Text>
              <Text style={{ fontWeight: "700", color: "#111827" }}>
                {user.email ?? "Unknown email"}
              </Text>
              <Text style={{ color: "#6b7280", marginTop: 4 }}>
                Role: <Text style={{ fontWeight: "700" }}>{user.role}</Text>
              </Text>
            </View>

            {user.role === "admin" && (
              <View
                style={{
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#fee2e2",
                  backgroundColor: "#fef2f2",
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    fontWeight: "700",
                    color: "#b91c1c",
                    marginBottom: 4,
                  }}
                >
                  Admin area (placeholder)
                </Text>
                <Text style={{ color: "#7f1d1d", fontSize: 13 }}>
                  Here you will be able to manage cakes, categories, users and
                  orders.
                </Text>
              </View>
            )}

            <Pressable
              disabled={submitting}
              onPress={handleSignOut}
              style={{
                borderRadius: 12,
                backgroundColor: "#ef4444",
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#ffffff", fontWeight: "700" }}>
                {submitting ? "Working…" : "Sign out"}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
