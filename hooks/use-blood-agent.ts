import * as Location from "expo-location";
import { getDistance } from "geolib";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { supabase } from "../supabase";

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
  urgencyLevel?: string;
}

interface BloodAgentResult {
  currentLocation: LocationCoords | null;
  emergencyAlerts: EmergencyAlert[];
  setEmergencyAlerts: React.Dispatch<React.SetStateAction<EmergencyAlert[]>>;
  isAgentActive: boolean;
  acceptBloodRequest: (
    alert: EmergencyAlert,
    notes?: string,
  ) => Promise<boolean>;
  declineBloodRequest: (alert: EmergencyAlert) => Promise<boolean>;
  isLoading: boolean;
}

export const useBloodAgent = (userProfile: UserProfile): BloodAgentResult => {
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(
    null,
  );
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  const [isAgentActive, setIsAgentActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const locationRef = useRef<LocationCoords | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 1. Monitor Location GPS
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription;

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("❌ Location permission denied");
        return;
      }

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10,
          timeInterval: 5000,
        },
        (location) => {
          const newCoords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setCurrentLocation(newCoords);
          locationRef.current = newCoords;
          setIsAgentActive(true);
        },
      );
    };

    startTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  // 2. Accept Blood Request
  const acceptBloodRequest = async (
    alert: EmergencyAlert,
    notes?: string,
  ): Promise<boolean> => {
    setIsLoading(true);

    try {
      // Cek apakah sudah pernah merespon request ini
      const { data: existing } = await supabase
        .from("donor_responses")
        .select("id, response_status")
        .eq("request_id", alert.requestId)
        .eq("donor_id", userProfile.id)
        .single();

      if (existing) {
        if (existing.response_status === "accepted") {
          Alert.alert(
            "Info",
            "Anda sudah menyetujui permintaan ini sebelumnya",
          );
          return false;
        }
        if (existing.response_status === "completed") {
          Alert.alert("Info", "Permintaan ini sudah selesai");
          return false;
        }
      }

      // Insert or update response
      const { error } = await supabase.from("donor_responses").upsert(
        {
          request_id: alert.requestId,
          donor_id: userProfile.id,
          response_status: "accepted",
          notes: notes || null,
          responded_at: new Date().toISOString(),
        },
        {
          onConflict: "request_id,donor_id",
        },
      );

      if (error) throw error;

      // Hapus alert dari list
      setEmergencyAlerts((prev) =>
        prev.filter((a) => a.requestId !== alert.requestId),
      );

      Alert.alert(
        "✅ Berhasil!",
        `Anda telah menyetujui permintaan darah di ${alert.hospitalName}. Tim akan menghubungi Anda segera.`,
      );

      return true;
    } catch (error: any) {
      console.error("Error accepting request:", error);
      Alert.alert("Error", "Gagal menyetujui permintaan. Silakan coba lagi.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Decline Blood Request
  const declineBloodRequest = async (
    alert: EmergencyAlert,
  ): Promise<boolean> => {
    setIsLoading(true);

    try {
      const { error } = await supabase.from("donor_responses").upsert(
        {
          request_id: alert.requestId,
          donor_id: userProfile.id,
          response_status: "declined",
          responded_at: new Date().toISOString(),
        },
        {
          onConflict: "request_id,donor_id",
        },
      );

      if (error) throw error;

      // Hapus alert dari list
      setEmergencyAlerts((prev) =>
        prev.filter((a) => a.requestId !== alert.requestId),
      );

      return true;
    } catch (error: any) {
      console.error("Error declining request:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Fetch Blood Requests
  const fetchBloodRequests = useCallback(async () => {
    if (!locationRef.current || !userProfile.is_available) {
      return;
    }

    try {
      // Call RPC function
      const { data: requests, error } = await supabase.rpc(
        "get_active_blood_requests",
        {
          p_blood_type: userProfile.blood_type,
        },
      );

      if (error) {
        console.error("RPC Error:", error.message);
        return;
      }

      if (!requests || requests.length === 0) {
        setEmergencyAlerts([]);
        return;
      }

      // Get already responded requests
      const { data: responded } = await supabase
        .from("donor_responses")
        .select("request_id")
        .eq("donor_id", userProfile.id)
        .in("response_status", ["accepted", "declined", "completed"]);

      const respondedIds = new Set(responded?.map((r) => r.request_id) || []);

      const currentLoc = locationRef.current;
      const foundAlerts: EmergencyAlert[] = [];

      for (const req of requests) {
        // Skip if already responded
        if (respondedIds.has(req.request_id)) continue;

        if (!req.lat || !req.lng) continue;

        const hospitalLocation = {
          latitude: req.lat,
          longitude: req.lng,
        };

        const distanceMeters = getDistance(currentLoc, hospitalLocation);
        const distanceKm = distanceMeters / 1000;

        if (distanceMeters <= 5000) {
          foundAlerts.push({
            hospitalName: req.hospital_name,
            distance: distanceKm.toFixed(1),
            bagsNeeded: req.bags,
            bloodType: req.blood_type,
            requestId: req.request_id,
            urgencyLevel: req.urgency_level,
          });
        }
      }

      setEmergencyAlerts(foundAlerts);
    } catch (error: any) {
      console.error("Unexpected error:", error?.message || error);
    }
  }, [userProfile.blood_type, userProfile.is_available, userProfile.id]);

  // 5. Setup polling interval
  useEffect(() => {
    if (locationRef.current && userProfile.is_available) {
      setTimeout(() => {
        fetchBloodRequests();
      }, 1000);
    }

    intervalRef.current = setInterval(() => {
      if (locationRef.current && userProfile.is_available) {
        fetchBloodRequests();
      }
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchBloodRequests, userProfile.is_available]);

  return {
    currentLocation,
    emergencyAlerts,
    setEmergencyAlerts,
    isAgentActive,
    acceptBloodRequest,
    declineBloodRequest,
    isLoading,
  };
};
