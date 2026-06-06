// app/(tabs)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Tabs, router } from "expo-router";
import { useEffect } from "react";
import { TouchableOpacity } from "react-native";
import { useAuth } from "../../contexts/AuthContext";

export default function TabLayout() {
  const { session, signOut } = useAuth();

  useEffect(() => {
    if (!session) {
      router.replace("/");
    }
  }, [session]);

  if (!session) {
    return null;
  }

  const handleLogout = async () => {
    await signOut();
    router.replace("/");
  };

  return (
    <Tabs
      screenOptions={{
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
            <Ionicons name="log-out-outline" size={24} color="#D32F2F" />
          </TouchableOpacity>
        ),
        tabBarActiveTintColor: "#D32F2F",
        tabBarInactiveTintColor: "#999",
        headerStyle: { backgroundColor: "#FFF" },
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="donors"
        options={{
          title: "Donors",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Riwayat",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
