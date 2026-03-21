document.addEventListener('DOMContentLoaded', () => {
    const walletAddressEl = document.getElementById('wallet-address');
    const statusDotEl = document.getElementById('status-dot');
    const loginBtn = document.getElementById('login-btn');

    // 1. Fetch current wallet state from Chrome Storage
    chrome.storage.local.get(['neurochain_wallet'], (result) => {
        if (result.neurochain_wallet) {
            const addr = result.neurochain_wallet;
            walletAddressEl.textContent = `${addr.substring(0, 8)}...${addr.substring(addr.length - 8)}`;
            statusDotEl.classList.add('active');
            loginBtn.textContent = "Open Dashboard";
        } else {
            statusDotEl.classList.remove('active');
            walletAddressEl.textContent = "Please connect to sync.";
        }
    });

    // 2. Open Next.js App to handle Real Web3 Auth
    loginBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: 'http://localhost:3000' });
    });
});