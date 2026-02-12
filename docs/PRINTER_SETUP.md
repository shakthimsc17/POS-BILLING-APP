# Printer Setup Guide for POS System

## Browser Printing Limitations

**Important:** Web browsers have security restrictions that prevent completely silent printing without user interaction. The print dialog will typically appear even when "Auto Print" is enabled.

## Auto Print Setting

The "Auto Print Receipts" setting in Settings → Receipt Settings attempts to print automatically, but due to browser security:
- A print dialog may still appear
- The user may need to click "Print" in the dialog
- This is a browser security feature and cannot be bypassed with standard JavaScript

## Solutions for True Silent Printing

### Option 1: Chrome Kiosk Mode (Recommended for POS)

Run Chrome in kiosk mode with printing flags:

```bash
# Linux
google-chrome --kiosk --kiosk-printing --disable-infobars --disable-session-crashed-bubble

# Windows
chrome.exe --kiosk --kiosk-printing --disable-infobars --disable-session-crashed-bubble
```

**Note:** `--kiosk-printing` flag enables automatic printing to the default printer, but may still show a brief dialog.

### Option 2: JSPrintManager (Commercial Solution)

1. Install JSPrintManager client service on the POS computer
2. Configure printer settings in the application
3. Enables true silent printing without dialogs

**Website:** https://www.neodynamic.com/products/printing/js-print-manager/

### Option 3: Server-Side Printing (Advanced)

For true silent printing, consider:
- Server-side printing service (Node.js/Python)
- Direct ESC/POS commands to thermal printers
- Print server that handles printing requests

### Option 4: Electron Desktop App

Convert the web app to an Electron desktop application:
- Full control over printing
- Can use native printer APIs
- True silent printing support

## Printer Configuration

### Setting Default Printer

1. **Windows:**
   - Go to Settings → Devices → Printers & scanners
   - Set your thermal printer as default

2. **Linux:**
   - Use `lpoptions -d printer_name` to set default
   - Or configure via CUPS web interface

3. **macOS:**
   - System Preferences → Printers & Scanners
   - Set default printer

### Thermal Printer Setup

For 80mm (3-inch) thermal printers:
- Paper size: 80mm width
- Page size: Custom (80mm x auto)
- Margins: 0mm (or minimal)

The receipt HTML is already formatted for 80mm thermal printers.

## Current Implementation

The current auto-print feature:
- Uses a hidden iframe to attempt silent printing
- May still show browser print dialog (browser security limitation)
- Works best with Chrome in kiosk mode
- Falls back gracefully if auto-print fails

## Recommendations

1. **For Production POS Systems:**
   - Use Chrome in kiosk mode with `--kiosk-printing` flag
   - Set thermal printer as default printer
   - Train staff to quickly click "Print" if dialog appears

2. **For Better Experience:**
   - Consider JSPrintManager for true silent printing
   - Or develop a desktop application version

3. **Testing:**
   - Test with your specific thermal printer model
   - Verify paper size and margins
   - Check print quality and alignment

## Troubleshooting

**Print dialog still appears:**
- This is expected due to browser security
- Use Chrome kiosk mode for better experience
- Consider alternative solutions listed above

**Printer not found:**
- Ensure printer is installed and set as default
- Check printer is powered on and connected
- Verify printer drivers are installed

**Print quality issues:**
- Adjust browser print settings (margins, scale)
- Check thermal printer paper alignment
- Verify printer settings match 80mm paper size
