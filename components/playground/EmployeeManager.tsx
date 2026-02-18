
'use client';

import { useState } from 'react';
import { Employee } from '@/lib/playground-api';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { translations, Language } from '@/lib/i18n';
import { User, Zap, Heart, DollarSign, X, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import Image from 'next/image';

interface EmployeeManagerProps {
    employees: Employee[];
    onUpdate: (employees: Employee[]) => void;
}

export default function EmployeeManager({ employees, onUpdate }: EmployeeManagerProps) {
    const [language] = useLocalStorage<Language>('language', 'es');
    const t = translations[language];

    // State for the "Add New" form
    const [newEnergy, setNewEnergy] = useState<number>(100);
    const [newProd, setNewProd] = useState<number>(10);
    const [newWage, setNewWage] = useState<number>(0.15);
    const [newFidelity, setNewFidelity] = useState<number>(0);

    const handleAdd = () => {
        const newEmployee: Employee = {
            id: `manual-${Date.now()}`,
            name: `Manual Worker ${employees.length + 1}`,
            avatar: '', // Default avatar logic
            energy: newEnergy,
            production: newProd,
            wage: newWage,
            fidelity: newFidelity,
            joinedAt: new Date().toISOString()
        };
        onUpdate([...employees, newEmployee]);
    };

    const handleRemove = (id: string) => {
        onUpdate(employees.filter(e => e.id !== id));
    };

    const handleWageChange = (id: string, wage: number) => {
        onUpdate(employees.map(e => e.id === id ? { ...e, wage } : e));
    };

    return (
        <div className="bg-black/20 border border-white/5 rounded-lg p-3 space-y-3">
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <h4 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                    <User className="w-4 h-4 text-yellow-500" />
                    {t.playground.employee.title}
                </h4>
                <div className="bg-white/10 text-xs px-2 py-0.5 rounded text-gray-300">
                    {employees.length}
                </div>
            </div>

            {/* Quick Add Row */}
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-end">
                <div>
                    <label className="text-[10px] text-gray-500 block mb-0.5">{t.playground.employee.energy}</label>
                    <input
                        type="number"
                        value={newEnergy}
                        onChange={(e) => setNewEnergy(Number(e.target.value))}
                        className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none"
                    />
                </div>
                <div>
                    <label className="text-[10px] text-gray-500 block mb-0.5">{t.playground.employee.prod}</label>
                    <input
                        type="number"
                        value={newProd}
                        onChange={(e) => setNewProd(Number(e.target.value))}
                        className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none"
                    />
                </div>
                <div>
                    <label className="text-[10px] text-gray-500 block mb-0.5">{t.playground.employee.wage}</label>
                    <input
                        type="number"
                        step="0.01"
                        value={newWage}
                        onChange={(e) => setNewWage(Number(e.target.value))}
                        className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none"
                    />
                </div>
                <div>
                    <label className="text-[10px] text-gray-500 block mb-0.5">{t.playground.employee.fidelity}</label>
                    <input
                        type="number"
                        value={newFidelity}
                        onChange={(e) => setNewFidelity(Number(e.target.value))}
                        className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none"
                    />
                </div>
                <button
                    onClick={handleAdd}
                    className="h-[26px] bg-green-600 hover:bg-green-500 text-white rounded px-2 flex items-center justify-center transition-colors"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {/* Employees List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {employees.map((emp) => (
                    <div key={emp.id} className="bg-white/5 p-2 rounded flex items-center gap-3 border border-white/5 hover:bg-white/10 transition-colors">
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden flex-shrink-0 border border-gray-600">
                            {emp.avatar ? (
                                <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <User className="w-4 h-4" />
                                </div>
                            )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">{emp.name}</div>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                                <div className="flex items-center gap-0.5 text-yellow-500">
                                    <Zap className="w-3 h-3" />
                                    <span>{emp.energy}</span>
                                </div>
                                <div className="flex items-center gap-0.5 text-green-500">
                                    <Heart className="w-3 h-3" />
                                    <span>+{emp.fidelity}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Wage Edit */}
                        <div className="w-16">
                            <input
                                type="number"
                                step="0.01"
                                value={emp.wage}
                                onChange={(e) => handleWageChange(emp.id, Number(e.target.value))}
                                className="w-full bg-transparent text-right text-sm text-green-400 font-mono focus:bg-gray-800 rounded px-1 outline-none border-b border-transparent focus:border-green-500"
                            />
                        </div>

                        {/* Actions */}
                        <button
                            onClick={() => handleRemove(emp.id)}
                            className="text-gray-500 hover:text-red-400 transition-colors p-1"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
