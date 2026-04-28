import React from 'react';
import {
  Alert,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmergencyAlert, useBloodAgent, UserProfile } from '../hooks/use-blood-agent';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // Pastikan sudah install expo-icons

const myProfile: UserProfile = {
  id: '22222222-2222-2222-2222-222222222225',
  name: 'Ahmad Budi',
  blood_type: 'O-',
  is_available: true,
};

const App: React.FC = () => {
  // 1. Ambil emergencyAlerts (Array) dari hook
  const { currentLocation, emergencyAlerts, setEmergencyAlerts, isAgentActive } = useBloodAgent(myProfile);

  const handleAccept = (alert: EmergencyAlert): void => {
    Alert.alert(
      "Konfirmasi Kehadiran",
      `Apakah Anda bersedia menuju ${alert.hospitalName}?`,
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "YA, SAYA MENUJU SANA", 
          onPress: () => {
            // Hapus alert ini saja dari daftar setelah diterima
            setEmergencyAlerts(prev => prev.filter(a => a.requestId !== alert.requestId));
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      {/* HEADER SECTION (Tetap sama) */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.welcomeText}>Halo, Pahlawan!</Text>
          <Text style={styles.userName}>{myProfile.name}</Text>
        </View>
        <View style={styles.bloodBadge}>
          <Text style={styles.bloodType}>{myProfile.blood_type}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* STATUS CARD (Tetap sama) */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: isAgentActive ? '#4CAF50' : '#FF5252' }]} />
            <Text style={styles.statusText}>
              {isAgentActive ? 'Agen Aktif Memantau' : 'Menghubungkan GPS...'}
            </Text>
          </View>
          {currentLocation && (
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={16} color="#666" />
              <Text style={styles.locationText}>
                {currentLocation.latitude.toFixed(5)}, {currentLocation.longitude.toFixed(5)}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>
          Permintaan Terdekat ({emergencyAlerts.length})
        </Text>

        {/* LIST ALERT SECTION */}
        {emergencyAlerts.length > 0 ? (
          emergencyAlerts.map((alert, index) => (
            <View key={alert.requestId || index} style={[styles.alertCard, { marginBottom: 20 }]}>
              <View style={styles.alertHeader}>
                <MaterialCommunityIcons name="alert-decagram" size={24} color="#D32F2F" />
                <Text style={styles.urgentTag}>DARURAT #{index + 1}</Text>
              </View>

              <View style={styles.mainInfo}>
                <View style={styles.infoBlock}>
                  <Text style={styles.infoLabel}>Dibutuhkan</Text>
                  <Text style={styles.infoValue}>{alert.bagsNeeded} <Text style={styles.infoUnit}>Kantong</Text></Text>
                </View>
                <View style={[styles.infoBlock, styles.borderLeft]}>
                  <Text style={styles.infoLabel}>Gol. Darah</Text>
                  <Text style={[styles.infoValue, { color: '#D32F2F' }]}>{alert.bloodType}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.hospitalInfo}>
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons name="hospital-building" size={20} color="#D32F2F" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.hospitalName}>{alert.hospitalName}</Text>
                  <Text style={styles.distanceText}>📍 {alert.distance} km dari lokasi Anda</Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.ignoreButton}
                  onPress={() => {
                    // Hapus satu item ini dari array
                    setEmergencyAlerts(prev => prev.filter(a => a.requestId !== alert.requestId));
                  }}
                >
                  <Text style={styles.ignoreText}>Abaikan</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.acceptButton}
                  onPress={() => handleAccept(alert)}
                >
                  <Text style={styles.acceptText}>SAYA BERSEDIA</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="shield-check" size={80} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>Semua Aman</Text>
            <Text style={styles.emptySubtitle}>Belum ada permintaan darah yang mendesak di sekitar Anda.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { padding: 20 },
  
  // Header
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, paddingHorizontal: 5 },
  welcomeText: { fontSize: 16, color: '#666' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A' },
  bloodBadge: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  bloodType: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

  // Status Card
  statusCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, marginBottom: 25 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: 14, fontWeight: '600', color: '#444' },
  locationContainer: { flexDirection: 'row', alignItems: 'center' },
  locationText: { fontSize: 12, color: '#888', marginLeft: 4 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 15 },

  // Emergency Card
  alertCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, elevation: 8, shadowColor: '#D32F2F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, borderWidth: 1, borderColor: '#FFE0E0' },
  alertHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  urgentTag: { color: '#D32F2F', fontWeight: '800', fontSize: 14, marginLeft: 6, letterSpacing: 1 },
  
  mainInfo: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  infoBlock: { flex: 1, alignItems: 'center' },
  borderLeft: { borderLeftWidth: 1, borderLeftColor: '#EEE' },
  infoLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  infoValue: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A' },
  infoUnit: { fontSize: 14, fontWeight: 'normal', color: '#666' },

  divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 20 },
  
  hospitalInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF5F5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  hospitalName: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A' },
  distanceText: { fontSize: 13, color: '#666', marginTop: 2 },

  actionButtons: { flexDirection: 'row', gap: 12 },
  ignoreButton: { flex: 1, paddingVertical: 15, borderRadius: 12, backgroundColor: '#F5F5F5', alignItems: 'center' },
  ignoreText: { color: '#666', fontWeight: '600' },
  acceptButton: { flex: 2, flexDirection: 'row', paddingVertical: 15, borderRadius: 12, backgroundColor: '#D32F2F', alignItems: 'center', justifyContent: 'center', gap: 8 },
  acceptText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

  // Empty State
  emptyState: { alignItems: 'center', marginTop: 40, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#BBB', marginTop: 15 },
  emptySubtitle: { fontSize: 14, color: '#CCC', textAlign: 'center', marginTop: 8, lineHeight: 20 },
});

export default App;