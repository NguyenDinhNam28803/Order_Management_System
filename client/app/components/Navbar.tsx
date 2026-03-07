"use client";

import React from "react";
import { Menu, ChevronDown, PhoneCall } from "lucide-react";

export default function Navbar() {
    const menuItems = ["Home", "Shop", "About", "Contact", "Blog", "Pages"];

    return (
        <nav className="bg-primary text-white border-t border-white/5">
            <div className="container-custom flex items-center justify-between">
                <div className="flex items-center h-full">
                    {/* Categories Button */}
                    <div className="bg-secondary text-primary px-8 py-4 flex items-center gap-4 font-bold cursor-pointer hover:bg-orange-500 transition-all self-stretch">
                        <Menu size={20} />
                        <span>All Categories</span>
                        <ChevronDown size={14} />
                    </div>

                    {/* Navigation Links */}
                    <div className="flex ml-10 gap-8 h-full">
                        {menuItems.map((item, index) => (
                            <div
                                key={item}
                                className={`flex items-center gap-1 text-sm font-bold hover:text-secondary cursor-pointer transition-all relative py-4 ${index === 0 ? 'text-secondary after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-secondary' : ''}`}
                            >
                                {item}
                                {(item === "Home" || item === "Shop" || item === "Blog" || item === "Pages") && <ChevronDown size={12} />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side - Phone Support */}
                <div className="flex items-center gap-4 py-4">
                    <div className="bg-secondary/10 p-2 rounded-full">
                        <PhoneCall size={20} className="text-secondary" />
                    </div>
                    <div className="flex flex-col leading-tight">
                        <span className="text-[10px] text-gray-400 font-medium">Need Help? Call us:</span>
                        <span className="text-sm font-black text-secondary">+84 2500 888 33</span>
                    </div>
                </div>
            </div>
        </nav>
    );
}
