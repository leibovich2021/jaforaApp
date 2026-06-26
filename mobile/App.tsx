import React, { useCallback, useEffect, useState } from 'react';
import { Alert, I18nManager, StatusBar } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SettingsModal } from './src/components/SettingsModal';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoadingScreen } from './src/screens/LoadingScreen';
import { ReviewScreen } from './src/screens/ReviewScreen';
import { extractReportFromImage } from './src/services/gemini';
import { setupDailyReminder } from './src/services/reminder';
import { loadSettings, saveSettings } from './src/services/storage';
import { buildReportText } from './src/utils/report';
import { prepareImageForGemini } from './src/utils/prepareImage';
import { openWhatsApp } from './src/utils/whatsapp';
import {
  AppSettings,
  DEFAULT_SETTINGS,
  ExtractedReport,
  Screen,
  TruckTransfers,
} from './src/types';

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const DEFAULT_TRANSFERS: TruckTransfers = {
  eilat: 0,
  bashToTzra: 0,
  tzraToBeerot: 0,
  beerotToTzra: 0,
};

/** אחרי צילום/בחירה — מסך חיתוך מובנה (ב-Android: מלבן חופשי) */
const IMAGE_PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  quality: 1,
  base64: false,
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedReport | null>(null);
  const [transfers, setTransfers] = useState<TruckTransfers>(DEFAULT_TRANSFERS);

  useEffect(() => {
    loadSettings().then(setSettings);
    setupDailyReminder().catch(() => {});
  }, []);

  const handleSaveSettings = async (next: AppSettings) => {
    setSettings(next);
    await saveSettings(next);
    setSettingsOpen(false);
  };

  const processImage = useCallback(
    async (uri: string) => {
      setScreen('loading');
      try {
        const { base64, mimeType } = await prepareImageForGemini(uri);
        const data = await extractReportFromImage(base64, mimeType, settings.geminiApiKey);
        setExtracted(data);
        setTransfers(DEFAULT_TRANSFERS);
        setScreen('review');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'שגיאה לא צפויה';
        Alert.alert('שגיאה', message, [
          { text: 'נסה שוב', onPress: () => openCamera() },
          { text: 'ביטול', style: 'cancel', onPress: () => setScreen('home') },
        ]);
      }
    },
    [settings.geminiApiKey],
  );

  const openCamera = async () => {
    if (!settings.geminiApiKey.trim()) {
      Alert.alert('חסר מפתח API', 'הוסף מפתח Gemini בהגדרות לפני הצילום', [
        { text: 'פתח הגדרות', onPress: () => setSettingsOpen(true) },
        { text: 'ביטול', style: 'cancel' },
      ]);
      return;
    }

    Alert.alert('בחר מקור', '', [
      {
        text: 'צלם עכשיו',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('אין הרשאה', 'צריך לאשר גישה למצלמה');
            return;
          }
          const result = await ImagePicker.launchCameraAsync(IMAGE_PICKER_OPTIONS);
          if (!result.canceled && result.assets[0]?.uri) {
            await processImage(result.assets[0].uri);
          }
        },
      },
      {
        text: 'בחר מהגלריה',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync(IMAGE_PICKER_OPTIONS);
          if (!result.canceled && result.assets[0]?.uri) {
            await processImage(result.assets[0].uri);
          }
        },
      },
      { text: 'ביטול', style: 'cancel' },
    ]);
  };

  const handleSendWhatsApp = async () => {
    if (!extracted) return;
    const report = buildReportText(extracted, transfers, settings.managerName);
    try {
      await openWhatsApp(settings.managerPhone, report);
    } catch {
      Alert.alert(
        'לא נפתח וואטסאפ',
        'נסה לשתף ידנית, או ודא שוואטסאפ מותקן ומספר הנמען נכון (972XXXXXXXXX)',
      );
    }
  };

  const handleNewForm = () => {
    setExtracted(null);
    setTransfers(DEFAULT_TRANSFERS);
    setScreen('home');
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0f1419" />

      {screen === 'home' && (
        <HomeScreen onCapture={openCamera} onOpenSettings={() => setSettingsOpen(true)} />
      )}
      {screen === 'loading' && <LoadingScreen />}
      {screen === 'review' && extracted && (
        <ReviewScreen
          data={extracted}
          transfers={transfers}
          managerName={settings.managerName}
          onChangeTransfers={setTransfers}
          onSendWhatsApp={handleSendWhatsApp}
          onChangeRecipient={() => setSettingsOpen(true)}
          onRetake={openCamera}
          onNewForm={handleNewForm}
        />
      )}

      <SettingsModal
        visible={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onSave={handleSaveSettings}
      />
    </>
  );
}
