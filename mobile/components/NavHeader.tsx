import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function NavHeader() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: 38,
        paddingBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Pressable onPress={() => router.push("/")}>
        <Text style={styles.title}>자리차지</Text>
      </Pressable>

      <View style={{ flex: 1 }} />

      {user ? (
        <Pressable onPress={() => router.push("/profile")}>
          <Text style={styles.link}>{user.username || "내 프로필"}</Text>
        </Pressable>
      ) : (
        <>
          <Pressable onPress={() => router.push("/login")}>
            <Text style={styles.link}>로그인</Text>
          </Pressable>

          <Pressable onPress={() => router.push("/register")}>
            <Text style={styles.link}>회원가입</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "white",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  link: {
    fontSize: 14,
    marginLeft: 12,
    color: "#007AFF",
  },
});
