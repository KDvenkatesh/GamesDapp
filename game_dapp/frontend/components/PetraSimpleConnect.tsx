import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const PetraSimpleConnect: React.FC = () => {
  const [address, setAddress] = useState<string | null>(null);
  // Save address to sessionStorage when it changes
  useEffect(() => {
    if (address) {
      sessionStorage.setItem("petra_wallet_address", address);
    }
  }, [address]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleConnect = async () => {
    setError(null);
    setLoading(true);
    if (!(window as any).aptos) {
      setError("Petra wallet extension not found. Please install it from https://petra.app/");
      setLoading(false);
      return;
    }
    try {
      const response = await (window as any).aptos.connect();
      setAddress(response.address);
      setLoading(false);
      setTimeout(() => navigate("/games"), 500); // route to games after connect
    } catch (err: any) {
      setError("Failed to connect to Petra wallet. " + (err?.message || ""));
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if ((window as any).aptos && (window as any).aptos.disconnect) {
      try {
        await (window as any).aptos.disconnect();
      } catch {}
    }
    setAddress(null);
    sessionStorage.removeItem("petra_wallet_address");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Animated background glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="pointer-events-none absolute -inset-20 z-0 rounded-[3rem] bg-gradient-to-tr from-blue-500/20 via-fuchsia-400/10 to-cyan-400/20 blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, type: "spring", stiffness: 80 }}
        className="max-w-md w-full px-6 py-8 bg-gray-800/60 backdrop-blur-xl rounded-3xl shadow-2xl text-center relative z-10"
      >
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, type: "spring", stiffness: 80 }}
          className="text-4xl font-extrabold mb-4 text-white drop-shadow-lg tracking-tight"
        >
          <span className="bg-gradient-to-r from-blue-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">Welcome to GamesHub</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-gray-300 mb-8"
        >
          Connect your Petra wallet to start playing and earning APT tokens.
        </motion.p>
        <motion.button
          onClick={handleConnect}
          disabled={loading || !!address}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-lg transition-colors"
          whileHover={!address && !loading ? { scale: 1.05 } : {}}
          whileTap={!address && !loading ? { scale: 0.97 } : {}}
        >
          {address ? "Connected!" : loading ? "Connecting..." : "Connect Petra Wallet"}
        </motion.button>
        <AnimatePresence>
          {address && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4 }}
            >
              <p className="mt-4 text-sm text-green-400">Connected: {address}</p>
              <motion.button
                onClick={handleDisconnect}
                className="mt-4 w-full py-2 px-4 bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-lg font-semibold shadow-lg transition-colors"
                whileHover={{ scale: 1.05, rotate: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                Disconnect Wallet
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
        {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-sm text-red-400">{error}</motion.p>}
      </motion.div>
    </div>
  );
};

export default PetraSimpleConnect;
