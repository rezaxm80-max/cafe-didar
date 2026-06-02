import { useEffect, useMemo, useRef, useState } from 'react';
import { saveOrderToSheets, getOrdersFromSheets } from './googleSheets';
import { getMenuItems, saveMenuItems } from './menuData';
import './App.css';

const LOCAL_KEYS = {
  orders: 'cafe_orders',
  feedback: 'cafe_feedback',
  gallery: 'cafe_gallery',
  loyalty: 'cafe_loyalty',
  cart: 'cafe_cart',
};

const categories = [
  { key: 'hot', label: '☕ گرم' },
  { key: 'cold', label: '🍹 سرد' },
  { key: 'dessert', label: '🍰 دسر' },
];

const bottomTabs = [
  { key: 'menu', label: '☕ منو' },
  { key: 'feedback', label: '💬 نظرات' },
  { key: 'club', label: '⭐ باشگاه' },
  { key: 'gallery', label: '📸 گالری' },
];

const formatPrice = (price) => `${price.toLocaleString('fa-IR')} تومان`;
const formatOrderTime = (timestamp) => {
  if (!timestamp) return 'نامشخص';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleString('fa-IR', { hour: '2-digit', minute: '2-digit', year: 'numeric', month: 'long', day: 'numeric' });
};
const nowLabel = () => new Date().toLocaleString('fa-IR', { hour: '2-digit', minute: '2-digit', year: 'numeric', month: 'long', day: 'numeric' });
const getLocal = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
};
const setLocal = (key, value) => localStorage.setItem(key, JSON.stringify(value));

function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [stickyHeader, setStickyHeader] = useState(false);
  const [page, setPage] = useState('menu');
  const [category, setCategory] = useState('hot');
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [loyalty, setLoyalty] = useState([]);
  const [heroScrolled, setHeroScrolled] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [phone, setPhone] = useState('');
  const [member, setMember] = useState(null);
  const [galleryPreview, setGalleryPreview] = useState(null);
  const [floatActive, setFloatActive] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLogged, setAdminLogged] = useState(false);
  const [adminTab, setAdminTab] = useState('orders');
  const [menuEditor, setMenuEditor] = useState({ id: '', emoji: '☕', title: '', desc: '', price: '', category: 'hot' });
  const [editMode, setEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const heroRef = useRef();
  const pagePanelRef = useRef();
  const tabsRef = useRef();
  const tabRefs = useRef({});

  const filteredItems = useMemo(
    () => menuItems.filter((item) => item.category === category),
    [menuItems, category],
  );

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.qty * item.price, 0);
  const tableNumber = new URLSearchParams(window.location.search).get('table') || 'نامشخص';

  useEffect(() => {
    console.log('📋 App initialized - loading menu items');
    
    // Load menu items from centralized storage
    const items = getMenuItems();
    setMenuItems(items);
    
    // Load other data from localStorage
    const storedOrders = getLocal(LOCAL_KEYS.orders, []);
    const storedFeedback = getLocal(LOCAL_KEYS.feedback, []);
    const storedGallery = getLocal(LOCAL_KEYS.gallery, []);
    const storedLoyalty = getLocal(LOCAL_KEYS.loyalty, []);
    const storedCart = getLocal(LOCAL_KEYS.cart, []);
    
    setOrders(storedOrders);
    setFeedbacks(Array.isArray(storedFeedback) ? storedFeedback.map((f) => ({ ...f, read: !!f.read })) : []);
    setGallery(storedGallery);
    setLoyalty(storedLoyalty);
    setCart(storedCart);
    setTimeout(() => setIsLoaded(true), 80);
  }, []);

  useEffect(() => {
    // Save ALL menu items whenever they change
    if (menuItems.length > 0) {
      console.log('💾 Menu items changed - saving', menuItems.length, 'items');
      saveMenuItems(menuItems);
    }
  }, [menuItems]);

  useEffect(() => {
    setLocal(LOCAL_KEYS.orders, orders);
  }, [orders]);

  useEffect(() => {
    setLocal(LOCAL_KEYS.feedback, feedbacks);
  }, [feedbacks]);

  useEffect(() => {
    setLocal(LOCAL_KEYS.gallery, gallery);
  }, [gallery]);

  useEffect(() => {
    setLocal(LOCAL_KEYS.loyalty, loyalty);
  }, [loyalty]);

  useEffect(() => {
    setLocal(LOCAL_KEYS.cart, cart);
  }, [cart]);

  useEffect(() => {
    // Debug log for menu rendering
    console.log('🎨 Menu rendering:', {
      totalItems: menuItems.length,
      itemsWithImages: menuItems.filter(i => i.image).length,
      itemsWithEmoji: menuItems.filter(i => !i.image).length,
      filteredByCategory: filteredItems.length,
      items: filteredItems.map(i => ({
        id: i.id,
        title: i.title,
        hasImage: !!i.image,
        emoji: i.emoji,
      })),
    });
  }, [filteredItems]);

  useEffect(() => {
    const activeTab = tabRefs.current[category];
    activeTab?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [category]);

  useEffect(() => {
    const onScroll = () => {
      setStickyHeader(window.scrollY > 180);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (page === 'menu') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    pagePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [page]);

  useEffect(() => {
    if (!adminLogged) return undefined;
    const fetchOrders = async () => {
      const remoteOrders = await getOrdersFromSheets();
      if (Array.isArray(remoteOrders)) {
        setOrders(remoteOrders);
      }
    };
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [adminLogged]);

  const addToCart = (item) => {
    console.log('🛒 Adding to cart:', {
      id: item.id,
      title: item.title,
      hasImage: !!item.image,
      emoji: item.emoji,
    });
    setCart((current) => {
      const exists = current.find((product) => product.id === item.id);
      if (exists) {
        return current.map((product) => (product.id === item.id ? { ...product, qty: product.qty + 1 } : product));
      }
      return [...current, { ...item, qty: 1 }];
    });
    setFloatActive(true);
    setTimeout(() => setFloatActive(false), 900);
  };

  const updateQty = (itemId, delta) => {
    setCart((current) =>
      current
        .map((item) => (item.id === itemId ? { ...item, qty: Math.max(1, item.qty + delta) } : item))
        .filter((item) => item.qty > 0),
    );
  };

  const removeFromCart = (itemId) => {
    setCart((current) => current.filter((item) => item.id !== itemId));
  };

  const submitOrder = () => {
    if (!cart.length) return;
    const newOrder = {
      id: `ORD-${Date.now()}`,
      items: cart,
      total: cartTotal,
      table: tableNumber,
      status: 'در انتظار',
      createdAt: nowLabel(),
    };
    setOrders((current) => [newOrder, ...current]);
    saveOrderToSheets({
      tableNumber,
      items: cart.map((item) => `${item.emoji} ${item.title} x${item.qty}`).join(', '),
      totalPrice: cartTotal,
      status: 'جدید',
    });
    setCart([]);
    setModalOpen(false);
    setOrderSuccess(true);
    setSuccessMessage('سفارش شما ثبت شد و در مسیر آماده‌سازی است');

    if (member) {
      setLoyalty((current) =>
        current.map((account) =>
          account.phone === member.phone
            ? { ...account, points: Math.min(account.points + 10, account.points + 10) }
            : account,
        ),
      );
    }
    setTimeout(() => setOrderSuccess(false), 3200);
  };

  const submitFeedback = () => {
    if (!feedbackText.trim()) return;
    setFeedbacks((current) => [
      { id: `FB-${Date.now()}`, rating, text: feedbackText.trim(), date: nowLabel() },
      ...current,
    ]);
    setFeedbackText('');
    setRating(5);
    setSuccessMessage('نظر شما با موفقیت ثبت شد');
    setTimeout(() => setSuccessMessage(''), 2600);
  };

  const findMember = () => {
    if (!phone.trim()) return;
    const found = loyalty.find((account) => account.phone === phone.trim());
    if (found) {
      setMember(found);
      setSuccessMessage('عضو باشگاه پیدا شد');
    } else {
      const newMember = { phone: phone.trim(), points: 0, createdAt: nowLabel() };
      setLoyalty((current) => [newMember, ...current]);
      setMember(newMember);
      setSuccessMessage('عضو جدید باشگاه ساخته شد');
    }
    setTimeout(() => setSuccessMessage(''), 2600);
  };

  const uploadGallery = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setGallery((current) => [{ id: `IMG-${Date.now()}`, src: reader.result, date: nowLabel() }, ...current]);
    };
    reader.readAsDataURL(file);
  };

  const adminLogin = () => {
    if (adminPassword === 'didar1234') {
      setAdminLogged(true);
      setAdminPassword('');
      setSuccessMessage('ورود مدیریت با موفقیت انجام شد');
      setTimeout(() => setSuccessMessage(''), 2600);
    } else {
      setSuccessMessage('رمز عبور اشتباه است');
      setTimeout(() => setSuccessMessage(''), 2600);
    }
  };

  const changeOrderStatus = (orderId, status) => {
    setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, status } : order)));
  };

  const prepareMenuEdit = (item) => {
    console.log('✏️ Editing menu item:', item.id, item.title);
    setMenuEditor({ ...item });
    setEditMode(true);
    setPage('menu');
    setAdminTab('menu');
  };

  const clearMenuEditor = () => {
    console.log('🗑️ Clearing menu editor form');
    setMenuEditor({ id: '', emoji: '☕', title: '', desc: '', price: '', category: 'hot', image: undefined });
    setEditMode(false);
  };

  const saveMenuItem = () => {
    if (!menuEditor.title.trim() || !menuEditor.desc.trim() || !menuEditor.price) {
      console.log('⚠️ Validation failed - missing required fields');
      return;
    }
    
    const item = {
      ...menuEditor,
      id: menuEditor.id || `ITEM-${Date.now()}`,
      price: Number(menuEditor.price),
      // Ensure all required properties exist
      emoji: menuEditor.emoji || '☕',
      image: menuEditor.image || undefined,
    };
    
    console.log('💾 Saving menu item:', {
      id: item.id,
      title: item.title,
      hasImage: !!item.image,
      imageLength: item.image?.length || 0,
      price: item.price,
      category: item.category,
    });
    
    setMenuItems((current) => {
      const exists = current.some((entry) => entry.id === item.id);
      let updated;
      if (exists) {
        console.log('🔄 Updating existing item:', item.id);
        updated = current.map((entry) => (entry.id === item.id ? item : entry));
      } else {
        console.log('✨ Adding new item:', item.id);
        updated = [item, ...current];
      }
      console.log('📋 Menu now has', updated.length, 'items');
      return updated;
    });
    
    clearMenuEditor();
    setSuccessMessage('منوی جدید ذخیره شد');
    setTimeout(() => setSuccessMessage(''), 2600);
  };

  const removeMenuItem = (id) => {
    console.log('🗑️ Removing menu item:', id);
    setMenuItems((current) => {
      const updated = current.filter((item) => item.id !== id);
      console.log('📋 Menu now has', updated.length, 'items');
      return updated;
    });
  };

  const markFeedbackRead = (id) => {
    setFeedbacks((current) => current.map((f) => (f.id === id ? { ...f, read: true } : f)));
  };

  const handleMenuImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log('⚠️ No image file selected');
      return;
    }
    console.log('🖼️ Image selected:', file.name, 'Size:', file.size, 'bytes');
    const reader = new FileReader();
    reader.onload = () => {
      console.log('✅ Image converted to base64');
      const base64String = reader.result;
      console.log('📊 Base64 length:', base64String.length);
      setMenuEditor((prev) => ({ ...prev, image: base64String }));
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const activeOrders = orders;
  const qrBase = `${window.location.origin}${window.location.pathname}`;

  const memberProgress = member ? Math.min(100, (member.points % 100) / 100 * 100) : 0;
  const freeCoffee = member ? member.points >= 100 : false;

  const adminMode = window.location.pathname.startsWith('/admin');

  if (adminMode) {
    return (
      <div className={`App app-loaded ${isLoaded ? 'anim-loaded' : ''}`} dir="rtl">
        <div className="sticky-panel admin-sticky">
          <div className="brand-panel">کافه دیدار | پنل مدیریت</div>
        </div>
        <main className="admin-shell">
          {!adminLogged ? (
            <section className="glass-card login-card scale-in">
              <h2>ورود مدیر</h2>
              <p>برای دسترسی به پنل، رمز عبور را وارد کنید</p>
              <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="رمز عبور" />
              <button className="gold-button" onClick={adminLogin}>ورود</button>
              {successMessage && <div className="toast">{successMessage}</div>}
            </section>
          ) : (
            <section className="glass-card admin-card scale-in">
              <div className="admin-tabs">
                <button className={adminTab === 'orders' ? 'active' : ''} onClick={() => setAdminTab('orders')}>سفارش‌ها</button>
                <button className={adminTab === 'menu' ? 'active' : ''} onClick={() => setAdminTab('menu')}>منو</button>
                <button className={adminTab === 'feedback' ? 'active' : ''} onClick={() => setAdminTab('feedback')}>نظرات</button>
                <button className={adminTab === 'qr' ? 'active' : ''} onClick={() => setAdminTab('qr')}>QR کدها</button>
              </div>
              {adminTab === 'orders' && (
                <div className="admin-panel">
                  <h3>سفارش‌ها</h3>
                  <div className="order-list">
                    {activeOrders.length ? activeOrders.map((order) => (
                      <article key={order.id || order.timestamp} className="order-card">
                        <div className="order-header">
                          <strong>وضعیت: {order.status || 'نامشخص'}</strong>
                          <span>میز شماره {order.tableNumber || order.table || 'نامشخص'}</span>
                        </div>
                        <div className="order-meta">زمان: {formatOrderTime(order.timestamp || order.createdAt)}</div>
                        <div className="order-items">
                          <strong>آیتم‌ها:</strong>
                          <p>{typeof order.items === 'string' ? order.items : Array.isArray(order.items) ? order.items.join('، ') : '-'}</p>
                        </div>
                        <div className="order-total">قیمت کل: {order.totalPrice ? `${Number(order.totalPrice).toLocaleString('fa-IR')} تومان` : '-'}</div>
                      </article>
                    )) : <p className="empty-state">هیچ سفارشی ثبت نشده است</p>}
                  </div>
                </div>
              )}
              {adminTab === 'menu' && (
                <div className="admin-panel">
                  <h3>مدیریت منو</h3>
                  <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '0.6rem' }}>
                    <button className="gold-button" onClick={() => { clearMenuEditor(); setEditMode(false); }}>افزودن آیتم جدید</button>
                  </div>
                  <div className="menu-admin-grid">
                    <div className="menu-editor glass-card">
                      <h4>{editMode ? 'ویرایش آیتم' : 'افزودن آیتم جدید'}</h4>
                      <label>ایموجی</label>
                      <input value={menuEditor.emoji} onChange={(e) => setMenuEditor((prev) => ({ ...prev, emoji: e.target.value }))} />
                      <label style={{ marginTop: '0.4rem', fontSize: '0.95rem', color: 'var(--muted)' }}>یا آپلود عکس</label>
                      <input type="file" accept="image/*" onChange={handleMenuImageUpload} />
                      {menuEditor.image && <img src={menuEditor.image} alt="preview" style={{ width: '60px', height: '60px', borderRadius: '8px', marginTop: '0.5rem', objectFit: 'cover' }} />}
                      <label>نام آیتم</label>
                      <input value={menuEditor.title} onChange={(e) => setMenuEditor((prev) => ({ ...prev, title: e.target.value }))} />
                      <label>توضیح</label>
                      <textarea value={menuEditor.desc} onChange={(e) => setMenuEditor((prev) => ({ ...prev, desc: e.target.value }))} />
                      <label>قیمت</label>
                      <input type="number" value={menuEditor.price} onChange={(e) => setMenuEditor((prev) => ({ ...prev, price: e.target.value }))} />
                      <label>دسته</label>
                      <select value={menuEditor.category} onChange={(e) => setMenuEditor((prev) => ({ ...prev, category: e.target.value }))}>
                        {categories.map((cat) => <option key={cat.key} value={cat.key}>{cat.label}</option>)}
                      </select>
                      <div className="menu-editor-actions">
                        <button className="gold-button" onClick={saveMenuItem}>{editMode ? 'بروزرسانی' : 'ذخیره'}</button>
                        <button className="ghost-button" onClick={clearMenuEditor}>لغو</button>
                      </div>
                    </div>
                    <div className="menu-admin-list">
                      {menuItems.map((item) => (
                        <article key={item.id} className="menu-item-card">
                          <div>{item.image ? <img src={item.image} alt={item.title} className="menu-item-image" /> : item.emoji} <strong>{item.title}</strong></div>
                          <small>{item.desc}</small>
                          <div className="menu-item-actions">
                            <span>{formatPrice(item.price)}</span>
                            <div>
                              <button className="ghost-button" onClick={() => prepareMenuEdit(item)}>ویرایش</button>
                              <button className="ghost-button" onClick={() => removeMenuItem(item.id)}>حذف</button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {adminTab === 'feedback' && (
                <div className="admin-panel">
                  <h3>نظرات کاربران</h3>
                  {feedbacks.length ? feedbacks.map((item) => (
                    <article key={item.id} className={`feedback-card ${!item.read ? 'unread' : ''}`}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="feedback-stars">{Array.from({ length: 5 }).map((_, index) => (
                          <span key={index} className={index < item.rating ? 'filled' : ''}>★</span>
                        ))}</div>
                        {!item.read && <button className="ghost-button" onClick={() => markFeedbackRead(item.id)}>علامت خوانده شد</button>}
                      </div>
                      <p>{item.text}</p>
                      <small>{item.date}</small>
                    </article>
                  )) : <p className="empty-state">هنوز نظری ثبت نشده است</p>}
                </div>
              )}
              {adminTab === 'qr' && (
                <div className="admin-panel">
                  <h3>کدهای QR میز</h3>
                  <div className="qr-grid">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((table) => {
                      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${qrBase}?table=${table}`)}`;
                      return (
                        <div key={table} className="qr-card">
                          <img src={qrUrl} alt={`QR ${table}`} />
                          <div className="qr-meta">میز {table}</div>
                          <button className="ghost-button" onClick={() => {
                            const printWindow = window.open('', '_blank');
                            if (printWindow) {
                              printWindow.document.write(`<html><body style="margin:0;padding:20px;display:flex;justify-content:center;align-items:center;height:100vh;background:#1c0f0a;"><img src="${qrUrl}" style="width:100%;max-width:320px;" /></body></html>`);
                              printWindow.document.close();
                              printWindow.print();
                            }
                          }}>چاپ</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {successMessage && <div className="toast">{successMessage}</div>}
            </section>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className={`App app-loaded ${isLoaded ? 'anim-loaded' : ''}`} dir="rtl">
      <div className={`hero ${stickyHeader ? 'hero-mini' : ''}`} ref={heroRef}>
        <div className="hero-glow" />
        <div className="hero-copy">
          <h1 className="hero-title">کافه دیدار</h1>
          <button type="button" className="hero-pill" onClick={() => setModalOpen(true)}>
            <span>فاکتور</span>
            <span className="hero-pill-badge">{cartCount}</span>
          </button>
        </div>
        <div className="hero-floats">
          {['☕', '🥐', '🍮'].map((emoji, idx) => (
            <span key={idx} className={`hero-emoji hero-emoji-${idx}`}>{emoji}</span>
          ))}
        </div>
      </div>

      <div className={`sticky-bar ${stickyHeader ? 'visible' : ''}`}>
        <div className="sticky-title">کافه دیدار</div>
        <button type="button" className="cart-pill" onClick={() => setModalOpen(true)}>
          <span>🛎️</span>
          <div>
            <small>فاکتور</small>
            <strong>{cartCount}</strong>
          </div>
        </button>
      </div>

      <main className="content-shell">
        <section className="tab-panel glass-card slide-in">
          <div className="tabs-inner" ref={tabsRef}>
            {categories.map((cat) => (
              <button
                key={cat.key}
                ref={(el) => { tabRefs.current[cat.key] = el; }}
                className={category === cat.key ? 'tab-item active' : 'tab-item'}
                onClick={() => setCategory(cat.key)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        <section className="menu-grid">
          {filteredItems.map((item, index) => (
            <article key={item.id} className="menu-card" style={{ animationDelay: `${index * 80}ms` }}>
              <div className="menu-emoji">{item.image ? <img src={item.image} alt={item.title} className="menu-card-img" /> : item.emoji}</div>
              <div className="menu-info">
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
              <div className="menu-footer">
                <span className="menu-price">{formatPrice(item.price)}</span>
                <button className="add-button" onClick={() => addToCart(item)}>
                  افزودن
                </button>
              </div>
            </article>
          ))}
        </section>

        <section className="section glass-card slide-in">
          <h2>جمع‌آوری سفارش</h2>
          <p>برای مشاهده سبد خرید دکمه فاکتور را لمس کنید.</p>
        </section>
      </main>

      <nav className="bottom-nav glass-card">
        {bottomTabs.map((tab) => (
          <button key={tab.key} className={page === tab.key ? 'bottom-tab active' : 'bottom-tab'} onClick={() => setPage(tab.key)}>
            <span>{tab.label}</span>
            {page === tab.key && <div className="bottom-dot" />}
          </button>
        ))}
      </nav>

      <section ref={pagePanelRef} className={`page-panel ${page === 'menu' ? 'active' : ''}`}>
        {page === 'feedback' && (
          <div className="glass-card page-card scale-in">
            <h2>نظر شما برای ما ارزشمند است</h2>
            <div className="rating-row">
              {Array.from({ length: 5 }).map((_, index) => (
                <button key={index} className={index < rating ? 'star active' : 'star'} onClick={() => setRating(index + 1)}>★</button>
              ))}
            </div>
            <textarea value={feedbackText} placeholder="نظر خود را بنویسید..." onChange={(e) => setFeedbackText(e.target.value)} />
            <button className="gold-button" onClick={submitFeedback}>ارسال نظر</button>
            {successMessage && <div className="toast">{successMessage}</div>}
            <div className="feedback-list">
              {feedbacks.length ? feedbacks.map((item) => (
                <div key={item.id} className="feedback-card">
                  <div className="feedback-stars">{Array.from({ length: 5 }).map((_, index) => (
                    <span key={index} className={index < item.rating ? 'filled' : ''}>★</span>
                  ))}</div>
                  <p>{item.text}</p>
                  <small>{item.date}</small>
                </div>
              )) : <p className="empty-state">هنوز نظری ارسال نشده است</p>}
            </div>
          </div>
        )}

        {page === 'club' && (
          <div className="glass-card page-card scale-in">
            <h2>باشگاه مشتریان</h2>
            <p>هر سفارش = ۱۰ امتیاز · ۱۰۰ امتیاز = یک قهوه رایگان</p>
            <div className="member-input">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="شماره همراه" />
              <button className="gold-button" onClick={findMember}>یافتن / ثبت</button>
            </div>
            {member && (
              <div className="member-card">
                <h3>عضو باشگاه</h3>
                <p>شماره: {member.phone}</p>
                <p>امتیاز: {member.points}</p>
                <div className="progress-bar">
                  <span style={{ width: `${member.points % 100}%` }} />
                </div>
                <p>{freeCoffee ? 'قهوه رایگان باز شد! 🎉' : 'تا قهوه رایگان باقی مانده'}</p>
              </div>
            )}
            {successMessage && <div className="toast">{successMessage}</div>}
          </div>
        )}

        {page === 'gallery' && (
          <div className="glass-card page-card scale-in gallery-page">
            <div className="gallery-header">
              <h2>گالری دیدار</h2>
              <label className="upload-button">
                <span className="upload-icon">📷</span>
                بارگذاری تصویر
                <input type="file" accept="image/*" onChange={uploadGallery} />
              </label>
            </div>
            <div className="gallery-grid">
              {gallery.length ? gallery.map((item) => (
                <button key={item.id} className="gallery-item" onClick={() => setGalleryPreview(item.src)}>
                  <img src={item.src} alt="گالری" />
                  <div className="gallery-meta">
                    <span>🕒</span>
                    <small>{item.date}</small>
                  </div>
                </button>
              )) : <p className="empty-state">تصویری بارگذاری نشده است</p>}
            </div>
            {galleryPreview && (
              <div className="lightbox" onClick={() => setGalleryPreview(null)}>
                <img src={galleryPreview} alt="پیش‌نمایش" />
              </div>
            )}
          </div>
        )}
      </section>

      {modalOpen && (
        <div className="overlay" onClick={() => setModalOpen(false)}>
          <div className="modal glass-card scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>سفارش شما</h2>
              <span>میز: {tableNumber}</span>
            </div>
            <div className="order-items">
              {cart.length ? cart.map((item) => (
                <div key={item.id} className="order-item">
                  <div>
                    <strong>{item.image ? <img src={item.image} alt={item.title} style={{ width: '24px', height: '24px', marginRight: '6px', verticalAlign: 'middle', borderRadius: '4px' }} /> : item.emoji} {item.title}</strong>
                    <small>{formatPrice(item.price)}</small>
                  </div>
                  <div className="qty-controls">
                    <button onClick={() => updateQty(item.id, -1)}>-</button>
                    <span>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)}>+</button>
                    <button className="ghost-button" onClick={() => removeFromCart(item.id)}>حذف</button>
                  </div>
                </div>
              )) : <p className="empty-state">سبد شما خالی است</p>}
            </div>
            <div className="order-summary">
              <div>مجموع</div>
              <strong>{formatPrice(cartTotal)}</strong>
            </div>
            <button className="gold-button full-width" onClick={submitOrder}>ثبت سفارش</button>
          </div>
        </div>
      )}

      {orderSuccess && (
        <div className="success-sheet scale-in">
          <div className="checkmark">✔</div>
          <p>سفارش شما ثبت شد</p>
          <div className="confetti">
            {Array.from({ length: 18 }).map((_, idx) => <span key={idx} className={`confetti-piece piece-${idx}`} />)}
          </div>
        </div>
      )}

      {floatActive && <div className="plus-fly">+1</div>}
    </div>
  );
}

export default App;
