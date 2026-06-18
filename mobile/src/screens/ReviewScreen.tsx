import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { ExtractedReport, TruckTransfers } from '../types';
import { colors } from '../theme';
import { fmtAvgBoxes, fmtAvgPoints, fmtInt, withCalculatedAverages } from '../utils/averages';

interface Props {
  data: ExtractedReport;
  transfers: TruckTransfers;
  onChangeTransfers: (t: TruckTransfers) => void;
  onGenerate: () => void;
  onRetake: () => void;
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

function TransferInput({
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
      <TextInput
        style={styles.transferInput}
        value={String(value)}
        onChangeText={(t) => onChange(Math.max(0, parseInt(t, 10) || 0))}
        keyboardType="number-pad"
        textAlign="center"
      />
      <Text style={styles.transferLabel}>{label}</Text>
    </View>
  );
}

export function ReviewScreen({
  data,
  transfers,
  onChangeTransfers,
  onGenerate,
  onRetake,
}: Props) {
  const bashNote = `(${transfers.eilat} משאיות לאילת ו-${transfers.bashToTzra} משאיות לסניף צרעה)`;
  const tzraNote = `(${transfers.tzraToBeerot} משאיות לבארות יצחק, ${transfers.beerotToTzra} משאיות מבארות יצחק)`;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}>
          <Text style={styles.heading}>📊 סיכום ושליחה</Text>
          <TouchableOpacity onPress={onRetake}>
            <Text style={styles.retakeLink}>📷 צלם שוב</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dateBadge}>
          <Text style={styles.dateText}>📅 {data.date} · {data.dayName}</Text>
        </View>

        <BranchCard
          title="באר שבע"
          headerColor="rgba(59,130,246,0.2)"
          data={data.beerSheva}
        />
        <BranchCard
          title="צרעה"
          headerColor="rgba(139,92,246,0.2)"
          data={data.tzora}
        />

        <Text style={styles.sectionTitle}>🚛 העברות משאיות</Text>
        <View style={styles.transferForm}>
          <Text style={styles.groupLabel}>סניף באר שבע</Text>
          <TransferInput
            label="משאיות לאילת"
            value={transfers.eilat}
            onChange={(v) => onChangeTransfers({ ...transfers, eilat: v })}
          />
          <TransferInput
            label="משאיות לסניף צרעה"
            value={transfers.bashToTzra}
            onChange={(v) => onChangeTransfers({ ...transfers, bashToTzra: v })}
          />
          <Text style={styles.groupLabel}>סניף צרעה</Text>
          <TransferInput
            label="משאיות לבארות יצחק"
            value={transfers.tzraToBeerot}
            onChange={(v) => onChangeTransfers({ ...transfers, tzraToBeerot: v })}
          />
          <TransferInput
            label="משאיות מבארות יצחק"
            value={transfers.beerotToTzra}
            onChange={(v) => onChangeTransfers({ ...transfers, beerotToTzra: v })}
          />
        </View>

        <View style={styles.notesPreview}>
          <Text style={styles.notesTitle}>תצוגה מקדימה של הערות:</Text>
          <Text style={styles.notesText}>
            <Text style={styles.notesBold}>באר שבע: </Text>
            {fmtInt(data.beerSheva.trucks)} משאיות {bashNote}
            {'\n'}
            <Text style={styles.notesBold}>צרעה: </Text>
            {fmtInt(data.tzora.trucks)} משאיות {tzraNote}
          </Text>
        </View>

        <TouchableOpacity style={styles.generateBtn} onPress={onGenerate}>
          <Text style={styles.generateText}>📝 צור דוח</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  transferLabel: { flex: 1, fontSize: 14, color: colors.text, textAlign: 'right' },
  transferInput: {
    width: 64,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
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
  generateBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  generateText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
