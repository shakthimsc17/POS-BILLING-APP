# ReachLearn POS - PWA Installation Guide

Follow these steps to install the ReachLearn POS system as a standalone desktop application.

---

## Prerequisites
- The frontend development server is running (usually on `http://localhost:5173`).
- You are using a modern browser like Google Chrome or Microsoft Edge.

---

## Installation Steps

### 1. Start the Application
1. Navigate to the `frontend` directory in your terminal.
2. Run `npm run dev` to start the development server.
3. Open your browser and go to the local URL (e.g., `http://localhost:5173`).

### 2. Install the App
1. **In Chrome/Edge:** Look for the **Install** icon (a computer with a down arrow or a plus sign inside a circle) in the address bar on the right side.
2. Click the icon and select **Install**.
3. The application will now open in its own window, without the browser interface.

### 3. Desktop Shortcut
- A shortcut will be automatically created on your desktop or in your application menu.
- You can now launch ReachLearn POS directly from your desktop like any other application.

---

## Troubleshooting

### Install button not appearing?
- Open DevTools (**F12**).
- Go to the **Application** tab.
- Click on **Manifest** to ensure it's loaded.
- Click on **Service Workers** to ensure `sw.js` is registered and active.
- Ensure you are accessing the site via `localhost` or `https`. PWAs require a secure connection.

### Forcing an Update
- If you make changes to the app and they don't appear in the PWA, perform a hard refresh (**Ctrl + Shift + R**) or uninstall and reinstall the app.
