import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { ExtractedReport, TruckTransfers } from '../types';
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
}

function BranchCard({
  title,
  headerColor,
  data,
}: {
  title: string;
  headerColor: string;
  data: { boxes: number; points: number; trucks: number };
}) {
  const avg = withCalculatedAverages({ ...data, avgBoxes: 0, avgPoints: 0 });
  return (
    <View style={styles.branchCard}>
      <View style={[styles.branchHeader, { backgroundColor: headerColor }]}>
        <Text style={styles.branchTitle}>{title}</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{fmtInt(data.boxes)}</Text>
          <Text style={styles.statLabel}>תיבות</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{fmtInt(data.points)}</Text>
          <Text style={styles.statLabel}>נקודות</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{fmtInt(data.trucks)}</Text>
          <Text style={styles.statLabel}>משאיות</Text>
        </View>
      </View>
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
}: Props) {
  const kbHeight = useKeyboardHeight();
  const scrollRef = useRef<ScrollView>(null);

  const bashNote = buildBashNote(transfers);
  const tzraNote = buildTzraNote(transfers);
  const hasTzra = branchHasData(data.tzora);
  const hasBash = branchHasData(data.beerSheva);

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

          <View style={styles.dateBadge}>
            <Text style={styles.dateText}>📅 {data.date} · {data.dayName}</Text>
          </View>

          {hasTzra && (
            <BranchCard
              title="צרעה"
              headerColor="rgba(139,92,246,0.2)"
              data={data.tzora}
            />
          )}
          {hasBash && (
            <BranchCard
              title="באר שבע"
              headerColor="rgba(59,130,246,0.2)"
              data={data.beerSheva}
            />
          )}

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

          <TouchableOpacity style={styles.whatsappBtn} onPress={onSendWhatsApp}>
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  dateText: { color: colors.text, fontSize: 14 },
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
