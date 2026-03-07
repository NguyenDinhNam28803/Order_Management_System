"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
    {
        title: "Top Headphone",
        subtitle: "HAVIT HV-H2178D 3.5",
        tag: "Top Monthly Seller",
        description: "Experience the best sound quality with our new Havit headphones. Engineered for comfort and high-fidelity audio performance.",
        image: "/hero.png",
        bgColor: "bg-[#e0f2ff]",
        accentColor: "decoration-secondary"
    },
    {
        title: "Gaming Laptop",
        subtitle: "ROG Zephyrus G14",
        tag: "New Arrivals",
        description: "Power through your favorite games and creative projects with the AMD Ryzen™ 9 CPU and NVIDIA® GeForce RTX™ 40-Series GPU.",
        image: "/laptop.png",
        bgColor: "bg-[#d0e8ff]",
        accentColor: "decoration-accent"
    },
    {
        title: "Smart Watch",
        subtitle: "Apple Watch Ultra 2",
        tag: "Special Discount",
        description: "The most rugged and capable Apple Watch ever. Designed for athletes and outdoor adventurers of all kinds.",
        image: "/watch.png",
        bgColor: "bg-[#f0f9ff]",
        accentColor: "decoration-primary"
    }
];

export default function Hero() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const minSwipeDistance = 50;

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, []);

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    };

    useEffect(() => {
        const interval = setInterval(nextSlide, 7000);
        return () => clearInterval(interval);
    }, [nextSlide]);

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        if (distance > minSwipeDistance) nextSlide();
        if (distance < -minSwipeDistance) prevSlide();
    };

    return (
        <section className="bg-gradient-to-b from-[#e0f2ff] to-[#f0f9ff] py-10 overflow-hidden">
            <div className="container-custom">
                <div
                    className="relative h-[600px] rounded-3xl overflow-hidden shadow-2xl group cursor-grab active:cursor-grabbing"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Slides */}
                    {slides.map((slide, index) => (
                        <div
                            key={index}
                            className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${index === currentIndex
                                ? "opacity-100 translate-x-0"
                                : index < currentIndex
                                    ? "opacity-0 -translate-x-full"
                                    : "opacity-0 translate-x-full"
                                }`}
                        >
                            <div className={`w-full h-full ${slide.bgColor} flex items-center relative`}>
                                {/* Background Decorations */}
                                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.4),transparent_70%)]"></div>
                                <div className="absolute inset-0 opacity-10 pointer-events-none"
                                    style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

                                {/* Content */}
                                <div className={`relative z-10 pl-[320px] pr-20 max-w-5xl transition-all duration-700 delay-300 ${index === currentIndex ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
                                    <h4 className="text-secondary font-bold text-xl mb-4 tracking-wider uppercase">{slide.tag}</h4>
                                    <h1 className="text-8xl font-black text-primary leading-tight mb-8">
                                        {slide.title.split(' ')[0]} <span className="block">{slide.title.split(' ').slice(1).join(' ')}</span>
                                        <span className={`text-primary/70 text-4xl block mt-4 underline ${slide.accentColor} decoration-4 underline-offset-8`}>
                                            {slide.subtitle}
                                        </span>
                                    </h1>
                                    <p className="text-text-muted mb-10 text-lg max-w-lg leading-relaxed">
                                        {slide.description}
                                    </p>
                                    <button className="bg-accent text-white px-12 py-5 rounded-full font-bold hover:bg-blue-700 transition-all shadow-xl hover:shadow-accent/40 text-xl transform hover:-translate-y-1">
                                        Shop Now
                                    </button>
                                </div>

                                {/* Image */}
                                <div className={`absolute right-0 bottom-0 top-0 w-1/2 flex items-center justify-end pr-20 py-20 transition-all duration-1000 delay-100 ${index === currentIndex ? "translate-x-0 opacity-100" : "translate-x-20 opacity-0"}`}>
                                    <div className="relative w-[85%] h-[85%] transition-transform duration-700 hover:scale-105">
                                        <Image
                                            src={slide.image}
                                            alt={slide.subtitle}
                                            fill
                                            style={{ objectFit: 'contain' }}
                                            priority={index === 0}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Navigation Arrows */}
                    <button
                        onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                        className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md p-4 rounded-full text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-auto"
                    >
                        <ChevronLeft size={30} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                        className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md p-4 rounded-full text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-auto"
                    >
                        <ChevronRight size={30} />
                    </button>

                    {/* Dots / Pagination */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4 z-20">
                        {slides.map((_, index) => (
                            <div
                                key={index}
                                onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                                className={`h-2 transition-all duration-300 rounded-full cursor-pointer ${index === currentIndex ? "w-12 bg-accent" : "w-4 bg-gray-400/50 hover:bg-gray-400"
                                    }`}
                            ></div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
