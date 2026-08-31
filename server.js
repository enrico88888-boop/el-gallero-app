const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');

function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Default Initial Database Seed with Stock support
const DEFAULT_DB = {
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
  ],
  bookings: []
};

// Helper to read database
function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      writeDB(DEFAULT_DB);
      return JSON.parse(JSON.stringify(DEFAULT_DB));
    }
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    
    if (!parsed.products || parsed.products.length === 0) {
      parsed.products = DEFAULT_DB.products;
    } else {
      // Ensure all products have stock properties
      parsed.products.forEach(p => {
        if (p.stock === undefined) p.stock = 10;
        if (p.unlimited === undefined) p.unlimited = false;
        if (p.available === undefined) p.available = (p.unlimited || p.stock > 0);
      });
    }

    if (!parsed.categories || parsed.categories.length === 0) {
      parsed.categories = DEFAULT_DB.categories;
    }
    if (!parsed.settings || !parsed.settings.storeName) {
      parsed.settings = DEFAULT_DB.settings;
    }
    if (!parsed.bookings) {
      parsed.bookings = [];
    }
    return parsed;
  } catch (err) {
    console.error('Error reading db.json, returning default:', err);
    return JSON.parse(JSON.stringify(DEFAULT_DB));
  }
}

// Helper to write database atomically
function writeDB(data) {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    const tempPath = DB_PATH + '.tmp';
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempPath, DB_PATH);
    return true;
  } catch (err) {
    console.error('Error writing db.json:', err);
    return false;
  }
}

// Ensure DB is initialized on boot
readDB();

// Middleware: Admin PIN verification
function requireAdmin(req, res, next) {
  const pin = req.headers['x-admin-pin'] || req.query.pin;
  const db = readDB();
  const validPin = (db.settings && db.settings.adminPin) ? db.settings.adminPin : '1234';
  
  if (pin && String(pin) === String(validPin)) {
    return next();
  }
  return res.status(401).json({ success: false, message: 'PIN amministratore non valido o mancante.' });
}

// ---------------- PUBLIC API ----------------

app.get('/api/info', (req, res) => {
  const db = readDB();
  const { adminPin, ...publicSettings } = db.settings || {};
  res.json({
    success: true,
    settings: publicSettings
  });
});

app.get('/api/menu', (req, res) => {
  const db = readDB();
  
  // Refresh availability based on stock
  (db.products || []).forEach(p => {
    if (!p.unlimited && (p.stock === 0 || p.stock < 0)) {
      p.available = false;
    }
  });

  res.json({
    success: true,
    categories: db.categories || [],
    products: db.products || []
  });
});

// Create new booking with Stock Validation, Delivery Fee & Decrement
app.post('/api/bookings', (req, res) => {
  const { customerName, customerPhone, pickupDate, pickupTime, allergens, items, notes, orderType, deliveryAddress } = req.body;

  if (!customerName || !customerName.trim()) {
    return res.status(400).json({ success: false, message: 'Inserisci il tuo Nome e Cognome.' });
  }
  if (!customerPhone || !customerPhone.trim()) {
    return res.status(400).json({ success: false, message: 'Inserisci un recapito telefonico valido.' });
  }
  if (!pickupTime || !pickupTime.trim()) {
    return res.status(400).json({ success: false, message: 'Seleziona un orario di ritiro/consegna.' });
  }
  if (orderType === 'domicilio' && (!deliveryAddress || !deliveryAddress.trim())) {
    return res.status(400).json({ success: false, message: 'Inserisci l\'indirizzo completo per la consegna a domicilio.' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Il carrello è vuoto. Aggiungi almeno un prodotto.' });
  }

  const db = readDB();
  
  // 1. Stock Check Phase
  for (const item of items) {
    const qty = parseInt(item.quantity, 10);
    if (qty > 0) {
      const prodInDb = (db.products || []).find(p => p.id === item.id);
      if (prodInDb) {
        if (!prodInDb.unlimited && prodInDb.available !== false) {
          const currentStock = prodInDb.stock !== undefined ? prodInDb.stock : 10;
          if (currentStock < qty) {
            return res.status(400).json({
              success: false,
              message: `Disponibilità insufficiente per "${prodInDb.name}". Rimasti solo ${currentStock} pz.`
            });
          }
        } else if (prodInDb.available === false) {
          return res.status(400).json({
            success: false,
            message: `Il prodotto "${prodInDb.name}" è attualmente esaurito.`
          });
        }
      }
    }
  }

  // 2. Calculation and Decrement Phase
  let itemsSubtotal = 0;
  const validatedItems = [];

  for (const item of items) {
    const qty = parseInt(item.quantity, 10);
    if (qty > 0) {
      const prodInDb = (db.products || []).find(p => p.id === item.id);
      const unitPrice = prodInDb ? prodInDb.price : Number(item.price || 0);
      const subtotal = qty * unitPrice;
      itemsSubtotal += subtotal;
      
      validatedItems.push({
        id: item.id || `custom-${Date.now()}`,
        name: item.name || (prodInDb ? prodInDb.name : 'Prodotto'),
        category: item.category || (prodInDb ? prodInDb.category : 'altro'),
        price: unitPrice,
        quantity: qty,
        subtotal: Number(subtotal.toFixed(2))
      });

      // Decrement stock if managed
      if (prodInDb && !prodInDb.unlimited) {
        prodInDb.stock = Math.max(0, (prodInDb.stock || 0) - qty);
        if (prodInDb.stock === 0) {
          prodInDb.available = false;
        }
      }
    }
  }

  if (validatedItems.length === 0) {
    return res.status(400).json({ success: false, message: 'Nessun prodotto valido nel carrello.' });
  }

  const isDelivery = (orderType === 'domicilio');
  const deliveryFee = isDelivery ? 2.00 : 0.00;
  const fidelityDisc = Number(req.body.fidelityDiscount || 0);
  const totalAmount = Math.max(0, Number((itemsSubtotal + deliveryFee - fidelityDisc).toFixed(2)));

  const randomCode = 'EG-' + Math.floor(1000 + Math.random() * 9000);
  const now = new Date();
  const defaultDate = pickupDate || getLocalDateString(now);

  const newBooking = {
    id: 'bkg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    code: randomCode,
    customerName: customerName.trim(),
    customerPhone: customerPhone.trim(),
    pickupDate: defaultDate,
    pickupTime: pickupTime.trim(),
    orderType: isDelivery ? 'domicilio' : 'ritiro',
    orderTypeText: isDelivery ? 'Consegna a Domicilio' : 'Ritiro in Sede (Asporto)',
    deliveryAddress: isDelivery ? deliveryAddress.trim() : '',
    deliveryFee: deliveryFee,
    fidelityDiscount: fidelityDisc,
    itemsSubtotal: Number(itemsSubtotal.toFixed(2)),
    allergens: (allergens || '').trim(),
    notes: (notes || '').trim(),
    items: validatedItems,
    totalAmount: totalAmount,
    status: 'in_attesa',
    statusText: 'In attesa di conferma',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  db.bookings = db.bookings || [];
  db.bookings.unshift(newBooking);

  writeDB(db);

  return res.status(201).json({
    success: true,
    message: 'Prenotazione registrata con successo!',
    booking: newBooking
  });
});

app.get('/api/bookings/:idOrCode', (req, res) => {
  const param = req.params.idOrCode;
  const db = readDB();
  const booking = (db.bookings || []).find(b => b.id === param || b.code === param);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Prenotazione non trovata.' });
  }

  res.json({ success: true, booking });
});

// ---------------- ADMIN API ----------------

app.post('/api/admin/login', (req, res) => {
  const { pin } = req.body;
  const db = readDB();
  const validPin = (db.settings && db.settings.adminPin) ? db.settings.adminPin : '1234';

  if (String(pin) === String(validPin)) {
    return res.json({ success: true, message: 'Accesso consentito.' });
  }
  return res.status(401).json({ success: false, message: 'PIN errato.' });
});

app.get('/api/admin/bookings', requireAdmin, (req, res) => {
  const { status, date } = req.query;
  const db = readDB();
  let bookings = db.bookings || [];

  if (status && status !== 'all') {
    bookings = bookings.filter(b => b.status === status);
  }
  if (date) {
    bookings = bookings.filter(b => b.pickupDate === date);
  }

  res.json({ success: true, bookings });
});

app.patch('/api/admin/bookings/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const db = readDB();
  const index = (db.bookings || []).findIndex(b => b.id === id || b.code === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Prenotazione non trovata.' });
  }

  const booking = db.bookings[index];

  if (updates.status) {
    booking.status = updates.status;
    if (updates.status === 'in_attesa') booking.statusText = 'In attesa di conferma';
    if (updates.status === 'confermato') booking.statusText = 'Confermata';
    if (updates.status === 'completato') booking.statusText = 'Completata / Consegnata';
    if (updates.status === 'annullato') booking.statusText = 'Annullata';
  }

  if (updates.customerName) booking.customerName = updates.customerName.trim();
  if (updates.customerPhone) booking.customerPhone = updates.customerPhone.trim();
  if (updates.pickupDate) booking.pickupDate = updates.pickupDate;
  if (updates.pickupTime) booking.pickupTime = updates.pickupTime;
  if (updates.allergens !== undefined) booking.allergens = updates.allergens.trim();
  if (updates.notes !== undefined) booking.notes = updates.notes.trim();
  if (updates.adminNotes !== undefined) booking.adminNotes = updates.adminNotes.trim();
  
  if (updates.orderType !== undefined) {
    booking.orderType = updates.orderType;
    booking.orderTypeText = (updates.orderType === 'domicilio') ? 'Consegna a Domicilio' : 'Ritiro in Sede (Asporto)';
    booking.deliveryFee = (updates.orderType === 'domicilio') ? 2.00 : 0.00;
  }
  if (updates.deliveryAddress !== undefined) {
    booking.deliveryAddress = updates.deliveryAddress.trim();
  }

  if (updates.hasFidelityCard !== undefined) {
    booking.hasFidelityCard = Boolean(updates.hasFidelityCard);
  }
  if (updates.fidelityDiscount !== undefined) {
    booking.fidelityDiscount = Math.max(0, Number(updates.fidelityDiscount || 0));
  }

  if (Array.isArray(updates.items)) {
    booking.items = updates.items;
    let newItemsSub = 0;
    for (const it of booking.items) {
      const q = parseInt(it.quantity, 10) || 1;
      const p = Number(it.price || 0);
      it.quantity = q;
      it.price = p;
      it.subtotal = Number((q * p).toFixed(2));
      newItemsSub += it.subtotal;
    }
    booking.itemsSubtotal = Number(newItemsSub.toFixed(2));
  }

  // Recalculate totalAmount
  const itemsSub = booking.itemsSubtotal !== undefined ? booking.itemsSubtotal : (booking.items || []).reduce((s, it) => s + (it.quantity * it.price), 0);
  const delivFee = (booking.orderType === 'domicilio') ? 2.00 : 0.00;
  booking.deliveryFee = delivFee;
  const fidDisc = Number(booking.fidelityDiscount || 0);
  booking.totalAmount = Math.max(0, Number((itemsSub + delivFee - fidDisc).toFixed(2)));

  booking.updatedAt = new Date().toISOString();
  db.bookings[index] = booking;

  writeDB(db);

  res.json({ success: true, message: 'Prenotazione e comanda aggiornate con successo.', booking });
});

app.delete('/api/admin/bookings/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const initialLength = (db.bookings || []).length;
  db.bookings = (db.bookings || []).filter(b => b.id !== id && b.code !== id);

  if (db.bookings.length === initialLength) {
    return res.status(404).json({ success: false, message: 'Prenotazione non trovata.' });
  }

  writeDB(db);
  res.json({ success: true, message: 'Prenotazione eliminata definitivamente.' });
});

// Customer Directory & Statistics Aggregation API
app.get('/api/admin/customers', requireAdmin, (req, res) => {
  const db = readDB();
  const bookings = db.bookings || [];
  const customerMap = {};

  for (const b of bookings) {
    const rawPhone = (b.customerPhone || '').trim();
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const key = cleanPhone.length >= 6 ? cleanPhone : (b.customerName || 'Cliente').toLowerCase().trim();

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
        lastOrderDate: b.pickupDate || b.createdAt.split('T')[0],
        lastOrderTime: b.pickupTime || '',
        lastOrderCode: b.code || '',
        lastOrderType: b.orderType || 'ritiro',
        lastDeliveryAddress: b.deliveryAddress || '',
        firstSeen: b.createdAt || new Date().toISOString(),
        notes: b.notes || '',
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

    // Keep latest name & address
    if (b.customerName && b.customerName.trim()) c.name = b.customerName.trim();
    if (b.deliveryAddress && b.deliveryAddress.trim()) c.lastDeliveryAddress = b.deliveryAddress.trim();

    // Check date freshness
    if (b.pickupDate && b.pickupDate >= c.lastOrderDate) {
      c.lastOrderDate = b.pickupDate;
      c.lastOrderTime = b.pickupTime || c.lastOrderTime;
      c.lastOrderCode = b.code || c.lastOrderCode;
      c.lastOrderType = b.orderType || c.lastOrderType;
    }
  }

  const customersList = Object.values(customerMap).map(c => {
    c.totalSpent = Number(c.totalSpent.toFixed(2));
    c.isVip = c.totalOrders >= 2 || c.totalSpent >= 25.00;
    return c;
  });

  // Sort by latest order date descending
  customersList.sort((a, b) => (b.lastOrderDate + b.lastOrderTime).localeCompare(a.lastOrderDate + a.lastOrderTime));

  res.json({
    success: true,
    customers: customersList,
    totalCount: customersList.length,
    vipCount: customersList.filter(c => c.isVip).length
  });
});

app.post('/api/admin/customers/clear', requireAdmin, (req, res) => {
  const db = readDB();
  db.bookings = [];
  db.customers = [];
  writeDB(db);
  res.json({ success: true, message: 'Rubrica e storico prenotazioni svuotati con successo.' });
});

// Delete a single customer by phone or ID
app.delete('/api/admin/customers/:phoneOrId', requireAdmin, (req, res) => {
  const target = req.params.phoneOrId;
  const cleanTarget = target.replace(/\D/g, '');
  const db = readDB();
  const initialBookingsCount = (db.bookings || []).length;
  
  db.bookings = (db.bookings || []).filter(b => {
    const rawPhone = (b.customerPhone || '').replace(/\D/g, '');
    const bName = (b.customerName || '').toLowerCase().trim();
    if (cleanTarget && rawPhone === cleanTarget) return false;
    if (target && (b.customerPhone === target || bName === target.toLowerCase().trim())) return false;
    return true;
  });

  writeDB(db);
  res.json({ success: true, message: 'Cliente eliminato dalla rubrica.', deletedCount: initialBookingsCount - db.bookings.length });
});

// Quick Stock Adjustment API: increment/decrement or set exact stock
app.patch('/api/admin/products/:id/stock', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { delta, exactStock, unlimited } = req.body;
  const db = readDB();
  const prod = (db.products || []).find(p => p.id === id);

  if (!prod) {
    return res.status(404).json({ success: false, message: 'Prodotto non trovato.' });
  }

  if (unlimited !== undefined) {
    prod.unlimited = Boolean(unlimited);
  }

  if (exactStock !== undefined) {
    prod.stock = Math.max(0, parseInt(exactStock, 10) || 0);
  } else if (delta !== undefined) {
    const current = prod.stock !== undefined ? prod.stock : 0;
    prod.stock = Math.max(0, current + parseInt(delta, 10));
  }

  if (!prod.unlimited) {
    prod.available = prod.stock > 0;
  } else {
    prod.available = true;
  }

  writeDB(db);
  res.json({ success: true, message: 'Quantità disponibilità aggiornata.', product: prod });
});

app.post('/api/admin/products', requireAdmin, (req, res) => {
  const { name, category, price, description, available, stock, unlimited } = req.body;
  if (!name || !price) {
    return res.status(400).json({ success: false, message: 'Nome e Prezzo sono obbligatori.' });
  }

  const db = readDB();
  const parsedStock = parseInt(stock, 10) >= 0 ? parseInt(stock, 10) : 10;
  const isUnlimited = Boolean(unlimited);

  const newProduct = {
    id: 'prod_' + Date.now(),
    name: name.trim(),
    category: category || 'sfizi',
    price: Number(parseFloat(price).toFixed(2)),
    stock: parsedStock,
    unlimited: isUnlimited,
    description: (description || '').trim(),
    available: isUnlimited ? (available !== false) : (parsedStock > 0)
  };

  db.products = db.products || [];
  db.products.push(newProduct);
  writeDB(db);

  res.status(201).json({ success: true, message: 'Prodotto aggiunto con successo.', product: newProduct });
});

app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, category, price, description, available, stock, unlimited } = req.body;
  const db = readDB();
  const index = (db.products || []).findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Prodotto non trovato.' });
  }

  if (name !== undefined) db.products[index].name = name.trim();
  if (category !== undefined) db.products[index].category = category;
  if (price !== undefined) db.products[index].price = Number(parseFloat(price).toFixed(2));
  if (description !== undefined) db.products[index].description = (description || '').trim();
  if (unlimited !== undefined) db.products[index].unlimited = Boolean(unlimited);
  if (stock !== undefined) {
    db.products[index].stock = Math.max(0, parseInt(stock, 10) || 0);
  }
  
  if (db.products[index].unlimited) {
    if (available !== undefined) db.products[index].available = Boolean(available);
  } else {
    db.products[index].available = db.products[index].stock > 0;
  }

  writeDB(db);
  res.json({ success: true, message: 'Prodotto aggiornato.', product: db.products[index] });
});

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const initialLength = (db.products || []).length;
  db.products = (db.products || []).filter(p => p.id !== id);

  if (db.products.length === initialLength) {
    return res.status(404).json({ success: false, message: 'Prodotto non trovato.' });
  }

  writeDB(db);
  res.json({ success: true, message: 'Prodotto eliminato dal menu.' });
});

app.post('/api/admin/settings', requireAdmin, (req, res) => {
  const { storeName, subtitle, phone, address, adminPin, timeSlots } = req.body;
  const db = readDB();

  db.settings = db.settings || {};
  if (storeName) db.settings.storeName = storeName.trim();
  if (subtitle) db.settings.subtitle = subtitle.trim();
  if (phone) db.settings.phone = phone.trim();
  if (address) db.settings.address = address.trim();
  if (adminPin && adminPin.trim().length >= 4) db.settings.adminPin = adminPin.trim();
  if (Array.isArray(timeSlots)) db.settings.timeSlots = timeSlots;

  writeDB(db);
  res.json({ success: true, message: 'Impostazioni aggiornate con successo.', settings: db.settings });
});

app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const db = readDB();
  const bookings = db.bookings || [];
  const today = getLocalDateString();

  const todayBookings = bookings.filter(b => b.pickupDate === today);
  const pendingCount = bookings.filter(b => b.status === 'in_attesa').length;
  const confirmedCount = bookings.filter(b => b.status === 'confermato').length;
  const completedCount = bookings.filter(b => b.status === 'completato').length;
  
  const todayRevenue = todayBookings
    .filter(b => b.status !== 'annullato')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  res.json({
    success: true,
    stats: {
      totalBookings: bookings.length,
      todayBookingsCount: todayBookings.length,
      pendingCount,
      confirmedCount,
      completedCount,
      todayRevenue: Number(todayRevenue.toFixed(2))
    }
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🔥 EL GALLERO - App di Prenotazione attiva su:`);
  console.log(`👉 Interfaccia Clienti: http://localhost:${PORT}`);
  console.log(`👉 Pannello Titolare:  http://localhost:${PORT}/admin.html`);
  console.log(`   (PIN Predefinito: 230888)`);
  console.log(`=======================================================`);
});