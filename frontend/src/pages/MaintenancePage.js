import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Plus, X, Wrench } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MaintenancePage = () => {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    service_date: new Date().toISOString().split('T')[0],
    service_type: '',
    cost: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [logsRes, vehiclesRes] = await Promise.all([
        axios.get(`${API}/maintenance`),
        axios.get(`${API}/vehicles`)
      ]);
      setLogs(logsRes.data);
      setVehicles(vehiclesRes.data);
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
        cost: parseFloat(formData.cost)
      };
      await axios.post(`${API}/maintenance`, payload);
      toast.success('Maintenance log created');
      fetchData();
      closeModal();
    } catch (error) {
      const message = error.response?.data?.detail || 'Operation failed';
      toast.error(message);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      vehicle_id: '',
      service_date: new Date().toISOString().split('T')[0],
      service_type: '',
      cost: '',
      notes: ''
    });
  };

  const getVehicleName = (id) => vehicles.find(v => v.id === id)?.name || 'Unknown';

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading maintenance logs...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div data-testid="maintenance-page" className="p-6 md:p-8 max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 font-heading tracking-tight">
              Maintenance & Service
            </h1>
            <p className="text-sm text-slate-500 mt-2 uppercase tracking-wider">
              Vehicle Health Tracking
            </p>
          </div>
          <button
            data-testid="add-maintenance-btn"
            onClick={() => setShowModal(true)}
            className="mt-4 md:mt-0 flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-all active:scale-95 shadow-sm font-medium"
          >
            <Plus size={20} />
            <span>Add Service Log</span>
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Vehicle</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Service Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Service Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Cost</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                      No maintenance logs found. Click "Add Service Log" to create one.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-900 font-medium">{getVehicleName(log.vehicle_id)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{new Date(log.service_date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{log.service_type}</td>
                      <td className="px-4 py-3 text-sm text-slate-900 font-semibold">${log.cost.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{log.notes || '-'}</td>
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
              <h2 className="text-2xl font-bold text-slate-900 font-heading">Add Maintenance Log</h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle</label>
                  <select
                    data-testid="maintenance-vehicle-select"
                    required
                    value={formData.vehicle_id}
                    onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.license_plate})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Service Date</label>
                  <input
                    data-testid="maintenance-date-input"
                    type="date"
                    required
                    value={formData.service_date}
                    onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Service Type</label>
                  <select
                    data-testid="maintenance-type-select"
                    required
                    value={formData.service_type}
                    onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  >
                    <option value="">Select Type</option>
                    <option value="Oil Change">Oil Change</option>
                    <option value="Tire Replacement">Tire Replacement</option>
                    <option value="Engine Repair">Engine Repair</option>
                    <option value="Brake Service">Brake Service</option>
                    <option value="Transmission Repair">Transmission Repair</option>
                    <option value="General Inspection">General Inspection</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Cost ($)</label>
                  <input
                    data-testid="maintenance-cost-input"
                    type="number"
                    required
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    placeholder="150.00"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                  <textarea
                    data-testid="maintenance-notes-input"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    placeholder="Additional notes..."
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
                  data-testid="submit-maintenance-btn"
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all active:scale-95 shadow-sm font-medium"
                >
                  Add Service Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MaintenancePage;