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

// ─── PRODUCTION ENDPOINT (per HyperPay docs: https://oppwa.com) ──
const HYPERPAY_BASE = 'https://oppwa.com';

// ─── HELPER: unique merchantTransactionId per order ──────────────
function generateMerchantTransactionId() {
  const ts     = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `MOCK-${ts}-${random}`;
}

// ─── 1. PREPARE CHECKOUT ─────────────────────────────────────────
// Frontend POSTs cart total → we call HyperPay → return checkoutId
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
    console.log(`→ Checkout | ${params.get('amount')} ${params.get('currency')} | ref: ${merchantTransactionId}`);

    const response = await fetch(`${HYPERPAY_BASE}/v1/checkouts`, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type':  'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();
    console.log('HyperPay response:', JSON.stringify(data));

    if (!data.id) {
      return res.status(400).json({ error: 'HyperPay rejected the request', details: data });
    }

    console.log(`✅ checkoutId: ${data.id}`);
    res.json({ checkoutId: data.id, merchantTransactionId });

  } catch (err) {
    console.error('HyperPay network error:', err.message);
    res.status(500).json({ error: 'Failed to reach HyperPay', message: err.message });
  }
});

// ─── 2. GET PAYMENT STATUS ───────────────────────────────────────
// Called from success.html with the resourcePath HyperPay returns
app.get('/api/payment-status', async (req, res) => {
  const { resourcePath } = req.query;

  if (!resourcePath) {
    return res.status(400).json({ error: 'resourcePath is required' });
  }

  // Per docs: baseUrl must end in "/" + resourcePath
  const url = `${HYPERPAY_BASE}/${resourcePath}?entityId=${ENTITY_ID}`;

  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` },
    });

    const data = await response.json();
    console.log(`✅ Payment status: ${data.result?.code} — ${data.result?.description}`);
    res.json(data);

  } catch (err) {
    console.error('Payment status error:', err.message);
    res.status(500).json({ error: 'Failed to fetch payment status', message: err.message });
  }
});

// ─── HEALTH CHECK ────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', hyperpayBase: HYPERPAY_BASE, timestamp: new Date().toISOString() });
});

// ─── STATIC FALLBACK ─────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 MockStore running on port ${PORT}`);
  console.log(`   HyperPay: ${HYPERPAY_BASE}`);
});
