import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, space } from '../theme';

interface Props {
  message: string;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>הקריאה נכשלה</Text>
        <TouchableOpacity onPress={onDismiss} hitSlop={8}>
          <Text style={styles.dismiss}>סגור</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scroll} nestedScrollEnabled>
        <Text selectable style={styles.body}>
          {message}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.errorSoft,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    borderRadius: radius.md,
    padding: space.lg,
    marginBottom: space.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  title: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  dismiss: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    writingDirection: 'rtl',
  },
  scroll: { maxHeight: 180 },
  body: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
});
