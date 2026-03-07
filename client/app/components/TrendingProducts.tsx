"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { Star, MoveRight, Check } from "lucide-react";

const sidebarData = {
    categories: [
        { name: "Computer & Laptop", count: 12 },
        { name: "Television & Video", count: 34 },
        { name: "Headphones", count: 13 },
        { name: "Smartphones", count: "09" },
        { name: "Camera & Photos", count: 12 },
        { name: "Smart Watches", count: 32 },
        { name: "Video Games", count: 21 },
    ],
    prices: [
        { label: "$0 - $100", min: 0, max: 100 },
        { label: "$100 - $500", min: 100, max: 500 },
        { label: "$500 - $1000", min: 500, max: 1000 },
        { label: "$1000 - $5000", min: 1000, max: 5000 },
    ],
    ratings: [
        { stars: 1, count: "08" },
        { stars: 2, count: "02" },
        { stars: 3, count: "04" },
        { stars: 4, count: "32" },
        { stars: 5, count: 18 },
    ],
    status: [
        { label: "Stock in" },
        { label: "Pre Order" },
    ]
};

const trendingProductsData = [
    { id: 1, name: "Apple Watch Series 6 A2292 (M00D3)", price: 20, rating: 5, reviews: 11, img: "/watch.png", category: "Smart Watches", brand: "Apple" },
    { id: 2, name: "Sony SRS-XG500 X-Series Wireless Speaker", price: 25, rating: 5, reviews: 16, img: "/logo.png", category: "Headphones", brand: "Sony" },
    { id: 3, name: "Apple MacBook Air 13.3-Inch 10th Gen", price: 33, rating: 5, reviews: 12, img: "/laptop.png", category: "Computer & Laptop", brand: "Apple" },
    { id: 4, name: "Hoco BS45 Portable True Wireless Speaker", price: 36, rating: 5, reviews: 17, img: "/logo.png", category: "Headphones", brand: "Hoco" },
    { id: 5, name: "Apex Android phone (2016) 5G", price: 12, rating: 5, reviews: 17, img: "/hero.png", category: "Smartphones", brand: "Apex" },
    { id: 6, name: "Huawei Watch GT 2 Smart Watch", price: 67, rating: 5, reviews: 15, img: "/watch.png", category: "Smart Watches", brand: "Huawei" },
    { id: 7, name: "Nikon D850 DSLR Camera", price: 85, rating: 5, reviews: 10, img: "/logo.png", category: "Camera & Photos", brand: "Nikon" },
    { id: 8, name: "Gaming Chair Premium Edition", price: 45, rating: 5, reviews: 22, img: "/hero.png", category: "Video Games", brand: "Gaming" },
];

export default function TrendingProducts() {
    const [activeTab, setActiveTab] = useState("New Products");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
    const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<string[]>([]);

    const tabs = ["New Products", "Featured", "Best Seller", "See All"];

    const toggleItem = (list: any[], setList: Function, item: any) => {
        setList(prev =>
            prev.includes(item)
                ? prev.filter(i => i !== item)
                : [...prev, item]
        );
    };

    const filteredProducts = useMemo(() => {
        return trendingProductsData.filter(product => {
            const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category);

            const matchesPrice = selectedPriceRanges.length === 0 || selectedPriceRanges.some(rangeLabel => {
                const range = sidebarData.prices.find(p => p.label === rangeLabel);
                return range && product.price >= range.min && product.price <= range.max;
            });

            const matchesRating = selectedRatings.length === 0 || selectedRatings.includes(product.rating);

            // For status, this is just a mockup filter
            const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes("Stock in");

            return matchesCategory && matchesPrice && matchesRating && matchesStatus;
        });
    }, [selectedCategories, selectedPriceRanges, selectedRatings, selectedStatus]);

    return (
        <section className="py-16 bg-white">
            <div className="container-custom">
                {/* Section Header */}
                <div className="flex justify-between items-end mb-10 border-b border-gray-100">
                    <div className="relative">
                        <h2 className="text-2xl font-black text-primary pb-5">Trending Products</h2>
                        <div className="absolute bottom-[-1px] left-0 w-16 h-[3px] bg-secondary"></div>
                    </div>
                    <div className="flex gap-10 pb-5">
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
                    {/* Left Sidebar */}
                    <div className="col-span-3 bg-[#fbfbfb] rounded-xl p-8 h-fit shadow-sm border border-gray-50">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-primary">Filters</h3>
                            <button
                                onClick={() => {
                                    setSelectedCategories([]);
                                    setSelectedPriceRanges([]);
                                    setSelectedRatings([]);
                                    setSelectedStatus([]);
                                }}
                                className="text-xs text-secondary font-bold hover:underline"
                            >
                                Reset
                            </button>
                        </div>

                        <SidebarSection title="Categories">
                            {sidebarData.categories.map((item, i) => (
                                <SidebarItem
                                    key={i}
                                    label={item.name}
                                    count={item.count}
                                    checked={selectedCategories.includes(item.name)}
                                    onChange={() => toggleItem(selectedCategories, setSelectedCategories, item.name)}
                                />
                            ))}
                        </SidebarSection>

                        <SidebarSection title="Prices">
                            {sidebarData.prices.map((item, i) => (
                                <SidebarItem
                                    key={i}
                                    label={item.label}
                                    checked={selectedPriceRanges.includes(item.label)}
                                    onChange={() => toggleItem(selectedPriceRanges, setSelectedPriceRanges, item.label)}
                                />
                            ))}
                        </SidebarSection>

                        <SidebarSection title="Rating">
                            {sidebarData.ratings.map((item, i) => (
                                <SidebarItem
                                    key={i}
                                    rating={item.stars}
                                    count={item.count}
                                    checked={selectedRatings.includes(item.stars)}
                                    onChange={() => toggleItem(selectedRatings, setSelectedRatings, item.stars)}
                                />
                            ))}
                        </SidebarSection>

                        <SidebarSection title="Status">
                            {sidebarData.status.map((item, i) => (
                                <SidebarItem
                                    key={i}
                                    label={item.label}
                                    checked={selectedStatus.includes(item.label)}
                                    onChange={() => toggleItem(selectedStatus, setSelectedStatus, item.label)}
                                />
                            ))}
                        </SidebarSection>
                    </div>

                    {/* Product Grid */}
                    <div className="col-span-9">
                        {filteredProducts.length > 0 ? (
                            <div className="grid grid-cols-4 gap-x-6 gap-y-10">
                                {filteredProducts.map((product) => (
                                    <div key={product.id} className="flex flex-col group h-full">
                                        <div className="relative aspect-square mb-6 bg-[#f4f4f4] rounded-lg overflow-hidden flex items-center justify-center p-8 transition-all group-hover:shadow-md">
                                            <Image
                                                src={product.img}
                                                alt={product.name}
                                                fill
                                                style={{ objectFit: 'contain' }}
                                                className="p-8 group-hover:scale-110 transition-transform duration-500"
                                            />
                                            <div className="absolute top-4 right-[-50px] group-hover:right-4 transition-all duration-300 flex flex-col gap-2">
                                                <div className="bg-white p-2 rounded-full shadow-sm hover:bg-secondary hover:text-primary cursor-pointer transition-colors"><Star size={16} /></div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col flex-grow text-center">
                                            <h3 className="text-[13px] font-bold text-accent mb-2 min-h-[40px] line-clamp-2 cursor-pointer hover:text-primary transition-colors">
                                                {product.name}
                                            </h3>
                                            <div className="flex items-center justify-center gap-1 mb-2">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={11} fill={i < product.rating ? "#ffb400" : "none"} stroke={i < product.rating ? "none" : "#ddd"} />
                                                ))}
                                                <span className="text-[11px] text-text-muted">( {product.reviews} reviews)</span>
                                            </div>
                                            <span className="text-secondary font-black text-lg mt-auto">${product.price.toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <p className="text-gray-500 font-bold mb-4">No product matches your filter criteria.</p>
                                <button
                                    onClick={() => {
                                        setSelectedCategories([]);
                                        setSelectedPriceRanges([]);
                                        setSelectedRatings([]);
                                        setSelectedStatus([]);
                                    }}
                                    className="text-secondary font-black hover:underline"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

function SidebarSection({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="mb-10 last:mb-0">
            <h3 className="text-lg font-black text-primary mb-6">{title}</h3>
            <ul className="space-y-4">
                {children}
            </ul>
        </div>
    );
}

function SidebarItem({ label, count, rating, checked, onChange }: { label?: string, count?: any, rating?: number, checked?: boolean, onChange?: () => void }) {
    return (
        <li
            className="flex items-center gap-3 cursor-pointer group"
            onClick={onChange}
        >
            <div className={`w-5 h-5 border-[2px] flex-shrink-0 rounded-[2px] flex items-center justify-center transition-all ${checked ? "bg-secondary border-secondary" : "border-secondary/30 group-hover:border-secondary"}`}>
                {checked && <Check size={14} className="text-primary font-black" />}
            </div>
            <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-1">
                    {rating ? (
                        <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={13} fill={i < rating ? "#ffb400" : "none"} stroke={i < rating ? "none" : "#ccc"} />
                            ))}
                        </div>
                    ) : (
                        <span className={`text-sm font-medium transition-colors ${checked ? "text-primary font-bold" : "text-text-muted group-hover:text-primary"}`}>{label}</span>
                    )}
                </div>
                {count !== undefined && (
                    <span className={`text-sm font-medium transition-colors ${checked ? "text-primary font-bold" : "text-text-muted group-hover:text-primary"}`}>
                        {rating ? `(${count} Reviews)` : `(${count})`}
                    </span>
                )}
            </div>
        </li>
    );
}
