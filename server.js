const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// ─── CREDENTIALS (set as env vars in Railway) ────────────────────
const ENTITY_ID    = process.env.HYPERPAY_ENTITY_ID    || '8ac9a4c99bbbfffe019bd694292114e2';
const ACCESS_TOKEN = process.env.HYPERPAY_ACCESS_TOKEN || 'OGFjZGE0Y2M4YjY2NzQwYjAxOGI4YmEzNjhmOTM3M2R8ek1zSkY0RkRERFRucnFjeA==';
const HYPERPAY_BASE = 'https://eu-test.oppwa.com';

// ─── HELPER: unique merchantTransactionId ────────────────────────
function generateMerchantTransactionId() {
  const ts     = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `MOCK-${ts}-${random}`;
}

// ─── 1. PREPARE CHECKOUT ─────────────────────────────────────────
// Frontend POSTs cart total here → we call HyperPay → return checkoutId
app.post('/api/create-checkout', async (req, res) => {
  const { amount, currency } = req.body;

  if (!amount || isNaN(parseFloat(amount))) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  const merchantTransactionId = generateMerchantTransactionId();

  const params = new URLSearchParams({
    entityId:              ENTITY_ID,
    amount:                parseFloat(amount).toFixed(2),
    currency:              currency || 'SAR',
    paymentType:           'DB',
    merchantTransactionId: merchantTransactionId,
  });

  try {
    console.log(`→ Creating checkout | ${params.get('amount')} ${params.get('currency')} | ref: ${merchantTransactionId}`);

    const response = await fetch(`${HYPERPAY_BASE}/v1/checkouts`, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type':  'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!data.id) {
      console.error('HyperPay rejected checkout:', JSON.stringify(data));
      return res.status(400).json({ error: 'HyperPay rejected the request', details: data });
    }

    console.log(`✅ checkoutId: ${data.id}`);
    res.json({
      checkoutId:            data.id,
      merchantTransactionId: merchantTransactionId,
    });

  } catch (err) {
    console.error('Network error calling HyperPay:', err.message);
    res.status(500).json({ error: 'Failed to reach HyperPay', message: err.message });
  }
});

// ─── 2. GET PAYMENT STATUS ───────────────────────────────────────
// Called from success.html with the resourcePath HyperPay appends to the redirect URL
app.get('/api/payment-status', async (req, res) => {
  const { resourcePath } = req.query;

  if (!resourcePath) {
    return res.status(400).json({ error: 'resourcePath is required' });
  }

  const url = `${HYPERPAY_BASE}${resourcePath}?entityId=${ENTITY_ID}`;

  try {
    console.log(`→ Fetching payment status: ${url}`);

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` },
    });

    const data = await response.json();
    console.log(`✅ Payment status: ${data.result?.code} — ${data.result?.description}`);
    res.json(data);

  } catch (err) {
    console.error('Error fetching payment status:', err.message);
    res.status(500).json({ error: 'Failed to fetch payment status', message: err.message });
  }
});

// ─── HEALTH CHECK ────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── STATIC FALLBACK ─────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 MockStore running on port ${PORT}`);
  console.log(`   Local: http://localhost:${PORT}`);
});
