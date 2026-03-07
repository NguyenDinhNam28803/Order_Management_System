"use client";

import Header from "./components/Header";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import TrendingProducts from "./components/TrendingProducts";
import HotArrivals from "./components/HotArrivals";
import SpecialProducts from "./components/SpecialProducts";
import ProductColumns from "./components/ProductColumns";
import { ChevronUp } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-white font-sans text-primary selection:bg-secondary selection:text-primary">
      {/* Header & Navigation */}
      <Header />
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* Features / Top Categories */}
      <Features />

      {/* Trending Products Section */}
      <TrendingProducts />

      {/* Hot New Arrivals Section */}
      <HotArrivals />

      {/* Special Products Section */}
      <SpecialProducts />

      {/* Footer Lists / Columns */}
      <ProductColumns />

      {/* Footer Placeholder */}
      <footer className="bg-primary text-white py-20">
        <div className="container-custom grid grid-cols-4 gap-10">
          <div className="space-y-6">
            <h2 className="text-2xl font-black italic">e-Shopi</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              We are a leading e-commerce platform providing the best gadgets and electronics at unbeatable prices.
            </p>
          </div>
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Quick Links</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="hover:text-secondary cursor-pointer">About Us</li>
              <li className="hover:text-secondary cursor-pointer">Contact Us</li>
              <li className="hover:text-secondary cursor-pointer">Privacy Policy</li>
              <li className="hover:text-secondary cursor-pointer">Terms & Conditions</li>
            </ul>
          </div>
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Categories</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="hover:text-secondary cursor-pointer">Computers & Laptops</li>
              <li className="hover:text-secondary cursor-pointer">Smartphones & Tablets</li>
              <li className="hover:text-secondary cursor-pointer">Audio & Video</li>
              <li className="hover:text-secondary cursor-pointer">Gadgets</li>
            </ul>
          </div>
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Newsletter</h3>
            <p className="text-sm text-gray-400">Subscribe to get the latest offers and news.</p>
            <div className="flex">
              <input type="text" placeholder="Your Email" className="bg-white/10 px-4 py-2 rounded-l-md outline-none border-none text-white w-full" />
              <button className="bg-secondary text-primary px-4 py-2 rounded-r-md font-bold">Join</button>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <button className="fixed bottom-8 right-8 bg-white text-secondary border-2 border-secondary p-3 rounded-full shadow-lg hover:bg-secondary hover:text-white transition-all z-40 group">
        <ChevronUp size={24} className="group-hover:scale-110 transition-transform" />
      </button>
    </main>
  );
}
