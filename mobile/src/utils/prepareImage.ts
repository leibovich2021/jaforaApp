import * as ImageManipulator from 'expo-image-manipulator';

/** רוחב מקסימלי לשליחה ל-Gemini — מספיק לקריאת אקסל, מהיר יותר להעלאה ועיבוד */
const MAX_WIDTH = 1400;
const JPEG_QUALITY = 0.72;

export async function prepareImageForGemini(
  uri: string,
): Promise<{ base64: string; mimeType: string }> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_WIDTH } }],
    {
      compress: JPEG_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    },
  );

  if (!result.base64) {
    throw new Error('שגיאה בהכנת התמונה');
  }

  return { base64: result.base64, mimeType: 'image/jpeg' };
}
