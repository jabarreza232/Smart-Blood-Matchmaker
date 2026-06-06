// app/(tabs)/history.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../supabase";

interface DonationHistory {
  id: string;
  request_id: string;
  response_status: string;
  responded_at: string;
  blood_type: string;
  bags_needed: number;
  urgency_level: string;
  hospital_name: string;
  hospital_address: string;
}

interface DonorStats {
  total_donations: number;
  total_bags_donated: number;
  total_points: number;
}

export default function HistoryScreen() {
  const { profile } = useAuth();
  const [history, setHistory] = useState<DonationHistory[]>([]);
  const [stats, setStats] = useState<DonorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!profile) return;

    try {
      // Fetch donation history
      const { data: historyData, error: historyError } = await supabase
        .from("donor_responses")
        .select(
          `
          id,
          request_id,
          response_status,
          responded_at,
          blood_requests!inner (
            required_blood,
            bags_needed,
            urgency_level,
            hospitals!inner (
              name,
              address
            )
          )
        `,
        )
        .eq("donor_id", profile.id)
        .in("response_status", ["accepted", "completed"])
        .order("responded_at", { ascending: false });

      if (historyError) throw historyError;

      const formattedHistory: DonationHistory[] = (historyData || []).map(
        (item: any) => ({
          id: item.id,
          request_id: item.request_id,
          response_status: item.response_status,
          responded_at: item.responded_at,
          blood_type: item.blood_requests.required_blood,
          bags_needed: item.blood_requests.bags_needed,
          urgency_level: item.blood_requests.urgency_level,
          hospital_name: item.blood_requests.hospitals.name,
          hospital_address: item.blood_requests.hospitals.address,
        }),
      );

      setHistory(formattedHistory);

      // Fetch stats
      const { data: statsData, error: statsError } = await supabase.rpc(
        "get_donor_stats",
        { p_donor_id: profile.id },
      );

      if (!statsError && statsData && statsData.length > 0) {
        setStats(statsData[0]);
      } else {
        setStats({
          total_donations: formattedHistory.length,
          total_bags_donated: formattedHistory.reduce(
            (sum, h) => sum + h.bags_needed,
            0,
          ),
          total_points: formattedHistory.reduce(
            (sum, h) => sum + h.bags_needed * 10,
            0,
          ),
        });
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case "Critical":
        return "#D32F2F";
      case "High":
        return "#FF9800";
      default:
        return "#4CAF50";
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "completed") {
      return { text: "SELESAI", color: "#4CAF50", bg: "#E8F5E9" };
    }
    return { text: "DITERIMA", color: "#FF9800", bg: "#FFF3E0" };
  };

  const renderHistoryItem = ({ item }: { item: DonationHistory }) => {
    const status = getStatusBadge(item.response_status);

    return (
      <TouchableOpacity style={styles.historyCard}>
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.bloodBadge,
              { backgroundColor: getUrgencyColor(item.urgency_level) },
            ]}
          >
            <Text style={styles.bloodBadgeText}>{item.blood_type}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.text}
            </Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.hospitalInfo}>
            <MaterialCommunityIcons
              name="hospital-building"
              size={20}
              color="#D32F2F"
            />
            <Text style={styles.hospitalName}>{item.hospital_name}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="water" size={16} color="#666" />
              <Text style={styles.detailText}>{item.bags_needed} Kantong</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="calendar" size={16} color="#666" />
              <Text style={styles.detailText}>
                {formatDate(item.responded_at)}
              </Text>
            </View>
          </View>

          {item.hospital_address && (
            <View style={styles.addressContainer}>
              <Ionicons name="location" size={14} color="#999" />
              <Text style={styles.addressText}>{item.hospital_address}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderStats = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total_donations}</Text>
          <Text style={styles.statLabel}>Total Donasi</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total_bags_donated}</Text>
          <Text style={styles.statLabel}>Kantong Darah</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total_points}</Text>
          <Text style={styles.statLabel}>Poin</Text>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D32F2F" />
        <Text style={styles.loadingText}>Memuat riwayat donasi...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Riwayat Donasi</Text>
        <Text style={styles.headerSub}>Jejak kebaikan Anda</Text>
      </View>

      {renderStats()}

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderHistoryItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#D32F2F"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="heart-outline"
              size={80}
              color="#E0E0E0"
            />
            <Text style={styles.emptyTitle}>Belum Ada Riwayat</Text>
            <Text style={styles.emptySubtitle}>
              Anda belum pernah merespon permintaan darah.{"\n"}
              Jadilah pahlawan pertama!
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#666" },

  header: {
    padding: 20,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#333" },
  headerSub: { fontSize: 14, color: "#777", marginTop: 4 },

  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    margin: 15,
    marginTop: 15,
    borderRadius: 16,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statCard: { flex: 1, alignItems: "center" },
  statNumber: { fontSize: 24, fontWeight: "bold", color: "#D32F2F" },
  statLabel: { fontSize: 12, color: "#666", marginTop: 4 },
  statDivider: { width: 1, backgroundColor: "#EEE" },

  listContent: { padding: 15, paddingTop: 0 },

  historyCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginBottom: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  bloodBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  bloodBadgeText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  cardContent: { padding: 15 },
  hospitalInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  hospitalName: { fontSize: 16, fontWeight: "600", color: "#333", flex: 1 },
  detailRow: { flexDirection: "row", gap: 20, marginBottom: 12 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailText: { fontSize: 13, color: "#666" },
  addressContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 4,
  },
  addressText: { fontSize: 12, color: "#999", flex: 1, lineHeight: 16 },

  emptyContainer: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#BBB",
    marginTop: 15,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#CCC",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});
