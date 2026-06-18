import React, { useCallback, useEffect, useState } from 'react';
import { Alert, I18nManager, StatusBar } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SettingsModal } from './src/components/SettingsModal';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoadingScreen } from './src/screens/LoadingScreen';
import { ReviewScreen } from './src/screens/ReviewScreen';
import { ReportScreen } from './src/screens/ReportScreen';
import { extractReportFromImage } from './src/services/gemini';
import { loadSettings, saveSettings } from './src/services/storage';
import { buildReportText } from './src/utils/report';
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

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedReport | null>(null);
  const [transfers, setTransfers] = useState<TruckTransfers>(DEFAULT_TRANSFERS);
  const [reportText, setReportText] = useState('');

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  const handleSaveSettings = async (next: AppSettings) => {
    setSettings(next);
    await saveSettings(next);
    setSettingsOpen(false);
  };

  const processImage = useCallback(
    async (base64: string, mimeType: string) => {
      setScreen('loading');
      try {
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
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.85,
            base64: true,
          });
          if (!result.canceled && result.assets[0]?.base64) {
            await processImage(
              result.assets[0].base64,
              result.assets[0].mimeType ?? 'image/jpeg',
            );
          }
        },
      },
      {
        text: 'בחר מהגלריה',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.85,
            base64: true,
          });
          if (!result.canceled && result.assets[0]?.base64) {
            await processImage(
              result.assets[0].base64,
              result.assets[0].mimeType ?? 'image/jpeg',
            );
          }
        },
      },
      { text: 'ביטול', style: 'cancel' },
    ]);
  };

  const handleGenerate = () => {
    if (!extracted) return;
    setReportText(buildReportText(extracted, transfers, settings.managerName));
    setScreen('report');
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
          onChangeTransfers={setTransfers}
          onGenerate={handleGenerate}
          onRetake={openCamera}
        />
      )}
      {screen === 'report' && (
        <ReportScreen
          reportText={reportText}
          managerName={settings.managerName}
          managerPhone={settings.managerPhone}
          onBack={() => setScreen('review')}
          onNewReport={() => {
            setExtracted(null);
            setTransfers(DEFAULT_TRANSFERS);
            setReportText('');
            setScreen('home');
          }}
          onChangeRecipient={() => setSettingsOpen(true)}
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
