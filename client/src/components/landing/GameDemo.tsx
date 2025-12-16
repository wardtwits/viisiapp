import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, HelpCircle, RotateCw, RefreshCw, X } from "lucide-react";

export function GameDemo() {
  // Mock state for a visual demo
  const [grid, setGrid] = useState([
    ["C", "R", "A", "N", "E"],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
  ]);

  return (
    <div className="flex flex-col h-full bg-[#F8EFE2] select-none">
      {/* Header */}
      <header className="flex justify-between items-center px-4 py-2 pt-4">
        <div className="text-red-500 font-bold text-lg">Viisi</div>
        <div className="flex gap-3">
          <button className="text-red-500 p-1 hover:bg-red-50 rounded-full transition-colors">
            <Settings size={22} />
          </button>
          <button className="text-red-500 p-1 hover:bg-red-50 rounded-full transition-colors">
            <HelpCircle size={22} />
          </button>
        </div>
      </header>

      {/* Date & Title */}
      <div className="text-center py-2">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Monday, Dec 15, 2025</div>
        <h2 className="text-sm font-bold text-[#1F2937] mt-1">Find 5 words with today's letters</h2>
      </div>

      {/* Grid */}
      <div className="flex-1 px-4 flex flex-col justify-center gap-2 max-h-[380px]">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-5 gap-2">
            {row.map((letter, colIndex) => (
              <motion.div
                key={`${rowIndex}-${colIndex}`}
                initial={false}
                animate={{ 
                    scale: letter ? [0.8, 1.1, 1] : 1,
                    backgroundColor: rowIndex === 0 ? "#3CB371" : "#E5E7EB00" 
                }}
                className={`
                  aspect-square rounded-md flex items-center justify-center text-xl font-bold border-2
                  ${rowIndex === 0 
                    ? "bg-[#3CB371] border-[#3CB371] text-white" 
                    : "border-gray-300 text-gray-700 bg-transparent"}
                `}
              >
                {letter}
              </motion.div>
            ))}
          </div>
        ))}
      </div>

      {/* Controls Area (Mock) */}
      <div className="mt-auto pb-12 px-4 flex flex-col gap-4">
        {/* Shuffle/Action Buttons */}
        <div className="flex justify-center gap-2">
             {["R", "C", "E", "N", "A"].map((l, i) => (
                 <motion.button
                    whileTap={{ scale: 0.9 }}
                    key={i}
                    className="w-10 h-12 bg-[#F87171] rounded-md text-white font-bold text-xl shadow-sm border-b-4 border-[#DC2626]/20 active:border-b-0 active:translate-y-[4px] transition-all"
                 >
                     {l}
                 </motion.button>
             ))}
        </div>

        <div className="flex justify-center gap-3 mt-2">
            <button className="w-12 h-12 bg-[#F87171] rounded-lg text-white flex items-center justify-center shadow-sm">
                <RotateCw size={20} />
            </button>
             <button className="w-12 h-12 bg-gray-500 rounded-lg text-white flex items-center justify-center shadow-sm">
                <X size={20} />
            </button>
        </div>
      </div>
    </div>
  );
}
