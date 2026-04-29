# Stack Research

**Domain:** Mobile Finance Tracker (on-device OCR + expense logging)
**Researched:** 2026-04-29
**Confidence:** MEDIUM

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Expo (React Native) | SDK 52+ | Cross-platform mobile framework | Single codebase for iOS + Android, managed workflow, OTA updates |
| Expo Router | v4+ | File-based navigation | Convention-over-configuration, deep linking, type-safe routes |
| Zustand | v5+ | State management | Minimal boilerplate, works great with React Native, no providers needed |
| expo-sqlite | v15+ | Local database | SQLite baked into Expo, synchronous API, no native linking needed |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-image-picker | v16+ | Screenshot import from gallery | Required for manual screenshot selection |
| expo-file-system | v18+ | File operations | Reading/writing imported images before OCR |
| react-native-reanimated | v3+ | Smooth animations | Horizontal scroll, category expand/collapse animations |
| expo-secure-store | v14+ | Secure key-value storage | Storing cloud sync credentials/tokens |
| expo-sharing | v13+ | Share sheet integration | Receiving screenshots shared from trading apps |

### OCR / AI Options

| Technology | Type | Pros | Cons | Verdict |
|------------|------|------|------|---------|
| ML Kit Text Recognition | Google on-device SDK | Free, works offline, good accuracy on structured text | May struggle with dense trading UIs; Android-first, iOS via Firebase | **Recommended** for v1 |
| Tesseract.js | Open-source OCR | Fully customizable, no API keys | Slower, needs tuning for each trading app layout | **Fallback** if ML Kit fails |
| Apple Vision (VNRecognizeTextRequest) | iOS native | Fast, excellent accuracy on iOS | iOS-only, needs Android alternative | **Use on iOS** via expo-module |
| Google Cloud Vision | Cloud API | Highest accuracy | Paid, requires network, adds latency | **Out of scope** (on-device constraint) |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Expo Go | Dev testing on device | Quick iteration, no build required |
| EAS Build | Production builds | Cloud builds for iOS/Android |
| ESLint + Prettier | Code quality | Standard Expo config |

## Installation

```bash
# Core
npx create-expo-app@latest finance-tracker --template tabs

# Navigation (included with tabs template)
# npx expo install expo-router

# State & Storage
npx expo install zustand expo-sqlite

# Image / File
npx expo install expo-image-picker expo-file-system expo-sharing

# UI & Animation
npx expo install react-native-reanimated

# Secure storage
npx expo install expo-secure-store
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Expo | Flutter | If team knows Dart, or needs complex custom rendering |
| expo-sqlite | WatermelonDB | If you need lazy-loading, sync engine, or complex relational queries |
| Zustand | Redux Toolkit | If team already uses Redux or needs middleware-heavy architecture |
| ML Kit | Tesseract.js | If you need offline OCR but can't use Google SDK |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Realm / MongoDB | Overkill for single-user local storage, heavy native dependency | expo-sqlite |
| AsyncStorage for structured data | Not designed for relational queries, no indexing | expo-sqlite |
| react-navigation (standalone) | Expo Router is the convention for Expo projects | Expo Router |
| Firebase Firestore as primary DB | Requires network, paid at scale, conflicts with local-first approach | expo-sqlite local + optional Firebase backup |

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| expo@52 | react-native@0.76+ | SDK 52 minimum |
| expo-router@4 | expo@52 | File-based routing |
| react-native-reanimated@3 | expo@52 | Works out of box |

---
*Stack research for: Finance Tracker mobile app*
*Researched: 2026-04-29*
