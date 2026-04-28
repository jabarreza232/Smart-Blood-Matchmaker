import { useState, useEffect, useRef } from 'react';
import { getDistance } from 'geolib';
import * as Location from 'expo-location';
import { supabase } from '../supabase';

// --- Interfaces (Tetap Sama) ---
export interface UserProfile {
  id: string;
  name: string;
  blood_type: string;
  is_available: boolean;
}

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface EmergencyAlert {
  hospitalName: string;
  distance: string;
  bagsNeeded: number;
  bloodType: string;
  requestId: string;
}

interface BloodAgentResult {
  currentLocation: LocationCoords | null;
  emergencyAlerts: EmergencyAlert[]; // Pakai Array
  setEmergencyAlerts: React.Dispatch<React.SetStateAction<EmergencyAlert[]>>;
  isAgentActive: boolean;
}

export const useBloodAgent = (userProfile: UserProfile): BloodAgentResult => {
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  const [isAgentActive, setIsAgentActive] = useState<boolean>(false);

  const locationRef = useRef<LocationCoords | null>(null);

  // 1. Monitor Lokasi (GPS) - Tetap Aktif
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription;

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10,
        },
        (location) => {
          const newCoords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setCurrentLocation(newCoords);
          locationRef.current = newCoords;
          setIsAgentActive(true);
        }
      );
    };

    startTracking();
    return () => { if (locationSubscription) locationSubscription.remove(); };
  }, []);

  // 2. Logic Fetching (Pengganti Realtime)
  useEffect(() => {
    const fetchBloodRequests = async () => {
      const currentLoc = locationRef.current;
      if (!currentLoc) return;

      console.log("🔍 Agen Otonom: Memindai permintaan darah...");

      // Fetch permintaan yang statusnya 'Active' dan tipe darah cocok
      const { data: requests, error } = await supabase
        .rpc('get_active_blood_requests', { p_blood_type: userProfile.blood_type });
      // Kemudian ganti hospital.location menjadi hospital.location_text
      if (error) {
        console.error("❌ Fetch Error:", error.message);
        return;
      }

      if (requests && requests.length > 0) {
        const foundAlerts: EmergencyAlert[] = []; // Penampung sementara
        // Tambahkan log jarak di sini
        for (const req of requests) {
          console.log("Isi data dari DB:", req);
          const hospitalLocation = {
            latitude: req.lat,
            longitude: req.lng
          };
          const distMeters = getDistance(currentLoc, hospitalLocation);
          if (distMeters <= 5000) {
            foundAlerts.push({
              hospitalName: req.hospital_name,
              distance: (distMeters / 1000).toFixed(1),
              bagsNeeded: req.bags,
              bloodType: req.blood_type,
              requestId: req.request_id
            });
          }


        }
        setEmergencyAlerts(foundAlerts); // Update semua sekaligus
      }
    };

    // Jalankan fetch pertama kali
    fetchBloodRequests();

    // Set interval untuk polling setiap 30 detik
    const intervalId = setInterval(fetchBloodRequests, 30000);

    return () => clearInterval(intervalId);
  }, [userProfile.blood_type, isAgentActive]); // Trigger ulang jika profile berubah

  return { currentLocation, emergencyAlerts, setEmergencyAlerts, isAgentActive };
};