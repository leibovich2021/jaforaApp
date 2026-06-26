import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const REMINDER_ID = 'daily-report-reminder';
const CHANNEL_ID = 'jafora-reminders';
const REMINDER_HOUR = 19;
const REMINDER_MINUTE = 0;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'תזכורות יומיות',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#4285F4',
  });
}

async function ensurePermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** תזכורת יומית בשעה 19:00 לפי שעון הטלפון */
export async function setupDailyReminder(): Promise<void> {
  await ensureAndroidChannel();

  const granted = await ensurePermission();
  if (!granted) return;

  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: {
      title: 'Jafora',
      body: 'לא לשכוח לשלוח נתונים',
      sound: true,
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: REMINDER_HOUR,
      minute: REMINDER_MINUTE,
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
    },
  });
}
