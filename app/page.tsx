"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";

// ==========================================
// 1. أنواع البيانات الهندسية (TypeScript Types)
// ==========================================
type ComponentKind =
  | "battery_pack_blue"
  | "battery_9v"
  | "battery_18650"
  | "arduino_mega"
  | "arduino_uno"
  | "esp32_cam"
  | "esp32"
  | "l298n"
  | "breadboard"
  | "tft_face"
  | "lcd_i2c"
  | "ultrasonic"
  | "hc05"
  | "dc_motor"
  | "servo_motor"
  | "led_red"
  | "led_green"
  | "led_blue"
  | "rgb_led"
  | "resistor_220"
  | "resistor_1k"
  | "resistor_10k"
  | "potentiometer"
  | "switch_spdt"
  | "push_button"
  | "buzzer"
  | "relay_5v"
  | "dht11"
  | "ldr";

type CategoryType = "all" | "power" | "mcu" | "output" | "control" | "sensor";

interface PinDef {
  id: string;
  label: string;
  description: string;
  x: number;
  y: number;
  type: "power" | "ground" | "signal" | "passive";
  voltage?: number;
}

interface ComponentSpec {
  kind: ComponentKind;
  nameAr: string;
  nameEn: string;
  category: Exclude<CategoryType, "all">;
  width: number;
  height: number;
  pins: PinDef[];
  xrayTitle: string;
  xrayDescription: string;
  xraySpecs: { label: string; value: string }[];
  internalLayers: string[];
}

interface PlacedComponent {
  id: string;
  kind: ComponentKind;
  x: number;
  y: number;
  isOn: boolean;
  sliderValue: number;
}

interface Wire {
  id: string;
  fromCompId: string;
  fromPinId: string;
  toCompId: string;
  toPinId: string;
  color: string;
}

interface SimResult {
  powered: boolean;
  voltage: number;
  currentMa: number;
  burned: boolean;
  statusText: string;
  extraValue?: string;
}

// ==========================================
// 2. مكتبة الخامات الواقعية (3D Depth & True Pinout)
// ==========================================
const COMPONENT_CATALOG: Record<ComponentKind, ComponentSpec> = {
  battery_pack_blue: {
    kind: "battery_pack_blue",
    nameAr: "حزمة بطاريات ليثيوم 12V",
    nameEn: "Blue 3S Li-Ion Pack",
    category: "power",
    width: 138,
    height: 100,
    pins: [
      { id: "vcc", label: "+12V (Red)", description: "القطب الموجب (+12V DC)", x: 128, y: 34, type: "power", voltage: 12 },
      { id: "gnd", label: "GND (Black)", description: "القطب السالب الأرضي (0V)", x: 128, y: 66, type: "ground", voltage: 0 },
    ],
    xrayTitle: "حزمة بطاريات ليثيوم أيون 3S المغلفة بالـ PVC الأزرق",
    xrayDescription:
      "3 خلايا 18650 على التوالي مع دائرة حماية BMS تمنع الشحن الزائد أو التفريغ العميق وتوفر تياراً عالياً للمحركات.",
    xraySpecs: [
      { label: "الجهد", value: "11.1V - 12.6V" },
      { label: "الحماية", value: "BMS Board" },
      { label: "الاستخدام", value: "روبوتات 4WD و L298N" },
    ],
    internalLayers: [
      "3 خلايا 18650 متصلة على التوالي",
      "دائرة حماية BMS مدمجة",
      "غلاف عازل حراري أزرق سميك",
    ],
  },
  battery_9v: {
    kind: "battery_9v",
    nameAr: "بطارية 9 فولت",
    nameEn: "9V Alkaline Battery",
    category: "power",
    width: 106,
    height: 152,
    pins: [
      { id: "vcc", label: "+9V (Pos)", description: "القطب الموجب الدائري الصغير (+9V)", x: 36, y: 12, type: "power", voltage: 9 },
      { id: "gnd", label: "GND (Neg)", description: "القطب السالب السداسي الكبير (GND)", x: 70, y: 12, type: "ground", voltage: 0 },
    ],
    xrayTitle: "بطارية قلوية 9V (6LR61)",
    xrayDescription:
      "تتكون من 6 خلايا 1.5V على التوالي. الموجب دائري صغير والسالب سداسي أكبر لمنع عكس الكبسولة في الحقيقة.",
    xraySpecs: [
      { label: "الجهد", value: "9.0V DC" },
      { label: "السعة", value: "550 mAh" },
    ],
    internalLayers: ["6 خلايا LR61 متتالية", "غلاف معدني عازل", "أقطاب كبس قياسية"],
  },
  battery_18650: {
    kind: "battery_18650",
    nameAr: "حامل بطاريتين 18650",
    nameEn: "Dual 18650 Pack (7.4V)",
    category: "power",
    width: 144,
    height: 98,
    pins: [
      { id: "vcc", label: "+7.4V (Red)", description: "سلك الموجب الأحمر (+7.4V)", x: 134, y: 34, type: "power", voltage: 7.4 },
      { id: "gnd", label: "GND (Black)", description: "سلك السالب الأسود (GND)", x: 134, y: 64, type: "ground", voltage: 0 },
    ],
    xrayTitle: "حامل بطاريتين 18650 Li-Ion",
    xrayDescription: "يعطي جهداً مستقراً 7.4V وتياراً عالياً لتشغيل درايفر المحركات والأردوينو.",
    xraySpecs: [
      { label: "الجهد", value: "7.4V DC" },
      { label: "السعة", value: "2200 mAh" },
    ],
    internalLayers: ["خليتان 18650 على التوالي", "حامل بلاستيكي بنوابض نحاسية", "أسلاك خروج حمراء وسوداء"],
  },
  arduino_mega: {
    kind: "arduino_mega",
    nameAr: "أردوينو ميجا 2560",
    nameEn: "Arduino Mega 2560 R3",
    category: "mcu",
    width: 290,
    height: 182,
    pins: [
      { id: "gnd_top", label: "GND", description: "أرضي علوي (Ground)", x: 98, y: 15, type: "ground", voltage: 0 },
      { id: "d13", label: "D13 (LED)", description: "منفذ رقمي 13", x: 111, y: 15, type: "power", voltage: 5 },
      { id: "d12", label: "D12", description: "منفذ رقمي 12", x: 124, y: 15, type: "power", voltage: 5 },
      { id: "d11", label: "~D11 (PWM)", description: "منفذ رقمي 11 PWM", x: 137, y: 15, type: "power", voltage: 5 },
      { id: "d10", label: "~D10 (PWM)", description: "منفذ رقمي 10 PWM", x: 150, y: 15, type: "power", voltage: 5 },
      { id: "d9", label: "~D9 (PWM)", description: "منفذ رقمي 9 PWM", x: 163, y: 15, type: "power", voltage: 5 },
      { id: "d8", label: "D8", description: "منفذ رقمي 8", x: 176, y: 15, type: "power", voltage: 5 },
      { id: "tx1", label: "TX1 (18)", description: "منفذ تسلسلي Serial1 TX", x: 205, y: 15, type: "signal" },
      { id: "rx1", label: "RX1 (19)", description: "منفذ تسلسلي Serial1 RX", x: 218, y: 15, type: "signal" },
      { id: "sda20", label: "SDA (20)", description: "خط بيانات I2C SDA", x: 231, y: 15, type: "signal" },
      { id: "scl21", label: "SCL (21)", description: "خط ساعة I2C SCL", x: 244, y: 15, type: "signal" },
      { id: "v33", label: "3.3V", description: "مخرج 3.3 فولت", x: 86, y: 167, type: "power", voltage: 3.3 },
      { id: "v5", label: "5V", description: "مخرج 5 فولت لتغذية الحساسات والشاشات", x: 99, y: 167, type: "power", voltage: 5 },
      { id: "gnd1", label: "GND", description: "طرف أرضي 1", x: 112, y: 167, type: "ground", voltage: 0 },
      { id: "gnd2", label: "GND", description: "طرف أرضي 2", x: 125, y: 167, type: "ground", voltage: 0 },
      { id: "vin", label: "VIN", description: "مدخل تغذية 7V - 12V", x: 138, y: 167, type: "passive" },
      { id: "a0", label: "A0", description: "مدخل تناظري A0", x: 158, y: 167, type: "signal" },
      { id: "a1", label: "A1", description: "مدخل تناظري A1", x: 171, y: 167, type: "signal" },
      { id: "a2", label: "A2", description: "مدخل تناظري A2", x: 184, y: 167, type: "signal" },
    ],
    xrayTitle: "لوحة Arduino Mega 2560 R3 (متحكم الروبوتات المتقدمة)",
    xrayDescription:
      "تضم معالج ATmega2560 بذاكرة 256KB و 54 منفذاً رقمياً و 4 منافذ Serial مستقلة لتشغيل كاميرا، شاشة، بلوتوث، وحساسات متعددة في آنٍ واحد.",
    xraySpecs: [
      { label: "المعالج", value: "ATmega2560 (16MHz)" },
      { label: "المنافذ الرقمية", value: "54 بن (15 PWM)" },
      { label: "المنافذ التناظرية", value: "16 بن (A0 - A15)" },
    ],
    internalLayers: [
      "بوردة FR4 زرقاء بطبقة نحاسية سميكة",
      "معالج ATmega2560 مربع بـ 100 رجل",
      "منفذ USB Type-B وزر Reset",
    ],
  },
  arduino_uno: {
    kind: "arduino_uno",
    nameAr: "أردوينو أونو R3",
    nameEn: "Arduino Uno R3",
    category: "mcu",
    width: 248,
    height: 174,
    pins: [
      { id: "gnd_top", label: "GND", description: "أرضي علوي", x: 105, y: 15, type: "ground", voltage: 0 },
      { id: "d13", label: "D13 (LED)", description: "منفذ رقمي 13", x: 117, y: 15, type: "power", voltage: 5 },
      { id: "d12", label: "D12", description: "منفذ رقمي 12", x: 129, y: 15, type: "power", voltage: 5 },
      { id: "d11", label: "~D11 (PWM)", description: "منفذ رقمي 11 PWM", x: 141, y: 15, type: "power", voltage: 5 },
      { id: "d10", label: "~D10 (PWM)", description: "منفذ رقمي 10 PWM", x: 153, y: 15, type: "power", voltage: 5 },
      { id: "d9", label: "~D9 (PWM)", description: "منفذ رقمي 9 PWM", x: 165, y: 15, type: "power", voltage: 5 },
      { id: "d8", label: "D8", description: "منفذ رقمي 8", x: 177, y: 15, type: "power", voltage: 5 },
      { id: "d7", label: "D7", description: "منفذ رقمي 7", x: 191, y: 15, type: "power", voltage: 5 },
      { id: "v33", label: "3.3V", description: "مخرج 3.3 فولت", x: 90, y: 159, type: "power", voltage: 3.3 },
      { id: "v5", label: "5V", description: "مخرج 5 فولت", x: 102, y: 159, type: "power", voltage: 5 },
      { id: "gnd1", label: "GND", description: "أرضي 1", x: 114, y: 159, type: "ground", voltage: 0 },
      { id: "gnd2", label: "GND", description: "أرضي 2", x: 126, y: 159, type: "ground", voltage: 0 },
      { id: "vin", label: "VIN", description: "مدخل تغذية 7V - 12V", x: 138, y: 159, type: "passive" },
      { id: "a0", label: "A0", description: "مدخل تناظري A0", x: 158, y: 159, type: "signal" },
      { id: "a4", label: "A4 (SDA)", description: "مدخل تناظري A4 / I2C SDA", x: 206, y: 159, type: "signal" },
      { id: "a5", label: "A5 (SCL)", description: "مدخل تناظري A5 / I2C SCL", x: 218, y: 159, type: "signal" },
    ],
    xrayTitle: "لوحة Arduino Uno R3 القياسية",
    xrayDescription: "متحكم ATmega328P مثالي للتجارب السريعة وتعلم أساسيات التحكم الرقمي والتناظري و I2C.",
    xraySpecs: [
      { label: "المعالج", value: "ATmega328P-PU" },
      { label: "الجهد", value: "5V Logic" },
      { label: "I2C", value: "A4 (SDA) / A5 (SCL)" },
    ],
    internalLayers: ["شريحة ATmega328P", "منظم جهد 5V/3.3V", "كريستالة 16MHz"],
  },
  esp32_cam: {
    kind: "esp32_cam",
    nameAr: "كاميرا ESP32-CAM",
    nameEn: "ESP32-CAM OV2640",
    category: "mcu",
    width: 108,
    height: 124,
    pins: [
      { id: "v5", label: "5V", description: "مدخل طاقة 5 فولت", x: 26, y: 114, type: "passive" },
      { id: "gnd", label: "GND", description: "الطرف الأرضي", x: 44, y: 114, type: "passive" },
      { id: "rx", label: "U0R (RX)", description: "استقبال البيانات UART RX", x: 62, y: 114, type: "signal" },
      { id: "tx", label: "U0T (TX)", description: "إرسال البيانات UART TX", x: 80, y: 114, type: "signal" },
    ],
    xrayTitle: "كاميرا وبث مباشر ESP32-CAM OV2640",
    xrayDescription: "تجمع بين معالج ESP32 وكاميرا OV2640 وفلاش LED للبث المباشر والتعرف البصري.",
    xraySpecs: [
      { label: "المستشعر", value: "OV2640 2MP" },
      { label: "التغذية", value: "5V DC" },
    ],
    internalLayers: ["عدسة OV2640 بزاوية واسعة", "فلاش LED أمامي", "شريحة ESP32-S"],
  },
  esp32: {
    kind: "esp32",
    nameAr: "شريحة ESP32 DevKit",
    nameEn: "ESP32 WROOM-32",
    category: "mcu",
    width: 196,
    height: 142,
    pins: [
      { id: "v33", label: "3V3", description: "مخرج 3.3 فولت", x: 34, y: 14, type: "power", voltage: 3.3 },
      { id: "gnd_t", label: "GND", description: "أرضي", x: 50, y: 14, type: "ground", voltage: 0 },
      { id: "d2", label: "D2 (LED)", description: "GPIO 2", x: 82, y: 14, type: "power", voltage: 3.3 },
      { id: "d21", label: "D21 (SDA)", description: "I2C SDA", x: 146, y: 14, type: "signal" },
      { id: "d22", label: "D22 (SCL)", description: "I2C SCL", x: 162, y: 14, type: "signal" },
      { id: "vin", label: "VIN (5V)", description: "5V من USB", x: 34, y: 128, type: "power", voltage: 5 },
      { id: "gnd_b", label: "GND", description: "أرضي سفلي", x: 50, y: 128, type: "ground", voltage: 0 },
      { id: "d34", label: "D34 (ADC)", description: "مدخل تناظري", x: 162, y: 128, type: "signal" },
    ],
    xrayTitle: "شريحة ESP32 DevKit V1",
    xrayDescription: "معالج ثنائي النواة مدمج به Wi-Fi و Bluetooth يعمل بمنطق 3.3V.",
    xraySpecs: [
      { label: "المعالج", value: "Dual-Core 240MHz" },
      { label: "الجهد المنطقي", value: "3.3V" },
    ],
    internalLayers: ["هوائي PCB", "درع معدني", "محول USB CP2102"],
  },
  l298n: {
    kind: "l298n",
    nameAr: "درايفر محركات L298N",
    nameEn: "L298N Dual H-Bridge",
    category: "control",
    width: 170,
    height: 162,
    pins: [
      { id: "out1", label: "OUT1", description: "محرك A طرف 1", x: 14, y: 46, type: "passive" },
      { id: "out2", label: "OUT2", description: "محرك A طرف 2", x: 14, y: 76, type: "passive" },
      { id: "out3", label: "OUT3", description: "محرك B طرف 1", x: 156, y: 46, type: "passive" },
      { id: "out4", label: "OUT4", description: "محرك B طرف 2", x: 156, y: 76, type: "passive" },
      { id: "v12", label: "12V (VMS)", description: "مدخل طاقة المحركات", x: 28, y: 148, type: "passive" },
      { id: "gnd", label: "GND", description: "أرضي مشترك (البطارية + المتحكم)", x: 50, y: 148, type: "ground", voltage: 0 },
      { id: "v5", label: "5V", description: "منظم 5V", x: 72, y: 148, type: "power", voltage: 5 },
      { id: "in1", label: "IN1", description: "تحكم اتجاه 1", x: 98, y: 148, type: "signal" },
      { id: "in2", label: "IN2", description: "تحكم اتجاه 2", x: 116, y: 148, type: "signal" },
      { id: "in3", label: "IN3", description: "تحكم اتجاه 3", x: 134, y: 148, type: "signal" },
    ],
    xrayTitle: "درايفر المحركات L298N بمشتت حراري",
    xrayDescription: "يغذي محركات الروبوت ويعكس اتجاهها ويضبط سرعتها، مع ضرورة توحيد الأرضي (GND).",
    xraySpecs: [
      { label: "الجهد", value: "5V - 35V DC" },
      { label: "التيار", value: "حتى 2A للقناة" },
    ],
    internalLayers: ["مشتت ألومنيوم", "شريحة L298N", "مكثفات تنعيم"],
  },
  tft_face: {
    kind: "tft_face",
    nameAr: "شاشة TFT تفاعلية",
    nameEn: "TFT Face Display",
    category: "output",
    width: 170,
    height: 108,
    pins: [
      { id: "vcc", label: "VCC (5V)", description: "طاقة الشاشة +5V", x: 12, y: 32, type: "passive" },
      { id: "gnd", label: "GND", description: "الأرضي", x: 12, y: 54, type: "passive" },
      { id: "cs", label: "SDA / CS", description: "بيانات العرض SPI", x: 12, y: 76, type: "signal" },
    ],
    xrayTitle: "شاشة الروبوت التفاعلية TFT",
    xrayDescription: "تعرض تعبيرات وجه الروبوت وحالته اللحظية (مبتسم، يقيس المسافة، أو متوقف).",
    xraySpecs: [
      { label: "الواجهة", value: "SPI" },
      { label: "الألوان", value: "65K RGB" },
    ],
    internalLayers: ["لوحة TFT ملونة", "إضاءة خلفية LED", "متحكم عرض"],
  },
  ultrasonic: {
    kind: "ultrasonic",
    nameAr: "حساس مسافة HC-SR04",
    nameEn: "Ultrasonic HC-SR04",
    category: "sensor",
    width: 162,
    height: 104,
    pins: [
      { id: "vcc", label: "VCC (5V)", description: "طاقة +5V", x: 38, y: 94, type: "passive" },
      { id: "trig", label: "TRIG", description: "إرسال النبضة", x: 62, y: 94, type: "signal" },
      { id: "echo", label: "ECHO", description: "استقبال الصدى", x: 86, y: 94, type: "signal" },
      { id: "gnd", label: "GND", description: "الأرضي", x: 110, y: 94, type: "passive" },
    ],
    xrayTitle: "حساس الموجات فوق الصوتية HC-SR04",
    xrayDescription: "يقيس المسافة بدقة من 2 سم إلى 400 سم لتفادي العوائق.",
    xraySpecs: [
      { label: "المدى", value: "2cm - 400cm" },
      { label: "الأطراف", value: "VCC - Trig - Echo - Gnd" },
    ],
    internalLayers: ["مرسل ومستقبل 40kHz", "كريستالة 4MHz", "دائرة معالجة"],
  },
  hc05: {
    kind: "hc05",
    nameAr: "بلوتوث HC-05",
    nameEn: "Bluetooth HC-05",
    category: "sensor",
    width: 90,
    height: 114,
    pins: [
      { id: "vcc", label: "VCC (5V)", description: "طاقة +5V", x: 26, y: 104, type: "passive" },
      { id: "gnd", label: "GND", description: "الأرضي", x: 41, y: 104, type: "passive" },
      { id: "txd", label: "TXD", description: "إرسال UART TXD", x: 56, y: 104, type: "signal" },
      { id: "rxd", label: "RXD", description: "استقبال UART RXD", x: 71, y: 104, type: "signal" },
    ],
    xrayTitle: "وحدة البلوتوث HC-05",
    xrayDescription: "تواصل لاسلكي UART للتحكم في الروبوت وإرسال الأوامر الصوتية.",
    xraySpecs: [
      { label: "المدى", value: "10m" },
      { label: "Baud Rate", value: "9600 bps" },
    ],
    internalLayers: ["هوائي PCB", "شريحة BC417", "منظم 3.3V"],
  },
  dc_motor: {
    kind: "dc_motor",
    nameAr: "محرك DC بتروس (TT)",
    nameEn: "DC Geared Motor",
    category: "output",
    width: 154,
    height: 104,
    pins: [
      { id: "pos", label: "+ (Terminal A)", description: "طرف المحرك الأول", x: 12, y: 36, type: "passive" },
      { id: "neg", label: "- (Terminal B)", description: "طرف المحرك الثاني", x: 12, y: 68, type: "passive" },
    ],
    xrayTitle: "محرك DC بتروس 1:48",
    xrayDescription: "محرك عجلات الروبوت ذو عزم عالٍ وسرعة مناسبة للحركة الدقيقة.",
    xraySpecs: [
      { label: "الجهد", value: "3V - 12V DC" },
      { label: "التروس", value: "1:48" },
    ],
    internalLayers: ["محرك DC", "صندوق تروس بلاستيكي", "محور عجلة"],
  },
  servo_motor: {
    kind: "servo_motor",
    nameAr: "محرك سيرفو SG90",
    nameEn: "Micro Servo SG90",
    category: "output",
    width: 142,
    height: 116,
    pins: [
      { id: "gnd", label: "GND (بني)", description: "الأرضي (سلك بني)", x: 34, y: 106, type: "passive" },
      { id: "vcc", label: "VCC (أحمر)", description: "طاقة 5V (سلك أحمر)", x: 71, y: 106, type: "passive" },
      { id: "sig", label: "PWM (برتقالي)", description: "إشارة PWM (سلك برتقالي)", x: 108, y: 106, type: "passive" },
    ],
    xrayTitle: "محرك سيرفو SG90",
    xrayDescription: "يتحرك بزاوية دقيقة من 0° إلى 180° لتحريك كاميرا أو حساس أو ذراع.",
    xraySpecs: [
      { label: "الزاوية", value: "0° - 180°" },
      { label: "الأسلاك", value: "بني - أحمر - برتقالي" },
    ],
    internalLayers: ["تروس دقيقة", "دائرة تحكم", "حساس زاوية"],
  },
  lcd_i2c: {
    kind: "lcd_i2c",
    nameAr: "شاشة LCD 16x2 I2C",
    nameEn: "LCD 1602 I2C",
    category: "output",
    width: 216,
    height: 118,
    pins: [
      { id: "gnd", label: "GND", description: "الأرضي", x: 12, y: 36, type: "passive" },
      { id: "vcc", label: "VCC (5V)", description: "طاقة +5V", x: 12, y: 52, type: "passive" },
      { id: "sda", label: "SDA", description: "خط بيانات I2C", x: 12, y: 68, type: "signal" },
      { id: "scl", label: "SCL", description: "خط ساعة I2C", x: 12, y: 84, type: "signal" },
    ],
    xrayTitle: "شاشة LCD 16x2 I2C",
    xrayDescription: "عرض النصوص والقياسات بـ 4 أسلاك فقط عبر I2C.",
    xraySpecs: [
      { label: "الأبعاد", value: "16×2" },
      { label: "الأطراف", value: "GND - VCC - SDA - SCL" },
    ],
    internalLayers: ["شاشة LCD", "محول I2C", "مقاومة تباين"],
  },
  breadboard: {
    kind: "breadboard",
    nameAr: "لوحة تجارب Breadboard",
    nameEn: "Breadboard 400-Pts",
    category: "control",
    width: 226,
    height: 138,
    pins: [
      { id: "tp1", label: "+ Rail 1", description: "خط موجب علوي", x: 32, y: 16, type: "passive" },
      { id: "tp2", label: "+ Rail 2", description: "خط موجب علوي", x: 95, y: 16, type: "passive" },
      { id: "tp3", label: "+ Rail 3", description: "خط موجب علوي", x: 165, y: 16, type: "passive" },
      { id: "tn1", label: "- Rail 1", description: "خط سالب علوي", x: 32, y: 28, type: "passive" },
      { id: "tn2", label: "- Rail 2", description: "خط سالب علوي", x: 95, y: 28, type: "passive" },
      { id: "tn3", label: "- Rail 3", description: "خط سالب علوي", x: 165, y: 28, type: "passive" },
      { id: "col1_t1", label: "Col 5 Top", description: "عمود 5 علوي", x: 48, y: 50, type: "passive" },
      { id: "col2_t1", label: "Col 12 Top", description: "عمود 12 علوي", x: 112, y: 50, type: "passive" },
      { id: "col3_t1", label: "Col 18 Top", description: "عمود 18 علوي", x: 176, y: 50, type: "passive" },
      { id: "col1_b1", label: "Col 5 Bot", description: "عمود 5 سفلي", x: 48, y: 82, type: "passive" },
      { id: "col2_b1", label: "Col 12 Bot", description: "عمود 12 سفلي", x: 112, y: 82, type: "passive" },
      { id: "col3_b1", label: "Col 18 Bot", description: "عمود 18 سفلي", x: 176, y: 82, type: "passive" },
    ],
    xrayTitle: "لوحة التجارب Breadboard",
    xrayDescription: "توصيل سريع بدون لحام بمسارات أفقية للطاقة وأعمدة رأسية للإشارات.",
    xraySpecs: [
      { label: "المسافة", value: "2.54mm" },
      { label: "النقاط", value: "400 نقطة" },
    ],
    internalLayers: ["قضبان نحاسية أفقية", "مشابك رأسية 5 نقاط", "قناة فاصلة وسطى"],
  },
  led_red: {
    kind: "led_red",
    nameAr: "ليد أحمر 5mm",
    nameEn: "Red LED",
    category: "output",
    width: 78,
    height: 122,
    pins: [
      { id: "anode", label: "Anode (+)", description: "الرجل الطويلة الموجبة", x: 28, y: 112, type: "passive" },
      { id: "cathode", label: "Cathode (-)", description: "الرجل القصيرة السالبة", x: 50, y: 112, type: "passive" },
    ],
    xrayTitle: "ليد أحمر 5mm",
    xrayDescription: "يحتاج مقاومة حماية (220Ω) عند التوصيل بمصادر 5V أو 9V.",
    xraySpecs: [{ label: "الجهد", value: "~2.0V" }],
    internalLayers: ["شريحة LED", "أنود (+)", "كاثود (-)"],
  },
  led_green: {
    kind: "led_green",
    nameAr: "ليد أخضر 5mm",
    nameEn: "Green LED",
    category: "output",
    width: 78,
    height: 122,
    pins: [
      { id: "anode", label: "Anode (+)", description: "الرجل الطويلة الموجبة", x: 28, y: 112, type: "passive" },
      { id: "cathode", label: "Cathode (-)", description: "الرجل القصيرة السالبة", x: 50, y: 112, type: "passive" },
    ],
    xrayTitle: "ليد أخضر 5mm",
    xrayDescription: "مؤشر حالة أخضر قياسي.",
    xraySpecs: [{ label: "الجهد", value: "~2.2V" }],
    internalLayers: ["شريحة InGaN", "أنود (+)", "كاثود (-)"],
  },
  led_blue: {
    kind: "led_blue",
    nameAr: "ليد أزرق 5mm",
    nameEn: "Blue LED",
    category: "output",
    width: 78,
    height: 122,
    pins: [
      { id: "anode", label: "Anode (+)", description: "الرجل الطويلة الموجبة", x: 28, y: 112, type: "passive" },
      { id: "cathode", label: "Cathode (-)", description: "الرجل القصيرة السالبة", x: 50, y: 112, type: "passive" },
    ],
    xrayTitle: "ليد أزرق 5mm",
    xrayDescription: "ليد أزرق عالي السطوع.",
    xraySpecs: [{ label: "الجهد", value: "~3.1V" }],
    internalLayers: ["شريحة GaN", "أنود (+)", "كاثود (-)"],
  },
  rgb_led: {
    kind: "rgb_led",
    nameAr: "ليد RGB 4 أطراف",
    nameEn: "RGB LED (R-GND-G-B)",
    category: "output",
    width: 108,
    height: 122,
    pins: [
      { id: "r", label: "R", description: "أحمر", x: 24, y: 112, type: "passive" },
      { id: "gnd", label: "GND (الأطول)", description: "أرضي مشترك", x: 40, y: 112, type: "passive" },
      { id: "g", label: "G", description: "أخضر", x: 60, y: 112, type: "passive" },
      { id: "b", label: "B", description: "أزرق", x: 80, y: 112, type: "passive" },
    ],
    xrayTitle: "ليد RGB رباعي الأطراف",
    xrayDescription: "الترتيب الحقيقي: R ثم الأطول GND ثم G ثم B.",
    xraySpecs: [{ label: "الترتيب", value: "R - GND - G - B" }],
    internalLayers: ["3 ألوان داخل عدسة واحدة", "أرضي مشترك"],
  },
  resistor_220: {
    kind: "resistor_220",
    nameAr: "مقاومة 220 أوم",
    nameEn: "Resistor 220Ω",
    category: "control",
    width: 132,
    height: 66,
    pins: [
      { id: "p1", label: "Pin 1", description: "طرف 1", x: 10, y: 33, type: "passive" },
      { id: "p2", label: "Pin 2", description: "طرف 2", x: 122, y: 33, type: "passive" },
    ],
    xrayTitle: "مقاومة 220Ω",
    xrayDescription: "أحمر - أحمر - بني - ذهبي.",
    xraySpecs: [{ label: "القيمة", value: "220 Ω" }],
    internalLayers: ["فيلم كربوني", "قلب خزفي"],
  },
  resistor_1k: {
    kind: "resistor_1k",
    nameAr: "مقاومة 1 كيلو أوم",
    nameEn: "Resistor 1kΩ",
    category: "control",
    width: 132,
    height: 66,
    pins: [
      { id: "p1", label: "Pin 1", description: "طرف 1", x: 10, y: 33, type: "passive" },
      { id: "p2", label: "Pin 2", description: "طرف 2", x: 122, y: 33, type: "passive" },
    ],
    xrayTitle: "مقاومة 1kΩ",
    xrayDescription: "بني - أسود - أحمر - ذهبي.",
    xraySpecs: [{ label: "القيمة", value: "1,000 Ω" }],
    internalLayers: ["فيلم كربوني", "قلب خزفي"],
  },
  resistor_10k: {
    kind: "resistor_10k",
    nameAr: "مقاومة 10 كيلو أوم",
    nameEn: "Resistor 10kΩ",
    category: "control",
    width: 132,
    height: 66,
    pins: [
      { id: "p1", label: "Pin 1", description: "طرف 1", x: 10, y: 33, type: "passive" },
      { id: "p2", label: "Pin 2", description: "طرف 2", x: 122, y: 33, type: "passive" },
    ],
    xrayTitle: "مقاومة 10kΩ",
    xrayDescription: "بني - أسود - برتقالي - ذهبي.",
    xraySpecs: [{ label: "القيمة", value: "10,000 Ω" }],
    internalLayers: ["فيلم كربوني", "قلب خزفي"],
  },
  potentiometer: {
    kind: "potentiometer",
    nameAr: "مقاومة متغيرة 3 أطراف",
    nameEn: "Potentiometer 10kΩ",
    category: "control",
    width: 108,
    height: 114,
    pins: [
      { id: "p1", label: "Pin 1", description: "طرف ثابت 1", x: 32, y: 104, type: "passive" },
      { id: "wiper", label: "Wiper", description: "الطرف الأوسط المتحرك", x: 54, y: 104, type: "passive" },
      { id: "p3", label: "Pin 3", description: "طرف ثابت 3", x: 76, y: 104, type: "passive" },
    ],
    xrayTitle: "مقاومة متغيرة 3 أرجل",
    xrayDescription: "الأوسط (Wiper) يتحرك بين الطرف 1 والطرف 3.",
    xraySpecs: [{ label: "القيمة", value: "10 kΩ" }],
    internalLayers: ["مسار كربوني", "منزلق معدني"],
  },
  switch_spdt: {
    kind: "switch_spdt",
    nameAr: "مفتاح منزلق 3 أطراف",
    nameEn: "Slide Switch SPDT",
    category: "control",
    width: 100,
    height: 90,
    pins: [
      { id: "p1", label: "Pin 1", description: "يسار", x: 28, y: 80, type: "passive" },
      { id: "common", label: "Common", description: "الأوسط المشترك", x: 50, y: 80, type: "passive" },
      { id: "p2", label: "Pin 2", description: "يمين", x: 72, y: 80, type: "passive" },
    ],
    xrayTitle: "مفتاح SPDT ثلاثي الأطراف",
    xrayDescription: "يربط الطرف الأوسط Common بأحد الطرفين.",
    xraySpecs: [{ label: "النوع", value: "SPDT" }],
    internalLayers: ["منزلق نحاسي", "3 أرجل"],
  },
  push_button: {
    kind: "push_button",
    nameAr: "زر ضاغط 4 أطراف",
    nameEn: "Tactile Button 4-Pin",
    category: "control",
    width: 92,
    height: 92,
    pins: [
      { id: "p1a", label: "1A", description: "متصل مع 1B", x: 18, y: 24, type: "passive" },
      { id: "p2a", label: "2A", description: "متصل مع 2B", x: 74, y: 24, type: "passive" },
      { id: "p1b", label: "1B", description: "متصل مع 1A", x: 18, y: 68, type: "passive" },
      { id: "p2b", label: "2B", description: "متصل مع 2A", x: 74, y: 68, type: "passive" },
    ],
    xrayTitle: "زر ضاغط 4 أرجل",
    xrayDescription: "1A و 1B متصلان دائماً، والضغط يربط الجانب الأيسر بالأيمن.",
    xraySpecs: [{ label: "الأرجل", value: "4 أرجل" }],
    internalLayers: ["قضبان داخلية", "قبة معدنية"],
  },
  buzzer: {
    kind: "buzzer",
    nameAr: "جرس إنذار Piezo",
    nameEn: "Active Buzzer",
    category: "output",
    width: 92,
    height: 100,
    pins: [
      { id: "pos", label: "+", description: "موجب", x: 32, y: 90, type: "passive" },
      { id: "neg", label: "-", description: "سالب", x: 60, y: 90, type: "passive" },
    ],
    xrayTitle: "جرس إنذار نشط",
    xrayDescription: "يصدر صوتاً عند توصيل الطاقة الصحيحة.",
    xraySpecs: [{ label: "التردد", value: "2300 Hz" }],
    internalLayers: ["قرص Piezo", "مذبذب داخلي"],
  },
  relay_5v: {
    kind: "relay_5v",
    nameAr: "مديول ريلاي 5V",
    nameEn: "5V Relay Module",
    category: "control",
    width: 152,
    height: 100,
    pins: [
      { id: "vcc", label: "VCC", description: "5V", x: 12, y: 32, type: "passive" },
      { id: "gnd", label: "GND", description: "أرضي", x: 12, y: 50, type: "passive" },
      { id: "in", label: "IN", description: "تحكم", x: 12, y: 68, type: "signal" },
      { id: "no", label: "NO", description: "مفتوح طبيعياً", x: 140, y: 30, type: "passive" },
      { id: "com", label: "COM", description: "مشترك", x: 140, y: 50, type: "passive" },
      { id: "nc", label: "NC", description: "مغلق طبيعياً", x: 140, y: 70, type: "passive" },
    ],
    xrayTitle: "ريلاي 5V",
    xrayDescription: "مفتاح كهرومغناطيسي للتحكم في الأحمال.",
    xraySpecs: [{ label: "التحمل", value: "10A / 250V AC" }],
    internalLayers: ["ملف مغناطيسي", "مفتاح NO/COM/NC"],
  },
  dht11: {
    kind: "dht11",
    nameAr: "حساس حرارة ورطوبة",
    nameEn: "DHT11 Sensor",
    category: "sensor",
    width: 100,
    height: 106,
    pins: [
      { id: "vcc", label: "VCC", description: "طاقة", x: 30, y: 96, type: "passive" },
      { id: "data", label: "DATA", description: "بيانات", x: 50, y: 96, type: "signal" },
      { id: "gnd", label: "GND", description: "أرضي", x: 70, y: 96, type: "passive" },
    ],
    xrayTitle: "حساس DHT11",
    xrayDescription: "يقيس الحرارة والرطوبة.",
    xraySpecs: [{ label: "الحرارة", value: "0°C - 50°C" }],
    internalLayers: ["مستشعر رطوبة", "مقاومة حرارية"],
  },
  ldr: {
    kind: "ldr",
    nameAr: "مقاومة ضوئية LDR",
    nameEn: "Photoresistor LDR",
    category: "sensor",
    width: 86,
    height: 96,
    pins: [
      { id: "p1", label: "Pin 1", description: "طرف 1", x: 32, y: 86, type: "passive" },
      { id: "p2", label: "Pin 2", description: "طرف 2", x: 54, y: 86, type: "passive" },
    ],
    xrayTitle: "مقاومة ضوئية LDR",
    xrayDescription: "تتغير مقاومتها مع شدة الإضاءة.",
    xraySpecs: [{ label: "النوع", value: "CdS Photoresistor" }],
    internalLayers: ["قرص حساس للضوء", "رجلان"],
  },
};

// ==========================================
// 3. تجارب ومشروعات جاهزة
// ==========================================
interface CircuitTemplate {
  id: string;
  title: string;
  badge: string;
  description: string;
  components: PlacedComponent[];
  wires: Wire[];
}

const TEMPLATES: CircuitTemplate[] = [
  {
    id: "ai_smart_robot",
    title: "1. الروبوت التفاعلي الذكي (مشروعك)",
    badge: "مشروعك المتكامل ⭐",
    description:
      "أردوينو ميجا + كاميرا ESP32-CAM + شاشة وجه TFT + حساسات مسافة + بلوتوث HC-05 + درايفر L298N + بطارية 12V.",
    components: [
      { id: "r_batt", kind: "battery_pack_blue", x: 55, y: 55, isOn: true, sliderValue: 50 },
      { id: "r_bt", kind: "hc05", x: 75, y: 205, isOn: true, sliderValue: 50 },
      { id: "r_ard", kind: "arduino_mega", x: 225, y: 185, isOn: true, sliderValue: 50 },
      { id: "r_cam", kind: "esp32_cam", x: 315, y: 40, isOn: true, sliderValue: 50 },
      { id: "r_face", kind: "tft_face", x: 575, y: 180, isOn: true, sliderValue: 50 },
      { id: "r_us_front", kind: "ultrasonic", x: 575, y: 310, isOn: true, sliderValue: 35 },
      { id: "r_us_side", kind: "ultrasonic", x: 575, y: 50, isOn: true, sliderValue: 65 },
      { id: "r_drv", kind: "l298n", x: 285, y: 390, isOn: true, sliderValue: 50 },
      { id: "r_mot", kind: "dc_motor", x: 60, y: 400, isOn: true, sliderValue: 50 },
    ],
    wires: [
      { id: "rw1", fromCompId: "r_batt", fromPinId: "vcc", toCompId: "r_drv", toPinId: "v12", color: "#ef4444" },
      { id: "rw2", fromCompId: "r_batt", fromPinId: "gnd", toCompId: "r_drv", toPinId: "gnd", color: "#1e293b" },
      { id: "rw3", fromCompId: "r_drv", fromPinId: "out1", toCompId: "r_mot", toPinId: "pos", color: "#f97316" },
      { id: "rw4", fromCompId: "r_drv", fromPinId: "out2", toCompId: "r_mot", toPinId: "neg", color: "#2563eb" },
      { id: "rw5", fromCompId: "r_ard", fromPinId: "v5", toCompId: "r_cam", toPinId: "v5", color: "#ef4444" },
      { id: "rw6", fromCompId: "r_ard", fromPinId: "gnd_top", toCompId: "r_cam", toPinId: "gnd", color: "#1e293b" },
      { id: "rw7", fromCompId: "r_ard", fromPinId: "v5", toCompId: "r_face", toPinId: "vcc", color: "#ef4444" },
      { id: "rw8", fromCompId: "r_ard", fromPinId: "gnd1", toCompId: "r_face", toPinId: "gnd", color: "#1e293b" },
      { id: "rw9", fromCompId: "r_ard", fromPinId: "v5", toCompId: "r_bt", toPinId: "vcc", color: "#ef4444" },
      { id: "rw10", fromCompId: "r_ard", fromPinId: "gnd2", toCompId: "r_bt", toPinId: "gnd", color: "#1e293b" },
      { id: "rw11", fromCompId: "r_ard", fromPinId: "tx1", toCompId: "r_bt", toPinId: "rxd", color: "#a855f7" },
      { id: "rw12", fromCompId: "r_ard", fromPinId: "rx1", toCompId: "r_bt", toPinId: "txd", color: "#2563eb" },
      { id: "rw13", fromCompId: "r_ard", fromPinId: "v5", toCompId: "r_us_front", toPinId: "vcc", color: "#f97316" },
      { id: "rw14", fromCompId: "r_ard", fromPinId: "gnd1", toCompId: "r_us_front", toPinId: "gnd", color: "#1e293b" },
      { id: "rw15", fromCompId: "r_ard", fromPinId: "d9", toCompId: "r_us_front", toPinId: "trig", color: "#eab308" },
      { id: "rw16", fromCompId: "r_ard", fromPinId: "d10", toCompId: "r_us_front", toPinId: "echo", color: "#16a34a" },
      { id: "rw17", fromCompId: "r_ard", fromPinId: "v5", toCompId: "r_us_side", toPinId: "vcc", color: "#f97316" },
      { id: "rw18", fromCompId: "r_ard", fromPinId: "gnd_top", toCompId: "r_us_side", toPinId: "gnd", color: "#1e293b" },
    ],
  },
  {
    id: "basic_led",
    title: "2. دائرة LED آمنة بمفتاح 3 أطراف",
    badge: "مبتدئ",
    description: "بطارية 9V + مفتاح SPDT + مقاومة 220Ω + ليد أحمر.",
    components: [
      { id: "c1", kind: "battery_9v", x: 90, y: 190, isOn: true, sliderValue: 50 },
      { id: "c2", kind: "switch_spdt", x: 260, y: 95, isOn: true, sliderValue: 50 },
      { id: "c3", kind: "resistor_220", x: 430, y: 110, isOn: true, sliderValue: 50 },
      { id: "c4", kind: "led_red", x: 630, y: 205, isOn: true, sliderValue: 50 },
    ],
    wires: [
      { id: "w1", fromCompId: "c1", fromPinId: "vcc", toCompId: "c2", toPinId: "common", color: "#ef4444" },
      { id: "w2", fromCompId: "c2", fromPinId: "p2", toCompId: "c3", toPinId: "p1", color: "#f97316" },
      { id: "w3", fromCompId: "c3", fromPinId: "p2", toCompId: "c4", toPinId: "anode", color: "#16a34a" },
      { id: "w4", fromCompId: "c4", fromPinId: "cathode", toCompId: "c1", toPinId: "gnd", color: "#1e293b" },
    ],
  },
  {
    id: "arduino_ultrasonic_lcd",
    title: "3. نظام قياس المسافة بالأردوينو والشاشة",
    badge: "واقعي",
    description: "Arduino Uno + حساس HC-SR04 + شاشة LCD I2C.",
    components: [
      { id: "c1", kind: "arduino_uno", x: 90, y: 185, isOn: true, sliderValue: 50 },
      { id: "c2", kind: "ultrasonic", x: 410, y: 75, isOn: true, sliderValue: 35 },
      { id: "c3", kind: "lcd_i2c", x: 405, y: 245, isOn: true, sliderValue: 50 },
    ],
    wires: [
      { id: "w1", fromCompId: "c1", fromPinId: "v5", toCompId: "c2", toPinId: "vcc", color: "#ef4444" },
      { id: "w2", fromCompId: "c1", fromPinId: "d9", toCompId: "c2", toPinId: "trig", color: "#eab308" },
      { id: "w3", fromCompId: "c1", fromPinId: "d10", toCompId: "c2", toPinId: "echo", color: "#16a34a" },
      { id: "w4", fromCompId: "c1", fromPinId: "gnd1", toCompId: "c2", toPinId: "gnd", color: "#1e293b" },
      { id: "w5", fromCompId: "c1", fromPinId: "v5", toCompId: "c3", toPinId: "vcc", color: "#ef4444" },
      { id: "w6", fromCompId: "c1", fromPinId: "gnd2", toCompId: "c3", toPinId: "gnd", color: "#1e293b" },
      { id: "w7", fromCompId: "c1", fromPinId: "a4", toCompId: "c3", toPinId: "sda", color: "#2563eb" },
      { id: "w8", fromCompId: "c1", fromPinId: "a5", toCompId: "c3", toPinId: "scl", color: "#a855f7" },
    ],
  },
];

const WIRE_COLORS = [
  { name: "أحمر (VCC)", hex: "#ef4444" },
  { name: "أسود (GND)", hex: "#1e293b" },
  { name: "أخضر (إشارة)", hex: "#16a34a" },
  { name: "أصفر (Trig/PWM)", hex: "#eab308" },
  { name: "برتقالي", hex: "#f97316" },
  { name: "أزرق (SDA/Echo)", hex: "#2563eb" },
  { name: "بنفسجي (SCL/UART)", hex: "#a855f7" },
];

// ==========================================
// 4. محرك المحاكاة الفيزيائية اللحظية
// ==========================================
function runCircuitSimulation(
  components: PlacedComponent[],
  wires: Wire[],
  isRunning: boolean
): Record<string, SimResult> {
  const results: Record<string, SimResult> = {};
  components.forEach((c) => {
    results[c.id] = {
      powered: false,
      voltage: 0,
      currentMa: 0,
      burned: false,
      statusText: isRunning ? "دائرة مفتوحة (تأكد من توصيل VCC و GND)" : "المحاكاة متوقفة",
    };
  });

  if (!isRunning) return results;

  type Edge = { to: string; resistance: number };
  const adj: Record<string, Edge[]> = {};

  const addEdge = (a: string, b: string, resistance: number) => {
    if (!adj[a]) adj[a] = [];
    if (!adj[b]) adj[b] = [];
    adj[a].push({ to: b, resistance });
    adj[b].push({ to: a, resistance });
  };

  wires.forEach((w) => {
    addEdge(`${w.fromCompId}:${w.fromPinId}`, `${w.toCompId}:${w.toPinId}`, 0.01);
  });

  components.forEach((c) => {
    if (c.kind === "resistor_220") addEdge(`${c.id}:p1`, `${c.id}:p2`, 220);
    else if (c.kind === "resistor_1k") addEdge(`${c.id}:p1`, `${c.id}:p2`, 1000);
    else if (c.kind === "resistor_10k") addEdge(`${c.id}:p1`, `${c.id}:p2`, 10000);
    else if (c.kind === "ldr") {
      const r = Math.max(400, ((100 - c.sliderValue) / 100) * 50000);
      addEdge(`${c.id}:p1`, `${c.id}:p2`, r);
    } else if (c.kind === "potentiometer") {
      const r1 = Math.max(5, ((100 - c.sliderValue) / 100) * 1000);
      const r2 = Math.max(5, (c.sliderValue / 100) * 1000);
      addEdge(`${c.id}:p1`, `${c.id}:wiper`, r1);
      addEdge(`${c.id}:wiper`, `${c.id}:p3`, r2);
    } else if (c.kind === "switch_spdt") {
      if (c.isOn) addEdge(`${c.id}:common`, `${c.id}:p2`, 0.05);
      else addEdge(`${c.id}:common`, `${c.id}:p1`, 0.05);
    } else if (c.kind === "push_button") {
      addEdge(`${c.id}:p1a`, `${c.id}:p1b`, 0.01);
      addEdge(`${c.id}:p2a`, `${c.id}:p2b`, 0.01);
      if (c.isOn) addEdge(`${c.id}:p1a`, `${c.id}:p2a`, 0.05);
    } else if (c.kind === "breadboard") {
      addEdge(`${c.id}:tp1`, `${c.id}:tp2`, 0.01);
      addEdge(`${c.id}:tp2`, `${c.id}:tp3`, 0.01);
      addEdge(`${c.id}:tn1`, `${c.id}:tn2`, 0.01);
      addEdge(`${c.id}:tn2`, `${c.id}:tn3`, 0.01);
    }
  });

  const powerNodes: { node: string; voltage: number }[] = [];
  const groundNodes = new Set<string>();

  components.forEach((c) => {
    const spec = COMPONENT_CATALOG[c.kind];
    spec.pins.forEach((p) => {
      if (p.type === "power" && p.voltage) {
        powerNodes.push({ node: `${c.id}:${p.id}`, voltage: p.voltage });
      } else if (p.type === "ground") {
        groundNodes.add(`${c.id}:${p.id}`);
      }
    });
  });

  const findPower = (startNode: string): { voltage: number; resistance: number } | null => {
    const dist: Record<string, number> = { [startNode]: 0 };
    const queue: string[] = [startNode];
    let best: { voltage: number; resistance: number } | null = null;
    while (queue.length > 0) {
      const curr = queue.shift()!;
      const d = dist[curr];
      const pMatch = powerNodes.find((pn) => pn.node === curr);
      if (pMatch && (!best || d < best.resistance)) {
        best = { voltage: pMatch.voltage, resistance: d };
      }
      for (const edge of adj[curr] || []) {
        const nd = d + edge.resistance;
        if (dist[edge.to] === undefined || nd < dist[edge.to]) {
          dist[edge.to] = nd;
          queue.push(edge.to);
        }
      }
    }
    return best;
  };

  const findGround = (startNode: string): number | null => {
    const dist: Record<string, number> = { [startNode]: 0 };
    const queue: string[] = [startNode];
    let best: number | null = null;
    while (queue.length > 0) {
      const curr = queue.shift()!;
      const d = dist[curr];
      if (groundNodes.has(curr) && (best === null || d < best)) {
        best = d;
      }
      for (const edge of adj[curr] || []) {
        const nd = d + edge.resistance;
        if (dist[edge.to] === undefined || nd < dist[edge.to]) {
          dist[edge.to] = nd;
          queue.push(edge.to);
        }
      }
    }
    return best;
  };

  const activeDrivers = new Map<string, number>();
  components.forEach((c) => {
    if (c.kind === "l298n") {
      const p = findPower(`${c.id}:v12`) || findPower(`${c.id}:v5`);
      const g = findGround(`${c.id}:gnd`);
      if (p && g !== null) {
        activeDrivers.set(c.id, p.voltage);
        results[c.id] = {
          powered: true,
          voltage: p.voltage,
          currentMa: 45,
          burned: false,
          statusText: `نشط (${p.voltage}V) — جاهز لتشغيل المحركات`,
        };
      }
    }
  });

  components.forEach((c) => {
    if (
      c.kind === "battery_9v" ||
      c.kind === "battery_18650" ||
      c.kind === "battery_pack_blue" ||
      c.kind === "arduino_uno" ||
      c.kind === "arduino_mega" ||
      c.kind === "esp32"
    ) {
      results[c.id] = {
        powered: true,
        voltage:
          c.kind === "battery_pack_blue"
            ? 12
            : c.kind === "battery_9v"
            ? 9
            : c.kind === "battery_18650"
            ? 7.4
            : c.kind === "esp32"
            ? 3.3
            : 5,
        currentMa: 0,
        burned: false,
        statusText: "مصدر طاقة نشط",
      };
      return;
    }

    if (c.kind === "breadboard") {
      results[c.id] = { powered: true, voltage: 0, currentMa: 0, burned: false, statusText: "لوحة تجارب نشطة" };
      return;
    }

    if (c.kind === "esp32_cam") {
      const p = findPower(`${c.id}:v5`);
      const g = findGround(`${c.id}:gnd`);
      if (p && g !== null) {
        results[c.id] = {
          powered: true,
          voltage: p.voltage,
          currentMa: 180,
          burned: false,
          statusText: "بث فيديو حي نشط (OV2640 Live)",
        };
      }
    } else if (c.kind === "tft_face") {
      const p = findPower(`${c.id}:vcc`);
      const g = findGround(`${c.id}:gnd`);
      if (p && g !== null) {
        results[c.id] = {
          powered: true,
          voltage: p.voltage,
          currentMa: 65,
          burned: false,
          statusText: "شاشة الوجه التفاعلية نشطة 😊",
        };
      }
    } else if (c.kind === "hc05") {
      const p = findPower(`${c.id}:vcc`);
      const g = findGround(`${c.id}:gnd`);
      if (p && g !== null) {
        results[c.id] = {
          powered: true,
          voltage: p.voltage,
          currentMa: 35,
          burned: false,
          statusText: "متصل وجاهز للأوامر (UART)",
        };
      }
    } else if (c.kind === "led_red" || c.kind === "led_green" || c.kind === "led_blue") {
      const p = findPower(`${c.id}:anode`);
      const g = findGround(`${c.id}:cathode`);
      if (p && g !== null) {
        const totalR = p.resistance + g;
        const vDrop = c.kind === "led_blue" ? 3.0 : 2.0;
        const effectiveV = Math.max(0, p.voltage - vDrop);
        const currentMa = totalR < 1 ? 950 : (effectiveV / totalR) * 1000;
        const burned = currentMa > 42;
        results[c.id] = {
          powered: !burned,
          voltage: p.voltage,
          currentMa: Math.round(currentMa * 10) / 10,
          burned,
          statusText: burned ? "💥 احترق! تيار زائد بدون مقاومة" : `مضيء بأمان (${Math.round(currentMa)} mA)`,
        };
      }
    } else if (c.kind === "rgb_led") {
      const pR = findPower(`${c.id}:r`);
      const pG = findPower(`${c.id}:g`);
      const pB = findPower(`${c.id}:b`);
      const g = findGround(`${c.id}:gnd`);
      if ((pR || pG || pB) && g !== null) {
        const activeP = (pR || pG || pB)!;
        const totalR = activeP.resistance + g;
        const currentMa = totalR < 1 ? 850 : ((activeP.voltage - 2) / totalR) * 1000;
        const burned = currentMa > 45;
        results[c.id] = {
          powered: !burned,
          voltage: activeP.voltage,
          currentMa: Math.round(currentMa),
          burned,
          statusText: burned ? "💥 تيار زائد!" : "مضيء بنجاح",
        };
      }
    } else if (c.kind === "dc_motor") {
      const p = findPower(`${c.id}:pos`);
      const g = findGround(`${c.id}:neg`);
      const connectedDriverWire = wires.find(
        (w) =>
          (w.fromCompId === c.id && activeDrivers.has(w.toCompId)) ||
          (w.toCompId === c.id && activeDrivers.has(w.fromCompId))
      );
      if (connectedDriverWire) {
        const drvId = activeDrivers.has(connectedDriverWire.fromCompId)
          ? connectedDriverWire.fromCompId
          : connectedDriverWire.toCompId;
        const drvV = activeDrivers.get(drvId) || 12;
        results[c.id] = {
          powered: true,
          voltage: drvV,
          currentMa: 180,
          burned: false,
          statusText: `يدور عبر L298N (${drvV}V)`,
        };
      } else if (p && g !== null) {
        const totalR = p.resistance + g + 30;
        const currentMa = (p.voltage / totalR) * 1000;
        results[c.id] = {
          powered: true,
          voltage: Math.round(p.voltage * (30 / totalR) * 10) / 10,
          currentMa: Math.round(currentMa),
          burned: false,
          statusText: `يدور بسرعة ${Math.min(100, Math.round((currentMa / 250) * 100))}%`,
        };
      }
    } else if (c.kind === "buzzer") {
      const p = findPower(`${c.id}:pos`);
      const g = findGround(`${c.id}:neg`);
      if (p && g !== null) {
        results[c.id] = { powered: true, voltage: p.voltage, currentMa: 25, burned: false, statusText: "صفارة إنذار نشطة" };
      }
    } else if (c.kind === "servo_motor") {
      const p = findPower(`${c.id}:vcc`);
      const g = findGround(`${c.id}:gnd`);
      if (p && g !== null) {
        const deg = Math.round(c.sliderValue * 1.8);
        results[c.id] = {
          powered: true,
          voltage: p.voltage,
          currentMa: 80,
          burned: false,
          statusText: `الزاوية: ${deg}°`,
          extraValue: `${deg}°`,
        };
      }
    } else if (c.kind === "ultrasonic") {
      const p = findPower(`${c.id}:vcc`);
      const g = findGround(`${c.id}:gnd`);
      if (p && g !== null) {
        const cm = Math.round(c.sliderValue * 3.8 + 3);
        results[c.id] = {
          powered: true,
          voltage: p.voltage,
          currentMa: 15,
          burned: false,
          statusText: `المسافة: ${cm} cm`,
          extraValue: `${cm} cm`,
        };
      }
    } else if (c.kind === "lcd_i2c") {
      const p = findPower(`${c.id}:vcc`);
      const g = findGround(`${c.id}:gnd`);
      if (p && g !== null) {
        results[c.id] = {
          powered: true,
          voltage: p.voltage,
          currentMa: 30,
          burned: false,
          statusText: "الشاشة مضيئة",
          extraValue: "ZATOUNA OK",
        };
      }
    } else if (c.kind === "relay_5v") {
      const p = findPower(`${c.id}:vcc`);
      const g = findGround(`${c.id}:gnd`);
      if (p && g !== null) {
        results[c.id] = { powered: true, voltage: p.voltage, currentMa: 70, burned: false, statusText: "الريلاي نشط" };
      }
    } else if (c.kind === "dht11") {
      const p = findPower(`${c.id}:vcc`);
      const g = findGround(`${c.id}:gnd`);
      if (p && g !== null) {
        const temp = Math.round(15 + c.sliderValue * 0.35);
        const hum = Math.round(30 + c.sliderValue * 0.6);
        results[c.id] = {
          powered: true,
          voltage: p.voltage,
          currentMa: 5,
          burned: false,
          statusText: `الحرارة: ${temp}°C | الرطوبة: ${hum}%`,
        };
      }
    }
  });

  return results;
}

// ==========================================
// 5. التدرجات والظلال الهندسية العميقة
// ==========================================
function SharedSvgDefs() {
  return (
    <svg width="0" height="0" className="absolute pointer-events-none">
      <defs>
        <filter id="softShadow" x="-15%" y="-15%" width="135%" height="135%">
          <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#020617" floodOpacity="0.28" />
        </filter>
        <linearGradient id="battCopper" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#78350f" />
          <stop offset="28%" stopColor="#f59e0b" />
          <stop offset="52%" stopColor="#fef08a" />
          <stop offset="80%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        <linearGradient id="battBody" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#020617" />
          <stop offset="35%" stopColor="#334155" />
          <stop offset="70%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <linearGradient id="bluePackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="45%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#172554" />
        </linearGradient>
        <linearGradient id="arduinoPcb" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="50%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0c4a6e" />
        </linearGradient>
        <linearGradient id="silverMetal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="45%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id="resistorBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="35%" stopColor="#fde68a" />
          <stop offset="80%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        <radialGradient id="ledRedDome" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#fecaca" />
          <stop offset="45%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </radialGradient>
        <radialGradient id="ledGreenDome" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#bbf7d0" />
          <stop offset="45%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#14532d" />
        </radialGradient>
        <radialGradient id="ledBlueDome" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#bfdbfe" />
          <stop offset="45%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </radialGradient>
        <linearGradient id="yellowGearbox" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#854d0e" />
        </linearGradient>
        <linearGradient id="servoBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="55%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
        <linearGradient id="lcdGreen" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#a3e635" />
          <stop offset="100%" stopColor="#4d7c0f" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ==========================================
// 6. رسومات الخامات الهندسية الواقعية
// ==========================================
function ComponentGraphic({
  kind,
  isOn = true,
  sliderValue = 50,
  sim,
  onToggleSwitch,
}: {
  kind: ComponentKind;
  isOn?: boolean;
  sliderValue?: number;
  sim?: SimResult;
  onToggleSwitch?: () => void;
}) {
  const powered = sim?.powered ?? false;
  const burned = sim?.burned ?? false;

  switch (kind) {
    case "battery_pack_blue":
      return (
        <svg width="138" height="100" viewBox="0 0 138 100" filter="url(#softShadow)">
          <rect x="10" y="14" width="108" height="72" rx="14" fill="url(#bluePackGrad)" stroke="#60a5fa" strokeWidth="1.2" />
          <line x1="16" y1="38" x2="112" y2="38" stroke="#0f172a" strokeWidth="1.5" opacity="0.35" />
          <line x1="16" y1="62" x2="112" y2="62" stroke="#0f172a" strokeWidth="1.5" opacity="0.35" />
          <rect x="20" y="20" width="88" height="12" rx="6" fill="#ffffff" opacity="0.16" />
          <text x="64" y="51" textAnchor="middle" fill="#ffffff" fontSize="11.5" fontWeight="900" fontFamily="sans-serif">
            3S 12V Li-Ion
          </text>
          <text x="64" y="74" textAnchor="middle" fill="#bfdbfe" fontSize="8" fontFamily="monospace">
            18650 PACK + BMS
          </text>
          <path d="M118 34 H128" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
          <rect x="124" y="30" width="6" height="8" rx="1.5" fill="#0f172a" />
          <path d="M118 66 H128" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
          <rect x="124" y="62" width="6" height="8" rx="1.5" fill="#0f172a" />
        </svg>
      );

    case "battery_9v":
      return (
        <svg width="106" height="152" viewBox="0 0 106 152" filter="url(#softShadow)">
          <rect x="30" y="6" width="12" height="13" rx="3" fill="url(#silverMetal)" stroke="#475569" strokeWidth="1" />
          <path d="M62 19 V10 L66 6 H74 L78 10 V19 Z" fill="url(#silverMetal)" stroke="#475569" strokeWidth="1" />
          <rect x="16" y="19" width="74" height="120" rx="11" fill="url(#battBody)" stroke="#0f172a" strokeWidth="1.5" />
          <path d="M16 30 A11 11 0 0 1 27 19 H79 A11 11 0 0 1 90 30 V62 H16 Z" fill="url(#battCopper)" />
          <rect x="22" y="24" width="14" height="90" rx="5" fill="#ffffff" opacity="0.08" />
          <text x="53" y="47" textAnchor="middle" fill="#0f172a" fontSize="17" fontWeight="900">9V</text>
          <text x="53" y="84" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">ZATOUNA</text>
          <text x="53" y="99" textAnchor="middle" fill="#94a3b8" fontSize="7.5">6LR61 ALKALINE</text>
          <text x="36" y="124" textAnchor="middle" fill="#f87171" fontSize="14" fontWeight="bold">+</text>
          <text x="70" y="124" textAnchor="middle" fill="#60a5fa" fontSize="16" fontWeight="bold">-</text>
        </svg>
      );

    case "battery_18650":
      return (
        <svg width="144" height="98" viewBox="0 0 144 98" filter="url(#softShadow)">
          <rect x="8" y="10" width="112" height="78" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <rect x="14" y="16" width="100" height="30" rx="5" fill="url(#bluePackGrad)" />
          <rect x="110" y="24" width="5" height="14" fill="url(#silverMetal)" />
          <text x="62" y="34" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
            18650 3.7V LI-ION
          </text>
          <rect x="14" y="52" width="100" height="30" rx="5" fill="url(#bluePackGrad)" />
          <rect x="14" y="60" width="5" height="14" fill="url(#silverMetal)" />
          <text x="66" y="70" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
            18650 3.7V LI-ION
          </text>
          <path d="M120 34 H134" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
          <path d="M120 64 H134" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case "arduino_mega":
      return (
        <svg width="290" height="182" viewBox="0 0 290 182" filter="url(#softShadow)">
          <path d="M16 12 H278 L284 18 V168 L278 174 H16 Z" fill="#082f49" />
          <path
            d="M16 8 H278 L284 14 V164 L278 170 H16 Z"
            fill="url(#arduinoPcb)"
            stroke="#38bdf8"
            strokeWidth="1.5"
          />
          <path d="M70 40 H110 V65 M165 70 H200 V120" stroke="#22d3ee" strokeWidth="0.9" fill="none" opacity="0.35" />
          <rect x="2" y="24" width="36" height="38" rx="3" fill="url(#silverMetal)" stroke="#475569" strokeWidth="1.2" />
          <rect x="6" y="31" width="24" height="24" rx="1.5" fill="#1e293b" />
          <rect x="4" y="114" width="34" height="30" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="1.2" />
          <rect x="20" y="11" width="14" height="11" rx="2" fill="url(#silverMetal)" />
          <circle cx="27" cy="16.5" r="3" fill="#ef4444" />
          <rect x="92" y="10" width="160" height="11" rx="1.5" fill="#0f172a" />
          {[
            { x: 98, t: "GND" },
            { x: 111, t: "13" },
            { x: 124, t: "12" },
            { x: 137, t: "~11" },
            { x: 150, t: "~10" },
            { x: 163, t: "~9" },
            { x: 176, t: "8" },
            { x: 205, t: "TX1" },
            { x: 218, t: "RX1" },
            { x: 231, t: "SDA" },
            { x: 244, t: "SCL" },
          ].map((p) => (
            <text key={p.t + p.x} x={p.x} y="30" textAnchor="middle" fill="#e0f2fe" fontSize="5.6" fontWeight="bold" fontFamily="monospace">
              {p.t}
            </text>
          ))}
          <rect x="80" y="157" width="116" height="11" rx="1.5" fill="#0f172a" />
          {[
            { x: 86, t: "3.3V" },
            { x: 99, t: "5V" },
            { x: 112, t: "GND" },
            { x: 125, t: "GND" },
            { x: 138, t: "VIN" },
            { x: 158, t: "A0" },
            { x: 171, t: "A1" },
            { x: 184, t: "A2" },
          ].map((p) => (
            <text key={p.t + p.x} x={p.x} y="153" textAnchor="middle" fill="#fef08a" fontSize="5.6" fontWeight="bold" fontFamily="monospace">
              {p.t}
            </text>
          ))}
          <rect x="115" y="70" width="46" height="46" rx="3" fill="#0f172a" stroke="#64748b" strokeWidth="1.2" />
          <circle cx="122" cy="77" r="2.2" fill="#334155" />
          <text x="138" y="92" textAnchor="middle" fill="#e2e8f0" fontSize="6.5" fontWeight="bold" fontFamily="monospace">
            MEGA
          </text>
          <text x="138" y="102" textAnchor="middle" fill="#94a3b8" fontSize="6.5" fontFamily="monospace">
            2560
          </text>
          <text x="212" y="76" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="900">
            MEGA 2560
          </text>
          <text x="212" y="90" textAnchor="middle" fill="#bae6fd" fontSize="7.5" fontWeight="bold">
            ROBOTICS EDITION
          </text>
          <circle cx="212" cy="114" r="4.5" fill={powered ? "#4ade80" : "#1e293b"} />
        </svg>
      );

    case "arduino_uno":
      return (
        <svg width="248" height="174" viewBox="0 0 248 174" filter="url(#softShadow)">
          <path d="M16 12 H234 L240 18 V160 L234 166 H16 Z" fill="#082f49" />
          <path
            d="M16 8 H234 L240 14 V156 L234 162 H16 Z"
            fill="url(#arduinoPcb)"
            stroke="#38bdf8"
            strokeWidth="1.5"
          />
          <rect x="2" y="24" width="36" height="38" rx="3" fill="url(#silverMetal)" stroke="#475569" strokeWidth="1.2" />
          <rect x="4" y="110" width="34" height="30" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="1.2" />
          <rect x="98" y="10" width="104" height="11" rx="1.5" fill="#0f172a" />
          <rect x="84" y="151" width="142" height="11" rx="1.5" fill="#0f172a" />
          <rect x="94" y="94" width="122" height="28" rx="2" fill="#0f172a" stroke="#64748b" />
          <text x="155" y="111" textAnchor="middle" fill="#cbd5e1" fontSize="8.5" fontFamily="monospace">
            ATMEGA328P-PU
          </text>
          <text x="145" y="64" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="900">
            ARDUINO UNO
          </text>
          <circle cx="216" cy="58" r="4.5" fill={powered ? "#4ade80" : "#1e293b"} />
        </svg>
      );

    case "esp32_cam":
      return (
        <svg width="108" height="124" viewBox="0 0 108 124" filter="url(#softShadow)">
          {[26, 44, 62, 80].map((px) => (
            <line key={px} x1={px} y1="94" x2={px} y2="114" stroke="url(#silverMetal)" strokeWidth="3.2" strokeLinecap="round" />
          ))}
          <rect x="14" y="10" width="80" height="86" rx="7" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
          <rect x="35" y="20" width="38" height="38" rx="5" fill="#1e293b" stroke="#94a3b8" />
          <circle cx="54" cy="39" r="14" fill="#020617" stroke="#cbd5e1" strokeWidth="1.5" />
          <circle cx="54" cy="39" r="6.5" fill={powered ? "#38bdf8" : "#1e293b"} />
          <circle cx="50" cy="35" r="2.2" fill="#ffffff" opacity="0.8" />
          <rect x="22" y="66" width="11" height="11" rx="2" fill={powered ? "#fef08a" : "#cbd5e1"} />
          <text x="60" y="75" textAnchor="middle" fill="#ffffff" fontSize="7.5" fontWeight="bold" fontFamily="monospace">
            ESP32-CAM
          </text>
          <text x="26" y="91" textAnchor="middle" fill="#fef08a" fontSize="5.5" fontFamily="monospace">5V</text>
          <text x="44" y="91" textAnchor="middle" fill="#ffffff" fontSize="5.5" fontFamily="monospace">GND</text>
          <text x="62" y="91" textAnchor="middle" fill="#38bdf8" fontSize="5.5" fontFamily="monospace">RX</text>
          <text x="80" y="91" textAnchor="middle" fill="#38bdf8" fontSize="5.5" fontFamily="monospace">TX</text>
        </svg>
      );

    case "esp32":
      return (
        <svg width="196" height="142" viewBox="0 0 196 142" filter="url(#softShadow)">
          <rect x="12" y="8" width="172" height="126" rx="7" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
          <rect x="150" y="28" width="28" height="86" fill="#1e293b" />
          <path d="M154 36 H174 V46 H154 V56 H174 V66 H154 V76 H174 V86 H154 V96 H174" stroke="#eab308" strokeWidth="2.2" fill="none" />
          <rect x="76" y="28" width="74" height="86" rx="4" fill="url(#silverMetal)" stroke="#64748b" strokeWidth="1" />
          <text x="113" y="68" textAnchor="middle" fill="#0f172a" fontSize="13" fontWeight="900">ESP32</text>
          <text x="113" y="83" textAnchor="middle" fill="#334155" fontSize="7.5" fontFamily="monospace">WROOM-32</text>
          <rect x="4" y="52" width="18" height="38" rx="2" fill="url(#silverMetal)" />
        </svg>
      );

    case "l298n":
      return (
        <svg width="170" height="162" viewBox="0 0 170 162" filter="url(#softShadow)">
          <rect x="8" y="8" width="154" height="146" rx="7" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="2" />
          <rect x="46" y="14" width="78" height="46" rx="3" fill="#0f172a" stroke="#334155" />
          {[54, 64, 74, 84, 94, 104, 114].map((lx) => (
            <line key={lx} x1={lx} y1="14" x2={lx} y2="60" stroke="#334155" strokeWidth="2.2" />
          ))}
          <circle cx="56" cy="88" r="13" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
          <circle cx="114" cy="88" r="13" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
          <rect x="8" y="36" width="18" height="50" rx="2" fill="#2563eb" />
          <rect x="144" y="36" width="18" height="50" rx="2" fill="#2563eb" />
          <rect x="20" y="134" width="60" height="20" rx="2" fill="#2563eb" />
          <rect x="90" y="138" width="54" height="14" rx="2" fill="#0f172a" />
          <text x="85" y="114" textAnchor="middle" fill="#ffffff" fontSize="10.5" fontWeight="bold">L298N</text>
          <circle cx="85" cy="76" r="4" fill={powered ? "#ef4444" : "#450a0a"} />
        </svg>
      );

    case "tft_face":
      return (
        <svg width="170" height="108" viewBox="0 0 170 108" filter="url(#softShadow)">
          {[32, 54, 76].map((py) => (
            <line key={py} x1="12" y1={py} x2="26" y2={py} stroke="url(#silverMetal)" strokeWidth="3.2" strokeLinecap="round" />
          ))}
          <rect x="24" y="10" width="138" height="88" rx="7" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          <rect x="34" y="16" width="118" height="76" rx="5" fill={powered ? "#f8fafc" : "#0f172a"} />
          {powered && (
            <>
              <circle cx="68" cy="44" r="11" fill="#1e293b" />
              <circle cx="71.5" cy="40.5" r="3.5" fill="#ffffff" />
              <circle cx="118" cy="44" r="11" fill="#1e293b" />
              <circle cx="121.5" cy="40.5" r="3.5" fill="#ffffff" />
              <ellipse cx="52" cy="56" rx="6.5" ry="3.8" fill="#fda4af" opacity="0.75" />
              <ellipse cx="134" cy="56" rx="6.5" ry="3.8" fill="#fda4af" opacity="0.75" />
              <path d="M83 60 Q93 73 103 60 Z" fill="#f43f5e" />
            </>
          )}
        </svg>
      );

    case "ultrasonic":
      return (
        <svg width="162" height="104" viewBox="0 0 162 104" filter="url(#softShadow)">
          {[38, 62, 86, 110].map((px) => (
            <line key={px} x1={px} y1="72" x2={px} y2="94" stroke="url(#silverMetal)" strokeWidth="3.2" strokeLinecap="round" />
          ))}
          <rect x="10" y="12" width="142" height="62" rx="7" fill="url(#arduinoPcb)" stroke="#38bdf8" strokeWidth="1.5" />
          <circle cx="44" cy="38" r="19" fill="url(#silverMetal)" stroke="#475569" strokeWidth="1.5" />
          <circle cx="44" cy="38" r="13" fill="#1e293b" />
          <circle cx="118" cy="38" r="19" fill="url(#silverMetal)" stroke="#475569" strokeWidth="1.5" />
          <circle cx="118" cy="38" r="13" fill="#1e293b" />
          <rect x="73" y="16" width="16" height="7" rx="3" fill="url(#silverMetal)" />
          <text x="38" y="69" textAnchor="middle" fill="#ffffff" fontSize="6.2" fontWeight="bold" fontFamily="monospace">VCC</text>
          <text x="62" y="69" textAnchor="middle" fill="#fef08a" fontSize="6.2" fontWeight="bold" fontFamily="monospace">Trig</text>
          <text x="86" y="69" textAnchor="middle" fill="#fef08a" fontSize="6.2" fontWeight="bold" fontFamily="monospace">Echo</text>
          <text x="110" y="69" textAnchor="middle" fill="#ffffff" fontSize="6.2" fontWeight="bold" fontFamily="monospace">Gnd</text>
        </svg>
      );

    case "hc05":
      return (
        <svg width="90" height="114" viewBox="0 0 90 114" filter="url(#softShadow)">
          {[26, 41, 56, 71].map((px) => (
            <line key={px} x1={px} y1="84" x2={px} y2="104" stroke="url(#silverMetal)" strokeWidth="3.2" strokeLinecap="round" />
          ))}
          <rect x="18" y="10" width="54" height="76" rx="5" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
          <rect x="24" y="16" width="42" height="46" rx="3" fill="#15803d" />
          <path d="M28 22 H62 V27 H28 V32 H62" stroke="#eab308" strokeWidth="1.8" fill="none" />
          <circle cx="60" cy="72" r="3.5" fill={powered ? "#ef4444" : "#334155"} />
          <text x="43" y="76" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold" fontFamily="monospace">
            HC-05
          </text>
        </svg>
      );

    case "dc_motor":
      return (
        <svg width="154" height="104" viewBox="0 0 154 104" filter="url(#softShadow)">
          <line x1="12" y1="36" x2="28" y2="36" stroke="#eab308" strokeWidth="4" strokeLinecap="round" />
          <line x1="12" y1="68" x2="28" y2="68" stroke="#eab308" strokeWidth="4" strokeLinecap="round" />
          <rect x="26" y="26" width="36" height="52" rx="6" fill="url(#silverMetal)" stroke="#64748b" strokeWidth="1.5" />
          <rect x="58" y="20" width="74" height="64" rx="8" fill="url(#yellowGearbox)" stroke="#854d0e" strokeWidth="1.5" />
          <rect x="132" y="44" width="16" height="16" rx="3" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
          <circle
            cx="98"
            cy="52"
            r="18"
            fill="#fef08a"
            stroke="#854d0e"
            strokeWidth="2"
            strokeDasharray="6 4"
            className={powered ? "animate-spin origin-[98px_52px]" : ""}
          />
          <circle cx="98" cy="52" r="6" fill="#f8fafc" stroke="#64748b" strokeWidth="1.5" />
        </svg>
      );

    case "servo_motor": {
      const servoAngle = -90 + sliderValue * 1.8;
      return (
        <svg width="142" height="116" viewBox="0 0 142 116" filter="url(#softShadow)">
          <line x1="34" y1="82" x2="34" y2="106" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="71" y1="82" x2="71" y2="106" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="108" y1="82" x2="108" y2="106" stroke="#f97316" strokeWidth="3.5" strokeLinecap="round" />
          <rect x="10" y="42" width="122" height="10" rx="2" fill="#2563eb" />
          <rect x="24" y="28" width="96" height="54" rx="5" fill="url(#servoBlue)" stroke="#1e3a8a" strokeWidth="1.5" />
          <text x="54" y="59" textAnchor="middle" fill="#dbeafe" fontSize="10" fontWeight="bold">SG90</text>
          <circle cx="92" cy="48" r="13" fill="#1e3a8a" />
          <g transform={`rotate(${powered ? servoAngle : 0} 92 48)`}>
            <rect x="87" y="16" width="10" height="38" rx="5" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
            <circle cx="92" cy="48" r="3" fill="#475569" />
          </g>
        </svg>
      );
    }

    case "lcd_i2c":
      return (
        <svg width="216" height="118" viewBox="0 0 216 118" filter="url(#softShadow)">
          {[36, 52, 68, 84].map((py) => (
            <line key={py} x1="12" y1={py} x2="28" y2={py} stroke="url(#silverMetal)" strokeWidth="3" strokeLinecap="round" />
          ))}
          <rect x="26" y="10" width="182" height="98" rx="6" fill="#065f46" stroke="#047857" strokeWidth="2" />
          <rect x="44" y="20" width="150" height="78" rx="4" fill="#0f172a" />
          <rect x="52" y="28" width="134" height="62" rx="2" fill={powered ? "url(#lcdGreen)" : "#365314"} />
          {powered && (
            <>
              <text x="119" y="52" textAnchor="middle" fill="#1a2e05" fontSize="11" fontWeight="900" fontFamily="monospace">
                ZATOUNA LAB
              </text>
              <text x="119" y="72" textAnchor="middle" fill="#1a2e05" fontSize="9.5" fontWeight="bold" fontFamily="monospace">
                I2C LCD 16x2 OK
              </text>
            </>
          )}
        </svg>
      );

    case "breadboard":
      return (
        <svg width="226" height="138" viewBox="0 0 226 138" filter="url(#softShadow)">
          <rect x="6" y="6" width="214" height="126" rx="7" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
          <line x1="18" y1="12" x2="208" y2="12" stroke="#ef4444" strokeWidth="1.8" />
          <line x1="18" y1="34" x2="208" y2="34" stroke="#3b82f6" strokeWidth="1.8" />
          <rect x="10" y="68" width="206" height="7" rx="2" fill="#e2e8f0" />
          <line x1="18" y1="108" x2="208" y2="108" stroke="#ef4444" strokeWidth="1.8" />
          <line x1="18" y1="128" x2="208" y2="128" stroke="#3b82f6" strokeWidth="1.8" />
        </svg>
      );

    case "led_red":
    case "led_green":
    case "led_blue": {
      const domeFill = burned
        ? "#1e293b"
        : kind === "led_red"
        ? "url(#ledRedDome)"
        : kind === "led_green"
        ? "url(#ledGreenDome)"
        : "url(#ledBlueDome)";
      const glowColor = kind === "led_red" ? "#ef4444" : kind === "led_green" ? "#22c55e" : "#3b82f6";
      return (
        <svg width="78" height="122" viewBox="0 0 78 122" filter="url(#softShadow)">
          {powered && !burned && <circle cx="39" cy="42" r="34" fill={glowColor} opacity="0.35" />}
          <path d="M31 68 L28 84 V112" stroke="url(#silverMetal)" strokeWidth="3.2" fill="none" strokeLinecap="round" />
          <line x1="50" y1="68" x2="50" y2="112" stroke="#94a3b8" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M22 62 V39 A17 17 0 0 1 56 39 V62 Z" fill={domeFill} />
          <rect x="19" y="60" width="38" height="7" rx="2" fill={domeFill} />
          {burned && <text x="39" y="48" textAnchor="middle" fontSize="16">💥</text>}
        </svg>
      );
    }

    case "rgb_led":
      return (
        <svg width="108" height="122" viewBox="0 0 108 122" filter="url(#softShadow)">
          <line x1="24" y1="68" x2="24" y2="112" stroke="#ef4444" strokeWidth="3" />
          <line x1="40" y1="68" x2="40" y2="115" stroke="#64748b" strokeWidth="3.2" />
          <line x1="60" y1="68" x2="60" y2="112" stroke="#22c55e" strokeWidth="3" />
          <line x1="80" y1="68" x2="80" y2="112" stroke="#3b82f6" strokeWidth="3" />
          <path d="M30 62 V39 A22 22 0 0 1 74 39 V62 Z" fill={powered ? "#e9d5ff" : "#e2e8f0"} stroke="#94a3b8" />
        </svg>
      );

    case "resistor_220":
    case "resistor_1k":
    case "resistor_10k": {
      const bands =
        kind === "resistor_220"
          ? ["#dc2626", "#dc2626", "#78350f"]
          : kind === "resistor_1k"
          ? ["#78350f", "#0f172a", "#dc2626"]
          : ["#78350f", "#0f172a", "#f97316"];
      return (
        <svg width="132" height="66" viewBox="0 0 132 66" filter="url(#softShadow)">
          <line x1="10" y1="33" x2="122" y2="33" stroke="url(#silverMetal)" strokeWidth="3.5" strokeLinecap="round" />
          <path
            d="M34 24 C38 20, 46 20, 50 23 H82 C86 20, 94 20, 98 24 V42 C94 46, 86 46, 82 43 H50 C46 46, 38 46, 34 42 Z"
            fill="url(#resistorBody)"
            stroke="#92400e"
          />
          <rect x="42" y="21.5" width="5" height="23" fill={bands[0]} />
          <rect x="54" y="23" width="5" height="20" fill={bands[1]} />
          <rect x="66" y="23" width="5" height="20" fill={bands[2]} />
          <rect x="85" y="21.5" width="4.5" height="23" fill="#eab308" />
        </svg>
      );
    }

    case "potentiometer": {
      const angle = -135 + (sliderValue / 100) * 270;
      return (
        <svg width="108" height="114" viewBox="0 0 108 114" filter="url(#softShadow)">
          <line x1="32" y1="80" x2="32" y2="104" stroke="url(#silverMetal)" strokeWidth="3.5" />
          <line x1="54" y1="80" x2="54" y2="104" stroke="url(#silverMetal)" strokeWidth="3.5" />
          <line x1="76" y1="80" x2="76" y2="104" stroke="url(#silverMetal)" strokeWidth="3.5" />
          <rect x="22" y="16" width="64" height="64" rx="12" fill="url(#servoBlue)" stroke="#1e40af" />
          <circle cx="54" cy="48" r="22" fill="url(#silverMetal)" stroke="#475569" />
          <circle cx="54" cy="48" r="15" fill="#1e293b" />
          <g transform={`rotate(${angle} 54 48)`}>
            <line x1="54" y1="48" x2="54" y2="29" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
          </g>
        </svg>
      );
    }

    case "switch_spdt":
      return (
        <svg
          width="100"
          height="90"
          viewBox="0 0 100 90"
          filter="url(#softShadow)"
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSwitch?.();
          }}
        >
          <line x1="28" y1="60" x2="28" y2="80" stroke="url(#silverMetal)" strokeWidth="3.5" />
          <line x1="50" y1="60" x2="50" y2="80" stroke="url(#silverMetal)" strokeWidth="3.5" />
          <line x1="72" y1="60" x2="72" y2="80" stroke="url(#silverMetal)" strokeWidth="3.5" />
          <rect x="16" y="18" width="68" height="42" rx="6" fill="url(#silverMetal)" stroke="#475569" />
          <rect x="22" y="24" width="56" height="30" rx="4" fill="#0f172a" />
          <rect x={isOn ? 50 : 25} y="27" width="25" height="24" rx="3" fill={isOn ? "#22c55e" : "#ef4444"} />
        </svg>
      );

    case "push_button":
      return (
        <svg
          width="92"
          height="92"
          viewBox="0 0 92 92"
          filter="url(#softShadow)"
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSwitch?.();
          }}
        >
          <line x1="14" y1="24" x2="26" y2="24" stroke="url(#silverMetal)" strokeWidth="4" />
          <line x1="66" y1="24" x2="78" y2="24" stroke="url(#silverMetal)" strokeWidth="4" />
          <line x1="14" y1="68" x2="26" y2="68" stroke="url(#silverMetal)" strokeWidth="4" />
          <line x1="66" y1="68" x2="78" y2="68" stroke="url(#silverMetal)" strokeWidth="4" />
          <rect x="24" y="18" width="44" height="56" rx="6" fill="url(#silverMetal)" stroke="#475569" />
          <circle cx="46" cy="46" r={isOn ? 12 : 15} fill={isOn ? "#f59e0b" : "#1e293b"} />
        </svg>
      );

    case "buzzer":
      return (
        <svg width="92" height="100" viewBox="0 0 92 100" filter="url(#softShadow)">
          <line x1="32" y1="70" x2="32" y2="90" stroke="#ef4444" strokeWidth="3.5" />
          <line x1="60" y1="70" x2="60" y2="90" stroke="#1e293b" strokeWidth="3.5" />
          <circle cx="46" cy="44" r="28" fill="url(#battBody)" stroke="#334155" strokeWidth="2" />
          <circle cx="46" cy="44" r="6" fill="#020617" />
        </svg>
      );

    case "relay_5v":
      return (
        <svg width="152" height="100" viewBox="0 0 152 100" filter="url(#softShadow)">
          <rect x="18" y="12" width="116" height="76" rx="6" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
          <rect x="50" y="20" width="56" height="60" rx="4" fill="#0284c7" />
          <text x="78" y="54" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="bold">RELAY 5V</text>
        </svg>
      );

    case "dht11":
      return (
        <svg width="100" height="106" viewBox="0 0 100 106" filter="url(#softShadow)">
          {[30, 50, 70].map((px) => (
            <line key={px} x1={px} y1="76" x2={px} y2="96" stroke="url(#silverMetal)" strokeWidth="3.2" />
          ))}
          <rect x="20" y="48" width="60" height="30" rx="4" fill="#0f172a" />
          <rect x="26" y="12" width="48" height="46" rx="4" fill="#0284c7" stroke="#38bdf8" />
        </svg>
      );

    case "ldr":
      return (
        <svg width="86" height="96" viewBox="0 0 86 96" filter="url(#softShadow)">
          <line x1="32" y1="56" x2="32" y2="86" stroke="url(#silverMetal)" strokeWidth="3.2" />
          <line x1="54" y1="56" x2="54" y2="86" stroke="url(#silverMetal)" strokeWidth="3.2" />
          <circle cx="43" cy="36" r="22" fill="#fde68a" stroke="#d97706" strokeWidth="2" />
        </svg>
      );
  }
}

// ==========================================
// 7. التطبيق الرئيسي (Zatouna CircuitStudio Learning)
// ==========================================
export default function ZatounaCircuitStudio() {
  const [components, setComponents] = useState<PlacedComponent[]>(TEMPLATES[0].components);
  const [wires, setWires] = useState<Wire[]>(TEMPLATES[0].wires);
  const [isSimRunning, setIsSimRunning] = useState<boolean>(true);
  const [selectedCompId, setSelectedCompId] = useState<string | null>("r_ard");
  const [xrayOpen, setXrayOpen] = useState<boolean>(true);
  const [darkWorkbench, setDarkWorkbench] = useState<boolean>(true);
  const [activeWireColor, setActiveWireColor] = useState<string>("#ef4444");

  const [hoveredPinInfo, setHoveredPinInfo] = useState<{
    compName: string;
    pinLabel: string;
    pinDesc: string;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<CategoryType>("all");
  const [showTemplatesMenu, setShowTemplatesMenu] = useState<boolean>(false);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [pendingPin, setPendingPin] = useState<{ compId: string; pinId: string } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement | null>(null);

  const simResults = useMemo(
    () => runCircuitSimulation(components, wires, isSimRunning),
    [components, wires, isSimRunning]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPendingPin(null);
        setShowTemplatesMenu(false);
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedCompId) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA") {
          setComponents((prev) => prev.filter((c) => c.id !== selectedCompId));
          setWires((prev) =>
            prev.filter((w) => w.fromCompId !== selectedCompId && w.toCompId !== selectedCompId)
          );
          setSelectedCompId(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCompId]);

  const getPinPosition = (compId: string, pinId: string) => {
    const comp = components.find((c) => c.id === compId);
    if (!comp) return { x: 0, y: 0 };
    const spec = COMPONENT_CATALOG[comp.kind];
    const pin = spec.pins.find((p) => p.id === pinId);
    if (!pin) return { x: comp.x, y: comp.y };
    return { x: comp.x + pin.x, y: comp.y + pin.y };
  };

  const addComponent = (kind: ComponentKind) => {
    const newId = `comp_${Date.now()}`;
    const newComp: PlacedComponent = {
      id: newId,
      kind,
      x: 240 + (components.length % 5) * 35,
      y: 140 + (components.length % 4) * 35,
      isOn: true,
      sliderValue: 50,
    };
    setComponents((prev) => [...prev, newComp]);
    setSelectedCompId(newId);
  };

  const deleteComponent = (id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
    setWires((prev) => prev.filter((w) => w.fromCompId !== id && w.toCompId !== id));
    if (selectedCompId === id) setSelectedCompId(null);
  };

  const loadTemplate = (tpl: CircuitTemplate) => {
    setComponents(tpl.components.map((c) => ({ ...c })));
    setWires(tpl.wires.map((w) => ({ ...w })));
    setSelectedCompId(tpl.components[0]?.id || null);
    setPendingPin(null);
    setIsSimRunning(true);
    setShowTemplatesMenu(false);
  };

  const handlePinClick = (e: React.MouseEvent, compId: string, pinId: string) => {
    e.stopPropagation();
    if (!pendingPin) {
      setPendingPin({ compId, pinId });
    } else {
      if (pendingPin.compId !== compId || pendingPin.pinId !== pinId) {
        const newWire: Wire = {
          id: `wire_${Date.now()}`,
          fromCompId: pendingPin.compId,
          fromPinId: pendingPin.pinId,
          toCompId: compId,
          toPinId: pinId,
          color: activeWireColor,
        };
        setWires((prev) => [...prev, newWire]);
      }
      setPendingPin(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    if (draggingId) {
      setComponents((prev) =>
        prev.map((c) =>
          c.id === draggingId
            ? {
                ...c,
                x: Math.max(10, Math.min(rect.width - 160, x - dragOffset.x)),
                y: Math.max(10, Math.min(rect.height - 140, y - dragOffset.y)),
              }
            : c
        )
      );
    }
  };

  const filteredCatalog = useMemo(() => {
    return Object.values(COMPONENT_CATALOG).filter((item) => {
      const matchesCat = activeCategory === "all" || item.category === activeCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q || item.nameAr.toLowerCase().includes(q) || item.nameEn.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const selectedComp = components.find((c) => c.id === selectedCompId) || null;
  const selectedSpec = selectedComp ? COMPONENT_CATALOG[selectedComp.kind] : null;
  const selectedSim = selectedComp ? simResults[selectedComp.id] : null;

  return (
    <div
      className={`h-screen w-screen overflow-hidden flex flex-col select-none transition-colors ${
        darkWorkbench ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-800"
      }`}
      dir="rtl"
    >
      <SharedSvgDefs />

      {/* ================= الشريط العلوي ================= */}
      <header
        className={`h-14 border-b px-4 flex items-center justify-between shrink-0 z-30 shadow-sm ${
          darkWorkbench ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="grid grid-cols-3 gap-0.5 w-8 h-8 p-1 rounded-lg bg-slate-950 border border-slate-700 shadow">
            <span className="bg-red-500 rounded-[2px]" />
            <span className="bg-amber-400 rounded-[2px]" />
            <span className="bg-emerald-500 rounded-[2px]" />
            <span className="bg-cyan-400 rounded-[2px]" />
            <span className="bg-blue-600 rounded-[2px]" />
            <span className="bg-purple-500 rounded-[2px]" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight flex items-center gap-1.5">
              <span className="text-cyan-400">Zatouna</span>
              <span>CircuitStudio Pro</span>
            </h1>
            <p className={`text-[11px] ${darkWorkbench ? "text-slate-400" : "text-slate-500"}`}>
              مختبر المحاكاة الواقعية بالمخارج والمداخل القياسية
            </p>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
              darkWorkbench ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
            }`}
          >
            <span className="text-xs font-semibold opacity-75 ml-1">لون السلك:</span>
            {WIRE_COLORS.map((wc) => (
              <button
                key={wc.hex}
                onClick={() => setActiveWireColor(wc.hex)}
                title={wc.name}
                className={`w-5 h-5 rounded-full border border-white/60 shadow-sm transition-transform ${
                  activeWireColor === wc.hex ? "scale-125 ring-2 ring-cyan-400" : "hover:scale-110"
                }`}
                style={{ backgroundColor: wc.hex }}
              />
            ))}
          </div>

          {selectedComp && (
            <button
              onClick={() => deleteComponent(selectedComp.id)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/30 transition"
            >
              🗑️ حذف المحدد
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setShowTemplatesMenu((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                darkWorkbench
                  ? "bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700"
                  : "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
              }`}
            >
              <span>📚 تجارب جاهزة</span>
              <span>▾</span>
            </button>

            {showTemplatesMenu && (
              <div
                className={`absolute left-0 mt-2 w-80 rounded-2xl shadow-2xl border p-2 z-50 space-y-1.5 ${
                  darkWorkbench ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
                }`}
              >
                <div className="px-2 py-1 text-xs font-bold opacity-70">اختر تجربة أو مشروعاً جاهزاً:</div>
                {TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => loadTemplate(tpl)}
                    className={`w-full text-right p-2.5 rounded-xl border transition ${
                      darkWorkbench
                        ? "bg-slate-950/70 hover:bg-slate-800 border-slate-800"
                        : "bg-slate-50 hover:bg-blue-50 border-slate-200/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{tpl.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 font-bold">
                        {tpl.badge}
                      </span>
                    </div>
                    <p className="text-[11px] opacity-70 mt-0.5">{tpl.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSimRunning((prev) => !prev)}
            className={`px-4 py-1.5 rounded-xl text-xs md:text-sm font-bold transition flex items-center gap-2 shadow-sm ${
              isSimRunning
                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                : "bg-slate-700 hover:bg-slate-600 text-white"
            }`}
          >
            <span>{isSimRunning ? "⏹ إيقاف المحاكاة" : "▶ بدء المحاكاة"}</span>
          </button>

          <button
            onClick={() => setXrayOpen((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              xrayOpen
                ? "bg-cyan-600 text-white border-cyan-500 shadow-sm"
                : darkWorkbench
                ? "bg-slate-800 border-slate-700 text-slate-300"
                : "bg-slate-100 border-slate-300 text-slate-700"
            }`}
          >
            🔬 فاحص AI X-Ray
          </button>

          <button
            onClick={() => setDarkWorkbench((prev) => !prev)}
            title="تبديل إضاءة اللوحة"
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition ${
              darkWorkbench
                ? "bg-slate-800 border-slate-700 text-amber-300"
                : "bg-slate-100 border-slate-300 text-slate-700"
            }`}
          >
            {darkWorkbench ? "☀️" : "🌙"}
          </button>

          <button
            onClick={() => {
              setComponents([]);
              setWires([]);
              setSelectedCompId(null);
              setPendingPin(null);
            }}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
          >
            مسح الكل
          </button>
        </div>
      </header>

      {/* ================= منطقة العمل الرئيسية ================= */}
      <div className="flex-1 flex overflow-hidden relative">
        <main
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerUp={() => setDraggingId(null)}
          onClick={() => {
            if (pendingPin) setPendingPin(null);
            if (showTemplatesMenu) setShowTemplatesMenu(false);
          }}
          className="flex-1 relative overflow-hidden"
          style={{
            backgroundColor: darkWorkbench ? "#060b16" : "#f1f5f9",
            backgroundImage: darkWorkbench
              ? "radial-gradient(rgba(56, 189, 248, 0.14) 1px, transparent 1px)"
              : "radial-gradient(rgba(100, 116, 139, 0.22) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        >
          <div
            className={`absolute top-3 right-3 z-20 flex flex-wrap items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs border shadow-md backdrop-blur ${
              darkWorkbench
                ? "bg-slate-900/90 border-slate-800 text-slate-300"
                : "bg-white/95 border-slate-200 text-slate-700"
            }`}
          >
            {hoveredPinInfo ? (
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <span>🔌 {hoveredPinInfo.compName}:</span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/15 font-mono text-xs">
                  {hoveredPinInfo.pinLabel}
                </span>
                <span className="opacity-80 font-normal">— {hoveredPinInfo.pinDesc}</span>
              </div>
            ) : (
              <>
                <span>🖱️ اسحب القطع لتحريكها</span>
                <span className="opacity-30">|</span>
                <span>🔌 قف على أي مخرج لمعرفة اسمه الحقيقي ثم اضغط للتوصيل</span>
                <span className="opacity-30">|</span>
                <span>✂️ اضغط على السلك لحذفه</span>
              </>
            )}
          </div>

          {pendingPin && (
            <div className="absolute top-14 right-3 z-20 bg-amber-500 text-slate-950 px-3.5 py-1 rounded-xl text-xs font-extrabold shadow-lg animate-pulse">
              اختر المخرج الثاني لتوصيل السلك (أو اضغط Esc للإلغاء)
            </div>
          )}

          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            {wires.map((w) => {
              const p1 = getPinPosition(w.fromCompId, w.fromPinId);
              const p2 = getPinPosition(w.toCompId, w.toPinId);
              const sag = Math.min(70, Math.abs(p1.x - p2.x) * 0.24 + 28);
              const midY = Math.max(p1.y, p2.y) + sag;
              const pathData = `M ${p1.x} ${p1.y} Q ${(p1.x + p2.x) / 2} ${midY}, ${p2.x} ${p2.y}`;
              return (
                <g
                  key={w.id}
                  className="pointer-events-auto cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    setWires((prev) => prev.filter((item) => item.id !== w.id));
                  }}
                >
                  <path d={pathData} stroke="transparent" strokeWidth="16" fill="none" />
                  <path d={pathData} stroke="#020617" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.45" />
                  <path
                    d={pathData}
                    stroke={w.color}
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                    className="group-hover:stroke-rose-500 transition-colors"
                  />
                  <circle cx={p1.x} cy={p1.y} r="5.5" fill="#0f172a" stroke={w.color} strokeWidth="2" />
                  <circle cx={p2.x} cy={p2.y} r="5.5" fill="#0f172a" stroke={w.color} strokeWidth="2" />
                </g>
              );
            })}

            {pendingPin && (() => {
              const start = getPinPosition(pendingPin.compId, pendingPin.pinId);
              return (
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={mousePos.x}
                  y2={mousePos.y}
                  stroke={activeWireColor}
                  strokeWidth="3.5"
                  strokeDasharray="6 4"
                />
              );
            })()}
          </svg>

          {components.map((comp) => {
            const spec = COMPONENT_CATALOG[comp.kind];
            const sim = simResults[comp.id];
            const isSelected = selectedCompId === comp.id;

            return (
              <div
                key={comp.id}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setSelectedCompId(comp.id);
                  if (!canvasRef.current) return;
                  const rect = canvasRef.current.getBoundingClientRect();
                  setDraggingId(comp.id);
                  setDragOffset({
                    x: e.clientX - rect.left - comp.x,
                    y: e.clientY - rect.top - comp.y,
                  });
                }}
                style={{
                  left: comp.x,
                  top: comp.y,
                  width: spec.width,
                  height: spec.height,
                }}
                className={`absolute z-20 rounded-2xl transition-shadow cursor-grab active:cursor-grabbing ${
                  isSelected
                    ? "ring-2 ring-cyan-400 bg-cyan-400/5 shadow-xl"
                    : "hover:ring-1 hover:ring-cyan-400/40"
                }`}
              >
                <ComponentGraphic
                  kind={comp.kind}
                  isOn={comp.isOn}
                  sliderValue={comp.sliderValue}
                  sim={sim}
                  onToggleSwitch={() =>
                    setComponents((prev) =>
                      prev.map((item) => (item.id === comp.id ? { ...item, isOn: !item.isOn } : item))
                    )
                  }
                />

                {spec.pins.map((pin) => {
                  const isPinActive =
                    pendingPin?.compId === comp.id && pendingPin?.pinId === pin.id;
                  return (
                    <button
                      key={pin.id}
                      onClick={(e) => handlePinClick(e, comp.id, pin.id)}
                      onMouseEnter={() =>
                        setHoveredPinInfo({
                          compName: spec.nameAr,
                          pinLabel: pin.label,
                          pinDesc: pin.description,
                        })
                      }
                      onMouseLeave={() => setHoveredPinInfo(null)}
                      style={{ left: pin.x - 5.5, top: pin.y - 5.5 }}
                      className={`absolute w-[11px] h-[11px] rounded-[3px] border border-white/80 shadow transition-transform hover:scale-150 z-30 ${
                        isPinActive
                          ? "bg-amber-400 scale-150 animate-ping"
                          : pin.type === "power"
                          ? "bg-red-500"
                          : pin.type === "ground"
                          ? "bg-slate-900"
                          : pin.type === "signal"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                    />
                  );
                })}

                <div className="text-center -mt-1 pointer-events-none">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow border ${
                      darkWorkbench
                        ? "bg-slate-900/95 text-slate-200 border-slate-700"
                        : "bg-white/95 text-slate-700 border-slate-200"
                    }`}
                  >
                    {spec.nameAr}
                  </span>
                </div>
              </div>
            );
          })}

          {xrayOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className={`absolute top-14 left-4 z-30 w-80 rounded-2xl border shadow-2xl backdrop-blur-md p-3.5 flex flex-col gap-3 max-h-[calc(100vh-110px)] overflow-y-auto ${
                darkWorkbench
                  ? "bg-slate-900/95 border-cyan-500/35 text-slate-100"
                  : "bg-white/95 border-slate-200 text-slate-800"
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-700/40 pb-2">
                <span className="text-xs font-extrabold text-cyan-400 flex items-center gap-1.5">
                  <span>🔬 فاحص AI X-Ray ودليل الأطراف</span>
                </span>
                <button
                  onClick={() => setXrayOpen(false)}
                  className="text-xs opacity-60 hover:opacity-100 px-1.5"
                >
                  ✕
                </button>
              </div>

              {selectedComp && selectedSpec && selectedSim ? (
                <>
                  <div
                    className={`p-2.5 rounded-xl border text-xs ${
                      selectedSim.burned
                        ? "bg-rose-500/15 border-rose-500/40 text-rose-400"
                        : selectedSim.powered
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                        : darkWorkbench
                        ? "bg-slate-950 border-slate-800 text-slate-300"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    <div className="font-extrabold text-sm">{selectedSpec.nameAr}</div>
                    <p className="font-semibold mt-1">{selectedSim.statusText}</p>
                    {selectedSim.currentMa > 0 && (
                      <div className="mt-2 pt-1.5 border-t border-current/20 flex justify-between font-mono text-[11px]">
                        <span>الجهد: {selectedSim.voltage}V</span>
                        <span>التيار: {selectedSim.currentMa}mA</span>
                      </div>
                    )}
                  </div>

                  {(selectedComp.kind === "potentiometer" ||
                    selectedComp.kind === "ultrasonic" ||
                    selectedComp.kind === "servo_motor" ||
                    selectedComp.kind === "dht11" ||
                    selectedComp.kind === "ldr") && (
                    <div
                      className={`p-2.5 rounded-xl border ${
                        darkWorkbench ? "bg-slate-950 border-slate-800" : "bg-blue-50/70 border-blue-200"
                      }`}
                    >
                      <label className="text-xs font-bold text-cyan-400 block mb-1.5">
                        🎚️ محاكاة تغيير القيمة ({selectedComp.sliderValue}%)
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={selectedComp.sliderValue}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setComponents((prev) =>
                            prev.map((c) => (c.id === selectedComp.id ? { ...c, sliderValue: val } : c))
                          );
                        }}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>
                  )}

                  <div
                    className={`p-2.5 rounded-xl border space-y-1.5 ${
                      darkWorkbench ? "bg-slate-950 border-slate-800" : "bg-amber-50/60 border-amber-200"
                    }`}
                  >
                    <div className="text-xs font-extrabold text-amber-400">
                      🔌 المخارج والمداخل ({selectedSpec.pins.length}):
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1 pl-1">
                      {selectedSpec.pins.map((p) => (
                        <div key={p.id} className="text-[11px] flex flex-col border-b border-slate-800 pb-1">
                          <span className="font-mono font-bold text-cyan-400">{p.label}</span>
                          <span className="opacity-75 text-[10px]">{p.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-xl border space-y-2 ${
                      darkWorkbench
                        ? "bg-cyan-950/30 border-cyan-500/30"
                        : "bg-cyan-50/70 border-cyan-200"
                    }`}
                  >
                    <div className="text-xs font-extrabold text-cyan-400">⚡ {selectedSpec.xrayTitle}</div>
                    <p className="text-[11px] leading-relaxed opacity-85">{selectedSpec.xrayDescription}</p>
                  </div>
                </>
              ) : (
                <div className="text-center text-xs opacity-60 py-8">
                  اضغط على أي قطعة في اللوحة لعرض تفاصيلها.
                </div>
              )}
            </div>
          )}
        </main>

        <aside
          className={`w-76 border-r flex flex-col shrink-0 z-20 shadow-sm ${
            darkWorkbench ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="p-3 border-b border-slate-800/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold">مكتبة الخامات</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 font-bold">
                {filteredCatalog.length} خامة
              </span>
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 ابحث (ميجا، كاميرا، بلوتوث، شاشة...)"
              className={`w-full px-3 py-1.5 rounded-xl text-xs border outline-none transition ${
                darkWorkbench
                  ? "bg-slate-950 border-slate-700 focus:border-cyan-400"
                  : "bg-slate-50 border-slate-200 focus:border-blue-500"
              }`}
            />

            <div className="flex flex-wrap gap-1">
              {(
                [
                  { id: "all", label: "الكل" },
                  { id: "power", label: "طاقة" },
                  { id: "mcu", label: "متحكمات" },
                  { id: "output", label: "مخرجات" },
                  { id: "control", label: "تحكم ودرايفر" },
                  { id: "sensor", label: "حساسات" },
                ] as { id: CategoryType; label: string }[]
              ).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                    activeCategory === cat.id
                      ? "bg-cyan-600 text-white"
                      : darkWorkbench
                      ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2.5 content-start">
            {filteredCatalog.map((spec) => (
              <button
                key={spec.kind}
                onClick={() => addComponent(spec.kind)}
                className={`p-2 rounded-2xl border transition flex flex-col items-center justify-between text-center group hover:shadow-lg ${
                  darkWorkbench
                    ? "bg-slate-950/80 border-slate-800 hover:border-cyan-400"
                    : "bg-slate-50/80 border-slate-200 hover:border-blue-500 hover:bg-white"
                }`}
              >
                <div className="w-full h-20 flex items-center justify-center overflow-hidden">
                  <div className="transform scale-[0.43] origin-center pointer-events-none group-hover:scale-[0.5] transition-transform">
                    <ComponentGraphic kind={spec.kind} />
                  </div>
                </div>
                <div className="w-full pt-1 border-t border-slate-800/40">
                  <div className="text-[11px] font-extrabold leading-tight truncate">{spec.nameAr}</div>
                  <div className="text-[9px] opacity-60 truncate">{spec.nameEn}</div>
                </div>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}