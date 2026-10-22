import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { AppSettings, VisionProviderId } from '../types';
import { colors } from '../theme';
import { useKeyboardHeight } from '../utils/keyboard';

interface Props {
  visible: boolean;
  settings: AppSettings;
  onClose: () => void;
  onSave: (settings: AppSettings) => void;
}

const PROVIDERS: { id: VisionProviderId; label: string }[] = [
  { id: 'auto', label: 'אוטומטי' },
  { id: 'gemini', label: 'Gemini' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'anthropic', label: 'Claude' },
];

function SecretField({
  label,
  hint,
  value,
  placeholder,
  onChangeText,
}: {
  label: string;
  hint: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.secretRow}>
        <TextInput
          style={[styles.input, styles.secretInput]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={!visible}
          textAlign="left"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
        />
        <TouchableOpacity onPress={() => setVisible((current) => !current)} hitSlop={8}>
          <Text style={styles.reveal}>{visible ? 'הסתר' : 'הצג'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>{hint}</Text>
    </View>
  );
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
            <Text style={styles.title}>הגדרות</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={{ paddingBottom: kbHeight > 0 ? 20 : 8 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.label}>שם המנהל</Text>
            <TextInput
              style={styles.input}
              value={draft.managerName}
              onChangeText={(managerName) => setDraft({ ...draft, managerName })}
              textAlign="right"
            />

            <Text style={styles.label}>מספר וואטסאפ</Text>
            <TextInput
              style={styles.input}
              value={draft.managerPhone}
              onChangeText={(managerPhone) => setDraft({ ...draft, managerPhone })}
              placeholder="972XXXXXXXXX"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              textAlign="right"
            />
            <Text style={styles.hint}>פורמט: 972XXXXXXXXX (ללא +)</Text>

            <Text style={styles.label}>מי קורא את התמונה</Text>
            <View style={styles.providerRow}>
              {PROVIDERS.map((provider) => {
                const selected = draft.visionProvider === provider.id;
                return (
                  <TouchableOpacity
                    key={provider.id}
                    style={[styles.chip, selected && styles.chipOn]}
                    onPress={() => setDraft({ ...draft, visionProvider: provider.id })}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextOn]}>{provider.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.hint}>
              אוטומטי: Gemini קודם. אם הקריאה נכשלת ויש מפתח נוסף, עוברים אליו לבד.
            </Text>

            <SecretField
              label="מפתח Gemini API"
              hint="ברירת המחדל. מ-aistudio.google.com/apikey, מתחיל ב-AIza. נשמר רק בטלפון."
              value={draft.geminiApiKey}
              placeholder="AIza..."
              onChangeText={(geminiApiKey) => setDraft({ ...draft, geminiApiKey })}
            />
            <SecretField
              label="מפתח OpenAI (גיבוי)"
              hint="אופציונלי, בתשלום. מ-platform.openai.com/api-keys, מתחיל ב-sk-."
              value={draft.openaiApiKey}
              placeholder="sk-..."
              onChangeText={(openaiApiKey) => setDraft({ ...draft, openaiApiKey })}
            />
            <SecretField
              label="מפתח Claude (גיבוי)"
              hint="אופציונלי, בתשלום. מ-console.anthropic.com, מתחיל ב-sk-ant-."
              value={draft.anthropicApiKey}
              placeholder="sk-ant-..."
              onChangeText={(anthropicApiKey) => setDraft({ ...draft, anthropicApiKey })}
            />
          </ScrollView>

          <TouchableOpacity style={styles.saveBtn} onPress={() => { Keyboard.dismiss(); onSave(draft); }}>
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
    backgroundColor: 'rgba(28,25,22,0.35)',
    justifyContent: 'flex-end',
  },
  backdrop: { flex: 1 },
  panel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    writingDirection: 'rtl',
  },
  close: { fontSize: 18, color: colors.textMuted, padding: 4 },
  body: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
    marginBottom: 8,
    writingDirection: 'rtl',
  },
  secretRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secretInput: { flex: 1, marginBottom: 8, writingDirection: 'ltr' },
  reveal: { color: colors.accent, fontSize: 13, fontWeight: '600', paddingHorizontal: 4 },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 16,
    lineHeight: 18,
  },
  providerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.bg,
  },
  chipOn: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  chipText: { color: colors.textMuted, fontSize: 13, fontWeight: '500' },
  chipTextOn: { color: colors.onAccent },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveText: { color: colors.onAccent, fontSize: 16, fontWeight: '600' },
});
