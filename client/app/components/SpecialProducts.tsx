"use client";

import React from "react";
import Image from "next/image";
import { Star, ShoppingCart, Eye, Heart, MoveRight } from "lucide-react";

const products = [
    { id: 1, name: "DigitalX X-F360BT 2.1 Sound Speaker", price: 20, rating: 5, reviews: 12, img: "/logo.png" },
    { id: 2, name: "Apple iPhone 8 pro max with 4 GB", price: 10, rating: 5, reviews: 24, img: "/hero.png" },
    { id: 3, name: "SanDisk SSD Plus 240GB 2.5\" SATA III SSD", price: 40, rating: 5, reviews: 14, img: "/laptop.png" },
    { id: 4, name: "Beats EP On-Ear Wired Headphone", price: 50, rating: 5, reviews: 12, img: "/hero.png" },
];

export default function SpecialProducts() {
    const filters = [
        { title: "Smart Watch", items: [{ name: "Apple", price: 12 }, { name: "Samsung", price: 34 }, { name: "Realme", price: 13 }, { name: "Xiaomi", price: 8 }] },
        { title: "Headphones", items: [{ name: "Apple", price: 12 }, { name: "Samsung", price: 34 }, { name: "Realme", price: 13 }] },
        { title: "Status", items: [{ name: "Stock in", price: 12 }, { name: "Pre Order", price: 34 }, { name: "Upcoming", price: 13 }] },
    ];

    return (
        <section className="py-16 bg-white">
            <div className="container-custom">
                <div className="grid grid-cols-12 gap-8">
                    {/* Sidebar Filters */}
                    <div className="col-span-3 space-y-8">
                        {filters.map((filter, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-xl p-6">
                                <h3 className="text-base font-bold text-primary mb-4 border-b border-gray-200 pb-2">{filter.title}</h3>
                                <ul className="space-y-3">
                                    {filter.items.map((item, i) => (
                                        <li key={i} className="flex justify-between items-center text-sm text-text-muted hover:text-accent cursor-pointer transition-colors">
                                            <span>{item.name}</span>
                                            <span className="text-xs">(${item.price})</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* Main Content */}
                    <div className="col-span-9">
                        {/* Banner */}
                        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-10 h-64 mb-10 overflow-hidden flex items-center">
                            <div className="relative z-10 text-white">
                                <span className="text-sm font-medium opacity-80">Save 30% On Phone</span>
                                <h2 className="text-4xl font-black mt-2 mb-6">Buy Latest Smart phone</h2>
                                <button className="bg-secondary text-primary px-8 py-3 rounded-md font-bold hover:bg-orange-500">Shop Now</button>
                            </div>
                            <div className="absolute top-[-10%] right-[-5%] w-1/2 h-[120%] rotate-[-15deg]">
                                <Image src="/hero.png" alt="Phone banner" fill style={{ objectFit: 'contain' }} className="scale-110" />
                            </div>
                        </div>

                        {/* Grid Header */}
                        <div className="flex justify-between items-end mb-10 border-b-2 border-gray-100">
                            <div className="relative">
                                <h2 className="text-2xl font-black text-primary pb-4">Special Products</h2>
                                <div className="absolute bottom-[-2px] left-0 w-16 h-1 bg-secondary"></div>
                            </div>
                            <div className="pb-4">
                                <button className="text-sm font-bold flex items-center gap-1 text-text-muted hover:text-accent">
                                    See All <MoveRight size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Product Grid */}
                        <div className="grid grid-cols-4 gap-6">
                            {products.map((product) => (
                                <div key={product.id} className="bg-white border border-gray-100 rounded-xl p-4 group hover:shadow-xl transition-all">
                                    <div className="relative h-40 mb-4 overflow-hidden rounded-lg">
                                        <Image src={product.img} alt={product.name} fill style={{ objectFit: 'contain' }} className="group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-bold text-accent min-h-10 line-clamp-2">{product.name}</h3>
                                        <div className="flex items-center gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={10} fill="#ffb400" stroke="none" />
                                            ))}
                                            <span className="text-[10px] text-text-muted">({product.reviews})</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-secondary font-black text-base">${product.price}.00</span>
                                            <button className="text-primary hover:text-accent"><ShoppingCart size={18} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
