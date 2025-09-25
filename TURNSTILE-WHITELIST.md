# Cloudflare Turnstile Whitelist Configuration

## Overview
This document provides step-by-step instructions for configuring Cloudflare Turnstile to allow E2E testing by bypassing CAPTCHA challenges through both user agent and IP whitelisting.

## ✅ Working Configuration (Verified)
The following configuration has been tested and confirmed working:
- **User Agent**: `JBIT-Bot/1.0 (+https://jbit.be/bot)`
- **IP Whitelist**: Local development/testing IP addresses
- **Result**: Forms submit successfully and redirect to homepage

## Prerequisites
- Access to Cloudflare Dashboard
- Admin rights for the target domain
- Cloudflare Turnstile enabled on the website

## Configuration Steps

### 1. Access Cloudflare Dashboard
1. Log in to your Cloudflare account
2. Select the domain where Turnstile is configured
3. Navigate to **Security** > **WAF** (Web Application Firewall)

### 2. Create Custom Rule for User Agent
1. Click **Create rule**
2. Choose **Custom rule** type
3. Set rule name: `E2E Testing User Agent Bypass`

#### Configure Rule Conditions
Set the following condition:
- **Field**: `User Agent`
- **Operator**: `contains` or `equals`
- **Value**: `JBIT-Bot/1.0`

#### Configure Rule Action
- **Action**: `Skip`
- **Security products to skip**: Check `Bot Fight Mode` and `Turnstile`

### 3. Create Custom Rule for IP Whitelist ⚠️ CRITICAL
**IMPORTANT**: User agent whitelisting alone may not be sufficient. Local development IP addresses must also be whitelisted in the Cloudflare Turnstile plugin configuration.

1. Click **Create rule**
2. Choose **Custom rule** type
3. Set rule name: `E2E Testing IP Bypass`

#### Configure IP Rule Conditions
Set the following condition:
- **Field**: `IP Source Address`
- **Operator**: `is in`
- **Value**: Add your local development IP addresses (e.g., `192.168.1.100/32`, `your.public.ip.address/32`)

#### Configure IP Rule Action
- **Action**: `Skip`
- **Security products to skip**: Check `Bot Fight Mode` and `Turnstile`

### 4. WordPress Plugin Configuration
If using a WordPress Turnstile plugin, also configure IP whitelist in the plugin settings:
1. Go to WordPress Admin > **Turnstile Settings**
2. Add local development IP addresses to the **IP Whitelist** field
3. Save settings

### 5. Deploy Rules
1. Click **Deploy** to save and activate both rules
2. Wait 5-10 minutes for global propagation

## Testing the Configuration
Run the E2E tests to verify the bypass is working:
```bash
npm test customers/jbit/tests/simple-smoke-test.spec.js
```

Expected successful output:
```
=== SUBMISSION ANALYSIS ===
Success message found: false
Error message found: false ()
Form fields cleared: false
URL changed: true
Overall success: true
========================

✅ Form submission appears successful based on indicators
✅ Smoke test passed - form submission completed without errors
```

## Alternative User Agent Formats
If issues persist, try these alternatives:
- `JBIT-E2E-Tester/1.0 (Playwright; +https://jbit.be)`
- `JBIT-E2E-Tester/1.0`
- `*JBIT*` (wildcard pattern)
- `Googlebot/2.1` (known bot)

## Troubleshooting
- ✅ **Verified Working**: Current configuration with both user agent and IP whitelisting
- Ensure both user agent AND IP rules are active and published
- Check rule precedence/order (IP rules should be higher priority)
- Verify no conflicting security rules
- Try temporarily disabling Bot Fight Mode
- Check WordPress plugin IP whitelist settings

## Success Indicators
When properly configured, you should observe:
1. No "Please verify that you are human" error messages
2. No "Your submission failed because of an error" messages
3. Form successfully submits and redirects to homepage
4. Tests pass with `Overall success: true`

## Notes
- **CRITICAL**: Both user agent AND local IP whitelisting are required
- Configuration changes may take 5-30 minutes to propagate globally
- Test from the same IP address used in development
- Consider adding CI/CD server IP addresses for automated testing