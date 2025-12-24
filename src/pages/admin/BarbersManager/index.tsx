import React, { useState, useMemo } from 'react';
import { useBarbers } from '../../../hooks/useAdminQueries';
import { AdminSkeleton } from '../../../components/admin/AdminSkeleton';
import { logger } from '../../../../src/lib/logger';

const BarbersManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const {
    barbers,
    isLoading,
    error,
    updateBarberStatus,
    deleteBarber
  } = useBarbers();

  // Filter barbers based on search and status
  const filteredBarbers = useMemo(() => {
    return barbers.filter(barber => {
      const matchesSearch = barber.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        barber.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || barber.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [barbers, searchTerm, statusFilter]);

  if (isLoading) {
    return <AdminSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-red-800">Error Loading Barbers</h3>
        <p className="text-red-600 mt-2">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Barbers Management</h1>
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          + Add New Barber
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search barbers..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="sm:w-48">
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500">Total Barbers</div>
          <div className="text-3xl font-bold">{barbers.length}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500">Active</div>
          <div className="text-3xl font-bold">{barbers.filter(b => b.status === 'active').length}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-500">Pending Approval</div>
          <div className="text-3xl font-bold">{barbers.filter(b => b.status === 'pending').length}</div>
        </div>
      </div>

      {/* Barbers List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barber</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialties</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBarbers.map((barber) => (
                <tr key={barber.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={barber.photo_url || '/placeholder-barber.jpg'}
                        alt={barber.name}
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{barber.name}</div>
                        <div className="text-sm text-gray-500">ID: {barber.id.substring(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{barber.email}</div>
                    <div className="text-sm text-gray-500">{barber.phone || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {barber.specialties?.slice(0, 2).join(', ') || 'None'}
                    </div>
                    {barber.specialties && barber.specialties.length > 2 && (
                      <div className="text-sm text-gray-500">
                        +{barber.specialties.length - 2} more
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${barber.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : barber.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                      {barber.status.charAt(0).toUpperCase() + barber.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      onClick={() => logger.info('Edit barber', barber.id, 'index')}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:text-red-900"
                      onClick={() => deleteBarber(barber.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBarbers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">No barbers found matching your criteria</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BarbersManager;