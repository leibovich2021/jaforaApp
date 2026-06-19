import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { colors } from '../theme';

interface Props {
  onCapture: () => void;
  onOpenSettings: () => void;
}

export function HomeScreen({ onCapture, onOpenSettings }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onOpenSettings} hitSlop={12}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
        <Text style={styles.appName}>Jafora</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.orb1} />
        <View style={styles.orb2} />

        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>📋</Text>
          </View>
          <Text style={styles.title}>דוח יומי</Text>
          <Text style={styles.subtitle}>צלם את האקסל · קבל דוח מוכן · שלח בוואטסאפ</Text>
        </View>

        <TouchableOpacity style={styles.captureCard} onPress={onCapture} activeOpacity={0.85}>
          <View style={styles.captureRing}>
            <Text style={styles.cameraIcon}>📷</Text>
          </View>
          <Text style={styles.captureLabel}>צלם / בחר תמונה</Text>
          <Text style={styles.captureHint}>הצמד את המצלמה לטבלת האקסל</Text>
        </TouchableOpacity>

        <View style={styles.steps}>
          {['צילום', 'סיכום ושליחה'].map((label, i) => (
            <React.Fragment key={label}>
              {i > 0 && <View style={styles.stepLine} />}
              <View style={styles.stepItem}>
                <View style={[styles.stepNum, i === 0 && styles.stepNumActive]}>
                  <Text style={[styles.stepNumText, i === 0 && styles.stepNumTextActive]}>
                    {i + 1}
                  </Text>
                </View>
                <Text style={styles.stepLabel}>{label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingsIcon: { fontSize: 22 },
  appName: { fontSize: 16, fontWeight: '700', color: colors.text },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  orb1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.accent,
    opacity: 0.12,
    top: -40,
    right: -80,
  },
  orb2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.tzra,
    opacity: 0.12,
    bottom: 100,
    left: -60,
  },
  header: { alignItems: 'center', marginBottom: 48, zIndex: 1 },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(66,133,244,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(66,133,244,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoIcon: { fontSize: 28 },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  captureCard: {
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
    backgroundColor: 'rgba(26,35,50,0.85)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    zIndex: 1,
  },
  captureRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(66,133,244,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(66,133,244,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cameraIcon: { fontSize: 36 },
  captureLabel: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 6 },
  captureHint: { fontSize: 13, color: colors.textMuted },
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: 32,
    zIndex: 1,
  },
  stepItem: { alignItems: 'center', gap: 6 },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumActive: {
    backgroundColor: 'rgba(66,133,244,0.15)',
    borderColor: 'rgba(66,133,244,0.4)',
  },
  stepNumText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  stepNumTextActive: { color: '#93c5fd' },
  stepLabel: { fontSize: 12, color: colors.textMuted },
  stepLine: {
    width: 32,
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 4,
    marginBottom: 18,
  },
});
