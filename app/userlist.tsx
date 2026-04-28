import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../supabase';

interface User {
  id: string;
  name: string;
  bloodType: string;
  distance?: string;
  status: 'Available' | 'Away';
}

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*');

    if (error) {
      console.log('❌ Error:', error);
      return;
    }

    // 🔥 FIX: pastikan data ada
    const mapped = (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      bloodType: item.blood_type,
      distance: 'Unknown',
      status: item.status ? 'Available' : 'Away',
    }));

    setUsers(mapped);
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
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
        <View style={[
          styles.statusDot, 
          { backgroundColor: item.status === 'Available' ? '#4CAF50' : '#FFC107' }
        ]} />
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pendonor Terdekat</Text>
        <Text style={styles.headerSub}>Radius 5km dari RS UI Depok</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Tidak ada pendonor ditemukan.
          </Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSub: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    // Shadow untuk iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Elevation untuk Android
    elevation: 3,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF5350',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D32F2F',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  userDistance: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#888',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#999',
  }
});

export default UserList;