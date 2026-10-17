import { ThemedView } from "@/components/themed-view";
import { StyleSheet } from "react-native";

export default function ProfileScreen() {
  return <ThemedView style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
