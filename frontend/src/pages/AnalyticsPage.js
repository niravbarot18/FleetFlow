import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Download, TrendingUp, DollarSign } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AnalyticsPage = () => {
  const [vehicleCosts, setVehicleCosts] = useState([]);
  const [fuelTrends, setFuelTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [costsRes, trendsRes] = await Promise.all([
        axios.get(`${API}/analytics/vehicle-costs`),
        axios.get(`${API}/analytics/fuel-trends`)
      ]);
      setVehicleCosts(costsRes.data);
      setFuelTrends(trendsRes.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (type) => {
    try {
      const response = await axios.get(`${API}/reports/export?report_type=${type}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`${type} report downloaded`);
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const totalCosts = vehicleCosts.reduce((sum, v) => sum + v.total_cost, 0);
  const totalMaintenance = vehicleCosts.reduce((sum, v) => sum + v.maintenance_cost, 0);
  const totalFuel = vehicleCosts.reduce((sum, v) => sum + v.fuel_cost, 0);
  const avgFuelEfficiency = vehicleCosts.length > 0
    ? vehicleCosts.reduce((sum, v) => sum + v.fuel_efficiency, 0) / vehicleCosts.length
    : 0;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading analytics...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div data-testid="analytics-page" className="p-6 md:p-8 max-w-[1600px] mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 font-heading tracking-tight">
            Analytics & Reports
          </h1>
          <p className="text-sm text-slate-500 mt-2 uppercase tracking-wider">
            Operational Insights & Financial Reports
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Costs</p>
              <DollarSign className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900 font-heading">${totalCosts.toFixed(2)}</p>
            <p className="text-sm text-slate-600 mt-1">All expenses</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Fuel Costs</p>
              <DollarSign className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900 font-heading">${totalFuel.toFixed(2)}</p>
            <p className="text-sm text-slate-600 mt-1">Total fuel spend</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Maintenance</p>
              <DollarSign className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900 font-heading">${totalMaintenance.toFixed(2)}</p>
            <p className="text-sm text-slate-600 mt-1">Service costs</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Avg Efficiency</p>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900 font-heading">{avgFuelEfficiency.toFixed(1)}</p>
            <p className="text-sm text-slate-600 mt-1">km per liter</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Fuel Trends Chart */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900 font-heading mb-4">Fuel Cost Trends</h3>
            {fuelTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={fuelTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#64748b" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Legend />
                  <Line type="monotone" dataKey="total_cost" stroke="#f97316" strokeWidth={2} name="Total Cost ($)" />
                  <Line type="monotone" dataKey="total_liters" stroke="#3b82f6" strokeWidth={2} name="Total Liters" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                No fuel data available
              </div>
            )}
          </div>

          {/* Vehicle Costs Chart */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900 font-heading mb-4">Vehicle Operational Costs</h3>
            {vehicleCosts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={vehicleCosts.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="vehicle_name" tick={{ fontSize: 12 }} stroke="#64748b" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Legend />
                  <Bar dataKey="maintenance_cost" fill="#ef4444" name="Maintenance" />
                  <Bar dataKey="fuel_cost" fill="#3b82f6" name="Fuel" />
                  <Bar dataKey="other_expenses" fill="#f59e0b" name="Other" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                No vehicle cost data available
              </div>
            )}
          </div>
        </div>

        {/* Vehicle Costs Table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900 font-heading">Vehicle Cost Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Vehicle</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Plate</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Maintenance</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fuel</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Other</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Cost</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Efficiency</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Trips</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehicleCosts.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                      No cost data available.
                    </td>
                  </tr>
                ) : (
                  vehicleCosts.map((vehicle) => (
                    <tr key={vehicle.vehicle_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-900 font-medium">{vehicle.vehicle_name}</td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-700">{vehicle.license_plate}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">${vehicle.maintenance_cost.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">${vehicle.fuel_cost.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">${vehicle.other_expenses.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-slate-900 font-semibold">${vehicle.total_cost.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{vehicle.fuel_efficiency.toFixed(1)} km/L</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{vehicle.total_trips}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Export Section */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900 font-heading mb-4">Export Reports</h3>
          <p className="text-sm text-slate-600 mb-6">Download CSV reports for external analysis</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              data-testid="export-vehicles-btn"
              onClick={() => exportReport('vehicles')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
            >
              <Download size={18} />
              <span>Vehicles</span>
            </button>
            <button
              data-testid="export-drivers-btn"
              onClick={() => exportReport('drivers')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
            >
              <Download size={18} />
              <span>Drivers</span>
            </button>
            <button
              data-testid="export-trips-btn"
              onClick={() => exportReport('trips')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
            >
              <Download size={18} />
              <span>Trips</span>
            </button>
            <button
              data-testid="export-costs-btn"
              onClick={() => exportReport('costs')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all active:scale-95 shadow-sm font-medium"
            >
              <Download size={18} />
              <span>Costs</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AnalyticsPage;