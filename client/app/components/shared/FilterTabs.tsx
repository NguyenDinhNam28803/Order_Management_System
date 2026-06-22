"use client";

import React from "react";

/**
 * FilterTabs — dải tab lọc dùng chung (dùng class .filter-tabs/.filter-tab trong globals.css).
 * Thay các block filter tabs viết tay lặp trong nhiều trang list.
 */

export interface FilterTabItem<V extends string = string> {
    value: V;
    label: string;
    count?: number;
}

interface FilterTabsProps<V extends string = string> {
    tabs: FilterTabItem<V>[];
    value: V;
    onChange: (value: V) => void;
    className?: string;
}

export default function FilterTabs<V extends string = string>({
    tabs,
    value,
    onChange,
    className = "",
}: FilterTabsProps<V>) {
    return (
        <div className={`filter-tabs ${className}`} role="tablist">
            {tabs.map((tab) => (
                <button
                    key={tab.value}
                    type="button"
                    role="tab"
                    aria-selected={value === tab.value}
                    onClick={() => onChange(tab.value)}
                    className={`filter-tab ${value === tab.value ? "active" : ""}`}
                >
                    {tab.label}
                    {tab.count !== undefined && (
                        <span className="filter-tab-count">{tab.count}</span>
                    )}
                </button>
            ))}
        </div>
    );
}
