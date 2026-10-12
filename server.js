const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── CREDENTIALS ─────────────────────────────────────────────────
const ENTITY_ID    = process.env.HYPERPAY_ENTITY_ID    || '8ac9a4c99bbbfffe019bd694292114e2';
const ACCESS_TOKEN = process.env.HYPERPAY_ACCESS_TOKEN || 'OGFjZGE0Y2M4YjY2NzQwYjAxOGI4YmEzNjhmOTM3M2R8ek1zSkY0RkRERFRucnFjeA==';
const HYPERPAY_BASE = 'https://oppwa.com';

// ─── IN-MEMORY STATE (replace with DB in production) ─────────────
let tables = [
  { id: 1, name: 'Table 1', seats: 4, status: 'available', orders: [] },
  { id: 2, name: 'Table 2', seats: 2, status: 'available', orders: [] },
  { id: 3, name: 'Table 3', seats: 6, status: 'available', orders: [] },
  { id: 4, name: 'Table 4', seats: 4, status: 'available', orders: [] },
  { id: 5, name: 'Table 5', seats: 8, status: 'available', orders: [] },
  { id: 6, name: 'Table 6', seats: 2, status: 'available', orders: [] },
];

const menu = [
  // Starters
  { id: 'm1', category: 'Starters', name: 'Hummus & Bread', price: 22, description: 'Creamy hummus with warm pita bread and olive oil', emoji: '🫓' },
  { id: 'm2', category: 'Starters', name: 'Soup of the Day', price: 28, description: 'Ask your waiter for today\'s freshly made soup', emoji: '🍲' },
  { id: 'm3', category: 'Starters', name: 'Fattoush Salad', price: 32, description: 'Mixed greens, tomato, cucumber, crispy bread, sumac dressing', emoji: '🥗' },
  { id: 'm4', category: 'Starters', name: 'Cheese Platter', price: 48, description: 'Selection of local and imported cheeses with crackers', emoji: '🧀' },
  // Mains
  { id: 'm5', category: 'Mains', name: 'Grilled Chicken', price: 68, description: 'Half chicken marinated in Arabic spices, served with rice and salad', emoji: '🍗' },
  { id: 'm6', category: 'Mains', name: 'Lamb Kabsa', price: 85, description: 'Slow-cooked lamb on fragrant kabsa rice with nuts and raisins', emoji: '🍛' },
  { id: 'm7', category: 'Mains', name: 'Grilled Salmon', price: 92, description: 'Atlantic salmon fillet, lemon butter sauce, seasonal vegetables', emoji: '🐟' },
  { id: 'm8', category: 'Mains', name: 'Beef Burger', price: 58, description: 'Wagyu beef patty, brioche bun, caramelised onions, special sauce', emoji: '🍔' },
  { id: 'm9', category: 'Mains', name: 'Pasta Arrabbiata', price: 52, description: 'Penne in spicy tomato sauce with fresh basil and parmesan', emoji: '🍝' },
  { id: 'm10', category: 'Mains', name: 'Margherita Pizza', price: 55, description: 'San Marzano tomato, fresh mozzarella, basil, extra virgin olive oil', emoji: '🍕' },
  // Sides
  { id: 'm11', category: 'Sides', name: 'Crispy Fries', price: 18, description: 'Golden fries with sea salt and your choice of dipping sauce', emoji: '🍟' },
  { id: 'm12', category: 'Sides', name: 'Steamed Rice', price: 12, description: 'Fragrant basmati rice', emoji: '🍚' },
  { id: 'm13', category: 'Sides', name: 'Grilled Vegetables', price: 22, description: 'Seasonal vegetables, olive oil, herbs', emoji: '🥦' },
  // Drinks
  { id: 'm14', category: 'Drinks', name: 'Fresh Juice', price: 22, description: 'Orange, mango, watermelon, or carrot — freshly squeezed', emoji: '🥤' },
  { id: 'm15', category: 'Drinks', name: 'Arabic Coffee', price: 15, description: 'Traditional qahwa with dates', emoji: '☕' },
  { id: 'm16', category: 'Drinks', name: 'Soft Drink', price: 10, description: 'Pepsi, 7-Up, Mirinda, or water', emoji: '🧃' },
  { id: 'm17', category: 'Drinks', name: 'Lemon Mint', price: 18, description: 'Fresh lemon, mint leaves, sugar syrup', emoji: '🍋' },
  // Desserts
  { id: 'm18', category: 'Desserts', name: 'Umm Ali', price: 32, description: 'Classic Egyptian bread pudding with nuts, raisins, cream', emoji: '🍮' },
  { id: 'm19', category: 'Desserts', name: 'Kunafa', price: 35, description: 'Crispy shredded pastry, sweet cheese, rose water syrup', emoji: '🧆' },
  { id: 'm20', category: 'Desserts', name: 'Chocolate Lava Cake', price: 38, description: 'Warm chocolate cake with molten centre, vanilla ice cream', emoji: '🍫' },
];

let orders = {}; // orderId → order object

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase();
}

function getMerchantTransactionId() {
  return `TBL-${Date.now()}-${Math.random().toString(36).substr(2,5).toUpperCase()}`;
}

// ─── MENU ────────────────────────────────────────────────────────
app.get('/api/menu', (req, res) => res.json(menu));

// ─── TABLES ──────────────────────────────────────────────────────
app.get('/api/tables', (req, res) => res.json(tables));

app.get('/api/tables/:id', (req, res) => {
  const table = tables.find(t => t.id === parseInt(req.params.id));
  if (!table) return res.status(404).json({ error: 'Table not found' });
  res.json(table);
});

app.post('/api/tables/:id/seat', (req, res) => {
  const table = tables.find(t => t.id === parseInt(req.params.id));
  if (!table) return res.status(404).json({ error: 'Table not found' });
  table.status = 'occupied';
  table.orders = [];
  table.seatedAt = new Date().toISOString();
  res.json(table);
});

app.post('/api/tables/:id/clear', (req, res) => {
  const table = tables.find(t => t.id === parseInt(req.params.id));
  if (!table) return res.status(404).json({ error: 'Table not found' });
  table.status = 'available';
  table.orders = [];
  table.seatedAt = null;
  res.json(table);
});

// ─── ORDERS ──────────────────────────────────────────────────────
// Add items to a table's order
app.post('/api/tables/:id/order', (req, res) => {
  const table = tables.find(t => t.id === parseInt(req.params.id));
  if (!table) return res.status(404).json({ error: 'Table not found' });

  const { items } = req.body; // [{ menuItemId, qty }]
  if (!items || !items.length) return res.status(400).json({ error: 'No items provided' });

  items.forEach(({ menuItemId, qty }) => {
    const menuItem = menu.find(m => m.id === menuItemId);
    if (!menuItem) return;
    const existing = table.orders.find(o => o.menuItemId === menuItemId);
    if (existing) {
      existing.qty += qty;
    } else {
      table.orders.push({
        id: generateId(),
        menuItemId,
        name: menuItem.name,
        price: menuItem.price,
        emoji: menuItem.emoji,
        qty,
        status: 'pending', // pending | served
        addedAt: new Date().toISOString(),
      });
    }
  });

  table.status = 'occupied';
  res.json(table);
});

app.post('/api/tables/:id/order/:orderId/serve', (req, res) => {
  const table = tables.find(t => t.id === parseInt(req.params.id));
  if (!table) return res.status(404).json({ error: 'Table not found' });
  const item = table.orders.find(o => o.id === req.params.orderId);
  if (item) item.status = 'served';
  res.json(table);
});

// ─── INVOICE ─────────────────────────────────────────────────────
app.get('/api/tables/:id/invoice', (req, res) => {
  const table = tables.find(t => t.id === parseInt(req.params.id));
  if (!table) return res.status(404).json({ error: 'Table not found' });

  const subtotal = table.orders.reduce((s, o) => s + o.price * o.qty, 0);
  const vat      = parseFloat((subtotal * 0.15).toFixed(2));
  const total    = parseFloat((subtotal + vat).toFixed(2));

  res.json({ table: table.name, items: table.orders, subtotal, vat, total, currency: 'SAR' });
});

// ─── PAYMENT ─────────────────────────────────────────────────────
app.post('/api/payment/checkout', async (req, res) => {
  const { tableId } = req.body;
  const table = tables.find(t => t.id === parseInt(tableId));
  if (!table) return res.status(404).json({ error: 'Table not found' });

  const subtotal = table.orders.reduce((s, o) => s + o.price * o.qty, 0);
  const total    = parseFloat((subtotal * 1.15).toFixed(2));
  const merchantTransactionId = getMerchantTransactionId();

  const params = new URLSearchParams({
    entityId:              ENTITY_ID,
    amount:                total.toFixed(2),
    currency:              'SAR',
    paymentType:           'DB',
    merchantTransactionId: merchantTransactionId,
  });

  try {
    const response = await fetch(`${HYPERPAY_BASE}/v1/checkouts`, {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const data = await response.json();
    console.log('HyperPay response:', JSON.stringify(data));

    if (!data.id) return res.status(400).json({ error: 'HyperPay error', details: data });

    // Store pending payment ref
    orders[merchantTransactionId] = { tableId, total, merchantTransactionId, status: 'pending', checkoutId: data.id };

    res.json({ checkoutId: data.id, merchantTransactionId, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/payment/status', async (req, res) => {
  const { resourcePath, merchantTransactionId } = req.query;
  if (!resourcePath) return res.status(400).json({ error: 'resourcePath required' });

  const url = `${HYPERPAY_BASE}/${resourcePath}?entityId=${ENTITY_ID}`;
  try {
    const response = await fetch(url, { headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` } });
    const data = await response.json();

    // If paid, clear the table
    if (/^(000\.000\.|000\.100\.1)/.test(data.result?.code)) {
      const order = orders[merchantTransactionId];
      if (order) {
        const table = tables.find(t => t.id === order.tableId);
        if (table) { table.status = 'available'; table.orders = []; }
        orders[merchantTransactionId].status = 'paid';
      }
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── HEALTH ──────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', hyperpayBase: HYPERPAY_BASE }));

// ─── STATIC FILES (must come AFTER all API routes) ───────────────
app.use(express.static(path.join(__dirname)));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, () => console.log(`🍽️  Restaurant POS running on port ${PORT}`));
