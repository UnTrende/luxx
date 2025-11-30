// components/SimpleExcelRoster.tsx
import React, { useState, useEffect } from 'react';
import { Calendar, Save, Copy, Trash2, Plus, Download, Upload, RotateCcw, Clock } from 'lucide-react';
import { api } from '../services/api';

interface Barber {
  id: string;
  name: string;
  email?: string;
}

interface RosterCell {
  barberId: string;
  dayIndex: number;
  startTime: string;
  endTime: string;
  isOff: boolean;
}

interface SimpleExcelRosterProps {
  barbers: Barber[];
  onSave?: () => void;
  editMode?: boolean;
  existingRoster?: any;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function SimpleExcelRoster({ barbers, onSave, editMode = false, existingRoster }: SimpleExcelRosterProps) {
  const [selectedWeek, setSelectedWeek] = useState('');
  const [rosterName, setRosterName] = useState('');
  const [schedule, setSchedule] = useState<RosterCell[]>([]);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Initialize with current week or existing roster data
  useEffect(() => {
    if (editMode && existingRoster) {
      // Load existing roster data
      setRosterName(existingRoster.name || existingRoster.week_start_date);
      setSelectedWeek(existingRoster.week_start_date);

      // Transform shifts to schedule format
      if (existingRoster.shifts && existingRoster.shifts.length > 0) {
        const transformedSchedule: RosterCell[] = existingRoster.shifts.map((shift: any) => {
          // Calculate day index from date
          const shiftDate = new Date(shift.date);
          const weekStart = new Date(existingRoster.week_start_date);
          const dayIndex = Math.floor((shiftDate.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));

          return {
            barberId: shift.barberId,
            dayIndex: dayIndex >= 0 && dayIndex < 7 ? dayIndex : 0,
            startTime: shift.startTime || '09:00',
            endTime: shift.endTime || '17:00',
            isOff: shift.isDayOff || shift.isOff || false
          };
        });
        setSchedule(transformedSchedule);
      } else {
        initializeSchedule();
      }
    } else {
      // Initialize with current week for new roster
      const today = new Date();
      const monday = new Date(today);
      const day = monday.getDay() || 7;
      monday.setDate(monday.getDate() - day + 1);
      const weekString = monday.toISOString().split('T')[0];
      setSelectedWeek(weekString);
      setRosterName(`Roster Week ${monday.toLocaleDateString()}`);

      // Initialize empty schedule
      initializeSchedule();
    }
  }, [barbers, editMode, existingRoster]);

  const initializeSchedule = () => {
    const initialSchedule: RosterCell[] = [];
    barbers.forEach(barber => {
      DAYS.forEach((_, dayIndex) => {
        initialSchedule.push({
          barberId: barber.id,
          dayIndex,
          startTime: '09:00',
          endTime: '17:00',
          isOff: false
        });
      });
    });
    setSchedule(initialSchedule);
  };

  const getCellKey = (barberId: string, dayIndex: number) => `${barberId}-${dayIndex}`;

  const getCell = (barberId: string, dayIndex: number): RosterCell => {
    return schedule.find(cell => cell.barberId === barberId && cell.dayIndex === dayIndex) || {
      barberId,
      dayIndex,
      startTime: '09:00',
      endTime: '17:00',
      isOff: false
    };
  };

  const updateCell = (barberId: string, dayIndex: number, field: keyof RosterCell, value: any) => {
    setSchedule(prev => {
      const newSchedule = [...prev];
      const cellIndex = newSchedule.findIndex(cell =>
        cell.barberId === barberId && cell.dayIndex === dayIndex
      );

      if (cellIndex >= 0) {
        newSchedule[cellIndex] = { ...newSchedule[cellIndex], [field]: value };
      } else {
        newSchedule.push({
          barberId,
          dayIndex,
          startTime: '09:00',
          endTime: '17:00',
          isOff: false,
          [field]: value
        });
      }

      return newSchedule;
    });
  };

  const handleCellClick = (barberId: string, dayIndex: number, ctrlKey: boolean) => {
    const cellKey = getCellKey(barberId, dayIndex);

    if (ctrlKey) {
      const newSelected = new Set(selectedCells);
      if (newSelected.has(cellKey)) {
        newSelected.delete(cellKey);
      } else {
        newSelected.add(cellKey);
      }
      setSelectedCells(newSelected);
    } else {
      setSelectedCells(new Set([cellKey]));
    }
  };

  const applyToSelected = (field: keyof RosterCell, value: any) => {
    selectedCells.forEach(cellKey => {
      const [barberId, dayIndex] = cellKey.split('-');
      updateCell(barberId, parseInt(dayIndex), field, value);
    });
    setSelectedCells(new Set());
  };

  const saveRoster = async () => {
    try {
      setSaving(true);

      // Convert to API format
      const weekStart = new Date(selectedWeek);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const days = DAYS.map((dayName, dayIndex) => {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + dayIndex);

        const shifts = barbers.map(barber => {
          const cell = getCell(barber.id, dayIndex);
          return {
            barberId: barber.id,
            startTime: cell.startTime,
            endTime: cell.endTime,
            isDayOff: cell.isOff,
            notes: ''
          };
        });

        return {
          date: date.toISOString().split('T')[0],
          shifts
        };
      });

      // Use updateRoster if editing, otherwise createRoster
      if (editMode && existingRoster?.id) {
        await api.updateRoster(
          existingRoster.id,
          rosterName,
          selectedWeek,
          weekEnd.toISOString().split('T')[0],
          days
        );
        console.info('Roster updated successfully! ✅');
      } else {
        await api.createRoster(
          rosterName,
          selectedWeek,
          weekEnd.toISOString().split('T')[0],
          days
        );
        console.info('Roster published successfully! ✅');
      }

      if (onSave) onSave();
    } catch (error) {
      console.error('Failed to save roster:', error);
      console.error(`Failed to ${editMode ? 'update' : 'save'} roster. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  const clearAll = () => {
    if (confirm('Clear all shifts? This cannot be undone.')) {
      initializeSchedule();
    }
  };

  const setAllWorkingHours = () => {
    const startTime = prompt('Enter start time (HH:MM):', '09:00');
    const endTime = prompt('Enter end time (HH:MM):', '17:00');

    if (startTime && endTime) {
      setSchedule(prev => prev.map(cell => ({
        ...cell,
        startTime,
        endTime,
        isOff: false
      })));
    }
  };

  return (
    <div className="bg-transparent border border-white/10 rounded-3xl p-8 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-8 gap-6">
        <div>
          <h2 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-3">
            <span className="w-6 h-6 rounded bg-dubai-gold flex items-center justify-center text-dubai-black">
              {editMode ? '✏️' : '📊'}
            </span>
            Roster Command Center
          </h2>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative group">
              <input
                type="text"
                value={rosterName}
                onChange={(e) => setRosterName(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:border-dubai-gold focus:ring-1 focus:ring-dubai-gold transition-all outline-none w-64 text-sm font-medium"
                placeholder="Roster Name"
              />
            </div>
            <div className="relative group">
              <input
                type="date"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-dubai-gold focus:ring-1 focus:ring-dubai-gold transition-all outline-none text-sm font-medium"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={setAllWorkingHours}
            className="bg-transparent text-white border border-white/20 px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2 shadow-sm"
          >
            <Clock className="w-3 h-3 text-dubai-gold" />
            Set All Hours
          </button>

          <button
            onClick={clearAll}
            className="bg-transparent text-red-400 border border-red-500/30 px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/10 transition-all flex items-center gap-2 shadow-sm"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>

          <button
            onClick={saveRoster}
            disabled={saving}
            className="bg-dubai-gold text-dubai-black px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-3 h-3 border-2 border-dubai-black/30 border-t-dubai-black rounded-full animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Save className="w-3 h-3" />
                Publish Roster
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bulk Actions for Selected Cells */}
      {selectedCells.size > 0 && (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white p-4 rounded-xl mb-6 shadow-lg flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-dubai-gold flex items-center justify-center text-dubai-black text-xs font-bold">
              🎯
            </div>
            <h3 className="text-white text-xs font-bold uppercase tracking-widest">
              {selectedCells.size} Cells Selected
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => applyToSelected('isOff', true)}
              className="bg-white/10 text-white border border-white/20 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-red-500/20 hover:text-red-200 transition-all"
            >
              Mark OFF
            </button>
            <button
              onClick={() => applyToSelected('isOff', false)}
              className="bg-white/10 text-white border border-white/20 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-green-500/20 hover:text-green-200 transition-all"
            >
              Mark ON
            </button>
            <div className="w-px h-8 bg-white/20 mx-2" />
            <button
              onClick={() => {
                const time = prompt('Enter start time (HH:MM):', '09:00');
                if (time) applyToSelected('startTime', time);
              }}
              className="bg-white/10 text-white border border-white/20 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-white/20 transition-all"
            >
              Set Start
            </button>
            <button
              onClick={() => {
                const time = prompt('Enter end time (HH:MM):', '17:00');
                if (time) applyToSelected('endTime', time);
              }}
              className="bg-white/10 text-white border border-white/20 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-white/20 transition-all"
            >
              Set End
            </button>
            <button
              onClick={() => setSelectedCells(new Set())}
              className="ml-2 text-white/60 hover:text-white text-[10px] font-bold uppercase tracking-wider underline decoration-white/20 hover:decoration-white/50"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Excel-Style Grid */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Header Row */}
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-4 text-left text-white/60 text-[10px] font-bold uppercase tracking-widest min-w-[150px] sticky left-0 bg-dubai-black z-10 shadow-[2px_0_5px_rgba(0,0,0,0.2)]">
                  Staff Member
                </th>
                {DAYS.map((day, index) => {
                  const date = new Date(selectedWeek);
                  date.setDate(date.getDate() + index);
                  return (
                    <th key={day} className="p-4 text-center border-l border-white/10 min-w-[140px]">
                      <div className="text-[10px] font-bold text-dubai-gold uppercase tracking-widest">{day}</div>
                      <div className="text-[10px] text-white/40 mt-1 font-mono opacity-75">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Data Rows */}
            <tbody className="divide-y divide-white/10">
              {barbers.map((barber, idx) => (
                <tr key={barber.id} className="hover:bg-white/5 transition-colors">
                  {/* Barber Name */}
                  <td className="p-4 border-r border-white/10 sticky left-0 bg-dubai-black z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-dubai-gold font-bold text-xs border border-white/20">
                        {barber.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{barber.name}</div>
                        <div className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">Barber</div>
                      </div>
                    </div>
                  </td>

                  {/* Day Cells */}
                  {DAYS.map((_, dayIndex) => {
                    const cell = getCell(barber.id, dayIndex);
                    const cellKey = getCellKey(barber.id, dayIndex);
                    const isSelected = selectedCells.has(cellKey);

                    return (
                      <td
                        key={dayIndex}
                        className={`p-2 border-l border-white/10 cursor-pointer transition-all relative group ${isSelected
                          ? 'bg-dubai-gold/20 shadow-[inset_0_0_0_1px_rgba(229,197,88,0.5)]'
                          : cell.isOff
                            ? 'bg-red-500/10 hover:bg-red-500/20'
                            : 'hover:bg-white/5'
                          }`}
                        onClick={(e) => handleCellClick(barber.id, dayIndex, e.ctrlKey)}
                      >
                        <div className="flex flex-col gap-2">
                          {/* Off Day Toggle */}
                          <div className="flex justify-center">
                            <label className={`
                              px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all border
                              ${cell.isOff
                                ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
                                : 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30'}
                            `}>
                              <input
                                type="checkbox"
                                checked={cell.isOff}
                                onChange={(e) => updateCell(barber.id, dayIndex, 'isOff', e.target.checked)}
                                className="hidden"
                                onClick={(e) => e.stopPropagation()}
                              />
                              {cell.isOff ? 'OFF' : 'ON'}
                            </label>
                          </div>

                          {/* Working Hours */}
                          {!cell.isOff && (
                            <div className="flex items-center gap-1 justify-center bg-white/5 rounded-lg p-1 border border-white/10 shadow-sm">
                              <input
                                type="time"
                                value={cell.startTime}
                                onChange={(e) => updateCell(barber.id, dayIndex, 'startTime', e.target.value)}
                                className="w-[60px] text-[10px] bg-transparent text-center text-white font-mono focus:text-dubai-gold outline-none"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="text-white/20 text-[10px]">-</span>
                              <input
                                type="time"
                                value={cell.endTime}
                                onChange={(e) => updateCell(barber.id, dayIndex, 'endTime', e.target.value)}
                                className="w-[60px] text-[10px] bg-transparent text-center text-white font-mono focus:text-dubai-gold outline-none"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 flex items-start gap-3 text-xs text-white/60 bg-white/5 p-4 rounded-xl border border-white/10">
        <div className="w-4 h-4 rounded-full bg-dubai-gold/20 flex items-center justify-center text-dubai-gold mt-0.5 flex-shrink-0 text-[10px]">
          💡
        </div>
        <div className="space-y-1">
          <p className="text-dubai-gold font-bold uppercase tracking-wider mb-1">Pro Tips</p>
          <p>• Hold <strong className="text-white">Ctrl/Cmd</strong> to select multiple cells for bulk editing</p>
          <p>• Use "Set All Hours" to quickly apply a standard shift to everyone</p>
        </div>
      </div>
    </div>
  );
}