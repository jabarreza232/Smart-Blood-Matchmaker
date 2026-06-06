import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';

interface User {
  id: string;
  name: string;
  bloodType: string;
  distance?: string;
  status: 'Available' | 'Away';
}

export default function DonorsScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile) {
      fetchNearbyDonors();
    }
  }, [profile]);

  const fetchNearbyDonors = async () => {
    try {
      // Try user_profiles table first
      let { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('is_available', true)
        .neq('id', profile?.id);

      // Fallback to users table
      if (error && error.code === '42P01') {
        const { data: oldData, error: oldError } = await supabase
          .from('users')
          .select('*')
          .eq('is_available', true)
          .neq('id', profile?.id);
        
        if (!oldError) {
          data = oldData;
        }
      }

      if (error && error.code !== '42P01') {
        console.log('Error fetching donors:', error);
      }

      const mapped = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        bloodType: item.blood_type,
        distance: Math.floor(Math.random() * 5) + 1 + ' km', // Mock distance
        status: 'Available',
      }));

      setUsers(mapped);
    } catch (error) {
      console.log('Fetch donors error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D32F2F" />
        <Text style={styles.loadingText}>Memuat daftar pendonor...</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.bloodType}</Text>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userDistance}>
          📍 {item.distance} dari lokasi Anda
        </Text>
      </View>

      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pendonor Terdekat</Text>
        <Text style={styles.headerSub}>Siap membantu kapan saja</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Belum ada pendonor yang tersedia saat ini.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#666' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  headerSub: { fontSize: 14, color: '#777', marginTop: 4 },
  listContent: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EF5350' },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: '#D32F2F' },
  infoContainer: { flex: 1, marginLeft: 16 },
  userName: { fontSize: 16, fontWeight: '600', color: '#222' },
  userDistance: { fontSize: 13, color: '#666', marginTop: 2 },
  statusContainer: { alignItems: 'flex-end' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 4 },
  statusText: { fontSize: 12, color: '#888' },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { textAlign: 'center', color: '#999' },
});