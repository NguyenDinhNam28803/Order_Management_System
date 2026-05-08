"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ContractSignModal from "../../../components/ContractSignModal";

// Trang này xử lý ký hợp đồng từ email (không cần login)
export default function ExternalContractSignPage({ params }: { params: { id: string } }) {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    
    // Giả định là nhà cung cấp ký (để ký hợp đồng qua magic link)
    const [contract, setContract] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Tạm thời fetch hợp đồng dựa trên ID (có thể cần API mới để fetch không cần auth)
        // Trong thực tế, bạn cần gọi API /contracts/:id đã được bỏ guard
        fetch(`/api/contracts/${params.id}`)
            .then(res => res.json())
            .then(data => setContract(data))
            .finally(() => setLoading(false));
    }, [params.id]);

    const handleExternalSign = async (id: string, isBuyer: boolean) => {
        const resp = await fetch(`/api/contracts/${id}/sign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isBuyer, token }) // Gửi kèm token
        });
        return resp.ok;
    };

    if (loading) return <div>Đang tải...</div>;
    if (!contract) return <div>Không tìm thấy hợp đồng</div>;

    return (
        <ContractSignModal
            contract={contract}
            isBuyer={false}
            signerName="Nhà cung cấp"
            onClose={() => {}}
            onConfirm={handleExternalSign}
        />
    );
}
