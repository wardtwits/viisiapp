import React from "react";
import { cn } from "@/lib/utils";

interface PhoneMockupProps {
  children: React.ReactNode;
  className?: string;
}

export function PhoneMockup({ children, className }: PhoneMockupProps) {
  return (
    <div className={cn("relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl", className)}>
      <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute z-20"></div>
      <div className="h-[32px] w-[3px] bg-gray-800 absolute -start-[17px] top-[72px] rounded-s-lg"></div>
      <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
      <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
      <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
      <div className="rounded-[2rem] overflow-hidden w-full h-full bg-background relative z-10">
        {/* Status Bar Mock */}
        <div className="flex justify-between items-center px-6 pt-2 pb-1 text-xs font-semibold text-foreground/80 z-20 relative">
          <span>9:41</span>
          <div className="flex gap-1">
            <div className="i-lucide-signal w-3 h-3" />
            <div className="i-lucide-wifi w-3 h-3" />
            <div className="i-lucide-battery-full w-3 h-3" />
          </div>
        </div>
        
        {/* App Content */}
        <div className="h-full w-full overflow-hidden pb-8">
            {children}
        </div>
        
        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-foreground/20 rounded-full z-20"></div>
      </div>
    </div>
  );
}
