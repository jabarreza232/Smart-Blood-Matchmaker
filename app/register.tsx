import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../supabase";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !name || !bloodType) {
      Alert.alert("Error", "Semua field harus diisi");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password minimal 6 karakter");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Password dan konfirmasi password tidak sama");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: {
          name: name,
          blood_type: bloodType.toUpperCase(),
        },
      },
    });

    if (error) {
      Alert.alert("Register Gagal", error.message);
    } else {
      Alert.alert(
        "Sukses",
        "Pendaftaran berhasil! Silakan login dengan akun Anda.",
        [{ text: "OK", onPress: () => router.replace("/") }],
      );
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Daftar Akun Baru</Text>
        <Text style={styles.subtitle}>Bergabunglah menjadi pahlawan darah</Text>

        <TextInput
          style={styles.input}
          placeholder="Nama Lengkap"
          value={name}
          onChangeText={setName}
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Golongan Darah (A, B, AB, O)"
          value={bloodType}
          onChangeText={setBloodType}
          autoCapitalize="characters"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Password (min 6 karakter)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Konfirmasi Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          editable={!loading}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Daftar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} disabled={loading}>
          <Text style={styles.loginText}>Sudah punya akun? Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  innerContainer: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#D32F2F",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 30,
    color: "#666",
  },
  input: {
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#DDD",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#D32F2F",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
  loginText: {
    textAlign: "center",
    marginTop: 20,
    color: "#D32F2F",
    fontSize: 14,
  },
});
