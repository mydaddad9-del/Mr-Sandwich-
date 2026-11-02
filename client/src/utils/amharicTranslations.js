/**
 * Amharic & English Localization Helpers for Bloom Bar & Restaurant
 * ──────────────────────────────────────────────────────────────────
 */

export const CATEGORY_TRANSLATIONS = {
  food: 'ምግብ',
  foods: 'ምግቦች',
  beverage: 'መጠጥ',
  beverages: 'መጠጦች',
  'hot drinks': 'ትኩስ መጠጦች',
  'cold drinks': 'ቀዝቃዛ መጠጦች',
  coffee: 'ቡና',
  tea: 'ሻይ',
  bakery: 'ዳቦና ኬክ',
  pastry: 'ፓስትሪ',
  breakfast: 'ቁርስ',
  lunch: 'ምሳ',
  dinner: 'እራት',
  dessert: 'ጣፋጭ',
  desserts: 'ጣፋጮች',
  snacks: 'መክሰስ',
  'fast food': 'ፈጣን ምግብ',
  burger: 'በርገር',
  burgers: 'በርገሮች',
  pizza: 'ፒዛ',
  sandwich: 'ሳንድዊች',
  special: 'ልዩ',
  general: 'ጠቅላላ',
  kitchen: 'ኩሽና',
  barista: 'ባሪስታ',
};

/**
 * Returns localized category name based on active language.
 * @param {string} category
 * @param {string} lang - 'en' | 'am'
 * @returns {string}
 */
export function getLocalizedCategory(category = '', lang = 'en') {
  if (!category) return '';
  if (lang !== 'am') return category;
  const key = String(category).trim().toLowerCase();
  return CATEGORY_TRANSLATIONS[key] || category;
}

/**
 * Returns localized product name based on active language.
 * @param {object} product
 * @param {string} lang - 'en' | 'am'
 * @returns {string}
 */
export function getLocalizedProductName(product = {}, lang = 'en') {
  if (!product) return '';
  if (lang === 'am' && product.nameAmharic && String(product.nameAmharic).trim()) {
    return String(product.nameAmharic).trim();
  }
  return product.name || '';
}

