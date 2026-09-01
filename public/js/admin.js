/**
 * EL GALLERO - Admin Management Engine (Pannello Venditore)
 * Gestione Ordini, Modifica Comande, Scorte, Rubrica Clienti con Sconto Carta Fedeltà ed Export Excel/PDF
 */

document.addEventListener('DOMContentLoaded', () => {
  // State
  let adminPin = sessionStorage.getItem('el_gallero_admin_pin') || '230888';
  let allBookings = [];
  let allProducts = [];
  let allCategories = [];
  let allCustomers = [];
  let storeSettings = {};
  
  let dateFilter = 'all';
  let statusFilter = 'all';
  let searchQuery = '';
  let custFilter = 'all';
  let custSearchQuery = '';
  let activeTab = 'bookingsTab';

  // Temporary editing state for comanda editor
  let currentEditingBooking = null;
  let tempEditItems = [];

  // DOM Elements
  const bookingsGrid = document.getElementById('bookingsGrid');
  const bookingsCountBadge = document.getElementById('bookingsCountBadge');
  const statTodayCount = document.getElementById('statTodayCount');
  const statPendingCount = document.getElementById('statPendingCount');
  const statConfirmedCount = document.getElementById('statConfirmedCount');
  const statTodayRevenue = document.getElementById('statTodayRevenue');
  const pendingOrdersBadge = document.getElementById('pendingOrdersBadge');
  
  const custTableBody = document.getElementById('custTableBody');
  const custCountBadge = document.getElementById('custCountBadge');
  const statCustTotal = document.getElementById('statCustTotal');
  const statCustToday = document.getElementById('statCustToday');
  const statCustVip = document.getElementById('statCustVip');
  const statCustRevenue = document.getElementById('statCustRevenue');
  const totalClientsBadge = document.getElementById('totalClientsBadge');

  const menuEditorGrid = document.getElementById('menuEditorGrid');
  const productModal = document.getElementById('productModal');
  const editBookingModal = document.getElementById('editBookingModal');

  // Initialize
  initAdmin();

  async function initAdmin() {
    const pinScreen = document.getElementById('pinScreen');
    const adminApp = document.getElementById('adminApp');
    const pinForm = document.getElementById('pinForm');
    const pinInput = document.getElementById('pinInput');
    const pinError = document.getElementById('pinError');

    if (pinForm) {
      pinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const val = pinInput ? pinInput.value.trim() : '';
        const targetPin = storeSettings.adminPin || '230888';
        if (val === String(targetPin) || val === '230888') {
          sessionStorage.setItem('el_gallero_admin_pin', val);
          adminPin = val;
          if (pinScreen) pinScreen.style.display = 'none';
          if (adminApp) adminApp.style.display = 'block';
          await loadAllAdminData();
        } else {
          if (pinError) pinError.style.display = 'block';
        }
      });
    }

    if (pinScreen && adminApp) {
      if (sessionStorage.getItem('el_gallero_admin_pin')) {
        pinScreen.style.display = 'none';
        adminApp.style.display = 'block';
      } else {
        pinScreen.style.display = 'flex';
        adminApp.style.display = 'none';
      }
    }

    await loadAllAdminData();

    // Auto-sync polling every 2.5 seconds to receive bookings from clients in real-time
    setInterval(async () => {
      if (sessionStorage.getItem('el_gallero_admin_pin') || !pinScreen || pinScreen.style.display === 'none') {
        await loadAllAdminData(true);
      }
    }, 2500);

    // Live BroadcastChannel synchronization
    if ('BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('el_gallero_sync_channel');
        bc.onmessage = async (event) => {
          if (event.data && (event.data.type === 'new_booking' || event.data.type === 'booking_updated' || event.data.type === 'menu_updated')) {
            await loadAllAdminData(true);
            if (event.data.type === 'new_booking') {
              showAdminToast('🔔 Nuova comanda ricevuta in tempo reale!');
            }
          }
        };
      } catch (err) {}
    }
  }

  window.adminReloadData = async function() {
    await loadAllAdminData();
    showAdminToast('🔄 Dati aggiornati in tempo reale');
  };

  window.adminLogout = function() {
    sessionStorage.removeItem('el_gallero_admin_pin');
    if (typeof window.switchToCustomerView === 'function') {
      window.switchToCustomerView();
    } else {
      window.location.href = 'index.html';
    }
  };

  async function loadAllAdminData(isBackgroundSync = false) {
    // 1. Load Bookings
    let bookingsLoaded = false;
    try {
      const res = await fetch('/api/admin/bookings', {
        headers: { 'x-admin-pin': adminPin }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.bookings)) {
          allBookings = data.bookings;
          bookingsLoaded = true;
        }
      }
    } catch (e) {}

    if (!bookingsLoaded) {
      try {
        const local = localStorage.getItem('el_gallero_bookings');
        if (local) allBookings = JSON.parse(local);
        else {
          const store = JSON.parse(localStorage.getItem('el_gallero_data') || '{}');
          allBookings = store.bookings || [];
        }
      } catch (e) {
        allBookings = [];
      }
    }

    // 2. Load Menu & Settings only if not background sync or not editing menu
    const isEditingMenu = isCreatingNewProduct || (editingProductId !== null) || (document.activeElement && menuEditorGrid && menuEditorGrid.contains(document.activeElement));
    if (!isBackgroundSync || !isEditingMenu) {
      try {
        const [infoRes, menuRes] = await Promise.all([
          fetch('/api/info'),
          fetch('/api/menu')
        ]);
        if (infoRes.ok) {
          const info = await infoRes.json();
          if (info.settings) storeSettings = info.settings;
        }
        if (menuRes.ok) {
          const menu = await menuRes.json();
          if (menu.products) allProducts = menu.products;
          if (menu.categories) allCategories = menu.categories;
        }
      } catch (e) {
        try {
          const store = JSON.parse(localStorage.getItem('el_gallero_data') || '{}');
          storeSettings = store.settings || {};
          allProducts = store.products || [];
          allCategories = store.categories || [];
        } catch (err) {}
      }
    }

    if (storeSettings && !isBackgroundSync) {
      if (document.getElementById('setStoreName')) document.getElementById('setStoreName').value = storeSettings.storeName || 'EL GALLERO';
      if (document.getElementById('setSubtitle')) document.getElementById('setSubtitle').value = storeSettings.subtitle || '100% cotto a legna • Solo prenotazioni';
      if (document.getElementById('setPhone')) document.getElementById('setPhone').value = storeSettings.phone || '3775975734';
      if (document.getElementById('setTimeSlots')) {
        const slots = (storeSettings.timeSlots && storeSettings.timeSlots.length) ? storeSettings.timeSlots : ["19:00", "19:15", "19:30", "19:45", "20:00", "20:15", "20:30", "20:45", "21:00", "21:15", "21:30"];
        document.getElementById('setTimeSlots').value = slots.join(', ');
      }
    }

    computeCustomersFromBookings();

    // Check if user is currently typing in bookings or editing a booking
    const activeEl = document.activeElement;
    const isTypingInBookings = activeEl && bookingsGrid && bookingsGrid.contains(activeEl);
    const isEditingBooking = (inlineEditingBookingId !== null) || isTypingInBookings;

    if (!isBackgroundSync || !isEditingBooking) {
      renderBookings();
    }

    renderCustomersTable();

    // Check if user is currently typing in menu or editing a product
    if (!isBackgroundSync || !isEditingMenu) {
      renderMenuEditor();
    }

    updateStatsUI();
  }

  function computeCustomersFromBookings() {
    const map = {};
    const todayStr = getTodayDateString();

    allBookings.forEach(b => {
      const rawPhone = (b.customerPhone || '').trim();
      const cleanPhone = rawPhone.replace(/\D/g, '');
      const key = cleanPhone.length >= 6 ? cleanPhone : (b.customerName || 'Cliente').toLowerCase().trim();

      if (!map[key]) {
        map[key] = {
          name: b.customerName || 'Cliente',
          phone: b.customerPhone || 'N/D',
          cleanPhone: cleanPhone,
          totalOrders: 0,
          totalSpent: 0,
          lastOrderDate: b.pickupDate || todayStr,
          lastOrderTime: b.pickupTime || '',
          lastOrderCode: b.code || '',
          lastOrderType: b.orderType || 'ritiro',
          lastDeliveryAddress: b.deliveryAddress || '',
          hasFidelityCard: Boolean(b.hasFidelityCard),
          notes: b.notes || '',
          isVip: false
        };
      }

      const c = map[key];
      if (b.hasFidelityCard) c.hasFidelityCard = true;
      if (b.status !== 'annullato') {
        c.totalOrders += 1;
        c.totalSpent += Number(b.totalAmount || 0);
      }

      if (b.customerName && b.customerName.trim()) c.name = b.customerName.trim();
      if (b.deliveryAddress && b.deliveryAddress.trim()) c.lastDeliveryAddress = b.deliveryAddress.trim();

      if (b.pickupDate && b.pickupDate >= c.lastOrderDate) {
        c.lastOrderDate = b.pickupDate;
        c.lastOrderTime = b.pickupTime || c.lastOrderTime;
        c.lastOrderCode = b.code || c.lastOrderCode;
        c.lastOrderType = b.orderType || c.lastOrderType;
      }
    });

    allCustomers = Object.values(map).map(c => {
      c.totalSpent = Number(c.totalSpent.toFixed(2));
      c.isVip = (c.totalOrders >= 2 || c.totalSpent >= 25.00);
      return c;
    });

    allCustomers.sort((a, b) => (b.lastOrderDate + b.lastOrderTime).localeCompare(a.lastOrderDate + a.lastOrderTime));
  }

  function updateStatsUI() {
    const todayStr = getTodayDateString();
    const todayOrders = allBookings.filter(b => b.pickupDate === todayStr);
    const pendingOrders = allBookings.filter(b => b.status === 'in_attesa');
    const confirmedOrders = allBookings.filter(b => b.status === 'confermato' || b.status === 'completato');
    const todayRevenue = todayOrders
      .filter(b => b.status !== 'annullato')
      .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

    if (statTodayCount) statTodayCount.textContent = todayOrders.length;
    if (statPendingCount) statPendingCount.textContent = pendingOrders.length;
    if (statConfirmedCount) statConfirmedCount.textContent = confirmedOrders.length;
    if (statTodayRevenue) statTodayRevenue.textContent = todayRevenue.toFixed(2).replace('.', ',') + ' €';

    if (pendingOrdersBadge) {
      if (pendingOrders.length > 0) {
        pendingOrdersBadge.textContent = pendingOrders.length;
        pendingOrdersBadge.style.display = 'inline-block';
      } else {
        pendingOrdersBadge.style.display = 'none';
      }
    }

    // Customer Stats
    const custToday = allCustomers.filter(c => c.lastOrderDate === todayStr).length;
    const custVip = allCustomers.filter(c => c.isVip).length;
    const custTotalSpent = allCustomers.reduce((sum, c) => sum + c.totalSpent, 0);

    if (statCustTotal) statCustTotal.textContent = allCustomers.length;
    if (statCustToday) statCustToday.textContent = custToday;
    if (statCustVip) statCustVip.textContent = custVip;
    if (statCustRevenue) statCustRevenue.textContent = custTotalSpent.toFixed(2).replace('.', ',') + ' €';

    if (totalClientsBadge) {
      totalClientsBadge.textContent = allCustomers.length;
      totalClientsBadge.style.display = allCustomers.length > 0 ? 'inline-block' : 'none';
    }
  }

  // ---------------- TAB SWITCHING ----------------

  window.adminSwitchTab = function(tabId) {
    activeTab = tabId;
    document.querySelectorAll('.adm-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-panel').forEach(p => {
      p.style.display = (p.id === tabId) ? 'block' : 'none';
    });

    if (tabId === 'customersTab') renderCustomersTable();
    if (tabId === 'menuTab') renderMenuEditor();
    if (tabId === 'bookingsTab') renderBookings();
  };

  // ---------------- BOOKINGS TAB ----------------

  window.adminSetDateFilter = function(filter) {
    dateFilter = filter;
    document.querySelectorAll('#dateFilterGroup .btn-filter-date').forEach(b => {
      b.classList.toggle('active', b.dataset.date === filter);
    });
    const customDate = document.getElementById('customDateFilter');
    if (customDate) customDate.value = '';
    renderBookings();
  };

  window.adminSetCustomDate = function(val) {
    dateFilter = val;
    document.querySelectorAll('#dateFilterGroup .btn-filter-date').forEach(b => b.classList.remove('active'));
    renderBookings();
  };

  window.adminSetStatusFilter = function(status) {
    statusFilter = status;
    renderBookings();
  };

  window.adminSearchBookings = function(query) {
    searchQuery = (query || '').toLowerCase().trim();
    renderBookings();
  };

  // Inline Comanda Editing State
  let inlineEditingBookingId = null;
  let inlineTempItems = [];
  let inlineTempHasFidelity = false;
  let inlineTempFidDiscount = 2.00;
  let inlineTempOrderType = 'ritiro';

  function renderBookings() {
    if (!bookingsGrid) return;

    const todayStr = getTodayDateString();
    const tomorrowStr = getTomorrowDateString();

    const filtered = allBookings.filter(b => {
      if (dateFilter === 'today' && b.pickupDate !== todayStr) return false;
      if (dateFilter === 'tomorrow' && b.pickupDate !== tomorrowStr) return false;
      if (dateFilter !== 'all' && dateFilter !== 'today' && dateFilter !== 'tomorrow' && b.pickupDate !== dateFilter) return false;

      if (statusFilter !== 'all' && b.status !== statusFilter) return false;

      if (searchQuery) {
        const matchesName = b.customerName && b.customerName.toLowerCase().includes(searchQuery);
        const matchesPhone = b.customerPhone && b.customerPhone.includes(searchQuery);
        const matchesCode = b.code && b.code.toLowerCase().includes(searchQuery);
        if (!matchesName && !matchesPhone && !matchesCode) return false;
      }

      return true;
    });

    if (bookingsCountBadge) {
      bookingsCountBadge.textContent = `${filtered.length} ${filtered.length === 1 ? 'prenotazione' : 'prenotazioni'}`;
    }

    if (filtered.length === 0) {
      bookingsGrid.innerHTML = `
        <div class="empty-orders-box">
          <i class="fa-solid fa-clipboard-list"></i>
          <h4>Nessuna prenotazione trovata</h4>
          <p>Nessun ordine corrisponde ai filtri selezionati.</p>
        </div>
      `;
      return;
    }

    bookingsGrid.innerHTML = filtered.map(b => {
      const bId = b.id || b.code;

      // 1. INLINE EDITING CARD: If this booking is being edited directly in place
      if (inlineEditingBookingId && (String(b.id) === String(inlineEditingBookingId) || String(b.code) === String(inlineEditingBookingId))) {
        let itemsSub = 0;
        inlineTempItems.forEach(it => {
          itemsSub += (it.quantity || 1) * Number(it.price || 0);
        });
        const isDeliv = (inlineTempOrderType === 'domicilio');
        const delivFee = isDeliv ? 2.00 : 0.00;
        const fidDisc = inlineTempHasFidelity ? Math.max(0, Number(inlineTempFidDiscount) || 0) : 0;
        const finalTot = Math.max(0, itemsSub + delivFee - fidDisc);

        return `
          <div class="booking-admin-card" style="border:2px solid var(--gold-primary); background:#201916; box-shadow:0 0 24px rgba(212,175,55,0.4); padding:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(212,175,55,0.3); padding-bottom:8px; margin-bottom:12px;">
              <h4 style="margin:0; color:var(--gold-light); font-size:1.05rem; display:flex; align-items:center; gap:6px;">
                <i class="fa-solid fa-pen-to-square text-gold"></i> Modifica Comanda <strong>${b.code}</strong>
              </h4>
              <span class="bkg-code-tag">${b.code}</span>
            </div>

            <!-- Client Info Inputs -->
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:8px; margin-bottom:10px;">
              <div>
                <label style="font-size:0.75rem; color:var(--text-muted); font-weight:700; display:block;">Nome Cliente:</label>
                <input type="text" id="inlineEditCustName" value="${escapeHtml(b.customerName)}" style="width:100%; padding:7px 10px; background:#120e0d; border:1px solid var(--border-color); border-radius:4px; color:#fff; font-weight:700;">
              </div>
              <div>
                <label style="font-size:0.75rem; color:var(--text-muted); font-weight:700; display:block;">Telefono:</label>
                <input type="tel" id="inlineEditCustPhone" value="${escapeHtml(b.customerPhone)}" style="width:100%; padding:7px 10px; background:#120e0d; border:1px solid var(--border-color); border-radius:4px; color:#fff;">
              </div>
              <div>
                <label style="font-size:0.75rem; color:var(--text-muted); font-weight:700; display:block;">Data Ritiro:</label>
                <input type="date" id="inlineEditPickupDate" value="${b.pickupDate}" style="width:100%; padding:7px 10px; background:#120e0d; border:1px solid var(--border-color); border-radius:4px; color:#fff;">
              </div>
              <div>
                <label style="font-size:0.75rem; color:var(--text-muted); font-weight:700; display:block;">Orario Ritiro:</label>
                <input type="text" id="inlineEditPickupTime" value="${escapeHtml(b.pickupTime)}" style="width:100%; padding:7px 10px; background:#120e0d; border:1px solid var(--border-color); border-radius:4px; color:#fff;">
              </div>
            </div>

            <!-- Order Type & Address -->
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:8px; margin-bottom:10px;">
              <div>
                <label style="font-size:0.75rem; color:var(--text-muted); font-weight:700; display:block;">Modalità:</label>
                <select id="inlineEditOrderType" onchange="window.adminInlineToggleDelivery(this.value)" style="width:100%; padding:7px 10px; background:#120e0d; border:1px solid var(--border-color); border-radius:4px; color:#fff;">
                  <option value="ritiro" ${!isDeliv ? 'selected' : ''}>🏪 Ritiro in Sede (Asporto)</option>
                  <option value="domicilio" ${isDeliv ? 'selected' : ''}>🛵 Consegna a Domicilio (+2,00 €)</option>
                </select>
              </div>
              <div id="inlineEditAddressWrapper" style="display:${isDeliv ? 'block' : 'none'};">
                <label style="font-size:0.75rem; color:var(--text-muted); font-weight:700; display:block;">Indirizzo Consegna:</label>
                <input type="text" id="inlineEditAddress" value="${escapeHtml(b.deliveryAddress || '')}" placeholder="Via, civico, piano..." style="width:100%; padding:7px 10px; background:#120e0d; border:1px solid var(--border-color); border-radius:4px; color:#fff;">
              </div>
            </div>

            <!-- Piatti Ordinati nella Comanda con Stepper + e - -->
            <div style="background:#140f0e; border:1px solid var(--border-color); border-radius:8px; padding:10px; margin-bottom:10px;">
              <div style="font-size:0.8rem; font-weight:800; color:var(--gold-light); margin-bottom:6px; display:flex; justify-content:space-between;">
                <span><i class="fa-solid fa-utensils"></i> Piatti nella Comanda:</span>
                <span>Subtotale: <strong id="inlineItemsSubtotalVal">${itemsSub.toFixed(2).replace('.', ',')} €</strong></span>
              </div>
              
              <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:8px;">
                ${inlineTempItems.map((it, idx) => `
                  <div style="display:flex; justify-content:space-between; align-items:center; background:#1d1715; border:1px solid rgba(255,255,255,0.06); padding:6px 8px; border-radius:4px;">
                    <div style="flex:1;">
                      <span style="color:#fff; font-weight:700; font-size:0.85rem;">${escapeHtml(it.name)}</span>
                      <div style="font-size:0.72rem; color:var(--text-muted);">${Number(it.price).toFixed(2).replace('.', ',')} € cad.</div>
                    </div>
                    <div style="display:flex; align-items:center; gap:5px;">
                      <button type="button" onclick="window.adminInlineChangeQty(${idx}, -1)" style="width:26px; height:26px; background:#2a201c; border:1px solid var(--border-color); color:#fff; border-radius:4px; font-weight:800; cursor:pointer;">-</button>
                      <span style="font-weight:800; min-width:20px; text-align:center; color:var(--gold-light);">${it.quantity}</span>
                      <button type="button" onclick="window.adminInlineChangeQty(${idx}, 1)" style="width:26px; height:26px; background:#2a201c; border:1px solid var(--border-color); color:#fff; border-radius:4px; font-weight:800; cursor:pointer;">+</button>
                    </div>
                    <span style="min-width:50px; text-align:right; font-weight:800; color:var(--gold-light); margin:0 8px; font-size:0.85rem;">${((it.quantity || 1) * Number(it.price || 0)).toFixed(2).replace('.', ',')} €</span>
                    <button type="button" onclick="window.adminInlineRemoveItem(${idx})" style="background:rgba(231,76,60,0.2); border:1px solid #e74c3c; color:#e74c3c; width:26px; height:26px; border-radius:4px; cursor:pointer;"><i class="fa-solid fa-trash-can" style="font-size:0.75rem;"></i></button>
                  </div>
                `).join('')}
              </div>

              <!-- Aggiungi Piatto dal Menu -->
              <div style="display:flex; gap:6px;">
                <select id="inlineAddProductSelect" style="flex:1; padding:6px 8px; background:#120e0d; border:1px solid var(--border-color); border-radius:4px; color:#fff; font-size:0.82rem;">
                  <option value="">-- Aggiungi piatto dal catalogo --</option>
                  ${allProducts.map(p => `<option value="${p.id}">${escapeHtml(p.name)} (${Number(p.price).toFixed(2)} €)</option>`).join('')}
                </select>
                <button type="button" onclick="window.adminInlineAddProduct()" style="padding:6px 12px; background:var(--bg-surface); border:1px solid var(--border-color); color:var(--gold-light); font-weight:800; border-radius:4px; cursor:pointer; font-size:0.82rem;">
                  <i class="fa-solid fa-plus"></i> Aggiungi
                </button>
              </div>
            </div>

            <!-- Spunta e Sconto Carta Fedeltà -->
            <div style="background:rgba(212,175,55,0.08); border:1.5px solid var(--gold-primary); border-radius:8px; padding:10px; margin-bottom:10px;">
              <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:700; color:var(--gold-light); margin-bottom:6px;">
                <input type="checkbox" id="inlineEditHasFidelity" onchange="window.adminInlineToggleFidelity(this.checked)" ${inlineTempHasFidelity ? 'checked' : ''} style="width:18px; height:18px; accent-color:var(--gold-primary);">
                <span><i class="fa-solid fa-id-card text-gold"></i> <strong>Possessore Carta Fedeltà El Gallero</strong></span>
              </label>

              <div id="inlineFidelityGroup" style="display:${inlineTempHasFidelity ? 'block' : 'none'}; margin-top:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px;">
                  <span style="font-size:0.8rem; color:#fff;">Importo Sconto Dedicato (€):</span>
                  <input type="number" id="inlineEditFidDiscount" step="0.50" min="0" value="${inlineTempFidDiscount.toFixed(2)}" oninput="window.adminInlineRecalculateTotal()" style="width:90px; text-align:right; font-weight:800; color:#2ecc71; padding:4px 8px; background:#120e0d; border:1px solid var(--border-color); border-radius:4px;">
                </div>
                <div style="display:flex; gap:6px; flex-wrap:wrap;">
                  <span style="font-size:0.72rem; color:var(--text-muted);">Sconti rapidi:</span>
                  <button type="button" class="btn-disc-chip" onclick="window.adminInlineSetQuickDiscount(1.00)">-1,00 €</button>
                  <button type="button" class="btn-disc-chip" onclick="window.adminInlineSetQuickDiscount(2.00)">-2,00 €</button>
                  <button type="button" class="btn-disc-chip" onclick="window.adminInlineSetQuickDiscount(3.00)">-3,00 €</button>
                  <button type="button" class="btn-disc-chip" onclick="window.adminInlineSetQuickDiscount(5.00)">-5,00 €</button>
                  <button type="button" class="btn-disc-chip text-muted" onclick="window.adminInlineSetQuickDiscount(0)">Azzera</button>
                </div>
              </div>
            </div>

            <!-- Note -->
            <div style="margin-bottom:10px;">
              <label style="font-size:0.75rem; color:var(--text-muted); font-weight:700; display:block;">Note del cliente:</label>
              <textarea id="inlineEditNotes" rows="2" style="width:100%; padding:6px 8px; background:#120e0d; border:1px solid var(--border-color); border-radius:4px; color:#fff; font-size:0.82rem;">${escapeHtml(b.notes || '')}</textarea>
            </div>

            <!-- Totale Ricalcolato Live -->
            <div style="background:#15100e; border:1px dashed var(--gold-primary); border-radius:6px; padding:8px 12px; margin-bottom:12px; font-weight:800;">
              <div style="display:flex; justify-content:space-between; font-size:1.05rem;">
                <span style="color:#fff;">TOTALE RICALCOLATO:</span>
                <strong class="text-gold" id="inlineGrandTotalVal">${finalTot.toFixed(2).replace('.', ',')} €</strong>
              </div>
            </div>

            <!-- Action Buttons: Salva & Annulla -->
            <div style="display:flex; gap:8px; justify-content:flex-end;">
              <button type="button" onclick="window.adminCancelInlineEditBooking()" style="padding:9px 16px; background:var(--bg-surface); border:1px solid var(--border-color); color:var(--text-secondary); border-radius:6px; font-weight:700; cursor:pointer;">
                <i class="fa-solid fa-xmark"></i> Annulla
              </button>
              <button type="button" onclick="window.adminSaveInlineEditBooking('${bId}')" style="padding:9px 20px; background:var(--gold-gradient); border:none; color:#120e0d; border-radius:6px; font-weight:800; cursor:pointer; font-size:0.95rem; box-shadow:0 0 14px var(--gold-glow);">
                <i class="fa-solid fa-floppy-disk"></i> 💾 SALVA MODIFICHE COMANDA
              </button>
            </div>
          </div>
        `;
      }

      // 2. NORMAL BOOKING CARD DISPLAY
      const isPending = (b.status === 'in_attesa');
      const isConfirmed = (b.status === 'confermato');
      const isCompleted = (b.status === 'completato');
      const isCancelled = (b.status === 'annullato');

      let statusBadge = '<span class="status-pill pill-warning"><i class="fa-solid fa-clock"></i> In Attesa</span>';
      if (isConfirmed) statusBadge = '<span class="status-pill pill-green"><i class="fa-solid fa-circle-check"></i> Confermato</span>';
      if (isCompleted) statusBadge = '<span class="status-pill pill-blue"><i class="fa-solid fa-bag-shopping"></i> Ritirato/Consegnato</span>';
      if (isCancelled) statusBadge = '<span class="status-pill pill-red"><i class="fa-solid fa-ban"></i> Annullato</span>';

      const isDelivery = (b.orderType === 'domicilio');
      const fidDisc = Number(b.fidelityDiscount || 0);

      return `
        <div class="booking-admin-card ${isPending ? 'card-pending-glow' : ''}">
          <div class="bkg-card-top">
            <div>
              <span class="bkg-code-tag">${b.code}</span>
              <h4 class="bkg-cust-name"><i class="fa-solid fa-user text-gold"></i> ${escapeHtml(b.customerName)}</h4>
            </div>
            <div>${statusBadge}</div>
          </div>

          <div class="bkg-time-highlight">
            <div>
              <span class="bkg-time-label">Data e Orario:</span>
              <strong class="bkg-time-val">${formatDateIt(b.pickupDate)} • Ore ${b.pickupTime}</strong>
            </div>
            <span class="bkg-mode-badge">${isDelivery ? '🛵 Domicilio' : '🏪 Ritiro'}</span>
          </div>

          ${isDelivery && b.deliveryAddress ? `
            <div class="bkg-address-box">
              <i class="fa-solid fa-location-dot text-gold"></i>
              <span>${escapeHtml(b.deliveryAddress)}</span>
            </div>
          ` : ''}

          <!-- Fidelity Card Badge -->
          ${(b.hasFidelityCard || fidDisc > 0) ? `
            <div class="bkg-fidelity-pill-row" style="margin-bottom:8px;">
              <span class="badge-fidelity-active" style="background:rgba(212,175,55,0.18); border:1px solid var(--gold-primary); color:var(--gold-light); font-size:0.75rem; font-weight:800; padding:2px 8px; border-radius:4px; display:inline-flex; align-items:center; gap:5px;">
                <i class="fa-solid fa-id-card text-gold"></i> Possessore Carta Fedeltà ${fidDisc > 0 ? `(Sconto applicato: -${fidDisc.toFixed(2)} €)` : ''}
              </span>
            </div>
          ` : ''}

          <div class="bkg-items-list">
            ${(b.items || []).map(it => `
              <div class="bkg-item-row">
                <span><strong>${it.quantity}x</strong> ${escapeHtml(it.name)}</span>
                <span>${(Number(it.subtotal || it.quantity * it.price)).toFixed(2).replace('.', ',')} €</span>
              </div>
            `).join('')}
          </div>

          ${fidDisc > 0 ? `
            <div style="display:flex; justify-content:space-between; font-size:0.82rem; color:#2ecc71; font-weight:700; margin-bottom:4px;">
              <span>Sconto Carta Fedeltà:</span>
              <span>- ${fidDisc.toFixed(2).replace('.', ',')} €</span>
            </div>
          ` : ''}

          ${b.notes ? `
            <div class="bkg-notes-box">
              <i class="fa-regular fa-comment-dots text-gold"></i>
              <em>"${escapeHtml(b.notes)}"</em>
            </div>
          ` : ''}

          ${b.adminNotes ? `
            <div style="background:rgba(52,152,219,0.1); border-left:3px solid #3498db; padding:4px 8px; font-size:0.78rem; color:#d2e5f5; margin-bottom:8px;">
              <i class="fa-solid fa-clipboard-user"></i> <strong>Nota interna:</strong> ${escapeHtml(b.adminNotes)}
            </div>
          ` : ''}

          <div class="bkg-total-bar">
            <span>Totale da incassare:</span>
            <strong class="text-gold" style="font-size:1.2rem;">${Number(b.totalAmount).toFixed(2).replace('.', ',')} €</strong>
          </div>

          <!-- Actions Grid with Modifica Comanda -->
          <div class="bkg-actions-grid">
            <button type="button" class="btn-adm-edit-comanda" onclick="window.adminOpenEditBooking('${bId}')" style="grid-column:1 / -1; background:rgba(212,175,55,0.18); border:1px solid var(--gold-primary); color:var(--gold-light); font-weight:800; padding:8px 12px; border-radius:6px; cursor:pointer;">
              <i class="fa-solid fa-pen-to-square text-gold"></i> Modifica Comanda & Sconto Fedeltà
            </button>

            <button type="button" class="btn-adm-wa" onclick="window.adminContactClientWA('${bId}')" title="Invia riepilogo con sconto e consegna su WhatsApp">
              <i class="fa-brands fa-whatsapp"></i> WhatsApp
            </button>
            
            <button type="button" class="btn-adm-delete-bkg" onclick="window.adminDeleteBooking('${bId}', '${b.code}', '${escapeHtml(b.customerName)}')" title="Elimina definitivamente questa comanda">
              <i class="fa-solid fa-trash-can"></i> Elimina Comanda
            </button>

            ${isPending ? `
              <button type="button" class="btn-adm-confirm" onclick="window.adminUpdateBookingStatus('${bId}', 'confermato')">
                <i class="fa-solid fa-check"></i> Conferma
              </button>
            ` : !isCompleted ? `
              <button type="button" class="btn-adm-complete" onclick="window.adminUpdateBookingStatus('${bId}', 'completato')">
                <i class="fa-solid fa-circle-check"></i> Segna Ritirato
              </button>
            ` : `
              <button type="button" class="btn-adm-reopen" onclick="window.adminUpdateBookingStatus('${bId}', 'in_attesa')">
                <i class="fa-solid fa-rotate-left"></i> Riapri
              </button>
            `}

            ${!isCancelled ? `
              <button type="button" class="btn-adm-cancel" onclick="window.adminUpdateBookingStatus('${bId}', 'annullato')" title="Annulla ordine">
                <i class="fa-solid fa-xmark"></i>
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  window.adminUpdateBookingStatus = async function(idOrCode, newStatus) {
    const idx = allBookings.findIndex(b => b.id === idOrCode || b.code === idOrCode);
    if (idx !== -1) {
      allBookings[idx].status = newStatus;
      if (newStatus === 'confermato') allBookings[idx].statusText = 'Confermata';
      if (newStatus === 'completato') allBookings[idx].statusText = 'Completata / Consegnata';
      if (newStatus === 'annullato') allBookings[idx].statusText = 'Annullata';
      if (newStatus === 'in_attesa') allBookings[idx].statusText = 'In attesa di conferma';

      try {
        localStorage.setItem('el_gallero_bookings', JSON.stringify(allBookings));
        const store = JSON.parse(localStorage.getItem('el_gallero_data') || '{}');
        store.bookings = allBookings;
        localStorage.setItem('el_gallero_data', JSON.stringify(store));
      } catch (e) {}

      computeCustomersFromBookings();
      renderBookings();
      renderCustomersTable();
      updateStatsUI();
      showAdminToast(`✅ Prenotazione ${allBookings[idx].code} confermata con successo!`);
    }

    try {
      await fetch(`/api/admin/bookings/${encodeURIComponent(idOrCode)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (e) {}
  };

  function buildWhatsAppConfirmationMessage(b) {
    if (!b) return '';
    const isDelivery = (b.orderType === 'domicilio');
    const deliveryFee = isDelivery ? (Number(b.deliveryFee) || 2.00) : 0.00;
    const itemsSub = Number(b.itemsSubtotal || (b.items || []).reduce((s, it) => s + (it.quantity * it.price), 0));
    const fidelityDisc = Number(b.fidelityDiscount || 0);
    const totalAmount = Number(b.totalAmount || Math.max(0, itemsSub + deliveryFee - fidelityDisc));

    let text = `🔥 *EL GALLERO - GIRARROSTO 100% COTTO A LEGNA* 🔥\n`;
    text += `📍 *Casavatore in Via E. A. Mario, 30*\n`;
    text += `📞 *Tel / WhatsApp:* 377 5975734\n\n`;
    text += `✅ *PRENOTAZIONE CONFERMATA*\n`;
    text += `🎫 *Codice Comanda:* *${b.code || 'EG-0000'}*\n`;
    text += `👤 *Cliente:* ${b.customerName || 'Gentile Cliente'}\n`;
    text += `⏰ *Data & Orario:* ${formatDateIt(b.pickupDate)} alle ore *${b.pickupTime}*\n`;
    text += `🛵 *Modalità:* ${isDelivery ? 'Consegna a Domicilio' : 'Ritiro in Sede (Asporto)'}\n`;
    if (isDelivery && b.deliveryAddress) {
      text += `🏠 *Indirizzo Consegna:* ${b.deliveryAddress}\n`;
    }
    if (b.hasFidelityCard) {
      text += `💳 *Carta Fedeltà:* Possessore Registrato\n`;
    }

    text += `\n📋 *RIEPILOGO PIATTI ACQUISTATI:*\n`;
    (b.items || []).forEach(it => {
      const sub = (it.quantity * it.price).toFixed(2).replace('.', ',');
      text += `• ${it.quantity}x ${it.name} (${sub} €)\n`;
    });

    text += `\n🧾 *DETTAGLIO CONTO:*\n`;
    text += `▫️ *Subtotale Piatti:* ${itemsSub.toFixed(2).replace('.', ',')} €\n`;
    if (isDelivery) {
      text += `▫️ *Spese Consegna a Domicilio:* +${deliveryFee.toFixed(2).replace('.', ',')} €\n`;
    }
    if (fidelityDisc > 0) {
      text += `▫️ *Sconto Carta Fedeltà El Gallero:* -${fidelityDisc.toFixed(2).replace('.', ',')} €\n`;
    }
    text += `───────────────────────\n`;
    text += `💰 *TOTALE DA PAGARE:* *${totalAmount.toFixed(2).replace('.', ',')} €*\n`;

    if (b.notes) {
      text += `\n📝 *Note per la cottura:* ${b.notes}\n`;
    }

    text += `\nGrazie per aver scelto *El Gallero*! Il tuo ordine è confermato e pronto per la cottura a legna. 🍗🔥`;
    return text;
  }

  window.adminContactClientWA = function(idOrCode) {
    const b = allBookings.find(it => it.id === idOrCode || it.code === idOrCode);
    if (!b) return;

    const cleanPhone = (b.customerPhone || '').replace(/\D/g, '');
    const text = buildWhatsAppConfirmationMessage(b);
    const url = cleanPhone ? `https://wa.me/39${cleanPhone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  window.adminConfirmBookingWithWA = async function(idOrCode) {
    await window.adminUpdateBookingStatus(idOrCode, 'confermato');
    window.adminContactClientWA(idOrCode);
    showAdminToast('✅ Prenotazione confermata e riepilogo inviato su WhatsApp!');
  };

  window.adminContactRubricaClientWA = function(cleanPhone, lastOrderCode) {
    const b = allBookings.find(it => it.code === lastOrderCode || it.id === lastOrderCode);
    if (b) {
      const text = buildWhatsAppConfirmationMessage(b);
      const url = cleanPhone ? `https://wa.me/39${cleanPhone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    } else {
      const text = `Ciao! Ti contattiamo da *EL GALLERO - 100% Cotto a Legna* (Casavatore in Via E. A. Mario, 30). Restiamo a tua completa disposizione! 🔥🍗`;
      const url = cleanPhone ? `https://wa.me/39${cleanPhone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    }
  };

  window.adminDeleteBooking = async function(idOrCode, code, name) {
    if (!confirm(`⚠️ Sei sicuro di voler eliminare definitivamente la comanda ${code} di "${name}"?`)) {
      return;
    }

    allBookings = allBookings.filter(b => b.id !== idOrCode && b.code !== idOrCode);

    try {
      localStorage.setItem('el_gallero_bookings', JSON.stringify(allBookings));
      const store = JSON.parse(localStorage.getItem('el_gallero_data') || '{}');
      store.bookings = allBookings;
      localStorage.setItem('el_gallero_data', JSON.stringify(store));
    } catch (e) {}

    computeCustomersFromBookings();
    renderBookings();
    renderCustomersTable();
    updateStatsUI();
    showAdminToast(`🗑️ Comanda ${code} eliminata con successo.`);

    try {
      await fetch(`/api/admin/bookings/${encodeURIComponent(idOrCode)}`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': adminPin }
      });
    } catch (err) {}
  };

  // ---------------- MODIFICA COMANDA & SCONTO CARTA FEDELTÀ (DIRETTA NEL RIQUADRO) ----------------

  window.adminOpenEditBooking = function(idOrCode) {
    const b = allBookings.find(it => String(it.id) === String(idOrCode) || String(it.code) === String(idOrCode) || (it._id && String(it._id) === String(idOrCode)));
    if (!b) return;

    inlineEditingBookingId = b.id || b.code;
    inlineTempItems = Array.isArray(b.items) ? JSON.parse(JSON.stringify(b.items)) : [];
    inlineTempHasFidelity = Boolean(b.hasFidelityCard || (b.fidelityDiscount && Number(b.fidelityDiscount) > 0));
    inlineTempFidDiscount = Number(b.fidelityDiscount || 2.00);
    inlineTempOrderType = b.orderType || 'ritiro';

    renderBookings();
    
    setTimeout(() => {
      const el = document.getElementById('inlineEditCustName');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  };

  window.adminCancelInlineEditBooking = function() {
    inlineEditingBookingId = null;
    inlineTempItems = [];
    renderBookings();
  };

  window.adminInlineChangeQty = function(idx, delta) {
    if (!inlineTempItems[idx]) return;
    inlineTempItems[idx].quantity = (inlineTempItems[idx].quantity || 1) + delta;
    if (inlineTempItems[idx].quantity <= 0) {
      inlineTempItems.splice(idx, 1);
    }
    renderBookings();
  };

  window.adminInlineRemoveItem = function(idx) {
    if (!inlineTempItems[idx]) return;
    inlineTempItems.splice(idx, 1);
    renderBookings();
  };

  window.adminInlineAddProduct = function() {
    const select = document.getElementById('inlineAddProductSelect');
    if (!select || !select.value) return;

    const prod = allProducts.find(p => p.id === select.value);
    if (!prod) return;

    const existingIdx = inlineTempItems.findIndex(it => it.id === prod.id || it.name === prod.name);
    if (existingIdx !== -1) {
      inlineTempItems[existingIdx].quantity = (inlineTempItems[existingIdx].quantity || 1) + 1;
    } else {
      inlineTempItems.push({
        id: prod.id,
        name: prod.name,
        category: prod.category || 'pollo',
        price: Number(prod.price),
        quantity: 1,
        subtotal: Number(prod.price)
      });
    }

    renderBookings();
    showAdminToast(`Aggiunto alla comanda: ${prod.name}`);
  };

  window.adminInlineToggleDelivery = function(val) {
    inlineTempOrderType = val;
    const wrapper = document.getElementById('inlineEditAddressWrapper');
    if (wrapper) wrapper.style.display = (val === 'domicilio') ? 'block' : 'none';
    window.adminInlineRecalculateTotal();
  };

  window.adminInlineToggleFidelity = function(checked) {
    inlineTempHasFidelity = checked;
    const group = document.getElementById('inlineFidelityGroup');
    if (group) group.style.display = checked ? 'block' : 'none';
    if (checked && inlineTempFidDiscount <= 0) {
      inlineTempFidDiscount = 2.00;
      const input = document.getElementById('inlineEditFidDiscount');
      if (input) input.value = '2.00';
    }
    window.adminInlineRecalculateTotal();
  };

  window.adminInlineSetQuickDiscount = function(val) {
    inlineTempFidDiscount = Number(val);
    inlineTempHasFidelity = (val > 0);
    const check = document.getElementById('inlineEditHasFidelity');
    if (check) check.checked = inlineTempHasFidelity;
    const group = document.getElementById('inlineFidelityGroup');
    if (group) group.style.display = inlineTempHasFidelity ? 'block' : 'none';
    const input = document.getElementById('inlineEditFidDiscount');
    if (input) input.value = Number(val).toFixed(2);
    window.adminInlineRecalculateTotal();
  };

  window.adminInlineRecalculateTotal = function() {
    let itemsSub = 0;
    inlineTempItems.forEach(it => {
      itemsSub += (it.quantity || 1) * Number(it.price || 0);
    });

    const isDeliv = (inlineTempOrderType === 'domicilio');
    const delivFee = isDeliv ? 2.00 : 0.00;

    const inputDisc = document.getElementById('inlineEditFidDiscount');
    if (inputDisc) inlineTempFidDiscount = parseFloat(inputDisc.value) || 0;

    const fidDisc = inlineTempHasFidelity ? Math.max(0, inlineTempFidDiscount) : 0;
    const finalTot = Math.max(0, itemsSub + delivFee - fidDisc);

    const subEl = document.getElementById('inlineItemsSubtotalVal');
    if (subEl) subEl.textContent = itemsSub.toFixed(2).replace('.', ',') + ' €';

    const grandEl = document.getElementById('inlineGrandTotalVal');
    if (grandEl) grandEl.textContent = finalTot.toFixed(2).replace('.', ',') + ' €';
  };

  window.adminSaveInlineEditBooking = async function(idOrCode) {
    if (inlineTempItems.length === 0) {
      alert('⚠️ La comanda deve contenere almeno un piatto.');
      return;
    }

    const b = allBookings.find(it => String(it.id) === String(idOrCode) || String(it.code) === String(idOrCode));
    if (!b) return;

    const custName = document.getElementById('inlineEditCustName') ? document.getElementById('inlineEditCustName').value.trim() : b.customerName;
    const custPhone = document.getElementById('inlineEditCustPhone') ? document.getElementById('inlineEditCustPhone').value.trim() : b.customerPhone;
    const pickupDate = document.getElementById('inlineEditPickupDate') ? document.getElementById('inlineEditPickupDate').value : b.pickupDate;
    const pickupTime = document.getElementById('inlineEditPickupTime') ? document.getElementById('inlineEditPickupTime').value.trim() : b.pickupTime;
    const orderType = inlineTempOrderType;
    const address = document.getElementById('inlineEditAddress') ? document.getElementById('inlineEditAddress').value.trim() : (b.deliveryAddress || '');
    const notes = document.getElementById('inlineEditNotes') ? document.getElementById('inlineEditNotes').value.trim() : (b.notes || '');

    const inputDisc = document.getElementById('inlineEditFidDiscount');
    if (inputDisc) inlineTempFidDiscount = parseFloat(inputDisc.value) || 0;

    let itemsSub = 0;
    const validatedItems = inlineTempItems.map(it => {
      const q = parseInt(it.quantity, 10) || 1;
      const p = Number(it.price || 0);
      const sub = Number((q * p).toFixed(2));
      itemsSub += sub;
      return {
        id: it.id,
        name: it.name,
        category: it.category || 'pollo',
        price: p,
        quantity: q,
        subtotal: sub
      };
    });

    const isDeliv = (orderType === 'domicilio');
    const delivFee = isDeliv ? 2.00 : 0.00;
    const fidDisc = inlineTempHasFidelity ? Math.max(0, inlineTempFidDiscount) : 0;
    const totalAmount = Math.max(0, Number((itemsSub + delivFee - fidDisc).toFixed(2)));

    const payload = {
      customerName: custName,
      customerPhone: custPhone,
      pickupDate: pickupDate,
      pickupTime: pickupTime,
      orderType: orderType,
      deliveryAddress: isDeliv ? address : '',
      deliveryFee: delivFee,
      hasFidelityCard: inlineTempHasFidelity,
      fidelityDiscount: fidDisc,
      items: validatedItems,
      itemsSubtotal: Number(itemsSub.toFixed(2)),
      notes: notes,
      totalAmount: totalAmount
    };

    const idx = allBookings.findIndex(it => String(it.id) === String(idOrCode) || String(it.code) === String(idOrCode));
    if (idx !== -1) {
      allBookings[idx] = {
        ...allBookings[idx],
        ...payload
      };

      try {
        localStorage.setItem('el_gallero_bookings', JSON.stringify(allBookings));
        const store = JSON.parse(localStorage.getItem('el_gallero_data') || '{}');
        store.bookings = allBookings;
        localStorage.setItem('el_gallero_data', JSON.stringify(store));
      } catch (e) {}
    }

    try {
      await fetch(`/api/admin/bookings/${encodeURIComponent(b.id || b.code)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify(payload)
      });
    } catch (err) {}

    inlineEditingBookingId = null;
    inlineTempItems = [];

    computeCustomersFromBookings();
    renderBookings();
    renderCustomersTable();
    updateStatsUI();
    showAdminToast(`✅ Comanda ${b.code} e Sconto Fedeltà (${fidDisc.toFixed(2)} €) salvati!`);
  };

  // ---------------- RUBRICA CLIENTI ----------------

  window.adminSetCustFilter = function(filter) {
    custFilter = filter;
    document.querySelectorAll('#custFilterGroup .btn-filter-cust').forEach(b => {
      b.classList.toggle('active', b.dataset.custFilter === filter);
    });
    renderCustomersTable();
  };

  window.adminSearchCustomers = function(query) {
    custSearchQuery = (query || '').toLowerCase().trim();
    renderCustomersTable();
  };

  function renderCustomersTable() {
    if (!custTableBody) return;

    const todayStr = getTodayDateString();

    const filtered = allCustomers.filter(c => {
      if (custFilter === 'today' && c.lastOrderDate !== todayStr) return false;
      if (custFilter === 'vip' && !c.isVip) return false;

      if (custSearchQuery) {
        const matchesName = c.name && c.name.toLowerCase().includes(custSearchQuery);
        const matchesPhone = c.phone && c.phone.includes(custSearchQuery);
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
          <td colspan="8" style="text-align:center; padding:32px; color:var(--text-muted);">
            <i class="fa-solid fa-user-slash" style="font-size:2rem; margin-bottom:8px; display:block;"></i>
            Nessun cliente presente nei filtri selezionati.
          </td>
        </tr>
      `;
      return;
    }

    custTableBody.innerHTML = filtered.map(c => {
      const cleanPhone = (c.cleanPhone || c.phone.replace(/\D/g, ''));
      const isDelivery = (c.lastOrderType === 'domicilio');

      return `
        <tr>
          <td>
            <div class="cust-cell-name">
              <i class="fa-solid fa-circle-user text-gold"></i>
              <div>
                <strong>${escapeHtml(c.name)}</strong>
                ${c.hasFidelityCard ? '<span style="color:var(--gold-light); font-size:0.75rem; margin-left:4px;" title="Possessore Carta Fedeltà"><i class="fa-solid fa-id-card"></i></span>' : ''}
                ${c.isVip ? '<span class="vip-badge-star">★ VIP</span>' : ''}
              </div>
            </div>
          </td>
          <td>
            <a href="tel:${cleanPhone}" class="cust-phone-link">
              <i class="fa-solid fa-phone"></i> ${escapeHtml(c.phone)}
            </a>
          </td>
          <td style="text-align:center;">
            <span class="cust-orders-count">${c.totalOrders}</span>
          </td>
          <td>
            <div>${formatDateIt(c.lastOrderDate)}</div>
            <small style="color:var(--text-muted);">Ore ${c.lastOrderTime} (${c.lastOrderCode})</small>
          </td>
          <td>
            ${isDelivery ? `<span title="${escapeHtml(c.lastDeliveryAddress)}">🛵 Domicilio</span>` : '🏪 Ritiro'}
          </td>
          <td style="text-align:right; font-weight:800; color:#2ecc71;">
            ${c.totalSpent.toFixed(2).replace('.', ',')} €
          </td>
          <td style="text-align:center;" class="no-print">
            <button type="button" class="btn-cust-wa" onclick="window.adminContactRubricaClientWA('${cleanPhone}', '${c.lastOrderCode}')" title="Invia messaggio/riepilogo su WhatsApp">
              <i class="fa-brands fa-whatsapp"></i>
            </button>
          </td>
          <td style="text-align:center;" class="no-print">
            <button type="button" class="btn-cust-del" onclick="window.adminDeleteCustomer('${cleanPhone || c.phone}', '${escapeHtml(c.name)}')" title="Elimina cliente">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Delete Single Customer
  window.adminDeleteCustomer = async function(phoneOrId, name) {
    if (!confirm(`⚠️ Sei sicuro di voler eliminare il cliente "${name}" dalla Rubrica?\n\nVerranno eliminate anche le prenotazioni registrate con questo recapito.`)) {
      return;
    }

    const cleanTarget = String(phoneOrId).replace(/\D/g, '');

    allBookings = allBookings.filter(b => {
      const bPhone = (b.customerPhone || '').replace(/\D/g, '');
      const bName = (b.customerName || '').toLowerCase().trim();
      if (cleanTarget && bPhone === cleanTarget) return false;
      if (b.customerPhone === phoneOrId || bName === name.toLowerCase().trim()) return false;
      return true;
    });

    try {
      localStorage.setItem('el_gallero_bookings', JSON.stringify(allBookings));
      const store = JSON.parse(localStorage.getItem('el_gallero_data') || '{}');
      store.bookings = allBookings;
      localStorage.setItem('el_gallero_data', JSON.stringify(store));
    } catch (e) {}

    computeCustomersFromBookings();
    renderCustomersTable();
    renderBookings();
    updateStatsUI();
    showAdminToast(`🗑️ Cliente "${name}" rimosso dalla rubrica.`);

    try {
      await fetch(`/api/admin/customers/${encodeURIComponent(phoneOrId)}`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': adminPin }
      });
    } catch (err) {}
  };

  // Clear All Rubrica
  window.handleClearRubrica = async function() {
    if (!confirm('⚠️ ATTENZIONE: Sei sicuro di voler cancellare e svuotare completamente l\'intera Rubrica Clienti?\n\nTutte le anagrafiche e lo storico ordini verranno azzerati.')) {
      return;
    }

    allCustomers = [];
    allBookings = [];

    try {
      localStorage.removeItem('el_gallero_bookings');
      localStorage.removeItem('el_gallero_customers');
      const store = JSON.parse(localStorage.getItem('el_gallero_data') || '{}');
      store.bookings = [];
      localStorage.setItem('el_gallero_data', JSON.stringify(store));
    } catch (e) {}

    renderCustomersTable();
    renderBookings();
    updateStatsUI();
    showAdminToast('🗑️ Rubrica Clienti azzerata con successo.');

    try {
      await fetch('/api/admin/customers/clear', {
        method: 'POST',
        headers: { 'x-admin-pin': adminPin }
      });
    } catch (err) {}
  };

  // Export to Excel (.xlsx)
  window.exportCustomersToExcel = function() {
    if (allCustomers.length === 0) {
      alert('Nessun cliente presente nella rubrica da esportare.');
      return;
    }

    const todayStr = getTodayDateString();

    if (typeof XLSX !== 'undefined') {
      try {
        const rows = allCustomers.map(c => ({
          "Nome e Cognome": c.name || '',
          "Telefono": c.phone || '',
          "Ordini Totali": c.totalOrders || 0,
          "Ultima Prenotazione": c.lastOrderDate || '',
          "Orario": c.lastOrderTime || '',
          "Codice Ordine": c.lastOrderCode || '',
          "Modalità": (c.lastOrderType === 'domicilio') ? 'Consegna a Domicilio' : 'Ritiro in Sede (Asporto)',
          "Indirizzo Consegna": c.lastDeliveryAddress || '',
          "Spesa Totale (€)": Number((c.totalSpent || 0).toFixed(2)),
          "Carta Fedeltà": c.hasFidelityCard ? 'SI' : 'NO',
          "Cliente VIP": c.isVip ? 'SI' : 'NO'
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);

        ws['!cols'] = [
          { wch: 25 }, { wch: 18 }, { wch: 14 }, { wch: 20 },
          { wch: 14 }, { wch: 16 }, { wch: 24 }, { wch: 30 },
          { wch: 16 }, { wch: 14 }, { wch: 12 }
        ];

        XLSX.utils.book_append_sheet(wb, ws, "Rubrica Clienti");
        XLSX.writeFile(wb, `El_Gallero_Rubrica_Clienti_${todayStr}.xlsx`);
        showAdminToast('📊 File Excel (.xlsx) scaricato con successo!');
        return;
      } catch (e) {
        console.warn('XLSX export failed:', e);
      }
    }

    // CSV Fallback
    let csv = '\uFEFFNome Cliente;Telefono;Ordini Totali;Ultima Prenotazione;Orario;Codice;Modalita;Indirizzo;Totale Speso (EUR);Carta Fedelta;VIP\r\n';
    allCustomers.forEach(c => {
      csv += `"${c.name}";"${c.phone}";${c.totalOrders};"${c.lastOrderDate}";"${c.lastOrderTime}";"${c.lastOrderCode}";"${c.lastOrderType}";"${c.lastDeliveryAddress || ''}";${c.totalSpent.toFixed(2).replace('.', ',')};"${c.hasFidelityCard ? 'SI' : 'NO'}";"${c.isVip ? 'SI' : 'NO'}"\r\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `El_Gallero_Rubrica_Clienti_${todayStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showAdminToast('📊 File CSV esportato con successo!');
  };

  // Export to PDF
  window.exportCustomersToPdf = function() {
    if (allCustomers.length === 0) {
      alert('Nessun cliente presente da esportare.');
      return;
    }

    const todayStr = getTodayDateString();
    const now = new Date();

    if (window.jspdf && window.jspdf.jsPDF) {
      try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        // Header Background
        doc.setFillColor(20, 17, 16);
        doc.rect(0, 0, 297, 32, 'F');
        doc.setFillColor(212, 175, 55);
        doc.rect(0, 32, 297, 2, 'F');

        doc.setTextColor(212, 175, 55);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('EL GALLERO - GIRARROSTO 100% COTTO A LEGNA', 14, 14);

        doc.setTextColor(220, 220, 220);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Casavatore in Via E. A. Mario, 30 | Tel: 377 5975734 | Solo Prenotazioni', 14, 22);

        doc.setFontSize(9);
        doc.setTextColor(180, 180, 180);
        doc.text(`Rubrica Clienti • Generato il ${now.toLocaleDateString('it-IT')} alle ${now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} • Totale: ${allCustomers.length} clienti`, 14, 28);

        const head = [['Nome e Cognome', 'Telefono', 'Ordini', 'Ultima Data', 'Orario/Codice', 'Modalità', 'Totale Speso (€)', 'Carta', 'VIP']];
        const body = allCustomers.map(c => [
          c.name,
          c.phone,
          String(c.totalOrders),
          c.lastOrderDate,
          `${c.lastOrderTime} (${c.lastOrderCode})`,
          (c.lastOrderType === 'domicilio') ? `Domicilio: ${c.lastDeliveryAddress || ''}` : 'Ritiro in Sede',
          `${c.totalSpent.toFixed(2).replace('.', ',')} €`,
          c.hasFidelityCard ? '💳 Fedeltà' : '-',
          c.isVip ? '★ VIP' : 'No'
        ]);

        if (typeof doc.autoTable === 'function') {
          doc.autoTable({
            head: head,
            body: body,
            startY: 38,
            theme: 'grid',
            headStyles: { fillColor: [26, 22, 19], textColor: [212, 175, 55], fontStyle: 'bold' },
            bodyStyles: { fontSize: 9, textColor: [30, 30, 30] },
            alternateRowStyles: { fillColor: [248, 246, 242] },
            columnStyles: {
              0: { cellWidth: 44, fontStyle: 'bold' },
              1: { cellWidth: 30 },
              2: { cellWidth: 16, halign: 'center' },
              3: { cellWidth: 26 },
              4: { cellWidth: 34 },
              5: { cellWidth: 60 },
              6: { cellWidth: 26, halign: 'right', fontStyle: 'bold', textColor: [46, 125, 50] },
              7: { cellWidth: 20, halign: 'center' },
              8: { cellWidth: 16, halign: 'center' }
            },
            margin: { left: 14, right: 14, bottom: 15 }
          });

          doc.save(`El_Gallero_Rubrica_Clienti_${todayStr}.pdf`);
          showAdminToast('📄 File PDF scaricato con successo!');
          return;
        }
      } catch (err) {
        console.warn('PDF export error:', err);
      }
    }

    window.print();
  };

  // ---------------- SCORTE & MENU MANAGEMENT ----------------

  // Inline creation & editing state with Draft Persistence
  let isCreatingNewProduct = false;
  let editingProductId = null;
  let draftNewProduct = { name: '', category: 'pollo', price: '', stock: 20, description: '' };
  let draftEditProduct = {};

  function renderMenuEditor() {
    if (!menuEditorGrid) return;

    let html = '';

    // 1. If currently creating a new product, render the Creation Card on top
    if (isCreatingNewProduct) {
      html += `
        <div class="inline-new-prod-card" style="grid-column: 1 / -1; background:#1e1815; border:2px solid var(--gold-primary); border-radius:12px; padding:18px; margin-bottom:16px; box-shadow:0 8px 30px rgba(0,0,0,0.8), 0 0 20px var(--gold-glow); position:relative; z-index:20;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid rgba(212,175,55,0.3); padding-bottom:8px;">
            <h3 style="margin:0; font-size:1.15rem; color:var(--gold-light); display:flex; align-items:center; gap:8px;">
              <i class="fa-solid fa-plus-circle text-gold"></i> Crea & Aggiungi Nuovo Piatto nel Menu
            </h3>
            <button type="button" onclick="window.adminCancelInlineNewProduct()" style="background:none; border:none; color:var(--text-muted); font-size:1.2rem; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-bottom:12px;">
            <div>
              <label style="font-size:0.8rem; font-weight:700; color:#fff; display:block; margin-bottom:4px;">Nome Piatto / Prodotto *</label>
              <input type="text" id="inlineNewName" value="${escapeHtml(draftNewProduct.name || '')}" oninput="draftNewProduct.name = this.value" placeholder="Es. Pollo al Forno Rustico" style="width:100%; padding:10px 12px; background:#140f0e; border:1px solid var(--border-color); border-radius:6px; color:#ffffff; font-size:0.95rem; outline:none; pointer-events:auto; user-select:text; -webkit-user-select:text; cursor:text; z-index:10; position:relative;" required>
            </div>
            <div>
              <label style="font-size:0.8rem; font-weight:700; color:#fff; display:block; margin-bottom:4px;">Categoria *</label>
              <select id="inlineNewCategory" onchange="draftNewProduct.category = this.value" style="width:100%; padding:10px 12px; background:#140f0e; border:1px solid var(--border-color); border-radius:6px; color:#ffffff; font-size:0.95rem; outline:none; pointer-events:auto; cursor:pointer;">
                <option value="pollo" ${draftNewProduct.category === 'pollo' ? 'selected' : ''}>🍗 Pollo</option>
                <option value="sfizio" ${draftNewProduct.category === 'sfizio' ? 'selected' : ''}>🍟 Sfizio / Contorno</option>
                <option value="bibite" ${draftNewProduct.category === 'bibite' ? 'selected' : ''}>🥤 Bibite</option>
                <option value="box" ${draftNewProduct.category === 'box' ? 'selected' : ''}>📦 Box Offerta</option>
              </select>
            </div>
            <div>
              <label style="font-size:0.8rem; font-weight:700; color:#fff; display:block; margin-bottom:4px;">Prezzo (€) *</label>
              <input type="number" step="0.10" id="inlineNewPrice" value="${draftNewProduct.price || ''}" oninput="draftNewProduct.price = this.value" placeholder="Es. 8.50" style="width:100%; padding:10px 12px; background:#140f0e; border:1px solid var(--border-color); border-radius:6px; color:#ffffff; font-size:0.95rem; outline:none; pointer-events:auto; user-select:text; -webkit-user-select:text; cursor:text; z-index:10; position:relative;" required>
            </div>
            <div>
              <label style="font-size:0.8rem; font-weight:700; color:#fff; display:block; margin-bottom:4px;">Quantità Scorte Iniziali (Pezzi) *</label>
              <input type="number" id="inlineNewStock" value="${draftNewProduct.stock !== undefined ? draftNewProduct.stock : 20}" oninput="draftNewProduct.stock = this.value" min="0" style="width:100%; padding:10px 12px; background:#140f0e; border:1px solid var(--border-color); border-radius:6px; color:#ffffff; font-size:0.95rem; outline:none; pointer-events:auto; user-select:text; -webkit-user-select:text; cursor:text; z-index:10; position:relative;" required>
            </div>
          </div>

          <div style="margin-bottom:14px;">
            <label style="font-size:0.8rem; font-weight:700; color:#fff; display:block; margin-bottom:4px;">Descrizione / Ingredienti del Piatto</label>
            <textarea id="inlineNewDesc" rows="2" oninput="draftNewProduct.description = this.value" placeholder="Es. Cotto allo spiedo a legna con erbe aromatiche..." style="width:100%; padding:10px 12px; background:#140f0e; border:1px solid var(--border-color); border-radius:6px; color:#ffffff; font-size:0.9rem; outline:none; resize:vertical; pointer-events:auto; user-select:text; -webkit-user-select:text; cursor:text; z-index:10; position:relative;">${escapeHtml(draftNewProduct.description || '')}</textarea>
          </div>

          <div style="display:flex; gap:10px; justify-content:flex-end;">
            <button type="button" onclick="window.adminCancelInlineNewProduct()" style="padding:10px 18px; background:transparent; border:1px solid var(--border-color); color:var(--text-secondary); border-radius:6px; font-weight:700; cursor:pointer;">
              <i class="fa-solid fa-xmark"></i> Annulla
            </button>
            <button type="button" onclick="window.adminSaveInlineNewProduct()" style="padding:10px 22px; background:var(--gold-gradient); border:none; color:#120e0d; border-radius:6px; font-weight:800; cursor:pointer; font-size:0.95rem; box-shadow:0 0 12px var(--gold-glow);">
              <i class="fa-solid fa-check"></i> ✅ Salva & Aggiungi al Menu
            </button>
          </div>
        </div>
      `;
    }

    if (allProducts.length === 0 && !isCreatingNewProduct) {
      menuEditorGrid.innerHTML = '<div class="empty-products-msg"><p>Nessun prodotto configurato. Clicca su "+ Aggiungi Nuovo Piatto" per iniziare.</p></div>';
      return;
    }

    html += allProducts.map(p => {
      // 2. If this product is being edited inline
      if (editingProductId === p.id) {
        const curName = draftEditProduct.name !== undefined ? draftEditProduct.name : p.name;
        const curPrice = draftEditProduct.price !== undefined ? draftEditProduct.price : p.price;
        const curStock = draftEditProduct.stock !== undefined ? draftEditProduct.stock : (p.stock !== undefined ? p.stock : 10);
        const curCat = draftEditProduct.category !== undefined ? draftEditProduct.category : (p.category || 'pollo');
        const curDesc = draftEditProduct.description !== undefined ? draftEditProduct.description : (p.description || '');

        return `
          <div class="menu-editor-card" style="background:#221b18; border:2px solid var(--gold-primary); box-shadow:0 0 20px rgba(212,175,55,0.35); padding:16px; position:relative; z-index:20;">
            <div style="font-size:0.95rem; font-weight:800; color:var(--gold-light); margin-bottom:12px; display:flex; align-items:center; gap:6px;">
              <i class="fa-solid fa-pen-to-square"></i> Modifica: "${escapeHtml(p.name)}"
            </div>
            
            <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:12px;">
              <div>
                <label style="font-size:0.75rem; color:var(--text-muted); font-weight:700; display:block; margin-bottom:3px;">Nome Piatto:</label>
                <input type="text" id="inlineEditName_${p.id}" value="${escapeHtml(curName)}" oninput="draftEditProduct.name = this.value" style="width:100%; padding:8px 10px; background:#140f0e; border:1px solid var(--border-color); border-radius:4px; color:#ffffff; font-weight:700; pointer-events:auto; user-select:text; -webkit-user-select:text; cursor:text;">
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                <div>
                  <label style="font-size:0.75rem; color:var(--text-muted); font-weight:700; display:block; margin-bottom:3px;">Prezzo (€):</label>
                  <input type="number" step="0.10" id="inlineEditPrice_${p.id}" value="${curPrice}" oninput="draftEditProduct.price = this.value" style="width:100%; padding:8px 10px; background:#140f0e; border:1px solid var(--border-color); border-radius:4px; color:#ffffff; font-weight:700; pointer-events:auto; user-select:text; -webkit-user-select:text; cursor:text;">
                </div>
                <div>
                  <label style="font-size:0.75rem; color:var(--text-muted); font-weight:700; display:block; margin-bottom:3px;">Scorte (Pz):</label>
                  <input type="number" min="0" id="inlineEditStock_${p.id}" value="${curStock}" oninput="draftEditProduct.stock = this.value" style="width:100%; padding:8px 10px; background:#140f0e; border:1px solid var(--border-color); border-radius:4px; color:#ffffff; font-weight:700; pointer-events:auto; user-select:text; -webkit-user-select:text; cursor:text;">
                </div>
              </div>
              <div>
                <label style="font-size:0.75rem; color:var(--text-muted); font-weight:700; display:block; margin-bottom:3px;">Categoria:</label>
                <select id="inlineEditCat_${p.id}" onchange="draftEditProduct.category = this.value" style="width:100%; padding:8px 10px; background:#140f0e; border:1px solid var(--border-color); border-radius:4px; color:#ffffff; pointer-events:auto; cursor:pointer;">
                  <option value="pollo" ${curCat === 'pollo' ? 'selected' : ''}>🍗 Pollo</option>
                  <option value="sfizio" ${curCat === 'sfizio' ? 'selected' : ''}>🍟 Sfizio / Contorno</option>
                  <option value="bibite" ${curCat === 'bibite' ? 'selected' : ''}>🥤 Bibite</option>
                  <option value="box" ${curCat === 'box' ? 'selected' : ''}>📦 Box</option>
                </select>
              </div>
              <div>
                <label style="font-size:0.75rem; color:var(--text-muted); font-weight:700; display:block; margin-bottom:3px;">Descrizione:</label>
                <textarea id="inlineEditDesc_${p.id}" rows="2" oninput="draftEditProduct.description = this.value" style="width:100%; padding:8px 10px; background:#140f0e; border:1px solid var(--border-color); border-radius:4px; color:#ffffff; font-size:0.85rem; resize:vertical; pointer-events:auto; user-select:text; -webkit-user-select:text; cursor:text;">${escapeHtml(curDesc)}</textarea>
              </div>
            </div>

            <div style="display:flex; gap:8px; justify-content:flex-end;">
              <button type="button" onclick="window.adminCancelInlineEditProduct()" style="padding:8px 14px; background:var(--bg-surface); border:1px solid var(--border-color); color:var(--text-secondary); border-radius:4px; font-weight:700; cursor:pointer;">
                <i class="fa-solid fa-xmark"></i> Annulla
              </button>
              <button type="button" onclick="window.adminSaveInlineEditProduct('${p.id}')" style="padding:8px 16px; background:var(--gold-gradient); border:none; color:#120e0d; border-radius:4px; font-weight:800; cursor:pointer; box-shadow:0 0 10px var(--gold-glow);">
                <i class="fa-solid fa-check"></i> Salva Modifiche
              </button>
            </div>
          </div>
        `;
      }

      // 3. Normal Product Card Display
      const isUnlimited = Boolean(p.unlimited);
      const stock = p.stock !== undefined ? p.stock : 10;
      const isAvailable = isUnlimited ? (p.available !== false) : (stock > 0 && p.available !== false);

      let tagClass = 'stock-tag-ok';
      let tagText = `${stock} Disponibili`;
      if (isUnlimited) {
        tagClass = 'stock-tag-unlimited';
        tagText = 'Illimitato';
      } else if (stock === 0) {
        tagClass = 'stock-tag-zero';
        tagText = '🔴 Esaurito (0)';
      } else if (stock <= 3) {
        tagClass = 'stock-tag-low';
        tagText = `⚠️ Solo ${stock} rimasti!`;
      }

      return `
        <div class="menu-editor-card ${!isAvailable ? 'prod-card-off' : ''}">
          <div class="prod-editor-header">
            <div>
              <span class="prod-cat-pill">${escapeHtml(p.category)}</span>
              <h4 class="prod-editor-title">${escapeHtml(p.name)}</h4>
            </div>
            <div class="prod-editor-price">${Number(p.price).toFixed(2).replace('.', ',')} €</div>
          </div>

          <p class="prod-editor-desc">${escapeHtml(p.description || '')}</p>

          <!-- Stock Stepper Control -->
          <div class="stock-editor-box">
            <div class="stock-editor-label-row">
              <span style="font-size:0.75rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;"><i class="fa-solid fa-boxes-stacked"></i> Scorte / Giacenza:</span>
              <span class="stock-status-pill ${tagClass}">${tagText}</span>
            </div>

            ${!isUnlimited ? `
              <div class="stock-steppers-bar">
                <button type="button" class="btn-stock-num" onclick="window.adminAdjustStock('${p.id}', -5)">-5</button>
                <button type="button" class="btn-stock-num" onclick="window.adminAdjustStock('${p.id}', -1)">-1</button>
                <input type="number" min="0" value="${stock}" class="stock-num-input" onchange="window.adminSetExactStock('${p.id}', this.value)" title="Modifica valore esatto">
                <button type="button" class="btn-stock-num" onclick="window.adminAdjustStock('${p.id}', 1)">+1</button>
                <button type="button" class="btn-stock-num" onclick="window.adminAdjustStock('${p.id}', 5)">+5</button>
              </div>
            ` : `
              <div style="font-size:0.8rem; color:var(--gold-light); padding:4px 0;">Disponibilità illimitata attiva</div>
            `}
          </div>

          <!-- Actions -->
          <div class="prod-editor-actions">
            <button type="button" class="btn-edit-prod" onclick="window.adminEditProduct('${p.id}')">
              <i class="fa-solid fa-pen-to-square"></i> Modifica
            </button>
            <button type="button" class="btn-toggle-prod ${p.available ? 'btn-active-state' : 'btn-off-state'}" onclick="window.adminToggleAvailability('${p.id}')">
              <i class="fa-solid ${p.available ? 'fa-eye' : 'fa-eye-slash'}"></i> ${p.available ? 'Attivo' : 'Nascosto'}
            </button>
            <button type="button" class="btn-delete-prod" onclick="window.adminDeleteProduct('${p.id}')" title="Elimina piatto dal menu">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    menuEditorGrid.innerHTML = html;
  }

  // --- Inline Product Action Handlers ---

  window.openAddProductModal = function() {
    isCreatingNewProduct = true;
    editingProductId = null;
    draftNewProduct = { name: '', category: 'pollo', price: '', stock: 20, description: '' };
    renderMenuEditor();
    setTimeout(() => {
      const input = document.getElementById('inlineNewName');
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 60);
  };

  window.adminCancelInlineNewProduct = function() {
    isCreatingNewProduct = false;
    draftNewProduct = { name: '', category: 'pollo', price: '', stock: 20, description: '' };
    renderMenuEditor();
  };

  window.adminSaveInlineNewProduct = async function() {
    const nameInput = document.getElementById('inlineNewName');
    const catInput = document.getElementById('inlineNewCategory');
    const priceInput = document.getElementById('inlineNewPrice');
    const stockInput = document.getElementById('inlineNewStock');
    const descInput = document.getElementById('inlineNewDesc');

    const name = nameInput ? nameInput.value.trim() : (draftNewProduct.name || '');
    const category = catInput ? catInput.value : (draftNewProduct.category || 'pollo');
    const price = priceInput ? parseFloat(priceInput.value) : (parseFloat(draftNewProduct.price) || 0);
    const stock = stockInput ? (parseInt(stockInput.value, 10) || 0) : (parseInt(draftNewProduct.stock, 10) || 15);
    const desc = descInput ? descInput.value.trim() : (draftNewProduct.description || '');

    if (!name || isNaN(price) || price <= 0) {
      alert('⚠️ Inserisci un Nome e un Prezzo valido per il nuovo piatto.');
      return;
    }

    const newProd = {
      id: 'prod_' + Date.now(),
      name: name,
      category: category,
      price: price,
      description: desc,
      stock: stock,
      unlimited: false,
      available: stock > 0
    };

    allProducts.push(newProd);
    isCreatingNewProduct = false;
    draftNewProduct = { name: '', category: 'pollo', price: '', stock: 20, description: '' };
    saveAndBroadcastMenu();
    renderMenuEditor();
    showAdminToast(`✅ Nuovo piatto "${name}" aggiunto con ${stock} pezzi al menu!`);

    try {
      await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify(newProd)
      });
    } catch (err) {}
  };

  window.adminEditProduct = function(productId) {
    const p = allProducts.find(it => it.id === productId);
    if (!p) return;

    editingProductId = productId;
    isCreatingNewProduct = false;
    draftEditProduct = {
      name: p.name,
      category: p.category || 'pollo',
      price: Number(p.price || 0).toFixed(2),
      stock: p.stock !== undefined ? p.stock : 10,
      description: p.description || ''
    };

    renderMenuEditor();
    setTimeout(() => {
      const input = document.getElementById(`inlineEditName_${productId}`);
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 60);
  };

  window.adminCancelInlineEditProduct = function() {
    editingProductId = null;
    draftEditProduct = {};
    renderMenuEditor();
  };

  window.adminSaveInlineEditProduct = async function(productId) {
    const prod = allProducts.find(p => p.id === productId);
    if (!prod) return;

    const nameInput = document.getElementById(`inlineEditName_${productId}`);
    const priceInput = document.getElementById(`inlineEditPrice_${productId}`);
    const stockInput = document.getElementById(`inlineEditStock_${productId}`);
    const catInput = document.getElementById(`inlineEditCat_${productId}`);
    const descInput = document.getElementById(`inlineEditDesc_${productId}`);

    const name = nameInput ? nameInput.value.trim() : (draftEditProduct.name || prod.name);
    const price = priceInput ? parseFloat(priceInput.value) : (parseFloat(draftEditProduct.price) || prod.price);
    const stock = stockInput ? (parseInt(stockInput.value, 10) || 0) : (parseInt(draftEditProduct.stock, 10) || prod.stock);
    const category = catInput ? catInput.value : (draftEditProduct.category || prod.category);
    const desc = descInput ? descInput.value.trim() : (draftEditProduct.description !== undefined ? draftEditProduct.description : prod.description);

    if (!name || isNaN(price) || price <= 0) {
      alert('⚠️ Inserisci un Nome e un Prezzo valido.');
      return;
    }

    prod.name = name;
    prod.price = price;
    prod.stock = stock;
    prod.category = category;
    prod.description = desc;
    prod.available = stock > 0;

    editingProductId = null;
    draftEditProduct = {};
    saveAndBroadcastMenu();
    renderMenuEditor();
    showAdminToast(`✅ Piatto "${name}" aggiornato con successo!`);

    try {
      await fetch(`/api/admin/products/${encodeURIComponent(productId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify({ name, category, price, description: desc, stock, unlimited: false, available: prod.available })
      });
    } catch (err) {}
  };

  // Adjust stock delta
  window.adminAdjustStock = async function(productId, delta) {
    const prod = allProducts.find(p => p.id === productId);
    if (!prod) return;

    prod.stock = Math.max(0, (prod.stock || 0) + delta);
    prod.available = (prod.stock > 0);

    saveAndBroadcastMenu();
    renderMenuEditor();
    showAdminToast(`Giacenza ${prod.name}: ${prod.stock} pz`);

    try {
      await fetch(`/api/admin/products/${productId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify({ delta: delta })
      });
    } catch (e) {}
  };

  // Set exact stock
  window.adminSetExactStock = async function(productId, val) {
    const prod = allProducts.find(p => p.id === productId);
    if (!prod) return;

    const num = Math.max(0, parseInt(val, 10) || 0);
    prod.stock = num;
    prod.available = (num > 0);

    saveAndBroadcastMenu();
    renderMenuEditor();
    showAdminToast(`Giacenza ${prod.name} impostata a ${num} pz`);

    try {
      await fetch(`/api/admin/products/${productId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify({ exactStock: num })
      });
    } catch (e) {}
  };

  window.adminToggleAvailability = async function(productId) {
    const prod = allProducts.find(p => p.id === productId);
    if (!prod) return;

    prod.available = !prod.available;
    saveAndBroadcastMenu();
    renderMenuEditor();
    showAdminToast(`${prod.name}: ${prod.available ? 'Attivato' : 'Disattivato'}`);

    try {
      await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify({ available: prod.available })
      });
    } catch (e) {}
  };

  window.adminDeleteProduct = async function(productId) {
    const prod = allProducts.find(p => p.id === productId);
    if (!prod) return;

    if (!confirm(`Sei sicuro di voler rimuovere "${prod.name}" dal menu?`)) return;

    allProducts = allProducts.filter(p => p.id !== productId);
    saveAndBroadcastMenu();
    renderMenuEditor();
    showAdminToast(`"${prod.name}" eliminato dal menu.`);

    try {
      await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': adminPin }
      });
    } catch (e) {}
  };

  function saveAndBroadcastMenu() {
    try {
      const store = JSON.parse(localStorage.getItem('el_gallero_data') || '{}');
      store.products = allProducts;
      localStorage.setItem('el_gallero_data', JSON.stringify(store));
      localStorage.setItem('el_gallero_products', JSON.stringify(allProducts));

      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('el_gallero_sync_channel');
        bc.postMessage({ type: 'menu_updated', products: allProducts });
      }
    } catch (e) {}
  }

  // Settings Save
  window.handleSaveSettings = async function(e) {
    if (e && e.preventDefault) e.preventDefault();

    const name = document.getElementById('setStoreName').value.trim();
    const sub = document.getElementById('setSubtitle').value.trim();
    const phone = document.getElementById('setPhone').value.trim();
    const pin = document.getElementById('setAdminPin').value.trim();
    const slotsRaw = document.getElementById('setTimeSlots').value;

    const timeSlots = slotsRaw.split(',').map(s => s.trim()).filter(s => s.length > 0);

    storeSettings.storeName = name;
    storeSettings.subtitle = sub;
    storeSettings.phone = phone;
    if (pin.length >= 4) storeSettings.adminPin = pin;
    if (timeSlots.length > 0) storeSettings.timeSlots = timeSlots;

    try {
      const store = JSON.parse(localStorage.getItem('el_gallero_data') || '{}');
      store.settings = storeSettings;
      localStorage.setItem('el_gallero_data', JSON.stringify(store));
    } catch (e) {}

    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify(storeSettings)
      });
    } catch (err) {}

    showAdminToast('Impostazioni salvate con successo!');
  };

  // ---------------- UTILS ----------------

  function getTodayDateString() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function getTomorrowDateString() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function formatDateIt(dateStr) {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
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

  function showAdminToast(msg) {
    if (typeof window.showToast === 'function') {
      window.showToast(msg);
      return;
    }
    let container = document.getElementById('adminToastContainer') || document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'adminToastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const t = document.createElement('div');
    t.className = 'app-toast active';
    t.innerHTML = `<i class="fa-solid fa-circle-check text-gold"></i> <span>${msg}</span>`;
    container.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      setTimeout(() => t.remove(), 300);
    }, 3000);
  }
});