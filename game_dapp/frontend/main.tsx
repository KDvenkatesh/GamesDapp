import "./index.css";

// import React from "react";
// import ReactDOM from "react-dom/client";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// import App from "@/App.tsx";
// // Internal components
// import { Toaster } from "@/components/ui/toaster.tsx";
// import { WalletProvider } from "@/components/WalletProvider.tsx";
// import { WrongNetworkAlert } from "@/components/WrongNetworkAlert";

// const queryClient = new QueryClient();

// ReactDOM.createRoot(document.getElementById("root")!).render(
//   <React.StrictMode>
//     <WalletProvider>
//       <QueryClientProvider client={queryClient}>
//         <App />
//         <WrongNetworkAlert />
//         <Toaster />
//       </QueryClientProvider>
//     </WalletProvider>
//   </React.StrictMode>,
// );


// index.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter as Router } from "react-router-dom";

// Option A: Use WalletAdapterProvider directly here (quick)
// If you already installed Petra adapter, adjust the import path to match your package.
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";

// Option B: Use your custom WalletProvider (if you have one).
// import WalletProvider from "./components/WalletProvider";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    {/* If you use your custom WalletProvider, replace the next line with:
        <WalletProvider>
          <Router><App /></Router>
        </WalletProvider>
    */}
    <AptosWalletAdapterProvider autoConnect>
      <Router>
        <App />
      </Router>
    </AptosWalletAdapterProvider>
  </React.StrictMode>
);
