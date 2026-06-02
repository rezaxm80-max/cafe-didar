// Central menu data management

const DEFAULT_MENU_ITEMS = [
  { id: 'espresso', category: 'hot', emoji: '☕', title: 'اسپرسو ویژه', desc: 'دانه‌های خاص روست شده داخل کافه', price: 120000 },
  { id: 'cappuccino', category: 'hot', emoji: '☕', title: 'کاپوچینو خامه‌ای', desc: 'کف لطیف و طعم کرمی بی‌نظیر', price: 140000 },
  { id: 'latte_caramel', category: 'hot', emoji: '☕', title: 'لاته کارامل', desc: 'ترکیب شیر و کارامل طلایی', price: 150000 },
  { id: 'mocha', category: 'hot', emoji: '☕', title: 'موکا شکلاتی', desc: 'قهوه با شکلات تلخ اعلا', price: 160000 },
  { id: 'americano', category: 'hot', emoji: '☕', title: 'آمریکانو', desc: 'قهوه سبک و خوش‌طعم', price: 110000 },
  { id: 'macchiato', category: 'hot', emoji: '☕', title: 'ماکیاتو عسل', desc: 'لایه‌های قهوه و عسل طبیعی', price: 170000 },
  { id: 'masala_tea', category: 'hot', emoji: '🍵', title: 'چای ماسالا', desc: 'ادویه‌های هندی اصیل', price: 90000 },
  { id: 'honey_cinnamon_milk', category: 'hot', emoji: '🍵', title: 'شیر عسل دارچین', desc: 'گرم و آرامش‌بخش', price: 100000 },
  { id: 'mojito', category: 'cold', emoji: '🍹', title: 'موهیتو نعناع', desc: 'تازه و خنک تابستانی', price: 180000 },
  { id: 'ginger_lemonade', category: 'cold', emoji: '🍋', title: 'لیموناد زنجبیل', desc: 'تند و ترش و انرژی‌بخش', price: 150000 },
  { id: 'frappuccino', category: 'cold', emoji: '🧋', title: 'فراپوچینو', desc: 'خامه و قهوه سرد لوکس', price: 190000 },
  { id: 'iced_latte', category: 'cold', emoji: '☕', title: 'آیس لته', desc: 'لاته روی یخ درشت', price: 160000 },
  { id: 'strawberry_smoothie', category: 'cold', emoji: '🍓', title: 'اسموتی توت‌فرنگی', desc: 'میوه تازه و طبیعی', price: 170000 },
  { id: 'chocolate_shake', category: 'cold', emoji: '🍫', title: 'شیک شکلاتی', desc: 'غنی و خامه‌ای ویژه', price: 200000 },
  { id: 'iced_americano', category: 'cold', emoji: '☕', title: 'آیس آمریکانو', desc: 'سبک و خنک روی یخ', price: 140000 },
  { id: 'brownie', category: 'dessert', emoji: '🍫', title: 'براونی شکلاتی', desc: 'گرم با بستنی وانیل', price: 180000 },
  { id: 'strawberry_cheesecake', category: 'dessert', emoji: '🍰', title: 'چیزکیک توت‌فرنگی', desc: 'خامه‌ای و ترش ایتالیایی', price: 200000 },
  { id: 'tiramisu', category: 'dessert', emoji: '🍮', title: 'تیرامیسو', desc: 'دسر کلاسیک ایتالیایی', price: 220000 },
  { id: 'vanilla_panna_cotta', category: 'dessert', emoji: '🍮', title: 'پاناکوتا وانیل', desc: 'نرم و لطیف فرانسوی', price: 190000 },
  { id: 'blueberry_muffin', category: 'dessert', emoji: '🧁', title: 'مافین بلوبری', desc: 'تازه از فر صبحگاهی', price: 130000 },
  { id: 'honey_waffle', category: 'dessert', emoji: '🧇', title: 'وافل عسل', desc: 'ترد با عسل طبیعی کوهستان', price: 170000 },
];

const STORAGE_KEY = 'cafe_menu_items';

/**
 * Get menu items from localStorage.
 * If empty, initializes with default items and saves to localStorage.
 * @returns {Array} Array of menu items
 */
export function getMenuItems() {
  console.log('📖 getMenuItems() called');
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const items = JSON.parse(stored);
      console.log('✅ Loaded', items.length, 'items from localStorage');
      return items;
    } else {
      console.log('🆕 No items in localStorage, initializing with', DEFAULT_MENU_ITEMS.length, 'defaults');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MENU_ITEMS));
      return DEFAULT_MENU_ITEMS;
    }
  } catch (e) {
    console.error('❌ Error loading menu items:', e);
    return DEFAULT_MENU_ITEMS;
  }
}

/**
 * Save menu items to localStorage.
 * @param {Array} items - Array of menu items to save
 */
export function saveMenuItems(items) {
  console.log('💾 saveMenuItems() called with', items.length, 'items');
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    console.log('✅ Saved', items.length, 'items to localStorage');
  } catch (e) {
    console.error('❌ Error saving menu items:', e);
  }
}
