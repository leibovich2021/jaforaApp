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
import { colors, radius, space } from '../theme';
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
      textAlign="center"
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
      <Text style={styles.transferLabel}>{label}</Text>
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
            <Text style={styles.heading}>סיכום ושליחה</Text>
            <TouchableOpacity onPress={onRetake}>
              <Text style={styles.retakeLink}>צלם שוב</Text>
            </TouchableOpacity>
          </View>

          {error ? <ErrorBanner message={error} onDismiss={onDismissError ?? (() => {})} /> : null}

          <Text style={styles.hint}>אפשר לתקן כל מספר לפני השליחה. הסדר בגיליון: מימין לתאריך משאיות, אחר כך נקודות, אחר כך תיבות.</Text>
          <Text style={styles.sourceLabel}>{`\u202Bנקרא באמצעות ${sourceLabel}\u202C`}</Text>

          <View style={styles.dateBadge}>
            <TextInput
              style={[styles.dateInput, styles.dateField, badDate && styles.statInputWarn]}
              value={data.date}
              onChangeText={(date) => onChangeData({ ...data, date })}
              textAlign="center"
              placeholder="DD/MM/YYYY"
              placeholderTextColor={colors.textMuted}
            />
            <TextInput
              style={[styles.dateInput, styles.dayField]}
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
            headerColor={colors.tzraSoft}
            data={data.tzora}
            onChange={(branch) => updateBranch('tzora', branch)}
          />
          <BranchCard
            title="באר שבע"
            headerColor={colors.bashSoft}
            data={data.beerSheva}
            onChange={(branch) => updateBranch('beerSheva', branch)}
          />

          <Text style={styles.sectionTitle}>העברות משאיות</Text>
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
            <Text style={styles.recipientLabel}>נמען</Text>
            <Text style={styles.recipientName}>{managerName}</Text>
            <TouchableOpacity onPress={onChangeRecipient}>
              <Text style={styles.changeLink}>החלף</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.whatsappBtn} onPress={handleSend}>
            <Text style={styles.whatsappText}>שלח ל{managerName} בוואטסאפ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.newFormBtn} onPress={onNewForm}>
            <Text style={styles.newFormText}>טופס חדש</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: 40 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.lg,
  },
  heading: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    writingDirection: 'rtl',
  },
  retakeLink: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '500',
    writingDirection: 'rtl',
  },
  dateBadge: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    marginBottom: space.lg,
    alignItems: 'center',
    gap: space.sm,
  },
  dateText: { color: colors.text, fontSize: 15 },
  dateInput: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: radius.sm,
    textAlign: 'center',
  },
  dateField: { flex: 1.2, minWidth: 0, writingDirection: 'ltr' },
  dayField: { flex: 1, minWidth: 0, writingDirection: 'rtl' },
  dateWarn: {
    color: colors.error,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: -space.sm,
    marginBottom: space.md,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: space.xs,
  },
  sourceLabel: {
    color: colors.tzra,
    fontSize: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: space.md,
  },
  statInput: {
    width: '100%',
    height: 44,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'ltr',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 0,
    paddingHorizontal: 4,
  },
  statInputWarn: { borderColor: colors.error, backgroundColor: colors.errorSoft },
  branchWarn: {
    color: colors.error,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'right',
    writingDirection: 'rtl',
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
  },
  fixBtn: {
    marginHorizontal: space.lg,
    marginBottom: space.md,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    padding: space.md,
  },
  fixText: {
    color: colors.accent,
    fontSize: 13,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 18,
  },
  branchCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: space.md,
  },
  branchHeader: { paddingVertical: space.md, paddingHorizontal: space.lg },
  branchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  statsRow: { flexDirection: 'row', paddingHorizontal: space.md, paddingBottom: space.lg, gap: space.sm },
  stat: { flex: 1, minWidth: 0, alignItems: 'stretch' },
  statValue: { fontSize: 18, fontWeight: '600', color: colors.text },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: space.sm,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  avgRow: {
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
  },
  avgText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: space.sm,
    marginBottom: space.md,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  transferForm: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: space.lg,
  },
  groupLabel: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.sm,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    backgroundColor: colors.bg,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  transferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: space.md,
  },
  transferLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    direction: 'ltr',
    gap: space.xs,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 20,
    fontWeight: '500',
    color: colors.accent,
    lineHeight: 24,
  },
  stepValue: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  notesPreview: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    marginBottom: space.lg,
  },
  notesTitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: space.sm,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  notesText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  notesBold: { fontWeight: '600', color: colors.text },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: space.md,
    gap: space.sm,
  },
  recipientLabel: {
    fontSize: 14,
    color: colors.textMuted,
    writingDirection: 'rtl',
  },
  recipientName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    writingDirection: 'rtl',
  },
  changeLink: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '500',
    writingDirection: 'rtl',
  },
  whatsappBtn: {
    backgroundColor: colors.whatsapp,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: space.sm,
  },
  whatsappText: {
    color: colors.onAccent,
    fontSize: 16,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  newFormBtn: { paddingVertical: space.md, alignItems: 'center', marginBottom: space.sm },
  newFormText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '500',
    writingDirection: 'rtl',
  },
});
