import { Linking, Platform } from 'react-native';

function normalizePhone(raw: string): string {
  let phone = raw.replace(/\D/g, '');
  if (phone.startsWith('0')) {
    phone = '972' + phone.slice(1);
  }
  return phone;
}

function buildWhatsAppUrls(phone: string, text: string): string[] {
  const encoded = encodeURIComponent(text);
  return [
    `whatsapp://send?phone=${phone}&text=${encoded}`,
    `https://wa.me/${phone}?text=${encoded}`,
    `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`,
  ];
}

/** פותח וואטסאפ עם הודעה מוכנה — עובד על Samsung/Android */
export async function openWhatsApp(phoneRaw: string, text: string): Promise<void> {
  const phone = normalizePhone(phoneRaw);
  if (phone.length < 10) {
    throw new Error('מספר וואטסאפ לא תקין — בדוק בהגדרות (972XXXXXXXXX)');
  }

  const urls = buildWhatsAppUrls(phone, text);
  let lastError: unknown;

  for (const url of urls) {
    try {
      // ב-Android canOpenURL מחזיר false בטעות — פותחים ישירות
      if (Platform.OS === 'ios') {
        const can = await Linking.canOpenURL(url);
        if (!can) continue;
      }
      await Linking.openURL(url);
      return;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError ?? new Error('לא ניתן לפתוח וואטסאפ');
}
