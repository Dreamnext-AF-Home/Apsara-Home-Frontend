'use client';

import { useState, useEffect, useMemo, useRef } from 'react';

type TestStatus = 'pending' | 'pass' | 'bug' | 'skip';
type FilterCategory = 'all' | 'frontend' | 'backend';

interface TestCase {
  id: string;
  title: string;
  expected: string;
  sectionId: string;
  sectionTitle: string;
  category: 'frontend' | 'backend';
}

interface TestSection {
  id: string;
  title: string;
  category: 'frontend' | 'backend';
  tests: Omit<TestCase, 'sectionId' | 'sectionTitle' | 'category'>[];
}

const SECTIONS: TestSection[] = [
  {
    id: 'login', title: '1.1 Login Form', category: 'frontend',
    tests: [
      { id: 'F-AUTH-01', title: 'Valid email & password login', expected: 'Redirected to homepage, token stored' },
      { id: 'F-AUTH-02', title: 'Invalid password shows error', expected: '"Invalid credentials" message' },
      { id: 'F-AUTH-03', title: 'Non-existent email shows error', expected: '"Account not found" message' },
      { id: 'F-AUTH-04', title: 'Empty fields — inline validation', expected: 'Both fields show errors' },
      { id: 'F-AUTH-05', title: 'Invalid email format', expected: '"Enter a valid email" field error' },
      { id: 'F-AUTH-06', title: 'Show/hide password toggle', expected: 'Password text toggles visible/hidden' },
      { id: 'F-AUTH-07', title: 'Session persistence (remember me)', expected: 'Still logged in after tab close' },
      { id: 'F-AUTH-08', title: 'Google OAuth login', expected: 'Google consent → returns logged in' },
      { id: 'F-AUTH-09', title: 'Facebook OAuth login', expected: 'Facebook consent → returns logged in' },
      { id: 'F-AUTH-10', title: 'Passkey / biometric login', expected: 'Browser prompts WebAuthn, logs in' },
      { id: 'F-AUTH-11', title: '2FA / MFA TOTP flow', expected: 'Prompted for TOTP before accessing app' },
      { id: 'F-AUTH-12', title: '2FA wrong OTP denied', expected: 'Error shown, access denied' },
      { id: 'F-AUTH-13', title: 'Forgot password link navigates', expected: 'Navigates to /forgot-password' },
      { id: 'F-AUTH-14', title: 'Login loading state on submit', expected: 'Spinner shown, button disabled' },
      { id: 'F-AUTH-15', title: 'Login form on mobile (390px)', expected: 'All elements visible and usable' },
    ],
  },
  {
    id: 'register', title: '1.2 Sign Up Form', category: 'frontend',
    tests: [
      { id: 'F-REG-01', title: 'Successful registration', expected: 'OTP sent, redirected to verification' },
      { id: 'F-REG-02', title: 'Duplicate email blocked', expected: '"Email already in use"' },
      { id: 'F-REG-03', title: 'Duplicate username blocked', expected: '"Username already taken"' },
      { id: 'F-REG-04', title: 'Invalid referral code', expected: '"Invalid referral code" error' },
      { id: 'F-REG-05', title: 'Valid referral code accepted', expected: 'Code accepted, upline shown' },
      { id: 'F-REG-06', title: 'Password mismatch validation', expected: '"Passwords do not match" error' },
      { id: 'F-REG-07', title: 'Weak password blocked', expected: '"At least 8 characters" error' },
      { id: 'F-REG-08', title: 'Empty required fields', expected: 'All required fields show errors' },
      { id: 'F-REG-09', title: 'Real-time email availability', expected: 'Live "Email already taken" feedback' },
      { id: 'F-REG-10', title: 'Real-time username availability', expected: 'Live "Username taken" feedback' },
      { id: 'F-REG-11', title: 'OTP sent confirmation', expected: '"Check your email" message shown' },
      { id: 'F-REG-12', title: 'Register form on mobile', expected: 'Form scrolls and submits properly' },
    ],
  },
  {
    id: 'otp', title: '1.3 OTP Verification', category: 'frontend',
    tests: [
      { id: 'F-OTP-01', title: 'Valid OTP entry', expected: 'Account verified, redirect to dashboard' },
      { id: 'F-OTP-02', title: 'Wrong OTP shows error', expected: '"Invalid OTP. Try again."' },
      { id: 'F-OTP-03', title: 'Expired OTP shows error', expected: '"OTP has expired"' },
      { id: 'F-OTP-04', title: 'Resend OTP works', expected: 'New OTP sent, countdown resets' },
      { id: 'F-OTP-05', title: 'Resend OTP cooldown enforced', expected: 'Button disabled during cooldown' },
      { id: 'F-OTP-06', title: 'Auto-focus first OTP input', expected: 'First input focused on page load' },
      { id: 'F-OTP-07', title: 'Paste OTP auto-fills all inputs', expected: 'All 6 digits filled from clipboard' },
    ],
  },
  {
    id: 'password', title: '1.4 Forgot & Reset Password', category: 'frontend',
    tests: [
      { id: 'F-PWD-01', title: 'Forgot password — valid email', expected: '"Reset link sent" message' },
      { id: 'F-PWD-02', title: 'Forgot password — unregistered email', expected: '"Email not found" error' },
      { id: 'F-PWD-03', title: 'Reset password — valid token', expected: 'Password updated, redirect to login' },
      { id: 'F-PWD-04', title: 'Reset password — expired token', expected: '"Link has expired" error' },
      { id: 'F-PWD-05', title: 'Reset password — mismatch', expected: 'Inline validation error' },
      { id: 'F-PWD-06', title: 'Forced password change on login', expected: 'User prompted before accessing app' },
    ],
  },
  {
    id: 'navigation', title: '1.5 Homepage & Navigation', category: 'frontend',
    tests: [
      { id: 'F-NAV-01', title: 'Logo navigates home', expected: 'Returns to /' },
      { id: 'F-NAV-02', title: 'All main nav links work', expected: 'Correct page loads for each link' },
      { id: 'F-NAV-03', title: 'Cart badge updates on add', expected: 'Count increments on cart icon' },
      { id: 'F-NAV-04', title: 'Login/Register shown when logged out', expected: 'Auth buttons visible in nav' },
      { id: 'F-NAV-05', title: 'Profile menu shown when logged in', expected: 'Avatar/dropdown visible' },
      { id: 'F-NAV-06', title: 'Logout clears session', expected: 'Token cleared, redirect to login' },
      { id: 'F-NAV-07', title: 'Mobile hamburger menu', expected: 'Menu opens, all links accessible' },
      { id: 'F-NAV-08', title: 'Homepage banners load', expected: 'No broken images in banner' },
    ],
  },
  {
    id: 'products', title: '1.6 Product Browsing & Search', category: 'frontend',
    tests: [
      { id: 'F-PROD-01', title: 'Category filter works', expected: 'Products filtered to category' },
      { id: 'F-PROD-02', title: 'Brand filter works', expected: 'Products filtered to brand' },
      { id: 'F-PROD-03', title: 'By-room filter works', expected: 'Only room-specific products shown' },
      { id: 'F-PROD-04', title: 'Price range filter works', expected: 'Products within price range' },
      { id: 'F-PROD-05', title: 'Search by keyword', expected: 'Relevant results appear' },
      { id: 'F-PROD-06', title: 'Search with no results', expected: '"No products found" message' },
      { id: 'F-PROD-07', title: 'Product detail page loads', expected: 'Correct name, images, price shown' },
      { id: 'F-PROD-08', title: 'Image gallery thumbnail click', expected: 'Main image changes' },
      { id: 'F-PROD-09', title: 'Product variant selection', expected: 'Price and stock updates' },
      { id: 'F-PROD-10', title: 'Out of stock product', expected: '"Out of Stock" badge, Add to Cart disabled' },
      { id: 'F-PROD-11', title: 'Product reviews section', expected: 'Rating, user, comment shown' },
      { id: 'F-PROD-12', title: 'Add to wishlist', expected: 'Heart icon fills, item added' },
      { id: 'F-PROD-13', title: 'Add to cart from product page', expected: 'Cart count increments, toast shown' },
      { id: 'F-PROD-14', title: 'Pagination / infinite scroll', expected: 'More products load on scroll' },
    ],
  },
  {
    id: 'checkout', title: '1.7 Cart & Checkout', category: 'frontend',
    tests: [
      { id: 'F-CART-01', title: 'View cart with items', expected: 'Items listed with qty and price' },
      { id: 'F-CART-02', title: 'Increase item quantity', expected: 'Qty updates, subtotal recalculates' },
      { id: 'F-CART-03', title: 'Decrease qty — cannot go below 1', expected: 'Min qty enforced at 1' },
      { id: 'F-CART-04', title: 'Remove item from cart', expected: 'Item removed, total updates' },
      { id: 'F-CART-05', title: 'Empty cart state shown', expected: '"Your cart is empty" message' },
      { id: 'F-CART-06', title: 'Apply valid voucher code', expected: 'Discount applied to total' },
      { id: 'F-CART-07', title: 'Invalid voucher code rejected', expected: '"Invalid or expired voucher"' },
      { id: 'F-CART-08', title: 'Checkout as guest redirects', expected: 'Prompted to login/sign in' },
      { id: 'F-CART-09', title: 'Customer info step — valid address', expected: 'Address saved, proceed to payment' },
      { id: 'F-CART-10', title: 'Missing checkout fields validation', expected: 'Field errors shown' },
      { id: 'F-CART-11', title: 'PayMongo payment — success', expected: 'Redirected to /checkout/success' },
      { id: 'F-CART-12', title: 'PayMongo payment — failed', expected: 'Redirected to /checkout/failed' },
      { id: 'F-CART-13', title: 'Order summary totals correct', expected: 'Subtotal + shipping + discount = total' },
      { id: 'F-CART-14', title: 'Shipping rate displayed', expected: 'Correct rate before confirming' },
    ],
  },
  {
    id: 'orders', title: '1.8 Orders & Tracking', category: 'frontend',
    tests: [
      { id: 'F-ORD-01', title: 'Orders list shows all past orders', expected: 'All orders with status shown' },
      { id: 'F-ORD-02', title: 'Order status badge color-coded', expected: 'Pending/Shipped/Delivered styled' },
      { id: 'F-ORD-03', title: 'Track shipped order', expected: 'Shipping timeline shown' },
      { id: 'F-ORD-04', title: 'Empty orders state', expected: '"No orders yet" for new accounts' },
      { id: 'F-ORD-05', title: 'Order detail view correct', expected: 'Items, totals, address all accurate' },
    ],
  },
  {
    id: 'profile', title: '1.9 Profile & KYC', category: 'frontend',
    tests: [
      { id: 'F-PROF-01', title: 'View profile page', expected: 'Name, email, member tier shown' },
      { id: 'F-PROF-02', title: 'Edit profile info saves', expected: 'Changes saved, success toast' },
      { id: 'F-PROF-03', title: 'Upload profile photo', expected: 'Photo updated in nav and profile' },
      { id: 'F-PROF-04', title: 'KYC form submit', expected: 'Status changes to "Pending Review"' },
      { id: 'F-PROF-05', title: 'KYC missing document validation', expected: 'Validation error on missing files' },
      { id: 'F-PROF-06', title: 'Member tier badge shown', expected: 'Current tier and progress visible' },
      { id: 'F-PROF-07', title: 'Change password from profile', expected: 'Password changed, session stays' },
      { id: 'F-PROF-08', title: 'Wrong old password rejected', expected: '"Current password is incorrect"' },
    ],
  },
  {
    id: 'rewards', title: '1.10 Rewards & Wallet', category: 'frontend',
    tests: [
      { id: 'F-RWD-01', title: 'Rewards page loads', expected: 'Cashback, unilevel, bonus info shown' },
      { id: 'F-RWD-02', title: 'Wallet balance displayed', expected: 'e-GC and PV balance shown' },
      { id: 'F-RWD-03', title: 'Transaction history shown', expected: 'Credits and debits with dates' },
      { id: 'F-RWD-04', title: 'Referral link copy works', expected: 'Unique URL shown, copies to clipboard' },
      { id: 'F-RWD-05', title: 'Ranking leaderboard loads', expected: 'Top members and tiers shown' },
      { id: 'F-RWD-06', title: 'Encashment request form', expected: 'Form accepts payout details' },
      { id: 'F-RWD-07', title: 'Encashment insufficient balance', expected: '"Insufficient balance" error' },
    ],
  },
  {
    id: 'admin', title: '1.11 Admin Panel', category: 'frontend',
    tests: [
      { id: 'F-ADM-01', title: 'Admin dashboard loads', expected: 'Metrics (orders, revenue, members) shown' },
      { id: 'F-ADM-02', title: 'Charts render on dashboard', expected: 'Sales and member charts populate' },
      { id: 'F-ADM-03', title: 'Non-admin access blocked', expected: '403 or redirect to login' },
      { id: 'F-ADM-04', title: 'Member search works', expected: 'Correct member found by name/email' },
      { id: 'F-ADM-05', title: 'Approve KYC', expected: 'Status changes to "Approved"' },
      { id: 'F-ADM-06', title: 'Reject KYC with reason', expected: 'Status "Rejected", member notified' },
      { id: 'F-ADM-07', title: 'Order status filter works', expected: 'Only filtered status orders shown' },
      { id: 'F-ADM-08', title: 'Update order status', expected: 'Status updated, customer notified' },
      { id: 'F-ADM-09', title: 'Add new product via admin', expected: 'Product appears in catalog' },
      { id: 'F-ADM-10', title: 'Edit product details', expected: 'Updates reflected on frontend' },
      { id: 'F-ADM-11', title: 'Delete product', expected: 'Product removed from catalog' },
      { id: 'F-ADM-12', title: 'Approve encashment request', expected: 'Wallet debited, status approved' },
      { id: 'F-ADM-13', title: 'Reject encashment request', expected: 'Status rejected, member notified' },
      { id: 'F-ADM-14', title: 'Create blog post via CMS', expected: 'Post published on frontend' },
    ],
  },
  {
    id: 'b-auth', title: '2.1 Auth API', category: 'backend',
    tests: [
      { id: 'B-AUTH-01', title: 'POST /auth/login — valid credentials', expected: '200 token + user object' },
      { id: 'B-AUTH-02', title: 'POST /auth/login — wrong password', expected: '401 Unauthorized' },
      { id: 'B-AUTH-03', title: 'POST /auth/login — unverified email', expected: '403 "Email not verified"' },
      { id: 'B-AUTH-04', title: 'Login rate limit (30+ req/min)', expected: '429 Too Many Requests' },
      { id: 'B-AUTH-05', title: 'POST /auth/register — valid payload', expected: '201 user created, OTP sent' },
      { id: 'B-AUTH-06', title: 'POST /auth/register — duplicate email', expected: '422 Unprocessable Entity' },
      { id: 'B-AUTH-07', title: 'POST /auth/register — duplicate username', expected: '422 field error' },
      { id: 'B-AUTH-08', title: 'POST /auth/register — missing field', expected: '422 validation error' },
      { id: 'B-AUTH-09', title: 'GET /auth/register/check-email', expected: '{available: true/false}' },
      { id: 'B-AUTH-10', title: 'GET /auth/register/check-username', expected: '{available: true/false}' },
      { id: 'B-AUTH-11', title: 'POST /auth/forgot-password — valid email', expected: '200 "Reset link sent"' },
      { id: 'B-AUTH-12', title: 'POST /auth/forgot-password — unknown email', expected: 'No info leak in response' },
      { id: 'B-AUTH-13', title: 'POST /auth/reset-password — valid token', expected: '200 password updated' },
      { id: 'B-AUTH-14', title: 'POST /auth/reset-password — expired token', expected: '422 "Token expired"' },
      { id: 'B-AUTH-15', title: 'POST /auth/logout', expected: '200 token revoked' },
      { id: 'B-AUTH-16', title: 'Protected route after logout', expected: '401 Unauthenticated' },
      { id: 'B-AUTH-17', title: 'Google OAuth callback', expected: '200 user logged in or created' },
      { id: 'B-AUTH-18', title: 'Passkey registration challenge', expected: '200 challenge returned' },
      { id: 'B-AUTH-19', title: 'Passkey login', expected: '200 token returned' },
      { id: 'B-AUTH-20', title: '2FA TOTP — valid code', expected: '200 access granted' },
      { id: 'B-AUTH-21', title: '2FA TOTP — invalid code', expected: '422 "Invalid code"' },
    ],
  },
  {
    id: 'b-products', title: '2.2 Product & Category API', category: 'backend',
    tests: [
      { id: 'B-PROD-01', title: 'GET /products/cards — list', expected: '200 paginated product list' },
      { id: 'B-PROD-02', title: 'GET /products/{id}', expected: '200 full product details' },
      { id: 'B-PROD-03', title: 'GET /products/slug/{slug}', expected: '200 correct product' },
      { id: 'B-PROD-04', title: 'GET /products/99999 — not found', expected: '404 Not Found' },
      { id: 'B-PROD-05', title: 'Filter products by category_id', expected: 'Category products only' },
      { id: 'B-PROD-06', title: 'Filter products by price range', expected: 'Products within range' },
      { id: 'B-PROD-07', title: 'Search products by keyword', expected: 'Matching products returned' },
      { id: 'B-PROD-08', title: 'GET /categories', expected: '200 category list' },
      { id: 'B-PROD-09', title: 'GET /rooms', expected: '200 rooms list' },
      { id: 'B-PROD-10', title: 'GET /products/{id}/reviews', expected: '200 review list' },
      { id: 'B-PROD-11', title: 'Admin POST /admin/products', expected: '201 product created' },
      { id: 'B-PROD-12', title: 'Admin PUT /admin/products/{id}', expected: '200 product updated' },
      { id: 'B-PROD-13', title: 'Admin DELETE /admin/products/{id}', expected: '200/204 deleted' },
      { id: 'B-PROD-14', title: 'Customer on admin product route', expected: '403 Forbidden' },
    ],
  },
  {
    id: 'b-cart', title: '2.3 Cart & Wishlist API', category: 'backend',
    tests: [
      { id: 'B-CART-01', title: 'POST /customer/cart — add item', expected: '200 cart updated' },
      { id: 'B-CART-02', title: 'Add out-of-stock item', expected: '422 "Out of stock"' },
      { id: 'B-CART-03', title: 'Add qty exceeding stock', expected: '422 "Not enough stock"' },
      { id: 'B-CART-04', title: 'GET /customer/cart', expected: '200 cart items list' },
      { id: 'B-CART-05', title: 'PUT /customer/cart/{id} — update qty', expected: '200 qty updated' },
      { id: 'B-CART-06', title: 'DELETE /customer/cart/{id}', expected: '200 item removed' },
      { id: 'B-CART-07', title: 'POST /customer/wishlist — add', expected: '200 added' },
      { id: 'B-CART-08', title: 'Wishlist duplicate item', expected: '422 or idempotent response' },
      { id: 'B-CART-09', title: 'DELETE /customer/wishlist/{id}', expected: '200 removed' },
      { id: 'B-CART-10', title: 'GET /customer/wishlist', expected: '200 wishlist items' },
      { id: 'B-CART-11', title: 'Cart unauthenticated access', expected: '401' },
    ],
  },
  {
    id: 'b-payment', title: '2.4 Checkout & Payment API', category: 'backend',
    tests: [
      { id: 'B-PAY-01', title: 'POST /payments/checkout-session', expected: '200 PayMongo session URL' },
      { id: 'B-PAY-02', title: 'Validate voucher — valid code', expected: '200 discount amount' },
      { id: 'B-PAY-03', title: 'Validate voucher — invalid code', expected: '422 "Invalid voucher"' },
      { id: 'B-PAY-04', title: 'GET checkout session status', expected: '200 session status' },
      { id: 'B-PAY-05', title: 'Checkout with empty cart', expected: '422 "Cart is empty"' },
      { id: 'B-PAY-06', title: 'Checkout — unauthenticated', expected: '401' },
      { id: 'B-PAY-07', title: 'Checkout rate limit (20+ req/min)', expected: '429' },
    ],
  },
  {
    id: 'b-orders', title: '2.5 Orders API', category: 'backend',
    tests: [
      { id: 'B-ORD-01', title: 'GET /customer/orders', expected: '200 orders list' },
      { id: 'B-ORD-02', title: 'GET /customer/orders/{id}', expected: '200 full order details' },
      { id: 'B-ORD-03', title: 'Access another user\'s order', expected: '403 Forbidden' },
      { id: 'B-ORD-04', title: 'Admin update order status', expected: '200 status updated' },
      { id: 'B-ORD-05', title: 'Admin get all orders', expected: '200 paginated orders' },
      { id: 'B-ORD-06', title: 'Admin filter by status', expected: 'Filtered results only' },
      { id: 'B-ORD-07', title: 'JNT order tracking', expected: '200 tracking events' },
    ],
  },
  {
    id: 'b-commission', title: '2.6 Member & Commission API', category: 'backend',
    tests: [
      { id: 'B-MEM-01', title: 'GET /member/profile', expected: '200 tier, PV, upline' },
      { id: 'B-MEM-02', title: 'GET /member/tier', expected: '200 rank and requirements' },
      { id: 'B-MEM-03', title: 'GET /member/wallet', expected: '200 balance and ledger' },
      { id: 'B-MEM-04', title: 'PV credited after purchase', expected: 'PV added to ledger' },
      { id: 'B-MEM-05', title: 'Personal cashback (4% e-GC)', expected: 'Cashback credited to wallet' },
      { id: 'B-MEM-06', title: 'Unilevel commission for upline', expected: 'Upline wallet credited' },
      { id: 'B-MEM-07', title: 'Tier promotion on threshold', expected: 'Tier automatically upgraded' },
      { id: 'B-MEM-08', title: 'Referral earnings on downline purchase', expected: 'Commission entry created' },
    ],
  },
  {
    id: 'b-encashment', title: '2.7 Encashment API', category: 'backend',
    tests: [
      { id: 'B-ENC-01', title: 'POST /encashment — submit request', expected: '201 request created' },
      { id: 'B-ENC-02', title: 'Encashment — insufficient balance', expected: '422 "Insufficient funds"' },
      { id: 'B-ENC-03', title: 'Encashment — below minimum', expected: '422 validation error' },
      { id: 'B-ENC-04', title: 'Admin approve encashment', expected: '200 approved, wallet debited' },
      { id: 'B-ENC-05', title: 'Admin reject encashment', expected: '200 rejected, balance restored' },
      { id: 'B-ENC-06', title: 'Duplicate pending request blocked', expected: '422 "Pending request exists"' },
    ],
  },
  {
    id: 'b-security', title: '2.8 Security & Rate Limiting', category: 'backend',
    tests: [
      { id: 'B-SEC-01', title: 'SQL injection on login', expected: '422 or safe — no data leak' },
      { id: 'B-SEC-02', title: 'XSS payload in profile name', expected: 'Output escaped/sanitized' },
      { id: 'B-SEC-03', title: 'Tampered auth token', expected: '401 Unauthenticated' },
      { id: 'B-SEC-04', title: 'Expired token rejected', expected: '401' },
      { id: 'B-SEC-05', title: 'CORS unknown origin blocked', expected: 'CORS headers block request' },
      { id: 'B-SEC-06', title: 'Login brute force rate limit', expected: '429 after 30 fails/min' },
      { id: 'B-SEC-07', title: 'Cloudflare Turnstile bypass', expected: '422 "CAPTCHA failed"' },
      { id: 'B-SEC-08', title: 'IDOR — another user\'s order', expected: '403' },
      { id: 'B-SEC-09', title: 'IDOR — another user\'s wallet', expected: '403' },
      { id: 'B-SEC-10', title: 'Customer token on /admin/*', expected: '403 Forbidden' },
      { id: 'B-SEC-11', title: 'Password stored as bcrypt hash', expected: 'DB shows hash, not plaintext' },
      { id: 'B-SEC-12', title: 'No sensitive data in API response', expected: 'No password/secrets in payload' },
    ],
  },
  {
    id: 'b-webhooks', title: '2.9 Webhooks', category: 'backend',
    tests: [
      { id: 'B-WH-01', title: 'PayMongo success webhook', expected: '200 order marked paid' },
      { id: 'B-WH-02', title: 'PayMongo failed webhook', expected: '200 order marked failed' },
      { id: 'B-WH-03', title: 'PayMongo invalid signature', expected: '401/400 signature rejected' },
      { id: 'B-WH-04', title: 'JNT status update webhook', expected: '200 shipping status updated' },
      { id: 'B-WH-05', title: 'Duplicate webhook idempotency', expected: 'No duplicate records created' },
    ],
  },

  // ── MOBILE DEVICE TESTING ──────────────────────────────────────
  {
    id: 'mobile-auth', title: '3.1 Mobile — Auth Pages', category: 'frontend',
    tests: [
      { id: 'M-AUTH-01', title: '[iPhone SE 375px] Login form fits screen', expected: 'No horizontal scroll, all fields visible' },
      { id: 'M-AUTH-02', title: '[iPhone 14 390px] Login form fits screen', expected: 'No overflow, CTA button fully visible' },
      { id: 'M-AUTH-03', title: '[Samsung S21 360px] Login form fits screen', expected: 'All inputs and button accessible' },
      { id: 'M-AUTH-04', title: '[iPhone 14 Pro Max 430px] Login layout', expected: 'No excessive whitespace, good proportions' },
      { id: 'M-AUTH-05', title: 'Virtual keyboard pushes content up on login', expected: 'Inputs remain visible when keyboard opens' },
      { id: 'M-AUTH-06', title: 'Sign up form scrolls properly on mobile', expected: 'All fields accessible with keyboard open' },
      { id: 'M-AUTH-07', title: 'OTP input usable on mobile keyboard', expected: 'Numeric keyboard opens, inputs auto-focus' },
      { id: 'M-AUTH-08', title: 'Forgot password form on mobile', expected: 'Form fills screen properly, no layout break' },
      { id: 'M-AUTH-09', title: 'Landscape mode — login form', expected: 'Form remains usable in landscape orientation' },
      { id: 'M-AUTH-10', title: 'Tap targets are at least 44×44px', expected: 'Buttons and links easy to tap without misfire' },
    ],
  },
  {
    id: 'mobile-nav', title: '3.2 Mobile — Navigation & Layout', category: 'frontend',
    tests: [
      { id: 'M-NAV-01', title: '[Mobile] Hamburger menu opens/closes', expected: 'Menu slides in/out smoothly' },
      { id: 'M-NAV-02', title: '[Mobile] All nav menu links tappable', expected: 'Each link navigates correctly on tap' },
      { id: 'M-NAV-03', title: '[Mobile] Nav closes after link tap', expected: 'Menu closes automatically on navigate' },
      { id: 'M-NAV-04', title: '[Mobile] Logo visible in mobile header', expected: 'Logo renders and links home' },
      { id: 'M-NAV-05', title: '[Mobile] Cart icon and badge visible', expected: 'Cart count badge visible on mobile header' },
      { id: 'M-NAV-06', title: '[Mobile] Bottom navigation (if present)', expected: 'Bottom nav tabs work and highlight active' },
      { id: 'M-NAV-07', title: '[Tablet 768px] Layout switches to tablet view', expected: 'Sidebar or tablet grid visible' },
      { id: 'M-NAV-08', title: 'Swipe gestures do not break layout', expected: 'No accidental scroll or nav trigger on swipe' },
      { id: 'M-NAV-09', title: 'Safe area insets (iPhone notch/home bar)', expected: 'Content not hidden behind notch or home bar' },
      { id: 'M-NAV-10', title: '[Mobile] Footer links readable and tappable', expected: 'Footer text not too small, links tap correctly' },
    ],
  },
  {
    id: 'mobile-product', title: '3.3 Mobile — Product & Browsing', category: 'frontend',
    tests: [
      { id: 'M-PROD-01', title: '[Mobile] Product grid is 2-column on phone', expected: '2-column grid on 390px, no overflow' },
      { id: 'M-PROD-02', title: '[Tablet] Product grid is 3-column on tablet', expected: '3-column grid on 768px' },
      { id: 'M-PROD-03', title: '[Mobile] Product card image loads correctly', expected: 'No broken or stretched images on mobile' },
      { id: 'M-PROD-04', title: '[Mobile] Product detail image gallery swipeable', expected: 'Swipe left/right changes product image' },
      { id: 'M-PROD-05', title: '[Mobile] Product variant buttons tappable', expected: 'Size/color buttons easy to tap on small screen' },
      { id: 'M-PROD-06', title: '[Mobile] Add to Cart button fully visible', expected: 'CTA not hidden or cut off at bottom' },
      { id: 'M-PROD-07', title: '[Mobile] Search bar usable on mobile', expected: 'Search input opens full keyboard, returns results' },
      { id: 'M-PROD-08', title: '[Mobile] Filter/sort drawer opens', expected: 'Filter panel slides in from bottom or side' },
      { id: 'M-PROD-09', title: '[Mobile] Product description readable', expected: 'Font size legible (min 14px), no text overflow' },
      { id: 'M-PROD-10', title: '[Mobile] Reviews section scrollable', expected: 'Review list scrolls without breaking layout' },
      { id: 'M-PROD-11', title: 'Pinch to zoom on product images', expected: 'Native browser zoom works on images' },
      { id: 'M-PROD-12', title: '[Mobile] Wishlist heart button tap area', expected: 'Heart icon has sufficient tap target size' },
    ],
  },
  {
    id: 'mobile-checkout', title: '3.4 Mobile — Cart & Checkout', category: 'frontend',
    tests: [
      { id: 'M-CART-01', title: '[Mobile] Cart page fits on screen', expected: 'Item list, totals, and button all visible' },
      { id: 'M-CART-02', title: '[Mobile] Quantity +/- buttons tappable', expected: 'Easy to tap without mis-hit' },
      { id: 'M-CART-03', title: '[Mobile] Remove item button tappable', expected: 'Delete button easy to tap, confirm shown' },
      { id: 'M-CART-04', title: '[Mobile] Checkout form keyboard behavior', expected: 'Keyboard does not hide active input field' },
      { id: 'M-CART-05', title: '[Mobile] Checkout steps progress visible', expected: 'Step indicator visible on small screen' },
      { id: 'M-CART-06', title: '[Mobile] PayMongo payment page loads in browser', expected: 'Payment page opens, card fields usable on mobile' },
      { id: 'M-CART-07', title: '[Mobile] Success/failed pages readable', expected: 'Order confirmation readable on small screen' },
      { id: 'M-CART-08', title: '[Mobile] Voucher code input usable', expected: 'Input opens keyboard, apply button visible' },
      { id: 'M-CART-09', title: '[Landscape] Checkout form in landscape mode', expected: 'Form still usable in landscape orientation' },
      { id: 'M-CART-10', title: '[Mobile] Shipping address autocomplete', expected: 'Address suggestions appear and selectable' },
    ],
  },
  {
    id: 'mobile-profile', title: '3.5 Mobile — Profile & Orders', category: 'frontend',
    tests: [
      { id: 'M-PROF-01', title: '[Mobile] Profile page layout correct', expected: 'No overflow, avatar and details visible' },
      { id: 'M-PROF-02', title: '[Mobile] Edit profile form usable', expected: 'All inputs accessible with keyboard' },
      { id: 'M-PROF-03', title: '[Mobile] KYC document upload works', expected: 'Camera or file picker opens on mobile' },
      { id: 'M-PROF-04', title: '[Mobile] Orders list scrollable', expected: 'Order cards scroll without layout break' },
      { id: 'M-PROF-05', title: '[Mobile] Order detail fits screen', expected: 'No horizontal scroll on order detail' },
      { id: 'M-PROF-06', title: '[Mobile] Track order page readable', expected: 'Shipping timeline fits mobile screen' },
      { id: 'M-PROF-07', title: '[Mobile] Wallet/rewards page scrollable', expected: 'Transaction list scrolls properly' },
    ],
  },
  {
    id: 'mobile-chat', title: '3.6 Mobile — Chat & Interactions', category: 'frontend',
    tests: [
      { id: 'M-CHAT-01', title: '[Mobile] Chat modal opens and fills screen', expected: 'Chat window usable on 390px screen' },
      { id: 'M-CHAT-02', title: '[Mobile] Chat input stays above keyboard', expected: 'Message input not hidden when keyboard opens' },
      { id: 'M-CHAT-03', title: '[Mobile] Send button tappable', expected: 'Send button easy to tap on small screen' },
      { id: 'M-CHAT-04', title: '[Mobile] Chat messages scrollable', expected: 'History scrolls up without layout break' },
      { id: 'M-CHAT-05', title: '[Mobile] Chat notification badge visible', expected: 'Unread badge visible on mobile header' },
    ],
  },
  {
    id: 'mobile-pwa', title: '3.7 Mobile — PWA & Browser', category: 'frontend',
    tests: [
      { id: 'M-PWA-01', title: '[iOS Safari] Add to Home Screen prompt', expected: 'PWA install prompt appears or share sheet works' },
      { id: 'M-PWA-02', title: '[Android Chrome] Install app prompt', expected: 'Install banner shown, app installs correctly' },
      { id: 'M-PWA-03', title: '[PWA] App opens in standalone mode', expected: 'No browser address bar, full-screen app look' },
      { id: 'M-PWA-04', title: '[PWA] App icon on home screen correct', expected: 'Correct icon and app name shown' },
      { id: 'M-PWA-05', title: '[iOS Safari] Login and OAuth flow works', expected: 'Google/Facebook OAuth completes on iOS Safari' },
      { id: 'M-PWA-06', title: '[Android Chrome] Login and OAuth flow works', expected: 'Google/Facebook OAuth completes on Android Chrome' },
      { id: 'M-PWA-07', title: '[Mobile] Page load time on 4G connection', expected: 'Key pages load under 5 seconds on 4G' },
      { id: 'M-PWA-08', title: '[Mobile] Images lazy load on scroll', expected: 'Images load as user scrolls, no jank' },
      { id: 'M-PWA-09', title: '[Mobile] Pinch-to-zoom disabled on forms', expected: 'Form inputs at min 16px — no auto-zoom on iOS' },
      { id: 'M-PWA-10', title: '[Mobile] Back button / browser history works', expected: 'Back navigates correctly, no broken history' },
      { id: 'M-PWA-11', title: '[Mobile] Push notifications (if enabled)', expected: 'Notification prompt shown, notifications received' },
      { id: 'M-PWA-12', title: '[Samsung Internet] Site renders correctly', expected: 'No major layout breaks on Samsung browser' },
    ],
  },
  {
    id: 'mobile-admin', title: '3.8 Mobile — Admin Panel (Tablet)', category: 'frontend',
    tests: [
      { id: 'M-ADM-01', title: '[iPad 768px] Admin dashboard accessible', expected: 'Dashboard metrics and charts visible' },
      { id: 'M-ADM-02', title: '[iPad] Admin sidebar collapses to icon', expected: 'Sidebar collapses or hides on tablet' },
      { id: 'M-ADM-03', title: '[iPad] Data tables horizontally scrollable', expected: 'Tables scroll horizontally on small screens' },
      { id: 'M-ADM-04', title: '[iPad] Product form usable on tablet', expected: 'All product form fields accessible' },
      { id: 'M-ADM-05', title: '[iPad] Order list filter tappable', expected: 'Filter buttons easy to tap on tablet' },
      { id: 'M-ADM-06', title: '[Mobile 390px] Admin redirects or warns', expected: 'Admin shows mobile warning or basic access' },
    ],
  },
];

const ALL_TESTS: TestCase[] = SECTIONS.flatMap(s =>
  s.tests.map(t => ({ ...t, sectionId: s.id, sectionTitle: s.title, category: s.category }))
);

const COLUMNS: { id: TestStatus; label: string; color: string; bg: string; border: string; dot: string }[] = [
  { id: 'pending', label: 'Pending', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800/60', border: 'border-gray-200 dark:border-gray-700', dot: 'bg-gray-400' },
  { id: 'pass',    label: 'Pass',    color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
  { id: 'bug',     label: 'Bug',     color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', dot: 'bg-red-500' },
  { id: 'skip',    label: 'Skip',    color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' },
];

const STORAGE_KEY = 'apsara_qa_state_v2';

function loadState(): Record<string, TestStatus> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'); } catch { return {}; }
}
function saveState(state: Record<string, TestStatus>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function StatusDropdown({ status, onChange }: { status: TestStatus; onChange: (s: TestStatus) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const col = COLUMNS.find(c => c.id === status)!;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium border transition-all ${col.bg} ${col.color} ${col.border}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${col.dot}`} />
        {col.label}
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden w-32">
          {COLUMNS.map(c => (
            <button
              key={c.id}
              onClick={() => { onChange(c.id); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${c.id === status ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
            >
              <span className={`w-2 h-2 rounded-full ${c.dot}`} />
              <span className={c.color}>{c.label}</span>
              {c.id === status && (
                <svg className="w-3 h-3 ml-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Testing() {
  const [statuses, setStatuses] = useState<Record<string, TestStatus>>({});
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setStatuses(loadState()); setMounted(true); }, []);

  const setStatus = (id: string, status: TestStatus) => {
    setStatuses(prev => {
      const updated = { ...prev, [id]: status };
      saveState(updated);
      return updated;
    });
  };

  const resetAll = () => { setStatuses({}); saveState({}); };

  const availableSections = useMemo(
    () => SECTIONS.filter(s => categoryFilter === 'all' || s.category === categoryFilter),
    [categoryFilter]
  );

  const filteredTests = useMemo(() => {
    const q = search.toLowerCase();
    return ALL_TESTS.filter(t => {
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (sectionFilter !== 'all' && t.sectionId !== sectionFilter) return false;
      if (q && !t.title.toLowerCase().includes(q) && !t.id.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [categoryFilter, sectionFilter, search]);

  const getStatus = (id: string): TestStatus => statuses[id] ?? 'pending';

  const totalCount = ALL_TESTS.length;
  const passCount = ALL_TESTS.filter(t => getStatus(t.id) === 'pass').length;
  const bugCount = ALL_TESTS.filter(t => getStatus(t.id) === 'bug').length;
  const skipCount = ALL_TESTS.filter(t => getStatus(t.id) === 'skip').length;
  const pendingCount = totalCount - passCount - bugCount - skipCount;
  const progressPct = totalCount > 0 ? Math.round(((passCount + skipCount) / totalCount) * 100) : 0;

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-gray-950 text-gray-900 dark:text-gray-100">

      {/* ── Header ── */}
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1400px] mx-auto px-6 py-4 space-y-3">

          {/* Title row */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight">QA Testing Board</h1>
              <p className="text-xs text-gray-400 mt-0.5">Apsara Home · {totalCount} test cases</p>
            </div>
            <button
              onClick={resetAll}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Reset all
            </button>
          </div>

          {/* Stats chips */}
          <div className="flex gap-2 flex-wrap">
            {[
              { label: 'Total', value: totalCount, cls: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' },
              { label: 'Pass', value: passCount, cls: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
              { label: 'Bug', value: bugCount, cls: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
              { label: 'Skip', value: skipCount, cls: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
              { label: 'Pending', value: pendingCount, cls: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400' },
            ].map(s => (
              <span key={s.label} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${s.cls}`}>
                {s.value} {s.label}
              </span>
            ))}
            <span className="ml-auto text-xs text-gray-400 self-center">{progressPct}% done</span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap items-center">
            {/* Category */}
            <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 text-xs font-medium">
              {(['all', 'frontend', 'backend'] as FilterCategory[]).map(f => (
                <button
                  key={f}
                  onClick={() => { setCategoryFilter(f); setSectionFilter('all'); }}
                  className={`px-3 py-1.5 capitalize transition-colors ${
                    categoryFilter === f
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                      : 'bg-white text-gray-500 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'frontend' ? 'Frontend' : 'Backend'}
                </button>
              ))}
            </div>

            {/* Section dropdown */}
            <select
              value={sectionFilter}
              onChange={e => setSectionFilter(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
            >
              <option value="all">All sections</option>
              {availableSections.map(s => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>

            {/* Search */}
            <input
              type="text"
              placeholder="Search test cases..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 min-w-[180px] text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
            />
          </div>
        </div>
      </div>

      {/* ── Kanban Board ── */}
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {COLUMNS.map(col => {
            const colTests = filteredTests.filter(t => getStatus(t.id) === col.id);
            return (
              <div key={col.id} className="flex flex-col gap-3">
                {/* Column header */}
                <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border ${col.bg} ${col.border}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                    <span className={`text-sm font-semibold ${col.color}`}>{col.label}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.bg} ${col.color} border ${col.border}`}>
                    {colTests.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2">
                  {colTests.length === 0 && (
                    <div className="text-center py-10 text-gray-300 dark:text-gray-700 text-xs border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                      No items
                    </div>
                  )}
                  {colTests.map(test => (
                    <div
                      key={test.id}
                      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3.5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      {/* Card top row */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[10px] font-mono text-gray-400 dark:text-gray-600 shrink-0 mt-0.5">
                          {test.id}
                        </span>
                        <StatusDropdown
                          status={getStatus(test.id)}
                          onChange={s => setStatus(test.id, s)}
                        />
                      </div>

                      {/* Title */}
                      <p className="text-sm font-medium leading-snug text-gray-800 dark:text-gray-200 mb-2">
                        {test.title}
                      </p>

                      {/* Expected */}
                      <p className="text-[11px] text-gray-400 dark:text-gray-600 leading-relaxed line-clamp-2">
                        ✓ {test.expected}
                      </p>

                      {/* Section tag */}
                      <div className="mt-2.5 flex items-center gap-1.5">
                        <span className={`text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                          test.category === 'frontend'
                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400'
                        }`}>
                          {test.category === 'frontend' ? 'UI' : 'API'}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-600 truncate">
                          {test.sectionTitle}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
