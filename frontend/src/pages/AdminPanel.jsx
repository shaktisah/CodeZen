import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import axiosClient from '../utils/axiosClient';
import Navbar from '../components/Navbar';
import AdminChallengeTable from '../components/AdminChallengeTable';
import AdminChallengeForm from '../components/AdminChallengeForm';
import Pagination from '../components/Pagination';

function AdminPanel() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [problems, setProblems] = useState([]);
  const [loadingProblems, setLoadingProblems] = useState(true);
  const [activeTab, setActiveTab] = useState('manage'); // 'manage' or 'create' or 'edit'
  
  // Editing Problem States
  const [editingProblemId, setEditingProblemId] = useState(null);
  const [editingProblem, setEditingProblem] = useState(null);

  // Form error/success
  const [statusMessage, setStatusMessage] = useState(null);
  const [statusType, setStatusType] = useState('info'); // 'success', 'error', 'info'
  const [submitting, setSubmitting] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const fetchProblems = async () => {
    try {
      setLoadingProblems(true);
      const res = await axiosClient.get('/problem/getAllProblem');
      setProblems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch problems:', err);
    } finally {
      setLoadingProblems(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchProblems();
    }
  }, [user]);

  const handleSubmitProblem = async (formData) => {
    setStatusMessage(null);

    const {
      title,
      description,
      difficulty,
      tagsInput,
      visibleTestCases,
      hiddenTestCases,
      startCodeJS,
      startCodePy,
      startCodeCPP,
      startCodeJava,
      refSolutionJS,
      refSolutionPy,
      refSolutionCPP,
      refSolutionJava
    } = formData;

    if (!title || !description || !difficulty) {
      setStatusMessage('Title, Description, and Difficulty are required.');
      setStatusType('error');
      return;
    }

    setSubmitting(true);
    setStatusMessage('Verifying solutions with OneCompiler API. This takes a few seconds...');
    setStatusType('info');

    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    const startCode = [
      { language: 'javascript', initialCode: startCodeJS || '// Write Javascript here' },
      { language: 'python', initialCode: startCodePy || '# Write Python here' },
      { language: 'c++', initialCode: startCodeCPP || '// Write C++ here' },
      { language: 'java', initialCode: startCodeJava || '// Write Java here' }
    ];

    const referenceSolution = [
      { language: 'javascript', completeCode: refSolutionJS },
      { language: 'python', completeCode: refSolutionPy },
      { language: 'c++', completeCode: refSolutionCPP },
      { language: 'java', completeCode: refSolutionJava }
    ].filter(sol => sol.completeCode);

    if (referenceSolution.length === 0) {
      setSubmitting(false);
      setStatusMessage('Please provide at least one reference solution for verification.');
      setStatusType('error');
      return;
    }

    const payload = {
      title,
      description,
      difficulty,
      tags,
      visibleTestCases,
      hiddenTestCases,
      startCode,
      referenceSolution,
      problemCreator: user._id
    };

    try {
      if (activeTab === 'edit') {
        const response = await axiosClient.put(`/problem/update/${editingProblemId}`, payload);
        if (response.data && response.data.success) {
          setStatusMessage('Problem updated successfully!');
          setStatusType('success');
          fetchProblems();
          setEditingProblem(null);
          setEditingProblemId(null);
          setTimeout(() => setActiveTab('manage'), 1500);
        } else {
          setStatusMessage(response.data.message || 'Failed to update problem.');
          setStatusType('error');
        }
      } else {
        const response = await axiosClient.post('/problem/create', payload);
        if (response.data && response.data.success) {
          setStatusMessage('Problem created and verified successfully!');
          setStatusType('success');
          fetchProblems();
          setTimeout(() => setActiveTab('manage'), 1500);
        } else {
          setStatusMessage(response.data.message || 'Failed to create problem.');
          setStatusType('error');
        }
      }
    } catch (err) {
      console.error(err);
      setStatusMessage(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to communicate with server.');
      setStatusType('error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = async (problemId) => {
    try {
      setStatusMessage('Loading problem details...');
      setStatusType('info');
      
      const res = await axiosClient.get(`/problem/ProblemById/${problemId}`);
      if (res.data && res.data.success) {
        const p = res.data.problem;
        setEditingProblemId(problemId);
        setEditingProblem(p);
        setStatusMessage(null);
        setActiveTab('edit');
      } else {
        setStatusMessage('Failed to load problem.');
        setStatusType('error');
      }
    } catch (err) {
      console.error(err);
      setStatusMessage('Error fetching problem.');
      setStatusType('error');
    }
  };

  const handleDeleteClick = async (problemId) => {
    if (!window.confirm('Delete this problem?')) return;
    try {
      const res = await axiosClient.delete(`/problem/${problemId}`);
      if (res.data && res.data.success) {
        setStatusMessage('Problem deleted!');
        setStatusType('success');
        fetchProblems();
      } else {
        setStatusMessage(res.data.message || 'Failed to delete problem.');
        setStatusType('error');
      }
    } catch (err) {
      console.error(err);
      setStatusMessage('Error deleting problem.');
      setStatusType('error');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center gap-4 text-zinc-550">
        <span className="loading loading-spinner loading-md text-cyan-500"></span>
        <p className="text-xs">Authenticating admin...</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  // Paginated calculations
  const totalItems = problems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedProblems = problems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-800 dark:text-zinc-150 font-sans flex flex-col pb-16 transition-colors duration-200">
      
      {/* Header / Navbar */}
      <Navbar isAdminPanel={true} />

      {/* Main Admin Console */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 flex-1 w-full space-y-6">
        
        {/* Status banner */}
        {statusMessage && (
          <div className={`alert text-xs py-3 px-4 rounded-xl shadow-sm flex items-start gap-2.5 ${
            statusType === 'success' ? 'bg-green-100 border border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-900/40 dark:text-green-400' :
            statusType === 'error' ? 'bg-red-100 border border-red-200 text-red-750 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-400' :
            'bg-cyan-100 border border-cyan-200 text-cyan-750 dark:bg-cyan-950/20 dark:border-cyan-900/40 dark:text-cyan-455'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0 mt-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.08 1.058l-.04.02-.041.02a.75.75 0 11-1.08-1.058l.04-.02zM12 18.75a.75.75 0 100-1.5.75.75 0 000 1.5z" />
            </svg>
            <div className="flex-1 whitespace-pre-line font-medium">{statusMessage}</div>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-900 gap-4">
          <button
            onClick={() => {
              setActiveTab('manage');
              setStatusMessage(null);
            }}
            className={`pb-3 px-1.5 font-bold text-xs transition-all border-b-2 cursor-pointer ${
              activeTab === 'manage' ? 'border-cyan-600 text-zinc-900 dark:border-cyan-500 dark:text-white' : 'border-transparent text-zinc-400 dark:text-zinc-550 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Manage Challenges ({problems.length})
          </button>
          
          <button
            onClick={() => {
              setActiveTab('create');
              setStatusMessage(null);
              setEditingProblemId(null);
              setEditingProblem(null);
            }}
            className={`pb-3 px-1.5 font-bold text-xs transition-all border-b-2 cursor-pointer ${
              activeTab === 'create' ? 'border-cyan-600 text-zinc-900 dark:border-cyan-500 dark:text-white' : 'border-transparent text-zinc-400 dark:text-zinc-550 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Add New Challenge
          </button>

          {activeTab === 'edit' && (
            <span className="pb-3 px-1.5 font-bold text-xs border-b-2 border-cyan-400 text-cyan-600 dark:text-cyan-455">
              Editing: {editingProblem?.title}
            </span>
          )}
        </div>

        {/* Manage Tab Content */}
        {activeTab === 'manage' && (
          <div className="space-y-4">
            <AdminChallengeTable
              problems={paginatedProblems}
              loadingProblems={loadingProblems}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
            {!loadingProblems && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        )}

        {/* Create/Edit Tab Content */}
        {(activeTab === 'create' || activeTab === 'edit') && (
          <AdminChallengeForm
            editingProblem={editingProblem}
            onSubmit={handleSubmitProblem}
            onCancel={() => {
              setActiveTab('manage');
              setStatusMessage(null);
              setEditingProblem(null);
              setEditingProblemId(null);
            }}
            submitting={submitting}
            activeTab={activeTab}
          />
        )}
      </main>
    </div>
  );
}

export default AdminPanel;
