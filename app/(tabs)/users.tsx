import { useEffect, useState } from 'react'
import { View, Text, FlatList, ActivityIndicator, RefreshControl, Pressable, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/src/lib/auth-context'
import { fetchAllUsers, updateUserRole, deleteUser, type AdminUser, type AppRole } from '@/src/lib/users-admin'

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('sr-RS', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getRoleColor(role: AppRole) {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-800'
    case 'user':
      return 'bg-blue-100 text-blue-800'
    case 'guest':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function UserCard({ 
  user, 
  onUpdateRole,
  onDelete 
}: { 
  user: AdminUser
  onUpdateRole: (userId: string, newRole: AppRole) => void
  onDelete: (userId: string) => void
}) {
  const { user: currentUser } = useAuth()
  const isCurrentUser = currentUser.id === user.id

  return (
    <View className="rounded-2xl border border-gray-200 bg-white p-5 mb-4 shadow-sm">
      {/* Header */}
      <View className="flex-row items-start justify-between mb-4">
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900 mb-1">
            {user.first_name || user.last_name
              ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
              : 'Korisnik bez imena'}
          </Text>
          <Text className="text-sm text-gray-500 mb-1">
            {user.email || 'Nema email'}
          </Text>
          <Text className="text-xs text-gray-400">
            Registrovan: {formatDate(user.created_at)}
          </Text>
        </View>
        <View className={`px-3 py-1 rounded-full ${getRoleColor(user.role)}`}>
          <Text className="text-xs font-semibold capitalize">
            {user.role === 'admin' ? 'Admin' : user.role === 'user' ? 'Korisnik' : 'Gost'}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View className="mb-4 pb-4 border-b border-gray-100">
        <Text className="text-sm text-gray-600">
          Broj narudžbina: <Text className="font-semibold text-gray-900">{user.order_count}</Text>
        </Text>
      </View>

      {/* Actions */}
      <View className="flex-row gap-3">
        {/* Role Selector */}
        <View className="flex-1">
          <Text className="text-xs font-semibold text-gray-500 mb-2">Uloga</Text>
          <View className="flex-row gap-2">
            {(['user', 'admin'] as AppRole[]).map((role) => {
              const isCurrentRole = user.role === role
              const isDisabled = isCurrentUser || isCurrentRole
              
              return (
                <Pressable
                  key={role}
                  disabled={isDisabled}
                  onPress={() => onUpdateRole(user.id, role)}
                  className={`flex-1 rounded-xl py-2 ${
                    isCurrentRole
                      ? 'bg-black'
                      : 'bg-gray-100 border border-gray-300'
                  } ${isDisabled ? 'opacity-50' : ''}`}
                >
                  <Text
                    className={`text-center text-xs font-bold ${
                      isCurrentRole ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {role === 'admin' ? 'Admin' : 'Korisnik'}
                  </Text>
                </Pressable>
              )
            })}
          </View>
          {isCurrentUser && (
            <Text className="text-xs text-gray-500 mt-1 text-center">
              Ne možete menjati svoju ulogu
            </Text>
          )}
        </View>

        {/* Delete Button */}
        <Pressable
          disabled={isCurrentUser}
          onPress={() => onDelete(user.id)}
          className={`rounded-xl bg-red-600 px-4 py-2 justify-center ${
            isCurrentUser ? 'opacity-50' : 'active:opacity-80'
          }`}
        >
          <Text className="text-white font-bold text-xs">Obriši</Text>
        </Pressable>
      </View>
    </View>
  )
}

export default function UsersScreen() {
  const { user } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadUsers = async () => {
    try {
      const data = await fetchAllUsers()
      setUsers(data)
    } catch (error: any) {
      console.error('Failed to load users:', error)
      Alert.alert('Greška', error.message || 'Neuspešno učitavanje korisnika')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (user.role === 'admin') {
      loadUsers()
    }
  }, [user.role])

  const onRefresh = () => {
    setRefreshing(true)
    loadUsers()
  }

  const handleUpdateRole = async (userId: string, newRole: AppRole) => {
    // Find the user to check current role
    const userToUpdate = users.find((u) => u.id === userId)
    
    // If role is already the same, don't show dialog
    if (userToUpdate?.role === newRole) {
      return
    }

    Alert.alert(
      'Promeni ulogu',
      `Da li ste sigurni da želite da promenite ulogu korisnika u "${newRole === 'admin' ? 'Admin' : 'Korisnik'}"?`,
      [
        {
          text: 'Otkaži',
          style: 'cancel',
        },
        {
          text: 'Potvrdi',
          onPress: async () => {
            try {
              await updateUserRole(userId, newRole)
              await loadUsers()
            } catch (error: any) {
              Alert.alert('Greška', error.message || 'Neuspešna promena uloge')
            }
          },
        },
      ]
    )
  }

  const handleDelete = async (userId: string) => {
    const userToDelete = users.find((u) => u.id === userId)
    const userName = userToDelete?.first_name || userToDelete?.last_name
      ? `${userToDelete.first_name || ''} ${userToDelete.last_name || ''}`.trim()
      : userToDelete?.email || userId
      
    Alert.alert(
      'Obriši korisnika',
      `Da li ste sigurni da želite da obrišete korisnika "${userName}"?\n\nOva akcija će obrisati profil korisnika. Za potpuno brisanje auth naloga koristite Supabase dashboard.`,
      [
        {
          text: 'Otkaži',
          style: 'cancel',
        },
        {
          text: 'Obriši',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(userId)
              Alert.alert('Uspešno', 'Profil korisnika je obrisan')
              await loadUsers()
            } catch (error: any) {
              Alert.alert('Greška', error.message || 'Neuspešno brisanje korisnika')
            }
          },
        },
      ]
    )
  }

  if (user.role !== 'admin') {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 px-5 pt-6">
          <Text className="text-4xl font-extrabold text-gray-900 mb-4">
            Korisnici
          </Text>
          <Text className="text-gray-600">
            Morate biti admin da biste videli korisnike.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 px-5 pt-6">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-4xl font-extrabold text-gray-900">
            Korisnici
          </Text>
          <Pressable
            onPress={onRefresh}
            className="rounded-xl bg-gray-100 px-4 py-2 active:opacity-70"
          >
            <Text className="font-semibold text-gray-700">Refresh</Text>
          </Pressable>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#000" />
            <Text className="text-gray-500 mt-4">Učitavanje korisnika...</Text>
          </View>
        ) : users.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-6xl mb-4">👥</Text>
            <Text className="text-gray-500 text-center text-lg font-medium">
              Još uvek nema korisnika.
            </Text>
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <UserCard
                user={item}
                onUpdateRole={handleUpdateRole}
                onDelete={handleDelete}
              />
            )}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    </SafeAreaView>
  )
}

