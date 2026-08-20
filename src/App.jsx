import React, { useState, useEffect, useRef } from "react";
import { createPublicClient, http, isAddress, size, parseAbi } from "viem";
import { mainnet, sepolia } from "viem/chains";
import { formatUnits, formatGwei, formatEther } from "viem";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import { plugins } from "chart.js/auto";
import { supabase } from "./supabase-client.js";
import arrow from "./assets/arrow-left.png";


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

const App = () => {
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

  // 8. Button clicked state
  const [buttonClicked, setButtonClicked] = useState(false);

  // 9. useRef hook

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
    chain: mainnet,
    transport: http(
      "https://eth-mainnet.g.alchemy.com/v2/alch_0q3Nl9-Q_33h7GrCBS2Wv", // add as an environment variable later
      { batch: true },
    ),
    //,
  });

  const [useBalance, setBalance] = useState(null);
  const [weiBalance, setWeiBalance] = useState(null);
  const [etherBalance, setEtherBalance] = useState(null);
  const inputRef = useRef();
  const [usd, setUSD] = useState(null);
  const currentAddress = inputRef.current?.value?.trim();

  //THIS FUNCTION INCLUDES GETTING BALANCE INCLUDING DOLLAR EQUIVALENT

  const balance = async () => {
    if (!currentAddress) {
      console.log("No address typed in the input field!");
      return;
    }

    try {
      if (!isAddress(currentAddress)) {
        console.log("Invalid Ethereum address format:", currentAddress);
        return;
      }

      const balancedWei = await client.getBalance({
        address: currentAddress,
      });

      const ethBalanceValue = Number.parseFloat(formatEther(balancedWei));
      const formattedBalance = formatGwei(balancedWei);

      setBalance(formattedBalance);
      setWeiBalance(balancedWei.toString());
      setEtherBalance(String(ethBalanceValue));

      // FETCHING DATA FROM COINGECKO API

      const priceData = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
      );

      console.log(priceData);

      if (!priceData.ok) {
        throw new Error("Failed to fetch ETH price");
      }

      const responseData = await priceData.json();
      const ethPriceUsd = responseData?.ethereum?.usd;

      if (typeof ethPriceUsd !== "number") {
        setUSD(null);
        return;
      }

      //CONVERTING TO DOLLAR

      const convertedPrice = ethBalanceValue * ethPriceUsd;
      setUSD(Number(convertedPrice.toFixed(2)));
    } catch (error) {
      console.error("Error fetching balance:", error);
      setUSD(null);
    }
  };

  // Gas fee code for charting

  const BLOCKS_PER_HOUR = 300; // ~12s per block
  const HOURS = 24;

  //FETCHING BLOCK HISTORICAL DATA FOR CHARTING OVER 24 HOURS

  const [gweilabel, setGweiLabel] = useState([]);
  const [hourlyLabels, setHourlyLabels] = useState([]);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  const [loading, setLoading] = useState();
  const [errorLoad, setErrorLoad] = useState();
  const [loaded, setLoaded] = useState();

  // paragraph updaters
  const [pA, setPA] = useState();
  const [pB, setPB] = useState();
  const [pC, setPC] = useState();
  const [pD, setPD] = useState();

  // ✅ FETCH FEE HISTORY FUNCTION (outside effect so it can be called)
  const fetchFeeHistory = async () => {
    try {
      setLoading(true);
      setErrorLoad(false);
      const currentBlock = await client.getBlockNumber();
      const BLOCKS_PER_HOUR = 300;
      const HOURS = 24;

      // 1. Create an empty array to hold our "waiters"
      const blockPromises = [];

      // 2. Loop 25 times, but DO NOT use 'await'
      for (let i = HOURS; i >= 0; i--) {
        // Convert hours to BigInt blocks to avoid JS type errors
        const offset = BigInt(i * BLOCKS_PER_HOUR);
        const targetBlock = currentBlock - offset;

        // We ask client.getBlock to fetch, but we don't wait for it to finish.
        // We just push the "Promise" (the pending request) into our array.
        const request = client.getBlock({
          blockNumber: targetBlock,
        });

        blockPromises.push(request);
      }

      // 3. Fire all 25 requests at the exact same time!
      const historyBlocks = await Promise.all(blockPromises);

      // 4. Now that we have all the raw data, process it for the chart
      const hourlyLabels = [];
      const hourlyGweiValues = [];

      // Loop through the 25 returned blocks
      historyBlocks.forEach((historyBlock) => {
        if (historyBlock && historyBlock.baseFeePerGas) {
          const gwei = Number(historyBlock.baseFeePerGas) / 1e9;

          const timeLabel = new Date(
            Number(historyBlock.timestamp) * 1000,
          ).toLocaleTimeString([], {
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit",
          });

          hourlyLabels.push(timeLabel);
          hourlyGweiValues.push(gwei);
        }
      });
      setLoaded(true);
      setChartData({
        labels: hourlyLabels,
        datasets: [
          {
            data: hourlyGweiValues,
            backgroundColor: "#2861f0",
            borderRadius: 30,
            maxBarThickness: 10,
          },
        ],
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching fee history:", error);
      setErrorLoad(true);
      setLoading(false);
    }
  };

  // ✅ SEPARATE EFFECT FOR STATUS MESSAGES
  useEffect(() => {
    if (!buttonClicked || !currentAddress) return; // Only run after button is clicked with address

    // Fetch chart data when button clicked with valid address
    fetchFeeHistory();
  }, [buttonClicked, currentAddress]);

  // ✅ EFFECT FOR STATUS MESSAGE DISPLAY
  useEffect(() => {
    if (!buttonClicked) return; // Only run after button is clicked

    // Clear previous messages
    setPA(null);
    setPB(null);
    setPC(null);
    setPD(null);

    // Display status based on current state
    if (!currentAddress) {
      setPA("No address have been typed");
    } else if (loading) {
      setPB("Fetching data");
    } else if (loaded) {
      setPC("Success!");
    } else if (errorLoad) {
      setPD("Cannot fetch data, please check your internet connection");
    }
  }, [buttonClicked, currentAddress, loading, loaded, errorLoad]);

  // Chart options

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      // 1. Labeling the X-Axis (Bottom)
      x: {
        title: {
          display: true,
          text: "Time (Last 24 Hours)", // The text people will see
          color: "#6b7280", // Optional: A nice Tailwind gray color
          font: {
            size: 14,
            weight: "bold",
          },
        },
      },
      // 2. Labeling the Y-Axis (Left Side)
      y: {
        title: {
          display: true,
          text: "Gas Price (Gwei)", // The text people will see
          color: "#6b7280",
          font: {
            size: 14,
            weight: "bold",
          },
        },
      },
    },
  };

  const [GweiValues, setGweiValues] = useState([]);
  const btnRef = useRef();

  // CODE FOR GLOBAL BLOCKCHAIN DATA IN THE CHART

  // useEffect(() => {
  //   const gasFeeHistory = async () => {
  //     const history = await client.getFeeHistory({
  //       blockCount: 8,
  //       rewardPercentiles: [25, 75],
  //     });

  //     if (!history || !history.baseFeePerGas) return;

  //     console.log(history);
  //     setFeeHistory(history);

  //     const startBlock = Number(history?.oldestBlock);
  //     const baseFees = history?.baseFeePerGas?.slice(0, 8);

  //     // const labels = baseFees?.map((_, index) => `${startBlock + index}`) || [];

  //     const labels =
  //       gweilabel?.map((_, index) => `${startBlock + index}`) || [];
  //     const gweiValues = baseFees?.map((wei) => Number(wei) / 1e9) || [];

  //     setGweiValues(gweiValues);

  //     setChartData({
  //       labels: labels,
  //       datasets: [
  //         {
  //           label: "Base Fee (Gwei)",
  //           data: gweiValues,
  //           backgroundColor: "#3b82f6",
  //           borderRadius: 4,
  //           maxBarThickness: 20,
  //           borderRadius: 30,
  //         },
  //       ],
  //     });
  //   };

  //   // ✅ Simple condition: If wallet is connected, run the fetcher!
  //   if (currentAddress && btnRef.current) {
  //     gasFeeHistory();
  //   } else {
  //     // Reset chart when wallet disconnects
  //     setChartData({ labels: [], datasets: [] });
  //   }
  // }, [currentAddress]); // 👈 Re-run automatically when currentAddress changes!

  //Getting latest transactions

  useEffect(() => {
    const latestTransactions = async () => {
      try {
        const transactionBlock = await client.getBlock({
          includeTransactions: true,
        });
        console.log(transactionBlock);
      } catch (error) {
        console.error("Error performing action", error);
      }
    };
    latestTransactions();
  }, []);

  // SVG Chart path matching exact trajectory in visual reference
  const sparklinePath =
    "M 0 110 Q 20 120 30 100 T 60 120 T 90 90 T 120 80 T 150 100 T 180 50 T 210 90 T 240 70 T 270 120 T 300 65 T 330 90 T 360 70 T 390 80 T 420 20 T 450 60 T 480 15 L 500 35";
  const areaPath = `${sparklinePath} L 500 150 L 0 150 Z`;



 
  return (
    <div className=" bg-[#181B20] text-[#C9D1D9] font-sans p-4 md: flex justify-center selection:bg-amber-50₀/2₀">
      <div className="w-full max-w-[114₀px] space-y-5">
        {/* ================= HEADER ================= */}
        <div className="flex">
          <aside
            className={`z-[70] bg-black fixed left-0 top-0 w-[20%] h-full `}
          >
           <button className="border-white border-2 w-[30%] p-1 rounded-[30px] font-bold">
            Close
           </button>
            <ul className="border h-[100%] flex flex-col justify-center items-center gap-6 ">
              <li>Dashboard</li>
              <li>Whale tracker</li>
              <li>Account</li>
              <li>Sign out</li>
            </ul>
          </aside>
          {/* Header */}
          <div className="border w-full">
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
                  setButtonClicked(true);
                  balance();
                }}
                ref={btnRef}
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
          </div>
        </div>

        <div className="text-center">
          <p className="text-xl text-white">{pA}</p>
          <p className="text-xl text-yellow-500">{pB}</p>
          <p className="text-xl text-green-500">{pC}</p>
          <p className="text-xl text-red-500">{pD}</p>
        </div>

        {/* ================= GAS CARDS TOP GRID ================= */}
        <div className="grid grid-cols-1 md:flex justify-center gap-5">
          {/* USD balance */}

          <div
            className={`bg-[#22272E] rounded-2xl breakpoint p-6 flex flex-col justify-between h-[200px] cursor-pointer transition-all border ${
              weiBalance
                ? "border-emerald-500 shadow-lg shadow-emerald-500/10"
                : "border-[#30363D] hover:border-emerald-500/50"
            }`}
          >
            <header className="text-emerald-400 font-bold text-xl md:text-center">
              {" "}
              USD BALANCE
            </header>

            <div className="flex gap-2 md:justify-center">
              <span className="text-[30px] font-extrabold text-emerald-400 tracking-tight">
                {useBalance && usd !== null && usd !== undefined
                  ? `$${usd}`
                  : "..."}
              </span>
            </div>
          </div>

          {/* Eth CARD */}
          <div
            className={`bg-[#22272E] rounded-2xl breakpoint p-6 flex flex-col justify-between h-[200px] cursor-pointer transition-all border ${
              etherBalance
                ? "border-sky-400 shadow-lg shadow-sky-400/10"
                : "border-[#30363D] hover:border-sky-400/50"
            }`}
          >
            <header className="text-sky-400 font-bold text-xl md:text-center">
              ETH BALANCE
            </header>
            <div className="flex gap-2 md:justify-center">
              <span className="text-[30px] font-extrabold text-sky-400 tracking-tight overflow-scroll md:overflow-hidden">
                {etherBalance ? `${etherBalance} Eth🔥` : "..."}
              </span>
            </div>
          </div>
        </div>

        {/* ================= TIMESTAMP READOUT ================= */}
        <div className="text-xs text-[#8B949E] px-1 font-medium">
          Current Time: <span className="text-slate-300">{currentTime}</span>
        </div>

        {/*MIDDLE SECTION: GRAPH */}

        {/* MAIN GRAPH CONTAINER */}
        {/* Outer Container: Scrollable on mobile, no scroll on medium+ screens */}
        <div className="bg-[#22272E] h-[500px] p-3 md:rounded-[30px] overflow-x-auto md:overflow-x-hidden overflow-y-hidden">
          <h2 className="text-lg font-medium text-white mb-4 p-2">
            Global Gas Price History for Ether (24h)
          </h2>

          {/* Inner Wrapper: Fixed width on mobile to keep bars readable, full width on desktop */}
          <div className="border-[#30363D]/70 mt-2 min-w-[600px] md:min-w-0 md:w-full h-[400px]">
            <div className="w-full h-full">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>
        {/* ================= BOTTOM SECTION: LATEST TRANSACTIONS AND SETTINGS CARD ================= */}
        <div className="grid grid-cols-1 gap-5">
          <div className="bg-[#22272E] border border-[#30363D] rounded-2xl p-6 relative  md:w-[full]">
            <h2 className="text-lg font-medium text-white mb-4">
              Latest Transactions
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-[#8B949E] border-b border-[#30363D] text-xs">
                    <th className="pb-3 font-normal">Hash</th>
                    <th className="pb-3 font-normal">From</th>
                    <th className="pb-3 font-normal">To</th>
                    <th className="pb-3 font-normal">Gwei Used</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#30363D]/60 font-mono text-xs md:text-sm"></tbody>
              </table>
            </div>
          </div>

          {/* RIGHT COLUMN SIDE PANELS */}

          <div className=" w-[full] flex gap-7">
            {/* SETTINGS CARD */}
            <div className="bg-[#22272E] border border-[#30363D] rounded-2xl p-6 w-[full]">
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

                {/* <p>
                  Block Number:{" "}
                  {blockNumber ? `${blockNumber} n` : "No balance"}
                </p> */}
              </div>
            </div>

            {/* TOOLS & RESOURCES CARD (WITH MOUSE CURSOR OVERLAY AS IN REFERENCE PHOTO) */}
            <div className="bg-[#22272E] border border-[#30363D] rounded-2xl p-6 relative w-[full]">
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
      </div>
    </div>
  );
};

export default App;
