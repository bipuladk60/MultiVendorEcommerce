# Amazon Clone - Multi-Vendor E-commerce Platform

A full-stack e-commerce platform built with modern technologies, allowing multiple vendors to sell their products and customers to purchase them. Features Stripe integration for payments and Supabase for backend services.

## 🚀 Live Demo

[Live Site URL](https://multi-vendor-ecommerce-bipuladk60.vercel.app/)

## ✨ Features

- 🛍️ **Multi-Vendor Support**

  - Vendor registration and dashboard
  - Product management (add, edit, delete)
  - Order management
  - Sales analytics with charts
- 👤 **Customer Features**

  - User authentication
  - Product browsing and search
  - Shopping cart
  - Order history
  - Multiple shipping addresses
- 💳 **Payment Integration**

  - Secure payments via Stripe
  - Vendor payout management
  - Order tracking

## 🛠️ Tech Stack

### Frontend

- **React 18** - UI Library
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Router** - Navigation
- **TanStack Query** - Data fetching and caching
- **Chart.js** - Analytics visualization
- **React Icons** - Icon library

### Backend & Services

- **Supabase**

  - Authentication
  - PostgreSQL Database
  - Edge Functions
  - Row Level Security
  - Real-time subscriptions
- **Stripe**

  - Payment processing
  - Connect platform for vendor payouts
  - Webhook integration

### Deployment

- **Vercel** - Frontend hosting
- **Supabase** - Backend hosting

## 🏗️ Project Structure

```
amazon-clone/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── context/       # React context providers
│   ├── utils/         # Utility functions
│   └── hooks/         # Custom React hooks
├── supabase/
│   ├── functions/     # Edge functions
│   
└── public/           # Static assets
```

## 🚀 Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/bipuladk60/MultiVendorEcommerce.git
   cd amazon-clone
   ```
2. **Install dependencies**

   ```bash
   npm install
   ```
3. **Set up environment variables**
   Create a `.env` file in the root directory:

   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ```
4. **Run the development server**

   ```bash
   npm run dev
   ```

## 🧪 Testing

### Stripe Test Cards

Use these cards for testing the payment integration:

- **Successful payment**

  ```
  Card Number: 4242 4242 4242 4242
  Expiry: Any future date (e.g., 12/34)
  CVC: Any 3 digits
  ```
- **Payment requires authentication**

  ```
  Card Number: 4000 0025 0000 3155
  Expiry: Any future date
  CVC: Any 3 digits
  ```
- **Payment declined**

  ```
  Card Number: 4000 0000 0000 9995
  Expiry: Any future date
  CVC: Any 3 digits
  ```

### Test User Accounts

To test the application:

1. **Create a Customer Account**

   - Click "Sign Up" on the homepage
   - Use any test email (e.g., your.test@example.com)
   - Choose a secure password
   - You'll be automatically logged in as a customer
2. **Create a Vendor Account**

   - Click "Become a Vendor" or visit the vendor registration page
   - Use a different test email than your customer account
   - Complete the business information
   - You'll need to set up Stripe Connect to accept payments

Note: Use separate email addresses for customer and vendor accounts as one email can only be associated with one type of account.

## 🔐 Security Features

- Supabase Row Level Security (RLS) policies
- Secure payment processing with Stripe
- JWT authentication
- Protected API routes
- Input validation and sanitization

## 📱 Responsive Design

The application is fully responsive and optimized for:

- Desktop screens
- Tablets
- Mobile devices
