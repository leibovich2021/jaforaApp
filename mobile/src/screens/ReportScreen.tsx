import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  Share,
} from 'react-native';
import { colors } from '../theme';
import { openWhatsApp } from '../utils/whatsapp';

interface Props {
  reportText: string;
  managerName: string;
  managerPhone: string;
  onBack: () => void;
  onNewReport: () => void;
  onChangeRecipient: () => void;
}

export function ReportScreen({
  reportText,
  managerName,
  managerPhone,
  onBack,
  onNewReport,
  onChangeRecipient,
}: Props) {
  const sendWhatsApp = async () => {
    try {
      await openWhatsApp(managerPhone, reportText);
    } catch {
      Alert.alert(
        'לא נפתח וואטסאפ',
        'נסה לשתף את הדוח ידנית, או ודא שוואטסאפ מותקן ומספר הנמען נכון (972XXXXXXXXX)',
        [
          { text: 'שתף דוח', onPress: () => Share.share({ message: reportText }) },
          { text: 'סגור', style: 'cancel' },
        ],
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>📤 הדוח שלך</Text>

        <View style={styles.reportBox}>
          <Text style={styles.reportText}>{reportText}</Text>
        </View>

        <View style={styles.recipientRow}>
          <TouchableOpacity onPress={onChangeRecipient}>
            <Text style={styles.changeLink}>החלף</Text>
          </TouchableOpacity>
          <Text style={styles.recipientName}>{managerName}</Text>
          <Text style={styles.recipientLabel}>👤 נמען: </Text>
        </View>

        <TouchableOpacity style={styles.whatsappBtn} onPress={sendWhatsApp}>
          <Text style={styles.whatsappText}>📲 שלח ל{managerName} בוואטסאפ</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={onBack}>
          <Text style={styles.secondaryText}>← חזור לעריכה</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.ghostBtn} onPress={onNewReport}>
          <Text style={styles.ghostText}>📷 דוח חדש</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'right',
  },
  reportBox: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    minHeight: 320,
  },
  reportText: {
    fontSize: 14,
    lineHeight: 26,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginVertical: 16,
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
  secondaryBtn: {
    backgroundColor: colors.surface2,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  secondaryText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  ghostBtn: { padding: 14, alignItems: 'center' },
  ghostText: { color: colors.textMuted, fontSize: 15 },
});
