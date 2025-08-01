# Amazon Clone - Multi-Vendor E-commerce Platform

A full-stack e-commerce platform built with modern technologies, allowing multiple vendors to sell their products and customers to purchase them. Features Stripe integration for payments and Supabase for backend services.

## 🚀 Live Demo

[Live Site URL](https://multi-vendor-ecommerce-phi.vercel.app/)

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

- 🎯 **Smart Advertisement System**
  - Automated product promotion
  - Dynamic ad placement based on:
    - Product popularity
    - Recent views
    - Purchase history
    - Seasonal trends
  - Ad performance analytics
  - Vendor-specific promotion slots
  - Smart pricing for ad slots
  - A/B testing capabilities

## 🚀 How the Ad System Works

Our automated advertisement system uses a sophisticated algorithm to optimize product visibility and sales:

### Ad Placement Logic
1. **Popularity Score**
   - Based on views, purchases, and user interactions
   - Weighted by recency of interactions
   - Seasonal adjustments for relevant products

2. **Dynamic Pricing**
   - Automated bid adjustments based on:
     - Time of day
     - User traffic
     - Historical performance
     - Competition level

3. **Smart Targeting**
   - User behavior analysis
   - Purchase history matching
   - Category affinity scoring
   - Geographic relevance

4. **Performance Optimization**
   - Real-time performance tracking
   - Automatic bid adjustments
   - ROI optimization
   - A/B testing of ad placements

### Benefits for Vendors
- Increased product visibility
- Better ROI on advertising spend
- Automated optimization
- Detailed performance analytics
- Competitive advantage through smart pricing

### Benefits for Customers
- More relevant product recommendations
- Seasonal and trending product discovery
- Personalized shopping experience
- Better deals through smart promotion

## 📸 Screenshots

### Customer Interface

#### Homepage & Marketplace
![Homepage](/src/assets/marketplace.png)
*Homepage showing product listings and search functionality*

#### Shopping Cart
![Shopping Cart](/src/assets/shoppingcart.png)
*Shopping cart with product details and checkout option*

#### Payment Processing
![Payment](/src/assets/payment.png)
*Secure payment processing with Stripe integration*

### Vendor Dashboard

#### Product Management
![Vendor Dashboard](/src/assets/vendordashboard.png)
*Vendor dashboard showing product management interface*

#### Analytics & Orders
![Analytics Dashboard](/src/assets/vendoranalytics.png)
*Analytics dashboard showing sales and order statistics*

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
