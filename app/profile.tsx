import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";

export default function ProfileScreen() {
  const { profile, updateProfile, signOut, loading } = useAuth();
  const [isAvailable, setIsAvailable] = useState<boolean>(
    profile?.is_available || true,
  );
  const [updating, setUpdating] = useState(false);

  const handleToggleAvailability = async (value: boolean) => {
    setIsAvailable(value);
    setUpdating(true);
    await updateProfile({ is_available: value });
    setUpdating(false);
  };

  const handleLogout = async () => {
    Alert.alert("Konfirmasi Logout", "Apakah Anda yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  if (loading || !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D32F2F" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile.blood_type}</Text>
            </View>
          </View>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.email}>{profile.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Pribadi</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Golongan Darah</Text>
            <Text style={styles.infoValue}>{profile.blood_type}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={styles.statusRow}>
              <Switch
                value={isAvailable}
                onValueChange={handleToggleAvailability}
                disabled={updating}
                trackColor={{ false: "#767577", true: "#4CAF50" }}
                thumbColor={isAvailable ? "#FFF" : "#F4F3F4"}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: isAvailable ? "#4CAF50" : "#999" },
                ]}
              >
                {isAvailable ? "Siap Donor" : "Sedang Tidak Tersedia"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistik</Text>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Total Donasi</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Poin Kemanusiaan</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FFF" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    alignItems: "center",
    padding: 30,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  avatarContainer: { marginBottom: 15 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#D32F2F",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 32, fontWeight: "bold", color: "#FFF" },
  name: { fontSize: 24, fontWeight: "bold", color: "#333" },
  email: { fontSize: 14, color: "#666", marginTop: 5 },
  section: {
    backgroundColor: "#FFF",
    marginTop: 15,
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  infoLabel: { fontSize: 16, color: "#666" },
  infoValue: { fontSize: 16, fontWeight: "600", color: "#333" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusText: { fontSize: 14, fontWeight: "500" },
  statsRow: { flexDirection: "row", justifyContent: "space-around" },
  statCard: { alignItems: "center", flex: 1 },
  statNumber: { fontSize: 28, fontWeight: "bold", color: "#D32F2F" },
  statLabel: { fontSize: 12, color: "#666", marginTop: 5 },
  logoutButton: {
    flexDirection: "row",
    backgroundColor: "#D32F2F",
    margin: 15,
    padding: 15,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  logoutText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  version: {
    textAlign: "center",
    color: "#999",
    fontSize: 12,
    marginBottom: 20,
  },
});
