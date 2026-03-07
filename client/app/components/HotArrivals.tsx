"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Star, ShoppingCart, Eye, Heart, MoveRight } from "lucide-react";

const products = [
    { id: 1, name: "Apple Watch Series 6 A2292 (M00D3)", price: 20, rating: 5, reviews: 11, img: "/watch.png" },
    { id: 2, name: "Sony SRS-XG500 X-Series Wireless Speaker", price: 25, rating: 5, reviews: 15, img: "/logo.png" },
    { id: 3, name: "Apple MacBook Air 13.3-Inch 10th Gen", price: 33, rating: 5, reviews: 16, img: "/laptop.png" },
    { id: 4, name: "Hoco BS45 Portable True Wireless Speaker", price: 36, rating: 5, reviews: 13, img: "/logo.png" },
    { id: 5, name: "Apex Android phone (2016) 5G", price: 12, rating: 5, reviews: 17, img: "/hero.png" },
    { id: 6, name: "Huawei Watch GT 2 Smart Watch", price: 67, rating: 5, reviews: 15, img: "/watch.png" },
];

export default function HotArrivals() {
    const [activeTab, setActiveTab] = useState("Trending");
    const tabs = ["Trending", "Best Selling", "Hot Selling", "See All"];

    return (
        <section className="py-16 bg-white">
            <div className="container-custom">
                {/* Section Header */}
                <div className="flex justify-between items-end mb-10 border-b-2 border-gray-100">
                    <div className="relative">
                        <h2 className="text-2xl font-black text-primary pb-4">Hot New Arrivals</h2>
                        <div className="absolute bottom-[-2px] left-0 w-16 h-1 bg-secondary"></div>
                    </div>
                    <div className="flex gap-8 pb-4">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`text-sm font-bold flex items-center gap-1 transition-all ${activeTab === tab ? "text-accent" : "text-text-muted hover:text-primary"
                                    }`}
                            >
                                {tab}
                                {tab === "See All" && <MoveRight size={14} />}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-8">
                    {/* Left Large Banner */}
                    <div className="col-span-4 bg-gray-50 rounded-xl p-10 flex flex-col items-center text-center relative overflow-hidden h-full min-h-[600px]">
                        <span className="text-accent font-bold text-sm mb-4">Apple watch</span>
                        <h2 className="text-3xl font-black text-primary leading-snug mb-8">
                            <span className="text-secondary">Watches</span> out for your heart health.
                        </h2>
                        <button className="bg-accent text-white px-8 py-3 rounded-full font-bold mb-10 z-10">Shop now</button>
                        <div className="relative w-full h-[350px] z-0">
                            <Image src="/watch.png" alt="Apple watch" fill style={{ objectFit: 'contain' }} className="scale-125" />
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="col-span-8 grid grid-cols-3 gap-6">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

function ProductCard({ product }: { product: any }) {
    return (
        <div className="bg-white border border-gray-100 rounded-xl p-4 group hover:shadow-xl transition-all relative">
            <div className="relative h-48 mb-4 overflow-hidden rounded-lg">
                <Image src={product.img} alt={product.name} fill style={{ objectFit: 'contain' }} className="group-hover:scale-110 transition-transform duration-500" />

                {/* Hover Actions */}
                <div className="absolute top-2 -right-12 group-hover:right-2 transition-all flex flex-col gap-2">
                    <button className="bg-white p-2 rounded-full shadow-md text-text-muted hover:bg-accent hover:text-white"><Eye size={18} /></button>
                    <button className="bg-white p-2 rounded-full shadow-md text-text-muted hover:bg-accent hover:text-white"><Heart size={18} /></button>
                </div>
            </div>

            <div className="space-y-2">
                <h3 className="text-xs font-bold text-accent min-h-10 line-clamp-2 cursor-pointer hover:underline">
                    {product.name}
                </h3>
                <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} size={10} fill="#ffb400" stroke="none" />
                    ))}
                    <span className="text-[10px] text-text-muted">({product.reviews})</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                    <span className="text-secondary font-black text-lg">${product.price}.00</span>
                    <button className="bg-gray-100 p-2 rounded-lg text-primary hover:bg-accent hover:text-white transition-colors">
                        <ShoppingCart size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
