import { Pressable, StyleSheet, Text, View } from "react-native";

// Section 8.1: four questions, all out of 10, direction convention higher = better.
export function ScaleInput({
  label,
  lowLabel,
  highLabel,
  value,
  onChange,
}: {
  label: string;
  lowLabel: string;
  highLabel: string;
  value: number | null;
  onChange: (value: number) => void;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            style={[styles.cell, value === n && styles.cellSelected]}
            testID={`${label}-${n}`}
          >
            <Text style={[styles.cellText, value === n && styles.cellTextSelected]}>{n}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.captions}>
        <Text style={styles.caption}>{lowLabel}</Text>
        <Text style={styles.caption}>{highLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  cell: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  cellSelected: { backgroundColor: "#1a73e8", borderColor: "#1a73e8" },
  cellText: { fontSize: 12, color: "#333" },
  cellTextSelected: { color: "#fff", fontWeight: "700" },
  captions: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  caption: { fontSize: 11, color: "#888" },
});
