"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Star, ShoppingCart, Eye, Heart, MoveRight } from "lucide-react";

const initialProducts = [
    { id: 1, name: "DigitalX X-F360BT 2.1 Sound Speaker", price: 20, rating: 5, reviews: 12, img: "/logo.png", category: "Headphones", brand: "DigitalX" },
    { id: 2, name: "Apple iPhone 8 pro max with 4 GB", price: 10, rating: 5, reviews: 24, img: "/hero.png", category: "Smartphones", brand: "Apple" },
    { id: 3, name: "SanDisk SSD Plus 240GB 2.5\" SATA III SSD", price: 40, rating: 5, reviews: 14, img: "/laptop.png", category: "Computer & Laptop", brand: "SanDisk" },
    { id: 4, name: "Beats EP On-Ear Wired Headphone", price: 50, rating: 5, reviews: 12, img: "/hero.png", category: "Headphones", brand: "Beats" },
    { id: 5, name: "Apple Watch Series 6", price: 25, rating: 5, reviews: 16, img: "/watch.png", category: "Smart Watch", brand: "Apple" },
    { id: 6, name: "Samsung Galaxy Watch 4", price: 34, rating: 5, reviews: 10, img: "/watch.png", category: "Smart Watch", brand: "Samsung" },
    { id: 7, name: "Realme Watch 2 Pro", price: 13, rating: 5, reviews: 8, img: "/watch.png", category: "Smart Watch", brand: "Realme" },
    { id: 8, name: "Xiaomi Mi Watch", price: 8, rating: 5, reviews: 20, img: "/watch.png", category: "Smart Watch", brand: "Xiaomi" },
];

const bannerSlides = [
    {
        tag: "Save 30% On Phone",
        title: "Buy Latest Smart phone",
        btnText: "Shop Now",
        img: "/hero.png",
        gradient: "from-blue-600 to-purple-600"
    },
    {
        tag: "Limited Offer",
        title: "Next Gen Laptops",
        btnText: "Explore Now",
        img: "/laptop.png",
        gradient: "from-orange-500 to-red-600"
    },
    {
        tag: "Hot Deal",
        title: "Premium Sound Gear",
        btnText: "Buy Now",
        img: "/logo.png",
        gradient: "from-emerald-500 to-teal-700"
    }
];

export default function SpecialProducts() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [activeFilter, setActiveFilter] = useState<string | null>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const filterOptions = [
        { title: "Smart Watch", items: ["Apple", "Samsung", "Realme", "Xiaomi"] },
        { title: "Headphones", items: ["DigitalX", "Beats", "Sony"] },
        { title: "Other", items: ["Computer & Laptop", "Smartphones"] },
    ];

    const filteredProducts = useMemo(() => {
        if (!activeFilter) return initialProducts;
        return initialProducts.filter(p => p.brand === activeFilter || p.category === activeFilter);
    }, [activeFilter]);

    return (
        <section className="py-16 bg-white">
            <div className="container-custom">
                <div className="grid grid-cols-12 gap-8">
                    {/* Sidebar Filters */}
                    <div className="col-span-3 space-y-8">
                        <div className="bg-primary text-white p-6 rounded-t-xl">
                            <h3 className="text-lg font-bold">Filters</h3>
                            <button
                                onClick={() => setActiveFilter(null)}
                                className="text-xs text-secondary hover:underline mt-2"
                            >
                                Clear All
                            </button>
                        </div>
                        {filterOptions.map((filter, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-b-xl p-6 border-t-0 border border-gray-100">
                                <h3 className="text-base font-bold text-primary mb-4 border-b border-gray-200 pb-2">{filter.title}</h3>
                                <ul className="space-y-3">
                                    {filter.items.map((item, i) => (
                                        <li
                                            key={i}
                                            onClick={() => setActiveFilter(item)}
                                            className={`flex justify-between items-center text-sm cursor-pointer transition-colors group ${activeFilter === item ? "text-secondary font-bold" : "text-text-muted hover:text-accent"}`}
                                        >
                                            <span className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full border ${activeFilter === item ? "bg-secondary border-secondary" : "border-gray-300 group-hover:border-accent"}`}></div>
                                                {item}
                                            </span>
                                            <span className="text-xs opacity-60">
                                                ({initialProducts.filter(p => p.brand === item || p.category === item).length})
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* Main Content */}
                    <div className="col-span-9">
                        {/* Banner Slider */}
                        <div className="relative h-64 mb-10 overflow-hidden rounded-2xl group border-4 border-white shadow-lg">
                            {bannerSlides.map((slide, index) => (
                                <div
                                    key={index}
                                    className={`absolute inset-0 transition-all duration-1000 ease-in-out bg-gradient-to-r ${slide.gradient} p-10 flex items-center ${index === currentSlide ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
                                        }`}
                                >
                                    <div className={`relative z-10 text-white transition-all duration-700 delay-300 ${index === currentSlide ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
                                        <span className="text-sm font-medium opacity-80 uppercase tracking-widest">{slide.tag}</span>
                                        <h2 className="text-5xl font-black mt-2 mb-6 leading-tight">{slide.title}</h2>
                                        <button className="bg-secondary text-primary px-10 py-3.5 rounded-full font-bold hover:bg-orange-500 hover:scale-105 transition-all shadow-lg active:scale-95">{slide.btnText}</button>
                                    </div>
                                    <div className={`absolute top-[-10%] right-[-5%] w-1/2 h-[120%] transition-all duration-1000 delay-200 ${index === currentSlide ? "scale-110 opacity-100 rotate-[-15deg]" : "scale-50 opacity-0 rotate-0"}`}>
                                        <Image src={slide.img} alt={slide.title} fill style={{ objectFit: 'contain' }} />
                                    </div>
                                </div>
                            ))}

                            {/* Dots */}
                            <div className="absolute bottom-5 left-10 flex gap-2 z-20">
                                {bannerSlides.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentSlide(i)}
                                        className={`h-1.5 transition-all duration-300 rounded-full ${i === currentSlide ? "w-8 bg-white" : "w-1.5 bg-white/40"}`}
                                    ></button>
                                ))}
                            </div>
                        </div>

                        {/* Grid Header */}
                        <div className="flex justify-between items-end mb-10 border-b-2 border-gray-100">
                            <div className="relative">
                                <h2 className="text-2xl font-black text-primary pb-4">Special Products {activeFilter && <span className="text-secondary text-sm font-medium ml-2">/ {activeFilter}</span>}</h2>
                                <div className="absolute bottom-[-2px] left-0 w-16 h-1 bg-secondary"></div>
                            </div>
                            <div className="pb-4">
                                <button className="text-sm font-bold flex items-center gap-1 text-text-muted hover:text-accent">
                                    See All <MoveRight size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Product Grid */}
                        {filteredProducts.length > 0 ? (
                            <div className="grid grid-cols-4 gap-6">
                                {filteredProducts.map((product) => (
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
                                                <button className="text-primary hover:text-accent transition-transform active:scale-90"><ShoppingCart size={18} /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <p className="text-gray-500 font-medium">No products found in this category.</p>
                                <button onClick={() => setActiveFilter(null)} className="text-secondary font-bold hover:underline mt-2">View All Products</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
