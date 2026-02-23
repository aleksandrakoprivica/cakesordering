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

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 6) {
      return "Password must be at least 6 characters long.";
    }
    if (!/[A-Z]/.test(pwd)) {
      return "Password must contain at least one uppercase letter.";
    }
    if (!/[0-9]/.test(pwd)) {
      return "Password must contain at least one number.";
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password.");
      return;
    }
    // Only validate password for sign-up, not sign-in
    // This allows existing users (including admins) to sign in with their old passwords
    if (isSignUp && !isAdminMode) {
      const passwordError = validatePassword(password);
      if (passwordError) {
        Alert.alert("Error", passwordError);
        return;
      }
    }
    setSubmitting(true);
    try {
      const isFromCheckout = params.from === "checkout";
      
      if (isSignUp && !isAdminMode) {
        const data = await signUpWithEmail(email.trim(), password);
        const userId = data.user?.id;
        if (userId) {
          await upsertUserProfile(userId, {
            first_name: firstName.trim() || null,
            last_name: lastName.trim() || null,
            email: email.trim() || null, // Store email in profiles
          });
        }
        if (isFromCheckout) {
          // Redirect to cart after sign up from checkout
          router.replace("/(tabs)/cart");
        } else {
          Alert.alert("Success", "Account created! You are now signed in.");
        }
      } else {
        await signIn(email.trim(), password);
        if (isAdminMode) {
          // Redirect admin to menu editing page
          router.replace("/(tabs)/menu");
        } else if (isFromCheckout) {
          // Redirect to cart after sign in from checkout
          router.replace("/(tabs)/cart");
        } else {
          Alert.alert("Success", "You are now signed in.");
        }
      }
      setPassword("");
      setFirstName("");
      setLastName("");
    } catch (e: any) {
      // Log full error details to console (for debugging)
      console.error("Auth error:", e);
      console.error("Error message:", e?.message);
      console.error("Error code:", e?.code);
      console.error("Full error object:", JSON.stringify(e, null, 2));

      // Friendlier messages for common auth cases
      let errorMessage: string;

      if (e?.code === "invalid_credentials" || e?.status === 400) {
        errorMessage = "Pogrešan email ili lozinka. Pokušaj ponovo.";
      } else if (e?.message) {
        errorMessage = e.message;
      } else if (e?.error_description) {
        errorMessage = e.error_description;
      } else {
        errorMessage = "Došlo je do greške pri prijavi. Pokušaj ponovo.";
      }

      Alert.alert(
        isSignUp ? "Registracija neuspešna" : "Prijava neuspešna",
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
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: isAdminMode ? "#fee2e2" : "#f3f4f6",
              borderWidth: 1,
              borderColor: isAdminMode ? "#fecaca" : "#e5e7eb",
            }}
          >
            <Text style={{ 
              color: isAdminMode ? "#b91c1c" : "#6b7280", 
              fontSize: 13, 
              fontWeight: "700" 
            }}>
              {isAdminMode ? "👑 Admin" : "Admin"}
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
          {/* Header Section */}
          <View style={{ alignItems: "center", marginBottom: 40 }}>
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: "#fff5f5",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text style={{ fontSize: 56 }}>🎂</Text>
            </View>
            <Text
              style={{
                fontSize: 32,
                fontWeight: "800",
                color: "#111827",
                marginBottom: 8,
                textAlign: "center",
                width: "100%",
              }}
            >
              {isAdminMode ? "Admin Panel" : "Poslastičarnica Tortica"}
            </Text>
            <Text
              style={{ 
                fontSize: 16, 
                color: "#6b7280", 
                textAlign: "center",
                paddingHorizontal: 20,
              }}
            >
              {isAdminMode
                ? "Prijavite se sa admin nalogom"
                : "Dobrodošli u našu poslastičarnicu"}
            </Text>
          </View>

          {redirectMessage && (
            <View
              style={{
                marginBottom: 24,
                padding: 16,
                borderRadius: 16,
                backgroundColor: "#fef3c7",
                borderWidth: 1,
                borderColor: "#facc15",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Text
                style={{ color: "#92400e", fontSize: 14, fontWeight: "600", textAlign: "center" }}
              >
                ⚠️ {redirectMessage}
              </Text>
            </View>
          )}

          {/* Form Card */}
          <View
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 24,
              padding: 24,
              marginBottom: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 5,
            }}
          >
            {isSignUp && !isAdminMode && (
              <>
                <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: 10,
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
                    backgroundColor: "#f9fafb",
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 16,
                    borderWidth: 1.5,
                    borderColor: "#e5e7eb",
                  }}
                />
              </View>

              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: 10,
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
                    backgroundColor: "#f9fafb",
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 16,
                    borderWidth: 1.5,
                    borderColor: "#e5e7eb",
                  }}
                />
                </View>
              </>
            )}
            
            <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: "#374151",
                marginBottom: 10,
              }}
            >
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="vas@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                backgroundColor: "#f9fafb",
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                borderWidth: 1.5,
                borderColor: "#e5e7eb",
              }}
            />
            </View>

            <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: "#374151",
                marginBottom: 10,
              }}
            >
              Lozinka
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                backgroundColor: "#f9fafb",
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                borderWidth: 1.5,
                borderColor: "#e5e7eb",
              }}
            />
            {isSignUp && !isAdminMode && (
              <Text
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  marginTop: 8,
                  lineHeight: 16,
                }}
              >
                Lozinka mora imati najmanje 6 karaktera, jedno veliko slovo i jedan broj.
              </Text>
            )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ gap: 12 }}>
            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={{
                backgroundColor: "#000000",
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text
                  style={{ color: "#ffffff", fontSize: 17, fontWeight: "700" }}
                >
                  {isAdminMode
                    ? "Prijavi se kao Admin"
                    : isSignUp
                      ? "Kreiraj nalog"
                      : "Prijavi se"}
                </Text>
              )}
            </Pressable>

            {/* Allow switching between sign in / sign up only for regular users */}
            {!isAdminMode && (
              <Pressable
                onPress={() => setIsSignUp(!isSignUp)}
                style={{ 
                  alignItems: "center", 
                  paddingVertical: 12,
                }}
              >
                <Text style={{ 
                  color: "#6b7280", 
                  fontSize: 15,
                  fontWeight: "500",
                }}>
                  {isSignUp
                    ? "Već imaš profil? "
                    : "Nemaš profil? "}
                  <Text style={{ color: "#000000", fontWeight: "700" }}>
                    {isSignUp ? "Prijavi se" : "Registruj se"}
                  </Text>
                </Text>
              </Pressable>
            )}

            {/* Show 'continue as guest' only if user did NOT come here from checkout */}
            {!isAdminMode && params.from !== "checkout" && (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginVertical: 8,
                  }}
                >
                  <View
                    style={{ flex: 1, height: 1, backgroundColor: "#e5e7eb" }}
                  />
                  <Text
                    style={{
                      marginHorizontal: 16,
                      color: "#9ca3af",
                      fontSize: 14,
                      fontWeight: "500",
                    }}
                  >
                    ili
                  </Text>
                  <View
                    style={{ flex: 1, height: 1, backgroundColor: "#e5e7eb" }}
                  />
                </View>

                <Pressable
                  onPress={handleContinueAsGuest}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: 16,
                    paddingVertical: 16,
                    alignItems: "center",
                    borderWidth: 2,
                    borderColor: "#e5e7eb",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <Text
                    style={{ 
                      color: "#374151", 
                      fontSize: 16, 
                      fontWeight: "600" 
                    }}
                  >
                    Nastavite kao gost
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
