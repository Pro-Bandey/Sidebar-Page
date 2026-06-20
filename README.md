# Sidebar Page

Sidebar Page is a lightweight and performant browser extension designed for Manifest V3 that loads your desired website or translator tool directly inside the browser's side panel.

This version features a modernized directory layout, a full Material Design 3 visual style, and a dynamic in-sidebar address bar.

---

## Key Features

- **Material Design 3 UI:** Seamless light and dark mode adaptations using native CSS custom properties.
- **Dynamic Address Bar:** Navigate to new web addresses directly from the sidebar toolbar or the options page. Address states synchronize automatically in real-time.
- **Collapsible Responsive Design:** Navigation buttons automatically hide to maximize viewport usability as the side panel is narrowed.
- **SVG Symbol Sprites:** Clean, secure inline symbol mapping that reduces DOM footprint and ensures compliance with Content Security Policies (CSP).
- **Consolidated Service Worker:** Legacy modular libraries are merged into a single stable `background.js` handler to prevent background suspension state desynchronization.
- **X-Frame Bypass:** Automatically handles `X-Frame-Options` and `Frame-Options` on framed page loads via dynamic and session `declarativeNetRequest` rules.
- **Mobile User-Agent Overrides:** Easily simulate multiple operating systems (iOS, Android, etc.) inside the iframe context to load mobile-optimized versions of your favorite websites.

---

## Permissions Overview

The extension requests the following permissions to support core functionality:

1. **`storage`**: Persists default URLs, viewport choices, ad block filters, and toolbar states across sessions.
2. **`sidePanel`**: Registers the side panel user interface within the browser shell.
3. **`declarativeNetRequest`**: Modifies request and response headers (such as `User-Agent` and `X-Frame-Options`) for framing compatibility.

---

## Usage

### 1. In-Sidebar Navigation

Open the side panel and use the navigation buttons (Back, Forward, Reload) directly on the frame. If the toolbar is visible, you can click on the address input box, type any valid web address, and hit **Enter** to load it instantly.

### 2. Configuration Settings

Click the **Options** (gear) icon in the toolbar or open the extension's option page to:

- Set a default fallback startup URL.
- Toggle simulated User-Agent view modes (e.g., Apple iOS, Google Android, or Desktop).
- Toggle sidebar-specific ad filtering rules.
- Customize toolbar and frame scrollbar displays.
