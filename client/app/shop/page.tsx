"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
// imports
import { Grid, List, ChevronDown, Star, ShoppingCart, Eye, Heart, LayoutGrid } from "lucide-react";

const categories = [
    "Computer & Laptop",
    "Television & Video",
    "Headphones",
    "Smartphones",
    "Camera & Photos",
    "Smart Watches",
    "Video Games"
];

const brands = [
    "Apple",
    "Samsung",
    "Realme",
    "Redmi",
    "Nokia",
    "One Plus",
    "Huawei"
];

const initialProducts = [
    {
        id: 1,
        name: "Apple Watch Series 6 A2292 (M0003)",
        price: 25.0,
        rating: 5,
        reviews: 16,
        img: "/watch.png",
        category: "Smart Watches",
        brand: "Apple"
    },
    {
        id: 2,
        name: "Sony SRS-XG500 X-Series Wireless Speaker",
        price: 125.0,
        rating: 5,
        reviews: 16,
        img: "/logo.png",
        category: "Headphones",
        brand: "Sony"
    },
    {
        id: 3,
        name: "Apple MacBook Air 13.3-Inch 10th Gen",
        price: 933.0,
        rating: 5,
        reviews: 12,
        img: "/laptop.png",
        category: "Computer & Laptop",
        brand: "Apple"
    },
    {
        id: 4,
        name: "Hoco BS45 Portable True Wireless Speaker",
        price: 36.0,
        rating: 5,
        reviews: 17,
        img: "/logo.png",
        category: "Headphones",
        brand: "Hoco"
    },
    {
        id: 5,
        name: "Samsung Galaxy Watch 4",
        price: 199.0,
        rating: 5,
        reviews: 22,
        img: "/watch.png",
        category: "Smart Watches",
        brand: "Samsung"
    },
    {
        id: 6,
        name: "Sony Noise Canceling Headphones",
        price: 299.0,
        rating: 5,
        reviews: 45,
        img: "/logo.png",
        category: "Headphones",
        brand: "Sony"
    },
    {
        id: 7,
        name: "Dell XPS 13 Laptop",
        price: 899.0,
        rating: 5,
        reviews: 30,
        img: "/laptop.png",
        category: "Computer & Laptop",
        brand: "Dell"
    },
    {
        id: 8,
        name: "Apple iPhone 13 Pro",
        price: 999.0,
        rating: 5,
        reviews: 120,
        img: "/hero.png",
        category: "Smartphones",
        brand: "Apple"
    }
];

export default function ShopPage() {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [priceRange, setPriceRange] = useState(1000);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

    const toggleCategory = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const toggleBrand = (brand: string) => {
        setSelectedBrands(prev =>
            prev.includes(brand)
                ? prev.filter(b => b !== brand)
                : [...prev, brand]
        );
    };

    const filteredProducts = useMemo(() => {
        return initialProducts.filter(product => {
            const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category);
            const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
            const matchesPrice = product.price <= priceRange;
            return matchesCategory && matchesBrand && matchesPrice;
        });
    }, [selectedCategories, selectedBrands, priceRange]);

    return (
        <main className="min-h-screen bg-white">
            {/* Breadcrumbs */}
            <div className="bg-gray-50 py-10">
                <div className="container-custom">
                    <div className="flex items-center gap-2 text-sm">
                        <Link href="/" className="text-gray-500 hover:text-secondary transition-colors">Home</Link>
                        <span className="text-gray-400">&gt;</span>
                        <span className="text-gray-900 font-medium">Shop</span>
                    </div>
                </div>
            </div>

            <div className="py-16">
                <div className="container-custom">
                    <div className="grid grid-cols-12 gap-8">
                        {/* Sidebar */}
                        <aside className="col-span-3 space-y-10">
                            {/* Categories */}
                            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                                    <h3 className="font-bold text-primary">Categories</h3>
                                </div>
                                <div className="p-6 space-y-3">
                                    {categories.map((cat) => (
                                        <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={selectedCategories.includes(cat)}
                                                onChange={() => toggleCategory(cat)}
                                                className="w-4 h-4 rounded border-gray-300 text-secondary focus:ring-secondary cursor-pointer"
                                            />
                                            <span className={`text-sm transition-colors ${selectedCategories.includes(cat) ? "text-secondary font-bold" : "text-gray-600 group-hover:text-primary"}`}>{cat}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Brands */}
                            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                                    <h3 className="font-bold text-primary">Brands</h3>
                                </div>
                                <div className="p-6 space-y-3">
                                    {brands.map((brand) => (
                                        <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={selectedBrands.includes(brand)}
                                                onChange={() => toggleBrand(brand)}
                                                className="w-4 h-4 rounded border-gray-300 text-secondary focus:ring-secondary cursor-pointer"
                                            />
                                            <span className={`text-sm transition-colors ${selectedBrands.includes(brand) ? "text-secondary font-bold" : "text-gray-600 group-hover:text-primary"}`}>{brand}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Filter by Price */}
                            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                                    <h3 className="font-bold text-primary">Filter by Price</h3>
                                </div>
                                <div className="p-6">
                                    <input
                                        type="range"
                                        min="0"
                                        max="1000"
                                        value={priceRange}
                                        onChange={(e) => setPriceRange(parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary mb-6"
                                    />
                                    <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                                        <span>Min: $0</span>
                                        <span>Max: ${priceRange}</span>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Main Content */}
                        <div className="col-span-9">
                            {/* Shop Banner */}
                            <div className="relative h-62.5 rounded-2xl overflow-hidden mb-10 bg-[#000e28]">
                                <Image src="/laptop.png" alt="Shop Banner" fill style={{ objectFit: 'cover' }} className="opacity-60" />
                                <div className="absolute inset-0 bg-linear-to-r from-black/60 to-transparent flex flex-col justify-center px-12">
                                    <span className="text-secondary font-bold text-sm uppercase tracking-widest mb-2">Up To 30% Offer</span>
                                    <h2 className="text-4xl font-black text-white leading-tight">New Accessories <br />Collection</h2>
                                    <div className="flex gap-2 mt-6">
                                        <div className="w-8 h-1.5 bg-secondary rounded-full"></div>
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Toolbar */}
                            <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-100">
                                <div className="text-sm text-gray-500">
                                    Showing <span className="font-bold text-primary">{filteredProducts.length}</span> of <span className="font-bold text-primary">{initialProducts.length}</span> results
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                        <button
                                            onClick={() => setViewMode("grid")}
                                            className={`p-2 rounded-md transition-all ${viewMode === "grid" ? "bg-primary text-white shadow-md" : "text-gray-400 hover:text-primary"}`}
                                        >
                                            <LayoutGrid size={18} />
                                        </button>
                                        <button
                                            onClick={() => setViewMode("list")}
                                            className={`p-2 rounded-md transition-all ${viewMode === "list" ? "bg-primary text-white shadow-md" : "text-gray-400 hover:text-primary"}`}
                                        >
                                            <List size={18} />
                                        </button>
                                    </div>
                                    <div className="h-6 w-px bg-gray-200"></div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-gray-500">Show:</span>
                                        <div className="flex items-center gap-1 border border-gray-200 px-3 py-1.5 rounded-md cursor-pointer hover:border-primary transition-colors">
                                            <span className="font-bold">16</span>
                                            <ChevronDown size={14} />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-gray-500">Sort by:</span>
                                        <div className="flex items-center gap-1 border border-gray-200 px-3 py-1.5 rounded-md cursor-pointer hover:border-primary transition-colors">
                                            <span className="font-bold">Recent Added</span>
                                            <ChevronDown size={14} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Product Grid */}
                            {filteredProducts.length > 0 ? (
                                <div className={`grid ${viewMode === "grid" ? "grid-cols-4 gap-6" : "grid-cols-1 gap-6"}`}>
                                    {filteredProducts.map((product) => (
                                        <div key={product.id} className={`bg-white border border-gray-100 rounded-2xl overflow-hidden group hover:shadow-2xl transition-all duration-300 relative ${viewMode === "list" ? "flex items-center" : ""}`}>
                                            {/* Quick Actions Hidden by Default */}
                                            <div className={`absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 translate-x-4 group-hover:translate-x-0`}>
                                                <button className="bg-white p-2.5 rounded-full shadow-lg hover:bg-secondary transition-colors"><Heart size={16} /></button>
                                                <button className="bg-white p-2.5 rounded-full shadow-lg hover:bg-secondary transition-colors"><Eye size={16} /></button>
                                            </div>

                                            <div className={`relative bg-white aspect-square overflow-hidden ${viewMode === "list" ? "w-64" : "w-full"}`}>
                                                <Image src={product.img} alt={product.name} fill style={{ objectFit: 'contain' }} className="p-8 group-hover:scale-110 transition-transform duration-500" />
                                            </div>

                                            <div className="p-6 flex flex-col items-center text-center grow">
                                                <h3 className="text-sm font-bold text-accent mb-3 line-clamp-2 hover:text-primary transition-colors cursor-pointer min-h-10 uppercase tracking-wide">
                                                    {product.name}
                                                </h3>
                                                <div className="flex items-center gap-1 mb-3">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} size={12} fill="#ffb400" stroke="none" />
                                                    ))}
                                                    <span className="text-[10px] text-gray-400 font-bold ml-1">({product.reviews} reviews)</span>
                                                </div>
                                                <div className="text-secondary font-black text-xl mb-4">
                                                    ${product.price}.00
                                                </div>
                                                <button className="w-full bg-secondary text-primary py-3 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-orange-500 transition-all active:scale-95 group/btn overflow-hidden relative">
                                                    <span className="relative z-10">Add to Cart</span>
                                                    <ShoppingCart size={18} className="relative z-10 group-hover/btn:translate-x-1 transition-transform" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                    <div className="text-gray-400 mb-4 flex justify-center"><ShoppingCart size={48} /></div>
                                    <p className="text-lg font-bold text-primary">No products found matching your filters.</p>
                                    <button
                                        onClick={() => {
                                            setSelectedCategories([]);
                                            setSelectedBrands([]);
                                            setPriceRange(1000);
                                        }}
                                        className="mt-4 text-accent font-bold hover:underline"
                                    >
                                        Clear all filters
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-primary text-white py-20 mt-20">
                <div className="container-custom grid grid-cols-4 gap-12">
                    <div className="space-y-8">
                        <h2 className="text-3xl font-black italic text-secondary">e-Shopi</h2>
                        <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                            We are a leading e-commerce platform providing the best gadgets and electronics at unbeatable prices. Experience the future of shopping.
                        </p>
                    </div>
                    <div className="space-y-8">
                        <h3 className="text-xl font-bold border-b border-white/10 pb-4 inline-block pr-12">Quick Links</h3>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li className="hover:text-secondary cursor-pointer transition-colors flex items-center gap-2">About Us</li>
                            <li className="hover:text-secondary cursor-pointer transition-colors flex items-center gap-2">Contact Us</li>
                            <li className="hover:text-secondary cursor-pointer transition-colors flex items-center gap-2">Privacy Policy</li>
                            <li className="hover:text-secondary cursor-pointer transition-colors flex items-center gap-2">Terms & Conditions</li>
                        </ul>
                    </div>
                    <div className="space-y-8">
                        <h3 className="text-xl font-bold border-b border-white/10 pb-4 inline-block pr-12">Categories</h3>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li className="hover:text-secondary cursor-pointer transition-colors flex items-center gap-2">Computers & Laptops</li>
                            <li className="hover:text-secondary cursor-pointer transition-colors flex items-center gap-2">Smartphones & Tablets</li>
                            <li className="hover:text-secondary cursor-pointer transition-colors flex items-center gap-2">Audio & Video</li>
                            <li className="hover:text-secondary cursor-pointer transition-colors flex items-center gap-2">Gadgets</li>
                        </ul>
                    </div>
                    <div className="space-y-8">
                        <h3 className="text-xl font-bold border-b border-white/10 pb-4 inline-block pr-12">Newsletter</h3>
                        <p className="text-sm text-gray-400">Subscribe for early access to our latest offers and new product launches.</p>
                        <div className="flex bg-white/5 p-1.5 rounded-full overflow-hidden border border-white/10">
                            <input type="text" placeholder="Your Email Address" className="bg-transparent px-6 py-2 outline-none text-sm text-white w-full" />
                            <button className="bg-secondary text-primary px-8 py-2 rounded-full font-bold hover:bg-orange-500 transition-colors">Join</button>
                        </div>
                    </div>
                </div>
            </footer>
        </main>
    );
}
