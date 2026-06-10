import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import axiosClient from '../utils/axiosClient';
import Navbar from '../components/Navbar';
import Pagination from '../components/Pagination';

function Profile() {
  const { user: authUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [problems, setProblems] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Tab State: 'overview' or 'submissions'
  const [activeTab, setActiveTab] = useState('overview');

  // Search & Filter state for Submissions
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');

  // Pagination state for Submissions
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset pagination page on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, languageFilter]);

  // Code Viewer Modal State
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !authUser) {
      navigate('/login');
    }
  }, [authUser, authLoading, navigate]);

  const fetchProfileDetails = async () => {
    if (!authUser) return;
    try {
      setLoadingData(true);
      setErrorMsg(null);
      const [profileRes, submissionsRes, problemsRes] = await Promise.all([
        axiosClient.get('/problem/problemAllSolvedbyuser'),
        axiosClient.get('/submission/my-submissions'),
        axiosClient.get('/problem/getAllProblem')
      ]);

      if (profileRes.data) {
        setProfileData(profileRes.data);
      }
      if (submissionsRes.data && submissionsRes.data.success) {
        setSubmissions(Array.isArray(submissionsRes.data.submissions) ? submissionsRes.data.submissions : []);
      }
      if (problemsRes.data) {
        setProblems(Array.isArray(problemsRes.data) ? problemsRes.data : []);
      }
    } catch (err) {
      console.error('Failed to load profile data:', err);
      let detailedMsg = err.message || 'Failed to load profile details.';
      if (err.config && err.config.url) {
        detailedMsg += ` (Endpoint: ${err.config.url})`;
      }
      setErrorMsg(err.response?.data?.message || detailedMsg);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchProfileDetails();
  }, [authUser]);

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] flex flex-col text-zinc-900 dark:text-zinc-100">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4 text-center">
          <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl max-w-md shadow-sm">
            <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">Error Loading Profile</h3>
            <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1.5">{errorMsg}</p>
          </div>
          <button 
            onClick={fetchProfileDetails}
            className="btn btn-sm bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 border-none rounded-lg px-4 cursor-pointer font-bold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (authLoading || (loadingData && !profileData)) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] flex flex-col text-zinc-900 dark:text-zinc-100">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <span className="loading loading-spinner loading-lg text-cyan-600 dark:text-cyan-500"></span>
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Loading your profile...</span>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return null;
  }

  // Calculate difficulty stats
  const totalProblemsCount = Array.isArray(problems) ? problems.length : 0;
  const easyProblems = (Array.isArray(problems) ? problems : []).filter(p => p && p.difficulty?.toLowerCase() === 'easy');
  const mediumProblems = (Array.isArray(problems) ? problems : []).filter(p => p && p.difficulty?.toLowerCase() === 'medium');
  const hardProblems = (Array.isArray(problems) ? problems : []).filter(p => p && p.difficulty?.toLowerCase() === 'hard');

  const solvedProblemIds = new Set(
    (profileData.problemSolved || [])
      .filter(p => p !== null && p !== undefined && p._id)
      .map(p => p._id.toString())
  );

  const solvedCount = solvedProblemIds.size;
  const solvedEasy = easyProblems.filter(p => p && p._id && solvedProblemIds.has(p._id.toString())).length;
  const solvedMedium = mediumProblems.filter(p => p && p._id && solvedProblemIds.has(p._id.toString())).length;
  const solvedHard = hardProblems.filter(p => p && p._id && solvedProblemIds.has(p._id.toString())).length;

  const totalEasyCount = easyProblems.length;
  const totalMediumCount = mediumProblems.length;
  const totalHardCount = hardProblems.length;

  const handleCopyCode = (codeText) => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter submissions
  const filteredSubmissions = submissions.filter((sub) => {
    const problemTitle = sub.problemId?.title || 'Unknown Problem';
    const matchesSearch = problemTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter ? sub.status === statusFilter : true;
    const matchesLang = languageFilter ? sub.language?.toLowerCase() === languageFilter.toLowerCase() : true;
    return matchesSearch && matchesStatus && matchesLang;
  });

  const totalSubmissions = filteredSubmissions.length;
  const totalPages = Math.ceil(totalSubmissions / itemsPerPage);
  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-850 dark:text-zinc-150 font-sans flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200 transition-colors duration-200">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        
        {/* User Intro Banner */}
        <div className="bg-white dark:bg-[#0e0e11] border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6 transition-colors duration-200">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-650 flex items-center justify-center font-bold text-white text-3xl uppercase shadow-md select-none shrink-0">
            {profileData.firstName ? profileData.firstName[0] : 'U'}
          </div>
          
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
              <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                {profileData.firstName} {profileData.lastName}
              </h1>
              <span className="badge badge-sm bg-cyan-50 dark:bg-cyan-950 border-cyan-200 dark:border-cyan-850 text-cyan-600 dark:text-cyan-400 capitalize font-semibold self-center px-2">
                {profileData.role}
              </span>
            </div>
            
            <p className="text-zinc-500 dark:text-zinc-400 text-xs">
              Joined on {profileData.createdAt ? new Date(profileData.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-zinc-650 dark:text-zinc-400 pt-1">
              <span className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-zinc-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H4.5A2.25 2.25 0 0 1 2.25 17.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5H4.5a2.25 2.25 0 0 0-2.25 2.25m19.5 0v1.5a2.25 2.25 0 0 1-2.25 2.25H4.5A2.25 2.25 0 0 1 2.25 10.5v-1.5m19.5 0v.008c0 .386-.021.77-.063 1.152M2.25 10.5v.008c0 .386.021.77.063 1.152M12 10.5V18" />
                </svg>
                {profileData.emailId}
              </span>
              {profileData.age && (
                <span className="flex items-center gap-1.5 border-l border-zinc-200 dark:border-zinc-800 pl-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-zinc-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                  {profileData.age} years old
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-900 gap-6 text-sm font-semibold">
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`pb-3 border-b-2 cursor-pointer transition-colors duration-200 ${
              activeTab === 'overview' 
                ? 'border-cyan-550 text-cyan-600 dark:text-cyan-400 font-bold' 
                : 'border-transparent text-zinc-500 hover:text-zinc-950 dark:hover:text-white'
            }`}
          >
            Overview & Stats
          </button>
          <button 
            onClick={() => setActiveTab('submissions')} 
            className={`pb-3 border-b-2 cursor-pointer transition-colors duration-200 ${
              activeTab === 'submissions' 
                ? 'border-cyan-550 text-cyan-600 dark:text-cyan-400 font-bold' 
                : 'border-transparent text-zinc-500 hover:text-zinc-950 dark:hover:text-white'
            }`}
          >
            Submission History ({submissions.length})
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'overview' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column: Visual Analytics Stats */}
            <div className="bg-white dark:bg-[#0e0e11] border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-center items-center text-center">
              <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-350 self-start uppercase tracking-wider">Overall Progress</h2>
              
              {/* Circular Progress Wheel */}
              <div className="relative w-40 h-40 flex items-center justify-center select-none">
                <svg className="w-full h-full transform -rotate-95" viewBox="0 0 100 100">
                  {/* Outer circle track */}
                  <circle 
                    cx="50" cy="50" r="40" 
                    className="stroke-zinc-100 dark:stroke-zinc-900" 
                    strokeWidth="8" fill="transparent" 
                  />
                  {/* Progress arc */}
                  <circle 
                    cx="50" cy="50" r="40" 
                    className="stroke-cyan-500 transition-all duration-500" 
                    strokeWidth="8" 
                    fill="transparent"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * (totalProblemsCount > 0 ? solvedCount / totalProblemsCount : 0))}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">{solvedCount}</span>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Solved / {totalProblemsCount}</span>
                </div>
              </div>

              <p className="text-zinc-500 dark:text-zinc-450 text-xs max-w-xs leading-relaxed">
                You have resolved <span className="font-bold text-zinc-950 dark:text-white">{totalProblemsCount > 0 ? ((solvedCount / totalProblemsCount) * 100).toFixed(1) : 0}%</span> of the available challenges on the platform. Keep coding to level up!
              </p>
            </div>

            {/* Right Column: Breakdown Cards */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white dark:bg-[#0e0e11] border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm space-y-6">
                <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-350 uppercase tracking-wider">Difficulty Breakdown</h2>

                <div className="space-y-5">
                  {/* Easy Card */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-teal-650 dark:text-teal-400 flex items-center gap-1.5 font-bold uppercase tracking-wide">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                        Easy
                      </span>
                      <span className="text-zinc-700 dark:text-zinc-400">{solvedEasy} <span className="text-zinc-400 font-normal">/ {totalEasyCount} solved</span></span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full h-2.5 overflow-hidden border border-zinc-200/50 dark:border-zinc-850">
                      <div 
                        className="bg-teal-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${totalEasyCount > 0 ? (solvedEasy / totalEasyCount) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Medium Card */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-amber-655 dark:text-amber-400 flex items-center gap-1.5 font-bold uppercase tracking-wide">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        Medium
                      </span>
                      <span className="text-zinc-700 dark:text-zinc-400">{solvedMedium} <span className="text-zinc-400 font-normal">/ {totalMediumCount} solved</span></span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full h-2.5 overflow-hidden border border-zinc-200/50 dark:border-zinc-850">
                      <div 
                        className="bg-amber-550 h-full rounded-full transition-all duration-300"
                        style={{ width: `${totalMediumCount > 0 ? (solvedMedium / totalMediumCount) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Hard Card */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-rose-650 dark:text-rose-450 flex items-center gap-1.5 font-bold uppercase tracking-wide">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                        Hard
                      </span>
                      <span className="text-zinc-700 dark:text-zinc-400">{solvedHard} <span className="text-zinc-400 font-normal">/ {totalHardCount} solved</span></span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full h-2.5 overflow-hidden border border-zinc-200/50 dark:border-zinc-850">
                      <div 
                        className="bg-rose-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${totalHardCount > 0 ? (solvedHard / totalHardCount) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Solved Problems List Shortcut */}
              <div className="bg-white dark:bg-[#0e0e11] border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm space-y-4">
                <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-350 uppercase tracking-wider">Solved Challenges ({solvedCount})</h2>
                
                {profileData.problemSolved && profileData.problemSolved.filter(p => p !== null && p !== undefined && p._id).length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {profileData.problemSolved
                      .filter(problem => problem !== null && problem !== undefined && problem._id)
                      .map((problem) => {
                      let tagColor = 'text-teal-650 bg-teal-50 border-teal-200 dark:text-teal-400 dark:bg-teal-950/20 dark:border-teal-900/30';
                      if (problem.difficulty?.toLowerCase() === 'medium') {
                        tagColor = 'text-amber-655 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/20 dark:border-amber-900/30';
                      } else if (problem.difficulty?.toLowerCase() === 'hard') {
                        tagColor = 'text-rose-650 bg-rose-50 border-rose-200 dark:text-rose-455 dark:bg-rose-950/20 dark:border-rose-900/30';
                      }

                      return (
                        <Link 
                          key={problem._id} 
                          to={`/problem/${problem._id}`}
                          className={`text-xs border px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 hover:opacity-85 hover:-translate-y-0.5 transition-all shadow-sm ${tagColor}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                          </svg>
                          {problem.title}
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-zinc-500 dark:text-zinc-500 text-xs italic">No solved challenges yet. Head to the homepage to pick your first task!</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Submissions List Tab */
          <div className="bg-white dark:bg-[#0e0e11] border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm space-y-6">
            
            {/* Filter Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="w-full md:max-w-xs relative">
                <input 
                  type="text" 
                  placeholder="Search problem name..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input input-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 w-full pl-8 text-xs h-9"
                />
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-zinc-400 absolute left-2.5 top-2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.63 10.63Z" />
                </svg>
              </div>

              <div className="flex w-full md:w-auto gap-2 items-center justify-end">
                {/* Language filter */}
                <select 
                  value={languageFilter} 
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  className="select select-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 text-xs h-9 min-h-0"
                >
                  <option value="">All Languages</option>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                </select>

                {/* Status filter */}
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="select select-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 text-xs h-9 min-h-0"
                >
                  <option value="">All Statuses</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Wrong Answer">Wrong Answer</option>
                  <option value="Compilation Error">Compilation Error</option>
                  <option value="Runtime Error">Runtime Error</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="table w-full text-zinc-700 dark:text-zinc-300 border-none">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-900 text-zinc-400 dark:text-zinc-550 uppercase text-[10px] tracking-wider bg-zinc-50 dark:bg-zinc-900/10 font-bold">
                    <th>Problem</th>
                    <th>Status</th>
                    <th>Language</th>
                    <th>Runtime & Memory</th>
                    <th>Date</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSubmissions.length > 0 ? (
                    paginatedSubmissions.map((sub) => {
                      const isAccepted = sub.status === 'Accepted';
                      const statusColor = isAccepted 
                        ? 'text-teal-650 bg-teal-50 border-teal-200 dark:text-teal-400 dark:bg-teal-950/20 dark:border-teal-900/35'
                        : 'text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950/20 dark:border-rose-900/35';

                      const problemTitle = sub.problemId?.title || 'Deleted Problem';

                      return (
                        <tr key={sub._id} className="border-b border-zinc-150 dark:border-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-all">
                          <td className="font-semibold text-zinc-900 dark:text-white text-xs">
                            {sub.problemId ? (
                              <Link to={`/problem/${sub.problemId._id}`} className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                                {problemTitle}
                              </Link>
                            ) : (
                              <span className="text-zinc-400">{problemTitle}</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge border text-[10px] px-2 py-0.5 font-bold rounded-md capitalize ${statusColor}`}>
                              {sub.status}
                            </span>
                          </td>
                          <td>
                            <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded uppercase">
                              {sub.language}
                            </span>
                          </td>
                          <td className="text-xs text-zinc-500">
                            {isAccepted ? (
                              <span>{(sub.runtime || 0).toFixed(2)}s / {sub.memory || 0} KB</span>
                            ) : (
                              <span className="text-zinc-400">-</span>
                            )}
                          </td>
                          <td className="text-xs text-zinc-500">
                            {sub.createdAt ? new Date(sub.createdAt).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'N/A'}
                          </td>
                          <td className="text-right">
                            <button 
                              onClick={() => setSelectedSubmission(sub)}
                              className="btn btn-xs bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 border-none rounded-lg px-2.5 font-bold cursor-pointer"
                            >
                              View Code
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-zinc-500 text-xs italic">
                        No matching submissions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {!loadingData && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalSubmissions}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        )}
      </main>

      {/* Code Viewer Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all animate-fade-in">
          <div className="bg-white dark:bg-[#0e0e11] border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[85vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-150 dark:border-zinc-900 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/10">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  Code Submission for {selectedSubmission.problemId?.title || 'Unknown Problem'}
                  <span className={`badge border text-[9px] px-1.5 py-0.5 font-bold rounded-md capitalize ${
                    selectedSubmission.status === 'Accepted'
                      ? 'text-teal-650 bg-teal-50 border-teal-200 dark:text-teal-400 dark:bg-teal-950/20 dark:border-teal-900/35'
                      : 'text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950/20 dark:border-rose-900/35'
                  }`}>
                    {selectedSubmission.status}
                  </span>
                </h3>
                
                <div className="flex gap-4 items-center text-[11px] text-zinc-500 dark:text-zinc-450 mt-1.5 font-medium">
                  <span>Language: <span className="text-zinc-800 dark:text-zinc-300 font-bold uppercase">{selectedSubmission.language}</span></span>
                  <span>Passed: <span className="text-zinc-800 dark:text-zinc-300 font-bold">{selectedSubmission.testCasesPassed} / {selectedSubmission.totalTestCases}</span></span>
                  {selectedSubmission.status === 'Accepted' && (
                    <>
                      <span>Runtime: <span className="text-zinc-800 dark:text-zinc-300 font-bold">{(selectedSubmission.runtime || 0).toFixed(2)}s</span></span>
                      <span>Memory: <span className="text-zinc-800 dark:text-zinc-300 font-bold">{selectedSubmission.memory} KB</span></span>
                    </>
                  )}
                </div>
              </div>

              <button 
                onClick={() => setSelectedSubmission(null)}
                className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-350 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              
              {/* Compiler Error alert */}
              {selectedSubmission.errorMessage && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl text-xs text-red-650 dark:text-red-400 font-mono space-y-1">
                  <span className="font-bold block uppercase text-[10px] tracking-wider">Execution Feedback:</span>
                  <pre className="whitespace-pre-wrap leading-relaxed">{selectedSubmission.errorMessage}</pre>
                </div>
              )}

              {/* Code Container */}
              <div className="relative group border border-zinc-800 dark:border-zinc-900 rounded-xl overflow-hidden shadow-inner bg-[#09090b] dark:bg-[#040405]">
                {/* Copy button overlay */}
                <button
                  onClick={() => handleCopyCode(selectedSubmission.code)}
                  className="absolute right-3 top-3 bg-zinc-900/80 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 p-1.5 rounded-lg text-zinc-400 hover:text-white transition-all z-10 cursor-pointer text-xs font-bold"
                  title="Copy code to clipboard"
                >
                  {copied ? 'Copied!' : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H5.4M9 2.25H18a2.25 2.25 0 0 1 2.25 2.25V15a2.25 2.25 0 0 1-2.25 2.25H9a2.25 2.25 0 0 1-2.25-2.25V4.5A2.25 2.25 0 0 1 9 2.25Z" />
                    </svg>
                  )}
                </button>

                <div className="font-mono text-xs overflow-x-auto p-4 flex gap-4 text-zinc-350 dark:text-zinc-400 select-text leading-6">
                  {/* Line Numbers */}
                  <div className="text-zinc-500 dark:text-zinc-650 text-right select-none pr-3 border-r border-zinc-800 dark:border-zinc-900">
                    {selectedSubmission.code.split('\n').map((_, index) => (
                      <div key={index}>{index + 1}</div>
                    ))}
                  </div>
                  {/* Actual Code */}
                  <pre className="flex-1 overflow-x-auto whitespace-pre">{selectedSubmission.code}</pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-150 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/10 flex justify-end gap-2">
              <button 
                onClick={() => setSelectedSubmission(null)}
                className="btn btn-sm bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-none rounded-lg font-bold px-4 cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-900 py-5 text-center text-[10px] text-zinc-500 dark:text-zinc-600 mt-auto bg-zinc-100 dark:bg-[#09090b]">
        <p className="m-0">© 2026 CodeZen Platform. Designed for developers.</p>
      </footer>
    </div>
  );
}

export default Profile;
