"use client";

import React from "react";

interface DashboardHeaderProps {
    children?: React.ReactNode;
}

export default function DashboardHeader({ children }: DashboardHeaderProps) {
    return <>{children}</>;
}
