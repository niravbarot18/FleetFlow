import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    license_plate: '',
    vehicle_type: 'Truck',
    max_capacity: '',
    odometer: '0'
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await axios.get(`${API}/vehicles`);
      setVehicles(response.data);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        max_capacity: parseFloat(formData.max_capacity),
        odometer: parseFloat(formData.odometer)
      };

      if (editingVehicle) {
        await axios.put(`${API}/vehicles/${editingVehicle.id}`, payload);
        toast.success('Vehicle updated successfully');
      } else {
        await axios.post(`${API}/vehicles`, payload);
        toast.success('Vehicle created successfully');
      }

      fetchVehicles();
      closeModal();
    } catch (error) {
      const message = error.response?.data?.detail || 'Operation failed';
      toast.error(message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;

    try {
      await axios.delete(`${API}/vehicles/${id}`);
      toast.success('Vehicle deleted successfully');
      fetchVehicles();
    } catch (error) {
      toast.error('Failed to delete vehicle');
    }
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      name: vehicle.name,
      model: vehicle.model,
      license_plate: vehicle.license_plate,
      vehicle_type: vehicle.vehicle_type,
      max_capacity: vehicle.max_capacity.toString(),
      odometer: vehicle.odometer.toString()
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingVehicle(null);
    setFormData({
      name: '',
      model: '',
      license_plate: '',
      vehicle_type: 'Truck',
      max_capacity: '',
      odometer: '0'
    });
  };

  const toggleOutOfService = async (vehicle) => {
    try {
      await axios.patch(`${API}/vehicles/${vehicle.id}/status`, {
        out_of_service: !vehicle.out_of_service
      });
      toast.success('Vehicle status updated');
      fetchVehicles();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const filteredVehicles = vehicles.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const styles = {
      'Ready': 'bg-green-100 text-green-800 border-green-200',
      'On Trip': 'bg-blue-100 text-blue-800 border-blue-200',
      'In Shop': 'bg-red-100 text-red-800 border-red-200',
      'Retired': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading vehicles...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div data-testid="vehicles-page" className="p-6 md:p-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 font-heading tracking-tight">
              Vehicle Registry
            </h1>
            <p className="text-sm text-slate-500 mt-2 uppercase tracking-wider">
              Asset Management
            </p>
          </div>
          <button
            data-testid="add-vehicle-btn"
            onClick={() => setShowModal(true)}
            className="mt-4 md:mt-0 flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-all active:scale-95 shadow-sm font-medium"
          >
            <Plus size={20} />
            <span>Add Vehicle</span>
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              data-testid="search-input"
              type="text"
              placeholder="Search by name, plate, or model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Model</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Plate</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Capacity (kg)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Odometer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                      No vehicles found. Click "Add Vehicle" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-900 font-medium">{vehicle.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{vehicle.model}</td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-700">{vehicle.license_plate}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{vehicle.vehicle_type}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{vehicle.max_capacity}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{vehicle.odometer.toFixed(0)} km</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(vehicle.status)}`}>
                          {vehicle.out_of_service ? 'Out of Service' : vehicle.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            data-testid={`edit-vehicle-btn-${vehicle.id}`}
                            onClick={() => handleEdit(vehicle)}
                            className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} className="text-slate-600" />
                          </button>
                          <button
                            data-testid={`delete-vehicle-btn-${vehicle.id}`}
                            onClick={() => handleDelete(vehicle.id)}
                            className="p-1.5 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                          <button
                            onClick={() => toggleOutOfService(vehicle)}
                            className="px-2 py-1 text-xs font-medium hover:bg-slate-100 rounded transition-colors"
                          >
                            {vehicle.out_of_service ? 'Activate' : 'Retire'}
                          </button>
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 font-heading">
                {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-slate-100 rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle Name</label>
                  <input
                    data-testid="vehicle-name-input"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    placeholder="Fleet Truck 01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Model</label>
                  <input
                    data-testid="vehicle-model-input"
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    placeholder="Scania R450"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">License Plate</label>
                  <input
                    data-testid="vehicle-plate-input"
                    type="text"
                    required
                    value={formData.license_plate}
                    onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-mono"
                    placeholder="ABC-1234"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle Type</label>
                  <select
                    data-testid="vehicle-type-select"
                    value={formData.vehicle_type}
                    onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  >
                    <option value="Truck">Truck</option>
                    <option value="Van">Van</option>
                    <option value="Bike">Bike</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Max Capacity (kg)</label>
                  <input
                    data-testid="vehicle-capacity-input"
                    type="number"
                    required
                    step="0.01"
                    value={formData.max_capacity}
                    onChange={(e) => setFormData({ ...formData, max_capacity: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    placeholder="10000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Odometer (km)</label>
                  <input
                    data-testid="vehicle-odometer-input"
                    type="number"
                    required
                    step="0.01"
                    value={formData.odometer}
                    onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    placeholder="0"
                  />
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
                  data-testid="submit-vehicle-btn"
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all active:scale-95 shadow-sm font-medium"
                >
                  {editingVehicle ? 'Update Vehicle' : 'Create Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default VehiclesPage;