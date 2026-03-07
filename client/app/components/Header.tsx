"use client";

import React from "react";
import Image from "next/image";
import { Mail, MapPin, Search, Heart, ShoppingBag, User, ChevronDown, RefreshCw } from "lucide-react";

export default function Header() {
  return (
    <header className="w-full bg-primary text-white">
      {/* Top Bar */}
      <div className="border-b border-white/10 py-2">
        <div className="container-custom flex justify-between items-center text-[11px] font-medium">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 cursor-pointer hover:text-secondary transition-colors">
              <Mail size={13} className="text-secondary" />
              <span>Info@Demo.Com</span>
            </div>
            <div className="h-3 w-[1px] bg-white/20"></div>
            <div className="flex items-center gap-2 cursor-pointer hover:text-secondary transition-colors">
              <MapPin size={13} className="text-secondary" />
              <span>Track Order</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 cursor-pointer hover:text-secondary">
                USD <ChevronDown size={12} />
              </div>
              <div className="h-3 w-[1px] bg-white/20"></div>
              <div className="flex items-center gap-1 cursor-pointer hover:text-secondary">
                English <ChevronDown size={12} />
              </div>
              <div className="h-3 w-[1px] bg-white/20"></div>
              <div className="flex items-center gap-2 cursor-pointer hover:text-secondary">
                <User size={14} className="text-secondary" />
                <span>My Account</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="py-7">
        <div className="container-custom flex items-center justify-between gap-12">
          {/* Logo */}
          <div className="flex-shrink-0">
            {/* Note: Assuming logo.png needs to be white to show up on dark background */}
            <Image src="/logo.png" alt="e-Shopi Logo" width={170} height={45} priority className="h-auto brightness-0 invert" />
          </div>

          {/* Search Bar */}
          <div className="flex-grow max-w-4xl">
            <div className="flex items-center bg-white rounded-full overflow-hidden h-[50px]">
              <div className="px-6 flex items-center gap-2 cursor-pointer bg-white text-primary whitespace-nowrap">
                <span className="text-sm font-bold">Categories</span>
                <ChevronDown size={14} className="text-gray-400" />
              </div>
              <div className="h-6 w-[1px] bg-gray-200"></div>
              <input
                type="text"
                placeholder="Enter your search key...."
                className="flex-grow px-6 outline-none text-sm text-primary placeholder:text-gray-400"
              />
              <button className="bg-secondary h-full px-9 flex items-center justify-center hover:bg-orange-500 transition-colors">
                <Search size={24} className="text-primary stroke-[3px]" />
              </button>
            </div>
          </div>

          {/* Icons */}
          <div className="flex items-center gap-7">
            {/* Compare */}
            <div className="relative cursor-pointer group">
              <RefreshCw size={26} className="text-white group-hover:text-secondary transition-colors stroke-[2px]" />
              <div className="absolute -top-2 -right-2 bg-secondary text-primary text-[10px] font-black w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-primary">0</div>
            </div>

            {/* Heart */}
            <div className="relative cursor-pointer group">
              <Heart size={26} className="text-white group-hover:text-secondary transition-colors stroke-[2px]" />
              <div className="absolute -top-2 -right-2 bg-secondary text-primary text-[10px] font-black w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-primary">0</div>
            </div>

            {/* Cart/Bag */}
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <ShoppingBag size={26} className="text-white group-hover:text-secondary transition-colors stroke-[2px]" />
                <div className="absolute -top-2 -right-2 bg-secondary text-primary text-[10px] font-black w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-primary">0</div>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[10px] font-bold text-gray-400 mb-0.5">Total</span>
                <span className="text-sm font-black text-white">$0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
