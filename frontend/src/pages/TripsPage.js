import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Plus, Search, X, CheckCircle, XCircle, Navigation as Nav } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TripsPage = () => {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    cargo_weight: '',
    cargo_description: '',
    vehicle_id: '',
    driver_id: '',
    distance: '0'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tripsRes, vehiclesRes, driversRes] = await Promise.all([
        axios.get(`${API}/trips`),
        axios.get(`${API}/vehicles`),
        axios.get(`${API}/drivers`)
      ]);
      setTrips(tripsRes.data);
      setVehicles(vehiclesRes.data);
      setDrivers(driversRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        cargo_weight: parseFloat(formData.cargo_weight),
        distance: parseFloat(formData.distance)
      };
      await axios.post(`${API}/trips`, payload);
      toast.success('Trip created successfully');
      fetchData();
      closeModal();
    } catch (error) {
      const message = error.response?.data?.detail || 'Operation failed';
      toast.error(message);
    }
  };

  const dispatchTrip = async (tripId) => {
    try {
      await axios.patch(`${API}/trips/${tripId}/dispatch`);
      toast.success('Trip dispatched');
      fetchData();
    } catch (error) {
      toast.error('Failed to dispatch trip');
    }
  };

  const completeTrip = async (tripId) => {
    try {
      await axios.patch(`${API}/trips/${tripId}/complete`);
      toast.success('Trip completed');
      fetchData();
    } catch (error) {
      toast.error('Failed to complete trip');
    }
  };

  const cancelTrip = async (tripId) => {
    if (!window.confirm('Are you sure you want to cancel this trip?')) return;
    try {
      await axios.patch(`${API}/trips/${tripId}/cancel`);
      toast.success('Trip cancelled');
      fetchData();
    } catch (error) {
      toast.error('Failed to cancel trip');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      origin: '',
      destination: '',
      cargo_weight: '',
      cargo_description: '',
      vehicle_id: '',
      driver_id: '',
      distance: '0'
    });
  };

  const availableVehicles = vehicles.filter(v => v.status === 'Ready' && !v.out_of_service);
  const availableDrivers = drivers.filter(d => d.status !== 'Suspended');

  const filteredTrips = trips.filter(t => 
    t.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const styles = {
      'Draft': 'bg-slate-100 text-slate-800 border-slate-200',
      'Dispatched': 'bg-blue-100 text-blue-800 border-blue-200',
      'In Progress': 'bg-purple-100 text-purple-800 border-purple-200',
      'Completed': 'bg-green-100 text-green-800 border-green-200',
      'Cancelled': 'bg-red-100 text-red-800 border-red-200'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getVehicleName = (id) => vehicles.find(v => v.id === id)?.name || 'Unknown';
  const getDriverName = (id) => drivers.find(d => d.id === id)?.name || 'Unknown';

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading trips...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div data-testid="trips-page" className="p-6 md:p-8 max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 font-heading tracking-tight">
              Trip Dispatcher
            </h1>
            <p className="text-sm text-slate-500 mt-2 uppercase tracking-wider">
              Trip Management & Dispatch
            </p>
          </div>
          <button
            data-testid="add-trip-btn"
            onClick={() => setShowModal(true)}
            className="mt-4 md:mt-0 flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-all active:scale-95 shadow-sm font-medium"
          >
            <Plus size={20} />
            <span>Create Trip</span>
          </button>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              data-testid="search-input"
              type="text"
              placeholder="Search by origin or destination..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Origin</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Destination</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Cargo (kg)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Vehicle</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Driver</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTrips.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                      No trips found. Click "Create Trip" to start.
                    </td>
                  </tr>
                ) : (
                  filteredTrips.map((trip) => (
                    <tr key={trip.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-900 font-medium">{trip.origin}</td>
                      <td className="px-4 py-3 text-sm text-slate-900 font-medium">{trip.destination}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{trip.cargo_weight}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{getVehicleName(trip.vehicle_id)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{getDriverName(trip.driver_id)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(trip.status)}`}>
                          {trip.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {trip.status === 'Draft' && (
                            <button
                              data-testid={`dispatch-trip-btn-${trip.id}`}
                              onClick={() => dispatchTrip(trip.id)}
                              className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors font-medium"
                            >
                              Dispatch
                            </button>
                          )}
                          {trip.status === 'Dispatched' && (
                            <button
                              data-testid={`complete-trip-btn-${trip.id}`}
                              onClick={() => completeTrip(trip.id)}
                              className="px-2 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded transition-colors font-medium"
                            >
                              Complete
                            </button>
                          )}
                          {['Draft', 'Dispatched'].includes(trip.status) && (
                            <button
                              data-testid={`cancel-trip-btn-${trip.id}`}
                              onClick={() => cancelTrip(trip.id)}
                              className="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors font-medium"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 font-heading">Create New Trip</h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Origin</label>
                  <input
                    data-testid="trip-origin-input"
                    type="text"
                    required
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    placeholder="New York"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Destination</label>
                  <input
                    data-testid="trip-destination-input"
                    type="text"
                    required
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    placeholder="Boston"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Cargo Weight (kg)</label>
                  <input
                    data-testid="trip-cargo-input"
                    type="number"
                    required
                    step="0.01"
                    value={formData.cargo_weight}
                    onChange={(e) => setFormData({ ...formData, cargo_weight: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    placeholder="5000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Distance (km)</label>
                  <input
                    data-testid="trip-distance-input"
                    type="number"
                    step="0.01"
                    value={formData.distance}
                    onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    placeholder="350"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Cargo Description</label>
                  <input
                    data-testid="trip-description-input"
                    type="text"
                    value={formData.cargo_description}
                    onChange={(e) => setFormData({ ...formData, cargo_description: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    placeholder="Electronics, fragile items"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle</label>
                  <select
                    data-testid="trip-vehicle-select"
                    required
                    value={formData.vehicle_id}
                    onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  >
                    <option value="">Select Vehicle</option>
                    {availableVehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.license_plate}) - {v.max_capacity} kg
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Driver</label>
                  <select
                    data-testid="trip-driver-select"
                    required
                    value={formData.driver_id}
                    onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  >
                    <option value="">Select Driver</option>
                    {availableDrivers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.license_number})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  data-testid="submit-trip-btn"
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all active:scale-95 shadow-sm font-medium"
                >
                  Create Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default TripsPage;