import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ExploreScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView 
        className="flex-1" 
        contentContainerClassName="p-5"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-8 mt-4">
          <View className="bg-white rounded-full p-6 mb-4 shadow-lg">
            <IconSymbol size={64} name="sparkles" color="#f87171" />
          </View>
          <Text className="text-4xl font-extrabold text-gray-900 mb-2">Explore</Text>
          <Text className="text-gray-500 text-center">Discover more about our cakes</Text>
        </View>

        <View className="bg-white rounded-3xl p-6 shadow-md mb-4">
          <View className="flex-row items-center mb-3">
            <IconSymbol size={24} name="star.fill" color="#fbbf24" />
            <Text className="text-xl font-bold text-gray-900 ml-2">Premium Quality</Text>
          </View>
          <Text className="text-gray-600 leading-6">
            We use only the finest ingredients to create our delicious cakes. Each cake is carefully crafted with love and attention to detail.
          </Text>
        </View>

        <View className="bg-white rounded-3xl p-6 shadow-md mb-4">
          <View className="flex-row items-center mb-3">
            <IconSymbol size={24} name="heart.fill" color="#ec4899" />
            <Text className="text-xl font-bold text-gray-900 ml-2">Made with Love</Text>
          </View>
          <Text className="text-gray-600 leading-6">
            Our bakers are passionate about creating the perfect cake for every occasion. From classic designs to modern bento cakes, we have something for everyone.
          </Text>
        </View>

        <View className="bg-white rounded-3xl p-6 shadow-md mb-4">
          <View className="flex-row items-center mb-3">
            <IconSymbol size={24} name="truck.box.fill" color="#3b82f6" />
            <Text className="text-xl font-bold text-gray-900 ml-2">Fresh Daily</Text>
          </View>
          <Text className="text-gray-600 leading-6">
            All our cakes are baked fresh daily to ensure the best taste and quality. Order now and experience the difference!
          </Text>
        </View>

        <View className="bg-pink-50 rounded-3xl p-6 mt-4 border-2 border-pink-100">
          <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">🎂</Text>
          <Text className="text-center text-gray-800 font-semibold text-lg mb-1">
            Ready to order?
          </Text>
          <Text className="text-center text-gray-600 text-sm">
            Browse our collection and add your favorite cakes to the cart!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
