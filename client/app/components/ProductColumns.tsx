"use client";

import React from "react";
import Image from "next/image";
import { Star } from "lucide-react";

const columnContent = [
    {
        title: "Top Selling",
        products: [
            { name: "Apple MacBook Air 13.3-Inch 10th Gen", price: 33.00, reviews: 16, img: "/laptop.png" },
            { name: "Hoco BS45 Portable True Wireless Speaker", price: 36.00, reviews: 13, img: "/logo.png" },
            { name: "Apex Android phone (2016) 5G", price: 12.00, reviews: 17, img: "/hero.png" },
        ]
    },
    {
        title: "Trending Products",
        products: [
            { name: "Huawei Watch GT 2 Smart Watch", price: 67.00, reviews: 15, img: "/watch.png" },
            { name: "Apple iPhone 13 pro max with 8 GB", price: 34.00, reviews: 18, img: "/hero.png" },
            { name: "Corsair Force 480GB NVMe PCIe Gen3 M.2 SSD", price: 36.00, reviews: 35, img: "/laptop.png" },
        ]
    },
    {
        title: "Recently added",
        products: [
            { name: "Apple iPhone SE (2022) with 4 GB", price: 57.00, reviews: 16, img: "/hero.png" },
            { name: "Lenovo IdeaPad 3 Ryzen 7 14 FHD Laptop", price: 46.00, reviews: 11, img: "/laptop.png" },
            { name: "DigitalX X-F360BT 2.1 Sound Speaker", price: 20.00, reviews: 12, img: "/logo.png" },
        ]
    },
    {
        title: "Top Rated",
        products: [
            { name: "Apple iPhone 8 pro max with 4 GB", price: 10.00, reviews: 24, img: "/hero.png" },
            { name: "SanDisk SSD Plus 240GB 2.5\" SATA III SSD", price: 40.00, reviews: 14, img: "/laptop.png" },
            { name: "Beats EP On-Ear Wired Headphone", price: 50.00, reviews: 12, img: "/hero.png" },
        ]
    }
];

export default function ProductColumns() {
    return (
        <section className="py-16 bg-white border-t border-gray-100">
            <div className="container-custom grid grid-cols-4 gap-8">
                {columnContent.map((col, idx) => (
                    <div key={idx}>
                        <div className="relative mb-8">
                            <h2 className="text-xl font-black text-primary pb-3">{col.title}</h2>
                            <div className="absolute bottom-0 left-0 w-12 h-1 bg-secondary"></div>
                            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gray-100"></div>
                        </div>

                        <div className="space-y-6">
                            {col.products.map((product, i) => (
                                <div key={i} className="flex gap-4 group cursor-pointer">
                                    <div className="relative w-24 h-24 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100 p-2">
                                        <Image src={product.img} alt={product.name} fill style={{ objectFit: 'contain' }} className="group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div className="flex flex-col justify-center gap-1">
                                        <h3 className="text-xs font-bold text-accent line-clamp-2 leading-tight group-hover:underline">
                                            {product.name}
                                        </h3>
                                        <div className="flex items-center gap-1">
                                            {[...Array(5)].map((_, starIdx) => (
                                                <Star key={starIdx} size={8} fill="#ffb400" stroke="none" />
                                            ))}
                                            <span className="text-[10px] text-text-muted">({product.reviews})</span>
                                        </div>
                                        <span className="text-secondary font-black text-sm">${product.price.toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
