import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PlusCircle, Home, BarChart2, Lightbulb, Thermometer, Shield, Leaf, LayoutDashboard, LogOut } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [currentFloor, setCurrentFloor] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    // Reset floor to 1 when project changes
    setCurrentFloor(1);
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8000/api/projects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(res.data);
      if (res.data.length > 0) {
        setSelectedProject(res.data[0]);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const ROOM_COLORS_FALLBACK = {
    'Living': '#dbeafe', 'Kitchen': '#fef3c7', 'Dining': '#fce7f3',
    'Entrance': '#e0e7ff', 'Corridor': '#f1f5f9', 'Staircase': '#e2e8f0',
    'Bedroom': '#ede9fe', 'Bathroom': '#ccfbf1', 'Parking': '#e5e7eb',
    'Garden': '#dcfce7', 'Balcony': '#cffafe', 'Utility': '#fef9c3',
  };

  const getRoomColor = (room) => {
    if (room.color) return room.color;
    for (const [key, color] of Object.entries(ROOM_COLORS_FALLBACK)) {
      if (room.type.includes(key)) return color;
    }
    return '#f8fafc';
  };

  const renderFloorPlan = (layout) => {
    if (!layout || !layout.rooms || layout.rooms.length === 0) return <div className="text-slate-500 italic">No floor plan data available</div>;
    
    const floorRooms = layout.rooms.filter(r => r.floor === currentFloor || r.floor === undefined);
    
    if (floorRooms.length === 0) return <div className="text-slate-500 italic">No rooms on this floor</div>;

    const maxX = Math.max(...floorRooms.map(r => r.x + r.w));
    const maxY = Math.max(...floorRooms.map(r => r.y + r.h));
    
    const maxDimension = Math.max(maxX, maxY);
    const scale = maxDimension > 20 ? 700 / maxDimension : 35;
    
    const svgWidth = Math.max(maxX * scale + 20, 300);
    const svgHeight = Math.max(maxY * scale + 20, 200);
    const pad = 10; // padding offset

    // Collect unique room types for legend
    const uniqueTypes = [...new Set(floorRooms.map(r => {
      // Normalise "Bedroom 1" → "Bedroom"
      return r.type.replace(/\s*\d+$/, '');
    }))];
    
    return (
      <div className="space-y-3">
        <div className="overflow-auto border border-slate-200 rounded-xl bg-white p-4 w-full flex justify-center shadow-inner">
          <svg width={svgWidth} height={svgHeight} className="bg-white">
            <defs>
              <pattern id="grid-bg" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-bg)" />

            {/* Plot boundary */}
            <rect 
              x={pad - 2} y={pad - 2} 
              width={maxX * scale + 4} height={maxY * scale + 4} 
              fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="6 3"
              rx="2"
            />

            {/* Rooms */}
            {floorRooms.map((room, idx) => {
              const rx = pad + room.x * scale;
              const ry = pad + room.y * scale;
              const rw = room.w * scale;
              const rh = room.h * scale;
              const fill = getRoomColor(room);

              return (
                <g key={idx}>
                  <rect x={rx} y={ry} width={rw} height={rh}
                    fill={fill} stroke="#475569" strokeWidth="1.5" rx="1"
                  />
                  {/* Door indicator (small gap at the bottom-centre) */}
                  {!room.type.includes('Garden') && !room.type.includes('Parking') && !room.type.includes('Balcony') && rw > 20 && (
                    <rect 
                      x={rx + rw / 2 - 6} y={ry + rh - 1.5}
                      width={12} height={3} fill="white" stroke="#475569" strokeWidth="0.5" rx="1"
                    />
                  )}
                  {/* Room label */}
                  {rw > 28 && rh > 18 && (
                    <>
                      <text x={rx + rw / 2} y={ry + rh / 2 - 5}
                        textAnchor="middle" dominantBaseline="middle"
                        style={{ fontSize: Math.max(8, Math.min(12, rw / 8)), fontWeight: 600, fill: '#1e293b' }}
                      >
                        {room.type}
                      </text>
                      <text x={rx + rw / 2} y={ry + rh / 2 + 10}
                        textAnchor="middle" dominantBaseline="middle"
                        style={{ fontSize: Math.max(7, Math.min(10, rw / 10)), fill: '#64748b' }}
                      >
                        {room.area} sq ft
                      </text>
                    </>
                  )}
                </g>
              );
            })}

            {/* Floor label */}
            <text x={pad} y={svgHeight - 4} style={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}>
              Floor {currentFloor} · {floorRooms.length} rooms
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 px-1">
          {uniqueTypes.map((t) => {
            const sample = floorRooms.find(r => r.type.replace(/\s*\d+$/, '') === t);
            const color = sample ? getRoomColor(sample) : '#f8fafc';
            return (
              <div key={t} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="inline-block w-3 h-3 rounded-sm border border-slate-300" style={{ backgroundColor: color }}></span>
                {t}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getChartData = (floorPlan) => {
    if (!floorPlan) return [];
    return [
      { name: 'Space Utilization', score: floorPlan.space_utilization_score, fill: '#0ea5e9' },
      { name: 'Energy', score: floorPlan.energy_score, fill: '#10b981' },
      { name: 'Ventilation', score: floorPlan.ventilation_score, fill: '#8b5cf6' },
      { name: 'Smart Readiness', score: floorPlan.smart_home_readiness_score, fill: '#f59e0b' },
      { name: 'Sustainability', score: floorPlan.sustainability_score, fill: '#14b8a6' },
    ];
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex shadow-sm">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="bg-brand-500 p-2 rounded-lg shadow-md shadow-brand-500/20">
            <Home className="text-white h-6 w-6" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800">SmartPlan</span>
        </div>
        <div className="p-4 flex-1">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Your Projects</h3>
          <ul className="space-y-2">
            {projects.map(p => (
              <li key={p.id}>
                <button 
                  onClick={() => setSelectedProject(p)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${selectedProject?.id === p.id ? 'bg-brand-50 text-brand-700 border border-brand-100 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
          <button 
            onClick={() => navigate('/wizard')}
            className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-md shadow-slate-900/10"
          >
            <PlusCircle className="h-4 w-4" /> New Project
          </button>
        </div>
        <div className="p-4 border-t border-slate-100">
          <button onClick={handleLogout} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors w-full px-4 py-2 rounded-lg hover:bg-slate-50">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-10 shadow-sm shadow-slate-200/50">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-brand-500" />
            {selectedProject ? selectedProject.name : 'Dashboard'}
          </h1>
          {selectedProject && (
            <button className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors shadow-md shadow-brand-500/20">
              Download PDF Report
            </button>
          )}
        </header>

        <div className="p-8">
          {!selectedProject ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm">
              <div className="bg-slate-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200">
                <LayoutDashboard className="h-8 w-8 text-slate-400" />
              </div>
              <h2 className="text-lg font-medium text-slate-900">No Projects Found</h2>
              <p className="text-slate-500 mt-1 mb-6 max-w-sm mx-auto">Create your first smart home architecture project to get AI-driven floor plans and recommendations.</p>
              <button 
                onClick={() => navigate('/wizard')}
                className="px-5 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 shadow-md shadow-brand-500/20 transition-all hover:-translate-y-0.5"
              >
                Create New Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Floor Plan */}
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-lg font-semibold text-slate-800">AI Generated Floor Plan</h3>
                    <div className="flex gap-3 items-center">
                      {selectedProject.floor_plan?.layout_data?.floors > 1 && (
                        <div className="flex bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                          {Array.from({length: selectedProject.floor_plan.layout_data.floors}).map((_, i) => (
                            <button 
                              key={i}
                              onClick={() => setCurrentFloor(i + 1)}
                              className={`px-3 py-1 text-xs font-semibold transition-colors ${currentFloor === i + 1 ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                              Floor {i + 1}
                            </button>
                          ))}
                        </div>
                      )}
                      <span className="px-3 py-1 bg-brand-100 text-brand-700 text-xs font-bold uppercase tracking-wide rounded-full">
                        {selectedProject.style} Style
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    {renderFloorPlan(selectedProject.floor_plan?.layout_data)}
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-lg font-semibold text-slate-800">Smart Home Integration</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedProject.floor_plan?.recommendations_data.map((rec, i) => (
                        <div key={i} className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-brand-50 hover:border-brand-100 transition-colors group">
                          <div className="mt-1">
                            {rec.type.includes('Light') && <Lightbulb className="h-5 w-5 text-amber-400 group-hover:scale-110 transition-transform" />}
                            {rec.type.includes('Therm') && <Thermometer className="h-5 w-5 text-red-400 group-hover:scale-110 transition-transform" />}
                            {rec.type.includes('Cam') && <Shield className="h-5 w-5 text-brand-500 group-hover:scale-110 transition-transform" />}
                            {rec.type.includes('Solar') && <Leaf className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform" />}
                            {rec.type.includes('Motion') && <BarChart2 className="h-5 w-5 text-indigo-500 group-hover:scale-110 transition-transform" />}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800 text-sm">{rec.type}</h4>
                            <p className="text-xs text-slate-500 font-medium mb-1">Loc: {rec.location}</p>
                            <p className="text-sm text-slate-600">{rec.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Stats */}
              <div className="space-y-8">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                   <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-lg font-semibold text-slate-800">Project Overview</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                      <span className="text-slate-500 text-sm">Plot Dimensions</span>
                      <span className="font-medium text-slate-800">{selectedProject.plot_length}x{selectedProject.plot_width}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                      <span className="text-slate-500 text-sm">Total Area</span>
                      <span className="font-medium text-slate-800">{selectedProject.floor_plan?.total_area} sq ft</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                      <span className="text-slate-500 text-sm">Budget</span>
                      <span className="font-medium text-slate-800">${selectedProject.budget.toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                        <span className="block text-2xl font-bold text-slate-800">{selectedProject.bedrooms}</span>
                        <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Beds</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                        <span className="block text-2xl font-bold text-slate-800">{selectedProject.bathrooms}</span>
                        <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Baths</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-lg font-semibold text-slate-800">AI Analysis Scores</h3>
                  </div>
                  <div className="p-6">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getChartData(selectedProject.floor_plan)} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                          <XAxis type="number" domain={[0, 100]} hide />
                          <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 500}} />
                          <Tooltip 
                            cursor={{fill: '#f1f5f9'}}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
