import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { ErrorBanner } from '../components/ErrorBanner';
import { collectReportWarnings, dateWarning, inspectBranch, suggestedColumnFix } from '../extraction/sanity';
import { BranchData, ExtractedReport, TruckTransfers } from '../types';
import { colors } from '../theme';
import { fmtAvgBoxes, fmtAvgPoints, fmtInt, withCalculatedAverages, branchHasData } from '../utils/averages';
import { useKeyboardHeight } from '../utils/keyboard';
import { buildBashNote, buildTzraNote, formatTrucksLine } from '../utils/truckNotes';

interface Props {
  data: ExtractedReport;
  transfers: TruckTransfers;
  managerName: string;
  onChangeTransfers: (t: TruckTransfers) => void;
  onSendWhatsApp: () => void;
  onChangeRecipient: () => void;
  onRetake: () => void;
  onNewForm: () => void;
  sourceLabel: string;
  onChangeData: (data: ExtractedReport) => void;
  error?: string | null;
  onDismissError?: () => void;
}

function NumberField({
  value,
  warned,
  onChange,
}: {
  value: number;
  warned: boolean;
  onChange: (value: number) => void;
}) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value));
  }, [value]);

  return (
    <TextInput
      value={text}
      keyboardType="number-pad"
      selectTextOnFocus
      maxLength={7}
      onChangeText={(raw) => {
        const cleaned = raw.replace(/[^\d]/g, '');
        setText(cleaned);
        onChange(cleaned ? Number(cleaned) : 0);
      }}
      style={[styles.statInput, warned && styles.statInputWarn]}
    />
  );
}

function BranchCard({
  title,
  headerColor,
  data,
  onChange,
}: {
  title: string;
  headerColor: string;
  data: BranchData;
  onChange: (data: BranchData) => void;
}) {
  const avg = withCalculatedAverages(data);
  const flags = inspectBranch(data);
  const fix = suggestedColumnFix(data);
  return (
    <View style={styles.branchCard}>
      <View style={[styles.branchHeader, { backgroundColor: headerColor }]}>
        <Text style={styles.branchTitle}>{title}</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <NumberField
            value={data.trucks}
            warned={flags.trucks}
            onChange={(trucks) => onChange({ ...data, trucks, avgBoxes: 0, avgPoints: 0 })}
          />
          <Text style={styles.statLabel}>משאיות</Text>
        </View>
        <View style={styles.stat}>
          <NumberField
            value={data.points}
            warned={flags.points}
            onChange={(points) => onChange({ ...data, points, avgBoxes: 0, avgPoints: 0 })}
          />
          <Text style={styles.statLabel}>נקודות</Text>
        </View>
        <View style={styles.stat}>
          <NumberField
            value={data.boxes}
            warned={flags.boxes}
            onChange={(boxes) => onChange({ ...data, boxes, avgBoxes: 0, avgPoints: 0 })}
          />
          <Text style={styles.statLabel}>תיבות</Text>
        </View>
      </View>
      {flags.messages.map((message) => (
        <Text key={message} style={styles.branchWarn}>{message}</Text>
      ))}
      {fix && (
        <TouchableOpacity
          style={styles.fixBtn}
          onPress={() => onChange(fix)}
        >
          <Text style={styles.fixText}>
            תקן לפי הגודל: {fmtInt(fix.trucks)} משאיות · {fmtInt(fix.points)} נקודות · {fmtInt(fix.boxes)} תיבות
          </Text>
        </TouchableOpacity>
      )}
      <View style={styles.avgRow}>
        <Text style={styles.avgText}>
          ממוצע לנהג: {fmtAvgBoxes(avg.avgBoxes)} תיבות · {fmtAvgPoints(avg.avgPoints)} נקודות
        </Text>
      </View>
    </View>
  );
}

function TransferStepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.transferRow}>
      <View style={styles.stepper}>
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={() => onChange(value + 1)}
          hitSlop={8}
        >
          <Text style={styles.stepBtnText}>+</Text>
        </TouchableOpacity>
        <Text style={styles.stepValue}>{value}</Text>
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={() => onChange(Math.max(0, value - 1))}
          hitSlop={8}
        >
          <Text style={styles.stepBtnText}>−</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.transferLabel}>{label}</Text>
    </View>
  );
}

export function ReviewScreen({
  data,
  transfers,
  managerName,
  onChangeTransfers,
  onSendWhatsApp,
  onChangeRecipient,
  onRetake,
  onNewForm,
  sourceLabel,
  onChangeData,
  error,
  onDismissError,
}: Props) {
  const kbHeight = useKeyboardHeight();
  const scrollRef = useRef<ScrollView>(null);
  const warnings = collectReportWarnings(data);
  const badDate = dateWarning(data.date);
  const bashNote = buildBashNote(transfers);
  const tzraNote = buildTzraNote(transfers);
  const hasTzra = branchHasData(data.tzora);
  const hasBash = branchHasData(data.beerSheva);

  const updateBranch = (key: 'beerSheva' | 'tzora', branch: BranchData) => {
    onChangeData({ ...data, [key]: branch });
  };

  const handleSend = () => {
    if (!hasTzra && !hasBash) {
      Alert.alert('אין נתונים', 'מלא לפחות סניף אחד לפני השליחה');
      return;
    }
    if (warnings.length > 0) {
      Alert.alert('המספרים נראים חשודים', 'כדאי לתקן לפני השליחה. אפשר גם לשלוח כמו שהם.', [
        { text: 'חזרה לתיקון', style: 'cancel' },
        { text: 'שלח בכל זאת', onPress: onSendWhatsApp },
      ]);
      return;
    }
    onSendWhatsApp();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(kbHeight, 40) + 80 }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={Keyboard.dismiss}
        >
          <View style={styles.topRow}>
            <Text style={styles.heading}>📊 סיכום ושליחה</Text>
            <TouchableOpacity onPress={onRetake}>
              <Text style={styles.retakeLink}>📷 צלם שוב</Text>
            </TouchableOpacity>
          </View>

          {error ? <ErrorBanner message={error} onDismiss={onDismissError ?? (() => {})} /> : null}

          <Text style={styles.hint}>אפשר לתקן כל מספר לפני השליחה. הסדר בגיליון: מימין לתאריך משאיות, אחר כך נקודות, אחר כך תיבות.</Text>
          <Text style={styles.sourceLabel}>נקרא באמצעות {sourceLabel}</Text>

          <View style={styles.dateBadge}>
            <TextInput
              style={[styles.dateInput, badDate && styles.statInputWarn]}
              value={data.date}
              onChangeText={(date) => onChangeData({ ...data, date })}
              textAlign="center"
              placeholder="DD/MM/YYYY"
              placeholderTextColor={colors.textMuted}
            />
            <TextInput
              style={styles.dateInput}
              value={data.dayName}
              onChangeText={(dayName) => onChangeData({ ...data, dayName })}
              textAlign="center"
              placeholder="יום"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          {badDate ? <Text style={styles.dateWarn}>{badDate}</Text> : null}

          <BranchCard
            title="צרעה"
            headerColor="rgba(139,92,246,0.2)"
            data={data.tzora}
            onChange={(branch) => updateBranch('tzora', branch)}
          />
          <BranchCard
            title="באר שבע"
            headerColor="rgba(59,130,246,0.2)"
            data={data.beerSheva}
            onChange={(branch) => updateBranch('beerSheva', branch)}
          />

          <Text style={styles.sectionTitle}>🚛 העברות משאיות</Text>
          <View style={styles.transferForm}>
            {hasTzra && (
              <>
                <Text style={styles.groupLabel}>סניף צרעה</Text>
                <TransferStepper
                  label="משאיות לבארות יצחק"
                  value={transfers.tzraToBeerot}
                  onChange={(v) => onChangeTransfers({ ...transfers, tzraToBeerot: v })}
                />
                <TransferStepper
                  label="משאיות מבארות יצחק"
                  value={transfers.beerotToTzra}
                  onChange={(v) => onChangeTransfers({ ...transfers, beerotToTzra: v })}
                />
              </>
            )}
            {hasBash && (
              <>
                <Text style={styles.groupLabel}>סניף באר שבע</Text>
                <TransferStepper
                  label="משאיות לאילת"
                  value={transfers.eilat}
                  onChange={(v) => onChangeTransfers({ ...transfers, eilat: v })}
                />
                <TransferStepper
                  label="משאיות לסניף צרעה"
                  value={transfers.bashToTzra}
                  onChange={(v) => onChangeTransfers({ ...transfers, bashToTzra: v })}
                />
              </>
            )}
          </View>

          <View style={styles.notesPreview}>
            <Text style={styles.notesTitle}>תצוגה מקדימה של הערות:</Text>
            <Text style={styles.notesText}>
              {hasTzra && (
                <>
                  <Text style={styles.notesBold}>צרעה: </Text>
                  {formatTrucksLine(data.tzora.trucks, tzraNote)}
                  {hasBash ? '\n' : ''}
                </>
              )}
              {hasBash && (
                <>
                  <Text style={styles.notesBold}>באר שבע: </Text>
                  {formatTrucksLine(data.beerSheva.trucks, bashNote)}
                </>
              )}
            </Text>
          </View>

          <View style={styles.recipientRow}>
            <TouchableOpacity onPress={onChangeRecipient}>
              <Text style={styles.changeLink}>החלף</Text>
            </TouchableOpacity>
            <Text style={styles.recipientName}>{managerName}</Text>
            <Text style={styles.recipientLabel}>👤 נמען: </Text>
          </View>

          <TouchableOpacity style={styles.whatsappBtn} onPress={handleSend}>
            <Text style={styles.whatsappText}>📲 שלח ל{managerName} בוואטסאפ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.newFormBtn} onPress={onNewForm}>
            <Text style={styles.newFormText}>📋 טופס חדש</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heading: { fontSize: 20, fontWeight: '700', color: colors.text },
  retakeLink: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  dateBadge: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
    gap: 8,
  },
  dateText: { color: colors.text, fontSize: 14 },
  dateInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 8,
  },
  dateWarn: {
    color: '#fecaca',
    fontSize: 12,
    textAlign: 'right',
    marginTop: -10,
    marginBottom: 12,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
    marginBottom: 6,
  },
  sourceLabel: {
    color: '#93c5fd',
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 10,
  },
  statInput: {
    minWidth: 72,
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  statInputWarn: { borderColor: colors.error },
  branchWarn: {
    color: '#fecaca',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'right',
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  fixBtn: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(66,133,244,0.45)',
    backgroundColor: 'rgba(66,133,244,0.12)',
    padding: 10,
  },
  fixText: { color: '#bfdbfe', fontSize: 13, textAlign: 'right', lineHeight: 18 },
  branchCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 12,
  },
  branchHeader: { paddingVertical: 10, paddingHorizontal: 16 },
  branchTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  statsRow: { flexDirection: 'row', padding: 16 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  avgRow: {
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 10,
    paddingHorizontal: 16,
  },
  avgText: { fontSize: 13, color: colors.textMuted, textAlign: 'right' },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
    marginBottom: 12,
    textAlign: 'right',
  },
  transferForm: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  groupLabel: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    backgroundColor: colors.bg,
    textAlign: 'right',
  },
  transferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  transferLabel: { flex: 1, fontSize: 14, color: colors.text, textAlign: 'right' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 12,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.accent,
    lineHeight: 26,
  },
  stepValue: {
    minWidth: 36,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: 4,
  },
  notesPreview: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 20,
  },
  notesTitle: { fontSize: 12, color: colors.textMuted, marginBottom: 8, textAlign: 'right' },
  notesText: { fontSize: 14, color: '#93c5fd', lineHeight: 22, textAlign: 'right' },
  notesBold: { fontWeight: '700', color: '#93c5fd' },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 12,
    gap: 6,
  },
  recipientLabel: { fontSize: 14, color: colors.textMuted },
  recipientName: { fontSize: 14, fontWeight: '700', color: colors.text },
  changeLink: { color: colors.accent, fontSize: 14, fontWeight: '600', marginLeft: 8 },
  whatsappBtn: {
    backgroundColor: colors.whatsapp,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginBottom: 10,
  },
  whatsappText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  newFormBtn: { padding: 14, alignItems: 'center', marginBottom: 8 },
  newFormText: { color: colors.textMuted, fontSize: 15, fontWeight: '600' },
});
