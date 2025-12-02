import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function Login() {
    const router = useRouter();
    const { handleLogin, loading } = useAuth();
    const [form, setForm] = useState({ username: "", password: "" });

    const onSubmit = async () => {
        const ok = await handleLogin(form);
        if (ok) router.push("/");
        else alert("로그인 실패");
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>로그인</Text>

            <TextInput
                style={styles.input}
                placeholder="아이디"
                value={form.username}
                onChangeText={(t) => setForm({ ...form, username: t })}
            />
            <TextInput
                style={styles.input}
                placeholder="비밀번호"
                secureTextEntry
                value={form.password}
                onChangeText={(t) => setForm({ ...form, password: t })}
            />

            <Pressable disabled={loading} onPress={onSubmit} style={styles.button}>
                <Text style={styles.buttonText}>
                    {loading ? "처리 중…" : "로그인"}
                </Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: "bold",
        marginBottom: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
    },
    button: {
        backgroundColor: "#007AFF",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    buttonText: {
        color: "white",
        fontSize: 16,
    },
});
