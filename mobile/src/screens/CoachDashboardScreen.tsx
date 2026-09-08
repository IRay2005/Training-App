import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";

type Client = Awaited<ReturnType<typeof api.coachDashboard>>["clients"][number];

const COLORS: Record<string, string> = { GREEN: "#2e7d32", AMBER: "#ed6c02", RED: "#c62828" };

function ClientRow({ client }: { client: Client }) {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: COLORS[client.readiness.color] ?? "#999" }]} />
      <View style={styles.rowBody}>
        <Text style={styles.name}>{client.name}</Text>
        <Text style={styles.reason}>{client.readiness.breakdown.readinessContribution}</Text>
      </View>
      <Text style={styles.score}>{client.readiness.score}</Text>
    </View>
  );
}

export default function CoachDashboardScreen() {
  const { token, user, signOut } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    api
      .coachDashboard(token)
      .then((res) => setClients(res.clients))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(load, [load]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hi {user?.name}</Text>
        <Pressable onPress={signOut}>
          <Text style={styles.signOut}>Sign out</Text>
        </Pressable>
      </View>
      <Text style={styles.sectionTitle}>Clients — ranked by what needs attention</Text>
      <FlatList
        data={clients}
        keyExtractor={(item) => item.athleteId}
        renderItem={({ item }) => <ClientRow client={item} />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No athletes yet.</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingBottom: 0, backgroundColor: "#fff" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  greeting: { fontSize: 20, fontWeight: "700" },
  signOut: { color: "#1a73e8" },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#666", textTransform: "uppercase", marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  rowBody: { flex: 1 },
  name: { fontSize: 16, fontWeight: "600" },
  reason: { fontSize: 13, color: "#666" },
  score: { fontSize: 20, fontWeight: "700" },
  separator: { height: 1, backgroundColor: "#eee" },
  empty: { textAlign: "center", color: "#888", marginTop: 40 },
});
