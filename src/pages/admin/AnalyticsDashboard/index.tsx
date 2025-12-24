import React, { useState, useEffect } from 'react';
// Dummy hook to satisfy build for this unused component
const useAnalytics = (range: string) => ({
  analyticsData: {
    totalRevenue: 0, revenueChange: 0,
    totalBookings: 0, bookingsChange: 0,
    newCustomers: 0, customersChange: 0,
    avgBookingValue: 0, avgValueChange: 0,
    topBarbers: [], popularServices: []
  },
  isLoading: false,
  error: null,
  refetch: () => { }
});

// import { useAnalytics } from '../../hooks/admin/useAnalytics';
import { AdminSkeleton } from '../../../components/admin/AdminSkeleton';

const AnalyticsDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  const {
    analyticsData,
    isLoading,
    error,
    refetch
  } = useAnalytics(dateRange);

  if (isLoading) {
    return <AdminSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-red-800">Error Loading Analytics</h3>
        <p className="text-red-600 mt-2">{error.message}</p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const data = analyticsData || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded-lg ${dateRange === '7d'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            onClick={() => setDateRange('7d')}
          >
            7 Days
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${dateRange === '30d'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            onClick={() => setDateRange('30d')}
          >
            30 Days
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${dateRange === '90d'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            onClick={() => setDateRange('90d')}
          >
            90 Days
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500">Total Revenue</div>
          <div className="text-3xl font-bold text-green-600">
            ${data.totalRevenue?.toFixed(2) || '0.00'}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {data.revenueChange >= 0 ? '+' : ''}{data.revenueChange?.toFixed(1) || '0'}% from last period
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500">Bookings</div>
          <div className="text-3xl font-bold text-blue-600">
            {data.totalBookings || 0}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {data.bookingsChange >= 0 ? '+' : ''}{data.bookingsChange?.toFixed(1) || '0'}% from last period
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500">New Customers</div>
          <div className="text-3xl font-bold text-purple-600">
            {data.newCustomers || 0}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {data.customersChange >= 0 ? '+' : ''}{data.customersChange?.toFixed(1) || '0'}% from last period
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500">Avg. Booking Value</div>
          <div className="text-3xl font-bold text-orange-600">
            ${data.avgBookingValue?.toFixed(2) || '0.00'}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {data.avgValueChange >= 0 ? '+' : ''}{data.avgValueChange?.toFixed(1) || '0'}% from last period
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Revenue Trend</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">📊</div>
              <div>Revenue chart visualization</div>
              <div className="text-sm mt-2">(Chart implementation would go here)</div>
            </div>
          </div>
        </div>

        {/* Bookings Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Bookings Trend</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">📅</div>
              <div>Bookings chart visualization</div>
              <div className="text-sm mt-2">(Chart implementation would go here)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Barbers */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Barbers</h2>
          <div className="space-y-4">
            {(data.topBarbers || []).slice(0, 5).map((barber: any, index: number) => (
              <div key={barber.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold">
                    {index + 1}
                  </div>
                  <div className="ml-3">
                    <div className="font-medium">{barber.name}</div>
                    <div className="text-sm text-gray-500">{barber.bookings} bookings</div>
                  </div>
                </div>
                <div className="text-green-600 font-semibold">
                  ${barber.revenue.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Services */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Popular Services</h2>
          <div className="space-y-4">
            {(data.popularServices || []).slice(0, 5).map((service: any, index: number) => (
              <div key={service.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-800 font-bold">
                    {index + 1}
                  </div>
                  <div className="ml-3">
                    <div className="font-medium">{service.name}</div>
                    <div className="text-sm text-gray-500">{service.bookings} bookings</div>
                  </div>
                </div>
                <div className="text-blue-600 font-semibold">
                  {service.percentage}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;