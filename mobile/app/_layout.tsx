import { Stack } from "expo-router";
import AuthProvider from "../context/AuthContext";
import NavHeader from "../components/NavHeader";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          header: () => <NavHeader />,
        }}
      />
    </AuthProvider>
  );
}
