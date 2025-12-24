import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Grid3X3, X, FileSpreadsheet, Save, Loader2 } from 'lucide-react';
import SimpleExcelRoster from './SimpleExcelRoster';
import { api } from '../services/api';
import { logger } from '../src/lib/logger';

interface Barber {
  id: string;
  name: string;
  email?: string;
  user_id?: string;
}

interface ExcelRosterButtonProps {
  onRosterUpdate?: () => void;
  editMode?: boolean;
  existingRoster?: unknown;
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
      const formattedBarbers = barberData.map((barber: unknown) => ({
        id: barber.id || barber.user_id,
        name: barber.name || barber.full_name || 'Unknown',
        email: barber.email || ''
      }));

      setBarbers(formattedBarbers);
    } catch (error) {
      logger.error('Failed to load barbers:', error, 'ExcelRosterButton');
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
    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
        <div className="bg-glass-card w-screen h-screen rounded-none shadow-none overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border-none relative">
          <div className="absolute top-0 right-0 w-full h-32 bg-gradient-to-b from-gold/5 to-transparent pointer-events-none" />

          {/* Header */}
          <div className="p-6 border-b border-white/10 flex justify-between items-center relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gold/10 rounded-xl border border-gold/20 text-gold">
                <Grid3X3 size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-bold text-white">{editMode ? 'Edit Roster' : 'Roster Management'}</h2>
                <p className="text-sm text-subtle-text">{editMode ? 'Update weekly schedule' : 'Manage weekly schedules and shifts'}</p>
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
              className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden relative z-10">
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
      </div>,
      document.body
    );
  }

  return (
    <button
      onClick={handleOpenExcel}
      disabled={loading}
      className="bg-gold text-black px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-white transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
      {loading ? 'Loading...' : editMode ? 'Edit Roster' : 'Create Roster'}
    </button>
  );
}