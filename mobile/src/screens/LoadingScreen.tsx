import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, SafeAreaView } from 'react-native';
import { colors, space } from '../theme';

interface Props {
  message?: string;
}

export function LoadingScreen({ message = 'קורא את האקסל...' }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <ActivityIndicator size="small" color={colors.accent} />
        <Text style={styles.title}>{`\u202B${message}\u202C`}</Text>
        <Text style={styles.subtitle}>קוראים את העמודות מימין לתאריך: משאיות, נקודות, תיבות</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: colors.text,
    marginTop: space.lg,
    textAlign: 'center',
    writingDirection: 'rtl',
    direction: 'rtl',
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: space.sm,
    textAlign: 'center',
    lineHeight: 22,
    writingDirection: 'rtl',
    maxWidth: 280,
  },
});
