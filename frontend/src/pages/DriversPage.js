import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DriversPage = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    license_number: '',
    license_expiry: '',
    phone: ''
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await axios.get(`${API}/drivers`);
      setDrivers(response.data);
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
      toast.error('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(formData.phone)) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }
    try {
      if (editingDriver) {
        await axios.put(`${API}/drivers/${editingDriver.id}`, formData);
        toast.success('Driver updated successfully');
      } else {
        await axios.post(`${API}/drivers`, formData);
        toast.success('Driver created successfully');
      }
      fetchDrivers();
      closeModal();
    } catch (error) {
      const message = error.response?.data?.detail || 'Operation failed';
      toast.error(message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this driver?')) return;
    try {
      await axios.delete(`${API}/drivers/${id}`);
      toast.success('Driver deleted successfully');
      fetchDrivers();
    } catch (error) {
      toast.error('Failed to delete driver');
    }
  };

  const handleEdit = (driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      license_number: driver.license_number,
      license_expiry: driver.license_expiry.split('T')[0],
      phone: driver.phone
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDriver(null);
    setFormData({ name: '', license_number: '', license_expiry: '', phone: '' });
  };

  const updateStatus = async (driver, newStatus) => {
    try {
      await axios.patch(`${API}/drivers/${driver.id}/status`, { status: newStatus });
      toast.success('Status updated');
      fetchDrivers();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const filteredDrivers = drivers.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.license_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const styles = {
      'On Duty': 'bg-green-100 text-green-800 border-green-200',
      'Off Duty': 'bg-slate-100 text-slate-800 border-slate-200',
      'Suspended': 'bg-red-100 text-red-800 border-red-200'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading drivers...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div data-testid="drivers-page" className="p-6 md:p-8 max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 font-heading tracking-tight">
              Driver Profiles
            </h1>
            <p className="text-sm text-slate-500 mt-2 uppercase tracking-wider">
              Performance & Safety Management
            </p>
          </div>
          <button
            data-testid="add-driver-btn"
            onClick={() => setShowModal(true)}
            className="mt-4 md:mt-0 flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-all active:scale-95 shadow-sm font-medium"
          >
            <Plus size={20} />
            <span>Add Driver</span>
          </button>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              data-testid="search-input"
              type="text"
              placeholder="Search by name or license..."
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">License #</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Expiry</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Safety Score</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Trips</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                      No drivers found. Click "Add Driver" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredDrivers.map((driver) => (
                    <tr key={driver.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-900 font-medium">{driver.name}</td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-700">{driver.license_number}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{new Date(driver.license_expiry).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{driver.phone}</td>
                      <td className="px-4 py-3">
                        <select
                          value={driver.status}
                          onChange={(e) => updateStatus(driver, e.target.value)}
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(driver.status)}`}
                        >
                          <option value="On Duty">On Duty</option>
                          <option value="Off Duty">Off Duty</option>
                          <option value="Suspended">Suspended</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{driver.safety_score}/100</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{driver.total_trips}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            data-testid={`edit-driver-btn-${driver.id}`}
                            onClick={() => handleEdit(driver)}
                            className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Edit size={16} className="text-slate-600" />
                          </button>
                          <button
                            data-testid={`delete-driver-btn-${driver.id}`}
                            onClick={() => handleDelete(driver.id)}
                            className="p-1.5 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={16} className="text-red-600" />
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 font-heading">
                {editingDriver ? 'Edit Driver' : 'Add New Driver'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                  <input
                    data-testid="driver-name-input"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">License Number</label>
                  <input
                    data-testid="driver-license-input"
                    type="text"
                    required
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">License Expiry</label>
                  <input
                    data-testid="driver-expiry-input"
                    type="date"
                    required
                    value={formData.license_expiry}
                    onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                  <input
                    data-testid="driver-phone-input"
                    type="tel"
                    required
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 10) {
                        setFormData({ ...formData, phone: value });
                      }
                    }}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    placeholder="10 digit number"
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
                  data-testid="submit-driver-btn"
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all active:scale-95 shadow-sm font-medium"
                >
                  {editingDriver ? 'Update Driver' : 'Create Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default DriversPage;