import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';

/** Wide enough to keep small Excel digits readable, still far under the inline-image limit. */
const MAX_WIDTH = 1800;
const JPEG_QUALITY = 0.8;

function readWidth(uri: string): Promise<number | null> {
  return new Promise((resolve) => {
    Image.getSize(
      uri,
      (width) => resolve(width),
      () => resolve(null),
    );
  });
}

export async function prepareImageForGemini(
  uri: string,
): Promise<{ base64: string; mimeType: string }> {
  const width = await readWidth(uri);
  const actions: ImageManipulator.Action[] =
    width !== null && width > 0 && width <= MAX_WIDTH ? [] : [{ resize: { width: MAX_WIDTH } }];

  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: JPEG_QUALITY,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });

  if (!result.base64) {
    throw new Error('שגיאה בהכנת התמונה');
  }

  return { base64: result.base64, mimeType: 'image/jpeg' };
}
