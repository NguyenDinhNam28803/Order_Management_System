"use client";

import React from "react";
import Image from "next/image";
import { MoveRight } from "lucide-react";

const featureCategories = [
    {
        title: "Desktop",
        items: ["Brand PC", "Desktop Parts", "Apple imac", "Apple mac studio"],
        img: "/laptop.png", // Use laptop as generic tech image
        link: "See All Desktop"
    },
    {
        title: "Laptop",
        items: ["All Laptop", "Laptop accessories", "Apple Macbook", "Gaming Laptop"],
        img: "/laptop.png",
        link: "See All Laptop"
    },
    {
        title: "Gadget",
        items: ["Smart Watch", "Ear Phone", "Power Bank", "Drones"],
        img: "/watch.png",
        link: "See All Gadget"
    }
];

export default function Features() {
    return (
        <section className="py-10 bg-white">
            <div className="container-custom grid grid-cols-3 gap-6">
                {featureCategories.map((cat, idx) => (
                    <div key={idx} className="bg-white border border-gray-100 rounded-xl p-8 flex justify-between shadow-sm hover:border-accent transition-colors">
                        <div>
                            <h3 className="text-xl font-bold text-primary mb-6">{cat.title}</h3>
                            <ul className="space-y-3 mb-8">
                                {cat.items.map((item, i) => (
                                    <li key={i} className="text-sm text-text-muted hover:text-accent cursor-pointer transition-colors">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <div className="flex items-center gap-2 text-accent font-bold text-xs cursor-pointer group">
                                {cat.link}
                                <MoveRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                        <div className="relative w-40 h-40">
                            <Image
                                src={cat.img}
                                alt={cat.title}
                                fill
                                style={{ objectFit: 'contain' }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
