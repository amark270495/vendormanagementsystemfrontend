import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import { usePermissions } from '../hooks/usePermissions';

// --- Safe Date Formatter (Fallback if helper is missing) ---
const formatDate = (dateStr) => {
    if (!dateStr || dateStr === 'N/A') return 'N/A';
    try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return dateStr; }
};

// --- Crisp SVG Icons ---
const BriefcaseIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>;
const MapPinIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>;
const ClockIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
const RefreshIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>;
const DotsHorizontal = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>;

// --- Styling Helpers ---
const getUrgency = (dateInput) => {
    if (!dateInput || dateInput === 'N/A') return { label: 'Ongoing Tracking', text: 'text-slate-500', bar: 'bg-slate-300' };
    const diffDays = Math.ceil((new Date(dateInput) - new Date()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) return { label: 'Critical Due', text: 'text-rose-600', bar: 'bg-rose-500' };
    if (diffDays <= 5) return { label: 'Approaching SLA', text: 'text-amber-600', bar: 'bg-amber-400' };
    return { label: 'Healthy Baseline', text: 'text-emerald-600', bar: 'bg-emerald-400' };
};

const getAvatar = (nameStr) => {
    const name = String(nameStr || '').trim() || '?';
    const parts = name.split(/\s+/).filter(Boolean);
    let initials = parts.length > 1 ? parts[0].charAt(0) + parts[parts.length - 1].charAt(0) : parts[0].substring(0, 2);
    
    const colors = [ 'bg-[#eff6ff] text-[#2563eb]', 'bg-[#f5f3ff] text-[#7c3aed]', 'bg-[#ecfdf5] text-[#0d9488]', 'bg-[#fef2f2] text-[#e11d48]', 'bg-[#fffbeb] text-[#d97706]', 'bg-[#f0fdf4] text-[#0f766e]'];
    const colIdx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
    
    return { initials: initials.toUpperCase(), color: colors[colIdx] };
};

export default function HomePage() {
    const { user } = useAuth();
    const { canViewDashboards, canEditDashboard } = usePermissions();
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [drawerJob, setDrawerJob] = useState(null);
    const [jobCandidates, setJobCandidates] = useState([]);
    
    const stats = useMemo(() => {
        let total = 0, urgent = 0;
        Object.values(data).flat().forEach(j => {
            total++;
            if (getUrgency(j.deadline).label === 'Critical Due') urgent++;
        });
        return { total, urgent };
    }, [data]);

    const fetchData = useCallback(async () => {
        if (!user?.userIdentifier || !canViewDashboards) { setLoading(false); return; }
        setLoading(true);
        try {
            const res = await apiService.getHomePageData(user.userIdentifier);
            if (res.data?.success) setData(res.data.data);
        } catch (e) {
            console.error("Dashboard Load Exception: ", e);
        } finally { 
            setLoading(false); 
        }
    }, [user, canViewDashboards]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        if (drawerJob) {
            apiService.getCandidateDetailsPageData(user.userIdentifier).then(res => {
                if (res.data?.success) setJobCandidates(res.data.candidates.filter(c => c.postingId === drawerJob.postingId));
            }).catch(() => setJobCandidates([]));
        } else {
            setJobCandidates([]);
        }
    }, [drawerJob, user]);

    // Live Grid Indexer filtering algorithm
    const workspaceMatrix = useMemo(() => {
        if (!searchTerm.trim()) return data;
        const q = searchTerm.toLowerCase();
        let matrix = {};
        Object.entries(data).forEach(([group, jobs]) => {
            const filtered = jobs.filter(j => 
                 j.jobTitle?.toLowerCase().includes(q) || 
                 j.clientName?.toLowerCase().includes(q) || 
                 j.postingId?.toLowerCase().includes(q)
            );
            if (filtered.length > 0) matrix[group] = filtered;
        });
        return matrix;
    }, [data, searchTerm]);

    const handleArchive = async (e, id) => {
        e.stopPropagation();
        if (canEditDashboard && window.confirm(`Archive Requirement Tracker '${id}'?`)) {
            try {
                await apiService.archiveOrDeleteJob({ postingIds: [id], actionType: 'archive', authenticatedUsername: user.userIdentifier });
                fetchData();
                if(drawerJob?.postingId === id) setDrawerJob(null);
            } catch (err) { alert("Archive Failed: " + err?.message); }
        }
    }

    if (!canViewDashboards) return (
        <div className="flex h-screen items-center justify-center bg-slate-50">
             <div className="p-8 text-center border-l-4 border-rose-500 bg-white rounded-lg shadow-xl text-slate-700 font-semibold tracking-wide">
                 System Policy Enforcement. Missing DB View Authorizations.
             </div>
        </div>
    );

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-100 font-sans text-left text-sm relative selection:bg-indigo-500 selection:text-white">
            
            {/* PBI DARK METRICS SLICER PANEL (LEFT NAVIGATION) */}
            <div className="w-[300px] shrink-0 bg-[#0F172A] flex flex-col p-6 shadow-2xl relative z-20 hidden lg:flex overflow-y-auto">
                 <h2 className="text-xl font-black tracking-tight text-white mb-2 leading-snug">Global Work Tracker</h2>
                 <p className="text-slate-400 font-semibold mb-10 text-[11px] uppercase tracking-widest border-b border-slate-700/50 pb-5">Orchestrator Scope</p>

                 <div className="mb-8 p-5 bg-[#1E293B] border border-slate-700 rounded-xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-2 h-full bg-[#38BDF8]" />
                     <p className="text-[#38BDF8] text-[10px] font-black uppercase tracking-widest mb-3">Live Active Flow</p>
                     <div className="flex space-x-3 text-white mb-2">
                          <span className="font-extrabold text-5xl tracking-tighter">{stats.total}</span>
                          <div className="flex flex-col justify-center text-slate-400 leading-tight">
                               <span className="font-bold text-xs text-white">Target Reqs</span>
                               <span className="text-[10px] uppercase font-semibold">Active Cycle</span>
                          </div>
                     </div>
                 </div>

                 <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl mb-6 relative overflow-hidden">
                      <div className="absolute -right-6 -bottom-6 opacity-10">
                          <ClockIcon className="w-24 h-24 text-rose-500" />
                      </div>
                      <p className="text-rose-400 text-xs font-black uppercase tracking-widest mb-1 relative z-10">SLA Burn Rate</p>
                      <p className="text-rose-100 font-semibold text-[13px] leading-tight mt-3 relative z-10">
                         {stats.urgent} Reqs hitting submission lock within <strong className="text-white bg-rose-600 px-1 rounded mx-0.5">24h</strong>.
                      </p>
                 </div>

                 <div className="mt-auto pb-4">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 block">Quick Visual Index Search</label>
                    <input
                        type="text" placeholder="Trace ID, Title, Client..."
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#0b101d] border border-slate-700 text-white rounded-lg text-sm font-semibold focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none placeholder-slate-500 shadow-inner transition"
                    />
                 </div>
            </div>

            {/* HORIZONTAL TEAM KANBAN BOARDS (MIDDLE AREA) */}
            <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-50/50">
                <div className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0 shadow-sm z-10">
                     <h2 className="text-slate-800 font-extrabold text-base tracking-tight hidden md:block">Requirement Distribution Grid</h2>
                     <button onClick={fetchData} className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg shadow-sm font-bold transition flex items-center space-x-2 text-[13px] border border-indigo-200/50">
                         <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}/> <span>Reload Stream</span>
                     </button>
                </div>

                <div className="flex-1 overflow-x-auto overflow-y-hidden pt-4 pb-2 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-blend-soft-light">
                    <div className="flex items-start px-6 space-x-5 h-full">
                        {loading ? (
                            <div className="mx-auto mt-40 flex flex-col items-center">
                                 <Spinner size="8"/>
                                 <span className="mt-4 font-bold text-indigo-700 tracking-wider text-xs">HYDRATING GRIDS...</span>
                            </div>
                        ) : Object.keys(workspaceMatrix).length === 0 ? (
                            <div className="m-auto font-medium text-slate-400">No parameters matching structural search constraint.</div>
                        ) : Object.entries(workspaceMatrix).map(([team, jobs]) => (
                            <div key={team} className="w-[320px] shrink-0 bg-[#F1F5F9]/80 backdrop-blur-md rounded-2xl flex flex-col h-[calc(100vh-140px)] shadow-sm border border-slate-200 overflow-hidden">
                                 
                                 {/* Column Board Header */}
                                 <div className="p-4 border-b border-slate-200/60 bg-white/60 flex items-center justify-between sticky top-0 shrink-0 backdrop-blur-lg">
                                      <div className="flex items-center space-x-2.5 w-3/4">
                                          <div className={`w-8 h-8 rounded-lg ${getAvatar(team).color} font-black text-xs flex items-center justify-center border border-white shadow-sm shrink-0`}>
                                              {getAvatar(team).initials}
                                          </div>
                                          <h3 className="font-extrabold text-slate-800 text-[13px] leading-tight truncate pr-1" title={team}>
                                               {team}
                                          </h3>
                                      </div>
                                      <span className="font-black text-slate-500 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100 text-[10px]">{jobs.length} items</span>
                                 </div>

                                 {/* Nested Scroll Space */}
                                 <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 scroll-smooth relative" style={{scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent'}}>
                                      {jobs.map(job => {
                                          const urgency = getUrgency(job.deadline);
                                          return (
                                              <div key={job.postingId} onClick={() => setDrawerJob(job)} 
                                                   className={`bg-white p-3.5 rounded-xl border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)] cursor-pointer group flex flex-col relative transition hover:border-indigo-300 hover:shadow-md ${drawerJob?.postingId === job.postingId ? 'ring-2 ring-indigo-500' : ''}`}>
                                                   
                                                   <div className={`absolute top-0 left-0 h-full w-1 rounded-l-xl ${urgency.bar}`} />
                                                   
                                                   <div className="flex justify-between items-start mb-2.5 pl-2.5">
                                                       <p className="font-extrabold text-[10px] bg-slate-50 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded tracking-wider shadow-sm inline-flex items-center font-mono">
                                                           #{job.postingId}
                                                       </p>
                                                       <button onClick={(e) => handleArchive(e, job.postingId)} className="opacity-0 group-hover:opacity-100 p-1 -mt-1 -mr-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded transition"><DotsHorizontal className="w-5 h-5"/></button>
                                                   </div>
                                                   
                                                   <h4 className="font-extrabold text-slate-900 text-sm pl-2 mb-3 leading-snug line-clamp-2">{job.jobTitle}</h4>
                                                   
                                                   <div className="space-y-2 pl-2">
                                                       <div className="flex items-center text-xs font-semibold text-slate-600 truncate bg-slate-50 rounded border border-slate-100 p-1.5">
                                                           <BriefcaseIcon className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0"/>
                                                           <span className="truncate">{job.clientName}</span>
                                                       </div>
                                                       <div className="flex justify-between items-end border-t border-slate-100 pt-2">
                                                            <p className={`text-[10px] font-bold uppercase tracking-widest ${urgency.text}`}>{urgency.label}</p>
                                                            <p className={`text-xs font-extrabold ${urgency.text}`}>{formatDate(job.deadline)}</p>
                                                       </div>
                                                   </div>
                                              </div>
                                          )
                                      })}
                                 </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Powerful Details Data-Slide Tracker Matrix Overlay Engine Window */}
            {drawerJob && (
                <>
                <div className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm lg:hidden transition-opacity" onClick={() => setDrawerJob(null)} />
                <div className="fixed lg:static top-0 right-0 h-full w-[450px] bg-white shadow-[-10px_0_40px_rgba(0,0,0,0.08)] z-50 flex flex-col transform border-l border-slate-200">
                     
                     <div className="px-8 py-8 bg-slate-900 shrink-0 text-white relative border-b-4 border-indigo-600">
                          <button onClick={()=>setDrawerJob(null)} className="absolute top-5 right-5 hover:bg-slate-700/50 rounded-lg p-2 transition border border-slate-600">
                               <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                          
                          <div className="mb-4">
                              <span className="font-mono text-[10px] tracking-[0.2em] font-bold bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 px-2 py-1 rounded shadow-inner uppercase">Inspection Node</span>
                          </div>
                          
                          <h2 className="text-xl font-black leading-tight text-white mb-3 pr-8">{drawerJob.jobTitle}</h2>
                          
                          <div className="flex flex-wrap items-center text-[13px] font-bold text-slate-300 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 w-max shadow-sm">
                               <BriefcaseIcon className="w-4 h-4 mr-2 text-indigo-400 shrink-0"/> {drawerJob.clientName}
                          </div>
                     </div>
                     
                     <div className="flex-1 overflow-y-auto bg-slate-50 p-6 pb-20 custom-scrollbar text-sm space-y-6">
                          
                          {/* Assignment Headers */}
                          <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                                  <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase mb-2">Responsible Layer</p>
                                  <div className="font-extrabold text-indigo-700 text-sm">{drawerJob.workingBy}</div>
                              </div>
                              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 relative overflow-hidden">
                                  <div className={`absolute top-0 right-0 w-1.5 h-full ${getUrgency(drawerJob.deadline).bar}`}></div>
                                  <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase mb-2">Closure Bound Limit</p>
                                  <div className={`font-extrabold text-sm ${getUrgency(drawerJob.deadline).text}`}>{formatDate(drawerJob.deadline)}</div>
                              </div>
                          </div>
                          
                          {/* Submitted Targets */}
                          <div>
                               <div className="flex justify-between items-center mb-5 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                   <h3 className="font-black text-slate-800 tracking-tight text-[13px] uppercase">Candidate Pipeline Trace</h3>
                                   <span className="font-black bg-slate-100 text-slate-600 text-[10px] px-2.5 py-1 rounded ring-1 ring-slate-200 shadow-inner">Vol: {jobCandidates.length} Active Profiles</span>
                               </div>
                               
                               <div className="space-y-3">
                                  {jobCandidates.length === 0 ? (
                                      <div className="text-center py-10 bg-white border border-dashed border-slate-300 rounded-xl">
                                           <div className="w-10 h-10 mx-auto bg-slate-50 flex items-center justify-center rounded-full text-slate-300 mb-2 border border-slate-100"><BriefcaseIcon className="w-5 h-5"/></div>
                                           <span className="font-semibold text-xs text-slate-500">Pipeline Empty. Request Input Vectors.</span>
                                      </div>
                                  ) : (
                                      jobCandidates.map((c, idx) => {
                                        const rName = c.remarks || 'Standard Processing Stage';
                                        const isRejected = rName.toLowerCase().includes('reject');
                                        const isGood = rName.toLowerCase().includes('hired') || rName.toLowerCase().includes('interview');
                                        
                                        const badgeStyle = isRejected ? 'bg-rose-50 border-rose-200 text-rose-700' : (isGood ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700');

                                        return (
                                          <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow relative overflow-hidden group">
                                              
                                              <div className="flex items-center mb-3">
                                                   <div className="w-10 h-10 bg-[#1E293B] rounded text-white flex items-center justify-center font-extrabold text-[15px] border-b-2 border-indigo-500 shadow-inner shrink-0 mr-4">
                                                       {c.firstName?.[0]}{c.lastName?.[0]}
                                                   </div>
                                                   <div>
                                                       <h4 className="font-black text-slate-900 tracking-tight">{c.firstName} {c.lastName}</h4>
                                                       <p className="text-slate-500 text-xs font-semibold max-w-[240px] truncate leading-tight mt-0.5">{c.currentRole}</p>
                                                   </div>
                                              </div>
                                              
                                              <div className="bg-slate-50 rounded border border-slate-100 p-2.5 mb-2 mt-2">
                                                   <span className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">Locator Beacon Matrix</span>
                                                   <div className="flex text-xs font-semibold text-slate-700"><MapPinIcon className="w-4 h-4 text-slate-400 mr-1 shrink-0"/> <span className="truncate">{c.currentLocation}</span></div>
                                              </div>

                                              <div className="flex items-end justify-between mt-3 pt-2 border-t border-slate-100">
                                                   <div className="flex flex-col space-y-1">
                                                       <span className="text-[9px] uppercase tracking-widest font-black text-slate-400">Analytic Vector Assessment</span>
                                                       <span className={`text-[10px] font-bold border px-2 py-0.5 rounded shadow-sm w-max uppercase ${badgeStyle}`}>{rName}</span>
                                                   </div>
                                              </div>
                                          </div>
                                        );
                                      })
                                  )}
                               </div>
                          </div>
                     </div>
                </div>
                </>
            )}
        </div>
    )
}