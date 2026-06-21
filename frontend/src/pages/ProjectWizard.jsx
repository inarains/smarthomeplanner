import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Check, ChevronRight } from 'lucide-react';

export default function ProjectWizard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: 'My Smart Home',
    plot_length: 50,
    plot_width: 30,
    budget: 150000,
    floors: 1,
    bedrooms: 3,
    bathrooms: 2,
    kitchen_open: true,
    parking: 1,
    garden: true,
    style: 'Modern'
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/api/projects', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium transition-colors"
        >
          <ArrowLeft className="h-5 w-5" /> Back to Dashboard
        </button>
        <h1 className="text-xl font-bold text-slate-800">New Project Setup</h1>
        <div className="w-24"></div> {/* Spacer */}
      </header>

      <main className="flex-1 flex justify-center py-10 px-4 sm:px-6">
        <div className="max-w-2xl w-full">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-2xl font-bold text-slate-900">Project Requirements</h2>
              <p className="mt-2 text-slate-500">Provide the details of your plot and requirements to generate an AI-optimized architecture plan.</p>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Basic Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
                    <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Budget ($)</label>
                    <input type="number" name="budget" min="10000" step="5000" required value={formData.budget} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" />
                  </div>
                </div>
              </div>

              {/* Plot Dimensions */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Plot Dimensions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Length (units)</label>
                    <input type="number" name="plot_length" min="20" required value={formData.plot_length} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Width (units)</label>
                    <input type="number" name="plot_width" min="20" required value={formData.plot_width} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" />
                  </div>
                </div>
              </div>

              {/* Rooms & Features */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Rooms & Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Floors</label>
                    <input type="number" name="floors" min="1" max="5" required value={formData.floors} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Bedrooms</label>
                    <input type="number" name="bedrooms" min="1" max="10" required value={formData.bedrooms} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Bathrooms</label>
                    <input type="number" name="bathrooms" min="1" max="10" required value={formData.bathrooms} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Parking Spaces</label>
                    <input type="number" name="parking" min="0" max="5" required value={formData.parking} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Architectural Style</label>
                    <select name="style" value={formData.style} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all bg-white">
                      <option>Modern</option>
                      <option>Traditional</option>
                      <option>Minimalist</option>
                      <option>Luxury</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="kitchen_open" checked={formData.kitchen_open} onChange={handleChange} className="w-4 h-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded" />
                    <span className="text-sm font-medium text-slate-700">Open Kitchen</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="garden" checked={formData.garden} onChange={handleChange} className="w-4 h-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded" />
                    <span className="text-sm font-medium text-slate-700">Include Garden</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button 
                type="submit" 
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 focus:ring-4 focus:ring-brand-500/30 transition-all shadow-md shadow-brand-500/20 disabled:opacity-70"
              >
                {loading ? 'Generating AI Plan...' : 'Generate Architecture Plan'} 
                {!loading && <ChevronRight className="h-5 w-5" />}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
