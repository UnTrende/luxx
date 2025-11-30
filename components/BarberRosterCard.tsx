// components/BarberRosterCard.tsx
import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Loader, CalendarOff } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const BarberRosterCard: React.FC = () => {
    const { user } = useAuth();
    const [rosters, setRosters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBarberRoster();
    }, [user]);

    const loadBarberRoster = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const barberRosters = await api.getBarberRoster();
            setRosters(barberRosters);
        } catch (error) {
            console.error('❌ Failed to load barber roster:', error);
            setRosters([]);
        } finally {
            setLoading(false);
        }
    };

    const getDayName = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { weekday: 'long' });
    };

    const formatTime = (timeString: string) => {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader className="animate-spin text-gold" size={32} />
            </div>
        );
    }

    if (rosters.length === 0) {
        return (
            <div className="text-center p-12">
                <CalendarOff size={48} className="mx-auto text-subtle-text mb-4 opacity-50" />
                <h3 className="text-xl font-serif font-bold text-white mb-2">No Roster Published</h3>
                <p className="text-subtle-text text-sm">
                    Your flight plan hasn't been issued yet. Check back later.
                </p>
            </div>
        );
    }

    // Show only the most recent roster
    const currentRoster = rosters[0];
    const rosterDays = currentRoster.schedules?.days || currentRoster.days || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center text-gold border border-gold/30">
                        <Calendar size={16} />
                    </div>
                    <div>
                        <h2 className="text-lg font-serif font-bold text-white">Weekly Roster</h2>
                        <p className="text-[10px] text-subtle-text uppercase tracking-widest">
                            {new Date(currentRoster.week_dates?.start || currentRoster.start_date).toLocaleDateString()} - {new Date(currentRoster.week_dates?.end || currentRoster.end_date).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="text-xs font-mono text-gold border border-gold/30 px-2 py-1 rounded bg-gold/5">
                    {currentRoster.week_key}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rosterDays.map((day: any) => {
                    const isDayOff = day.shifts && day.shifts.length > 0 && day.shifts.every((shift: any) => shift.isDayOff);
                    const hasShifts = day.shifts && day.shifts.length > 0 && !isDayOff;

                    return (
                        <div key={day.date} className={`rounded-xl p-4 border transition-all ${hasShifts
                                ? 'bg-white/5 border-white/10 hover:border-gold/30'
                                : 'bg-black/20 border-white/5 opacity-60'
                            }`}>
                            <div className="flex items-center justify-between mb-3">
                                <h4 className={`font-bold text-sm ${hasShifts ? 'text-white' : 'text-subtle-text'}`}>
                                    {getDayName(day.date)}
                                </h4>
                                <span className="text-[10px] text-subtle-text font-mono">
                                    {new Date(day.date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                                </span>
                            </div>

                            {hasShifts ? (
                                <div className="space-y-2">
                                    {day.shifts.map((shift: any, index: number) => (
                                        !shift.isDayOff && (
                                            <div key={index} className="flex items-center gap-2 p-2 bg-black/30 rounded border border-white/5">
                                                <Clock size={12} className="text-gold" />
                                                <span className="text-xs font-mono text-white/90">
                                                    {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                                                </span>
                                            </div>
                                        )
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-2 border border-dashed border-white/10 rounded bg-white/5">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-subtle-text">Off Duty</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-end pt-4 border-t border-white/10">
                <button
                    onClick={loadBarberRoster}
                    className="text-xs font-bold uppercase tracking-widest text-gold hover:text-white transition-colors flex items-center gap-2"
                >
                    <Clock size={14} /> Refresh Roster
                </button>
            </div>
        </div>
    );
};

export default BarberRosterCard;