import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { ErrorBanner } from '../components/ErrorBanner';
import { colors, radius, space } from '../theme';

interface Props {
  onCapture: () => void;
  onOpenSettings: () => void;
  error?: string | null;
  onDismissError?: () => void;
}

export function HomeScreen({ onCapture, onOpenSettings, error, onDismissError }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Text style={styles.appName}>Jafora</Text>
        <TouchableOpacity onPress={onOpenSettings} hitSlop={12}>
          <Text style={styles.settingsLink}>הגדרות</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>דוח יומי</Text>
          <Text style={styles.subtitle}>צלם את האקסל, בדוק את המספרים, ושלח בוואטסאפ.</Text>
        </View>

        {error ? <ErrorBanner message={error} onDismiss={onDismissError ?? (() => {})} /> : null}

        <View style={styles.action}>
          <TouchableOpacity style={styles.captureButton} onPress={onCapture} activeOpacity={0.85}>
            <Text style={styles.captureLabel}>צלם / בחר תמונה</Text>
          </TouchableOpacity>
          <Text style={styles.captureHint}>הצמד את המצלמה לטבלת האקסל</Text>
        </View>

        <View style={styles.steps}>
          {['צילום', 'סיכום ושליחה'].map((label, i) => (
            <React.Fragment key={label}>
              {i > 0 && <View style={styles.stepLine} />}
              <View style={styles.stepItem}>
                <Text style={[styles.stepNum, i === 0 && styles.stepNumActive]}>{i + 1}</Text>
                <Text style={[styles.stepLabel, i === 0 && styles.stepLabelActive]}>{label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.xl,
    paddingTop: space.sm,
    paddingBottom: space.md,
  },
  settingsLink: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.accent,
    writingDirection: 'rtl',
  },
  appName: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: colors.text,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: space.xl,
    paddingTop: space.xxl,
    paddingBottom: space.xl,
  },
  header: { marginBottom: space.xxl },
  title: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: space.md,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  action: { marginTop: space.sm },
  captureButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 16,
    paddingHorizontal: space.lg,
    alignItems: 'center',
  },
  captureLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.onAccent,
    writingDirection: 'rtl',
  },
  captureHint: {
    marginTop: space.md,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingTop: space.xxl,
  },
  stepItem: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    backgroundColor: colors.surface2,
    overflow: 'hidden',
  },
  stepNumActive: { backgroundColor: colors.accent, color: colors.onAccent },
  stepLabel: { fontSize: 13, color: colors.textMuted, writingDirection: 'rtl' },
  stepLabelActive: { color: colors.text, fontWeight: '500' },
  stepLine: {
    width: 28,
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: space.md,
  },
});
