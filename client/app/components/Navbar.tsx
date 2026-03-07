"use client";

import React from "react";
import Link from "next/link";
import { Menu, ChevronDown, PhoneCall, Laptop, Tv, Headphones, Smartphone, Camera, Watch, Gamepad, Star, Tag, Zap, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const menuItems = ["Home", "Shop", "About", "Contact", "Blog", "Pages"];

    const categories = [
        { name: "Computer & Laptop", icon: Laptop },
        { name: "Television & Video", icon: Tv },
        { name: "Headphones", icon: Headphones },
        { name: "Smartphones", icon: Smartphone },
        { name: "Camera & Photos", icon: Camera },
        { name: "Smart Watch", icon: Watch },
        { name: "Video Games", icon: Gamepad },
        { name: "Best Seller", icon: Star },
        { name: "Special Discount", icon: Tag },
        { name: "New Arrivals", icon: Zap },
    ];

    return (
        <nav className="bg-primary text-white border-t border-white/5 relative z-[60]">
            <div className="container-custom flex items-center justify-between">
                <div className="flex items-center h-full">
                    {/* Categories Button */}
                    <div className="relative">
                        <div
                            onClick={() => setIsOpen(!isOpen)}
                            className="bg-secondary text-primary px-8 py-4 flex items-center gap-4 font-bold cursor-pointer hover:bg-orange-500 transition-all self-stretch"
                        >
                            <Menu size={20} />
                            <span>All Categories</span>
                            <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                        </div>

                        {/* Dropdown Menu */}
                        {isOpen && (
                            <div className="absolute top-full left-0 w-64 bg-white border border-gray-100 rounded-b-lg overflow-hidden shadow-xl z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                                <ul className="flex flex-col">
                                    {categories.map((cat, idx) => (
                                        <li
                                            key={cat.name}
                                            className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0 text-primary group"
                                        >
                                            <div className="flex items-center gap-3 text-text-muted group-hover:text-primary transition-colors">
                                                <cat.icon size={18} />
                                                <span className="text-sm font-medium">{cat.name}</span>
                                            </div>
                                            {(idx < 2) && <ChevronRight size={14} className="text-gray-400 group-hover:translate-x-1 transition-transform" />}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Navigation Links */}
                    <div className="flex ml-10 gap-8 h-full">
                        {menuItems.map((item, index) => (
                            <Link
                                key={item}
                                href={item === "Shop" ? "/shop" : item === "Home" ? "/" : "#"}
                                className={`flex items-center gap-1 text-sm font-bold hover:text-secondary cursor-pointer transition-all relative py-4 ${index === 0 ? 'text-secondary after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-secondary' : ''}`}
                            >
                                {item}
                                {(item === "Home" || item === "Shop" || item === "Blog" || item === "Pages") && <ChevronDown size={12} />}
                            </Link>
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
