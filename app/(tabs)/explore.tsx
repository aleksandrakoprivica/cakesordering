import { IconSymbol } from "@/components/ui/icon-symbol";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// @ts-expect-error - image asset provided by Metro
import MuffinImage from "@/assets/images/muffin.jpg";
import { getUserProfile } from "@/src/lib/auth";
import { useAuth } from "@/src/lib/auth-context";
import { Link } from "expo-router";
import { useEffect, useState } from "react";

export default function ExploreScreen() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState<string | null>(null);

  // Load user's name for greeting
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        if (!user || user.role === 'guest' || !user.id || user.id === 'guest') {
          if (isMounted) setDisplayName(null);
          return;
        }
        const profile = await getUserProfile(user.id);
        if (!isMounted) return;
        const first = profile.first_name?.trim() ?? '';
        const last = profile.last_name?.trim() ?? '';
        const full = `${first} ${last}`.trim();
        // Show name if available, otherwise show email or just "Dobrodošli"
        if (full) {
          setDisplayName(full);
        } else if (user.email) {
          setDisplayName(user.email.split('@')[0]); // Use email username as fallback
        } else {
          setDisplayName(''); // Empty string means show just "Dobrodošli"
        }
      } catch (e) {
        console.error('Error loading user profile:', e);
        if (isMounted) {
          // On error, still try to show something
          if (user.email) {
            setDisplayName(user.email.split('@')[0]);
          } else {
            setDisplayName(null);
          }
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [user]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-5"
        showsVerticalScrollIndicator={false}
      >
        {displayName !== null && user.role !== 'guest' && (
          <Text className="text-lg font-bold text-gray-900 mb-4 text-center">
            Dobrodošli{displayName ? `, ${displayName}` : ''}!
          </Text>
        )}
        <View className="items-center mb-8 mt-4">
          <View className="bg-white rounded-full p-2 mb-4 shadow-lg">
            <Image
              source={MuffinImage}
              style={{
                width: 96,
                height: 96,
                borderRadius: 999,
              }}
              resizeMode="cover"
            />
          </View>
          <Text className="text-4xl text-center font-extrabold text-gray-900 mb-2">
            Poslastičarnica TORTICA
          </Text>
          <Text className="text-gray-500 text-center">KO SMO MI?</Text>
        </View>

        <View className="bg-white rounded-3xl p-6 shadow-md mb-4">
          <View className="flex-row items-center mb-3">
            <IconSymbol size={24} name="star.fill" color="#fbbf24" />
            <Text className="text-xl font-bold text-gray-900 ml-2">
              Premium kvalitet
            </Text>
          </View>
          <Text className="text-gray-600 leading-6">
            Koristimo najkvalitetnije sastojke za izradu naših torti. Svaki
            detalj je pažljivo odrađen, tako da je svaka naša torta SAVRŠENA.
          </Text>
        </View>

        <View className="bg-white rounded-3xl p-6 shadow-md mb-4">
          <View className="flex-row items-center mb-3">
            <IconSymbol size={24} name="heart.fill" color="#ec4899" />
            <Text className="text-xl font-bold text-gray-900 ml-2">
              Napravljeno sa ljubavlju
            </Text>
          </View>
          <Text className="text-gray-600 leading-6">
            Naši poslastičari uživaju u stvaranju i dekorisanju najlepših i
            najukusnijih torti baš za Vas. Od klasničnih do modernih i
            popularnih bento tortica, sa mnogo različitih ukusa tako da za
            svakoga postoji torta po ukusu.
          </Text>
        </View>

        <View className="bg-white rounded-3xl p-6 shadow-md mb-4">
          <View className="flex-row items-center mb-3">
            <IconSymbol size={24} name="truck.box.fill" color="#3b82f6" />
            <Text className="text-xl font-bold text-gray-900 ml-2">
              Brza isporuka
            </Text>
          </View>
          <Text className="text-gray-600 leading-6">
            Sve naše torte se prave na dnevnoj bazi kako bi Vama stigle sveže i
            u najlepšem obliku! Poručite i osetite razliku!
          </Text>
        </View>

        <View className="bg-pink-50 rounded-3xl p-6 mt-4 mb-4 border-2 border-pink-100">
          <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
            🎂
          </Text>
          <Text className="text-center text-gray-800 font-semibold text-lg mb-3">
            Spremni da poručite?
          </Text>
          <Link href="/" asChild>
            <Pressable className="mt-1 rounded-full bg-black px-6 py-3 active:opacity-90">
              <Text className="text-center text-white text-base font-semibold">
                Pogledajte našu ponudu sada!
              </Text>
            </Pressable>
          </Link>
        </View>

        <View className="bg-white rounded-3xl p-6 shadow-md mb-4">
          <View className="flex-row items-center mb-3">
            <IconSymbol size={24} name="menucard" color="#10b981" />
            <Text className="text-xl font-bold text-gray-900 ml-2">
              Kontakt
            </Text>
          </View>
          <Text className="text-gray-600 leading-6 mb-2">
            Imate pitanje ili posebnu želju za tortu? Pišite nam ili nas
            pozovite.
          </Text>
          <View className="mt-1">
            <Text className="text-gray-800 font-semibold">
              Telefon: <Text className="font-bold">+381 60 123 4567</Text>
            </Text>
            <Text className="text-gray-800 font-semibold mt-1">
              Email: <Text className="font-bold">tortica@example.com</Text>
            </Text>
            <Text className="text-gray-800 font-semibold mt-1">
              Adresa: <Text className="font-bold">Beograd, Srbija</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
