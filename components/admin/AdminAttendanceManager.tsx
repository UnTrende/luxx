import React from 'react';
import { toast } from 'react-toastify';
import { Attendance, Barber } from '../../types';
import { api } from '../../services/api';

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
                // Since attendance records might not have an ID if they are just views, we need to be careful.
                // But the API update requires an ID. Assuming records have IDs.
                // If the type definition doesn't have ID, we might have an issue.
                // Let's check type definition.
                // Attendance interface in types.ts:
                // export interface Attendance { barberId: string; ... }
                // It doesn't seem to have a top-level ID in the interface shown earlier?
                // Wait, line 95 in types.ts:
                // export interface Attendance { barberId: string; ... }
                // It does NOT have 'id'.
                // But the code in AdminDashboardPageNew.tsx uses `record.id`.
                // Let's check AdminDashboardPageNew.tsx again.
                // Line 1646: <tr key={record.id} ...
                // So the runtime object HAS an id.
                // I should probably extend the type locally or rely on it being there.
                // I'll cast it for now or update the type later if needed.
                (record as any).id === attendanceId ? { ...record, status: newStatus } : record
            ));

            await api.updateAttendanceStatus(attendanceId, newStatus);
            toast.success('Attendance status updated');
        } catch (error) {
            console.error('Attendance update failed:', error);
            toast.error('Failed to update attendance');

            // Revert
            const attendance = await api.getAttendance();
            setAttendanceRecords(attendance || []);
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 hover:border-dubai-gold/30 transition-all overflow-hidden">
            <div className="p-8 border-b border-gray-100">
                <h2 className="text-2xl font-serif font-bold text-dubai-black">Attendance Records</h2>
                <p className="text-subtle-text text-sm mt-1">Track staff check-ins and working hours</p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="text-left py-4 px-8 text-xs font-bold text-subtle-text uppercase tracking-wider">Barber</th>
                            <th className="text-left py-4 px-8 text-xs font-bold text-subtle-text uppercase tracking-wider">Date</th>
                            <th className="text-left py-4 px-8 text-xs font-bold text-subtle-text uppercase tracking-wider">Check In</th>
                            <th className="text-left py-4 px-8 text-xs font-bold text-subtle-text uppercase tracking-wider">Check Out</th>
                            <th className="text-left py-4 px-8 text-xs font-bold text-subtle-text uppercase tracking-wider">Status</th>
                            <th className="text-right py-4 px-8 text-xs font-bold text-subtle-text uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {attendanceRecords.map((record) => (
                            <tr key={(record as any).id || record.barberId} className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-4 px-8 font-medium text-dubai-dark-grey">
                                    {record.barberName || barbers.find(b => b.id === record.barberId)?.name || 'Unknown'}
                                </td>
                                <td className="py-4 px-8 text-subtle-text font-mono">{record.date ? new Date(record.date).toLocaleDateString() : '-'}</td>
                                <td className="py-4 px-8 text-subtle-text font-mono">{record.clockIn || '-'}</td>
                                <td className="py-4 px-8 text-subtle-text font-mono">{record.clockOut || '-'}</td>
                                <td className="py-4 px-8">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${record.status === 'present' || record.status === 'Present' ? 'bg-green-100 text-green-600' :
                                        record.status === 'late' ? 'bg-yellow-100 text-yellow-600' :
                                            'bg-red-100 text-red-600'
                                        }`}>
                                        {record.status}
                                    </span>
                                </td>
                                <td className="py-4 px-8 text-right">
                                    <select
                                        value={record.status.toLowerCase()}
                                        onChange={(e) => handleAttendanceUpdate((record as any).id, e.target.value as any)}
                                        className="bg-white border border-gray-200 rounded-lg px-3 py-1 text-sm font-medium text-dubai-dark-grey focus:border-dubai-black focus:outline-none cursor-pointer hover:bg-gray-50 transition-colors"
                                    >
                                        <option value="present">Present</option>
                                        <option value="late">Late</option>
                                        <option value="absent">Absent</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {attendanceRecords.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-subtle-text text-lg">No attendance records found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
