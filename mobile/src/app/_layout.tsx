import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: "#172554",
        headerStyle: {
          backgroundColor: "#F4F6F9",
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />

      <Stack.Screen name="posts/[id]" options={{ title: "Postagem" }} />
    </Stack>
  );
}
