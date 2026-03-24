"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Select from "react-select";
import { useProcurement } from "../../context/ProcurementContext";
import { Trash2, Save, FileText } from "lucide-react";

export default function CreatePRPage() {
    const { addPR, apiFetch } = useProcurement();
    const router = useRouter();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [products, setProducts] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [form, setForm] = useState<any>({
        title: "",
        description: "",
        justification: "",
        requiredDate: "",
        priority: 2,
        costCenterId: "325f187a-c1f6-4a4e-8692-234b6e50334d",
        items: []
    });

    useEffect(() => {
        // Fetch product list
        apiFetch('/products').then(res => res.json()).then(data => setProducts(data.data || []));
    }, [apiFetch]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addItem = (option: any) => {
        const product = products.find(p => p.id === option.value);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!product || form.items.find((i: any) => i.productId === product.id)) return;
        
        setForm({
            ...form,
            items: [...form.items, {
                productId: product.id,
                productDesc: product.name,
                sku: product.sku,
                categoryId: product.categoryId,
                qty: 1,
                unit: product.unit || "PCS",
                estimatedPrice: product.price || 0,
                specNote: ""
            }]
        });
    };

    const handleSubmit = async () => {
        const success = await addPR(form);
        if (success) router.push("/pr");
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-erp-navy uppercase tracking-widest">Tạo yêu cầu mua hàng (PR)</h1>
                    <p className="text-xs text-erp-gray font-medium mt-1">Gửi yêu cầu mua sắm mới vào hệ thống.</p>
                </div>
                <button className="btn-primary" onClick={handleSubmit}>
                    <Save size={16} /> Gửi yêu cầu PR
                </button>
            </header>

            <div className="erp-card grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                    <label className="erp-label">Tiêu đề yêu cầu</label>
                    <input className="erp-input" onChange={e => setForm({...form, title: e.target.value})} placeholder="VD: Mua laptop cho team dev..." />
                </div>
                <div>
                    <label className="erp-label">Độ ưu tiên</label>
                    <select className="erp-input" onChange={e => setForm({...form, priority: parseInt(e.target.value)})}>
                        <option value={1}>1 - Khẩn cấp (Cần ngay)</option>
                        <option value={2}>2 - Bình thường</option>
                        <option value={3}>3 - Không gấp</option>
                    </select>
                </div>
                <div>
                    <label className="erp-label">Ngày cần hàng</label>
                    <input type="date" className="erp-input" onChange={e => setForm({...form, requiredDate: e.target.value})} />
                </div>
                <div className="col-span-2">
                    <label className="erp-label">Lý do mua sắm</label>
                    <textarea className="erp-input" rows={3} onChange={e => setForm({...form, justification: e.target.value})} />
                </div>
            </div>

            <div className="erp-card">
                <label className="erp-label">Tìm kiếm & Chọn sản phẩm</label>
                <Select 
                    options={products.map(p => ({ label: `${p.name} - SKU: ${p.sku}`, value: p.id }))}
                    onChange={addItem}
                    className="mb-6"
                    placeholder="Tìm kiếm sản phẩm..."
                />

                <table className="erp-table">
                    <thead>
                        <tr>
                            <th>Sản phẩm</th>
                            <th>Mã SKU</th>
                            <th className="text-center w-20">SL</th>
                            <th>Ghi chú kỹ thuật (Spec)</th>
                            <th className="text-center">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {form.items.map((item: any, i: number) => (
                            <tr key={i}>
                                <td className="font-bold text-erp-navy">{item.productDesc}</td>
                                <td className="text-slate-400 font-mono text-xs">{item.sku}</td>
                                <td>
                                    <input type="number" className="erp-input text-center" defaultValue={1} onChange={e => {
                                        const items = [...form.items];
                                        items[i].qty = parseInt(e.target.value);
                                        setForm({...form, items});
                                    }} />
                                </td>
                                <td>
                                    <input className="erp-input" placeholder="Ghi chú kỹ thuật..." onChange={e => {
                                        const items = [...form.items];
                                        items[i].specNote = e.target.value;
                                        setForm({...form, items});
                                    }} />
                                </td>
                                <td className="text-center">
                                    <button className="text-red-500 hover:text-red-700" onClick={() => {
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        setForm({...form, items: form.items.filter((_: any, idx: number) => idx !== i)});
                                    }}><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                        {form.items.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-slate-400 italic">Chưa chọn sản phẩm nào.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
