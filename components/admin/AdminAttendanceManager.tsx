import React from 'react';
import { toast } from 'react-toastify';
import { Attendance, Barber } from '../../types';
import { api } from '../../services/api';
import { Clock, User, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { logger } from '../../src/lib/logger';

interface AdminAttendanceManagerProps {
    attendanceRecords: Attendance[];
    setAttendanceRecords: React.Dispatch<React.SetStateAction<Attendance[]>>;
    barbers: Barber[];
}

export const AdminAttendanceManager: React.FC<AdminAttendanceManagerProps> = ({ attendanceRecords, setAttendanceRecords, barbers }) => {

    const handleAttendanceUpdate = async (attendanceId: string, newStatus: 'present' | 'absent' | 'late') => {
        try {
            // Optimistic update
            setAttendanceRecords(prev => prev.map(record =>
                (record as any).id === attendanceId ? { ...record, status: newStatus } : record
            ));

            await api.updateAttendanceStatus(attendanceId, newStatus);
            toast.success('Attendance status updated');
        } catch (error) {
            logger.error('Attendance update failed:', error, 'AdminAttendanceManager');
            toast.error('Failed to update attendance');

            // Revert
            const attendance = await api.getAttendance();
            setAttendanceRecords(attendance || []);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-glass-card p-6 rounded-3xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 blur-[80px] rounded-full pointer-events-none" />

                <div className="relative z-10">
                    <h2 className="text-3xl font-serif font-bold text-white mb-2 flex items-center gap-3">
                        <span className="p-2 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20">
                            <Clock size={24} />
                        </span>
                        Attendance Records
                    </h2>
                    <p className="text-subtle-text text-sm">Track staff check-ins and working hours</p>
                </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-glass-card rounded-3xl border border-white/10 overflow-hidden shadow-glass">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="text-left py-5 px-8 text-xs font-bold text-gold uppercase tracking-[0.2em]">Barber</th>
                                <th className="text-left py-5 px-8 text-xs font-bold text-gold uppercase tracking-[0.2em]">Date</th>
                                <th className="text-left py-5 px-8 text-xs font-bold text-gold uppercase tracking-[0.2em]">Check In</th>
                                <th className="text-left py-5 px-8 text-xs font-bold text-gold uppercase tracking-[0.2em]">Check Out</th>
                                <th className="text-left py-5 px-8 text-xs font-bold text-gold uppercase tracking-[0.2em]">Status</th>
                                <th className="text-right py-5 px-8 text-xs font-bold text-gold uppercase tracking-[0.2em]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {attendanceRecords.map((record) => (
                                <tr key={(record as any).id || record.barberId} className="hover:bg-white/5 transition-all duration-300 group">
                                    <td className="py-5 px-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 text-xs font-bold">
                                                <User size={14} />
                                            </div>
                                            <span className="font-bold text-white group-hover:text-gold transition-colors">
                                                {record.barberName || barbers.find(b => b.id === record.barberId)?.name || 'Unknown'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-5 px-8">
                                        <div className="flex items-center gap-2 text-subtle-text text-sm">
                                            <Calendar size={14} className="text-white/30" />
                                            {record.date ? new Date(record.date).toLocaleDateString() : '-'}
                                        </div>
                                    </td>
                                    <td className="py-5 px-8 font-mono text-sm text-white">{record.clockIn || '-'}</td>
                                    <td className="py-5 px-8 font-mono text-sm text-white">{record.clockOut || '-'}</td>
                                    <td className="py-5 px-8">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${record.status === 'present' || record.status === 'Present' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                record.status === 'late' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                    'bg-red-500/10 text-red-400 border-red-500/20'
                                            }`}>
                                            {record.status === 'present' && <CheckCircle size={12} />}
                                            {record.status === 'late' && <AlertCircle size={12} />}
                                            {record.status === 'absent' && <XCircle size={12} />}
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className="py-5 px-8 text-right">
                                        <div className="inline-flex bg-black/40 rounded-lg border border-white/10 p-1">
                                            <select
                                                value={record.status.toLowerCase()}
                                                onChange={(e) => handleAttendanceUpdate((record as any).id, e.target.value as any)}
                                                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer px-2 py-1"
                                            >
                                                <option value="present" className="bg-gray-900">Present</option>
                                                <option value="late" className="bg-gray-900">Late</option>
                                                <option value="absent" className="bg-gray-900">Absent</option>
                                            </select>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {attendanceRecords.length === 0 && (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-subtle-text">
                                <Clock size={24} />
                            </div>
                            <p className="text-subtle-text text-sm">No attendance records found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
