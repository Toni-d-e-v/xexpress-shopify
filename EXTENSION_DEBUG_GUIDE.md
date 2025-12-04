# Extension Debugging Guide

## Current Status

The extension code has been completely rewritten with extensive logging and error handling. If you're still seeing infinite loading, follow these steps.

## Why Infinite Loading Happens

The infinite loading spinner means the extension JavaScript bundle is not rendering. This typically happens because:

1. **Extension not redeployed**: Shopify dev server needs to be restarted to pick up changes
2. **Browser cache**: Old extension bundle is cached
3. **Build error**: Extension failed to build silently

## Step-by-Step Fix

### 1. Restart Shopify Dev Server

```bash
# Stop the current dev server (Ctrl+C)
# Then restart:
shopify app dev
```

### 2. Hard Refresh Browser

- **Chrome/Edge (Windows/Linux)**: `Ctrl + Shift + R`
- **Chrome/Edge (Mac)**: `Cmd + Shift + R`
- **Or**: Open DevTools → Right-click refresh button → "Empty Cache and Hard Reload"

### 3. Open Browser Console

- Press `F12` or right-click → "Inspect"
- Go to the "Console" tab
- **Important**: Make sure console is visible BEFORE clicking the action button

### 4. Click the Extension Button

- Go to an order page in Shopify admin
- Click "More actions" (three dots)
- Click "X-Express Shipping"
- Watch the console

## What to Look For in Console

### ✅ Good - Extension Loading:
```
[Extension] Starting to render
[Extension] Extension component mounting
[Extension] Order ID: gid://shopify/Order/123456
[Extension] Order Number: 123456
[Extension] Render complete
```

If you see these logs, the extension is working! The modal should appear.

### ❌ Bad - No Logs:
If you see **no logs at all**, the extension bundle is not loading. This means:
- Dev server needs restart
- Extension not deployed
- Check dev server terminal for build errors

### ⚠️ Partial Logs:
If logs stop at a certain point, that's where the error is happening.

## Testing the Button

Once the modal appears, click "Create Shipment" and watch for:

```
[Extension] Button clicked
[Extension] Making API call
[Extension] Response: 200 true
[Extension] Result: {ok: true, shipmentCode: "..."}
```

## Common Issues

### Issue: "Order not found" Error

**Cause**: The order ID format is incorrect or the order doesn't exist in your store.

**Check**:
1. Look at console logs for the Order ID
2. Should be format: `gid://shopify/Order/NUMBER`
3. Verify the order exists in your Shopify admin

### Issue: "X-Express not configured"

**Cause**: App settings not configured.

**Fix**:
1. Go to `/app/xexpress/settings`
2. Enter your X-Express credentials
3. Save settings
4. Try again

### Issue: Modal shows but button does nothing

**Cause**: API endpoint not reachable or authentication issue.

**Check console for**:
- Network errors
- 401/403 errors (authentication)
- 500 errors (server errors)

## Extension Code Location

- **Extension file**: `extensions/xexpress-order-action/src/index.jsx`
- **Extension config**: `extensions/xexpress-order-action/shopify.extension.toml`
- **API endpoint**: `app/routes/api.xexpress.create.tsx`

## Development Commands

```bash
# Start dev server
shopify app dev

# Deploy extension (production)
shopify app deploy

# View app info
shopify app info
```

## If Still Not Working

Please provide:
1. Screenshot of browser console (with logs)
2. Screenshot of dev server terminal output
3. Screenshot of what you see when clicking the button

This will help identify the exact issue!
