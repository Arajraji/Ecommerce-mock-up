# MockStore — HyperPay Checkout Test

A minimal mock e-commerce store for testing HyperPay payment integration.

---

## Files

```
mock-store/
├── index.html      → Product listing + cart + payload preview
├── checkout.html   → HyperPay widget page + order summary
├── success.html    → Post-payment success screen
├── failure.html    → Post-payment failure screen
└── README.md       → This file
```

---

## How to Run Locally

Option A — VS Code Live Server (easiest):
1. Open the folder in VS Code
2. Install the "Live Server" extension
3. Right-click index.html → Open with Live Server

Option B — Python:
```bash
cd mock-store
python3 -m http.server 8080
# Open: http://localhost:8080
```

Option C — Node:
```bash
npx serve .
```

---

## Connecting HyperPay (3 Steps)

### Step 1 — Get Test Credentials
Sign up at https://hyperpay.com and get:
- `entityId` (test)
- `accessToken` (test)

### Step 2 — Create a Backend Endpoint
HyperPay requires a server-side call to get a checkoutId.
Example (Node.js):

```javascript
app.post('/api/create-checkout', async (req, res) => {
  const { amount, currency, merchantTransactionId } = req.body;

  const response = await fetch('https://eu-test.oppwa.com/v1/checkouts', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      entityId: 'YOUR_ENTITY_ID',
      amount: amount,
      currency: currency,
      paymentType: 'DB',
      merchantTransactionId: merchantTransactionId
    })
  });

  const data = await response.json();
  res.json({ checkoutId: data.id });
});
```

### Step 3 — Activate Widget in checkout.html
Uncomment the `initCheckout()` call at the bottom of checkout.html.
It will fetch the checkoutId and render the HyperPay payment form.

---

## Test Cards (HyperPay)

| Card | Number | Result |
|------|--------|--------|
| Visa (success) | 4111 1111 1111 1111 | ✅ Approved |
| Mastercard (success) | 5105 1051 0510 5100 | ✅ Approved |
| Any card (decline) | 4000 0000 0000 0002 | ❌ Declined |

Expiry: any future date · CVV: any 3 digits

---

## Data Captured Per Transaction

| Field | Value | Source |
|-------|-------|--------|
| amount | cart total (decimal) | index.html |
| currency | SAR | hardcoded |
| paymentType | DB | hardcoded |
| merchantTransactionId | ORD-{timestamp}-{random} | generated |
| entityId | your HyperPay ID | config |
| shopperResultUrl | /success.html | config |
| cart items | name, qty, price per item | cart state |

---

## HyperPay API Docs
https://wordpresshyperpay.docs.oppwa.com/
