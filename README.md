# FindMyLine (Next.js)

Refactored Next.js App Router version of the original Vite + React Router app. Uses Firebase Auth + Firestore and Stripe subscriptions, ready for Vercel.

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Environment Variables

Create a `.env.local` file with the following:

### Firebase Client (public)

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Firebase Admin (server)

```
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

Note: `FIREBASE_PRIVATE_KEY` should include newline escapes (`\n`) in `.env.local`.

### Stripe

```
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ROOKIE=
STRIPE_PRICE_AMATEUR=
STRIPE_PRICE_PRO=
```

### App

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Odds API

```
ODDS_API_BASE_URL=https://api.the-odds-api.com/v4
ODDS_API_KEY=
ODDS_API_REGIONS=us
ODDS_API_MARKETS=h2h,spreads,totals
ODDS_API_ODDS_FORMAT=american
ODDS_API_DATE_FORMAT=iso
```

## Stripe Webhook URL

Production:

```
https://your-domain.com/api/stripe/webhook
```

Local testing (Stripe CLI):

```
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

## Firestore Security Rules (Minimal Example)

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /Subscriptions/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /invites/{inviteId} {
      allow read: if false;
      allow write: if false;
    }
  }
}
```

## Notes

- Stripe subscription state is stored in `Subscriptions/{uid}` and updated by webhooks + sync endpoint.
- Webhook events update subscription status server-side.
