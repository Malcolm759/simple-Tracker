import React, { useState, useEffect, useRef } from "react";
import { createPublicClient, http, isAddress } from "viem";
import { mainnet, sepolia } from "viem/chains";
import { formatUnits, formatGwei, formatEther } from "viem";

// --- INLINE SVG ICONS (Zero external dependencies) ---

const EthereumLogo = () => (
  <svg className="w-5 h-7 fill-current text-slate-200" viewBox="0 0 256 417">
    <path
      d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z"
      fillOpacity="0.6"
    />
    <path d="M127.962 0L0 212.32l127.962 75.638V154.158z" fillOpacity="0.45" />
    <path
      d="M127.961 312.187l-1.575 1.92v98.199l1.575 4.601 128.038-180.32z"
      fillOpacity="0.6"
    />
    <path d="M127.962 416.907V312.187L0 236.587z" fillOpacity="0.45" />
  </svg>
);

const FastIcon = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

const ClockIcon = () => (
  <svg
    className="w-5 h-5 stroke-current fill-none"
    strokeWidth="2.5"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
);

const HourglassIcon = () => (
  <svg
    className="w-5 h-5 stroke-current fill-none"
    strokeWidth="2.5"
    viewBox="0 0 24 24"
  >
    <path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
  </svg>
);

const SparkleIcon = () => (
  <svg className="w-7 h-7 text-slate-500 fill-current" viewBox="0 0 24 24">
    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
  </svg>
);

const CursorPointerIcon = () => (
  <svg
    className="w-4 h-4 text-white fill-current absolute -right-2 bottom-0 transform translate-x-1/2 translate-y-1/2"
    viewBox="0 0 24 24"
  >
    <path d="M13.64 21.97C13.14 22.21 12.54 22 12.31 21.5L10.13 16.7L6.47 19.91C6.07 20.26 5.46 20.12 5.23 19.63C5.08 19.31 5 18.96 5 18.6V3.81C5 3.12 5.62 2.62 6.29 2.81L20.16 7.82C20.78 8.04 21.03 8.76 20.68 9.3C20.45 9.66 20.06 9.87 19.63 9.87H14.88L17.16 14.78C17.38 15.28 17.17 15.88 16.67 16.11L13.64 21.97Z" />
  </svg>
);

// --- MAIN DASHBOARD COMPONENT ---

export default function App() {
  // ==========================================
  // STATE DEFINITIONS
  // ==========================================

  // 1. Live Timestamp State
  const [currentTime, setCurrentTime] = useState(
    "Tuesday, January 27, 2026 at 5:06:15 PM WAT",
  );

  // 2. Active Gas Selection State ('fast' | 'standard' | 'slow')
  // const [selectedSpeed, setSelectedSpeed] = useState("standard");

  // 3. Wallet Connection State
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  // 4. Gas Prices Dynamic State
  const [gasPrices, setGasPrices] = useState({
    fast: { gwei: 18, confidence: "99% in < 30s", color: "emerald" },
    standard: { gwei: 12, confidence: "90% in < 60s", color: "amber" },
    slow: { gwei: 8, confidence: "75% in < 3min", color: "sky" },
  });

  // 5. Settings Configuration State
  const [settings, setSettings] = useState({
    network: "Ethereum Mainnet",
    refreshInterval: 10, // seconds
    autoRefresh: true,
  });

  // 6. Latest Transactions Data State
  const [transactions, setTransactions] = useState([
    {
      id: 1,
      hash: "Tx Hash",
      gwei: "15 Gwei",
      from1: "00",
      from2: "10",
      to: "28 Gwei",
      time: "...1",
    },
    {
      id: 2,
      hash: "Gal Uash",
      gwei: "15 Gwei",
      from1: "01",
      from2: "21",
      to: "28 Gwei",
      time: "...1",
    },
    {
      id: 3,
      hash: "Seatinterred",
      gwei: "28 Gwei",
      from1: "s",
      from2: "9",
      to: "28 Gwei",
      time: "...2",
    },
  ]);

  // 7. Input box dynamic state

  const [input, setInputBox] = useState(false);

  const handleInput = () => {
    setInputBox(input);
  };

  // 8. useRef hook

  const inputRef = useRef();

  const address = () => {
    const add = inputRef.current.value.trim();
  };

  // ==========================================
  // EFFECTS & HANDLERS
  // ==========================================

  // Live Timer Simulation (Updates seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      // Formatted to match design string layout
      const formatted = `${now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} at ${now.toLocaleTimeString("en-US")} WAT`;
      setCurrentTime(formatted);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  //viem functionality

  const client = createPublicClient({
    chain: sepolia,
    transport: http(
      "https://eth-sepolia.g.alchemy.com/v2/alch_0q3Nl9-Q_33h7GrCBS2Wv",
    ),
    //,
  });

  const currentAddress = inputRef.current?.value?.trim();

  const [useBalance, usableBalance] = useState(null);
  const [weiBalance, setWeiBalance] = useState(null);
  const [etherBalance, setEtherBalance] = useState(null);

  const balance = async () => {
    console.log("Checking address from ref:", currentAddress);

    if (!currentAddress) {
      console.log("No address typed in the input field!");
      return;
    }

    try {
      // 2. Validate and fetch
      if (isAddress(currentAddress)) {
        const balancedWei = await client.getBalance({
          address: currentAddress,
        });

        const formattedBalance = formatGwei(balancedWei);
        usableBalance(formattedBalance);
        setWeiBalance(balancedWei.toString());
        setEtherBalance(formatEther(balancedWei));
      } else {
        console.log("Invalid Ethereum address format:", currentAddress);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  // SVG Chart path matching exact trajectory in visual reference
  const sparklinePath =
    "M 0 110 Q 20 120 30 100 T 60 120 T 90 90 T 120 80 T 150 100 T 180 50 T 210 90 T 240 70 T 270 120 T 300 65 T 330 90 T 360 70 T 390 80 T 420 20 T 450 60 T 480 15 L 500 35";
  const areaPath = `${sparklinePath} L 500 150 L 0 150 Z`;

  return (
    <div className="min-h-screen bg-[#181B20] text-[#C9D1D9] font-sans antialiased p-4 md:p-8 flex justify-center selection:bg-amber-500/20">
      <div className="w-full max-w-[1140px] space-y-5">
        {/* ================= HEADER ================= */}
        <header className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#22272E] border border-[#30363D] flex items-center justify-center shadow-inner">
              <EthereumLogo />
            </div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              ETH Gas Tracker
            </h1>
          </div>

          <button
            onClick={() => {
              balance();
            }}
            className="bg-[#2D333B] hover:bg-[#3C444D] text-white font-medium text-sm px-5 py-2.5 rounded-xl border border-[#444C56] transition-all shadow-sm active:scale-95"
          >
            Connect Wallet
          </button>
        </header>

        <div className="textBox">
          <input
            type="text"
            ref={inputRef}
            placeholder="Enter your Wallet Address"
            className="w-[70%] p-3 rounded-[10px] border-white border m-auto"
          />
        </div>

        {/* ================= GAS CARDS TOP GRID ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* FAST CARD */}

          <div
            // onClick={() => balance()}
            className={`bg-[#22272E] rounded-2xl p-6 flex flex-col justify-between h-[185px] cursor-pointer transition-all border ${
              weiBalance
                ? "border-emerald-500 shadow-lg shadow-emerald-500/10"
                : "border-[#30363D] hover:border-emerald-500/50"
            }`}
          >
            <header className="text-emerald-400 font-bold text-xl">
              {" "}
              GWEI BALANCE
            </header>

            <div className="flex items-center justify-center  gap-2">
              <div className="text-4xl h-[150px] flex items-center justify-center font-extrabold text-emerald-400 tracking-tight">
                {useBalance} Gwei🔥
              </div>
            </div>
            {/* <p className="text-sm text-[#8B949E] font-medium">
              {gasPrices.fast.confidence}
            </p> */}
          </div>

          {/* STANDARD CARD (ACTIVE HIGHLIGHT) */}
          <div
            // onClick={() => setSelectedSpeed("standard")}
            className={`bg-[#22272E] rounded-2xl p-6 flex flex-col justify-between h-[185px] cursor-pointer transition-all relative overflow-hidden border-2 ${
              useBalance
                ? "border-amber-500 shadow-xl shadow-amber-500/10"
                : "border-[#30363D] hover:border-amber-500/50"
            }`}
          >
            <header className="text-amber-400 font-bold text-xl">
              {" "}
              WEI BALANCE
            </header>
            {/* Top Border Accent Line from screenshot */}
            <div className="absolute top-0 left-10 right-10 h-[3px] bg-amber-400 rounded-b-full"></div>

            <div className="flex items-baseline gap-2">
              <span className="text-[23px] font-extrabold text-amber-400 tracking-tight">
                {weiBalance} wei🔥
              </span>
              <span className="text-2xl"></span>
            </div>
            
          </div>

          {/* SLOW CARD */}
          <div
            // onClick={() => balance()}
            className={`bg-[#22272E] rounded-2xl p-6 flex flex-col justify-between h-[185px] cursor-pointer transition-all border ${
              etherBalance
                ? "border-sky-400 shadow-lg shadow-sky-400/10"
                : "border-[#30363D] hover:border-sky-400/50"
            }`}
          >
            <header className="text-sky-400 font-bold text-xl">
              
              ETH BALANCE
            </header>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-sky-400 tracking-tight">
                {etherBalance} Eth🔥
              </span>
            </div>
            
          </div>
        </div>

        {/* ================= TIMESTAMP READOUT ================= */}
        <div className="text-xs text-[#8B949E] px-1 font-medium">
          Current Time: <span className="text-slate-300">{currentTime}</span>
        </div>

        {/* ================= MIDDLE SECTION: GRAPH & SIDE PANELS ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* MAIN GRAPH CONTAINER */}
          <div className="lg:col-span-2 bg-[#22272E] border border-[#30363D] rounded-2xl p-6 flex flex-col h-[340px]">
            <h2 className="text-lg font-medium text-white mb-4">
              Gas Price History (24h)
            </h2>

            {/* Chart Graphic Grid Canvas */}
            <div className="relative flex-1 flex flex-col justify-between border-l border-b border-[#30363D]/70 pl-2 pb-2 mt-2">
              

              

              

                  

             
            </div>
          </div>

          {/* RIGHT COLUMN SIDE PANELS */}
          <div className="space-y-5">
            {/* SETTINGS CARD */}
            <div className="bg-[#22272E] border border-[#30363D] rounded-2xl p-6">
              <h3 className="text-lg font-medium text-white mb-3">Settings</h3>
              <div className="space-y-1.5 text-sm text-[#8B949E]">
                <p>
                  Network:{" "}
                  <span className="text-white font-medium">
                    {settings.network}
                  </span>
                </p>
                <p>
                  Refresh Interval:{" "}
                  <span className="text-white font-medium">
                    {settings.refreshInterval} seconds (
                    {settings.autoRefresh ? "Auto" : "Manual"})
                  </span>
                </p>
              </div>
            </div>

            {/* TOOLS & RESOURCES CARD (WITH MOUSE CURSOR OVERLAY AS IN REFERENCE PHOTO) */}
            <div className="bg-[#22272E] border border-[#30363D] rounded-2xl p-6 relative">
              <h3 className="text-lg font-medium text-white mb-3">
                Tools & Resources
              </h3>

              <ul className="space-y-2 text-sm text-[#C9D1D9]">
                <li className="hover:text-white cursor-pointer transition-colors relative inline-block">
                  Viem Docs
                  {/* Mouse Cursor Visual matching the prompt photo */}
                  <span className="absolute left-[70px] top-[2px] pointer-events-none">
                    <CursorPointerIcon />
                  </span>
                </li>
                <li className="hover:text-white cursor-pointer transition-colors">
                  Wagmi Docs
                </li>
                <li className="hover:text-white cursor-pointer transition-colors">
                  TanStack Query
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ================= BOTTOM SECTION: LATEST TRANSACTIONS ================= */}
        <div className="bg-[#22272E] border border-[#30363D] rounded-2xl p-6 relative">
          <h2 className="text-lg font-medium text-white mb-4">
            Latest Transactions
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[#8B949E] border-b border-[#30363D] text-xs">
                  <th className="pb-3 font-normal"></th>
                  <th className="pb-3 font-normal">Gwei Used</th>
                  <th className="pb-3 font-normal">From</th>
                  <th className="pb-3 font-normal">From</th>
                  <th className="pb-3 font-normal">To</th>
                  <th className="pb-3 font-normal text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30363D]/60 font-mono text-xs md:text-sm">
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-[#2A3038] transition-colors"
                  >
                    <td className="py-3 text-white font-sans font-medium">
                      {tx.hash}
                    </td>
                    <td className="py-3 text-emerald-400 font-semibold">
                      {tx.gwei}
                    </td>
                    <td className="py-3 text-emerald-400">{tx.from1}</td>
                    <td className="py-3 text-[#8B949E]">{tx.from2}</td>
                    <td className="py-3 text-rose-500 font-medium">{tx.to}</td>
                    <td className="py-3 text-[#8B949E] text-right font-sans">
                      {tx.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sparkle Icon Decorative Accent at Bottom-Right */}
          <div className="absolute right-6 bottom-4 pointer-events-none opacity-40">
            <SparkleIcon />
          </div>
        </div>
      </div>
    </div>
  );
}
