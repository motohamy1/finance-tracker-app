import { describe, it, expect, vi } from 'vitest';

vi.mock('expo-file-system/legacy', () => ({
  getInfoAsync: vi.fn(),
  copyAsync: vi.fn(),
  deleteAsync: vi.fn(),
  cacheDirectory: '/mock-cache/',
}));

vi.mock('expo-image-manipulator', () => ({
  manipulateAsync: vi.fn(),
  SaveFormat: { JPEG: 'jpeg', PNG: 'png' },
}));

vi.mock('@react-native-ml-kit/text-recognition', () => ({
  default: { recognize: vi.fn() },
}));

import { parseTradeFromText } from '@/services/ocr';

describe('parseTradeFromText with Thndr screenshots (Arabic)', () => {
  it('extracts data from Thndr Sell Order (BONY)', () => {
    const rawText = `
BONY
بنيان للتنمية والتجارة
نوع الطلب طلب بيع
تفاصيل الطلب طلب بسعر محدد @ 4.40 ج.م
وحدات 100
نوع الصلاحية صالح لتاريخ معين
تاريخ انتهاء الصلاحية 27-05-2026
الوقت 27-04-2026 12:51 PM
الرسوم المتوقعة 5.57 ج.م
الاجمالي المتوقع 434.43 ج.م
    `;

    const result = parseTradeFromText(rawText);

    expect(result.ticker).toBe('BONY');
    expect(result.direction).toBe('sell');
    expect(result.shares).toBe(100);
    expect(result.pricePerShare).toBe(4.40);
    expect(result.tradeDate).toBe('2026-04-27');
  });

  it('extracts data from Thndr Buy Order (SEIG)', () => {
    const rawText = `
SEIG
السعودية المصرية للاس...
نوع الطلب طلب شراء
تفاصيل الطلب طلب بسعر محدد @ 197.70 ج.م
وحدات 6
نوع الصلاحية صالح لتاريخ معين
28-05-2026
28-04-2026 12:12 PM
الرسوم المتوقعة 6.54 ج.م
الاجمالي المتوقع 1,192.74 ج.م
    `;

    const result = parseTradeFromText(rawText);

    expect(result.ticker).toBe('SEIG');
    expect(result.direction).toBe('buy');
    expect(result.shares).toBe(6);
    expect(result.pricePerShare).toBe(197.70);
    expect(result.tradeDate).toBe('2026-04-28');
  });

  it('extracts data from Thndr Sell Order (DSCW)', () => {
    const rawText = `
DSCW
دايس للملابس الجاهزة
نوع الطلب طلب بيع
تفاصيل الطلب طلب بسعر محدد @ 2.12 ج.م
وحدات 300
27-05-2026
27-04-2026 11:29 AM
الرسوم المتوقعة 5.83 ج.م
الاجمالي المتوقع 630.17 ج.م
    `;

    const result = parseTradeFromText(rawText);

    expect(result.ticker).toBe('DSCW');
    expect(result.direction).toBe('sell');
    expect(result.shares).toBe(300);
    expect(result.pricePerShare).toBe(2.12);
  });
});
