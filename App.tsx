import React from "react";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MobileLabBikeRepository } from "./src/features/bikes/data/mobilelabRepository";
import { BikeStore } from "./src/features/bikes/presentation/store";
import { BikeApp } from "./src/features/bikes/presentation/BikeApp";

const endpoint =
  process.env.EXPO_PUBLIC_MOBILELAB_URL ||
  (Platform.OS === "android"
    ? "http://10.0.2.2:4566"
    : "http://127.0.0.1:4566");
const store = new BikeStore(new MobileLabBikeRepository(endpoint));

export default function App() {
  return (
    <SafeAreaProvider>
      <BikeApp store={store} endpoint={endpoint} />
    </SafeAreaProvider>
  );
}
