import { StyleSheet, Text, View } from "react-native";

const COLORS: Record<string, string> = { GREEN: "#2e7d32", AMBER: "#ed6c02", RED: "#c62828" };

export function ReadinessBadge({ color, score }: { color: string; score: number }) {
  return (
    <View style={[styles.badge, { backgroundColor: COLORS[color] ?? "#999" }]}>
      <Text style={styles.text}>{color}</Text>
      <Text style={styles.score}>{score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, alignItems: "center" },
  text: { color: "#fff", fontWeight: "700", fontSize: 16, letterSpacing: 1 },
  score: { color: "#fff", fontSize: 28, fontWeight: "800" },
});
