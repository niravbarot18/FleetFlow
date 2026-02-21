import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Plus, X, Fuel, Receipt } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const FuelExpensesPage = () => {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenseLogs, setExpenseLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('fuel');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('fuel');
  const [fuelFormData, setFuelFormData] = useState({
    vehicle_id: '',
    liters: '',
    cost: '',
    date: new Date().toISOString().split('T')[0],
    odometer_reading: ''
  });
  const [expenseFormData, setExpenseFormData] = useState({
    vehicle_id: '',
    expense_type: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [fuelRes, expenseRes, vehiclesRes] = await Promise.all([
        axios.get(`${API}/fuel-logs`),
        axios.get(`${API}/expense-logs`),
        axios.get(`${API}/vehicles`)
      ]);
      setFuelLogs(fuelRes.data);
      setExpenseLogs(expenseRes.data);
      setVehicles(vehiclesRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleFuelSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...fuelFormData,
        liters: parseFloat(fuelFormData.liters),
        cost: parseFloat(fuelFormData.cost),
        odometer_reading: parseFloat(fuelFormData.odometer_reading)
      };
      await axios.post(`${API}/fuel-logs`, payload);
      toast.success('Fuel log created');
      fetchData();
      closeModal();
    } catch (error) {
      const message = error.response?.data?.detail || 'Operation failed';
      toast.error(message);
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...expenseFormData,
        amount: parseFloat(expenseFormData.amount)
      };
      await axios.post(`${API}/expense-logs`, payload);
      toast.success('Expense log created');
      fetchData();
      closeModal();
    } catch (error) {
      const message = error.response?.data?.detail || 'Operation failed';
      toast.error(message);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFuelFormData({
      vehicle_id: '',
      liters: '',
      cost: '',
      date: new Date().toISOString().split('T')[0],
      odometer_reading: ''
    });
    setExpenseFormData({
      vehicle_id: '',
      expense_type: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const getVehicleName = (id) => vehicles.find(v => v.id === id)?.name || 'Unknown';

  const openModal = (type) => {
    setModalType(type);
    setShowModal(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading logs...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div data-testid="fuel-expenses-page" className="p-6 md:p-8 max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 font-heading tracking-tight">
              Fuel & Expenses
            </h1>
            <p className="text-sm text-slate-500 mt-2 uppercase tracking-wider">
              Financial Tracking
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-slate-200">
          <div className="flex gap-4">
            <button
              data-testid="fuel-tab"
              onClick={() => setActiveTab('fuel')}
              className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'fuel'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Fuel Logs
            </button>
            <button
              data-testid="expenses-tab"
              onClick={() => setActiveTab('expenses')}
              className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'expenses'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Other Expenses
            </button>
          </div>
        </div>

        {/* Fuel Logs Tab */}
        {activeTab === 'fuel' && (
          <div>
            <div className="mb-4 flex justify-end">
              <button
                data-testid="add-fuel-btn"
                onClick={() => openModal('fuel')}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-all active:scale-95 shadow-sm font-medium"
              >
                <Plus size={20} />
                <span>Add Fuel Log</span>
              </button>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Vehicle</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Liters</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Price/L</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Odometer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fuelLogs.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                          No fuel logs found. Click "Add Fuel Log" to create one.
                        </td>
                      </tr>
                    ) : (
                      fuelLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-slate-900 font-medium">{getVehicleName(log.vehicle_id)}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{new Date(log.date).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{log.liters.toFixed(2)} L</td>
                          <td className="px-4 py-3 text-sm text-slate-900 font-semibold">₹{log.cost.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">₹{(log.cost / log.liters).toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{log.odometer_reading.toFixed(0)} km</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <div>
            <div className="mb-4 flex justify-end">
              <button
                data-testid="add-expense-btn"
                onClick={() => openModal('expense')}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-all active:scale-95 shadow-sm font-medium"
              >
                <Plus size={20} />
                <span>Add Expense</span>
              </button>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Vehicle</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenseLogs.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                          No expense logs found. Click "Add Expense" to create one.
                        </td>
                      </tr>
                    ) : (
                      expenseLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-slate-900 font-medium">{getVehicleName(log.vehicle_id)}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{new Date(log.date).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{log.expense_type}</td>
                          <td className="px-4 py-3 text-sm text-slate-900 font-semibold">₹{log.amount.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{log.notes || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 font-heading">
                {modalType === 'fuel' ? 'Add Fuel Log' : 'Add Expense'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded transition-colors">
                <X size={20} />
              </button>
            </div>
            
            {modalType === 'fuel' ? (
              <form onSubmit={handleFuelSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle</label>
                    <select
                      data-testid="fuel-vehicle-select"
                      required
                      value={fuelFormData.vehicle_id}
                      onChange={(e) => setFuelFormData({ ...fuelFormData, vehicle_id: e.target.value })}
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
                    <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                    <input
                      data-testid="fuel-date-input"
                      type="date"
                      required
                      value={fuelFormData.date}
                      onChange={(e) => setFuelFormData({ ...fuelFormData, date: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Liters</label>
                    <input
                      data-testid="fuel-liters-input"
                      type="number"
                      required
                      step="0.01"
                      value={fuelFormData.liters}
                      onChange={(e) => setFuelFormData({ ...fuelFormData, liters: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Cost (₹)</label>
                    <input
                      data-testid="fuel-cost-input"
                      type="number"
                      required
                      step="0.01"
                      value={fuelFormData.cost}
                      onChange={(e) => setFuelFormData({ ...fuelFormData, cost: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Odometer Reading (km)</label>
                    <input
                      data-testid="fuel-odometer-input"
                      type="number"
                      required
                      step="0.01"
                      value={fuelFormData.odometer_reading}
                      onChange={(e) => setFuelFormData({ ...fuelFormData, odometer_reading: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
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
                    data-testid="submit-fuel-btn"
                    type="submit"
                    className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all active:scale-95 shadow-sm font-medium"
                  >
                    Add Fuel Log
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleExpenseSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle</label>
                    <select
                      data-testid="expense-vehicle-select"
                      required
                      value={expenseFormData.vehicle_id}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, vehicle_id: e.target.value })}
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
                    <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                    <input
                      data-testid="expense-date-input"
                      type="date"
                      required
                      value={expenseFormData.date}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, date: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Expense Type</label>
                    <select
                      data-testid="expense-type-select"
                      required
                      value={expenseFormData.expense_type}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, expense_type: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    >
                      <option value="">Select Type</option>
                      <option value="Insurance">Insurance</option>
                      <option value="Registration">Registration</option>
                      <option value="Parking">Parking</option>
                      <option value="Tolls">Tolls</option>
                      <option value="Cleaning">Cleaning</option>
                      <option value="Parts">Parts</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Amount (₹)</label>
                    <input
                      data-testid="expense-amount-input"
                      type="number"
                      required
                      step="0.01"
                      value={expenseFormData.amount}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                    <textarea
                      data-testid="expense-notes-input"
                      value={expenseFormData.notes}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, notes: e.target.value })}
                      rows="3"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
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
                    data-testid="submit-expense-btn"
                    type="submit"
                    className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all active:scale-95 shadow-sm font-medium"
                  >
                    Add Expense
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default FuelExpensesPage;