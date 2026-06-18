# Jafora — דוח יומי

אפליקציית Android לצילום אקסל, חילוץ נתונים עם Gemini, ושליחת דוח בוואטסאפ.

## מבנה הפרויקט

```
webappjafora/
├── mobile/          ← האפליקציה (React Native + Expo)
├── index.html       ← אב-טיפוס UI (דפדפן)
├── styles.css
└── ui-mockup.js
```

## התקנה ו-APK

ראה [mobile/BUILD.md](mobile/BUILD.md)

## פיתוח

```bash
cd mobile
npm install
npx expo start
```

## בניית APK

```powershell
cd mobile
.\build-apk.ps1
```
