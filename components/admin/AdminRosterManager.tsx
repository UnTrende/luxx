import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Barber } from '../../types';
import { api } from '../../services/api';
import ExcelRosterButton from '../../components/ExcelRosterButton';

interface AdminRosterManagerProps {
    rosters: any[];
    setRosters: React.Dispatch<React.SetStateAction<any[]>>;
    barbers: Barber[];
}

export const AdminRosterManager: React.FC<AdminRosterManagerProps> = ({ rosters, setRosters, barbers }) => {
    const [expandedRosterId, setExpandedRosterId] = useState<string | null>(null);
    const [editingRoster, setEditingRoster] = useState<any | null>(null);

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 hover:border-dubai-gold/30 transition-all p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-dubai-black">Roster Management</h2>
                    <p className="text-subtle-text text-sm mt-1">Manage weekly schedules and shifts</p>
                </div>
                <ExcelRosterButton onRosterUpdate={() => {
                    api.getRosters().then(data => setRosters(data.rosters || []));
                    toast.success('Rosters refreshed');
                }} />
            </div>

            {/* Roster List */}
            <div className="space-y-4">
                {rosters.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <p className="text-gray-500">No rosters found. Upload an Excel file to get started.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {rosters.map((roster, idx) => (
                            <div key={idx} className="border border-gray-100 rounded-xl hover:border-dubai-gold/30 transition-all overflow-hidden">
                                <div
                                    className="p-4 flex justify-between items-center bg-white hover:bg-gray-50"
                                >
                                    <div
                                        className="flex-1 cursor-pointer"
                                        onClick={() => setExpandedRosterId(expandedRosterId === (roster.id || idx.toString()) ? null : (roster.id || idx.toString()))}
                                    >
                                        <h3 className="font-bold text-dubai-black">{roster.week_start_date} - {roster.week_end_date}</h3>
                                        <p className="text-sm text-gray-500">{roster.shifts?.length || 0} shifts scheduled</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingRoster(roster);
                                            }}
                                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200 transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (confirm('Are you sure you want to delete this roster? This action cannot be undone.')) {
                                                    try {
                                                        await api.deleteRoster(roster.id);
                                                        // Refresh rosters
                                                        const updated = await api.getRosters();
                                                        setRosters(updated.rosters || []);
                                                        toast.success('Roster deleted successfully!');
                                                    } catch (error) {
                                                        console.error('Failed to delete roster:', error);
                                                        toast.error('Failed to delete roster. Please try again.');
                                                    }
                                                }
                                            }}
                                            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors"
                                        >
                                            Delete
                                        </button>
                                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                            Active
                                        </span>
                                        <span
                                            className="text-gray-400 cursor-pointer"
                                            onClick={() => setExpandedRosterId(expandedRosterId === (roster.id || idx.toString()) ? null : (roster.id || idx.toString()))}
                                        >
                                            {expandedRosterId === (roster.id || idx.toString()) ? '▲' : '▼'}
                                        </span>
                                    </div>
                                </div>

                                {/* Expanded Roster Details */}
                                {expandedRosterId === (roster.id || idx.toString()) && (
                                    <div className="bg-gray-50 p-4 border-t border-gray-100">
                                        <h4 className="font-bold text-xs uppercase tracking-wider text-subtle-text mb-3">Weekly Schedule</h4>
                                        {roster.shifts && roster.shifts.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                {/* Excel-style table */}
                                                {(() => {
                                                    // Get unique dates and sort them
                                                    const dates = Array.from(new Set(roster.shifts.map((s: any) => s.date))).sort() as string[];

                                                    // Get unique barbers
                                                    const barberIds = Array.from(new Set(roster.shifts.map((s: any) => s.barberId))) as string[];

                                                    // Create lookup: barberId -> date -> shift
                                                    const shiftLookup: Record<string, Record<string, any>> = {};
                                                    roster.shifts.forEach((shift: any) => {
                                                        if (!shiftLookup[shift.barberId]) shiftLookup[shift.barberId] = {};
                                                        shiftLookup[shift.barberId][shift.date] = shift;
                                                    });

                                                    return (
                                                        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                                                            <table className="w-full">
                                                                <thead>
                                                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                                                        <th className="p-6 text-left text-subtle-text text-[10px] font-bold uppercase tracking-widest min-w-[150px]">
                                                                            Staff Member
                                                                        </th>
                                                                        {dates.map((date) => (
                                                                            <th key={date} className="p-6 text-center border-l border-gray-100 min-w-[120px]">
                                                                                <div className="text-[10px] font-bold text-dubai-black uppercase tracking-widest">
                                                                                    {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                                                                                </div>
                                                                                <div className="text-[10px] text-subtle-text mt-1 font-mono opacity-75">
                                                                                    {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                                </div>
                                                                            </th>
                                                                        ))}
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-100">
                                                                    {barberIds.map((barberId) => {
                                                                        const barber = barbers.find(b => b.id === barberId);
                                                                        return (
                                                                            <tr key={barberId} className="hover:bg-gray-50 transition-colors">
                                                                                <td className="p-6 border-r border-gray-100 bg-white">
                                                                                    <div className="flex items-center gap-4">
                                                                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-dubai-dark-grey font-bold text-xs border border-gray-200">
                                                                                            {barber?.name?.charAt(0) || '?'}
                                                                                        </div>
                                                                                        <div>
                                                                                            <div className="font-bold text-dubai-black text-sm">{barber?.name || 'Unknown Barber'}</div>
                                                                                            <div className="text-[10px] text-subtle-text uppercase tracking-wider mt-0.5">Barber</div>
                                                                                        </div>
                                                                                    </div>
                                                                                </td>
                                                                                {dates.map((date) => {
                                                                                    const shift = shiftLookup[barberId]?.[date];
                                                                                    return (
                                                                                        <td key={date} className="p-4 text-center border-l border-gray-100 bg-white">
                                                                                            {shift ? (
                                                                                                <div className="inline-flex flex-col items-center justify-center">
                                                                                                    <div className="flex items-center gap-2 text-dubai-black">
                                                                                                        <span className="font-mono text-xs font-bold">{shift.start_time}</span>
                                                                                                        <span className="text-[10px] text-subtle-text">to</span>
                                                                                                        <span className="font-mono text-xs font-bold">{shift.end_time}</span>
                                                                                                    </div>
                                                                                                </div>
                                                                                            ) : (
                                                                                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                                                                                                    OFF
                                                                                                </span>
                                                                                            )}
                                                                                        </td>
                                                                                    );
                                                                                })}
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">No shifts defined for this roster.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Roster Modal */}
            {editingRoster && (
                <div className="fixed inset-0 z-50">
                    <ExcelRosterButton
                        editMode={true}
                        existingRoster={editingRoster}
                        onRosterUpdate={async () => {
                            setEditingRoster(null);
                            const updated = await api.getRosters();
                            setRosters(updated.rosters || []);
                            toast.success('Roster updated successfully');
                        }}
                    />
                </div>
            )}
        </div>
    );
};
