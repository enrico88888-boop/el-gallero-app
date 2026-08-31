/**
 * EL GALLERO - Admin Management Dashboard JS
 */

document.addEventListener('DOMContentLoaded', () => {
  // Default Seed Data for Offline / Static Netlify hosting
  const DEFAULT_ADMIN_MENU = {
    settings: {
      storeName: "EL GALLERO",
      subtitle: "100% cotto a legna",
      phone: "3775975734",
      address: "Casavatore via e.a.Mario 30",
      currency: "€",
      timeSlots: [
        "11:45", "12:00", "12:15", "12:30", "12:45", "13:00", "13:15", "13:30", "13:45", "14:00",
        "18:30", "18:45", "19:00", "19:15", "19:30", "19:45", "20:00", "20:15", "20:30", "20:45", "21:00", "21:30"
      ]
    },
    categories: [
      { id: "pollo", name: "Pollo", icon: "🍗", description: "Cotto a legna allo spiedo, morbido e succulento" },
      { id: "fritto", name: "Fritto", icon: "🍟", description: "Fritture croccanti e dorate al momento" },
      { id: "sfizi", name: "Sfizi", icon: "🍢", description: "Spiedini, salsicce e sfiziosità alla brace" },
      { id: "bibite", name: "Bibite", icon: "🥤", description: "Bevande fresche e birre selezionate" }
    ],
    products: [
      { id: "p1", category: "pollo", name: "Pollo intero", price: 8.00, stock: 15, unlimited: false, description: "Pollo intero girarrosto cotto a legna", available: true },
      { id: "p2", category: "pollo", name: "Mezzo pollo", price: 5.00, stock: 10, unlimited: false, description: "Mezzo pollo girarrosto dorato", available: true },
      { id: "p3", category: "pollo", name: "Pollo e patate", price: 10.00, stock: 12, unlimited: false, description: "Pollo intero girarrosto con contorno di patate al forno", available: true },
      { id: "p4", category: "pollo", name: "Mezzo pollo con patate", price: 8.00, stock: 8, unlimited: false, description: "Mezzo pollo girarrosto con contorno di patate al forno", available: true },
      { id: "p5", category: "pollo", name: "Patata grande", price: 5.00, stock: 15, unlimited: false, description: "Porzione abbondante di patate al forno speziate", available: true },
      { id: "p6", category: "pollo", name: "Patata piccola", price: 3.00, stock: 20, unlimited: false, description: "Porzione classica di patate al forno speziate", available: true },
      { id: "f1", category: "fritto", name: "Croccantella", price: 3.00, stock: 10, unlimited: false, description: "Croccante e sfiziosa", available: true },
      { id: "f2", category: "fritto", name: "Pollo fritto (3 pezzi)", price: 2.00, stock: 12, unlimited: false, description: "3 bocconcini di pollo croccante panato dorato", available: true },
      { id: "s1", category: "sfizi", name: "Salsiccia", price: 2.00, stock: 20, unlimited: false, description: "Salsiccia saporita alla brace", available: true },
      { id: "s2", category: "sfizi", name: "Spiedino", price: 2.50, stock: 15, unlimited: false, description: "Spiedino misto cotto a legna", available: true },
      { id: "s3", category: "sfizi", name: "Ali di pollo (al pezzo)", price: 1.00, stock: 25, unlimited: false, description: "Aletta di pollo speziata e arrostita a legna (prezzo al pezzo)", available: true },
      { id: "s4", category: "sfizi", name: "Fuselli (al pezzo)", price: 2.00, stock: 18, unlimited: false, description: "Fusello di pollo arrosto dorato (prezzo al pezzo)", available: true },
      { id: "b1", category: "bibite", name: "Pepsi Cola", price: 2.50, stock: 30, unlimited: true, description: "Lattina / Bottiglietta fresca 33cl", available: true },
      { id: "b2", category: "bibite", name: "Birra piccola", price: 1.50, stock: 24, unlimited: true, description: "Birra fresca 33cl", available: true },
      { id: "b3", category: "bibite", name: "Birra grande", price: 2.50, stock: 24, unlimited: true, description: "Birra fresca 66cl", available: true }
    ]
  };

  // State
  let adminPin = sessionStorage.getItem('el_gallero_admin_pin') || '';
  let allBookings = [];
  let allProducts = DEFAULT_ADMIN_MENU.products;
  let allCategories = DEFAULT_ADMIN_MENU.categories;
  let allCustomers = [];
  let storeSettings = DEFAULT_ADMIN_MENU.settings;
  
  let dateFilter = 'all';
  let statusFilter = 'all';
  let searchQuery = '';
  let custFilter = 'all';
  let custSearchQuery = '';
  let autoRefreshInterval = null;

  // DOM Elements - PIN Screen
  const pinScreen = document.getElementById('pinScreen');
  const pinForm = document.getElementById('pinForm');
  const pinInput = document.getElementById('pinInput');
  const pinError = document.getElementById('pinError');
  const adminApp = document.getElementById('adminApp');

  // DOM Elements - Navbar & Tabs
  const adminRefreshBtn = document.getElementById('adminRefreshBtn');
  const adminLogoutBtn = document.getElementById('adminLogoutBtn');
  const adminTabs = document.querySelectorAll('.adm-tab');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const pendingOrdersBadge = document.getElementById('pendingOrdersBadge');
  const totalClientsBadge = document.getElementById('totalClientsBadge');
  const btnOpenCustomersQuick = document.getElementById('btnOpenCustomersQuick');

  // DOM Elements - Stats
  const statTodayCount = document.getElementById('statTodayCount');
  const statPendingCount = document.getElementById('statPendingCount');
  const statConfirmedCount = document.getElementById('statConfirmedCount');
  const statTodayRevenue = document.getElementById('statTodayRevenue');

  // DOM Elements - Customers Tab
  const statCustTotal = document.getElementById('statCustTotal');
  const statCustToday = document.getElementById('statCustToday');
  const statCustVip = document.getElementById('statCustVip');
  const statCustRevenue = document.getElementById('statCustRevenue');
  const custTableBody = document.getElementById('custTableBody');
  const custCountBadge = document.getElementById('custCountBadge');
  const custSearchInput = document.getElementById('custSearchInput');
  const custFilterGroup = document.getElementById('custFilterGroup');
  const btnExportExcel = document.getElementById('btnExportExcel');
  const btnExportPdf = document.getElementById('btnExportPdf');

  // DOM Elements - Filters
  const dateFilterGroup = document.getElementById('dateFilterGroup');
  const customDateFilter = document.getElementById('customDateFilter');
  const statusFilterSelect = document.getElementById('statusFilterSelect');
  const bookingSearchInput = document.getElementById('bookingSearchInput');
  const bookingsGrid = document.getElementById('bookingsGrid');
  const bookingsCountBadge = document.getElementById('bookingsCountBadge');
  const bookingsListTitle = document.getElementById('bookingsListTitle');

  // DOM Elements - Menu Tab
  const menuEditorGrid = document.getElementById('menuEditorGrid');
  const openAddProductModalBtn = document.getElementById('openAddProductModalBtn');
  const productModal = document.getElementById('productModal');
  const closeProductModal = document.getElementById('closeProductModal');
  const cancelProductModalBtn = document.getElementById('cancelProductModalBtn');
  const productForm = document.getElementById('productForm');
  const productModalTitle = document.getElementById('productModalTitle');

  // DOM Elements - Settings Tab
  const storeSettingsForm = document.getElementById('storeSettingsForm');

  // DOM Elements - Edit Booking Modal
  const editBookingModal = document.getElementById('editBookingModal');
  const closeEditModal = document.getElementById('closeEditModal');
  const cancelEditModalBtn = document.getElementById('cancelEditModalBtn');
  const editBookingForm = document.getElementById('editBookingForm');
  const editBookingCode = document.getElementById('editBookingCode');
  const editFidelityDiscountCheck = document.getElementById('editFidelityDiscountCheck');
  const fidelityDiscountAmountContainer = document.getElementById('fidelityDiscountAmountContainer');
  const editFidelityDiscountAmount = document.getElementById('editFidelityDiscountAmount');
  const editPreviewTotalAmount = document.getElementById('editPreviewTotalAmount');

  // DOM Elements - Unified Mode
  const adminPinModal = document.getElementById('adminPinModal');
  const btnOpenAdminAuth = document.getElementById('btnOpenAdminAuth');
  const closeAdminPinModal = document.getElementById('closeAdminPinModal');
  const adminPinForm = document.getElementById('adminPinForm');
  const unifiedAdminPinInput = document.getElementById('unifiedAdminPinInput');
  const unifiedAdminPinError = document.getElementById('unifiedAdminPinError');
  const customerAppView = document.getElementById('customerAppView');
  const adminAppView = document.getElementById('adminAppView');
  const btnBackToCustomerView = document.getElementById('btnBackToCustomerView');
  const topNavBar = document.getElementById('topNavBar');

  // Initialize depending on page context
  if (pinScreen) {
    // Standalone admin.html page
    checkAuthAndInit();
  } else if (adminAppView) {
    // Unified index.html page
    setupUnifiedModeAuth();
  }

  function openAdminPinModal() {
    const modal = document.getElementById('adminPinModal');
    const input = document.getElementById('unifiedPinInput') || document.getElementById('unifiedAdminPinInput');
    const err = document.getElementById('unifiedPinError') || document.getElementById('unifiedAdminPinError');
    if (modal) modal.classList.add('active');
    if (err) {
      err.classList.remove('active');
      err.style.display = 'none';
    }
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 150);
    }
  }

  function closePinModal() {
    const modal = document.getElementById('adminPinModal');
    const input = document.getElementById('unifiedPinInput') || document.getElementById('unifiedAdminPinInput');
    const err = document.getElementById('unifiedPinError') || document.getElementById('unifiedAdminPinError');
    if (modal) modal.classList.remove('active');
    if (err) {
      err.classList.remove('active');
      err.style.display = 'none';
    }
    if (input) input.value = '';
  }

  function switchToAdminView() {
    const custView = document.getElementById('customerAppView');
    const admView = document.getElementById('adminAppView');
    const btnSwitch = document.getElementById('btnBackToCustomerView');
    const btnOpenAuth = document.getElementById('btnOpenAdminAuth');

    if (custView) custView.style.display = 'none';
    if (admView) admView.style.display = 'block';
    if (btnSwitch) btnSwitch.style.display = 'inline-flex';
    if (btnOpenAuth) btnOpenAuth.style.display = 'none';

    setupAdminEventListeners();
    loadAllData();

    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    autoRefreshInterval = setInterval(loadBookingsAndStats, 3000);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function switchToCustomerView() {
    const custView = document.getElementById('customerAppView');
    const admView = document.getElementById('adminAppView');
    const btnSwitch = document.getElementById('btnBackToCustomerView');
    const btnOpenAuth = document.getElementById('btnOpenAdminAuth');

    if (admView) admView.style.display = 'none';
    if (custView) custView.style.display = 'block';
    if (btnSwitch) btnSwitch.style.display = 'none';
    if (btnOpenAuth) btnOpenAuth.style.display = 'inline-flex';

    if (autoRefreshInterval) clearInterval(autoRefreshInterval);

    if (window.syncMenuLiveData) window.syncMenuLiveData();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  window.openAdminPinModal = openAdminPinModal;
  window.closeAdminPinModal = closePinModal;
  window.switchToCustomerView = switchToCustomerView;
  window.switchToAdminView = switchToAdminView;

  window.handleUnifiedAdminPin = async function(e) {
    if (e) e.preventDefault();
    const pinInputEl = document.getElementById('unifiedPinInput') || document.getElementById('unifiedAdminPinInput');
    const pinErrorEl = document.getElementById('unifiedPinError') || document.getElementById('unifiedAdminPinError');
    const entered = pinInputEl ? pinInputEl.value.trim() : '';
    if (!entered) return;

    const success = await verifyPin(entered);
    if (success) {
      adminPin = entered;
      sessionStorage.setItem('el_gallero_admin_pin', adminPin);
      closePinModal();
      switchToAdminView();
    } else {
      if (pinErrorEl) {
        pinErrorEl.textContent = 'PIN non corretto. Riprova.';
        pinErrorEl.classList.add('active');
        pinErrorEl.style.display = 'block';
      }
    }
  };

  window.appSwitchAdminTab = function(tabId) {
    document.querySelectorAll('.adm-tab').forEach(b => {
      if (b.dataset.tab === tabId || b.id === tabId) b.classList.add('active');
      else b.classList.remove('active');
    });
    document.querySelectorAll('.admin-tab-content').forEach(p => {
      if (p.id === tabId) {
        p.classList.add('active');
        p.style.display = 'block';
      } else {
        p.classList.remove('active');
        p.style.display = 'none';
      }
    });
    if (tabId === 'menuTab') renderMenuCatalog();
    if (tabId === 'customersTab') renderCustomersTable();
    if (tabId === 'settingsTab') populateSettingsForm();
    if (tabId === 'bookingsTab') renderBookings();
  };

  window.appRefreshAdminData = function() {
    loadAllData();
    showAdminToast('Dati aggiornati!');
  };

  window.appAdminLogout = function() {
    sessionStorage.removeItem('el_gallero_admin_pin');
    adminPin = '';
    switchToCustomerView();
  };

  async function verifyPin(pinToTest) {
    const validPins = ['230888'];
    const storedCustomPin = localStorage.getItem('el_gallero_admin_pin');
    if (storedCustomPin) validPins.push(storedCustomPin);

    let serverAuthSuccess = false;
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinToTest })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) serverAuthSuccess = true;
      }
    } catch (err) {}

    return serverAuthSuccess || validPins.includes(pinToTest);
  }

  function checkAuthAndInit() {
    if (adminPin) {
      verifyPinAndLaunch(adminPin);
    } else {
      showPinScreen();
    }
  }

  function showPinScreen() {
    if (pinScreen) pinScreen.style.display = 'flex';
    if (adminApp) adminApp.style.display = 'none';
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
  }

  async function verifyPinAndLaunch(pinToTest) {
    const valid = await verifyPin(pinToTest);

    if (valid) {
      adminPin = pinToTest;
      sessionStorage.setItem('el_gallero_admin_pin', adminPin);
      if (pinScreen) pinScreen.style.display = 'none';
      if (adminApp) adminApp.style.display = 'block';
      if (pinError) pinError.classList.remove('active');
      
      setupAdminEventListeners();
      loadAllData();
      
      if (autoRefreshInterval) clearInterval(autoRefreshInterval);
      autoRefreshInterval = setInterval(loadBookingsAndStats, 3000);
    } else {
      if (pinError) {
        pinError.textContent = 'PIN non valido. Riprova.';
        pinError.classList.add('active');
      }
      sessionStorage.removeItem('el_gallero_admin_pin');
    }
  }

  if (pinForm) {
    pinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const entered = pinInput.value.trim();
      if (entered) {
        verifyPinAndLaunch(entered);
      }
    });
  }

  // Setup Event Listeners
  function setupAdminEventListeners() {
    // Logout
    adminLogoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('el_gallero_admin_pin');
      adminPin = '';
      showPinScreen();
    });

    // Refresh
    adminRefreshBtn.addEventListener('click', () => {
      loadAllData();
      showAdminToast('Dati aggiornati');
    });

    // Tab Navigation
    adminTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        adminTabs.forEach(t => t.classList.remove('active'));
        tabPanels.forEach(p => p.style.display = 'none');

        tab.classList.add('active');
        const target = tab.dataset.tab;
        const targetEl = document.getElementById(target);
        if (targetEl) targetEl.style.display = 'block';

        if (target === 'customersTab') renderCustomersTable();
        if (target === 'menuTab') renderMenuCatalog();
        if (target === 'settingsTab') populateSettingsForm();
      });
    });

    // Quick open Customers button in top nav
    if (btnOpenCustomersQuick) {
      btnOpenCustomersQuick.addEventListener('click', () => {
        adminTabs.forEach(t => t.classList.remove('active'));
        tabPanels.forEach(p => p.style.display = 'none');
        const custTabBtn = document.getElementById('tabBtnCustomers');
        if (custTabBtn) custTabBtn.classList.add('active');
        const custPanel = document.getElementById('customersTab');
        if (custPanel) custPanel.style.display = 'block';
        renderCustomersTable();
      });
    }

    // Customer Filters
    if (custFilterGroup) {
      custFilterGroup.querySelectorAll('.btn-filter-cust').forEach(btn => {
        btn.addEventListener('click', () => {
          custFilterGroup.querySelectorAll('.btn-filter-cust').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          custFilter = btn.dataset.custFilter;
          renderCustomersTable();
        });
      });
    }

    if (custSearchInput) {
      custSearchInput.addEventListener('input', (e) => {
        custSearchQuery = e.target.value.trim().toLowerCase();
        renderCustomersTable();
      });
    }

    // Export Excel, PDF & Clear Rubrica Buttons
    if (btnExportExcel) btnExportExcel.addEventListener('click', exportCustomersToExcel);
    if (btnExportPdf) btnExportPdf.addEventListener('click', exportCustomersToPdf);
    const btnClearRubrica = document.getElementById('btnClearRubrica');
    if (btnClearRubrica) btnClearRubrica.addEventListener('click', handleClearRubrica);

    // Date Filters
    dateFilterGroup.querySelectorAll('.btn-filter-date').forEach(btn => {
      btn.addEventListener('click', () => {
        dateFilterGroup.querySelectorAll('.btn-filter-date').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        customDateFilter.value = '';
        dateFilter = btn.dataset.date;
        renderBookings();
      });
    });

    customDateFilter.addEventListener('change', (e) => {
      if (e.target.value) {
        dateFilterGroup.querySelectorAll('.btn-filter-date').forEach(b => b.classList.remove('active'));
        dateFilter = e.target.value;
        renderBookings();
      }
    });

    // Status Filter
    statusFilterSelect.addEventListener('change', (e) => {
      statusFilter = e.target.value;
      renderBookings();
    });

    // Search Filter
    bookingSearchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      renderBookings();
    });

    // Modal Close Triggers
    closeEditModal.addEventListener('click', () => editBookingModal.classList.remove('active'));
    cancelEditModalBtn.addEventListener('click', () => editBookingModal.classList.remove('active'));
    editBookingForm.addEventListener('submit', handleSaveBookingEdit);

    // Fidelity discount change listeners inside edit modal
    if (editFidelityDiscountCheck) {
      editFidelityDiscountCheck.addEventListener('change', () => {
        if (fidelityDiscountAmountContainer) {
          fidelityDiscountAmountContainer.style.display = editFidelityDiscountCheck.checked ? 'flex' : 'none';
        }
        recalculateEditModalPreview();
      });
    }

    if (editFidelityDiscountAmount) {
      editFidelityDiscountAmount.addEventListener('input', recalculateEditModalPreview);
    }

    openAddProductModalBtn.addEventListener('click', openAddProductModal);
    closeProductModal.addEventListener('click', () => productModal.classList.remove('active'));
    cancelProductModalBtn.addEventListener('click', () => productModal.classList.remove('active'));
    productForm.addEventListener('submit', handleSaveProduct);

    storeSettingsForm.addEventListener('submit', handleSaveSettings);
  }

  // Load All Admin Data
  async function loadAllData() {
    await Promise.all([
      loadBookingsAndStats(),
      loadCustomers(),
      loadMenuAndCategories(),
      loadStoreSettings()
    ]);
  }

  let lastKnownOrderCount = -1;

  function playOrderChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.4);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0.35, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.8);
    } catch (e) {
      console.log('Audio not allowed yet or error:', e);
    }
  }

  // Load All Admin Data
  async function loadAllData() {
    await Promise.all([
      loadBookingsAndStats(),
      loadCustomers(),
      loadMenuAndCategories(),
      loadStoreSettings()
    ]);
    renderBookings();
    renderMenuCatalog();
    renderCustomersTable();
  }

  // Load Bookings & Stats
  async function loadBookingsAndStats() {
    let serverOk = false;
    try {
      const [bRes, sRes] = await Promise.all([
        fetch('/api/admin/bookings', { headers: { 'x-admin-pin': adminPin } }),
        fetch('/api/admin/stats', { headers: { 'x-admin-pin': adminPin } })
      ]);

      if (bRes.ok && sRes.ok) {
        const bData = await bRes.json();
        const sData = await sRes.json();
        if (bData.success) {
          serverOk = true;
          const newBookings = bData.bookings || [];
          if (lastKnownOrderCount !== -1 && newBookings.length > lastKnownOrderCount) {
            playOrderChime();
            const latest = newBookings[0];
            showAdminToast(`🔔 NUOVO ORDINE: ${latest.customerName} (${latest.code}) - ${latest.totalAmount} €`);
          }
          lastKnownOrderCount = newBookings.length;
          allBookings = newBookings;
          renderBookings();
          loadCustomers();
        }
        if (sData.success && sData.stats) {
          updateStatsUI(sData.stats);
        }
      }
    } catch (err) {}

    if (!serverOk) {
      let localBookings = [];
      try {
        const raw = localStorage.getItem('el_gallero_bookings');
        if (raw) localBookings = JSON.parse(raw);
        else {
          const store = JSON.parse(localStorage.getItem('el_gallero_data') || '{}');
          if (Array.isArray(store.bookings)) localBookings = store.bookings;
        }
      } catch (e) {}

      allBookings = localBookings;
      renderBookings();
      loadCustomers();

      const todayStr = getLocalDateString();
      const todayOrders = allBookings.filter(b => b.pickupDate === todayStr);
      const pendingOrders = allBookings.filter(b => b.status === 'in_attesa');
      const confirmedOrders = allBookings.filter(b => b.status === 'confermato' || b.status === 'completato');
      const todayRevenue = todayOrders.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

      updateStatsUI({
        todayBookingsCount: todayOrders.length,
        pendingCount: pendingOrders.length,
        confirmedCount: confirmedOrders.length,
        todayRevenue: todayRevenue
      });
    }
  }

  // Load Menu
  async function loadMenuAndCategories() {
    let serverOk = false;
    try {
      const res = await fetch('/api/menu', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.products) && data.products.length) {
          serverOk = true;
          allCategories = data.categories || DEFAULT_ADMIN_MENU.categories;
          allProducts = data.products || DEFAULT_ADMIN_MENU.products;
          persistAndBroadcastMenu(allProducts, allCategories);
          renderMenuCatalog();
          return;
        }
      }
    } catch (err) {}

    if (!serverOk) {
      try {
        const localStore = localStorage.getItem('el_gallero_data');
        if (localStore) {
          const parsed = JSON.parse(localStore);
          allCategories = Array.isArray(parsed.categories) && parsed.categories.length ? parsed.categories : DEFAULT_ADMIN_MENU.categories;
          allProducts = Array.isArray(parsed.products) && parsed.products.length ? parsed.products : DEFAULT_ADMIN_MENU.products;
        } else {
          allCategories = DEFAULT_ADMIN_MENU.categories;
          allProducts = DEFAULT_ADMIN_MENU.products;
        }
      } catch (e) {
        allCategories = DEFAULT_ADMIN_MENU.categories;
        allProducts = DEFAULT_ADMIN_MENU.products;
      }
      persistAndBroadcastMenu(allProducts, allCategories);
      renderMenuCatalog();
    }
  }

  // Load Settings
  async function loadStoreSettings() {
    let serverOk = false;
    try {
      const res = await fetch('/api/info');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings) {
          serverOk = true;
          storeSettings = data.settings;
          populateSettingsForm();
          return;
        }
      }
    } catch (err) {}

    if (!serverOk) {
      try {
        const localStore = localStorage.getItem('el_gallero_data');
        if (localStore) {
          const parsed = JSON.parse(localStore);
          storeSettings = parsed.settings || DEFAULT_ADMIN_MENU.settings;
        } else {
          storeSettings = DEFAULT_ADMIN_MENU.settings;
        }
      } catch (e) {
        storeSettings = DEFAULT_ADMIN_MENU.settings;
      }
      populateSettingsForm();
    }
  }

  // Update Stats UI
  function updateStatsUI(stats) {
    if (statTodayCount) statTodayCount.textContent = stats.todayBookingsCount || 0;
    if (statPendingCount) statPendingCount.textContent = stats.pendingCount || 0;
    if (statConfirmedCount) statConfirmedCount.textContent = stats.confirmedCount || 0;
    if (statTodayRevenue) statTodayRevenue.textContent = (stats.todayRevenue || 0).toFixed(2).replace('.', ',') + ' €';

    if (pendingOrdersBadge) {
      if (stats.pendingCount > 0) {
        pendingOrdersBadge.textContent = stats.pendingCount;
        pendingOrdersBadge.style.display = 'inline-block';
      } else {
        pendingOrdersBadge.style.display = 'none';
      }
    }
  }

  // Render Bookings List
  function renderBookings() {
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    let filtered = allBookings.filter(b => {
      // Date filter
      if (dateFilter === 'today' && b.pickupDate !== todayStr) return false;
      if (dateFilter === 'tomorrow' && b.pickupDate !== tomorrowStr) return false;
      if (dateFilter !== 'all' && dateFilter !== 'today' && dateFilter !== 'tomorrow' && b.pickupDate !== dateFilter) return false;

      // Status filter
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;

      // Search query
      if (searchQuery) {
        const matchesCode = b.code && b.code.toLowerCase().includes(searchQuery);
        const matchesName = b.customerName && b.customerName.toLowerCase().includes(searchQuery);
        const matchesPhone = b.customerPhone && b.customerPhone.toLowerCase().includes(searchQuery);
        if (!matchesCode && !matchesName && !matchesPhone) return false;
      }

      return true;
    });

    bookingsCountBadge.textContent = `${filtered.length} ${filtered.length === 1 ? 'prenotazione' : 'prenotazioni'}`;

    if (dateFilter === 'today') bookingsListTitle.textContent = 'Prenotazioni di Oggi';
    else if (dateFilter === 'tomorrow') bookingsListTitle.textContent = 'Prenotazioni di Domani';
    else if (dateFilter === 'all') bookingsListTitle.textContent = 'Tutte le Prenotazioni';
    else bookingsListTitle.textContent = `Prenotazioni del ${dateFilter}`;

    if (filtered.length === 0) {
      bookingsGrid.innerHTML = `
        <div class="empty-cart-msg" style="grid-column: 1 / -1; padding: 40px 20px;">
          <i class="fa-solid fa-clipboard-list" style="font-size:3rem; color:var(--bg-surface-light);"></i>
          <p style="font-size:1.1rem; margin-top:8px;">Nessuna prenotazione trovata</p>
          <small>Non ci sono ordini per i filtri selezionati.</small>
        </div>
      `;
      return;
    }

    bookingsGrid.innerHTML = filtered.map(b => {
      const itemsCount = (b.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0);
      const formattedTotal = Number(b.totalAmount || 0).toFixed(2).replace('.', ',') + ' €';
      const isDelivery = (b.orderType === 'domicilio');

      return `
        <div class="order-card status-${b.status}" data-id="${b.id}">
          <div>
            <div class="order-card-header">
              <span class="order-code-badge">${b.code}</span>
              <div style="display:flex; gap:6px; align-items:center;">
                <span class="order-type-badge ${isDelivery ? 'badge-delivery' : 'badge-pickup'}">
                  ${isDelivery ? '🛵 Domicilio (+2€)' : '🏪 Asporto'}
                </span>
                <span class="order-status-badge status-badge-${b.status}">${b.statusText || b.status}</span>
              </div>
            </div>

            <div class="order-client-info">
              <div class="order-client-name">
                <i class="fa-solid fa-user text-gold"></i> ${escapeHtml(b.customerName)}
              </div>
              <div class="order-client-phone">
                <i class="fa-solid fa-phone"></i> ${escapeHtml(b.customerPhone)}
              </div>
            </div>

            ${isDelivery && b.deliveryAddress ? `
              <div class="order-address-box">
                <i class="fa-solid fa-location-dot text-gold"></i>
                <div>
                  <span style="font-size:0.75rem; color:var(--text-muted); display:block;">INDIRIZZO DI CONSEGNA:</span>
                  <strong>${escapeHtml(b.deliveryAddress)}</strong>
                </div>
              </div>
            ` : ''}

            <div class="order-time-box">
              <div>
                <span class="time-label">Data:</span>
                <strong style="display:block; font-size:0.9rem;">${formatDateIt(b.pickupDate)}</strong>
              </div>
              <div style="text-align:right;">
                <span class="time-label">${isDelivery ? 'Ora Consegna:' : 'Ora Ritiro:'}</span>
                <span class="time-val">Ore ${b.pickupTime}</span>
              </div>
            </div>

            ${b.allergens ? `
              <div class="order-allergens-alert">
                <i class="fa-solid fa-triangle-exclamation"></i> <strong>Allergeni:</strong> ${escapeHtml(b.allergens)}
              </div>
            ` : ''}

            ${b.notes ? `
              <div class="order-notes-alert">
                <i class="fa-solid fa-comment-dots text-gold"></i> <strong>Note:</strong> ${escapeHtml(b.notes)}
              </div>
            ` : ''}

            <div class="order-items-box">
              ${(b.items || []).map(it => `
                <div class="order-item-line">
                  <span><strong>${it.quantity}x</strong> ${escapeHtml(it.name)}</span>
                  <span>${((it.quantity || 1) * (it.price || 0)).toFixed(2).replace('.', ',')} €</span>
                </div>
              `).join('')}
              ${isDelivery ? `
                <div class="order-item-line" style="color:var(--gold-light); font-weight:600; border-top:1px dashed var(--border-color); padding-top:4px; margin-top:4px;">
                  <span>🛵 Supplemento Consegna</span>
                  <span>+2,00 €</span>
                </div>
              ` : ''}
              ${Number(b.fidelityDiscount || 0) > 0 ? `
                <div class="order-item-line" style="color:#2ecc71; font-weight:700; border-top:1px dashed var(--border-color); padding-top:4px; margin-top:4px;">
                  <span><i class="fa-solid fa-id-card"></i> Sconto carta fedeltà EL Gallero</span>
                  <span>-${Number(b.fidelityDiscount).toFixed(2).replace('.', ',')} €</span>
                </div>
              ` : ''}
            </div>

            <div class="order-total-bar">
              <span>Totale (${itemsCount} pz${isDelivery ? ' + consegna' : ''}${Number(b.fidelityDiscount || 0) > 0 ? ' - sconto' : ''}):</span>
              <span class="order-total-amount">${formattedTotal}</span>
            </div>
          </div>

          <div class="order-actions">
            ${b.status !== 'confermato' && b.status !== 'completato' ? `
              <button class="btn-adm-action btn-adm-confirm" onclick="window.adminChangeStatus('${b.id}', 'confermato')">
                <i class="fa-solid fa-check"></i> Conferma
              </button>
            ` : ''}

            ${b.status === 'confermato' ? `
              <button class="btn-adm-action btn-adm-complete" onclick="window.adminChangeStatus('${b.id}', 'completato')">
                <i class="fa-solid fa-box-check"></i> ${isDelivery ? 'Consegnato' : 'Ritirato'}
              </button>
            ` : ''}

            <button class="btn-adm-action btn-adm-wa" onclick="window.adminSendWhatsApp('${b.id}')">
              <i class="fa-brands fa-whatsapp"></i> WhatsApp
            </button>

            <button class="btn-adm-action btn-adm-edit" onclick="window.adminOpenEdit('${b.id}')">
              <i class="fa-solid fa-pen"></i> Modifica
            </button>

            <button class="btn-adm-action btn-adm-delete" onclick="window.adminDeleteBooking('${b.id}')">
              <i class="fa-solid fa-trash"></i> Rimuovi
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // ---------------- ORDER ACTIONS ----------------

  window.adminChangeStatus = async function(id, newStatus) {
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify({
          status: newStatus,
          statusText: newStatus === 'confermato' ? 'Confermato' : (newStatus === 'completato' ? 'Completato' : newStatus)
        })
      });
      const data = await res.json();
      if (data.success) {
        showAdminToast(`Stato ordine aggiornato a "${newStatus}"`);
        loadBookingsAndStats();
      } else {
        alert(data.message || 'Errore durante l\'aggiornamento.');
      }
    } catch (err) {
      console.error('Status error:', err);
    }
  };

  window.adminSendWhatsApp = function(id) {
    const b = allBookings.find(item => item.id === id);
    if (!b) return;

    let phoneClean = (b.customerPhone || '').replace(/\D/g, '');
    if (phoneClean.length === 10 && !phoneClean.startsWith('39')) {
      phoneClean = '39' + phoneClean; // add Italy country code
    }

    const isDelivery = (b.orderType === 'domicilio');
    let text = `Ciao ${b.customerName}, ti confermiamo la tua prenotazione da *EL GALLERO* (Codice: ${b.code}) per il giorno *${formatDateIt(b.pickupDate)}* alle ore *${b.pickupTime}*.\n\n`;
    if (isDelivery) {
      text += `Modalità: *🛵 Consegna a Domicilio (+2€)*\nIndirizzo: *${b.deliveryAddress}*\n`;
    } else {
      text += `Modalità: *🏪 Ritiro in Sede (Casavatore via e.a.Mario 30)*\n`;
    }

    if (Number(b.fidelityDiscount || 0) > 0) {
      text += `• 💳 Sconto carta fedeltà EL Gallero: -${Number(b.fidelityDiscount).toFixed(2)} €\n`;
    }

    text += `Totale: *${Number(b.totalAmount).toFixed(2)} €* (da saldare alla consegna/ritiro).\nTi ringraziamo! 🔥🍗`;

    const waUrl = phoneClean ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  window.adminDeleteBooking = async function(id) {
    const b = allBookings.find(item => item.id === id);
    if (!b) return;

    if (!confirm(`Sei sicuro di voler eliminare definitivamente la prenotazione ${b.code} di ${b.customerName}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': adminPin }
      });
      const data = await res.json();
      if (data.success) {
        showAdminToast('Prenotazione rimossa');
        loadBookingsAndStats();
        loadCustomers();
      } else {
        alert(data.message || 'Errore durante l\'eliminazione.');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  window.adminOpenEdit = function(id) {
    const b = allBookings.find(item => item.id === id);
    if (!b) return;

    document.getElementById('editBookingId').value = b.id;
    editBookingCode.textContent = `(${b.code})`;
    document.getElementById('editStatus').value = b.status || 'in_attesa';
    document.getElementById('editCustName').value = b.customerName || '';
    document.getElementById('editCustPhone').value = b.customerPhone || '';
    document.getElementById('editPickupDate').value = b.pickupDate || '';
    document.getElementById('editPickupTime').value = b.pickupTime || '';
    document.getElementById('editAllergens').value = b.allergens || '';
    document.getElementById('editNotes').value = b.notes || '';
    document.getElementById('editAdminNotes').value = b.adminNotes || '';

    // Initialize Fidelity Discount
    const fidDisc = Number(b.fidelityDiscount || 0);
    if (editFidelityDiscountCheck) {
      if (fidDisc > 0) {
        editFidelityDiscountCheck.checked = true;
        if (fidelityDiscountAmountContainer) fidelityDiscountAmountContainer.style.display = 'flex';
        if (editFidelityDiscountAmount) editFidelityDiscountAmount.value = fidDisc.toFixed(2);
      } else {
        editFidelityDiscountCheck.checked = false;
        if (fidelityDiscountAmountContainer) fidelityDiscountAmountContainer.style.display = 'none';
        if (editFidelityDiscountAmount) editFidelityDiscountAmount.value = '2.00';
      }
    }

    // Render items list inside editor
    const editItemsList = document.getElementById('editItemsList');
    editItemsList.innerHTML = (b.items || []).map((it, idx) => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
        <span>${escapeHtml(it.name)} (${(it.price || 0).toFixed(2).replace('.', ',')} € cad.)</span>
        <div style="display:flex; align-items:center; gap:8px;">
          <input type="number" min="1" max="99" value="${it.quantity || 1}" class="edit-item-qty" data-index="${idx}" data-price="${it.price || 0}" style="width:55px; padding:3px 6px; text-align:center; font-size:0.85rem;">
          <span class="edit-item-subtotal" style="font-size:0.85rem; font-weight:700; color:var(--gold-light);">${((it.quantity || 1) * (it.price || 0)).toFixed(2).replace('.', ',')} €</span>
        </div>
      </div>
    `).join('');

    // Attach listeners on item qty inputs
    document.querySelectorAll('.edit-item-qty').forEach(inp => {
      inp.addEventListener('input', recalculateEditModalPreview);
    });

    recalculateEditModalPreview();
    editBookingModal.classList.add('active');
  };

  function recalculateEditModalPreview() {
    let itemsSubtotal = 0;
    document.querySelectorAll('.edit-item-qty').forEach(inp => {
      const q = parseInt(inp.value, 10) || 1;
      const pr = parseFloat(inp.dataset.price) || 0;
      itemsSubtotal += q * pr;
      const subtotalEl = inp.parentElement.querySelector('.edit-item-subtotal');
      if (subtotalEl) subtotalEl.textContent = (q * pr).toFixed(2).replace('.', ',') + ' €';
    });

    const bId = document.getElementById('editBookingId').value;
    const b = allBookings.find(item => item.id === bId);
    const delivFee = (b && b.orderType === 'domicilio') ? 2.00 : 0.00;

    let discount = 0;
    if (editFidelityDiscountCheck && editFidelityDiscountCheck.checked) {
      discount = parseFloat(editFidelityDiscountAmount.value) || 0;
    }

    const finalTot = Math.max(0, itemsSubtotal + delivFee - discount);
    if (editPreviewTotalAmount) {
      let breakdownText = `${itemsSubtotal.toFixed(2).replace('.', ',')} €`;
      if (delivFee > 0) breakdownText += ` + 2,00 € consegna`;
      if (discount > 0) breakdownText += ` - ${discount.toFixed(2).replace('.', ',')} € sconto fedeltà`;
      breakdownText += ` = ${finalTot.toFixed(2).replace('.', ',')} €`;
      editPreviewTotalAmount.textContent = breakdownText;
    }
  }

  async function handleSaveBookingEdit(e) {
    e.preventDefault();
    const id = document.getElementById('editBookingId').value;
    const b = allBookings.find(item => item.id === id);
    if (!b) return;

    const status = document.getElementById('editStatus').value;
    const customerName = document.getElementById('editCustName').value.trim();
    const customerPhone = document.getElementById('editCustPhone').value.trim();
    const pickupDate = document.getElementById('editPickupDate').value;
    const pickupTime = document.getElementById('editPickupTime').value.trim();
    const allergens = document.getElementById('editAllergens').value.trim();
    const notes = document.getElementById('editNotes').value.trim();
    const adminNotes = document.getElementById('editAdminNotes').value.trim();

    // Fidelity discount
    const applyFid = editFidelityDiscountCheck ? editFidelityDiscountCheck.checked : false;
    const fidelityDiscount = applyFid ? (parseFloat(editFidelityDiscountAmount.value) || 0) : 0;

    // Update quantities from inputs
    const updatedItems = [...b.items];
    document.querySelectorAll('.edit-item-qty').forEach(input => {
      const idx = parseInt(input.dataset.index, 10);
      const qty = parseInt(input.value, 10) || 1;
      if (updatedItems[idx]) {
        updatedItems[idx].quantity = qty;
      }
    });

    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': adminPin
        },
        body: JSON.stringify({
          status,
          customerName,
          customerPhone,
          pickupDate,
          pickupTime,
          allergens,
          notes,
          adminNotes,
          fidelityDiscount,
          items: updatedItems
        })
      });

      const data = await res.json();
      if (data.success) {
        showAdminToast('Prenotazione modificata con successo');
        editBookingModal.classList.remove('active');
        loadBookingsAndStats();
        loadCustomers();
      } else {
        alert(data.message || 'Errore durante il salvataggio.');
      }
    } catch (err) {
      console.error('Save edit error:', err);
    }
  }

  // ---------------- CUSTOMER DIRECTORY & STATS ----------------

  function getLocalDateString(dateObj = new Date()) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function buildCustomerMapFromBookings(bookingsList) {
    const customerMap = {};
    for (const b of (bookingsList || [])) {
      if (!b || !b.customerName) continue;
      const rawPhone = (b.customerPhone || '').trim();
      const cleanPhone = rawPhone.replace(/\D/g, '');
      const key = cleanPhone.length >= 6 ? cleanPhone : b.customerName.toLowerCase().trim();

      if (!customerMap[key]) {
        customerMap[key] = {
          id: 'cust_' + (cleanPhone || Math.random().toString(36).substr(2, 6)),
          name: b.customerName ? b.customerName.trim() : 'Cliente',
          phone: b.customerPhone ? b.customerPhone.trim() : 'N/D',
          cleanPhone: cleanPhone,
          totalOrders: 0,
          totalSpent: 0,
          completedOrders: 0,
          pendingOrders: 0,
          lastOrderDate: b.pickupDate || (b.createdAt ? b.createdAt.split('T')[0] : getLocalDateString()),
          lastOrderTime: b.pickupTime || '',
          lastOrderCode: b.code || '',
          lastOrderType: b.orderType || 'ritiro',
          lastDeliveryAddress: b.deliveryAddress || '',
          firstSeen: b.createdAt || new Date().toISOString(),
          isVip: false
        };
      }

      const c = customerMap[key];
      if (b.status !== 'annullato') {
        c.totalOrders += 1;
        c.totalSpent += Number(b.totalAmount || 0);
        if (b.status === 'completato') c.completedOrders += 1;
        if (b.status === 'in_attesa') c.pendingOrders += 1;
      }

      if (b.customerName && b.customerName.trim()) c.name = b.customerName.trim();
      if (b.deliveryAddress && b.deliveryAddress.trim()) c.lastDeliveryAddress = b.deliveryAddress.trim();

      if (b.pickupDate && b.pickupDate >= c.lastOrderDate) {
        c.lastOrderDate = b.pickupDate;
        c.lastOrderTime = b.pickupTime || c.lastOrderTime;
        c.lastOrderCode = b.code || c.lastOrderCode;
        c.lastOrderType = b.orderType || c.lastOrderType;
      }
    }

    const list = Object.values(customerMap).map(c => {
      c.totalSpent = Number(c.totalSpent.toFixed(2));
      c.isVip = c.totalOrders >= 2 || c.totalSpent >= 25.00;
      return c;
    });

    list.sort((a, b) => (b.lastOrderDate + (b.lastOrderTime || '')).localeCompare(a.lastOrderDate + (a.lastOrderTime || '')));
    return list;
  }

  async function loadCustomers() {
    let serverCustomers = [];
    try {
      const res = await fetch('/api/admin/customers', {
        headers: { 'x-admin-pin': adminPin }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.customers)) {
        serverCustomers = data.customers;
      }
    } catch (err) {
      console.warn('API customers fetch failed, using bookings aggregator:', err);
    }

    // Merge with allBookings and local storage bookings
    let localBookings = [];
    try {
      const stored = localStorage.getItem('el_gallero_bookings');
      if (stored) localBookings = JSON.parse(stored);
    } catch (e) {}

    const combinedBookings = [...allBookings];
    localBookings.forEach(lb => {
      if (!combinedBookings.some(b => b.id === lb.id || b.code === lb.code)) {
        combinedBookings.push(lb);
      }
    });

    const aggregatedFromBookings = buildCustomerMapFromBookings(combinedBookings);

    // Merge serverCustomers & aggregatedFromBookings
    const mergedMap = {};
    aggregatedFromBookings.forEach(c => {
      const k = (c.cleanPhone && c.cleanPhone.length >= 6) ? c.cleanPhone : c.name.toLowerCase().trim();
      mergedMap[k] = c;
    });

    serverCustomers.forEach(c => {
      const k = (c.cleanPhone && c.cleanPhone.length >= 6) ? c.cleanPhone : c.name.toLowerCase().trim();
      if (!mergedMap[k]) {
        mergedMap[k] = c;
      } else {
        mergedMap[k].totalOrders = Math.max(mergedMap[k].totalOrders, c.totalOrders || 0);
        mergedMap[k].totalSpent = Math.max(mergedMap[k].totalSpent, c.totalSpent || 0);
        if (c.lastOrderDate >= mergedMap[k].lastOrderDate) {
          mergedMap[k].lastOrderDate = c.lastOrderDate;
          mergedMap[k].lastOrderTime = c.lastOrderTime || mergedMap[k].lastOrderTime;
          mergedMap[k].lastOrderCode = c.lastOrderCode || mergedMap[k].lastOrderCode;
        }
      }
    });

    allCustomers = Object.values(mergedMap);
    allCustomers.sort((a, b) => (b.lastOrderDate + (b.lastOrderTime || '')).localeCompare(a.lastOrderDate + (a.lastOrderTime || '')));

    updateCustomerStatsUI(allCustomers);
    renderCustomersTable();
  }

  function updateCustomerStatsUI(customers) {
    const todayStr = getLocalDateString();
    const todayCustomers = customers.filter(c => c.lastOrderDate === todayStr);
    const vipCustomers = customers.filter(c => c.isVip);
    const totalSpentSum = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

    if (statCustTotal) statCustTotal.textContent = customers.length;
    if (statCustToday) statCustToday.textContent = todayCustomers.length;
    if (statCustVip) statCustVip.textContent = vipCustomers.length;
    if (statCustRevenue) statCustRevenue.textContent = totalSpentSum.toFixed(2).replace('.', ',') + ' €';

    if (totalClientsBadge) {
      totalClientsBadge.textContent = customers.length;
      totalClientsBadge.style.display = customers.length > 0 ? 'inline-block' : 'none';
    }
  }

  function renderCustomersTable() {
    if (!custTableBody) return;
    const todayStr = getLocalDateString();

    let filtered = allCustomers.filter(c => {
      // Filter by type
      if (custFilter === 'today' && c.lastOrderDate !== todayStr) return false;
      if (custFilter === 'vip' && !c.isVip) return false;

      // Filter by search
      if (custSearchQuery) {
        const matchesName = c.name && c.name.toLowerCase().includes(custSearchQuery);
        const matchesPhone = c.phone && c.phone.toLowerCase().includes(custSearchQuery);
        if (!matchesName && !matchesPhone) return false;
      }
      return true;
    });

    if (custCountBadge) {
      custCountBadge.textContent = `${filtered.length} ${filtered.length === 1 ? 'cliente' : 'clienti'}`;
    }

    if (filtered.length === 0) {
      custTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:30px; color:var(--text-muted);">
            <i class="fa-solid fa-user-slash" style="font-size:2rem; margin-bottom:8px; display:block;"></i>
            Nessun cliente trovato per i filtri selezionati.
          </td>
        </tr>
      `;
      return;
    }

    custTableBody.innerHTML = filtered.map(c => {
      let cleanPhone = (c.cleanPhone || c.phone.replace(/\D/g, ''));
      if (cleanPhone.length === 10 && !cleanPhone.startsWith('39')) cleanPhone = '39' + cleanPhone;

      const isDelivery = (c.lastOrderType === 'domicilio');
      const addressDisplay = isDelivery 
        ? `<span title="${escapeHtml(c.lastDeliveryAddress)}">🛵 ${escapeHtml(c.lastDeliveryAddress || 'Domicilio')}</span>`
        : `<span style="color:var(--text-muted);">🏪 Asporto in Sede</span>`;

      return `
        <tr>
          <td>
            <div class="cust-name-cell">
              <i class="fa-solid fa-circle-user text-gold" style="font-size:1.2rem;"></i>
              <div>
                <span>${escapeHtml(c.name)}</span>
                ${c.isVip ? '<span class="vip-star-badge" title="Cliente Fedele"><i class="fa-solid fa-star"></i> VIP</span>' : ''}
              </div>
            </div>
          </td>
          <td>
            <a href="tel:${escapeHtml(c.phone)}" class="cust-phone-link" title="Chiama cliente">
              <i class="fa-solid fa-phone" style="font-size:0.8rem;"></i> ${escapeHtml(c.phone)}
            </a>
          </td>
          <td style="text-align:center;">
            <span style="font-weight:800; font-size:1rem; color:var(--gold-light);">${c.totalOrders}</span>
            <small style="color:var(--text-muted); display:block; font-size:0.75rem;">${c.totalOrders === 1 ? 'ordine' : 'ordini'}</small>
          </td>
          <td>
            <strong>${formatDateIt(c.lastOrderDate)}</strong>
            <small style="color:var(--text-muted); display:block;">Ore ${c.lastOrderTime} (${c.lastOrderCode})</small>
          </td>
          <td style="max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:0.82rem;">
            ${addressDisplay}
          </td>
          <td style="text-align:right; font-weight:800; color:#2ecc71; font-size:0.95rem;">
            ${Number(c.totalSpent).toFixed(2).replace('.', ',')} €
          </td>
          <td style="text-align:center;" class="no-print">
            <button class="btn-cust-wa" onclick="window.adminOpenCustomerWhatsApp('${cleanPhone}', '${escapeHtml(c.name)}')">
              <i class="fa-brands fa-whatsapp"></i> WhatsApp
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  window.adminOpenCustomerWhatsApp = function(cleanPhone, name) {
    const text = `Ciao ${name}, ti contattiamo da *EL GALLERO - 100% Cotto a Legna* (Casavatore via e.a.Mario 30). 🔥🍗`;
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // ---------------- EXPORT TO EXCEL & PDF ----------------

  function exportCustomersToExcel() {
    if (allCustomers.length === 0) {
      alert('Nessun cliente presente nella rubrica da esportare.');
      return;
    }

    const todayStr = getLocalDateString();
    let csvContent = '\uFEFF'; // UTF-8 BOM for Microsoft Excel
    csvContent += 'Nome Cliente;Numero di Telefono;Ordini Totali;Ultima Prenotazione;Orario Ritiro/Consegna;Codice Ultimo Ordine;Modalita;Indirizzo Consegna;Spesa Totale (EUR);Cliente VIP\r\n';

    allCustomers.forEach(c => {
      const name = `"${(c.name || '').replace(/"/g, '""')}"`;
      const phone = `"${(c.phone || '').replace(/"/g, '""')}"`;
      const orders = c.totalOrders || 0;
      const lastDate = `"${c.lastOrderDate || ''}"`;
      const lastTime = `"${c.lastOrderTime || ''}"`;
      const lastCode = `"${c.lastOrderCode || ''}"`;
      const mode = c.lastOrderType === 'domicilio' ? '"Consegna a Domicilio"' : '"Ritiro in Sede"';
      const address = `"${(c.lastDeliveryAddress || '').replace(/"/g, '""')}"`;
      const totalSpent = (c.totalSpent || 0).toFixed(2).replace('.', ',');
      const isVip = c.isVip ? '"SI"' : '"NO"';

      csvContent += `${name};${phone};${orders};${lastDate};${lastTime};${lastCode};${mode};${address};${totalSpent};${isVip}\r\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `El_Gallero_Rubrica_Clienti_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showAdminToast('📊 File Excel esportato con successo!');
  }

  function exportCustomersToPdf() {
    if (allCustomers.length === 0) {
      alert('Nessun cliente presente da esportare.');
      return;
    }

    const now = new Date();
    const pdfExportDate = document.getElementById('pdfExportDate');
    if (pdfExportDate) {
      pdfExportDate.textContent = `Generato il ${now.toLocaleDateString('it-IT')} alle ore ${now.toLocaleTimeString('it-IT', { hour:'2-digit', minute:'2-digit' })} - Totale clienti: ${allCustomers.length}`;
    }

    // Switch to customers tab
    adminTabs.forEach(t => t.classList.remove('active'));
    tabPanels.forEach(p => p.style.display = 'none');
    const custTabBtn = document.getElementById('tabBtnCustomers');
    if (custTabBtn) custTabBtn.classList.add('active');
    const custPanel = document.getElementById('customersTab');
    if (custPanel) custPanel.style.display = 'block';
    renderCustomersTable();

    setTimeout(() => {
      window.print();
    }, 150);
  }

  async function handleClearRubrica() {
    if (!confirm('⚠️ Sei sicuro di voler cancellare e svuotare completamente la Rubrica Clienti?\n\nQuesta operazione resetterà la lista dei contatti.')) {
      return;
    }

    allCustomers = [];
    try {
      localStorage.removeItem('el_gallero_customers');
      localStorage.removeItem('el_gallero_bookings');
    } catch (e) {}

    updateCustomerStatsUI([]);
    renderCustomersTable();
    showAdminToast('🗑️ Rubrica Clienti cancellata con successo!');

    try {
      await fetch('/api/admin/customers/clear', {
        method: 'POST',
        headers: { 'x-admin-pin': adminPin }
      });
      loadBookingsAndStats();
    } catch (err) {}
  }

  // ---------------- MENU PERSISTENCE & SYNC HELPER ----------------

  function persistAndBroadcastMenu(productsList, categoriesList) {
    if (Array.isArray(productsList)) allProducts = productsList;
    if (Array.isArray(categoriesList)) allCategories = categoriesList;

    try {
      const storeData = JSON.parse(localStorage.getItem('el_gallero_data') || '{}');
      storeData.products = allProducts;
      if (allCategories && allCategories.length) storeData.categories = allCategories;
      storeData.settings = storeSettings;
      localStorage.setItem('el_gallero_data', JSON.stringify(storeData));
      localStorage.setItem('el_gallero_products', JSON.stringify(allProducts));
      localStorage.setItem('el_gallero_menu_updated_ts', Date.now().toString());

      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('el_gallero_sync_channel');
        bc.postMessage({ type: 'menu_updated', products: allProducts, timestamp: Date.now() });
      }
    } catch (e) {
      console.warn('LocalStorage / BroadcastChannel sync error:', e);
    }
  }

  // ---------------- MENU CATALOG & STOCK MANAGEMENT ----------------

  function renderMenuCatalog() {
    if (allProducts.length === 0) {
      menuEditorGrid.innerHTML = '<div class="empty-cart-msg"><p>Nessun prodotto presente nel database.</p></div>';
      return;
    }

    menuEditorGrid.innerHTML = allProducts.map(p => {
      const isUnlimited = Boolean(p.unlimited);
      const stock = p.stock !== undefined ? p.stock : 10;
      const isAvail = isUnlimited ? (p.available !== false) : (stock > 0 && p.available !== false);

      let stockTagClass = 'stock-tag-ok';
      let stockTagText = `${stock} Disponibili`;
      if (isUnlimited) {
        stockTagClass = 'stock-tag-unlimited';
        stockTagText = 'Quantità Illimitata';
      } else if (stock === 0) {
        stockTagClass = 'stock-tag-zero';
        stockTagText = '🔴 Esaurito (0)';
      } else if (stock <= 3) {
        stockTagClass = 'stock-tag-low';
        stockTagText = `⚠️ Solo ${stock} rimasti!`;
      }

      return `
        <div class="menu-prod-card ${!isAvail ? 'unavailable' : ''}">
          <div>
            <div class="prod-card-top">
              <span class="prod-cat-pill">${escapeHtml(p.category)}</span>
              <strong style="font-size:1.15rem; color:var(--gold-primary);">${Number(p.price).toFixed(2).replace('.', ',')} €</strong>
            </div>
            <h4 style="font-size:1.05rem; font-weight:700; margin:8px 0 4px 0;">${escapeHtml(p.name)}</h4>
            <p style="font-size:0.82rem; color:var(--text-secondary); margin-bottom:8px;">${escapeHtml(p.description || '')}</p>
          </div>

          <!-- Stock & Availability Box -->
          <div class="admin-stock-control-box">
            <div class="stock-control-header">
              <span style="font-size:0.75rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;"><i class="fa-solid fa-boxes-stacked"></i> Giacenza / Quantità:</span>
              <span class="stock-status-tag ${stockTagClass}">${stockTagText}</span>
            </div>

            ${!isUnlimited ? `
              <div class="stock-stepper-row">
                <button class="btn-stock-adjust" onclick="window.adminAdjustStock('${p.id}', -5)" title="Togli 5">-5</button>
                <button class="btn-stock-adjust" onclick="window.adminAdjustStock('${p.id}', -1)" title="Togli 1">-1</button>
                <input type="number" min="0" value="${stock}" class="stock-input-field" onchange="window.adminSetExactStock('${p.id}', this.value)" title="Modifica valore esatto">
                <button class="btn-stock-adjust" onclick="window.adminAdjustStock('${p.id}', 1)" title="Aggiungi 1">+1</button>
                <button class="btn-stock-adjust" onclick="window.adminAdjustStock('${p.id}', 5)" title="Aggiungi 5">+5</button>
              </div>

              <div class="stock-quick-actions">
                <button class="btn-quick-stock btn-quick-zero" onclick="window.adminSetExactStock('${p.id}', 0)">
                  <i class="fa-solid fa-ban"></i> Segna Esaurito (0)
                </button>
                <button class="btn-quick-stock" onclick="window.adminAdjustStock('${p.id}', 10)">
                  <i class="fa-solid fa-plus"></i> +10 Porzioni
                </button>
              </div>
            ` : `
              <div style="font-size:0.8rem; color:var(--text-muted); text-align:center; padding:4px 0;">
                <i class="fa-solid fa-infinity text-gold"></i> Quantità illimitata (sempre disponibile).
              </div>
            `}
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; padding-top:8px; border-top:1px solid rgba(255,255,255,0.06);">
            <button class="btn-adm-action" onclick="window.adminToggleProductAvail('${p.id}', ${!isAvail})" style="font-size:0.75rem;">
              <i class="fa-solid ${isAvail ? 'fa-eye text-green' : 'fa-eye-slash text-warning'}"></i> ${isAvail ? 'Attivo' : 'Disattivato'}
            </button>

            <div class="prod-card-actions">
              <button class="btn-adm-action btn-adm-edit" onclick="window.adminOpenEditProduct('${p.id}')">
                <i class="fa-solid fa-pen"></i> Modifica
              </button>
              <button class="btn-adm-action btn-adm-delete" onclick="window.adminDeleteProduct('${p.id}')">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  window.adminAdjustStock = async function(id, delta) {
    const prod = allProducts.find(p => p.id === id);
    if (prod) {
      prod.stock = Math.max(0, (prod.stock || 0) + parseInt(delta, 10));
      prod.available = prod.unlimited ? true : (prod.stock > 0);
      persistAndBroadcastMenu(allProducts);
      renderMenuCatalog();
      showAdminToast(`Giacenza "${prod.name}": ${prod.stock} pz`);
    }

    try {
      await fetch(`/api/admin/products/${id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify({ delta })
      });
    } catch (err) {}
  };

  window.adminSetExactStock = async function(id, exactStock) {
    const prod = allProducts.find(p => p.id === id);
    if (prod) {
      prod.stock = Math.max(0, parseInt(exactStock, 10) || 0);
      prod.available = prod.unlimited ? true : (prod.stock > 0);
      persistAndBroadcastMenu(allProducts);
      renderMenuCatalog();
      showAdminToast(`Giacenza "${prod.name}": impostata a ${prod.stock} pz`);
    }

    try {
      await fetch(`/api/admin/products/${id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify({ exactStock: parseInt(exactStock, 10) || 0 })
      });
    } catch (err) {}
  };

  function openAddProductModal() {
    productForm.reset();
    document.getElementById('prodFormId').value = '';
    document.getElementById('prodStock').value = '10';
    document.getElementById('prodUnlimited').checked = false;
    document.getElementById('prodAvailable').checked = true;
    productModalTitle.innerHTML = '<i class="fa-solid fa-plus text-gold"></i> Aggiungi Nuovo Piatto';
    productModal.classList.add('active');
  }

  window.adminOpenEditProduct = function(id) {
    const p = allProducts.find(item => item.id === id);
    if (!p) return;

    document.getElementById('prodFormId').value = p.id;
    document.getElementById('prodName').value = p.name;
    document.getElementById('prodCategory').value = p.category;
    document.getElementById('prodPrice').value = p.price;
    document.getElementById('prodDesc').value = p.description || '';
    document.getElementById('prodStock').value = p.stock !== undefined ? p.stock : 10;
    document.getElementById('prodUnlimited').checked = Boolean(p.unlimited);
    document.getElementById('prodAvailable').checked = p.available !== false;

    productModalTitle.innerHTML = `<i class="fa-solid fa-pen text-gold"></i> Modifica "${escapeHtml(p.name)}"`;
    productModal.classList.add('active');
  };

  async function handleSaveProduct(e) {
    e.preventDefault();
    const id = document.getElementById('prodFormId').value;
    const name = document.getElementById('prodName').value.trim();
    const category = document.getElementById('prodCategory').value;
    const price = parseFloat(document.getElementById('prodPrice').value);
    const description = document.getElementById('prodDesc').value.trim();
    const stock = parseInt(document.getElementById('prodStock').value, 10) || 0;
    const unlimited = document.getElementById('prodUnlimited').checked;
    const available = document.getElementById('prodAvailable').checked;

    const payload = { name, category, price, description, stock, unlimited, available };

    if (id) {
      const idx = allProducts.findIndex(p => p.id === id);
      if (idx !== -1) {
        allProducts[idx] = { ...allProducts[idx], ...payload };
      } else {
        allProducts.push({ id, ...payload });
      }
    } else {
      const newId = 'prod_' + Date.now();
      allProducts.push({ id: newId, ...payload });
    }

    // Persist immediately to LocalStorage and Broadcast to Customer Tabs
    persistAndBroadcastMenu(allProducts);
    renderMenuCatalog();
    productModal.classList.remove('active');
    showAdminToast(id ? `Prezzo "${name}" aggiornato a ${price.toFixed(2).replace('.', ',')} €` : 'Nuovo piatto aggiunto al menu');

    // Attempt backend sync in background
    try {
      if (id) {
        await fetch(`/api/admin/products/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
          body: JSON.stringify(payload)
        });
      }
    } catch (err) {}
  }

  window.adminToggleProductAvail = async function(id, newStatus) {
    const prod = allProducts.find(p => p.id === id);
    if (prod) {
      prod.available = Boolean(newStatus);
      persistAndBroadcastMenu(allProducts);
      renderMenuCatalog();
      showAdminToast(`Stato "${prod.name}": ${newStatus ? 'Attivo' : 'Disattivato'}`);
    }

    try {
      await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify({ available: newStatus })
      });
    } catch (err) {}
  };

  window.adminDeleteProduct = async function(id) {
    const p = allProducts.find(item => item.id === id);
    if (!p) return;

    if (!confirm(`Sei sicuro di voler rimuovere definitivamente "${p.name}" dal menu?`)) {
      return;
    }

    allProducts = allProducts.filter(item => item.id !== id);
    persistAndBroadcastMenu(allProducts);
    renderMenuCatalog();
    showAdminToast('Prodotto rimosso dal menu');

    try {
      await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': adminPin }
      });
    } catch (err) {}
  };

  // ---------------- SETTINGS FORM ----------------

  function populateSettingsForm() {
    document.getElementById('setStoreName').value = storeSettings.storeName || 'EL GALLERO';
    document.getElementById('setSubtitle').value = storeSettings.subtitle || '100% cotto a legna';
    document.getElementById('setPhone').value = storeSettings.phone || '';
    document.getElementById('setAdminPin').value = adminPin || '1234';
    document.getElementById('setTimeSlots').value = (storeSettings.timeSlots || []).join(', ');
  }

  async function handleSaveSettings(e) {
    e.preventDefault();

    const storeName = document.getElementById('setStoreName').value.trim();
    const subtitle = document.getElementById('setSubtitle').value.trim();
    const phone = document.getElementById('setPhone').value.trim();
    const newPin = document.getElementById('setAdminPin').value.trim();
    const timeSlotsRaw = document.getElementById('setTimeSlots').value;

    const timeSlots = timeSlotsRaw.split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (newPin.length < 4) {
      alert('Il PIN deve essere di almeno 4 cifre.');
      return;
    }

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify({ storeName, subtitle, phone, adminPin: newPin, timeSlots })
      });

      const data = await res.json();
      if (data.success) {
        adminPin = newPin;
        sessionStorage.setItem('el_gallero_admin_pin', newPin);
        storeSettings = data.settings;
        showAdminToast('Impostazioni e PIN salvati con successo!');
      } else {
        alert(data.message || 'Errore durante il salvataggio impostazioni.');
      }
    } catch (err) {
      console.error('Settings save error:', err);
    }
  }

  // ---------------- HELPERS ----------------

  function formatDateIt(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  function showAdminToast(msg) {
    const toastContainer = document.getElementById('adminToastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fa-solid fa-circle-check text-gold"></i> <span>${escapeHtml(msg)}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
});