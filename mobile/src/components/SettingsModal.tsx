import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { AppSettings } from '../types';
import { colors } from '../theme';
import { useKeyboardHeight } from '../utils/keyboard';

interface Props {
  visible: boolean;
  settings: AppSettings;
  onClose: () => void;
  onSave: (settings: AppSettings) => void;
}

export function SettingsModal({ visible, settings, onClose, onSave }: Props) {
  const [draft, setDraft] = useState(settings);
  const kbHeight = useKeyboardHeight();

  useEffect(() => {
    if (visible) setDraft(settings);
  }, [visible, settings]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        <View style={[styles.panel, kbHeight > 0 && { marginBottom: kbHeight }]}>
          <View style={styles.header}>
            <Text style={styles.title}>⚙️ הגדרות</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={{ paddingBottom: kbHeight > 0 ? 20 : 0 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.label}>שם המנהל</Text>
            <TextInput
              style={styles.input}
              value={draft.managerName}
              onChangeText={(v) => setDraft({ ...draft, managerName: v })}
              textAlign="right"
            />

            <Text style={styles.label}>מספר וואטסאפ</Text>
            <TextInput
              style={styles.input}
              value={draft.managerPhone}
              onChangeText={(v) => setDraft({ ...draft, managerPhone: v })}
              placeholder="972XXXXXXXXX"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              textAlign="right"
            />
            <Text style={styles.hint}>פורמט: 972XXXXXXXXX (ללא +)</Text>

            <Text style={styles.label}>מפתח Gemini API</Text>
            <TextInput
              style={styles.input}
              value={draft.geminiApiKey}
              onChangeText={(v) => setDraft({ ...draft, geminiApiKey: v })}
              placeholder="AIza..."
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              textAlign="right"
              autoCapitalize="none"
            />
            <Text style={styles.hint}>חינם — נשמר רק במכשיר שלך</Text>
          </ScrollView>

          <TouchableOpacity style={styles.saveBtn} onPress={() => onSave(draft)}>
            <Text style={styles.saveText}>שמור</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  panel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  close: { fontSize: 20, color: colors.textMuted, padding: 4 },
  body: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
    textAlign: 'right',
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    color: colors.text,
    fontSize: 16,
    marginBottom: 12,
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'right',
    marginBottom: 16,
    marginTop: -8,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
