import React, { useState, useMemo } from 'react';
import { List } from 'react-window';
import { useBookingsData } from '../../../hooks/admin/useBookingsData';
// We'll create these components later
// import { BookingCard } from '../../../components/admin/BookingCard';
// import { BookingFilters } from '../../../components/admin/BookingFilters';
// import { BookingStats } from '../../../components/admin/BookingStats';

const BookingsManager: React.FC = () => {
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: { start: null, end: null },
    barberId: null,
    search: '',
  });
  
  const [activeTab, setActiveTab] = useState<'upcoming' | 'today' | 'past'>('today');

  // Use the custom hook (will be implemented next)
  const { 
    bookings, 
    stats, 
    isLoading, 
    error,
    updateBookingStatus,
    deleteBooking 
  } = useBookingsData(filters, activeTab);

  // Virtualized list renderer
  const BookingList = useMemo(() => {
    if (isLoading) {
      return <div className="space-y-4">Loading bookings...</div>;
    }

    if (error) {
      return <div className="text-red-600">Error: {error.message}</div>;
    }

    // Row renderer for react-window
    const RowComponent = ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const booking = bookings[index];
      return (
        <div style={style} className="px-4 py-2 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold">{booking.id || 'Unknown Booking'}</h3>
              <p className="text-gray-600">Customer ID: {booking.userId || 'Unknown Customer'}</p>
              <p className="text-gray-600">Barber ID: {booking.barberId || 'Unknown Barber'}</p>
              <p className="text-gray-600">{new Date(booking.date).toLocaleString()}</p>
            </div>
            <div className="flex gap-2">
              <button 
                className="px-3 py-1 bg-blue-500 text-white rounded"
                onClick={() => updateBookingStatus && updateBookingStatus({ bookingId: booking.id, status: 'confirmed' })}
              >
                Confirm
              </button>
              <button 
                className="px-3 py-1 bg-red-500 text-white rounded"
                onClick={() => deleteBooking && deleteBooking(booking.id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      );
    };

    return (
      <List<{}>
        rowComponent={RowComponent}
        rowCount={bookings.length}
        rowHeight={120}
        height={600}
        width="100%"
        rowProps={{}}
      />
    );
  }, [bookings, isLoading, error, updateBookingStatus, deleteBooking]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Bookings Manager</h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg">
            + New Booking
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Overview - placeholder for now */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Today's Bookings</h3>
          <p className="text-2xl">{stats.today || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">This Week</h3>
          <p className="text-2xl">{stats.thisWeek || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Pending</h3>
          <p className="text-2xl">{stats.pending || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Revenue Today</h3>
          <p className="text-2xl">${stats.revenueToday || 0}</p>
        </div>
      </div>

      {/* Filters - placeholder for now */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">Filters</h3>
        <div className="flex gap-4">
          <select 
            className="border p-2 rounded"
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-6">
          {(['upcoming', 'today', 'past'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 font-medium ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded-full">
                {bookings.filter((b: unknown) => {
                  if (tab === 'today') return b.isToday;
                  if (tab === 'upcoming') return b.isUpcoming;
                  return b.isPast;
                }).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-lg shadow">
        {BookingList}
      </div>
    </div>
  );
};

export default BookingsManager;