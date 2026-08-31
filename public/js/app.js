/**
 * EL GALLERO - Modern App Client Engine (Solo Prenotazioni)
 * 100% Robust, Null-Safe, Real-time Sync with Vendor Dashboard
 */

document.addEventListener('DOMContentLoaded', () => {
  // Default Initial Data Fallback
  const DEFAULT_APP_DATA = {
    settings: {
      storeName: "EL GALLERO",
      subtitle: "100% cotto a legna • Solo prenotazioni",
      phone: "3775975734",
      address: "Casavatore in Via E. A. Mario, 30",
      adminPin: "230888",
      currency: "€",
      timeSlots: [
        "19:00", "19:15", "19:30", "19:45", "20:00", "20:15", "20:30", "20:45", "21:00", "21:15", "21:30"
      ]
    },
    categories: [
      { id: "pollo", name: "Pollo", icon: "🍗", description: "Pollo girarrosto cotto a legna allo spiedo, morbido e dorato" },
      { id: "sfizio", name: "Sfizio", icon: "🍟", description: "Patate al forno rustiche, crocchè e sfiziosità artigianali" },
      { id: "bibite", name: "Bibite", icon: "🥤", description: "Bibite fresche e birre selezionate" },
      { id: "box", name: "Box", icon: "📦", description: "Menu completi e convenienti per singoli, coppie e famiglie" }
    ],
    products: [
      // --- POLLO ---
      { id: "p1", category: "pollo", name: "Pollo Intero Cotto a Legna", price: 9.00, stock: 20, unlimited: false, description: "Pollo intero girarrosto cotto 100% a legna allo spiedo con erbe aromatiche", available: true },
      { id: "p2", category: "pollo", name: "Mezzo Pollo Cotto a Legna", price: 5.50, stock: 15, unlimited: false, description: "Mezzo pollo dorato e succulento cotto allo spiedo", available: true },
      { id: "p3", category: "pollo", name: "Pollo Intero con Patate al Forno", price: 13.00, stock: 15, unlimited: false, description: "Pollo intero a legna con porzione abbondante di patate al forno speziate", available: true },
      { id: "p4", category: "pollo", name: "Mezzo Pollo con Patate al Forno", price: 8.50, stock: 12, unlimited: false, description: "Mezzo pollo a legna con contorno di patate rustiche al rosmarino", available: true },
      { id: "p5", category: "pollo", name: "Coscette di Pollo alla Brace (3 pz)", price: 6.00, stock: 15, unlimited: false, description: "3 cosce di pollo marinate con spezie della casa e cotte a legna", available: true },
      { id: "p6", category: "pollo", name: "Ali di Pollo Speziate e Croccanti (6 pz)", price: 5.00, stock: 20, unlimited: false, description: "6 alette di pollo speziate e dorate allo spiedo", available: true },
      
      // --- SFIZIO ---
      { id: "s1", category: "sfizio", name: "Patate al Forno Rustiche Grandi", price: 4.50, stock: 25, unlimited: false, description: "Porzione abbondante di patate cotte a legna con rosmarino e aromi", available: true },
      { id: "s2", category: "sfizio", name: "Patate al Forno Rustiche Medie", price: 3.00, stock: 30, unlimited: false, description: "Porzione classica di patate al forno saporite", available: true },
      { id: "s3", category: "sfizio", name: "Crocchè Artigianali Napoletani (3 pz)", price: 3.00, stock: 20, unlimited: false, description: "3 crocchè di patate fresche con cuore filante di provola", available: true },
      { id: "s4", category: "sfizio", name: "Frittatine di Pasta alla Napoletana (2 pz)", price: 3.50, stock: 20, unlimited: false, description: "2 frittatine classiche con besciamella cremosa, macinato e piselli", available: true },
      { id: "s5", category: "sfizio", name: "Arancini di Riso Rustici (2 pz)", price: 3.00, stock: 20, unlimited: false, description: "2 arancini di riso al ragù e provola con panatura dorata", available: true },
      { id: "s6", category: "sfizio", name: "Mix Sfizi El Gallero (6 pz)", price: 5.50, stock: 15, unlimited: false, description: "Assortimento della casa: 2 crocchè, 2 arancini, 2 frittatine", available: true },
      { id: "s7", category: "sfizio", name: "Croccantella di Pollo Panata", price: 3.50, stock: 15, unlimited: false, description: "Filetto di pollo impanato croccante e dorato", available: true },

      // --- BIBITE ---
      { id: "b1", category: "bibite", name: "Coca Cola in Lattina 33cl", price: 2.00, stock: 40, unlimited: true, description: "Lattina fresca originale 33cl", available: true },
      { id: "b2", category: "bibite", name: "Coca Cola Zero 33cl", price: 2.00, stock: 30, unlimited: true, description: "Lattina fresca senza zuccheri 33cl", available: true },
      { id: "b3", category: "bibite", name: "Coca Cola in Bottiglia 1.5L", price: 3.50, stock: 25, unlimited: true, description: "Bottiglia formato famiglia da 1.5 Litri", available: true },
      { id: "b4", category: "bibite", name: "Fanta in Lattina 33cl", price: 2.00, stock: 30, unlimited: true, description: "Aranciata fresca in lattina 33cl", available: true },
      { id: "b5", category: "bibite", name: "Sprite in Lattina 33cl", price: 2.00, stock: 25, unlimited: true, description: "Gusto fresco e frizzante al limone 33cl", available: true },
      { id: "b6", category: "bibite", name: "Birra Nastro Azzurro 66cl", price: 3.00, stock: 35, unlimited: true, description: "Birra bionda italiana fresca in bottiglia 66cl", available: true },
      { id: "b7", category: "bibite", name: "Birra Moretti 66cl", price: 3.00, stock: 30, unlimited: true, description: "Birra classica ricetta originale 66cl", available: true },
      { id: "b8", category: "bibite", name: "Birra Heineken 33cl", price: 2.00, stock: 30, unlimited: true, description: "Birra bionda internazionale 33cl", available: true },
      { id: "b9", category: "bibite", name: "Acqua Minerale Naturale 1L", price: 1.50, stock: 50, unlimited: true, description: "Bottiglia da 1 Litro", available: true },
      { id: "b10", category: "bibite", name: "Acqua Minerale Frizzante 1L", price: 1.50, stock: 50, unlimited: true, description: "Bottiglia da 1 Litro frizzante", available: true },

      // --- BOX ---
      { id: "box1", category: "box", name: "Box Single", price: 10.00, stock: 15, unlimited: false, description: "Mezzo pollo cotto a legna + Porzione patate al forno + 1 Bibita in lattina 33cl", available: true },
      { id: "box2", category: "box", name: "Box Coppia", price: 16.50, stock: 15, unlimited: false, description: "1 Pollo intero a legna + Porzione grande patate al forno + 2 Bibite 33cl o 1 Birra 66cl", available: true },
      { id: "box3", category: "box", name: "Box Famiglia", price: 26.00, stock: 10, unlimited: false, description: "2 Polli interi a legna + Maxi patate al forno + 4 Sfizi misti + 1 Bottiglia Coca Cola 1.5L", available: true },
      { id: "box4", category: "box", name: "Box Sfiziosa", price: 19.00, stock: 12, unlimited: false, description: "1 Pollo intero a legna + Mix Sfizi 6 pz + Patate al forno grandi + 2 Birre o Bibite", available: true }
    ]
  };

  // State
  let storeSettings = DEFAULT_APP_DATA.settings;
  let categories = DEFAULT_APP_DATA.categories;
  let products = DEFAULT_APP_DATA.products;
  let activeCategory = 'all';
  let searchQuery = '';
  let cart = {};
  let currentOrderType = 'ritiro';
  let lastBooking = null;

  // DOM Cache
  const productsGrid = document.getElementById('productsGrid');
  const visibleItemsCount = document.getElementById('visibleItemsCount');
  const currentCategoryTitle = document.getElementById('currentCategoryTitle');
  const searchInput = document.getElementById('searchInput');
  const clearSearch = document.getElementById('clearSearch');
  
  const sidebarCartItems = document.getElementById('sidebarCartItems');
  const sidebarCartFooter = document.getElementById('sidebarCartFooter');
  const sidebarCartTotal = document.getElementById('sidebarCartTotal');
  
  const mobileCartBar = document.getElementById('mobileCartBar');
  const mobileCartBadge = document.getElementById('mobileCartBadge');
  const mobileCartPrice = document.getElementById('mobileCartPrice');
  
  const bottomNavCartCount = document.getElementById('bottomNavCartCount');
  const bottomNavCartPrice = document.getElementById('bottomNavCartPrice');

  const checkoutModal = document.getElementById('checkoutModal');
  const receiptModal = document.getElementById('receiptModal');
  const adminPinModal = document.getElementById('adminPinModal');
  const customerAppView = document.getElementById('customerAppView');
  const adminAppView = document.getElementById('adminAppView');
  const pickupDateInput = document.getElementById('pickupDate');
  const pickupTimeSelect = document.getElementById('pickupTimeSelect');

  // Initialize
  init();

  async function init() {
    setupDateTimeFields();
    await loadInitialData();
    setupLiveMenuSync();
    updateCartUI();
  }

  function setupDateTimeFields() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    if (pickupDateInput) {
      pickupDateInput.min = todayStr;
      if (!pickupDateInput.value) pickupDateInput.value = todayStr;
    }
    populateTimeSlots(storeSettings.timeSlots);
  }

  function populateTimeSlots(slots) {
    if (!pickupTimeSelect) return;
    const defaultSlots = (slots && slots.length) ? slots : DEFAULT_APP_DATA.settings.timeSlots;
    
    let html = '<option value="">Seleziona orario...</option>';
    defaultSlots.forEach(s => {
      html += `<option value="${s}">Ore ${s}</option>`;
    });
    pickupTimeSelect.innerHTML = html;

    if (defaultSlots.length > 0 && !pickupTimeSelect.value) {
      pickupTimeSelect.value = defaultSlots[0];
    }
  }

  async function loadInitialData() {
    let loaded = false;
    try {
      const [infoRes, menuRes] = await Promise.all([
        fetch('/api/info', { cache: 'no-store' }),
        fetch('/api/menu', { cache: 'no-store' })
      ]);

      if (infoRes.ok && menuRes.ok) {
        const infoData = await infoRes.json();
        const menuData = await menuRes.json();
        if (infoData.success && menuData.success) {
          storeSettings = infoData.settings || DEFAULT_APP_DATA.settings;
          categories = (menuData.categories && menuData.categories.length) ? menuData.categories : DEFAULT_APP_DATA.categories;
          products = (menuData.products && menuData.products.length) ? menuData.products : DEFAULT_APP_DATA.products;
          loaded = true;
        }
      }
    } catch (e) {}

    if (!loaded) {
      try {
        const local = localStorage.getItem('el_gallero_data');
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed.settings) storeSettings = parsed.settings;
          if (parsed.categories && parsed.categories.length) categories = parsed.categories;
          if (parsed.products && parsed.products.length) products = parsed.products;
        }
      } catch (e) {}
    }

    populateTimeSlots(storeSettings.timeSlots);
    renderProducts();
  }

  function setupLiveMenuSync() {
    try {
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('el_gallero_sync_channel');
        bc.onmessage = (msg) => {
          if (msg && msg.data && msg.data.type === 'menu_updated') {
            if (msg.data.products) {
              products = msg.data.products;
              renderProducts();
              updateCartUI();
            }
          }
        };
      }
    } catch (e) {}

    window.addEventListener('storage', (e) => {
      if (e.key === 'el_gallero_data' || e.key === 'el_gallero_products') {
        loadInitialData();
      }
    });

    setInterval(async () => {
      try {
        const res = await fetch('/api/menu', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.products)) {
            products = data.products;
            renderProducts();
          }
        }
      } catch (e) {}
    }, 4000);
  }

  // ---------------- RENDERING ----------------

  function renderProducts() {
    if (!productsGrid) return;

    const filtered = products.filter(p => {
      const matchesCategory = (activeCategory === 'all' || p.category === activeCategory);
      const matchesSearch = (!searchQuery || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      return matchesCategory && matchesSearch;
    });

    if (visibleItemsCount) {
      visibleItemsCount.textContent = `${filtered.length} ${filtered.length === 1 ? 'prodotto' : 'prodotti'}`;
    }

    if (currentCategoryTitle) {
      if (activeCategory === 'all') {
        currentCategoryTitle.textContent = searchQuery ? `Risultati per "${searchQuery}"` : 'Menu Completo';
      } else {
        const catObj = categories.find(c => c.id === activeCategory);
        currentCategoryTitle.textContent = catObj ? `${catObj.icon || ''} ${catObj.name}` : 'Menu';
      }
    }

    if (filtered.length === 0) {
      productsGrid.innerHTML = `
        <div class="empty-products-msg">
          <i class="fa-solid fa-magnifying-glass"></i>
          <h4>Nessun piatto trovato</h4>
          <p>Prova a selezionare un'altra categoria o cerca un altro nome.</p>
        </div>
      `;
      return;
    }

    productsGrid.innerHTML = filtered.map(prod => {
      const inCart = cart[prod.id] ? cart[prod.id].quantity : 0;
      const formattedPrice = Number(prod.price).toFixed(2).replace('.', ',');
      const isUnlimited = Boolean(prod.unlimited);
      const stock = prod.stock !== undefined ? prod.stock : 10;
      const isAvailable = isUnlimited ? (prod.available !== false) : (stock > 0 && prod.available !== false);

      let stockTag = '';
      if (!isAvailable) {
        stockTag = `<span class="stock-pill stock-pill-out"><i class="fa-solid fa-ban"></i> Esaurito</span>`;
      } else if (!isUnlimited) {
        if (stock <= 3) {
          stockTag = `<span class="stock-pill stock-pill-low"><i class="fa-solid fa-fire"></i> Solo ${stock} rimasti!</span>`;
        } else {
          stockTag = `<span class="stock-pill stock-pill-ok"><i class="fa-solid fa-circle-check"></i> ${stock} disponibili</span>`;
        }
      }

      const isBox = (prod.category === 'box');
      const boxBadge = isBox ? `<span class="badge-box-promo"><i class="fa-solid fa-gift"></i> Offerta Box</span>` : '';

      return `
        <div class="app-product-card ${!isAvailable ? 'card-unavailable' : ''} ${inCart > 0 ? 'card-in-cart' : ''}">
          <div class="prod-card-top">
            <div>
              <div class="prod-tag-row">
                <span class="prod-category-tag">${escapeHtml(prod.category)}</span>
                ${boxBadge}
                ${stockTag}
              </div>
              <h3 class="prod-card-title">${escapeHtml(prod.name)}</h3>
            </div>
            <div class="prod-price-pill">${formattedPrice} €</div>
          </div>

          <p class="prod-card-desc">${escapeHtml(prod.description || '')}</p>

          <div class="prod-card-bottom">
            ${!isAvailable ? `
              <button type="button" class="btn-app-action btn-disabled" disabled>
                <i class="fa-solid fa-ban"></i> Esaurito
              </button>
            ` : inCart === 0 ? `
              <button type="button" class="btn-app-action btn-add-cart" onclick="window.appCartAdd('${prod.id}')">
                <i class="fa-solid fa-plus"></i> Aggiungi al Carrello
              </button>
            ` : `
              <div class="app-stepper-row">
                <div class="app-qty-stepper">
                  <button type="button" class="btn-step" onclick="window.appCartDec('${prod.id}')" title="Riduci">-</button>
                  <span class="step-num">${inCart}</span>
                  <button type="button" class="btn-step" onclick="window.appCartAdd('${prod.id}')" title="Aumenta">+</button>
                </div>
                <button type="button" class="btn-app-action btn-direct-book" onclick="window.openCheckout()">
                  <i class="fa-solid fa-calendar-check"></i> Prenota Subito
                </button>
              </div>
            `}
          </div>
        </div>
      `;
    }).join('');
  }

  // ---------------- CART MANAGEMENT ----------------

  window.appCartAdd = function(productId) {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const isUnlimited = Boolean(prod.unlimited);
    const stock = prod.stock !== undefined ? prod.stock : 10;
    const inCart = cart[productId] ? cart[productId].quantity : 0;

    if (!isUnlimited && inCart >= stock) {
      showToast(`⚠️ Disponibilità massima raggiunta (${stock} pz)`, 'warning');
      return;
    }

    if (!cart[productId]) {
      cart[productId] = {
        id: prod.id,
        name: prod.name,
        category: prod.category,
        price: Number(prod.price),
        quantity: 1
      };
      showToast(`🍗 Aggiunto: ${prod.name}`);
    } else {
      cart[productId].quantity++;
    }

    updateCartUI();
  };

  window.appCartDec = function(productId) {
    if (!cart[productId]) return;

    cart[productId].quantity--;
    if (cart[productId].quantity <= 0) {
      delete cart[productId];
    }
    updateCartUI();
  };

  window.appClearCart = function() {
    if (Object.keys(cart).length === 0) return;
    if (confirm('Vuoi davvero svuotare il carrello?')) {
      cart = {};
      updateCartUI();
      showToast('Carrello svuotato');
    }
  };

  function updateCartUI() {
    const items = Object.values(cart);
    const totalCount = items.reduce((sum, it) => sum + it.quantity, 0);
    const totalPrice = items.reduce((sum, it) => sum + (it.quantity * it.price), 0);
    const formattedPrice = totalPrice.toFixed(2).replace('.', ',') + ' €';

    // Desktop sidebar
    if (sidebarCartItems) {
      if (totalCount === 0) {
        sidebarCartItems.innerHTML = `
          <div class="empty-cart-msg">
            <i class="fa-solid fa-drumstick-bite"></i>
            <p>Il carrello è vuoto</p>
            <small>Scegli i tuoi piatti dal menu per iniziare!</small>
          </div>
        `;
        if (sidebarCartFooter) sidebarCartFooter.style.display = 'none';
      } else {
        sidebarCartItems.innerHTML = items.map(item => `
          <div class="cart-item-row">
            <div class="cart-item-info">
              <strong class="cart-item-name">${escapeHtml(item.name)}</strong>
              <small class="cart-item-unit">${item.price.toFixed(2).replace('.', ',')} € cad.</small>
            </div>
            <div class="cart-item-stepper">
              <button type="button" class="btn-qty-mini" onclick="window.appCartDec('${item.id}')">-</button>
              <span class="qty-val">${item.quantity}</span>
              <button type="button" class="btn-qty-mini" onclick="window.appCartAdd('${item.id}')">+</button>
            </div>
            <div class="cart-item-subtotal">${(item.quantity * item.price).toFixed(2).replace('.', ',')} €</div>
          </div>
        `).join('');
        if (sidebarCartTotal) sidebarCartTotal.textContent = formattedPrice;
        if (sidebarCartFooter) sidebarCartFooter.style.display = 'block';
      }
    }

    // Floating mobile bar
    if (mobileCartBar) {
      if (totalCount > 0) {
        if (mobileCartBadge) mobileCartBadge.textContent = totalCount;
        if (mobileCartPrice) mobileCartPrice.textContent = formattedPrice;
        mobileCartBar.classList.add('active');
      } else {
        mobileCartBar.classList.remove('active');
      }
    }

    // Bottom nav bar badges
    if (bottomNavCartCount) bottomNavCartCount.textContent = totalCount;
    if (bottomNavCartPrice) bottomNavCartPrice.textContent = totalCount > 0 ? formattedPrice : '0,00 €';

    renderProducts();
  }

  // ---------------- CATEGORY & SEARCH ----------------

  window.appFilterCategory = function(catId) {
    activeCategory = catId;
    document.querySelectorAll('.app-cat-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === catId);
    });
    renderProducts();
  };

  window.appClearSearch = function() {
    if (searchInput) searchInput.value = '';
    searchQuery = '';
    if (clearSearch) clearSearch.style.display = 'none';
    renderProducts();
  };

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      if (clearSearch) clearSearch.style.display = searchQuery ? 'block' : 'none';
      renderProducts();
    });
  }

  window.appNavTo = function(target) {
    if (target === 'menu') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ---------------- CHECKOUT MODAL ----------------

  window.appSetOrderType = function(type) {
    currentOrderType = type;
    const typeRitiro = document.getElementById('typeRitiroCard');
    const typeDomicilio = document.getElementById('typeDomicilioCard');
    const radioRitiro = document.getElementById('radioRitiro');
    const radioDomicilio = document.getElementById('radioDomicilio');
    const delivGroup = document.getElementById('deliveryAddressGroup');
    const delivFeeRow = document.getElementById('modalDeliveryFeeRow');
    const totalLabel = document.getElementById('modalTotalLabel');
    const lblDate = document.getElementById('lblDate');
    const lblTime = document.getElementById('lblTime');
    const addressInput = document.getElementById('custAddress');

    if (type === 'domicilio') {
      if (typeRitiro) typeRitiro.classList.remove('active');
      if (typeDomicilio) typeDomicilio.classList.add('active');
      if (radioDomicilio) radioDomicilio.checked = true;
      if (delivGroup) delivGroup.style.display = 'block';
      if (delivFeeRow) delivFeeRow.style.display = 'flex';
      if (totalLabel) totalLabel.textContent = 'Totale da Pagare alla Consegna:';
      if (lblDate) lblDate.innerHTML = '<i class="fa-regular fa-calendar"></i> Data Consegna <span class="required">*</span>';
      if (lblTime) lblTime.innerHTML = '<i class="fa-regular fa-clock"></i> Orario Consegna Desiderato <span class="required">*</span>';
      if (addressInput) addressInput.required = true;
    } else {
      if (typeDomicilio) typeDomicilio.classList.remove('active');
      if (typeRitiro) typeRitiro.classList.add('active');
      if (radioRitiro) radioRitiro.checked = true;
      if (delivGroup) delivGroup.style.display = 'none';
      if (delivFeeRow) delivFeeRow.style.display = 'none';
      if (totalLabel) totalLabel.textContent = 'Totale da Pagare al Ritiro:';
      if (lblDate) lblDate.innerHTML = '<i class="fa-regular fa-calendar"></i> Data Ritiro <span class="required">*</span>';
      if (lblTime) lblTime.innerHTML = '<i class="fa-regular fa-clock"></i> Orario Ritiro <span class="required">*</span>';
      if (addressInput) addressInput.required = false;
    }

    updateCheckoutModalTotal();
  };

  function updateCheckoutModalTotal() {
    const items = Object.values(cart);
    const subtotal = items.reduce((sum, it) => sum + (it.quantity * it.price), 0);
    const delivFee = (currentOrderType === 'domicilio') ? 2.00 : 0.00;
    const finalTotal = subtotal + delivFee;

    const modalSub = document.getElementById('modalItemsSubtotal');
    const modalFinal = document.getElementById('modalFinalTotal');
    if (modalSub) modalSub.textContent = subtotal.toFixed(2).replace('.', ',') + ' €';
    if (modalFinal) modalFinal.textContent = finalTotal.toFixed(2).replace('.', ',') + ' €';
  }

  window.openCheckout = function() {
    const items = Object.values(cart);
    if (items.length === 0) {
      if (products && products.length > 0) {
        window.appCartAdd(products[0].id);
      } else {
        showToast('Aggiungi almeno un piatto dal menu prima di procedere.');
        return;
      }
    }

    const currentItems = Object.values(cart);
    const totalCount = currentItems.reduce((sum, it) => sum + it.quantity, 0);
    const modalItemsCount = document.getElementById('modalItemsCount');
    if (modalItemsCount) modalItemsCount.textContent = totalCount;

    const modalCartList = document.getElementById('modalCartList');
    if (modalCartList) {
      modalCartList.innerHTML = currentItems.map(item => `
        <div class="checkout-item-line">
          <div class="checkout-item-title">${item.quantity}x ${escapeHtml(item.name)}</div>
          <div class="checkout-item-price">${(item.quantity * item.price).toFixed(2).replace('.', ',')} €</div>
        </div>
      `).join('');
    }

    setupDateTimeFields();
    window.appSetOrderType(currentOrderType || 'ritiro');
    updateCheckoutModalTotal();

    if (checkoutModal) {
      checkoutModal.classList.add('active');
    }
    document.body.style.overflow = 'hidden';
  };

  window.closeCheckout = function() {
    if (checkoutModal) {
      checkoutModal.classList.remove('active');
    }
    document.body.style.overflow = '';
  };

  // ---------------- SUBMIT BOOKING ----------------

  window.handleBookingSubmit = async function(e) {
    if (e && e.preventDefault) e.preventDefault();

    const nameInput = document.getElementById('custName');
    const phoneInput = document.getElementById('custPhone');
    const addressInput = document.getElementById('custAddress');
    const notesInput = document.getElementById('custNotes');

    const name = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const date = pickupDateInput ? pickupDateInput.value : '';
    const time = pickupTimeSelect ? pickupTimeSelect.value : '';
    const address = addressInput ? addressInput.value.trim() : '';
    const notes = notesInput ? notesInput.value.trim() : '';

    if (!name) {
      showToast('⚠️ Inserisci Nome e Cognome per la prenotazione', 'warning');
      if (nameInput) nameInput.focus();
      return;
    }

    if (!phone || phone.length < 6) {
      showToast('⚠️ Inserisci un recapito telefonico cellulare/WhatsApp valido', 'warning');
      if (phoneInput) phoneInput.focus();
      return;
    }

    if (!date) {
      showToast('⚠️ Seleziona la data per il ritiro', 'warning');
      if (pickupDateInput) pickupDateInput.focus();
      return;
    }

    if (!time) {
      showToast('⚠️ Seleziona un orario per la prenotazione', 'warning');
      if (pickupTimeSelect) pickupTimeSelect.focus();
      return;
    }

    if (currentOrderType === 'domicilio' && !address) {
      showToast('⚠️ Inserisci l\'indirizzo per la consegna a domicilio', 'warning');
      if (addressInput) addressInput.focus();
      return;
    }

    const items = Object.values(cart);
    if (items.length === 0) {
      showToast('⚠️ Il carrello è vuoto! Aggiungi un piatto.', 'warning');
      return;
    }

    const submitBtn = document.getElementById('submitBookingBtn');
    if (submitBtn) {
      submitBtn.disabled = true;
      const text = submitBtn.querySelector('.btn-text');
      const loader = submitBtn.querySelector('.btn-loader');
      if (text) text.style.display = 'none';
      if (loader) loader.style.display = 'inline-flex';
    }

    const bookingPayload = {
      customerName: name,
      customerPhone: phone,
      pickupDate: date,
      pickupTime: time,
      orderType: currentOrderType,
      deliveryAddress: (currentOrderType === 'domicilio') ? address : '',
      hasFidelityCard: false,
      notes: notes,
      items: items
    };

    try {
      let bookingResult = null;

      // 1. Try Server API
      try {
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingPayload)
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.booking) {
            bookingResult = data.booking;
          }
        }
      } catch (apiErr) {}

      // 2. Local Fallback if server is offline
      if (!bookingResult) {
        bookingResult = createLocalBooking(bookingPayload);
      }

      lastBooking = bookingResult;

      // Sync local storage bookings
      try {
        const existing = JSON.parse(localStorage.getItem('el_gallero_bookings') || '[]');
        existing.unshift(bookingResult);
        localStorage.setItem('el_gallero_bookings', JSON.stringify(existing.slice(0, 150)));
      } catch (e) {}

      // Close checkout and show receipt with confetti
      window.closeCheckout();
      renderReceipt(bookingResult);
      if (receiptModal) receiptModal.classList.add('active');

      // Trigger Confetti
      try {
        if (typeof confetti === 'function') {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#d4af37', '#f59e0b', '#2ecc71', '#ffffff']
          });
        }
      } catch (e) {}

      // Clear cart
      cart = {};
      updateCartUI();
      await loadInitialData();

    } catch (err) {
      console.error('Order error:', err);
      showToast('Errore durante la prenotazione. Riprova.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        const text = submitBtn.querySelector('.btn-text');
        const loader = submitBtn.querySelector('.btn-loader');
        if (text) text.style.display = 'inline-flex';
        if (loader) loader.style.display = 'none';
      }
    }
  };

  function createLocalBooking(payload) {
    let itemsSub = 0;
    const validated = [];

    payload.items.forEach(it => {
      const prod = products.find(p => p.id === it.id);
      const price = prod ? prod.price : Number(it.price || 0);
      const sub = it.quantity * price;
      itemsSub += sub;
      validated.push({ ...it, price, subtotal: sub });

      if (prod && !prod.unlimited) {
        prod.stock = Math.max(0, (prod.stock || 0) - it.quantity);
        if (prod.stock === 0) prod.available = false;
      }
    });

    const isDelivery = (payload.orderType === 'domicilio');
    const deliveryFee = isDelivery ? 2.00 : 0.00;
    const grandTotal = Number((itemsSub + deliveryFee).toFixed(2));
    const randomCode = 'EG-' + Math.floor(1000 + Math.random() * 9000);

    const newBooking = {
      id: 'bkg_' + Date.now(),
      code: randomCode,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      pickupDate: payload.pickupDate,
      pickupTime: payload.pickupTime,
      orderType: payload.orderType || 'ritiro',
      orderTypeText: isDelivery ? 'Consegna a Domicilio' : 'Ritiro in Sede (Asporto)',
      deliveryAddress: payload.deliveryAddress || '',
      deliveryFee: deliveryFee,
      hasFidelityCard: Boolean(payload.hasFidelityCard),
      fidelityDiscount: 0,
      itemsSubtotal: Number(itemsSub.toFixed(2)),
      notes: payload.notes || '',
      items: validated,
      totalAmount: grandTotal,
      status: 'in_attesa',
      statusText: 'In attesa di conferma',
      createdAt: new Date().toISOString()
    };

    try {
      const storeData = JSON.parse(localStorage.getItem('el_gallero_data') || '{}');
      storeData.products = products;
      storeData.bookings = storeData.bookings || [];
      storeData.bookings.unshift(newBooking);
      localStorage.setItem('el_gallero_data', JSON.stringify(storeData));
    } catch (e) {}

    return newBooking;
  }

  // ---------------- RECEIPT RENDERING ----------------

  function renderReceipt(b) {
    if (!b) return;

    const rcptCode = document.getElementById('rcptCode');
    const rcptCustomer = document.getElementById('rcptCustomer');
    const rcptPhone = document.getElementById('rcptPhone');
    const rcptOrderType = document.getElementById('rcptOrderType');
    const rcptAddressRow = document.getElementById('rcptAddressRow');
    const rcptAddress = document.getElementById('rcptAddress');
    const rcptDateTime = document.getElementById('rcptDateTime');
    const rcptFidelityRow = document.getElementById('rcptFidelityRow');
    const rcptItemsList = document.getElementById('rcptItemsList');
    const rcptSubtotalVal = document.getElementById('rcptSubtotalVal');
    const rcptDeliveryFeeLine = document.getElementById('rcptDeliveryFeeLine');
    const rcptFidelityDiscountLine = document.getElementById('rcptFidelityDiscountLine');
    const rcptFidelityDiscountVal = document.getElementById('rcptFidelityDiscountVal');
    const rcptTotal = document.getElementById('rcptTotal');
    const rcptTimestamp = document.getElementById('rcptTimestamp');

    if (rcptCode) rcptCode.textContent = b.code || 'EG-0000';
    if (rcptCustomer) rcptCustomer.textContent = b.customerName || '-';
    if (rcptPhone) rcptPhone.textContent = b.customerPhone || '-';
    if (rcptOrderType) rcptOrderType.textContent = b.orderTypeText || (b.orderType === 'domicilio' ? 'Consegna a Domicilio' : 'Ritiro in Sede (Asporto)');

    if (rcptAddressRow && rcptAddress) {
      if (b.orderType === 'domicilio' && b.deliveryAddress) {
        rcptAddress.textContent = b.deliveryAddress;
        rcptAddressRow.style.display = 'flex';
      } else {
        rcptAddressRow.style.display = 'none';
      }
    }

    if (rcptDateTime) {
      rcptDateTime.textContent = `${formatDateIt(b.pickupDate)} • Ore ${b.pickupTime}`;
    }

    if (rcptFidelityRow) {
      rcptFidelityRow.style.display = b.hasFidelityCard ? 'flex' : 'none';
    }

    if (rcptItemsList && Array.isArray(b.items)) {
      rcptItemsList.innerHTML = b.items.map(it => `
        <div class="rcpt-item-row">
          <span>${it.quantity}x ${escapeHtml(it.name)}</span>
          <strong>${(Number(it.subtotal || it.quantity * it.price)).toFixed(2).replace('.', ',')} €</strong>
        </div>
      `).join('');
    }

    if (rcptSubtotalVal) {
      rcptSubtotalVal.textContent = (Number(b.itemsSubtotal || b.totalAmount)).toFixed(2).replace('.', ',') + ' €';
    }

    if (rcptDeliveryFeeLine) {
      rcptDeliveryFeeLine.style.display = (b.orderType === 'domicilio') ? 'flex' : 'none';
    }

    if (rcptFidelityDiscountLine && rcptFidelityDiscountVal) {
      if (b.fidelityDiscount && b.fidelityDiscount > 0) {
        rcptFidelityDiscountVal.textContent = `- ${Number(b.fidelityDiscount).toFixed(2).replace('.', ',')} €`;
        rcptFidelityDiscountLine.style.display = 'flex';
      } else {
        rcptFidelityDiscountLine.style.display = 'none';
      }
    }

    if (rcptTotal) {
      rcptTotal.textContent = Number(b.totalAmount).toFixed(2).replace('.', ',') + ' €';
    }

    if (rcptTimestamp) {
      const now = new Date();
      rcptTimestamp.textContent = `Registrato il ${now.toLocaleDateString('it-IT')} alle ${now.toLocaleTimeString('it-IT', { hour:'2-digit', minute:'2-digit' })}`;
    }
  }

  window.shareOnWhatsApp = function() {
    if (!lastBooking) return;
    const b = lastBooking;
    const isDelivery = (b.orderType === 'domicilio');
    const deliveryFee = isDelivery ? (Number(b.deliveryFee) || 2.00) : 0.00;
    const itemsSub = Number(b.itemsSubtotal || (b.items || []).reduce((s, it) => s + (it.quantity * it.price), 0));
    const fidelityDisc = Number(b.fidelityDiscount || 0);
    const totalAmount = Number(b.totalAmount || Math.max(0, itemsSub + deliveryFee - fidelityDisc));
    
    let text = `🔥 *PRENOTAZIONE GIRARROSTO EL GALLERO* 🔥\n`;
    text += `📍 *Casavatore in Via E. A. Mario, 30*\n`;
    text += `📞 *Tel:* 377 5975734\n\n`;
    text += `🎫 *Codice Prenotazione:* *${b.code || 'EG-0000'}*\n`;
    text += `👤 *Cliente:* ${b.customerName}\n`;
    text += `📞 *Telefono:* ${b.customerPhone}\n`;
    text += `⏰ *Data & Orario:* ${formatDateIt(b.pickupDate)} alle ore *${b.pickupTime}*\n`;
    text += `🛵 *Modalità:* ${b.orderTypeText || (isDelivery ? 'Consegna a Domicilio' : 'Ritiro in Sede (Asporto)')}\n`;
    if (isDelivery && b.deliveryAddress) text += `🏠 *Indirizzo Consegna:* ${b.deliveryAddress}\n`;
    if (b.hasFidelityCard) text += `💳 *Carta Fedeltà:* Possessore Registrato\n`;
    
    text += `\n📋 *PIATTI PRENOTATI:*\n`;
    (b.items || []).forEach(it => {
      const sub = (it.quantity * it.price).toFixed(2).replace('.', ',');
      text += `• ${it.quantity}x ${it.name} (${sub} €)\n`;
    });

    text += `\n🧾 *RIEPILOGO CONTO:*\n`;
    text += `▫️ *Subtotale Piatti:* ${itemsSub.toFixed(2).replace('.', ',')} €\n`;
    if (isDelivery) {
      text += `▫️ *Spese Consegna a Domicilio:* +${deliveryFee.toFixed(2).replace('.', ',')} €\n`;
    }
    if (fidelityDisc > 0) {
      text += `▫️ *Sconto Carta Fedeltà El Gallero:* -${fidelityDisc.toFixed(2).replace('.', ',')} €\n`;
    }
    text += `───────────────────────\n`;
    text += `💰 *TOTALE DA PAGARE:* *${totalAmount.toFixed(2).replace('.', ',')} €*\n`;

    if (b.notes) text += `\n📝 *Note per il girarrosto:* ${b.notes}\n`;
    text += `\nGrazie da El Gallero! Il tuo ordine è confermato. 🍗🔥`;

    const phoneStore = '393775975734';
    const url = `https://wa.me/${phoneStore}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  window.printReceipt = function() {
    window.print();
  };

  window.appNewOrder = function() {
    if (receiptModal) receiptModal.classList.remove('active');
    cart = {};
    updateCartUI();
    const form = document.getElementById('bookingForm');
    if (form) form.reset();
    window.appSetOrderType('ritiro');
    setupDateTimeFields();
    showToast('Pronto per una nuova prenotazione!');
  };

  // ---------------- ADMIN PIN & INTEGRATED SWITCH ----------------

  window.openAdminPinModal = function() {
    if (adminPinModal) {
      adminPinModal.classList.add('active');
      const pinInput = document.getElementById('unifiedPinInput');
      if (pinInput) {
        pinInput.value = '';
        pinInput.focus();
      }
      const pinErr = document.getElementById('unifiedPinError');
      if (pinErr) pinErr.style.display = 'none';
    }
  };

  window.closeAdminPinModal = function() {
    if (adminPinModal) {
      adminPinModal.classList.remove('active');
    }
  };

  window.handleUnifiedAdminPin = async function(e) {
    if (e && e.preventDefault) e.preventDefault();

    const pinInput = document.getElementById('unifiedPinInput');
    const pinErr = document.getElementById('unifiedPinError');
    const pinVal = pinInput ? pinInput.value.trim() : '';

    const validPin = storeSettings.adminPin || '230888';

    if (pinVal === String(validPin)) {
      sessionStorage.setItem('el_gallero_admin_pin', pinVal);
      window.closeAdminPinModal();
      window.switchToAdminView();
      return;
    }

    // Try server verification
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinVal })
      });
      if (res.ok) {
        sessionStorage.setItem('el_gallero_admin_pin', pinVal);
        window.closeAdminPinModal();
        window.switchToAdminView();
        return;
      }
    } catch (err) {}

    if (pinErr) pinErr.style.display = 'block';
    if (pinInput) {
      pinInput.value = '';
      pinInput.focus();
    }
  };

  window.switchToAdminView = function() {
    if (customerAppView) customerAppView.style.display = 'none';
    if (adminAppView) {
      adminAppView.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (typeof window.adminReloadData === 'function') {
      window.adminReloadData();
    }
  };

  window.switchToCustomerView = function() {
    if (adminAppView) adminAppView.style.display = 'none';
    if (customerAppView) {
      customerAppView.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    loadInitialData();
  };

  // ---------------- UTILS ----------------

  function formatDateIt(dateStr) {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } catch (e) {}
    return dateStr;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `app-toast toast-${type}`;
    toast.innerHTML = `<i class="fa-solid fa-bell text-gold"></i> <span>${escapeHtml(msg)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  window.showToast = showToast;
});