// components/PetraDirectConnect.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

/**
 * Resilient PetraDirectConnect
 * - Handles adapter variations (no select())
 * - Connect with timeout and helpful hints
 */
const PetraDirectConnect: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = (searchParams.get("redirect") as string) || "/games";

  const {
    wallets = [],
    select,
    connect,
    connected,
    connecting,
    wallet,
  } = useWallet();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    if (connected) navigate(redirect);
  }, [connected, navigate, redirect]);

  const connectWithTimeout = async (fn: () => Promise<void>, timeoutMs = 12000) => {
    return await Promise.race([
      (async () => { await fn(); })(),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), timeoutMs)),
    ]);
  };

  const connectToWallet = async (w: any) => {
    setError(null);
    setHint(null);
    setIsLoading(true);
    console.debug("connectToWallet: wallet entry:", w);

    try {
      if (typeof select === "function" && w?.name) {
        await select(w.name);
        await connectWithTimeout(() => (connect ? connect() : Promise.reject(new Error("connect not available"))), 12000);
        return;
      }

      if (w?.adapter && typeof w.adapter.connect === "function") {
        await connectWithTimeout(() => w.adapter.connect(), 12000);
        return;
      }

      if (w?.connect && typeof w.connect === "function") {
        await connectWithTimeout(() => w.connect(), 12000);
        return;
      }

      if (typeof connect === "function") {
        await connectWithTimeout(() => connect(), 12000);
        return;
      }

      throw new Error("No supported connect method found on wallet adapter.");
    } catch (err: any) {
      console.warn("connectToWallet error:", err);
      if (err?.message === "timeout") {
        setHint("No response from the wallet. Check the Petra extension popup in the browser toolbar and ensure it is unlocked.");
      } else {
        setError(err?.message || "Failed to connect to wallet.");
      }
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    setHint(null);

    try {
      const petraCandidate = wallets.find((x: any) => x.name?.toLowerCase() === "petra");
      const windowPetra = typeof (window as any).petra !== "undefined";
      const windowAptos = typeof (window as any).aptos !== "undefined";
      console.debug("wallets:", wallets.map((w: any) => w.name), "window.petra:", windowPetra, "window.aptos:", windowAptos);

      if (petraCandidate) {
        await connectToWallet(petraCandidate);
        return;
      }

      if (windowPetra) {
        await connectToWallet(wallets[0] ?? {});
        return;
      }

      // Fallback: try direct window.aptos.connect()
      if (windowAptos && (window as any).aptos.connect) {
        try {
          const response = await (window as any).aptos.connect();
          setHint("Connected directly to Petra via window.aptos.connect().");
          setIsLoading(false);
          // Optionally, you can redirect or update state here
          navigate(redirect);
          return;
        } catch (directErr: any) {
          setError("Direct Petra connect failed: " + (directErr?.message || directErr));
          setIsLoading(false);
          return;
        }
      }

      setError("Petra wallet not detected. Install Petra and refresh the page.");
      setIsLoading(false);
    } catch (err: any) {
      console.error("handleConnect unexpected:", err);
      setError(err?.message || "Unexpected error");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-lg">
        <h1 className="text-2xl font-semibold mb-2 text-center">Connect Petra Wallet</h1>
        <p className="text-sm text-slate-400 mb-6 text-center">
          Connect Petra to access the Games Hub. If Petra is installed, allow the approval popup in the extension toolbar.
        </p>

        {wallet ? (
          <div className="mb-3 text-sm text-slate-300">Detected wallet: <span className="font-medium">{wallet.name}</span></div>
        ) : (
          <div className="mb-3 text-sm text-slate-500">No wallet selected yet.</div>
        )}

        {error && <div className="mb-3 rounded-md bg-red-900/60 p-3 text-sm text-red-200">{error}</div>}
        {hint && <div className="mb-3 rounded-md bg-yellow-900/30 p-3 text-sm text-yellow-200">{hint}</div>}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleConnect}
            disabled={isLoading || connecting || connected}
            className="w-full rounded-xl py-3 text-sm font-medium bg-gradient-to-r from-indigo-600 to-sky-600 hover:opacity-90 disabled:opacity-60"
          >
            {connected ? "Connected — Enter Games Hub" : isLoading || connecting ? "Connecting..." : "Connect Petra Wallet"}
          </button>

          <div className="text-xs text-center text-slate-400 mt-2">
            If Petra doesn't respond, check the Petra extension icon in the toolbar and make sure it is unlocked.
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            {wallets.map((w: any) => (
              <button
                key={w.name ?? Math.random()}
                onClick={() => connectToWallet(w)}
                className="rounded-lg py-2 text-xs border border-slate-700/50"
              >
                {w.name ?? "Unknown Wallet"}
              </button>
            ))}
          </div>

          <div className="mt-4 text-center text-xs text-slate-500">
            <a href="https://petra.app" target="_blank" rel="noreferrer" className="underline">Get Petra</a> • Refresh after installing Petra.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetraDirectConnect;
