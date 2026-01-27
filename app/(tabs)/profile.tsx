// Profile page now only shows basic account info and auth actions.
import { useAuth } from "@/src/lib/auth-context";
import { router } from "expo-router";
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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
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
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Error", "Please enter your first name and last name.");
      return;
    }
    setSubmitting(true);
    try {
      await signUp(email.trim(), password, firstName.trim(), lastName.trim());
      Alert.alert(
        "Registracija uspešna",
        "Check your email for verification (depending on Supabase settings).",
      );
      setFirstName("");
      setLastName("");
      setPassword("");
      setIsSignUp(false);
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
            fontSize: 36,
            fontWeight: "800",
            color: "#111827",
            marginBottom: 8,
          }}
        >
          Profil
        </Text>
        {isGuest && (
          <Text style={{ color: "#6b7280", marginBottom: 24, fontSize: 15 }}>
            Prijavite se da biste pristupili svom profilu
          </Text>
        )}

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
              {isSignUp && (
                <>
                  <View>
                    <Text
                      style={{
                        marginBottom: 4,
                        color: "#374151",
                        fontWeight: "500",
                      }}
                    >
                      First Name
                    </Text>
                    <TextInput
                      autoCapitalize="words"
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="Enter your first name"
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
                      Last Name
                    </Text>
                    <TextInput
                      autoCapitalize="words"
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Enter your last name"
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
                </>
              )}
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
              {!isSignUp ? (
                <>
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
                    onPress={() => setIsSignUp(true)}
                    style={{
                      flex: 1,
                      borderRadius: 12,
                      backgroundColor: "#111827",
                      paddingVertical: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#ffffff", fontWeight: "700" }}>
                      Sign up
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable
                    disabled={submitting}
                    onPress={() => {
                      setIsSignUp(false);
                      setFirstName("");
                      setLastName("");
                    }}
                    style={{
                      flex: 1,
                      borderRadius: 12,
                      backgroundColor: "#6b7280",
                      paddingVertical: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#ffffff", fontWeight: "700" }}>
                      Back
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
                      {submitting ? "Working…" : "Create Account"}
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          </>
        ) : (
          <>
            {/* User Info Card */}
            <View
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 20,
                padding: 20,
                marginBottom: 20,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: user.role === "admin" ? "#fee2e2" : "#e0e7ff",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontSize: 28 }}>
                  {user.role === "admin" ? "👑" : "👤"}
                </Text>
              </View>
              
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "800",
                  color: "#111827",
                  marginBottom: 8,
                }}
              >
                {user.email?.split("@")[0] ?? "Korisnik"}
              </Text>
              
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <Text style={{ color: "#6b7280", fontSize: 14 }}>
                  Email:{" "}
                </Text>
                <Text
                  style={{
                    color: "#111827",
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  {user.email ?? "N/A"}
                </Text>
              </View>
              
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 8,
                }}
              >
                <View
                  style={{
                    backgroundColor:
                      user.role === "admin" ? "#fee2e2" : "#e0e7ff",
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}
                >
                  <Text
                    style={{
                      color: user.role === "admin" ? "#b91c1c" : "#4338ca",
                      fontSize: 12,
                      fontWeight: "700",
                      textTransform: "uppercase",
                    }}
                  >
                    {user.role === "admin" ? "Admin" : "Korisnik"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View style={{ gap: 12 }}>
              {user.role !== "admin" && (
                <Pressable
                  onPress={() => router.push("/my-orders")}
                  style={{
                    borderRadius: 16,
                    backgroundColor: "#000000",
                    paddingVertical: 16,
                    alignItems: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <Text
                    style={{
                      color: "#ffffff",
                      fontWeight: "700",
                      fontSize: 16,
                    }}
                  >
                    Moje Porudžbine
                  </Text>
                </Pressable>
              )}

              <Pressable
                disabled={submitting}
                onPress={handleSignOut}
                style={{
                  borderRadius: 16,
                  backgroundColor: "#ffffff",
                  borderWidth: 2,
                  borderColor: "#ef4444",
                  paddingVertical: 16,
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                <Text
                  style={{
                    color: "#ef4444",
                    fontWeight: "700",
                    fontSize: 16,
                  }}
                >
                  {submitting ? "Working…" : "Odjavi se"}
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
