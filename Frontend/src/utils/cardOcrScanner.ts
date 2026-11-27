import type { Worker, LoggerMessage } from 'tesseract.js';
import {
  sanitizeIndianPhoneInput,
  sanitizePersonNameInput,
  validateEmailAddress,
  validateIndianMobileNumber,
  validateWebsiteUrl,
} from './validation';

export interface OcrProgressUpdate {
  status: string;
  progress: number; // 0 to 100
}

export type CardOcrMode = 'auto' | 'high-contrast' | 'dark-card';

export interface ScanBusinessCardOptions {
  mode?: CardOcrMode;
}

export interface ParsedBusinessCard {
  name: string;
  firmName: string;
  email: string;
  phone: string;
  alternatePhones?: string[];
  membershipNumber: string;
  city: string;
  state: string;
  designation: string;
  website: string;
  address: string;
  ocrRawText: string;
  source: 'qr' | 'ocr' | 'qr+ocr';
  confidence?: number;
  passesRun?: number;
  detectedDarkCard?: boolean;
}

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Orissa',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'New Delhi',
  'Chandigarh',
  'Puducherry',
  'Jammu and Kashmir',
];

const CITY_TO_STATE: Record<string, string> = {
  hyderabad: 'Telangana',
  secunderabad: 'Telangana',
  warangal: 'Telangana',
  karimnagar: 'Telangana',
  nizamabad: 'Telangana',
  khammam: 'Telangana',
  bengaluru: 'Karnataka',
  bangalore: 'Karnataka',
  mysuru: 'Karnataka',
  mysore: 'Karnataka',
  mangaluru: 'Karnataka',
  mangalore: 'Karnataka',
  hubballi: 'Karnataka',
  hubli: 'Karnataka',
  belagavi: 'Karnataka',
  mumbai: 'Maharashtra',
  pune: 'Maharashtra',
  nagpur: 'Maharashtra',
  nashik: 'Maharashtra',
  thane: 'Maharashtra',
  'navi mumbai': 'Maharashtra',
  aurangabad: 'Maharashtra',
  kolhapur: 'Maharashtra',
  solapur: 'Maharashtra',
  chennai: 'Tamil Nadu',
  coimbatore: 'Tamil Nadu',
  madurai: 'Tamil Nadu',
  tiruchirappalli: 'Tamil Nadu',
  trichy: 'Tamil Nadu',
  salem: 'Tamil Nadu',
  ahmedabad: 'Gujarat',
  surat: 'Gujarat',
  vadodara: 'Gujarat',
  baroda: 'Gujarat',
  rajkot: 'Gujarat',
  gandhinagar: 'Gujarat',
  bhavnagar: 'Gujarat',
  jamnagar: 'Gujarat',
  kolkata: 'West Bengal',
  calcutta: 'West Bengal',
  howrah: 'West Bengal',
  siliguri: 'West Bengal',
  jaipur: 'Rajasthan',
  udaipur: 'Rajasthan',
  jodhpur: 'Rajasthan',
  kota: 'Rajasthan',
  ajmer: 'Rajasthan',
  indore: 'Madhya Pradesh',
  bhopal: 'Madhya Pradesh',
  gwalior: 'Madhya Pradesh',
  jabalpur: 'Madhya Pradesh',
  lucknow: 'Uttar Pradesh',
  noida: 'Uttar Pradesh',
  'greater noida': 'Uttar Pradesh',
  ghaziabad: 'Uttar Pradesh',
  kanpur: 'Uttar Pradesh',
  varanasi: 'Uttar Pradesh',
  agra: 'Uttar Pradesh',
  prayagraj: 'Uttar Pradesh',
  meerut: 'Uttar Pradesh',
  gurugram: 'Haryana',
  gurgaon: 'Haryana',
  faridabad: 'Haryana',
  panipat: 'Haryana',
  ambala: 'Haryana',
  chandigarh: 'Chandigarh',
  mohali: 'Punjab',
  ludhiana: 'Punjab',
  amritsar: 'Punjab',
  jalandhar: 'Punjab',
  kochi: 'Kerala',
  cochin: 'Kerala',
  ernakulam: 'Kerala',
  thiruvananthapuram: 'Kerala',
  trivandrum: 'Kerala',
  kozhikode: 'Kerala',
  thrissur: 'Kerala',
  visakhapatnam: 'Andhra Pradesh',
  vizag: 'Andhra Pradesh',
  vijayawada: 'Andhra Pradesh',
  guntur: 'Andhra Pradesh',
  tirupati: 'Andhra Pradesh',
  nellore: 'Andhra Pradesh',
  kakinada: 'Andhra Pradesh',
  rajahmundry: 'Andhra Pradesh',
  patna: 'Bihar',
  bhubaneswar: 'Odisha',
  cuttack: 'Odisha',
  raipur: 'Chhattisgarh',
  ranchi: 'Jharkhand',
  jamshedpur: 'Jharkhand',
  guwahati: 'Assam',
  dehradun: 'Uttarakhand',
  panaji: 'Goa',
  margao: 'Goa',
  'new delhi': 'Delhi',
  delhi: 'Delhi',
};

const PIN_PREFIX_TO_STATE: Record<string, string> = {
  '11': 'Delhi',
  '12': 'Haryana',
  '13': 'Haryana',
  '14': 'Punjab',
  '15': 'Punjab',
  '16': 'Chandigarh',
  '17': 'Himachal Pradesh',
  '18': 'Jammu and Kashmir',
  '19': 'Jammu and Kashmir',
  '20': 'Uttar Pradesh',
  '21': 'Uttar Pradesh',
  '22': 'Uttar Pradesh',
  '23': 'Uttar Pradesh',
  '24': 'Uttar Pradesh',
  '25': 'Uttar Pradesh',
  '26': 'Uttarakhand',
  '27': 'Uttar Pradesh',
  '28': 'Uttar Pradesh',
  '30': 'Rajasthan',
  '31': 'Rajasthan',
  '32': 'Rajasthan',
  '33': 'Rajasthan',
  '34': 'Rajasthan',
  '36': 'Gujarat',
  '37': 'Gujarat',
  '38': 'Gujarat',
  '39': 'Gujarat',
  '40': 'Maharashtra',
  '41': 'Maharashtra',
  '42': 'Maharashtra',
  '43': 'Maharashtra',
  '44': 'Maharashtra',
  '45': 'Madhya Pradesh',
  '46': 'Madhya Pradesh',
  '47': 'Madhya Pradesh',
  '48': 'Madhya Pradesh',
  '49': 'Chhattisgarh',
  '50': 'Telangana',
  '51': 'Andhra Pradesh',
  '52': 'Andhra Pradesh',
  '53': 'Andhra Pradesh',
  '56': 'Karnataka',
  '57': 'Karnataka',
  '58': 'Karnataka',
  '59': 'Karnataka',
  '60': 'Tamil Nadu',
  '61': 'Tamil Nadu',
  '62': 'Tamil Nadu',
  '63': 'Tamil Nadu',
  '64': 'Tamil Nadu',
  '67': 'Kerala',
  '68': 'Kerala',
  '69': 'Kerala',
  '70': 'West Bengal',
  '71': 'West Bengal',
  '72': 'West Bengal',
  '73': 'West Bengal',
  '74': 'West Bengal',
  '75': 'Odisha',
  '76': 'Odisha',
  '77': 'Odisha',
  '78': 'Assam',
  '80': 'Bihar',
  '81': 'Bihar',
  '82': 'Jharkhand',
  '83': 'Jharkhand',
  '84': 'Bihar',
  '85': 'Bihar',
};

const DESIGNATION_KEYWORDS = [
  'chartered accountant',
  'managing partner',
  'senior partner',
  'founding partner',
  'partner',
  'proprietor',
  'founder',
  'co-founder',
  'managing director',
  'executive director',
  'director',
  'chief executive officer',
  'chief financial officer',
  'ceo',
  'cfo',
  'coo',
  'cto',
  'vice president',
  'general manager',
  'senior manager',
  'manager',
  'principal',
  'advisor',
  'consultant',
  'engineer',
  'advocate',
  'tax consultant',
  'company secretary',
];

const FIRM_KEYWORDS = [
  '& associates',
  'associates',
  '& co',
  '& company',
  'chartered accountants',
  'llp',
  'pvt',
  'private limited',
  'ltd',
  'limited',
  'advisory',
  'advisors',
  'consultants',
  'consultancy',
  'financial services',
  'solutions',
  'enterprises',
  'industries',
  'technologies',
  'group',
  'capital',
  'ventures',
  'audit',
  'taxation',
  'finserv',
];

const ADDRESS_KEYWORDS = [
  'road',
  'rd',
  'street',
  'st.',
  'floor',
  'nagar',
  'colony',
  'phase',
  'sector',
  'block',
  'plaza',
  'tower',
  'complex',
  'chambers',
  'avenue',
  'marg',
  'circle',
  'cross',
  'main',
  'layout',
  'enclave',
  'industrial',
  'opp.',
  'near',
  'plot',
  'flat',
  'suite',
  'pin',
  'hills',
  'park',
  'garden',
  'vihar',
  'market',
  'chowk',
  'extension',
  'hyderabad',
  'bengaluru',
  'mumbai',
  'chennai',
  'delhi',
];

const COMMON_LANDLINE_STD_PREFIXES = new Set([
  '011',
  '022',
  '033',
  '040',
  '044',
  '080',
  '020',
  '079',
  '0120',
  '0124',
  '0141',
  '0172',
  '0422',
  '0484',
  '0522',
  '0731',
  '0755',
  '0821',
  '0866',
  '0891',
]);

const toTitleCase = (str: string): string =>
  str
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => {
      if (!word) return '';
      if (/^(CA|FCA|ACA|LLP|PVT|LTD|CEO|CFO|COO|CTO|MD|CS|CMA)$/i.test(word)) {
        return word.toUpperCase();
      }
      if (word.length <= 2 && word.endsWith('.')) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode the selected image file.'));
    img.src = src;
  });
}

/**
 * Loads an image respecting browser EXIF orientation (via createImageBitmap when available).
 */
async function loadOrientedDrawable(
  imageSrc: string
): Promise<{
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}> {
  if (typeof createImageBitmap === 'function' && imageSrc.startsWith('data:')) {
    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
      if (bitmap.width > 0 && bitmap.height > 0) {
        return {
          source: bitmap,
          width: bitmap.width,
          height: bitmap.height,
          cleanup: () => bitmap.close(),
        };
      }
      bitmap.close();
    } catch {
      // Fallback cleanly to HTMLImageElement below
    }
  }

  const img = await loadImageElement(imageSrc);
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  return {
    source: img,
    width,
    height,
    cleanup: () => {},
  };
}

/**
 * Rotates a data URL image clockwise by 90, 180, or 270 degrees for preview + OCR re-scan.
 */
export async function rotateImageDataUrl(
  imageSrc: string,
  degrees: 90 | 180 | 270 = 90
): Promise<string> {
  const { source, width, height, cleanup } = await loadOrientedDrawable(imageSrc);
  try {
    const swap = degrees === 90 || degrees === 270;
    const canvas = document.createElement('canvas');
    canvas.width = swap ? height : width;
    canvas.height = swap ? width : height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return imageSrc;

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((degrees * Math.PI) / 180);
    ctx.drawImage(source, -width / 2, -height / 2, width, height);
    return canvas.toDataURL('image/jpeg', 0.94);
  } finally {
    cleanup();
  }
}

interface PreprocessedVariants {
  standardDataUrl: string;
  invertedDataUrl: string;
  binarizedDataUrl: string;
  isDarkCard: boolean;
  qrPayload: string | null;
}

/**
 * Converts a grayscale Uint8ClampedArray into an RGBA PNG data URL on a reusable canvas.
 */
function grayscaleToDataUrl(
  gray: Uint8ClampedArray,
  width: number,
  height: number,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): string {
  const out = ctx.createImageData(width, height);
  const dst = out.data;
  for (let p = 0, i = 0; p < gray.length; p++, i += 4) {
    const v = gray[p];
    dst[i] = v;
    dst[i + 1] = v;
    dst[i + 2] = v;
    dst[i + 3] = 255;
  }
  ctx.putImageData(out, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Applies a fast 3x3 unsharp mask sharpening filter to crisp up small 7-8pt phone digits.
 */
function sharpenGrayscale(
  src: Uint8ClampedArray,
  width: number,
  height: number,
  amount = 0.45
): Uint8ClampedArray {
  const dst = new Uint8ClampedArray(src.length);
  const centerWeight = 1 + 4 * amount;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      const idx = rowOffset + x;
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        dst[idx] = src[idx];
        continue;
      }
      const val =
        src[idx] * centerWeight -
        amount * (src[idx - 1] + src[idx + 1] + src[idx - width] + src[idx + width]);
      dst[idx] = val < 0 ? 0 : val > 255 ? 255 : Math.round(val);
    }
  }
  return dst;
}

/**
 * Computes Otsu global threshold from a 256-bin grayscale histogram.
 */
function computeOtsuThreshold(hist: Uint32Array, totalPixels: number): number {
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];

  let sumB = 0;
  let wB = 0;
  let maxVar = -1;
  let threshold = 128;

  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = totalPixels - wB;
    if (wF === 0) break;

    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const diff = mB - mF;
    const betweenVar = wB * wF * diff * diff;
    if (betweenVar > maxVar) {
      maxVar = betweenVar;
      threshold = t;
    }
  }
  return threshold;
}

/**
 * Fast integral-image Bradley-Roth adaptive thresholding blended with Otsu safety bounds.
 * Handles glossy gradients, phone shadows, and colored card strips far better than global thresholding.
 */
function adaptiveBinarizeGrayscale(
  gray: Uint8ClampedArray,
  width: number,
  height: number,
  otsuThreshold: number
): Uint8ClampedArray {
  const integral = new Float64Array((width + 1) * (height + 1));
  const stride = width + 1;

  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    const srcRow = y * width;
    const intRow = (y + 1) * stride;
    const prevRow = y * stride;
    for (let x = 0; x < width; x++) {
      rowSum += gray[srcRow + x];
      integral[intRow + x + 1] = integral[prevRow + x + 1] + rowSum;
    }
  }

  const radius = Math.max(12, Math.min(36, Math.round(Math.min(width, height) * 0.025)));
  const out = new Uint8ClampedArray(gray.length);
  const sensitivity = 0.88; // pixel darker than 88% of local mean -> foreground ink

  for (let y = 0; y < height; y++) {
    const y1 = Math.max(0, y - radius);
    const y2 = Math.min(height - 1, y + radius);
    const rowTop = y1 * stride;
    const rowBot = (y2 + 1) * stride;
    const srcRow = y * width;

    for (let x = 0; x < width; x++) {
      const x1 = Math.max(0, x - radius);
      const x2 = Math.min(width - 1, x + radius);
      const area = (x2 - x1 + 1) * (y2 - y1 + 1);
      const sum =
        integral[rowBot + x2 + 1] -
        integral[rowTop + x2 + 1] -
        integral[rowBot + x1] +
        integral[rowTop + x1];
      const localMean = sum / area;
      const val = gray[srcRow + x];
      const localThreshold = localMean * sensitivity;

      // Blend local threshold with Otsu guard so blank uniform backgrounds don't speckled-noise
      const isInk =
        val < localThreshold && (val < otsuThreshold + 28 || localMean - val > 18);
      out[srcRow + x] = isInk ? 0 : 255;
    }
  }

  return out;
}

/**
 * Resizes image to ~1800–2000px wide for crisp small phone digits, checks for QR codes,
 * detects dark/colored cards, and prepares enhanced grayscale, inverted, and adaptive binarized variants.
 */
async function preprocessCardImage(imageSrc: string): Promise<PreprocessedVariants> {
  const { source, width: naturalW, height: naturalH, cleanup } = await loadOrientedDrawable(imageSrc);

  try {
    if (!naturalW || !naturalH) {
      throw new Error('Selected image has invalid dimensions.');
    }

    // Target ~1800–2000px wide so small 7-8pt phone numbers and emails read cleanly
    const maxW = 2000;
    const minTargetW = 1800;
    const maxArea = 4_200_000;
    let scale = 1;

    if (naturalW > maxW) {
      scale = maxW / naturalW;
    } else if (naturalW < minTargetW) {
      scale = Math.min(2.4, minTargetW / naturalW);
    }

    if (naturalW * scale * (naturalH * scale) > maxArea) {
      scale = Math.sqrt(maxArea / (naturalW * naturalH));
    }

    const width = Math.max(1, Math.round(naturalW * scale));
    const height = Math.max(1, Math.round(naturalH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return {
        standardDataUrl: imageSrc,
        invertedDataUrl: imageSrc,
        binarizedDataUrl: imageSrc,
        isDarkCard: false,
        qrPayload: null,
      };
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, width, height);

    // 1. Fast QR detection on downsampled color canvas (<= 1100px wide keeps jsQR under ~30ms)
    let qrPayload: string | null = null;
    try {
      const qrScale = width > 1100 ? 1100 / width : 1;
      const qrW = Math.max(1, Math.round(width * qrScale));
      const qrH = Math.max(1, Math.round(height * qrScale));
      let qrPixels: ImageData;
      if (qrScale < 1) {
        const qrCanvas = document.createElement('canvas');
        qrCanvas.width = qrW;
        qrCanvas.height = qrH;
        const qrCtx = qrCanvas.getContext('2d', { willReadFrequently: true });
        if (qrCtx) {
          qrCtx.drawImage(canvas, 0, 0, qrW, qrH);
          qrPixels = qrCtx.getImageData(0, 0, qrW, qrH);
        } else {
          qrPixels = ctx.getImageData(0, 0, width, height);
        }
      } else {
        qrPixels = ctx.getImageData(0, 0, width, height);
      }

      const { default: jsQR } = await import('jsqr');
      const qrResult = jsQR(qrPixels.data, qrPixels.width, qrPixels.height, {
        inversionAttempts: 'attemptBoth',
      });
      if (qrResult?.data?.trim()) {
        qrPayload = qrResult.data.trim();
      }
    } catch {
      // Ignore QR errors and continue to OCR
    }

    // 2. Single-pass grayscale conversion + luminance histogram
    const raw = ctx.getImageData(0, 0, width, height).data;
    const totalPixels = width * height;
    const rawGray = new Uint8ClampedArray(totalPixels);
    const hist = new Uint32Array(256);
    let lumSum = 0;

    for (let p = 0, i = 0; p < totalPixels; p++, i += 4) {
      const lum = Math.round(0.299 * raw[i] + 0.587 * raw[i + 1] + 0.114 * raw[i + 2]);
      rawGray[p] = lum;
      hist[lum]++;
      lumSum += lum;
    }

    const meanLuminance = lumSum / totalPixels;

    // 3. Percentile-based auto-contrast stretch (2% - 98%) to ignore specular glare outliers
    const lowTarget = totalPixels * 0.02;
    const highTarget = totalPixels * 0.98;
    const medianTarget = totalPixels * 0.5;
    let cumulative = 0;
    let pLow = 0;
    let pHigh = 255;
    let pMedian = 128;
    let foundLow = false;
    let foundMedian = false;

    for (let v = 0; v < 256; v++) {
      cumulative += hist[v];
      if (!foundLow && cumulative >= lowTarget) {
        pLow = v;
        foundLow = true;
      }
      if (!foundMedian && cumulative >= medianTarget) {
        pMedian = v;
        foundMedian = true;
      }
      if (cumulative >= highTarget) {
        pHigh = v;
        break;
      }
    }

    const isDarkCard = meanLuminance < 125 || pMedian < 120;
    const range = Math.max(24, pHigh - pLow);
    const stretched = new Uint8ClampedArray(totalPixels);
    const stretchedHist = new Uint32Array(256);

    for (let p = 0; p < totalPixels; p++) {
      const normalized = ((rawGray[p] - pLow) * 255) / range;
      const clamped = normalized < 0 ? 0 : normalized > 255 ? 255 : Math.round(normalized);
      stretched[p] = clamped;
      stretchedHist[clamped]++;
    }

    // 4. Unsharp mask sharpening for crisp small digits & email characters
    const sharpened = sharpenGrayscale(stretched, width, height, 0.45);

    // 5. Inverted variant (essential for dark navy/black/red cards & dark footer bands)
    const inverted = new Uint8ClampedArray(totalPixels);
    for (let p = 0; p < totalPixels; p++) {
      inverted[p] = 255 - sharpened[p];
    }

    // 6. Adaptive Bradley-Roth + Otsu binarized variant (always oriented as dark-text-on-white)
    const baseForBinarize = isDarkCard ? inverted : sharpened;
    const binHist = new Uint32Array(256);
    for (let p = 0; p < totalPixels; p++) binHist[baseForBinarize[p]]++;
    const otsuThreshold = computeOtsuThreshold(binHist, totalPixels);
    const binarized = adaptiveBinarizeGrayscale(baseForBinarize, width, height, otsuThreshold);

    const standardDataUrl = grayscaleToDataUrl(sharpened, width, height, canvas, ctx);
    const invertedDataUrl = grayscaleToDataUrl(inverted, width, height, canvas, ctx);
    const binarizedDataUrl = grayscaleToDataUrl(binarized, width, height, canvas, ctx);

    return {
      standardDataUrl,
      invertedDataUrl,
      binarizedDataUrl,
      isDarkCard,
      qrPayload,
    };
  } finally {
    cleanup();
  }
}

/**
 * Parses vCard / MECARD QR payloads into structured business card fields.
 */
function parseQrContactPayload(payload: string): Partial<ParsedBusinessCard> {
  const result: Partial<ParsedBusinessCard> = { ocrRawText: payload };
  const phones: string[] = [];

  if (/BEGIN:VCARD/i.test(payload)) {
    const lines = payload.split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (/^FN[:;]/i.test(line)) {
        const val = line.split(':').slice(1).join(':').trim();
        if (val) result.name = sanitizePersonNameInput(val);
      } else if (/^N[:;]/i.test(line) && !result.name) {
        const parts = line.split(':').slice(1).join(':').split(';').filter(Boolean);
        if (parts.length >= 2) {
          result.name = sanitizePersonNameInput(`${parts[1]} ${parts[0]}`.trim());
        } else if (parts[0]) {
          result.name = sanitizePersonNameInput(parts[0].trim());
        }
      } else if (/^ORG[:;]/i.test(line)) {
        result.firmName = line.split(':').slice(1).join(':').replace(/;/g, ' ').trim();
      } else if (/^TITLE[:;]/i.test(line)) {
        result.designation = line.split(':').slice(1).join(':').trim();
      } else if (/^TEL/i.test(line)) {
        const val = line.split(':').slice(1).join(':').trim();
        const phone = sanitizeIndianPhoneInput(val);
        if (phone.length === 10 && /^[6-9]\d{9}$/.test(phone) && !phones.includes(phone)) {
          phones.push(phone);
        }
      } else if (/^EMAIL/i.test(line) && !result.email) {
        const val = line.split(':').slice(1).join(':').trim().toLowerCase();
        if (validateEmailAddress(val).isValid) result.email = val;
      } else if (/^URL/i.test(line) && !result.website) {
        const val = line.split(':').slice(1).join(':').trim();
        if (validateWebsiteUrl(val).isValid) result.website = val;
      } else if (/^ADR/i.test(line)) {
        const parts = line.split(':').slice(1).join(':').split(';');
        const street = (parts[2] || '').trim();
        const city = (parts[3] || '').trim();
        const state = (parts[4] || '').trim();
        if (city) result.city = city;
        if (state) result.state = state;
        const fullAdr = [street, city, state, parts[5]].filter(Boolean).join(', ');
        if (fullAdr) result.address = fullAdr;
      }
    }
    if (phones.length > 0) {
      result.phone = phones[0];
      if (phones.length > 1) result.alternatePhones = phones.slice(1);
    }
    return result;
  }

  if (/^MECARD:/i.test(payload)) {
    const body = payload.replace(/^MECARD:/i, '');
    const tokens = body.split(';');
    for (const token of tokens) {
      const idx = token.indexOf(':');
      if (idx === -1) continue;
      const key = token.slice(0, idx).toUpperCase();
      const val = token.slice(idx + 1).trim();
      if (!val) continue;
      if (key === 'N') result.name = sanitizePersonNameInput(val.replace(/,/g, ' ').trim());
      if (key === 'ORG') result.firmName = val;
      if (key === 'TEL') {
        const phone = sanitizeIndianPhoneInput(val);
        if (phone.length === 10 && /^[6-9]\d{9}$/.test(phone) && !phones.includes(phone)) {
          phones.push(phone);
        }
      }
      if (key === 'EMAIL' && validateEmailAddress(val).isValid) result.email = val.toLowerCase();
      if (key === 'URL' && validateWebsiteUrl(val).isValid) result.website = val;
      if (key === 'ADR') result.address = val;
    }
    if (phones.length > 0) {
      result.phone = phones[0];
      if (phones.length > 1) result.alternatePhones = phones.slice(1);
    }
    return result;
  }

  if (validateWebsiteUrl(payload).isValid) {
    result.website = payload;
  }
  return result;
}

interface ScoredPhoneCandidate {
  phone: string;
  score: number;
}

/**
 * Repairs common Tesseract OCR letter-for-digit confusions strictly inside phone-like segments.
 */
function repairOcrPhoneSegment(segment: string): string {
  // Strip known phone labels before repairing so leading letters like "M:" or "Ph:" don't turn into digits
  const withoutLabel = segment.replace(
    /^\s*(?:mob(?:ile)?|cell|ph(?:one)?|tel(?:ephone)?|direct|off(?:ice)?|res(?:idence)?|whatsapp|w\.?a\.?|call|contact|fax|landline|board|m|p|t|c)\s*[:.;\-|]*\s*/i,
    ''
  );

  // Repair OCR lookalike characters inside numeric runs
  return withoutLabel
    .replace(/[OoQD]/g, '0')
    .replace(/[Il|!]/g, '1')
    .replace(/[Zz]/g, '2')
    .replace(/[Ss]/g, '5')
    .replace(/G/g, '6')
    .replace(/B/g, '8')
    .replace(/[gq]/g, '9');
}

/**
 * Extracts and ranks all valid 10-digit Indian mobile numbers from OCR text,
 * handling OCR digit confusions, 2/3/4/5-group spacing, parentheses, icon prefixes,
 * multiple numbers per line, and avoiding PIN codes / GSTIN / ICAI numbers / landlines.
 */
function extractRankedIndianMobileNumbers(normalizedText: string): string[] {
  const bestScores = new Map<string, number>();

  const registerCandidate = (phone: string, score: number) => {
    if (!/^[6-9]\d{9}$/.test(phone)) return;
    if (!validateIndianMobileNumber(phone).isValid) return;
    const prev = bestScores.get(phone);
    if (prev === undefined || score > prev) {
      bestScores.set(phone, score);
    }
  };

  const lines = normalizedText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    // Skip lines that are clearly GSTIN / PAN / CIN / ICAI / URL-only without a phone label
    const hasMobileLabel = /\b(?:mob(?:ile)?|cell|whatsapp|w\.?a\.?|handphone)\b|(?:^|[\s|,/])m\s*[:.\-]/i.test(line);
    const hasPhoneLabel =
      hasMobileLabel ||
      /\b(?:ph(?:one)?|tel(?:ephone)?|contact|call|direct|off(?:ice)?|board)\b|(?:^|[\s|,/])[ptc]\s*[:.\-]/i.test(line);
    const hasFaxOrLandlineLabel = /\b(?:fax|landline|extn?|std)\b/i.test(line);
    const hasIcaiOrTaxLabel = /\b(?:gstin|gst\s*no|pan|cin|frn|icai|m\.?\s*no\.?|mem(?:bership)?|fca|aca|pin\s*code?)\b/i.test(
      line
    );

    if (hasIcaiOrTaxLabel && !hasPhoneLabel && !/\+91/.test(line)) {
      // Only skip if the line doesn't also contain a 10+ digit phone alongside the tag
      const digitCount = (line.match(/\d/g) || []).length;
      if (digitCount < 10) continue;
    }

    // Split multi-number lines on '/', ',', ';', '|' (e.g. "M: 98490 12345 / 98490 67890")
    const segments = line.split(/[\/,;|]+/).map((s) => s.trim()).filter(Boolean);

    for (const rawSeg of segments) {
      const segHasMobileLabel =
        hasMobileLabel || /\b(?:mob(?:ile)?|cell|whatsapp|w\.?a\.?)\b|^\s*m\s*[:.\-]/i.test(rawSeg);
      const segHasPhoneLabel =
        hasPhoneLabel || /\b(?:ph(?:one)?|tel|contact|call)\b|^\s*[ptc]\s*[:.\-]/i.test(rawSeg);
      const segHasPlus91 = /\+\s*91\b/.test(rawSeg) || /\(\s*\+?\s*91\s*\)/.test(rawSeg);

      // Remove GSTIN tokens (15 chars like 36ABCDE1234F1Z5) so their embedded digits aren't misread
      const cleanedSeg = rawSeg.replace(/\b\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]\b/gi, ' ');

      // Check how numeric this segment is before applying aggressive OCR digit repair
      const alphaNum = cleanedSeg.replace(/[^a-zA-Z0-9]/g, '');
      const digitOnlyCount = (alphaNum.match(/\d/g) || []).length;
      const digitRatio = alphaNum.length > 0 ? digitOnlyCount / alphaNum.length : 0;

      const candidateViews: Array<{ text: string; isRepaired: boolean }> = [
        { text: cleanedSeg, isRepaired: false },
      ];
      if (digitOnlyCount >= 7 && (digitRatio >= 0.6 || segHasPhoneLabel || segHasPlus91)) {
        candidateViews.push({ text: repairOcrPhoneSegment(cleanedSeg), isRepaired: true });
      }

      for (const view of candidateViews) {
        // Match flexible phone chunks with 1 to 6 separator groups (spaces, hyphens, dots, parens, dashes)
        const pattern =
          /(?:\+?\s*\(?\s*91\s*\)?[\s.\-–—()]*)?(?:0[\s.\-–—]*)?(?:\(?\d{1,5}\)?[\s.\-–—()]*){2,6}\d{1,5}|\b\d{10,13}\b/g;
        const matches = view.text.match(pattern) || [];

        for (const match of matches) {
          const digits = match.replace(/\D/g, '');
          if (digits.length < 10 || digits.length > 13) continue;

          // Ignore common Indian STD landline codes (e.g. 040-23456789 or 022-26543210)
          const startsWithStd =
            (digits.length === 11 && COMMON_LANDLINE_STD_PREFIXES.has(digits.slice(0, 3))) ||
            (digits.length === 11 && COMMON_LANDLINE_STD_PREFIXES.has(digits.slice(0, 4))) ||
            (digits.length === 12 &&
              digits.startsWith('91') &&
              (COMMON_LANDLINE_STD_PREFIXES.has(`0${digits.slice(2, 4)}`) ||
                COMMON_LANDLINE_STD_PREFIXES.has(`0${digits.slice(2, 5)}`)));

          let baseScore = 40;
          if (segHasMobileLabel) baseScore += 30;
          else if (segHasPhoneLabel) baseScore += 15;
          if (segHasPlus91) baseScore += 25;
          if (hasFaxOrLandlineLabel) baseScore -= 25;
          if (view.isRepaired) baseScore -= 10;
          if (startsWithStd && !segHasMobileLabel) baseScore -= 30;

          // Case 1: Exact 10 digits
          if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
            registerCandidate(digits, baseScore + 12);
            continue;
          }

          // Case 2: 0 + 10 digits
          if (digits.length === 11 && digits.startsWith('0') && /^[6-9]\d{9}$/.test(digits.slice(1))) {
            registerCandidate(digits.slice(1), baseScore + 10);
            continue;
          }

          // Case 3: 91 + 10 digits
          if (digits.length === 12 && digits.startsWith('91') && /^[6-9]\d{9}$/.test(digits.slice(2))) {
            registerCandidate(digits.slice(2), baseScore + 16);
            continue;
          }

          // Case 4: 091 + 10 digits
          if (digits.length === 13 && digits.startsWith('091') && /^[6-9]\d{9}$/.test(digits.slice(3))) {
            registerCandidate(digits.slice(3), baseScore + 14);
            continue;
          }

          // Case 5 & 6: Only trim a stray leading icon digit when an explicit phone/mobile label or +91 is present
          if (
            (segHasMobileLabel || segHasPhoneLabel || segHasPlus91) &&
            digits.length === 11 &&
            !startsWithStd &&
            /^[6-9]\d{9}$/.test(digits.slice(1))
          ) {
            registerCandidate(digits.slice(1), baseScore + 2);
            continue;
          }

          if (
            (segHasMobileLabel || segHasPhoneLabel || segHasPlus91) &&
            digits.length === 13 &&
            digits.slice(1, 3) === '91' &&
            /^[6-9]\d{9}$/.test(digits.slice(3))
          ) {
            registerCandidate(digits.slice(3), baseScore + 4);
          }
        }
      }
    }
  }

  const ranked: ScoredPhoneCandidate[] = Array.from(bestScores.entries())
    .map(([phone, score]) => ({ phone, score }))
    .filter((item) => item.score >= 35)
    .sort((a, b) => b.score - a.score);

  return ranked.map((item) => item.phone);
}

/**
 * Extracts and repairs email address from OCR text (tolerating stray spaces, comma-for-dot TLDs, icon noise).
 */
function extractEmailFromText(normalizedText: string): string {
  // Pass 1: Direct clean match
  const directMatches =
    normalizedText.match(/[a-zA-Z0-9._%+-]+\s*@\s*[a-zA-Z0-9.-]+\s*[.,]\s*[a-zA-Z]{2,}(?:\s*[.,]\s*[a-zA-Z]{2,})?/g) ||
    [];

  for (const raw of directMatches) {
    const candidate = raw
      .replace(/\s+/g, '')
      .replace(/,/g, '.')
      .replace(/^[©®✉•·\-_]+/, '')
      .replace(/[.,;)]+$/, '')
      .toLowerCase();

    if (validateEmailAddress(candidate).isValid) {
      return candidate;
    }
  }

  // Pass 2: Look specifically at lines prefixed with Email/Mail/E: where OCR dropped space or misread dot
  const lines = normalizedText.split('\n');
  for (const line of lines) {
    if (!/(?:e-?mail|mail|@)/i.test(line)) continue;
    const stripped = line
      .replace(/^\s*(?:e-?mail|mail|e)\s*[:.\-|]*\s*/i, '')
      .replace(/[©®✉•·]/g, ' ')
      .trim();

    const noisyMatch = stripped.match(
      /[a-zA-Z0-9._%+-]+\s*@\s*[a-zA-Z0-9-]+(?:\s*[.,]\s*[a-zA-Z0-9-]+)+/
    );
    if (noisyMatch) {
      const candidate = noisyMatch[0]
        .replace(/\s+/g, '')
        .replace(/,/g, '.')
        .replace(/[.,;)]+$/, '')
        .toLowerCase();
      if (validateEmailAddress(candidate).isValid) {
        return candidate;
      }
    }
  }

  return '';
}

/**
 * Extracts website URL from OCR text (supports www., https://, OCR-clipped ww., and Web: bare domains).
 */
function extractWebsiteFromText(normalizedText: string): string {
  const urlMatches =
    normalizedText.match(
      /(?:https?:\/\/|w{2,3}\.)[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+(?:\/[^\s,;]*)?/gi
    ) || [];

  for (const rawUrl of urlMatches) {
    let cleaned = rawUrl.replace(/[.,;)]+$/, '').trim();
    if (/^ww\./i.test(cleaned)) {
      cleaned = `w${cleaned}`;
    }
    if (!cleaned.includes('@') && validateWebsiteUrl(cleaned).isValid) {
      return cleaned;
    }
  }

  // Bare domain after explicit "Web:" / "Website:" label
  const webLabelMatch = normalizedText.match(
    /\b(?:web(?:site)?|url)\s*[:.\-]\s*([a-zA-Z0-9-]+(?:\.[a-zA-Z]{2,})+)/i
  );
  if (webLabelMatch?.[1]) {
    const candidate = webLabelMatch[1].replace(/[.,;)]+$/, '').trim();
    if (!candidate.includes('@') && validateWebsiteUrl(candidate).isValid) {
      return candidate;
    }
  }

  return '';
}

/**
 * Extracts structured business card fields from raw OCR text using regex + heuristics.
 */
export function parseBusinessCardText(rawText: string): ParsedBusinessCard {
  const normalizedText = (rawText || '')
    .replace(/\r\n/g, '\n')
    .replace(/[–—]/g, '-')
    .replace(/\t/g, ' ');

  const lines = normalizedText
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length >= 2);

  // 1. Email
  const email = extractEmailFromText(normalizedText);

  // 2. Ranked Indian Mobile Numbers (primary + alternates)
  const rankedPhones = extractRankedIndianMobileNumbers(normalizedText);
  const phone = rankedPhones[0] || '';
  const alternatePhones = rankedPhones.slice(1);

  // 3. Website
  const website = extractWebsiteFromText(normalizedText);

  // 4. ICAI Membership / Registration Number
  let membershipNumber = '';
  const icaiMatch = normalizedText.match(
    /\b(?:(?:FCA|ACA)[\s.:/-]*\d{5,6}|(?:M\.?\s*No\.?|Mem(?:bership)?\.?\s*No\.?|ICAI[\s.:/-]*(?:Reg\.?\s*No\.?|No\.?)?|FRN)[\s.:/-]*[A-Z0-9/-]{5,12})\b/i
  );
  if (icaiMatch) {
    membershipNumber = icaiMatch[0]
      .replace(
        /^(?:M\.?\s*No\.?|Mem(?:bership)?\.?\s*No\.?|ICAI[\s.:/-]*(?:Reg\.?\s*No\.?|No\.?)?)\s*[:.-]?\s*/i,
        ''
      )
      .replace(/\s+/g, '-')
      .toUpperCase()
      .slice(0, 24);
  }

  // 5. State, City & Indian PIN-code fallback heuristics
  let state = '';
  let city = '';
  const lowerFull = normalizedText.toLowerCase();

  for (const st of INDIAN_STATES) {
    const regex = new RegExp(`\\b${st.replace(/\s+/g, '\\s+')}\\b`, 'i');
    if (regex.test(normalizedText)) {
      state = st === 'Orissa' ? 'Odisha' : st === 'New Delhi' ? 'Delhi' : st;
      break;
    }
  }

  for (const [cityKey, mappedState] of Object.entries(CITY_TO_STATE)) {
    const regex = new RegExp(`\\b${cityKey.replace(/\s+/g, '\\s+')}\\b`, 'i');
    if (regex.test(lowerFull)) {
      const canonicalCity =
        cityKey === 'bangalore'
          ? 'Bengaluru'
          : cityKey === 'gurgaon'
            ? 'Gurugram'
            : cityKey === 'calcutta'
              ? 'Kolkata'
              : cityKey === 'baroda'
                ? 'Vadodara'
                : cityKey === 'vizag'
                  ? 'Visakhapatnam'
                  : cityKey === 'cochin'
                    ? 'Kochi'
                    : cityKey === 'trivandrum'
                      ? 'Thiruvananthapuram'
                      : cityKey;
      city = toTitleCase(canonicalCity);
      if (!state) state = mappedState;
      break;
    }
  }

  // Strict state detection from 6-digit Indian PIN code ONLY inside address / PIN context
  // (never infer state from stray 6-digit ICAI membership numbers or partial phone chunks)
  if (!state) {
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (/\b(?:icai|m\.?\s*no\.?|mem(?:bership)?|frn|reg(?:n)?\.?\s*no|pan|gstin|cin|mob|tel|ph)\b/i.test(lowerLine)) {
        continue;
      }
      const hasAddressContext =
        /\b(?:pin|pincode|postal)\b/i.test(lowerLine) ||
        line.includes(',') ||
        ADDRESS_KEYWORDS.some((kw) => new RegExp(`\\b${kw.replace('.', '\\.')}`, 'i').test(lowerLine));
      if (!hasAddressContext) continue;

      const pinMatches = line.match(/(?<!\d)([1-8]\d{5})(?!\d)/g) || [];
      for (const pin of pinMatches) {
        if (membershipNumber && membershipNumber.replace(/\D/g, '') === pin) continue;
        const prefix = pin.slice(0, 2);
        if (PIN_PREFIX_TO_STATE[prefix]) {
          state = PIN_PREFIX_TO_STATE[prefix];
          break;
        }
      }
      if (state) break;
    }
  }

  // 6. Designation, Firm Name, Person Name, Address heuristics
  let designation = '';
  let firmName = '';
  let name = '';
  const addressLines: string[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (!designation && DESIGNATION_KEYWORDS.some((kw) => new RegExp(`\\b${kw}\\b`, 'i').test(lower))) {
      if (!line.includes('@') && line.length <= 80) {
        // If line is combined like "CA Rajesh Kumar | Managing Partner", extract just the designation part
        if (/[|\-–—]/.test(line)) {
          const parts = line.split(/[|\-–—]+/).map((p) => p.trim()).filter(Boolean);
          const desigPart = parts.find((p) =>
            DESIGNATION_KEYWORDS.some((kw) => new RegExp(`\\b${kw}\\b`, 'i').test(p.toLowerCase()))
          );
          designation = desigPart || line;
        } else {
          designation = line;
        }
      }
    }

    if (
      !firmName &&
      !line.includes('@') &&
      !/^(?:https?:\/\/|w{2,3}\.)/i.test(line) &&
      FIRM_KEYWORDS.some((kw) => lower.includes(kw))
    ) {
      if (line.length <= 95) {
        firmName = line.replace(/^[^a-zA-Z]+/, '').trim();
      }
    }

    if (
      ADDRESS_KEYWORDS.some((kw) => new RegExp(`\\b${kw.replace('.', '\\.')}`, 'i').test(lower)) ||
      /(?<!\d)[1-8]\d{5}(?!\d)/.test(line)
    ) {
      if (!line.includes('@') && addressLines.length < 3) {
        addressLines.push(line);
      }
    }
  }

  // Person name heuristic (strict: reject card headings, services, taglines, and non-name lines):
  // Supports "CA Rajesh Kumar, FCA | Partner", "C.A. S. K. Sharma", "RAJESH KULKARNI", etc.
  const NON_NAME_STOPWORDS = [
    'income tax',
    'gst',
    'audit',
    'auditing',
    'taxation',
    'advisory',
    'consultancy',
    'consultant',
    'consulting',
    'chartered',
    'accountant',
    'accountants',
    'services',
    'service',
    'solutions',
    'corporate',
    'finance',
    'financial',
    'banking',
    'legal',
    'compliance',
    'head office',
    'branch office',
    'registered office',
    'office',
    'address',
    'contact',
    'email',
    'website',
    'mobile',
    'phone',
    'direct',
    'indirect',
    'wealth',
    'management',
    'valuation',
    'project',
    'report',
    'loans',
    'loan',
    'subsidy',
    'registration',
    'secretarial',
    'insolvency',
    'bankruptcy',
    'business',
    'india',
    'private',
    'limited',
    'enterprise',
    'enterprises',
  ];

  const addressLineSet = new Set(addressLines);
  for (const rawLine of lines) {
    if (addressLineSet.has(rawLine)) continue;
    // Split on '|' in case name & designation share one line
    const segments = rawLine.split('|').map((s) => s.trim()).filter(Boolean);
    for (const seg of segments) {
      if (/\d|@|www\.|http|[:\/\\]/i.test(seg)) continue;

      const cleanedLine = seg
        .replace(/^(?:C\.?A\.?\s+|Mr\.?\s+|Ms\.?\s+|Mrs\.?\s+|Dr\.?\s+|Adv\.?\s+)/i, '')
        .replace(/,\s*(?:FCA|ACA|CPA|MBA|LLB|B\.?Com|M\.?Com|CS|CMA|DISA|IP).*$/i, '')
        .replace(/\s+(?:FCA|ACA|CPA|DISA|CS|CMA)(?:\s*,\s*[A-Z.]+)*$/i, '')
        .replace(/^[^a-zA-Z]+|[^a-zA-Z.]+$/g, '')
        .trim();

      if (!cleanedLine || cleanedLine.length < 4 || cleanedLine.length > 50) continue;
      if (firmName && cleanedLine.toLowerCase() === firmName.toLowerCase()) continue;

      const lowerClean = cleanedLine.toLowerCase();
      if (FIRM_KEYWORDS.some((kw) => lowerClean.includes(kw))) continue;
      if (DESIGNATION_KEYWORDS.some((kw) => lowerClean === kw || lowerClean.startsWith(`${kw} `))) continue;
      if (ADDRESS_KEYWORDS.some((kw) => new RegExp(`\\b${kw.replace('.', '\\.')}\\b`, 'i').test(lowerClean))) continue;
      if (NON_NAME_STOPWORDS.some((kw) => new RegExp(`\\b${kw.replace(/\s+/g, '\\s+')}\\b`, 'i').test(lowerClean))) continue;
      if (CITY_TO_STATE[lowerClean] || INDIAN_STATES.some((s) => s.toLowerCase() === lowerClean)) continue;

      const words = cleanedLine.split(/\s+/).filter(Boolean);
      const hasSubstantiveWord = words.some((w) => w.replace(/\./g, '').length >= 3);
      const looksLikeName =
        words.length >= 2 &&
        words.length <= 4 &&
        hasSubstantiveWord &&
        words.every(
          (w) =>
            /^[A-Z][a-zA-Z'-]{1,}$/.test(w) ||
            /^[A-Z]\.?$/.test(w)
        );

      if (looksLikeName) {
        name = sanitizePersonNameInput(toTitleCase(cleanedLine));
        break;
      }
    }
    if (name) break;
  }

  // Strictly leave firmName empty if not printed on the card — never guess from email domains.

  return {
    name: sanitizePersonNameInput(name).trim(),
    firmName: firmName.trim().slice(0, 100),
    email: email.trim().toLowerCase(),
    phone: sanitizeIndianPhoneInput(phone),
    alternatePhones,
    membershipNumber: membershipNumber.trim().slice(0, 24),
    city: city.trim().slice(0, 60),
    state: state.trim().slice(0, 60),
    designation: designation.trim().slice(0, 80),
    website: website.trim().slice(0, 120),
    address: addressLines.join(', ').slice(0, 200),
    ocrRawText: normalizedText.trim(),
    source: 'ocr',
  };
}

// ---------------------------------------------------------------------------
// Cached Singleton Tesseract Worker (with concurrency serialization & idle cleanup)
// ---------------------------------------------------------------------------

let cachedWorker: Worker | null = null;
let cachedWorkerPromise: Promise<Worker> | null = null;
let activeLogger: ((msg: LoggerMessage) => void) | null = null;
let idleCleanupTimer: ReturnType<typeof setTimeout> | null = null;
let scanMutex: Promise<void> = Promise.resolve();

const WORKER_IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

function scheduleWorkerIdleCleanup(): void {
  if (idleCleanupTimer) clearTimeout(idleCleanupTimer);
  idleCleanupTimer = setTimeout(() => {
    void terminateCardOcrWorker();
  }, WORKER_IDLE_TIMEOUT_MS);
}

/**
 * Terminates the cached Tesseract.js worker to free memory (e.g. on dashboard unmount).
 */
export async function terminateCardOcrWorker(): Promise<void> {
  if (idleCleanupTimer) {
    clearTimeout(idleCleanupTimer);
    idleCleanupTimer = null;
  }
  const workerToClose = cachedWorker;
  cachedWorker = null;
  cachedWorkerPromise = null;
  if (workerToClose) {
    await workerToClose.terminate().catch(() => {});
  }
}

async function getOrCreateTesseractWorker(): Promise<Worker> {
  if (cachedWorker) {
    return cachedWorker;
  }
  if (cachedWorkerPromise) {
    return cachedWorkerPromise;
  }

  cachedWorkerPromise = (async () => {
    const Tesseract = await import('tesseract.js');
    const worker = await Tesseract.createWorker('eng', 1, {
      logger: (m: LoggerMessage) => {
        activeLogger?.(m);
      },
    });
    cachedWorker = worker;
    return worker;
  })();

  try {
    return await cachedWorkerPromise;
  } catch (err) {
    cachedWorker = null;
    cachedWorkerPromise = null;
    throw err;
  }
}

function mergeParsedPasses(
  primary: ParsedBusinessCard,
  secondary: ParsedBusinessCard,
  primaryConf: number,
  secondaryConf: number
): ParsedBusinessCard {
  const preferSecondary = secondaryConf > primaryConf + 10;

  const pick = (a: string, b: string): string => {
    if (a && !b) return a;
    if (!a && b) return b;
    if (!a && !b) return '';
    return preferSecondary ? b : a;
  };

  // Collect all unique valid phones across both passes (primary pass phone preferred first)
  const allPhones: string[] = [];
  const pushPhone = (p?: string) => {
    const clean = sanitizeIndianPhoneInput(p || '');
    if (clean.length === 10 && /^[6-9]\d{9}$/.test(clean) && !allPhones.includes(clean)) {
      allPhones.push(clean);
    }
  };

  pushPhone(primary.phone);
  primary.alternatePhones?.forEach(pushPhone);
  pushPhone(secondary.phone);
  secondary.alternatePhones?.forEach(pushPhone);

  return {
    name: pick(primary.name, secondary.name),
    firmName: pick(primary.firmName, secondary.firmName),
    email: primary.email || secondary.email,
    phone: allPhones[0] || '',
    alternatePhones: allPhones.slice(1),
    membershipNumber: primary.membershipNumber || secondary.membershipNumber,
    city: primary.city || secondary.city,
    state: primary.state || secondary.state,
    designation: pick(primary.designation, secondary.designation),
    website: primary.website || secondary.website,
    address: primary.address.length >= secondary.address.length ? primary.address : secondary.address,
    ocrRawText: [primary.ocrRawText, secondary.ocrRawText]
      .filter(Boolean)
      .filter((txt, idx, arr) => idx === 0 || txt !== arr[0])
      .join('\n\n--- Pass 2 ---\n\n')
      .trim(),
    source: 'ocr',
    confidence: Math.max(primaryConf, secondaryConf),
  };
}

/**
 * Full free client-side scanning pipeline:
 * 1. EXIF-aware high-resolution preprocessing (~1800-2000px) with auto-contrast, unsharp mask,
 *    dark-card inversion detection, and adaptive Bradley-Roth + Otsu binarization
 * 2. Fast QR code detection via jsQR
 * 3. Cached singleton Tesseract.js worker with card-tuned DPI/PSM (PSM 6 + smart PSM 11 multi-pass fallback)
 * 4. OCR-noise-tolerant Indian phone, email, name, firm, ICAI & PIN-to-state extraction
 */
export async function scanBusinessCardLocally(
  imageDataUrl: string,
  onProgress?: (update: OcrProgressUpdate) => void,
  options?: ScanBusinessCardOptions
): Promise<ParsedBusinessCard> {
  const mode: CardOcrMode = options?.mode || 'auto';

  // Serialize concurrent scans safely so the shared singleton worker is never raced
  const previousMutex = scanMutex;
  let releaseMutex!: () => void;
  scanMutex = new Promise<void>((resolve) => {
    releaseMutex = resolve;
  });

  await previousMutex;

  try {
    onProgress?.({ status: 'Enhancing image & checking for QR code...', progress: 10 });

    const { standardDataUrl, invertedDataUrl, binarizedDataUrl, isDarkCard, qrPayload } =
      await preprocessCardImage(imageDataUrl);
    const qrData = qrPayload ? parseQrContactPayload(qrPayload) : null;

    // Fast path: complete QR contact card
    if (qrData && qrData.name && (qrData.email || qrData.phone)) {
      onProgress?.({ status: 'QR contact card detected', progress: 100 });
      return {
        name: sanitizePersonNameInput(qrData.name || '').trim(),
        firmName: (qrData.firmName || '').trim().slice(0, 100),
        email: (qrData.email || '').trim().toLowerCase(),
        phone: sanitizeIndianPhoneInput(qrData.phone || ''),
        alternatePhones: qrData.alternatePhones || [],
        membershipNumber: (qrData.membershipNumber || '').trim().slice(0, 24),
        city: (qrData.city || '').trim().slice(0, 60),
        state: (qrData.state || '').trim().slice(0, 60),
        designation: (qrData.designation || '').trim().slice(0, 80),
        website: (qrData.website || '').trim().slice(0, 120),
        address: (qrData.address || '').trim().slice(0, 200),
        ocrRawText: qrData.ocrRawText || '',
        source: 'qr',
        confidence: 100,
        passesRun: 0,
        detectedDarkCard: isDarkCard,
      };
    }

    onProgress?.({
      status: cachedWorker ? 'Reusing browser OCR engine...' : 'Loading browser OCR engine...',
      progress: 20,
    });

    const Tesseract = await import('tesseract.js');
    const worker = await getOrCreateTesseractWorker();

    // Helper to execute a single tuned OCR pass
    const runPass = async (
      dataUrl: string,
      psm: (typeof Tesseract.PSM)[keyof typeof Tesseract.PSM],
      label: string,
      progressStart: number,
      progressEnd: number
    ): Promise<{ parsed: ParsedBusinessCard; confidence: number }> => {
      activeLogger = (m: LoggerMessage) => {
        if (!onProgress) return;
        const pct = typeof m.progress === 'number' ? Math.round(m.progress * 100) : 0;
        if (m.status === 'recognizing text') {
          onProgress({
            status: `${label} (${pct}%)...`,
            progress: Math.min(progressEnd, progressStart + Math.round((pct / 100) * (progressEnd - progressStart))),
          });
        } else if (m.status === 'loading language traineddata') {
          onProgress({
            status: 'Loading English OCR language data...',
            progress: Math.min(30, 20 + Math.round(pct * 0.1)),
          });
        }
      };

      await worker.setParameters({
        tessedit_pageseg_mode: psm,
        user_defined_dpi: '300',
        preserve_interword_spaces: '1',
      });

      const recognition = await worker.recognize(dataUrl);
      const rawText = recognition?.data?.text || '';
      const confidence = typeof recognition?.data?.confidence === 'number' ? recognition.data.confidence : 0;
      return {
        parsed: parseBusinessCardText(rawText),
        confidence,
      };
    };

    try {
      // Pick best Pass 1 image variant based on selected mode & luminance detection
      const pass1Variant =
        mode === 'dark-card'
          ? 'inverted'
          : mode === 'high-contrast'
            ? 'binarized'
            : isDarkCard
              ? 'inverted'
              : 'standard';

      const pass1Url =
        pass1Variant === 'inverted'
          ? invertedDataUrl
          : pass1Variant === 'binarized'
            ? binarizedDataUrl
            : standardDataUrl;

      let passesRun = 1;
      const pass1 = await runPass(
        pass1Url,
        Tesseract.PSM.SINGLE_BLOCK,
        pass1Variant === 'inverted' ? 'Reading dark-background card' : 'Reading text from business card',
        25,
        68
      );

      let combined = pass1.parsed;
      let bestConfidence = pass1.confidence;

      // Smart Pass 2 fallback: run sparse-text PSM 11 on complementary binarized/standard variant
      // whenever phone, email, or name is missing or confidence is low
      const needsPass2 =
        !combined.phone || !combined.email || !combined.name || bestConfidence < 68;

      if (needsPass2) {
        passesRun += 1;
        const pass2Url = pass1Variant === 'binarized' ? standardDataUrl : binarizedDataUrl;
        const pass2 = await runPass(
          pass2Url,
          Tesseract.PSM.SPARSE_TEXT,
          'Refining phone & contact details (Pass 2)',
          69,
          86
        );
        combined = mergeParsedPasses(combined, pass2.parsed, bestConfidence, pass2.confidence);
        bestConfidence = Math.max(bestConfidence, pass2.confidence);
      }

      // Targeted Pass 3: rescue white-on-dark-footer phone numbers/emails on light cards
      if ((!combined.phone || !combined.email) && pass1Variant !== 'inverted') {
        passesRun += 1;
        const pass3 = await runPass(
          invertedDataUrl,
          Tesseract.PSM.SPARSE_TEXT,
          'Scanning colored/dark footer strips (Pass 3)',
          87,
          96
        );
        combined = mergeParsedPasses(combined, pass3.parsed, bestConfidence, pass3.confidence);
        bestConfidence = Math.max(bestConfidence, pass3.confidence);
      }

      onProgress?.({ status: 'Parsing extracted contact details...', progress: 98 });

      // Merge QR fields as higher-trust priority over OCR if partial QR was present
      const finalPhones: string[] = [];
      const addFinalPhone = (p?: string) => {
        const clean = sanitizeIndianPhoneInput(p || '');
        if (clean.length === 10 && /^[6-9]\d{9}$/.test(clean) && !finalPhones.includes(clean)) {
          finalPhones.push(clean);
        }
      };
      addFinalPhone(qrData?.phone);
      qrData?.alternatePhones?.forEach(addFinalPhone);
      addFinalPhone(combined.phone);
      combined.alternatePhones?.forEach(addFinalPhone);

      // Guard against hallucinated heuristic fields when overall OCR confidence is very low.
      // Pattern-verified email, phone, and explicit ICAI registration remain allowed if valid.
      const allowHeuristicOcr = bestConfidence >= 38;

      const merged: ParsedBusinessCard = {
        name: sanitizePersonNameInput(qrData?.name || (allowHeuristicOcr ? combined.name : '')).trim(),
        firmName: (qrData?.firmName || (allowHeuristicOcr ? combined.firmName : '')).trim().slice(0, 100),
        email: (qrData?.email || combined.email).trim().toLowerCase(),
        phone: finalPhones[0] || '',
        alternatePhones: finalPhones.slice(1),
        membershipNumber: (qrData?.membershipNumber || combined.membershipNumber).trim().slice(0, 24),
        city: (qrData?.city || (allowHeuristicOcr ? combined.city : '')).trim().slice(0, 60),
        state: (qrData?.state || (allowHeuristicOcr ? combined.state : '')).trim().slice(0, 60),
        designation: (qrData?.designation || (allowHeuristicOcr ? combined.designation : '')).trim().slice(0, 80),
        website: (qrData?.website || (allowHeuristicOcr ? combined.website : '')).trim().slice(0, 120),
        address: (qrData?.address || (allowHeuristicOcr ? combined.address : '')).trim().slice(0, 200),
        ocrRawText: [qrData?.ocrRawText, combined.ocrRawText].filter(Boolean).join('\n\n').trim(),
        source: qrData ? 'qr+ocr' : 'ocr',
        confidence: bestConfidence,
        passesRun,
        detectedDarkCard: isDarkCard,
      };

      scheduleWorkerIdleCleanup();
      onProgress?.({ status: 'Scan complete', progress: 100 });
      return merged;
    } catch (err) {
      // If the worker crashed internally, discard it so the next scan spawns a healthy one
      await terminateCardOcrWorker();
      throw err;
    } finally {
      activeLogger = null;
    }
  } finally {
    releaseMutex();
  }
}
