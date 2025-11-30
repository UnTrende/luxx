// components/ExcelRosterButton.tsx
import React, { useState, useEffect } from 'react';
import { Grid3X3, X } from 'lucide-react';
import SimpleExcelRoster from './SimpleExcelRoster';
import { api } from '../services/api';

interface Barber {
  id: string;
  name: string;
  email?: string;
  user_id?: string;
}

interface ExcelRosterButtonProps {
  onRosterUpdate?: () => void;
  editMode?: boolean;
  existingRoster?: any;
}

export default function ExcelRosterButton({ onRosterUpdate, editMode = false, existingRoster }: ExcelRosterButtonProps) {
  const [showExcelRoster, setShowExcelRoster] = useState(false);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(false);

  const loadBarbers = async () => {
    try {
      setLoading(true);
      const response = await api.getBarbers();
      // Handle different response formats - API returns Barber[] directly
      const barberData = Array.isArray(response) ? response : (response as any)?.barbers || [];

      // Ensure proper format
      const formattedBarbers = barberData.map((barber: any) => ({
        id: barber.id || barber.user_id,
        name: barber.name || barber.full_name || 'Unknown',
        email: barber.email || ''
      }));

      setBarbers(formattedBarbers);
    } catch (error) {
      console.error('Failed to load barbers:', error);
      // Fallback data for testing
      setBarbers([
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
        { id: '3', name: 'Mike Johnson', email: 'mike@example.com' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenExcel = async () => {
    await loadBarbers();
    setShowExcelRoster(true);
  };

  // Auto-open modal when in edit mode
  useEffect(() => {
    if (editMode && existingRoster) {
      handleOpenExcel();
    }
  }, [editMode, existingRoster]);

  if (showExcelRoster) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-dubai-black w-full max-w-[90vw] lg:max-w-7xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-dubai-gold/20">
          <div className="p-4 border-b border-dubai-gold/20 flex justify-between items-center bg-dubai-black">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-dubai-gold/10 rounded-lg">
                <Grid3X3 className="w-5 h-5 text-dubai-gold" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-dubai-gold">{editMode ? 'Edit Roster' : 'Roster Management'}</h2>
                <p className="text-xs text-white/60">{editMode ? 'Update weekly schedule' : 'Manage weekly schedules and shifts'}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowExcelRoster(false);
                // If in edit mode, call onRosterUpdate to signal close without changes
                if (editMode && onRosterUpdate) {
                  onRosterUpdate();
                }
              }}
              className="bg-transparent text-white hover:text-dubai-gold hover:bg-white/5 px-4 py-2 rounded-lg flex items-center gap-2 transition-all border border-white/20 hover:border-dubai-gold/50 shadow-sm"
            >
              <X className="w-4 h-4" />
              Close
            </button>
          </div>
          <div className="flex-1 overflow-hidden bg-dubai-black relative">
            <div className="absolute inset-0 overflow-auto p-6">
              <SimpleExcelRoster
                barbers={barbers}
                onSave={onRosterUpdate}
                editMode={editMode}
                existingRoster={existingRoster}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleOpenExcel}
      disabled={loading}
      className="bg-dubai-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-900 disabled:opacity-50 flex items-center gap-2 shadow-lg transition-all"
    >
      <Grid3X3 className="w-5 h-5" />
      {loading ? 'Loading...' : editMode ? 'Edit Roster' : 'Create Excel Roster'}
    </button>
  );
}