"use client";

import React from "react";
import Image from "next/image";
import { ChevronRight, Laptop, Tv, Headphones, Smartphone, Camera, Watch, Gamepad, Star, Tag, Zap } from "lucide-react";

export default function Hero() {
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
        <section className="bg-gray-50 py-10">
            <div className="container-custom grid grid-cols-12 gap-6">
                {/* Left Sidebar */}
                <div className="col-span-3 bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm self-start">
                    <ul className="flex flex-col">
                        {categories.map((cat, idx) => (
                            <li
                                key={cat.name}
                                className={`flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0`}
                            >
                                <div className="flex items-center gap-3 text-text-muted">
                                    <cat.icon size={18} />
                                    <span className="text-sm font-medium">{cat.name}</span>
                                </div>
                                {(idx < 2) && <ChevronRight size={14} className="text-gray-400" />}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Main Hero Slider */}
                <div className="col-span-6 relative bg-blue-50 rounded-lg overflow-hidden min-h-[500px] flex items-center group">
                    <div className="absolute inset-0 z-0">
                        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_50%,#cbdcfc,transparent_60%)]"></div>
                        <Image src="/hero.png" alt="Headphone Model" fill style={{ objectFit: 'contain', objectPosition: 'right' }} className="mt-10" />
                    </div>

                    <div className="relative z-10 px-12 max-w-md">
                        <h4 className="text-primary font-bold text-lg mb-4">Top Monthly Seller</h4>
                        <h1 className="text-5xl font-black text-primary leading-tight mb-6">
                            Top Headphone <br />
                            <span className="text-primary opacity-80">HAVIT HV-H2178D 3.5</span>
                        </h1>
                        <p className="text-text-muted mb-8 line-clamp-2">
                            Lorem ipsum dolor sit amet consectetur. Ullamcorper enim sed morbi.
                        </p>
                        <button className="bg-accent text-white px-8 py-4 rounded-full font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-accent/40">
                            Shop Now
                        </button>
                    </div>

                    {/* Dots Indicator */}
                    <div className="absolute bottom-8 left-12 flex gap-2">
                        <div className="w-8 h-1 bg-accent rounded-full"></div>
                        <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
                        <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
                    </div>
                </div>

                {/* Right Banners */}
                <div className="col-span-3 flex flex-col gap-6">
                    <BannerCard
                        title="PS4 DualShock 4"
                        price="From $999"
                        tag="BIG SAVING"
                        img="/hero.png" // Using hero image as placeholder for more
                    />
                    <BannerCard
                        title="Homepod Mini"
                        price="From $999"
                        tag="NEW ARRIVAL"
                        img="/logo.png"
                    />
                    <BannerCard
                        title="Apple Ipad air 9"
                        price="From $999"
                        tag="15% OFF"
                        img="/laptop.png"
                    />
                </div>
            </div>
        </section>
    );
}

function BannerCard({ title, price, tag, img }: { title: string, price: string, tag: string, img: string }) {
    return (
        <div className="flex-1 bg-white border border-gray-100 rounded-lg p-5 flex justify-between items-center relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
            <div className="relative z-10 max-w-[50%]">
                <span className="text-[10px] font-bold text-accent uppercase">{tag}</span>
                <h3 className="text-base font-bold text-primary mt-1 mb-1">{title}</h3>
                <p className="text-xs text-text-muted mb-4">{price}</p>
                <button className="bg-accent text-white text-[10px] px-3 py-1.5 rounded-full font-bold">Shop Now</button>
            </div>
            <div className="absolute right-0 bottom-0 w-1/2 h-4/5">
                <Image src={img} alt={title} fill style={{ objectFit: 'contain' }} className="group-hover:scale-110 transition-transform duration-500" />
            </div>
        </div>
    );
}
