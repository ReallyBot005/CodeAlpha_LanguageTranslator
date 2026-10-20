# LinguaAI – Language Translation Tool

> **CodeAlpha Internship Project** | A lightweight, functional, and polished language translation web application.

---

## 📌 Project Overview

LinguaAI is a browser-based language translation tool built with pure **HTML5, CSS3, and Vanilla JavaScript**. It connects to the **MyMemory Translation API** — a free, no-key-required service — to provide real, live translations across 40+ languages including English, Hindi, Bengali, Assamese, Spanish, French, German, Japanese, Chinese, Arabic, and many more.

The goal of this project was to build a fully functional, professionally designed, and beginner-friendly application suitable for a student portfolio and internship demonstration.

---

## ✨ Features

| Feature | Details |
|---|---|
| **40+ Languages** | Includes Indian regional languages (Hindi, Bengali, Assamese, Tamil, Telugu, etc.) and major world languages |
| **Live Translation** | Real API calls to MyMemory — no fake or simulated results |
| **Loading State** | Animated skeleton shimmer while waiting for the API |
| **Character Counter** | Live count with color warnings at 80% and 100% limit |
| **Swap Languages** | Exchanges source ↔ target language and swaps text panels |
| **Copy to Clipboard** | One-click copy with a success toast notification |
| **Error Handling** | Clear, user-friendly messages for network failures, empty input, quota errors, and invalid combinations |
| **Keyboard Shortcut** | `Ctrl+Enter` (or `Cmd+Enter` on Mac) triggers translation |
| **Responsive Design** | Works cleanly on desktop, tablet, and mobile |
| **Accessibility** | Semantic HTML, ARIA labels, and screen-reader-friendly live regions |

---

## 🛠️ Technologies Used

- **HTML5** – Semantic structure, ARIA accessibility attributes
- **CSS3** – Custom Properties (variables), CSS Grid, Flexbox, keyframe animations, responsive media queries
- **Vanilla JavaScript (ES2020+)** – `async/await`, `fetch()`, `URLSearchParams`, `navigator.clipboard`
- **Google Fonts** – Inter typeface for professional typography
- **MyMemory Translation API** – Free, open translation service (no API key required)

---

## 🌐 How the Translation API Works

### Provider: MyMemory (by Translated.net)

**Endpoint:**
```
GET https://api.mymemory.translated.net/get
```

**Parameters:**

| Parameter | Required | Description |
|---|---|---|
| `q` | ✅ Yes | The text to translate (URL-encoded) |
| `langpair` | ✅ Yes | Source and target language codes separated by `|` (e.g., `en|fr`) |

**Example request:**
```
https://api.mymemory.translated.net/get?q=Hello%20World&langpair=en|fr
```

**Example response:**
```json
{
  "responseData": {
    "translatedText": "Bonjour le monde",
    "match": 1.0
  },
  "responseStatus": 200,
  "quotaFinished": false
}
```

The application reads `responseData.translatedText` to display the result.

### Why MyMemory?
- ✅ Completely free for basic use
- ✅ No API key or credit card required
- ✅ CORS enabled (works directly from the browser)
- ✅ Supports 40+ languages
- ✅ Reliable uptime

---

## ⚠️ API Limitations

| Limit | Details |
|---|---|
| **Anonymous daily quota** | **5,000 characters per day** per IP address |
| **Max per request** | ~500 characters recommended per single call |
| **Quota reset** | Resets every 24 hours |
| **Exceeded quota** | Returns an error message — the app displays this clearly |

> **Note for the demo:** If you hit the daily limit during testing, either wait 24 hours or test from a different network/device. The application correctly detects and reports quota errors.

---

## 📁 Project Structure

```
CodeAlpha_LanguageTranslator/
│
├── index.html      # Main page structure, semantic HTML, ARIA roles
├── style.css       # All styling: design tokens, layout, animations, responsive
├── script.js       # Language list, API integration, UI controller
├── README.md       # This file
└── .gitignore      # Ignores OS/editor noise files
```

---

## 🚀 Setup and Running the Application

### Option 1: VS Code Live Server (Recommended)

1. Open the project folder in **Visual Studio Code**.
2. Install the **Live Server** extension (by Ritwick Dey) if not already installed.
3. Right-click `index.html` → **"Open with Live Server"**.
4. The app opens at `http://127.0.0.1:5500/`.

### Option 2: Python HTTP Server (Built-in, no install needed)

```bash
# Navigate to the project folder
cd "c:\Users\SURAJ PAUL CHOUDHURY\OneDrive\Documents\CodeAlpha_LanguageTranslator"

# Python 3
python -m http.server 8080

# Then open your browser at:
# http://localhost:8080
```

### Option 3: Node.js `http-server` (if Node.js is installed)

```bash
# Install http-server globally (one-time)
npm install -g http-server

# Run in the project directory
cd "c:\Users\SURAJ PAUL CHOUDHURY\OneDrive\Documents\CodeAlpha_LanguageTranslator"
http-server -p 8080

# Then open your browser at:
# http://localhost:8080
```

### Option 4: Open Directly (Quick Test Only)

You can double-click `index.html` to open it in your browser. The translation API will still work because MyMemory supports CORS from any origin, **including `file://`** URLs for testing.

> ⚠️ The `navigator.clipboard.writeText()` API requires a secure context (HTTPS or localhost). Copy functionality works on `localhost` but may fall back to the `execCommand` method when opened via `file://`.

---

## ✅ How to Verify the Application Works

1. **Basic translation** – Type "Hello, how are you?" → Select English → Hindi → Click Translate.  
   Expected: Translated Hindi text appears in the output panel.

2. **Loading state** – Watch for the animated skeleton shimmer and spinning button during translation.

3. **Empty input** – Click Translate with an empty text area.  
   Expected: Error banner appears: *"Please enter some text before translating."*

4. **Same language** – Select English → English → Translate.  
   Expected: Error: *"Source and target languages must be different."*

5. **Swap** – Enter "Good morning" (EN→FR), then click the swap button.  
   Expected: Languages reverse, and the output text moves to the input.

6. **Copy** – After translating, click the copy icon.  
   Expected: Toast "✓ Copied to clipboard!" appears briefly.

7. **Keyboard shortcut** – Type text and press `Ctrl+Enter`.  
   Expected: Translation triggers immediately.

8. **Mobile** – Resize browser to < 768px.  
   Expected: Panels stack vertically, controls remain usable.

---

## 📸 Screenshots

> *(Replace the placeholders below with your own screenshots after running the app.)*

| View | Screenshot |
|---|---|
| Desktop – Full Interface | `screenshots/desktop-full.png` |
| Desktop – After Translation | `screenshots/desktop-translated.png` |
| Mobile – Stacked Layout | `screenshots/mobile-view.png` |
| Error State | `screenshots/error-state.png` |

---

## 🏗️ Implementation Notes

- **`translateText()` is isolated** — the entire API integration lives in one function. To switch providers (e.g., to LibreTranslate or DeepL), only this function needs to change.
- **No framework dependency** — zero `node_modules`, zero build steps. Open and run.
- **Security** — No API keys are used or exposed. The MyMemory API is fully public.
- **XSS prevention** — Translated text is injected via `element.textContent`, never `innerHTML`.
- **Progressive error handling** — Network errors, HTTP errors, API-level errors, and quota errors are all caught and displayed separately with helpful messages.

---

## 👤 Author

**Suraj Paul Choudhury**  
CodeAlpha Internship – AI/Web Development Track

---

## 📜 License

This project is built for educational purposes as part of the CodeAlpha internship program.  
Translation service provided by [MyMemory](https://mymemory.translated.net/) by Translated.net.
