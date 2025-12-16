import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, Lightbulb, CheckCircle, RotateCw } from "lucide-react";

export default function HowToPlay() {
  return (
    <div className="min-h-screen bg-[#F8EFE2] text-[#1F2937] font-sans selection:bg-[#F87171] selection:text-white pb-20">
      
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
        <Link href="/">
          <a className="flex items-center gap-2 group">
              {/* Logo Mark */}
              <div className="w-10 h-10 bg-[#F87171] rounded-lg flex items-center justify-center text-white font-bold text-xl rotate-3 shadow-sm group-hover:rotate-6 transition-transform">
                  V
              </div>
              <span className="font-bold text-2xl tracking-tight text-gray-800">Viisi</span>
          </a>
        </Link>
        
        <Link href="/">
           <a className="flex items-center gap-2 text-gray-600 font-bold hover:text-[#F87171] transition-colors">
             <ArrowLeft size={20} /> Back to Home
           </a>
        </Link>
      </nav>

      <div className="container mx-auto px-4 max-w-3xl mt-8">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
        >
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#F87171] mb-4">How to Play Viisi</h1>
            <p className="text-xl text-gray-600">Master the daily five-letter challenge.</p>
        </motion.div>

        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#3CB371] text-white rounded-[2rem] p-8 md:p-12 shadow-xl border-4 border-[#349e63]"
        >
            <div className="mb-8">
                <p className="text-xl font-medium mb-6 opacity-90 leading-relaxed">
                    There is a new game each day with 5 new letters.
                </p>
                <p className="text-2xl font-bold mb-8">
                    Create words using the 5 letters shown.
                </p>

                <ul className="space-y-4 text-lg">
                    <li className="flex items-start gap-3">
                        <span className="mt-2 w-2 h-2 bg-white rounded-full flex-shrink-0" />
                        <span>Words must use all 5 letters</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="mt-2 w-2 h-2 bg-white rounded-full flex-shrink-0" />
                        <span>Words must be real words from the dictionary</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="mt-2 w-2 h-2 bg-white rounded-full flex-shrink-0" />
                        <span>When you have found all 5 words on each row you win!</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="mt-2 w-2 h-2 bg-white rounded-full flex-shrink-0" />
                        <span className="opacity-90">Leaving the game clears any partially typed row, so lock in words before navigating away.</span>
                    </li>
                </ul>
            </div>

            <div className="space-y-6 pt-6 border-t border-white/20">
                <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                        <Lightbulb className="w-8 h-8 text-yellow-300" />
                    </div>
                    <div>
                        <span className="font-bold text-yellow-300">Need a hint?</span>
                        <p className="opacity-90 mt-1">Find 3 words to unlock. It shows two random letters — but clears your current row.</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                         <CheckCircle className="w-8 h-8 text-red-300" />
                    </div>
                    <div>
                        <span className="font-bold text-red-300">Ready to give up?</span>
                        <p className="opacity-90 mt-1">Tap to reveal the solution. Careful—there's no going back.</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                        <RotateCw className="w-8 h-8 text-red-300" />
                    </div>
                    <div>
                        <span className="font-bold text-red-300">Play again?</span>
                        <p className="opacity-90 mt-1">Tap to Reset the current game. It won't change your stats.</p>
                    </div>
                </div>
            </div>

            <div className="mt-10 pt-8 border-t border-white/20 grid md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-2xl font-bold mb-4 text-[#1F2937]">Archive</h3>
                    <ul className="space-y-2">
                         <li className="flex items-start gap-3">
                            <span className="mt-2 w-1.5 h-1.5 bg-[#1F2937] rounded-full flex-shrink-0" />
                            <span className="text-[#1F2937]/80 font-medium">View or replay past games!</span>
                        </li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-2xl font-bold mb-4 text-[#1F2937]">Stats</h3>
                    <ul className="space-y-2 text-[#1F2937]/80 font-medium">
                        <li className="flex items-start gap-3">
                            <span className="mt-2 w-1.5 h-1.5 bg-[#1F2937] rounded-full flex-shrink-0" />
                            <span>All Wins: Total wins</span>
                        </li>
                         <li className="flex items-start gap-3">
                            <span className="mt-2 w-1.5 h-1.5 bg-[#1F2937] rounded-full flex-shrink-0" />
                            <span>Solve Rate: % of games solved</span>
                        </li>
                         <li className="flex items-start gap-3">
                            <span className="mt-2 w-1.5 h-1.5 bg-[#1F2937] rounded-full flex-shrink-0" />
                            <span>Hints Used: Hint-assisted wins</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="mt-2 w-1.5 h-1.5 bg-[#1F2937] rounded-full flex-shrink-0" />
                            <span>Daily Streak: Play every day to keep your winning streak going!</span>
                        </li>
                    </ul>
                </div>
            </div>

        </motion.div>
      </div>
    </div>
  );
}
