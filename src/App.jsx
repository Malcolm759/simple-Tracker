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

  // 5. Settings Configuration State
  const [settings, setSettings] = useState({
    network: "Ethereum Mainnet",
    refreshInterval: 10, // seconds
    autoRefresh: true,
  });

  // 7. Input box dynamic state

  const [input, setInputBox] = useState(false);

  const handleInput = () => {
    setInputBox(input);
  };

  // 8. Button clicked state
  const [buttonClicked, setButtonClicked] = useState(false);

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
  const [storage, setStorage] = useState();

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

      const ethBalanceValue = Number.parseFloat(
        formatEther(balancedWei),
      ).toFixed(6);
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
      historyBlocks.forEach(async (historyBlock) => {
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

          const { error } = await supabase.from("Chart").upsert([
            {
              id: 1,
              Chart: hourlyLabels,
              gwei: hourlyGweiValues,
            },
          ]);

          if (error) {
            console.log("Error inserting data", error);
          } else {
            console.log("Successfully stored data");
          }
        }
      });
      // fetching from supabase
      const { data: dataStored, error } = await supabase
        .from("Chart")
        .select("Chart, gwei");

      let allLabels = [];
      let allValues = [];

      allLabels = dataStored.map((row) => row.Chart);
      allValues = dataStored.map((row) => Number(row.gwei));

      const rawLabels =
        typeof dataStored[0].Chart === "string"
          ? JSON.parse(dataStored[0].Chart)
          : dataStored[0].Chart;

      const rawValues =
        typeof dataStored[0].gwei === "string"
          ? JSON.parse(dataStored[0].gwei)
          : dataStored[0].gwei;

      allLabels = Array.isArray(rawLabels) ? rawLabels.flat() : [rawLabels];
      allValues = (
        Array.isArray(rawValues) ? rawValues.flat() : [rawValues]
      ).map(Number);

      setLoaded(true);
      setChartData({
        labels: allLabels,
        datasets: [
          {
            data: allValues,
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

  const btnRef = useRef();

  //Getting latest transactions
  const [txs, setTxs] = useState([]);
  //fetch from supabase
  const fetchFromSupabase = async () => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    if (!error) setTxs(data || []);
  };

  useEffect(() => {
    // 1. Load initial records on mount
    fetchFromSupabase();

    try {
      const unwatch = client.watchBlocks({
        includeTransactions: true,
        emitMissed: true,
        onBlock: async (block) => {
          // 2. Validate transactions exist
          if (!block.transactions || block.transactions.length === 0) return;

          // 3. Format raw Viem data into clean plain JS objects
          const cleanTxs = block.transactions.slice(0, 10).map((tx) => ({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: parseFloat(formatEther(tx.value)),
            gas: tx.gasPrice
              ? parseFloat((Number(tx.gasPrice) / 1e9).toFixed(2))
              : 0,
          }));

          // 4. Save formatted array to Supabase
          const { error } = await supabase
            .from("transactions")
            .upsert(cleanTxs, { onConflict: "hash" });

          if (error) {
            console.error("Supabase upsert error:", error);
            return;
          }

          // 5. Re-fetch updated rows to refresh state
          fetchFromSupabase();
        },
      });

      return () => unwatch();
    } catch (error) {
      console.error("Error performing action", error);
    }
  }, []);

  const [gasCurrently, setGasCurrently] = useState(null);

  useEffect(() => {
    try {
      const gasPriceCurrently = async () => {
        const currentGas = await client.getGasPrice();
        const gweiGas = formatGwei(currentGas);
        console.log(gweiGas);
        setGasCurrently(gweiGas);
      };
      console.log(gasPriceCurrently());
    } catch (error) {
      console.error("Error performing action", error);
    }
  }, []);

  const shorten = (address) => {
    if (!address) return "Contract Creation";
    return address.slice(0, 6) + "..." + address.slice(-4);
  };
  // sidebar function

  // const [side, setSide] = useState(false);

  // const handleSlide = () => {
  //   setSide(!side);
  // };

  return (
    <div className=" bg-[#181B20] text-[#C9D1D9] font-sans p-4 md: flex justify-center selection:bg-amber-50₀/2₀">
      <div className="w-full max-w-[114₀px] space-y-5">
        {/* ================= HEADER ================= */}
        <div className="flex">
          {/* <aside
            className={` bg-black fixed left-0 top-0 w-[50%] h-full transition-all duration-300 ${side ? "reveal" : "conceal"} md:w-[20%]`}
          >
            <div className="text-end">
              <button
                onClick={handleSlide}
                className="border-white border-1 w-[30%] p-1 rounded-[30px] font-bold mt-2"
              >
                Close
              </button>
            </div>

            <ul className=" h-[100%] flex flex-col justify-center items-center gap-6 ">
              <li>Dashboard</li>
              <li>Whale tracker</li>
              <li>Account</li>
              <li>Sign out</li>
            </ul>
          </aside> */}
          {/* Header */}
          <div className=" w-full">
            <header className="flex items-center justify-between pb-1">
              <div className="flex items-center justify-between  w-[55%]">
                {/* <button
                  onClick={handleSlide}
                  className="border-white  bg-[#22272E] border-1 w-[10%] p-1 rounded-[30px] font-bold mt-2"
                >
                  Menu
                </button> */}

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

        {/* CONFIDENCE CARD
        <div className="bg-[#22272E] border border-[#30363D] rounded-2xl p-6 w-[full]">
          

          
        </div> */}
        {/* ================= BOTTOM SECTION: LATEST TRANSACTIONS AND SETTINGS CARD ================= */}
        <div className="grid grid-cols-1 gap-5">
          <div className="bg-[#22272E] border border-[#30363D] rounded-2xl p-6 relative  md:w-[full]">
            <h2 className="text-lg font-medium text-white mb-4">
              Latest Transactions for the Ethereum blockchain
            </h2>

            <div className="overflow-x-scroll md:overflow-x-hidden">
              <table border="1" className="w-[200%] md:w-full ">
                <thead>
                  <tr>
                    <th className="text-start">Tx Hash</th>
                    <th className="text-start">From</th>
                    <th className="text-start">To</th>
                    <th className="text-start">Value (ETH)</th>
                    <th className="text-start">Gas Price (Gwei)</th>
                  </tr>
                </thead>
                <tbody>
                  {txs.length === 0 ? (
                    <tr>
                      <td colSpan="5"></td>
                    </tr>
                  ) : (
                    txs.map((tx) => (
                      <tr key={tx.hash}>
                        <td>{shorten(tx.hash)}</td>
                        <td>{shorten(tx.from)}</td>
                        <td>{shorten(tx.to)}</td>
                        <td>{Number(tx.value).toFixed(4)}</td>
                        <td>{tx.gas}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
