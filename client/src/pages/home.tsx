import { PhoneMockup } from "@/components/landing/PhoneMockup";
import { GameDemo } from "@/components/landing/GameDemo";
import { ArrowRight, Download, Star, Trophy, Calendar, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8EFE2] text-[#1F2937] font-sans selection:bg-[#F87171] selection:text-white overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
            {/* Logo Mark */}
            <div className="w-10 h-10 bg-[#F87171] rounded-lg flex items-center justify-center text-white font-bold text-xl rotate-3 shadow-sm">
                V
            </div>
            <span className="font-bold text-2xl tracking-tight text-gray-800">Viisi</span>
        </div>
        <div className="hidden md:flex gap-8 font-semibold text-gray-600">
            <a href="#features" className="hover:text-[#F87171] transition-colors">Features</a>
            <Link href="/how-to-play">
              <a className="hover:text-[#F87171] transition-colors">How to Play</a>
            </Link>
            <a href="#reviews" className="hover:text-[#F87171] transition-colors">Reviews</a>
        </div>
        <button className="bg-[#1F2937] text-white px-5 py-2.5 rounded-full font-bold hover:bg-black transition-transform hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2">
            <Download size={18} />
            <span className="hidden sm:inline">Download</span>
        </button>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-8 pb-20 md:pt-20 md:pb-32 flex flex-col md:flex-row items-center gap-12 md:gap-20">
        <div className="flex-1 text-center md:text-left z-10">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-orange-200 rounded-full px-4 py-1.5 mb-6 text-sm font-bold text-orange-600 shadow-sm"
            >
                <Sparkles size={14} className="text-orange-500" />
                <span>Word Puzzle Game of the Year 2025</span>
            </motion.div>
            
            <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl md:text-7xl font-extrabold leading-[1.1] mb-6 tracking-tight text-gray-900"
            >
                Five letters. <br/>
                <span className="text-[#3CB371]">Five words.</span> <br/>
                <span className="text-[#F87171]">One puzzle.</span>
            </motion.h1>
            
            <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-xl text-gray-600 mb-8 max-w-lg mx-auto md:mx-0 leading-relaxed"
            >
                Challenge your vocabulary with a new puzzle every day. Can you find all five words using just five letters?
            </motion.p>
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
            >
                <button className="h-14 px-8 rounded-2xl bg-black text-white flex items-center justify-center gap-3 hover:bg-gray-800 transition-all hover:-translate-y-1 shadow-xl">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.5 1.55-.03 2.99 1.01 3.93 1.01 1.02 0 2.94-1.33 4.93-1.14 1.64.08 3.12.66 4.13 2.14-3.6 1.76-3.03 6.13.56 7.6-.71 1.76-1.72 3.86-3.66 6.75zm-3.13-16.1c.67-.85 1.13-1.99.98-3.17-1.07.05-2.37.74-3.13 1.63-.61.71-1.12 1.83-1 3.06 1.18.09 2.42-.64 3.15-1.52z"/></svg>
                    <div className="text-left leading-tight">
                        <div className="text-xs font-medium text-gray-300">Download on the</div>
                        <div className="text-xl font-bold font-sans">App Store</div>
                    </div>
                </button>
                <Link href="/how-to-play">
                  <a className="h-14 px-8 rounded-2xl bg-white text-gray-900 border-2 border-gray-200 flex items-center justify-center gap-2 hover:border-[#F87171]/30 hover:bg-red-50 transition-all font-bold text-lg">
                      How to Play <ArrowRight size={20} />
                  </a>
                </Link>
            </motion.div>

             <div className="mt-10 flex items-center gap-4 justify-center md:justify-start text-sm font-semibold text-gray-500">
                <div className="flex -space-x-2">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-[#F8EFE2] flex items-center justify-center overflow-hidden">
                             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="Avatar" />
                        </div>
                    ))}
                </div>
                <div>
                    <div className="flex text-yellow-500 text-xs mb-0.5">★★★★★</div>
                    <span>Loved by 10,000+ players</span>
                </div>
            </div>
        </div>

        <div className="flex-1 relative w-full max-w-[400px] md:max-w-none flex justify-center">
            {/* Decor elements behind phone */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-[#F87171]/20 to-[#3CB371]/20 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>
            
            <motion.div
                initial={{ opacity: 0, y: 40, rotate: -5 }}
                animate={{ opacity: 1, y: 0, rotate: -2 }}
                transition={{ duration: 0.8, type: "spring" }}
            >
                <PhoneMockup className="scale-90 md:scale-100 shadow-2xl shadow-orange-900/10">
                    <GameDemo />
                </PhoneMockup>
            </motion.div>
            
            {/* Floating feature cards */}
             <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="absolute top-20 -right-4 md:right-10 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 max-w-[160px]"
            >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                    <Trophy size={20} />
                </div>
                <div className="font-bold text-gray-900">Daily Streak</div>
                <div className="text-xs text-gray-500">Keep your win streak alive!</div>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute bottom-32 -left-4 md:left-0 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 max-w-[160px]"
            >
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-2">
                    <Calendar size={20} />
                </div>
                <div className="font-bold text-gray-900">Archive</div>
                <div className="text-xs text-gray-500">Play past puzzles anytime.</div>
            </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl font-bold mb-4">More than just a word game</h2>
                <p className="text-gray-500 text-lg">Viisi is designed to be your daily mental break. Clean, simple, and satisfying.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {[
                    {
                        icon: <Calendar className="w-8 h-8 text-[#F87171]" />,
                        title: "Daily Challenges",
                        desc: "Wake up to a fresh puzzle every morning. Same letters for everyone."
                    },
                    {
                        icon: <Trophy className="w-8 h-8 text-[#3CB371]" />,
                        title: "Track Progress",
                        desc: "Detailed stats show your solve rate, streak, and history."
                    },
                    {
                        icon: <Star className="w-8 h-8 text-yellow-500" />,
                        title: "No Ads",
                        desc: "Enjoy a distraction-free experience. Just you and the letters."
                    }
                ].map((feature, i) => (
                    <div key={i} className="p-8 rounded-3xl bg-[#F8EFE2]/50 border border-[#F8EFE2] hover:bg-[#F8EFE2] transition-colors">
                        <div className="mb-4">{feature.icon}</div>
                        <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                        <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1F2937] text-white py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-[#F87171] rounded-lg flex items-center justify-center text-white font-bold text-lg rotate-3">
                    V
                </div>
                <span className="font-bold text-xl">Viisi</span>
            </div>
            <div className="flex gap-8 text-gray-400 text-sm">
                <a href="#" className="hover:text-white transition-colors">Privacy</a>
                <a href="#" className="hover:text-white transition-colors">Terms</a>
                <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
            <div className="text-gray-500 text-sm">
                © 2025 Viisi Games.
            </div>
        </div>
      </footer>
    </div>
  );
}
