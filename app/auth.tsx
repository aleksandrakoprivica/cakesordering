import { signUpWithEmail, upsertUserProfile } from "@/src/lib/auth";
import { useAuth } from "@/src/lib/auth-context";
import { router, useLocalSearchParams } from "expo-router";
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

export default function AuthScreen() {
  const params = useLocalSearchParams<{ from?: string; message?: string }>();
  const { signIn, setGuestMode } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const redirectMessage =
    (typeof params.message === "string" && params.message) ||
    (params.from === "checkout"
      ? "You have to log in to place the order."
      : null);

  const handleSubmit = async () => {
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
      if (isSignUp && !isAdminMode) {
        const data = await signUpWithEmail(email.trim(), password);
        const userId = data.user?.id;
        if (userId) {
          await upsertUserProfile(userId, {
            first_name: firstName.trim() || null,
            last_name: lastName.trim() || null,
          });
        }
        Alert.alert("Success", "Account created! You are now signed in.");
      } else {
        await signIn(email.trim(), password);
        if (isAdminMode) {
          // Redirect admin to menu editing page
          router.replace("/(tabs)/menu");
        } else {
          Alert.alert("Success", "You are now signed in.");
        }
      }
      setPassword("");
      setFirstName("");
      setLastName("");
    } catch (e: any) {
      // Log full error details to console
      console.error("Auth error:", e);
      console.error("Error message:", e?.message);
      console.error("Error code:", e?.code);
      console.error("Full error object:", JSON.stringify(e, null, 2));

      // Show detailed error to user
      const errorMessage =
        e?.message ||
        e?.error_description ||
        JSON.stringify(e) ||
        "Unknown error";
      Alert.alert(
        isSignUp ? "Sign up failed" : "Sign in failed",
        errorMessage,
        [{ text: "OK" }],
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinueAsGuest = () => {
    setGuestMode();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <View style={{ flex: 1 }}>
        {/* Admin login button in top corner */}
        <View
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            zIndex: 10,
            padding: 16,
          }}
        >
          <Pressable
            onPress={() => {
              setIsAdminMode((prev) => !prev);
              setIsSignUp(false);
            }}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: isAdminMode ? "#f3f4f6" : "transparent",
            }}
          >
            <Text style={{ color: "#6b7280", fontSize: 13, fontWeight: "600" }}>
              {isAdminMode ? "Korisnik" : "Admin"}
            </Text>
          </Pressable>
        </View>

        <View
          style={{
            flex: 1,
            justifyContent: "center",
            paddingHorizontal: 24,
            paddingVertical: 40,
          }}
        >
          <View style={{ alignItems: "center", marginBottom: 48 }}>
          <Text
            style={{
              fontSize: 48,
              fontWeight: "800",
              color: "#111827",
              marginBottom: 8,
            }}
          >
            🎂
          </Text>
          <Text
            style={{
              fontSize: 32,
              fontWeight: "800",
              color: "#111827",
              marginBottom: 8,
            }}
          >
            {isAdminMode ? "Admin Panel" : "Poslastičarnica Tortica"}
          </Text>
          <Text style={{ fontSize: 16, color: "#6b7280", textAlign: "center" }}>
            {isAdminMode
              ? "Prijava za admina. Koristite svoj admin email i lozinku."
              : "Dobrodošli! Prijavite se ili nastavite kao gost."}
          </Text>
        </View>

        {redirectMessage && (
          <View
            style={{
              marginBottom: 24,
              padding: 12,
              borderRadius: 12,
              backgroundColor: "#fef3c7",
              borderWidth: 1,
              borderColor: "#facc15",
            }}
          >
            <Text style={{ color: "#92400e", fontSize: 14, fontWeight: "600" }}>
              {redirectMessage}
            </Text>
          </View>
        )}

        {isSignUp && !isAdminMode && (
          <>
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: 8,
                }}
              >
                Ime
              </Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Unesite ime"
                autoCapitalize="words"
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

            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: 8,
                }}
              >
                Prezime
              </Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Unesite prezime"
                autoCapitalize="words"
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
          </>
        )}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#374151",
              marginBottom: 8,
            }}
          >
            Email
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Unesite email adresu"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
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

        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#374151",
              marginBottom: 8,
            }}
          >
            Lozinka
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Unesite lozinku"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
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

        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={{
            backgroundColor: "#000000",
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: "center",
            marginBottom: 16,
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "700" }}>
              {isAdminMode ? "Admin Sign In" : isSignUp ? "Sign Up" : "Sign In"}
            </Text>
          )}
        </Pressable>

        {!isAdminMode && (
          <Pressable
            onPress={() => setIsSignUp(!isSignUp)}
            style={{ alignItems: "center", marginBottom: 24 }}
          >
            <Text style={{ color: "#6b7280", fontSize: 14 }}>
              {isSignUp
                ? "Već imaš profil? Prijavi se."
                : "Nemaš profil? Registruj se."}
            </Text>
          </Pressable>
        )}

        {!isAdminMode && (
          <>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <View style={{ flex: 1, height: 1, backgroundColor: "#e5e7eb" }} />
              <Text
                style={{ marginHorizontal: 16, color: "#9ca3af", fontSize: 14 }}
              >
                or
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: "#e5e7eb" }} />
            </View>

            <Pressable
              onPress={handleContinueAsGuest}
              style={{
                backgroundColor: "#f3f4f6",
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#e5e7eb",
              }}
            >
              <Text style={{ color: "#374151", fontSize: 16, fontWeight: "600" }}>
                Nastavite kao gost
              </Text>
            </Pressable>
          </>
        )}
        </View>
      </View>
    </SafeAreaView>
  );
}
