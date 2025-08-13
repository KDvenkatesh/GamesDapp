import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

/**
 * ProtectedLayout: Only allows access if the user is connected to Petra wallet.
 * If not connected, redirects to the connect page.
 */
export default function ProtectedLayout() {
  const [connected, setConnected] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkConnection() {
      try {
        const account = await (window as any).aptos.account();
        if (account?.address) {
          setConnected(true);
        } else {
          setConnected(false);
          navigate("/", { replace: true });
        }
      } catch {
        setConnected(false);
        navigate("/", { replace: true });
      }
    }
    checkConnection();
  }, [navigate]);

  if (!connected) return null;
  return <Outlet />;
}
