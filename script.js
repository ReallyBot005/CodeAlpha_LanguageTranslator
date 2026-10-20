/**
 * LinguaAI – script.js
 * Language Translation Tool using the MyMemory Translation API.
 *
 * Architecture:
 *  - LANGUAGES: Supported language list (code + name pairs).
 *  - translateText(): The isolated API integration function.
 *                     Swap this function to change the translation provider.
 *  - UI controller: Event listeners, state management, DOM manipulation.
 *
 * API: MyMemory (https://mymemory.translated.net)
 *   - Free, no API key required for basic use.
 *   - Limit: 5,000 chars/day (anonymous).
 *   - CORS: Fully supported – can be called from the browser.
 *   - Endpoint: GET https://api.mymemory.translated.net/get
 */

/* ============================================================
   1. SUPPORTED LANGUAGES
   ============================================================ */

const LANGUAGES = [
  { code: "en",    name: "English" },
  { code: "hi",    name: "Hindi" },
  { code: "bn",    name: "Bengali" },
  { code: "as",    name: "Assamese" },
  { code: "es",    name: "Spanish" },
  { code: "fr",    name: "French" },
  { code: "de",    name: "German" },
  { code: "it",    name: "Italian" },
  { code: "pt",    name: "Portuguese" },
  { code: "nl",    name: "Dutch" },
  { code: "ru",    name: "Russian" },
  { code: "ar",    name: "Arabic" },
  { code: "zh-CN", name: "Chinese (Simplified)" },
  { code: "ja",    name: "Japanese" },
  { code: "ko",    name: "Korean" },
  { code: "tr",    name: "Turkish" },
  { code: "pl",    name: "Polish" },
  { code: "sv",    name: "Swedish" },
  { code: "da",    name: "Danish" },
  { code: "fi",    name: "Finnish" },
  { code: "no",    name: "Norwegian" },
  { code: "el",    name: "Greek" },
  { code: "cs",    name: "Czech" },
  { code: "hu",    name: "Hungarian" },
  { code: "ro",    name: "Romanian" },
  { code: "uk",    name: "Ukrainian" },
  { code: "vi",    name: "Vietnamese" },
  { code: "th",    name: "Thai" },
  { code: "id",    name: "Indonesian" },
  { code: "ms",    name: "Malay" },
  { code: "fa",    name: "Persian" },
  { code: "he",    name: "Hebrew" },
  { code: "ur",    name: "Urdu" },
  { code: "ta",    name: "Tamil" },
  { code: "te",    name: "Telugu" },
  { code: "mr",    name: "Marathi" },
  { code: "gu",    name: "Gujarati" },
  { code: "pa",    name: "Punjabi" },
  { code: "ml",    name: "Malayalam" },
  { code: "kn",    name: "Kannada" },
];

/* ============================================================
   2. API INTEGRATION
   Isolated function – change provider here without touching UI code.
   ============================================================ */

/**
 * Calls the MyMemory Translation API and returns the translated string.
 *
 * @param {string} text       – The source text to translate (max 500 chars).
 * @param {string} sourceLang – BCP-47 / ISO language code for source (e.g. "en").
 * @param {string} targetLang – BCP-47 / ISO language code for target (e.g. "fr").
 * @returns {Promise<string>}  – Resolves with the translated text.
 * @throws {Error}             – Rejects with a descriptive message on failure.
 */
async function translateText(text, sourceLang, targetLang) {
  const ENDPOINT = "https://api.mymemory.translated.net/get";

  // Build query parameters
  const params = new URLSearchParams({
    q:        text,
    langpair: `${sourceLang}|${targetLang}`,
  });

  const url = `${ENDPOINT}?${params.toString()}`;

  // --- Network request ---
  let response;
  try {
    response = await fetch(url);
  } catch (networkError) {
    // fetch() itself threw – usually a connectivity problem
    throw new Error(
      "Network error: Unable to reach the translation service. " +
      "Please check your internet connection and try again."
    );
  }

  // --- HTTP status check ---
  if (!response.ok) {
    throw new Error(
      `Translation service returned HTTP ${response.status}. Please try again later.`
    );
  }

  // --- Parse JSON ---
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      "Unexpected response from the translation service. Please try again."
    );
  }

  // --- API-level status check ---
  if (data.responseStatus !== 200) {
    // MyMemory returns 403 with a quota message when the daily limit is hit
    const detail = data.responseDetails || data.responseStatus;
    throw new Error(`Translation failed: ${detail}`);
  }

  // --- Quota exhausted flag ---
  if (data.quotaFinished === true) {
    throw new Error(
      "Daily translation quota has been reached (MyMemory free tier: 5,000 chars/day). " +
      "Please try again tomorrow or use a different IP address."
    );
  }

  // --- Extract translated text ---
  const translatedText = data?.responseData?.translatedText;

  if (!translatedText || typeof translatedText !== "string") {
    throw new Error(
      "The translation service returned an empty or unrecognised response."
    );
  }

  return translatedText.trim();
}

/* ============================================================
   3. DOM REFERENCES
   ============================================================ */

const sourceLangSelect  = document.getElementById("source-lang");
const targetLangSelect  = document.getElementById("target-lang");
const swapBtn           = document.getElementById("swap-btn");
const sourceTextarea    = document.getElementById("source-text");
const charCount         = document.getElementById("char-count");
const clearSourceBtn    = document.getElementById("clear-source-btn");
const translateBtn      = document.getElementById("translate-btn");
const outputArea        = document.getElementById("output-area");
const copyBtn           = document.getElementById("copy-btn");
const clearOutputBtn    = document.getElementById("clear-output-btn");
const copyToast         = document.getElementById("copy-toast");
const errorBanner       = document.getElementById("error-banner");
const errorMessage      = document.getElementById("error-message");

/* ============================================================
   4. STATE
   ============================================================ */

let isTranslating = false;   // Prevents concurrent requests
let toastTimer    = null;    // For clearing the copy-success toast

/* ============================================================
   5. INITIALISE LANGUAGE DROPDOWNS
   ============================================================ */

function populateLanguageDropdowns() {
  LANGUAGES.forEach(({ code, name }) => {
    const srcOption = new Option(name, code);
    const tgtOption = new Option(name, code);
    sourceLangSelect.add(srcOption);
    targetLangSelect.add(tgtOption);
  });

  // Defaults: source = English, target = Hindi
  sourceLangSelect.value = "en";
  targetLangSelect.value = "hi";
}

/* ============================================================
   6. CHARACTER COUNTER
   ============================================================ */

function updateCharCount() {
  const len  = sourceTextarea.value.length;
  const max  = parseInt(sourceTextarea.getAttribute("maxlength"), 10);
  charCount.textContent = `${len} / ${max}`;

  charCount.classList.remove("warning", "limit");
  if (len >= max) {
    charCount.classList.add("limit");
  } else if (len >= max * 0.8) {
    charCount.classList.add("warning");
  }
}

/* ============================================================
   7. UI STATE HELPERS
   ============================================================ */

function showError(message) {
  errorMessage.textContent = message;
  errorBanner.hidden = false;
}

function hideError() {
  errorBanner.hidden = true;
  errorMessage.textContent = "";
}

function setLoadingState(loading) {
  isTranslating = loading;
  translateBtn.disabled = loading;
  swapBtn.disabled      = loading;

  if (loading) {
    translateBtn.classList.add("loading");
    translateBtn.querySelector(".btn-text").textContent = "Translating\u2026";

    // Show skeleton shimmer in output panel
    outputArea.innerHTML = "";
    outputArea.classList.add("loading");

    const widths = ["85%", "100%", "70%", "90%", "55%"];
    widths.forEach(w => {
      const line = document.createElement("div");
      line.className = "skeleton-line";
      line.style.width = w;
      outputArea.appendChild(line);
    });
  } else {
    translateBtn.classList.remove("loading");
    translateBtn.querySelector(".btn-text").textContent = "Translate";
    translateBtn.disabled = false;
    swapBtn.disabled      = false;
    outputArea.classList.remove("loading");
  }
}

function displayTranslation(text) {
  outputArea.innerHTML = "";
  outputArea.textContent = text;   // Safely sets text (no XSS risk)
  copyBtn.disabled      = false;
  clearOutputBtn.disabled = false;
}

function clearOutput() {
  outputArea.innerHTML = '<p class="output-placeholder">Your translation will appear here.</p>';
  copyBtn.disabled      = true;
  clearOutputBtn.disabled = true;
}

/* ============================================================
   8. TRANSLATE HANDLER
   ============================================================ */

async function handleTranslate() {
  const text       = sourceTextarea.value.trim();
  const sourceLang = sourceLangSelect.value;
  const targetLang = targetLangSelect.value;

  // --- Validation ---
  if (!text) {
    showError("Please enter some text before translating.");
    sourceTextarea.focus();
    return;
  }

  if (sourceLang === targetLang) {
    showError("Source and target languages must be different.");
    return;
  }

  if (isTranslating) return;   // Guard against double clicks

  // --- Execute ---
  hideError();
  setLoadingState(true);

  try {
    const result = await translateText(text, sourceLang, targetLang);
    displayTranslation(result);
  } catch (err) {
    setLoadingState(false);       // Remove skeleton first
    clearOutput();
    showError(err.message);
    return;
  }

  setLoadingState(false);
}

/* ============================================================
   9. SWAP LANGUAGES
   ============================================================ */

function handleSwap() {
  if (isTranslating) return;

  const prevSource = sourceLangSelect.value;
  const prevTarget = targetLangSelect.value;

  // Swap language selections
  sourceLangSelect.value = prevTarget;
  targetLangSelect.value = prevSource;

  // Swap text panels when output has real content (not the placeholder)
  const hasPlaceholder = outputArea.querySelector(".output-placeholder");
  const currentOutput  = hasPlaceholder ? "" : outputArea.textContent.trim();

  if (currentOutput) {
    const prevInput = sourceTextarea.value.trim();
    sourceTextarea.value = currentOutput;
    updateCharCount();

    // Put the old source text into the output panel, or clear it
    if (prevInput) {
      displayTranslation(prevInput);
    } else {
      clearOutput();
    }
  }

  hideError();
}

/* ============================================================
   10. COPY TO CLIPBOARD
   ============================================================ */

async function handleCopy() {
  const text = outputArea.textContent.trim();
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    showCopyToast("✓ Copied to clipboard!");
  } catch {
    // Fallback for older browsers / non-HTTPS
    try {
      const range = document.createRange();
      range.selectNodeContents(outputArea);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand("copy");
      sel.removeAllRanges();
      showCopyToast("✓ Copied!");
    } catch {
      showCopyToast("Copy failed. Please select and copy manually.");
    }
  }
}

function showCopyToast(message) {
  copyToast.textContent = message;
  copyToast.classList.add("visible");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    copyToast.classList.remove("visible");
  }, 2500);
}

/* ============================================================
   11. CLEAR BUTTONS
   ============================================================ */

function handleClearSource() {
  sourceTextarea.value = "";
  updateCharCount();
  clearOutput();
  hideError();
  sourceTextarea.focus();
}

function handleClearOutput() {
  clearOutput();
  hideError();
}

/* ============================================================
   12. KEYBOARD SHORTCUT: Ctrl+Enter / Cmd+Enter to translate
   ============================================================ */

function handleTextareaKeydown(event) {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    handleTranslate();
  }
}

/* ============================================================
   13. EVENT LISTENERS
   ============================================================ */

function attachEventListeners() {
  translateBtn.addEventListener("click",   handleTranslate);
  swapBtn.addEventListener("click",        handleSwap);
  copyBtn.addEventListener("click",        handleCopy);
  clearSourceBtn.addEventListener("click", handleClearSource);
  clearOutputBtn.addEventListener("click", handleClearOutput);
  sourceTextarea.addEventListener("input", updateCharCount);
  sourceTextarea.addEventListener("keydown", handleTextareaKeydown);

  // Hide error banner whenever the user modifies input or changes language
  [sourceTextarea, sourceLangSelect, targetLangSelect].forEach(el =>
    el.addEventListener("change", hideError)
  );
  sourceTextarea.addEventListener("input", hideError);
}

/* ============================================================
   14. BOOT
   ============================================================ */

(function init() {
  populateLanguageDropdowns();
  updateCharCount();
  attachEventListeners();
})();
