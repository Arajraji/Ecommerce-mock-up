const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve all HTML/CSS/JS files from the current directory
app.use(express.static(path.join(__dirname)));

// ─── HYPERPAY CHECKOUT ENDPOINT ─────────────────────────────────
// This is where your frontend calls to get a checkoutId from HyperPay
// Fill in your real credentials when ready
app.post('/api/create-checkout', async (req, res) => {
  const { amount, currency, merchantTransactionId } = req.body;

  // ── CONFIG ── Replace these with your HyperPay test credentials
  const ENTITY_ID    = process.env.HYPERPAY_ENTITY_ID    || 'YOUR_ENTITY_ID';
  const ACCESS_TOKEN = process.env.HYPERPAY_ACCESS_TOKEN || 'YOUR_ACCESS_TOKEN';
  const HYPERPAY_URL = 'https://eu-test.oppwa.com/v1/checkouts';
  // For production: https://oppwa.com/v1/checkouts

  try {
    const params = new URLSearchParams({
      entityId:              ENTITY_ID,
      amount:                amount,
      currency:              currency || 'SAR',
      paymentType:           'DB',
      merchantTransactionId: merchantTransactionId,
      'customer.email':      req.body.email || 'test@mockstore.com',
    });

    const response = await fetch(HYPERPAY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type':  'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok || !data.id) {
      console.error('HyperPay error:', data);
      return res.status(400).json({ error: 'Failed to create checkout', details: data });
    }

    console.log(`✅ Checkout created: ${data.id} | Amount: ${amount} ${currency}`);
    res.json({ checkoutId: data.id });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── HEALTH CHECK ────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── FALLBACK ────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 MockStore running on port ${PORT}`);
  console.log(`   Local: http://localhost:${PORT}`);
});
