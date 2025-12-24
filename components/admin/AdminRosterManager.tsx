import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Barber } from '../../types';
import { api } from '../../services/api';
import ExcelRosterButton from '../../components/ExcelRosterButton';
import { Calendar, Clock, User, Trash2, Edit, ChevronDown, ChevronUp, FileSpreadsheet, Filter } from 'lucide-react';
import { isRosterExpired, getRosterStatusBadgeClass, getRosterStatusText } from '../../utils/rosterUtils';
import { logger } from '../../src/lib/logger';

interface AdminRosterManagerProps {
    rosters: unknown[];
    setRosters: React.Dispatch<React.SetStateAction<any[]>>;
    barbers: Barber[];
}

export const AdminRosterManager: React.FC<AdminRosterManagerProps> = ({ rosters, setRosters, barbers }) => {
    const [expandedRosterId, setExpandedRosterId] = useState<string | null>(null);
    const [editingRoster, setEditingRoster] = useState<any | null>(null);
    const [showExpiredRosters, setShowExpiredRosters] = useState<boolean>(false);

    // Filter rosters based on expiration status
    const filteredRosters = showExpiredRosters 
        ? rosters 
        : rosters.filter(roster => !isRosterExpired(roster));

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-glass-card p-6 rounded-3xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />

                <div className="relative z-10">
                    <h2 className="text-3xl font-serif font-bold text-white mb-2 flex items-center gap-3">
                        <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <Calendar size={24} />
                        </span>
                        Roster Management
                    </h2>
                    <p className="text-subtle-text text-sm">Manage weekly schedules and shifts</p>
                </div>

                <div className="relative z-10 flex items-center gap-3">
                    <button
                        onClick={() => setShowExpiredRosters(!showExpiredRosters)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-sm transition-colors"
                    >
                        <Filter size={16} />
                        {showExpiredRosters ? 'Hide Expired' : 'Show Expired'}
                    </button>
                    
                    <ExcelRosterButton onRosterUpdate={() => {
                        api.getRosters().then(data => setRosters(data.rosters || []));
                        toast.success('Rosters refreshed');
                    }} />
                </div>
            </div>

            {/* Roster List */}
            <div className="space-y-4">
                {filteredRosters.length === 0 ? (
                    <div className="text-center py-16 bg-glass-card rounded-3xl border border-white/10 border-dashed">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-subtle-text">
                            <FileSpreadsheet size={24} />
                        </div>
                        <p className="text-subtle-text text-sm">No rosters found. Upload an Excel file to get started.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredRosters.map((roster, idx) => {
                            const isExpired = isRosterExpired(roster);
                            
                            return (
                                <div key={idx} className={`bg-glass-card border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:border-gold/30 hover:shadow-glass group ${isExpired ? 'opacity-70' : ''}`}>
                                    <div
                                        className="p-5 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors"
                                        onClick={() => setExpandedRosterId(expandedRosterId === (roster.id || idx.toString()) ? null : (roster.id || idx.toString()))}
                                    >
                                        <div className="flex-1">
                                            <h3 className="font-bold text-white text-lg flex items-center gap-3">
                                                <Calendar size={18} className="text-gold" />
                                                {roster.week_start_date} <span className="text-subtle-text text-sm font-normal">to</span> {roster.week_end_date}
                                            </h3>
                                            <p className="text-sm text-subtle-text mt-1 ml-8">{roster.shifts?.length || 0} shifts scheduled</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingRoster(roster);
                                                }}
                                                className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors border border-blue-500/20"
                                                title="Edit Roster"
                                            >
                                                <Edit size={16} />
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
                                                            logger.error('Failed to delete roster:', error, 'AdminRosterManager');
                                                            toast.error('Failed to delete roster. Please try again.');
                                                        }
                                                    }
                                                }}
                                                className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/20"
                                                title="Delete Roster"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <span className={getRosterStatusBadgeClass(roster)}>
                                                {getRosterStatusText(roster)}
                                            </span>
                                            <span className="text-subtle-text group-hover:text-white transition-colors">
                                                {expandedRosterId === (roster.id || idx.toString()) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Expanded Roster Details */}
                                    {expandedRosterId === (roster.id || idx.toString()) && (
                                        <div className="bg-black/20 p-6 border-t border-white/10">
                                            <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-gold mb-4 flex items-center gap-2">
                                                <Clock size={14} />
                                                Weekly Schedule
                                            </h4>
                                            {roster.shifts && roster.shifts.length > 0 ? (
                                                <div className="overflow-x-auto">
                                                    {/* Excel-style table */}
                                                    {(() => {
                                                        // Get unique dates and sort them
                                                        const dates = Array.from(new Set(roster.shifts.map((s: unknown) => s.date))).sort() as string[];

                                                        // Get unique barbers
                                                        const barberIds = Array.from(new Set(roster.shifts.map((s: unknown) => s.barberId))) as string[];

                                                        // Create lookup: barberId -> date -> shift
                                                        const shiftLookup: Record<string, Record<string, any>> = {};
                                                        roster.shifts.forEach((shift: unknown) => {
                                                            if (!shiftLookup[shift.barberId]) shiftLookup[shift.barberId] = {};
                                                            shiftLookup[shift.barberId][shift.date] = shift;
                                                        });

                                                        return (
                                                            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
                                                                <table className="w-full">
                                                                    <thead>
                                                                        <tr className="border-b border-white/10 bg-white/5">
                                                                            <th className="p-4 text-left text-subtle-text text-[10px] font-bold uppercase tracking-widest min-w-[150px]">
                                                                                Staff Member
                                                                            </th>
                                                                            {dates.map((date) => (
                                                                                <th key={date} className="p-4 text-center border-l border-white/10 min-w-[120px]">
                                                                                    <div className="text-[10px] font-bold text-white uppercase tracking-widest">
                                                                                        {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="text-[10px] text-subtle-text mt-1 font-mono opacity-75">
                        {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                </th>
            ))}
        </tr>
    </thead>
    <tbody className="divide-y divide-white/5">
        {barberIds.map((barberId) => {
            const barber = barbers.find(b => b.id === barberId);
            return (
                <tr key={barberId} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 border-r border-white/10 bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 font-bold text-xs border border-white/10">
                                {barber?.name?.charAt(0) || '?'}
                            </div>
                            <div>
                                <div className="font-bold text-white text-sm">{barber?.name || 'Unknown Barber'}</div>
                                <div className="text-[10px] text-subtle-text uppercase tracking-wider mt-0.5">Barber</div>
                            </div>
                        </div>
                    </td>
                    {dates.map((date) => {
                        const shift = shiftLookup[barberId]?.[date];
                        return (
                            <td key={date} className="p-3 text-center border-l border-white/10">
                                {shift ? (
                                    <div className="inline-flex flex-col items-center justify-center bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 w-full">
                                        <div className="flex items-center gap-1.5 text-green-400">
                                            <span className="font-mono text-xs font-bold">{shift.start_time}</span>
                                            <span className="text-[10px] opacity-50">-</span>
                                            <span className="font-mono text-xs font-bold">{shift.end_time}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
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
<p className="text-sm text-subtle-text italic">No shifts defined for this roster.</p>
)}
</div>
)}
</div>
);
})}
</div>
)}
</div>

            {/* Edit Roster Modal */}
            {editingRoster && (
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
            )}
        </div>
    );
};