import { useEffect, useState } from "react";
import { PeraWalletConnect } from "@perawallet/connect";

// Instantiate once, outside the component, so it persists across renders
const peraWallet = new PeraWalletConnect();

export default function LoginButton() {
  const [accountAddress, setAccountAddress] = useState<string | null>(null);

  const connectWallet = async () => {
    try {
      const accounts = await peraWallet.connect(); // ✅ call .connect() on the instance
      setAccountAddress(accounts[0]);
    } catch (error: any) {
      if (error?.data?.type !== "CONNECT_MODAL_CLOSED") {
        console.error("Connection failed:", error);
      }
    }
  };

  const disconnectWallet = () => {
    peraWallet.disconnect(); // ✅ not async, no need to await
    setAccountAddress(null);
  };

  useEffect(() => {
    // ✅ Use reconnectSession() — the correct SDK method for restoring sessions
    peraWallet
      .reconnectSession()
      .then((accounts) => {
        if (accounts.length) {
          setAccountAddress(accounts[0]);
        }
      })
      .catch((error) => {
        // Ignore — no prior session
        console.warn("No session to reconnect:", error);
      });

    // ✅ Clean up the modal/listeners when the component unmounts
    return () => {
      peraWallet.connector?.off("disconnect");
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      {accountAddress ? (
        <>
          <div className="px-3 py-2 bg-purple-900/50 border border-purple-700 rounded-lg text-xs text-purple-200">
            {accountAddress.slice(0, 6)}...{accountAddress.slice(-4)}
          </div>
          <button
            onClick={disconnectWallet}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-xs font-medium"
          >
            Disconnect
          </button>
        </>
      ) : (
        <button
          onClick={connectWallet}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}
