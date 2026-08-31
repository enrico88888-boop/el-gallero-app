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

  async function loadAllAdminData() {
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

    // 2. Load Menu & Settings
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

    if (storeSettings) {
      if (document.getElementById('setStoreName')) document.getElementById('setStoreName').value = storeSettings.storeName || 'EL GALLERO';
      if (document.getElementById('setSubtitle')) document.getElementById('setSubtitle').value = storeSettings.subtitle || '100% cotto a legna • Solo prenotazioni';
      if (document.getElementById('setPhone')) document.getElementById('setPhone').value = storeSettings.phone || '3775975734';
      if (document.getElementById('setTimeSlots')) {
        const slots = (storeSettings.timeSlots && storeSettings.timeSlots.length) ? storeSettings.timeSlots : ["19:00", "19:15", "19:30", "19:45", "20:00", "20:15", "20:30", "20:45", "21:00", "21:15", "21:30"];
        document.getElementById('setTimeSlots').value = slots.join(', ');
      }
    }

    computeCustomersFromBookings();
    renderBookings();
    renderCustomersTable();
    renderMenuEditor();
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
      const isPending = (b.status === 'in_attesa');
      const isConfirmed = (b.status === 'confermato');
      const isCompleted = (b.status === 'completato');
      const isCancelled = (b.status === 'annullato');

      let statusBadge = '<span class="status-pill pill-warning"><i class="fa-solid fa-clock"></i> In Attesa</span>';
      if (isConfirmed) statusBadge = '<span class="status-pill pill-green"><i class="fa-solid fa-circle-check"></i> Confermato</span>';
      if (isCompleted) statusBadge = '<span class="status-pill pill-blue"><i class="fa-solid fa-bag-shopping"></i> Ritirato/Consegnato</span>';
      if (isCancelled) statusBadge = '<span class="status-pill pill-red"><i class="fa-solid fa-ban"></i> Annullato</span>';

      const isDelivery = (b.orderType === 'domicilio');
      const cleanPhone = (b.customerPhone || '').replace(/\D/g, '');
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
            <button type="button" class="btn-adm-edit-comanda" onclick="window.adminOpenEditBooking('${b.id || b.code}')" style="grid-column:1 / -1; background:rgba(212,175,55,0.18); border:1px solid var(--gold-primary); color:var(--gold-light); font-weight:800; padding:8px 12px; border-radius:6px; cursor:pointer;">
              <i class="fa-solid fa-pen-to-square text-gold"></i> Modifica Comanda & Sconto Fedeltà
            </button>

            <button type="button" class="btn-adm-wa" onclick="window.adminContactClientWA('${b.id || b.code}')" title="Invia riepilogo con sconto e consegna su WhatsApp">
              <i class="fa-brands fa-whatsapp"></i> WhatsApp
            </button>
            
            <button type="button" class="btn-adm-delete-bkg" onclick="window.adminDeleteBooking('${b.id || b.code}', '${b.code}', '${escapeHtml(b.customerName)}')" title="Elimina definitivamente questa comanda">
              <i class="fa-solid fa-trash-can"></i> Elimina Comanda
            </button>

            ${isPending ? `
              <button type="button" class="btn-adm-confirm" onclick="window.adminUpdateBookingStatus('${b.id || b.code}', 'confermato')">
                <i class="fa-solid fa-check"></i> Conferma
              </button>
            ` : !isCompleted ? `
              <button type="button" class="btn-adm-complete" onclick="window.adminUpdateBookingStatus('${b.id || b.code}', 'completato')">
                <i class="fa-solid fa-circle-check"></i> Segna Ritirato
              </button>
            ` : `
              <button type="button" class="btn-adm-reopen" onclick="window.adminUpdateBookingStatus('${b.id || b.code}', 'in_attesa')">
                <i class="fa-solid fa-rotate-left"></i> Riapri
              </button>
            `}

            ${!isCancelled ? `
              <button type="button" class="btn-adm-cancel" onclick="window.adminUpdateBookingStatus('${b.id || b.code}', 'annullato')" title="Annulla ordine">
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

  // ---------------- MODIFICA COMANDA & SCONTO CARTA FEDELTÀ ----------------

  window.adminOpenEditBooking = function(idOrCode) {
    const b = allBookings.find(it => it.id === idOrCode || it.code === idOrCode);
    if (!b) return;

    currentEditingBooking = JSON.parse(JSON.stringify(b));
    tempEditItems = Array.isArray(b.items) ? JSON.parse(JSON.stringify(b.items)) : [];

    const idInput = document.getElementById('editBookingId');
    const codeSpan = document.getElementById('editBookingCode');
    const custName = document.getElementById('editCustName');
    const custPhone = document.getElementById('editCustPhone');
    const dateInput = document.getElementById('editPickupDate');
    const timeInput = document.getElementById('editPickupTime');
    const statusSelect = document.getElementById('editStatus');
    const orderTypeSelect = document.getElementById('editOrderType');
    const delivAddress = document.getElementById('editDeliveryAddress');
    const delivGroup = document.getElementById('editDeliveryAddressGroup');
    const notesInput = document.getElementById('editNotes');
    const adminNotesInput = document.getElementById('editAdminNotes');
    const hasFidelityCardCheck = document.getElementById('editHasFidelityCard');
    const fidelityDiscInput = document.getElementById('editFidelityDiscount');
    const fidelityDiscGroup = document.getElementById('fidelityDiscountInputGroup');

    if (idInput) idInput.value = b.id || b.code;
    if (codeSpan) codeSpan.textContent = `(${b.code || ''})`;
    if (custName) custName.value = b.customerName || '';
    if (custPhone) custPhone.value = b.customerPhone || '';
    if (dateInput) dateInput.value = b.pickupDate || '';
    if (timeInput) timeInput.value = b.pickupTime || '';
    if (statusSelect) statusSelect.value = b.status || 'in_attesa';
    
    const isDeliv = (b.orderType === 'domicilio');
    if (orderTypeSelect) orderTypeSelect.value = isDeliv ? 'domicilio' : 'ritiro';
    if (delivGroup) delivGroup.style.display = isDeliv ? 'block' : 'none';
    if (delivAddress) delivAddress.value = b.deliveryAddress || '';

    if (notesInput) notesInput.value = b.notes || '';
    if (adminNotesInput) adminNotesInput.value = b.adminNotes || '';

    // Fidelity Card and Discount
    const hasFid = Boolean(b.hasFidelityCard || (b.fidelityDiscount && b.fidelityDiscount > 0));
    if (hasFidelityCardCheck) hasFidelityCardCheck.checked = hasFid;
    if (fidelityDiscGroup) fidelityDiscGroup.style.display = hasFid ? 'block' : 'none';
    if (fidelityDiscInput) fidelityDiscInput.value = Number(b.fidelityDiscount || 2.00).toFixed(2);

    // Populate Products Dropdown
    const addSelect = document.getElementById('editAddProductSelect');
    if (addSelect) {
      let optHtml = '<option value="">-- Aggiungi un piatto dal menu --</option>';
      allProducts.forEach(p => {
        optHtml += `<option value="${p.id}">${escapeHtml(p.name)} (${Number(p.price).toFixed(2)} €)</option>`;
      });
      addSelect.innerHTML = optHtml;
    }

    renderEditComandaItemsList();
    window.adminRecalculateEditTotal();

    if (editBookingModal) {
      editBookingModal.classList.add('active');
    }
  };

  window.closeEditBookingModal = function() {
    if (editBookingModal) {
      editBookingModal.classList.remove('active');
    }
    currentEditingBooking = null;
    tempEditItems = [];
  };

  window.adminToggleEditDelivery = function(val) {
    const delivGroup = document.getElementById('editDeliveryAddressGroup');
    if (delivGroup) delivGroup.style.display = (val === 'domicilio') ? 'block' : 'none';
    window.adminRecalculateEditTotal();
  };

  function renderEditComandaItemsList() {
    const container = document.getElementById('editComandaItemsList');
    if (!container) return;

    if (tempEditItems.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:12px; color:var(--color-warning); font-size:0.82rem;">
          <i class="fa-solid fa-triangle-exclamation"></i> Nessun piatto nella comanda. Aggiungine uno dal menu sottostante.
        </div>
      `;
      return;
    }

    container.innerHTML = tempEditItems.map((it, idx) => {
      const q = it.quantity || 1;
      const p = Number(it.price || 0);
      const sub = (q * p).toFixed(2).replace('.', ',');

      return `
        <div class="edit-item-row" style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-main); border:1px solid var(--border-color-light); border-radius:6px; padding:6px 10px;">
          <div style="flex:1;">
            <strong style="font-size:0.85rem; color:#fff;">${escapeHtml(it.name)}</strong>
            <div style="font-size:0.75rem; color:var(--text-muted);">${p.toFixed(2).replace('.', ',')} € cad.</div>
          </div>
          
          <div style="display:flex; align-items:center; gap:6px;">
            <button type="button" class="btn-qty-mini" onclick="window.adminChangeEditItemQty(${idx}, -1)" style="width:26px; height:26px; background:var(--bg-surface); border:1px solid var(--border-color); color:#fff; border-radius:4px; font-weight:800; cursor:pointer;">-</button>
            <span style="font-size:0.9rem; font-weight:800; color:var(--gold-light); min-width:20px; text-align:center;">${q}</span>
            <button type="button" class="btn-qty-mini" onclick="window.adminChangeEditItemQty(${idx}, 1)" style="width:26px; height:26px; background:var(--bg-surface); border:1px solid var(--border-color); color:#fff; border-radius:4px; font-weight:800; cursor:pointer;">+</button>
          </div>

          <div style="font-weight:800; color:var(--gold-light); font-size:0.88rem; min-width:55px; text-align:right; margin:0 8px;">
            ${sub} €
          </div>

          <button type="button" onclick="window.adminRemoveEditItem(${idx})" title="Rimuovi piatto" style="background:rgba(231,76,60,0.15); border:1px solid rgba(231,76,60,0.3); color:#e74c3c; width:26px; height:26px; border-radius:4px; cursor:pointer; display:flex; align-items:center; justify-content:center;">
            <i class="fa-solid fa-trash-can" style="font-size:0.75rem;"></i>
          </button>
        </div>
      `;
    }).join('');
  }

  window.adminChangeEditItemQty = function(index, delta) {
    if (!tempEditItems[index]) return;
    tempEditItems[index].quantity = (tempEditItems[index].quantity || 1) + delta;
    if (tempEditItems[index].quantity <= 0) {
      tempEditItems.splice(index, 1);
    }
    renderEditComandaItemsList();
    window.adminRecalculateEditTotal();
  };

  window.adminRemoveEditItem = function(index) {
    if (!tempEditItems[index]) return;
    tempEditItems.splice(index, 1);
    renderEditComandaItemsList();
    window.adminRecalculateEditTotal();
  };

  window.adminAddItemToComanda = function() {
    const select = document.getElementById('editAddProductSelect');
    if (!select || !select.value) return;

    const prodId = select.value;
    const prod = allProducts.find(p => p.id === prodId);
    if (!prod) return;

    const existingIdx = tempEditItems.findIndex(it => it.id === prod.id || it.name === prod.name);
    if (existingIdx !== -1) {
      tempEditItems[existingIdx].quantity = (tempEditItems[existingIdx].quantity || 1) + 1;
    } else {
      tempEditItems.push({
        id: prod.id,
        name: prod.name,
        category: prod.category,
        price: Number(prod.price),
        quantity: 1,
        subtotal: Number(prod.price)
      });
    }

    select.value = '';
    renderEditComandaItemsList();
    window.adminRecalculateEditTotal();
    showAdminToast(`Aggiunto alla comanda: ${prod.name}`);
  };

  window.adminToggleFidelityDiscount = function(isChecked) {
    const group = document.getElementById('fidelityDiscountInputGroup');
    if (group) group.style.display = isChecked ? 'block' : 'none';
    window.adminRecalculateEditTotal();
  };

  window.adminSetQuickDiscount = function(val) {
    const input = document.getElementById('editFidelityDiscount');
    if (input) input.value = Number(val).toFixed(2);
    window.adminRecalculateEditTotal();
  };

  window.adminRecalculateEditTotal = function() {
    let itemsSub = 0;
    tempEditItems.forEach(it => {
      const q = it.quantity || 1;
      const p = Number(it.price || 0);
      itemsSub += (q * p);
    });

    const orderTypeSelect = document.getElementById('editOrderType');
    const isDelivery = orderTypeSelect ? (orderTypeSelect.value === 'domicilio') : false;
    const delivFee = isDelivery ? 2.00 : 0.00;

    const hasFidCheck = document.getElementById('editHasFidelityCard');
    const isFidActive = Boolean(hasFidCheck && hasFidCheck.checked);
    const fidDiscInput = document.getElementById('editFidelityDiscount');
    const fidDisc = isFidActive ? Math.max(0, parseFloat(fidDiscInput ? fidDiscInput.value : 0) || 0) : 0;

    const finalTotal = Math.max(0, itemsSub + delivFee - fidDisc);

    const subSpan = document.getElementById('editPreviewItemsSubtotal');
    const delivLine = document.getElementById('editPreviewDeliveryFeeLine');
    const fidLine = document.getElementById('editPreviewFidelityLine');
    const fidDiscSpan = document.getElementById('editPreviewFidelityDiscount');
    const finalSpan = document.getElementById('editPreviewFinalTotal');

    if (subSpan) subSpan.textContent = itemsSub.toFixed(2).replace('.', ',') + ' €';
    if (delivLine) delivLine.style.display = isDelivery ? 'flex' : 'none';
    
    if (fidLine) fidLine.style.display = (isFidActive && fidDisc > 0) ? 'flex' : 'none';
    if (fidDiscSpan) fidDiscSpan.textContent = `- ${fidDisc.toFixed(2).replace('.', ',')} €`;

    if (finalSpan) finalSpan.textContent = finalTotal.toFixed(2).replace('.', ',') + ' €';
  };

  window.handleSaveEditBooking = async function(e) {
    if (e && e.preventDefault) e.preventDefault();

    const bookingId = document.getElementById('editBookingId').value;
    if (!bookingId) return;

    if (tempEditItems.length === 0) {
      alert('La comanda deve contenere almeno un piatto.');
      return;
    }

    const name = document.getElementById('editCustName').value.trim();
    const phone = document.getElementById('editCustPhone').value.trim();
    const date = document.getElementById('editPickupDate').value;
    const time = document.getElementById('editPickupTime').value.trim();
    const status = document.getElementById('editStatus').value;
    const orderType = document.getElementById('editOrderType').value;
    const delivAddress = document.getElementById('editDeliveryAddress').value.trim();
    const notes = document.getElementById('editNotes').value.trim();
    const adminNotes = document.getElementById('editAdminNotes').value.trim();
    const hasFidelity = document.getElementById('editHasFidelityCard').checked;
    const fidelityDisc = hasFidelity ? Math.max(0, parseFloat(document.getElementById('editFidelityDiscount').value) || 0) : 0;

    let itemsSub = 0;
    const validated = tempEditItems.map(it => {
      const q = parseInt(it.quantity, 10) || 1;
      const p = Number(it.price || 0);
      const sub = Number((q * p).toFixed(2));
      itemsSub += sub;
      return {
        id: it.id,
        name: it.name,
        category: it.category || 'altro',
        price: p,
        quantity: q,
        subtotal: sub
      };
    });

    const delivFee = (orderType === 'domicilio') ? 2.00 : 0.00;
    const totalAmount = Math.max(0, Number((itemsSub + delivFee - fidelityDisc).toFixed(2)));

    const payload = {
      customerName: name,
      customerPhone: phone,
      pickupDate: date,
      pickupTime: time,
      status: status,
      orderType: orderType,
      deliveryAddress: (orderType === 'domicilio') ? delivAddress : '',
      deliveryFee: delivFee,
      hasFidelityCard: hasFidelity,
      fidelityDiscount: fidelityDisc,
      items: validated,
      itemsSubtotal: Number(itemsSub.toFixed(2)),
      notes: notes,
      adminNotes: adminNotes,
      totalAmount: totalAmount
    };

    // Update local state
    const idx = allBookings.findIndex(b => b.id === bookingId || b.code === bookingId);
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
      } catch (err) {}
    }

    // Call server PATCH
    try {
      await fetch(`/api/admin/bookings/${encodeURIComponent(bookingId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify(payload)
      });
    } catch (apiErr) {}

    window.closeEditBookingModal();
    computeCustomersFromBookings();
    renderBookings();
    renderCustomersTable();
    updateStatsUI();
    showAdminToast('✅ Comanda e Sconto Carta Fedeltà salvati con successo!');
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

  function renderMenuEditor() {
    if (!menuEditorGrid) return;

    if (allProducts.length === 0) {
      menuEditorGrid.innerHTML = '<div class="empty-products-msg"><p>Nessun prodotto configurato.</p></div>';
      return;
    }

    menuEditorGrid.innerHTML = allProducts.map(p => {
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
  }

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

  // Add / Edit Product Modal
  window.openAddProductModal = function() {
    const form = document.getElementById('productForm');
    if (form) form.reset();
    document.getElementById('prodFormId').value = '';
    document.getElementById('productModalTitle').innerHTML = '<i class="fa-solid fa-plus text-gold"></i> Aggiungi Nuovo Piatto';
    if (productModal) productModal.classList.add('active');
  };

  window.adminEditProduct = function(productId) {
    const prod = allProducts.find(p => p.id === productId);
    if (!prod) return;

    document.getElementById('prodFormId').value = prod.id;
    document.getElementById('prodName').value = prod.name || '';
    document.getElementById('prodCategory').value = prod.category || 'pollo';
    document.getElementById('prodPrice').value = Number(prod.price || 0).toFixed(2);
    document.getElementById('prodDesc').value = prod.description || '';
    document.getElementById('prodStock').value = prod.stock !== undefined ? prod.stock : 10;
    document.getElementById('prodUnlimited').checked = Boolean(prod.unlimited);
    document.getElementById('prodAvailable').checked = (prod.available !== false);

    document.getElementById('productModalTitle').innerHTML = `<i class="fa-solid fa-pen-to-square text-gold"></i> Modifica "${escapeHtml(prod.name)}"`;
    if (productModal) productModal.classList.add('active');
  };

  window.closeProductModal = function() {
    if (productModal) productModal.classList.remove('active');
  };

  window.handleSaveProduct = async function(e) {
    if (e && e.preventDefault) e.preventDefault();

    const id = document.getElementById('prodFormId').value;
    const name = document.getElementById('prodName').value.trim();
    const category = document.getElementById('prodCategory').value;
    const price = parseFloat(document.getElementById('prodPrice').value) || 0;
    const desc = document.getElementById('prodDesc').value.trim();
    const stock = parseInt(document.getElementById('prodStock').value, 10) || 0;
    const unlimited = document.getElementById('prodUnlimited').checked;
    const available = document.getElementById('prodAvailable').checked;

    if (!name || price <= 0) {
      alert('Nome e Prezzo valido sono obbligatori.');
      return;
    }

    if (id) {
      const prod = allProducts.find(p => p.id === id);
      if (prod) {
        prod.name = name;
        prod.category = category;
        prod.price = price;
        prod.description = desc;
        prod.stock = stock;
        prod.unlimited = unlimited;
        prod.available = available;
      }
      try {
        await fetch(`/api/admin/products/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
          body: JSON.stringify({ name, category, price, description: desc, stock, unlimited, available })
        });
      } catch (err) {}
      showAdminToast(`Piatto "${name}" aggiornato!`);
    } else {
      const newProd = {
        id: 'prod_' + Date.now(),
        name,
        category,
        price,
        description: desc,
        stock,
        unlimited,
        available
      };
      allProducts.push(newProd);
      try {
        await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
          body: JSON.stringify(newProd)
        });
      } catch (err) {}
      showAdminToast(`Nuovo piatto "${name}" aggiunto al menu!`);
    }

    saveAndBroadcastMenu();
    renderMenuEditor();
    window.closeProductModal();
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
    }
  }
});