import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { api, ApiError } from "../api";
import { useAuth } from "../auth/AuthContext";
import { ReadinessBadge } from "../components/ReadinessBadge";
import { ScaleInput } from "../components/ScaleInput";

type Reading = Awaited<ReturnType<typeof api.todayReadiness>>;

export default function AthleteHomeScreen() {
  const { token, user, signOut } = useAuth();
  const [reading, setReading] = useState<Reading | null>(null);
  const [loadingReading, setLoadingReading] = useState(true);

  const [sorenessFatigue, setSorenessFatigue] = useState<number | null>(null);
  const [stress, setStress] = useState<number | null>(null);
  const [moodMotivation, setMoodMotivation] = useState<number | null>(null);
  const [hasPain, setHasPain] = useState(false);
  const [painLocation, setPainLocation] = useState("");
  const [painSeverity, setPainSeverity] = useState<number | null>(null);
  const [sleepSelfReport, setSleepSelfReport] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const loadReading = useCallback(() => {
    if (!token) return;
    setLoadingReading(true);
    api
      .todayReadiness(token)
      .then(setReading)
      .catch(() => setReading(null))
      .finally(() => setLoadingReading(false));
  }, [token]);

  useEffect(loadReading, [loadReading]);

  const canSubmit =
    sorenessFatigue !== null &&
    stress !== null &&
    moodMotivation !== null &&
    (!hasPain || painSeverity !== null);

  async function handleSubmit() {
    if (!token || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.submitDailyEntry(token, {
        sorenessFatigue: sorenessFatigue!,
        stress: stress!,
        moodMotivation: moodMotivation!,
        hasPain,
        painLocation: hasPain ? painLocation : undefined,
        painSeverity: hasPain ? painSeverity! : undefined,
        sleepSelfReport: sleepSelfReport ?? undefined,
      });
      setSubmitted(true);
      loadReading();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not submit entry.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hi {user?.name}</Text>
        <Pressable onPress={signOut}>
          <Text style={styles.signOut}>Sign out</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Today's readiness</Text>
      {loadingReading ? (
        <Text>Loading…</Text>
      ) : reading ? (
        <View style={styles.readinessCard}>
          <ReadinessBadge color={reading.color} score={reading.score} />
          <Text style={styles.breakdownLine}>{reading.breakdown.readinessContribution}</Text>
          <Text style={styles.breakdownLine}>{reading.breakdown.confidenceContribution}</Text>
        </View>
      ) : (
        <Text>No reading yet — submit today's entry below.</Text>
      )}

      <Text style={styles.sectionTitle}>Daily entry</Text>
      {submitted ? (
        <Text style={styles.submittedNote}>Today's entry has been recorded. You can update it below.</Text>
      ) : null}

      <ScaleInput
        label="How fresh does your body feel today?"
        lowLabel="Very sore/exhausted"
        highLabel="Completely fresh"
        value={sorenessFatigue}
        onChange={setSorenessFatigue}
      />
      <ScaleInput
        label="How calm or stressed do you feel?"
        lowLabel="Very stressed"
        highLabel="Very calm"
        value={stress}
        onChange={setStress}
      />
      <ScaleInput
        label="How ready and motivated do you feel to train?"
        lowLabel="Low"
        highLabel="High"
        value={moodMotivation}
        onChange={setMoodMotivation}
      />

      <View style={styles.painRow}>
        <Text style={styles.label}>Any pain today?</Text>
        <Switch value={hasPain} onValueChange={setHasPain} />
      </View>
      {hasPain ? (
        <View style={styles.painDetails}>
          <TextInput
            style={styles.textInput}
            placeholder="Location (e.g. left knee)"
            value={painLocation}
            onChangeText={setPainLocation}
          />
          <ScaleInput
            label="Severity"
            lowLabel="Mild"
            highLabel="Severe"
            value={painSeverity}
            onChange={setPainSeverity}
          />
        </View>
      ) : null}

      <ScaleInput
        label="How well did you sleep? (no wearable connected)"
        lowLabel="Very poor"
        highLabel="Excellent"
        value={sleepSelfReport}
        onChange={setSleepSelfReport}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
        disabled={!canSubmit || submitting}
        onPress={handleSubmit}
      >
        <Text style={styles.submitButtonText}>{submitting ? "Submitting…" : "Submit today's entry"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  greeting: { fontSize: 20, fontWeight: "700" },
  signOut: { color: "#1a73e8" },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#666", textTransform: "uppercase", marginTop: 16, marginBottom: 8 },
  readinessCard: { alignItems: "center", gap: 8, marginBottom: 8 },
  breakdownLine: { fontSize: 13, color: "#555", textAlign: "center" },
  submittedNote: { color: "#2e7d32", marginBottom: 8 },
  label: { fontSize: 16, fontWeight: "600" },
  painRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  painDetails: { marginBottom: 12 },
  textInput: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 12 },
  error: { color: "#d32f2f", marginBottom: 12 },
  submitButton: { backgroundColor: "#1a73e8", borderRadius: 8, padding: 14, alignItems: "center" },
  submitButtonDisabled: { backgroundColor: "#aac3ec" },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
