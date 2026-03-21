// content.js runs inside Web Pages (localhost:3000 and meet.google.com)

console.log("NeuroChain Core Extractor Injected.");

// ==========================================
// SCENARIO 1: Syncing Wallet from Next.js UI
// ==========================================
if (window.location.hostname === "localhost") {
    // Pera Wallet stores connection data in localStorage. We continuously check it.
    setInterval(() => {
        const peraData = window.localStorage.getItem('PeraWallet.Wallet');
        if (peraData) {
            try {
                const parsed = JSON.parse(peraData);
                if (parsed.accounts && parsed.accounts.length > 0) {
                    const walletId = parsed.accounts[0];
                    // Send it securely to the extension background script
                    chrome.runtime.sendMessage({ 
                        type: "SYNC_WALLET", 
                        wallet: walletId 
                    });
                }
            } catch (e) {
                console.error("NeuroChain: Failed to parse Pera storage");
            }
        }
    }, 2000);
}

// ==========================================
// SCENARIO 2: Scraping Data from Google Meet
// ==========================================
if (window.location.hostname === "meet.google.com") {
    
    // Auto-Turn on Captions if they exist (runs after 5 seconds to let UI load)
    setTimeout(() => {
        const captionBtn = document.querySelector('button[aria-label*="Turn on captions"]');
        if (captionBtn) captionBtn.click();
        console.log("NeuroChain: Captions auto-enabled.");
    }, 5000);

    let lastSentCaption = "";
    let lastChatText = "";

    // 1. VOICE EXTRACTION (via Captions)
    // Meet Captions update word-by-word. We use an interval to grab complete sentence chunks safely.
    setInterval(() => {
        // Standard Meet caption classes (may need slight tweaking if Google updates DOM)
        const captionNodes = document.querySelectorAll('.a4cQT .CNusmb, .iOzk7, [jsname="dsyhDe"]');
        
        if (captionNodes.length > 0) {
            const latestNode = captionNodes[captionNodes.length - 1];
            const text = latestNode.innerText.trim();
            
            // Only send substantial new chunks
            if (text && text.length > 15 && text !== lastSentCaption) {
                // Ensure we aren't just sending a subset of the previous sentence
                if (!lastSentCaption.includes(text) && !text.includes(lastSentCaption)) {
                    sendToNeuroChain(text, "meet_voice");
                    lastSentCaption = text;
                }
            }
        }
    }, 4000);

    // 2. CHAT EXTRACTION
    setInterval(() => {
        const chatNodes = document.querySelectorAll('[data-message-text]');
        if (chatNodes.length > 0) {
            const latestChat = chatNodes[chatNodes.length - 1];
            const text = latestChat.innerText.trim();
            
            if (text && text !== lastChatText) {
                sendToNeuroChain(text, "meet_chat");
                lastChatText = text;
            }
        }
    }, 2000);

    function sendToNeuroChain(text, source) {
        console.log(`[NeuroChain] Extracted ${source}:`, text);
        chrome.runtime.sendMessage({
            type: "NEW_NODE_DATA",
            payload: {
                text: text,
                source: source
            }
        });
    }
}