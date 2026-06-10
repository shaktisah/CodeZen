import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import axiosClient from '../utils/axiosClient';

function ProblemWorkspace() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');

  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [activeResultTab, setActiveResultTab] = useState(0);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('code');

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axiosClient.get(`/problem/ProblemById/${id}`);
        if (res.data && res.data.success) {
          const p = res.data.problem;
          setProblem(p);
          
          const defaultLang = 'javascript';
          setSelectedLanguage(defaultLang);
          const langCode = p.startCode?.find(c => c.language?.toLowerCase() === defaultLang);
          setCode(langCode ? langCode.initialCode : getDefaultCodeTemplate(defaultLang));
        } else {
          setError('Problem not found');
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Error loading problem. Make sure you are logged in.');
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [id]);

  const getDefaultCodeTemplate = (lang) => {
    switch (lang.toLowerCase()) {
      case 'javascript':
      case 'js':
        return 'function twoSum(nums, target) {\n    // Write your code here\n}';
      case 'python':
      case 'py':
        return 'def twoSum(nums, target):\n    # Write your code here\n    pass';
      case 'c++':
      case 'cpp':
        return 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your C++ code here\n    }\n};';
      case 'java':
        return 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your Java code here\n    }\n}';
      default:
        return '// Write your code here';
    }
  };

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setSelectedLanguage(lang);
    
    if (problem && problem.startCode) {
      const match = problem.startCode.find(
        (c) => c.language?.toLowerCase() === lang.toLowerCase() || 
               (lang === 'javascript' && c.language?.toLowerCase() === 'js') ||
               (lang === 'c++' && c.language?.toLowerCase() === 'cpp')
      );
      if (match) {
        setCode(match.initialCode);
        return;
      }
    }
    setCode(getDefaultCodeTemplate(lang));
  };

  const handleRunCode = async () => {
    if (!user) {
      alert('Please log in to run code.');
      navigate('/login');
      return;
    }
    if (running || submitting) return;

    setRunning(true);
    setRunResult(null);
    setSubmitResult(null);
    setActiveWorkspaceTab('result');

    try {
      const res = await axiosClient.post(`/submission/runCode/${id}`, {
        code,
        language: selectedLanguage
      });
      setRunResult(res.data);
      setActiveResultTab(0);
    } catch (err) {
      console.error(err);
      const rawError = err.response?.data;
      const errorString = typeof rawError === 'string' 
        ? rawError 
        : (rawError?.message || rawError?.error || err.message || 'Execution request failed');

      setRunResult({
        success: false,
        status: 'Error',
        error: errorString
      });
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!user) {
      alert('Please log in to submit code.');
      navigate('/login');
      return;
    }
    if (running || submitting) return;

    setSubmitting(true);
    setRunResult(null);
    setSubmitResult(null);
    setActiveWorkspaceTab('result');

    try {
      const res = await axiosClient.post(`/submission/submit/${id}`, {
        code,
        language: selectedLanguage
      });
      setSubmitResult(res.data);
    } catch (err) {
      console.error(err);
      const rawError = err.response?.data;
      const errorString = typeof rawError === 'string' 
        ? rawError 
        : (rawError?.message || rawError?.error || err.message || 'Submission request failed');

      setSubmitResult({
        status: 'Error',
        errorMessage: errorString
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] flex flex-col items-center justify-center gap-4 text-zinc-400 dark:text-zinc-550 transition-colors duration-200">
        <span className="loading loading-spinner loading-md text-cyan-600 dark:text-cyan-500"></span>
        <p className="text-xs">Setting up problem workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] flex flex-col items-center justify-center gap-4 p-4 text-center transition-colors duration-200">
        <div className="alert alert-error max-w-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-650 dark:text-red-400 rounded-xl py-3 text-xs">
          <span>{error}</span>
        </div>
        <Link to="/" className="btn btn-xs bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 border-none rounded-lg font-bold py-2 px-4 shadow-sm">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  let diffColorClass = 'text-teal-650 bg-teal-50 border-teal-200 dark:text-teal-400 dark:bg-teal-950/20 dark:border-teal-900/35';
  if (problem.difficulty?.toLowerCase() === 'medium') {
    diffColorClass = 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/20 dark:border-amber-900/35';
  } else if (problem.difficulty?.toLowerCase() === 'hard') {
    diffColorClass = 'text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950/20 dark:border-rose-900/35';
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-800 dark:text-zinc-150 font-sans flex flex-col h-screen overflow-hidden transition-colors duration-200">
      
      {/* Workspace Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-900 bg-white dark:bg-[#09090b] h-12 shrink-0 flex items-center justify-between px-4 transition-colors duration-200">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-zinc-400 dark:text-zinc-550 hover:text-zinc-800 dark:hover:text-white transition-colors flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Back</span>
          </Link>
          <div className="h-3.5 w-px bg-zinc-200 dark:bg-zinc-800"></div>
          <span className="text-xs font-bold text-zinc-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">{problem.title}</span>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 dark:text-zinc-500 font-bold uppercase">Candidate: {user.firstName}</span>
            </div>
          ) : (
            <Link to="/login" className="btn btn-xs bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 rounded-lg border-none text-[10px] font-bold">
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Split Panels Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Panel - Description */}
        <div className="w-full md:w-1/2 border-r border-zinc-200 dark:border-zinc-900 flex flex-col bg-white dark:bg-[#09090b] overflow-y-auto transition-colors duration-200">
          <div className="border-b border-zinc-200 dark:border-zinc-900 h-10 shrink-0 flex items-center px-4 bg-zinc-50 dark:bg-zinc-900/10 transition-colors duration-200">
            <span className="text-[10px] font-bold text-zinc-900 dark:text-white uppercase tracking-wider border-b-2 border-cyan-500 py-2.5">
              Description
            </span>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">{problem.title}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`badge border text-[10px] px-2 py-0.5 font-bold rounded-md capitalize ${diffColorClass}`}>
                  {problem.difficulty}
                </span>
                
                <div className="flex gap-1">
                  {problem.tags?.map((tag) => (
                    <span key={tag} className="text-[9px] font-bold bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded uppercase">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-350 whitespace-pre-wrap font-sans border-t border-zinc-200 dark:border-zinc-900 pt-5 transition-colors duration-200">
              {problem.description}
            </div>

            {/* Examples */}
            <div className="space-y-3.5 border-t border-zinc-200 dark:border-zinc-900 pt-5 transition-colors duration-200">
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Examples</h4>
              {problem.visibleTestCases?.map((tc, idx) => (
                <div key={idx} className="bg-zinc-50 dark:bg-zinc-900/10 border border-zinc-200 dark:border-zinc-900 rounded-xl p-4 space-y-2 text-[11px] transition-colors duration-200">
                  <span className="font-bold text-cyan-600 dark:text-cyan-500 block">Example {idx + 1}:</span>
                  <div className="grid grid-cols-1 gap-1 font-mono text-zinc-650 dark:text-zinc-400">
                    <div><span className="text-zinc-450 dark:text-zinc-600 font-bold">Input:</span> {tc.input}</div>
                    <div><span className="text-zinc-455 dark:text-zinc-600 font-bold">Output:</span> {tc.output}</div>
                    {tc.explanation && (
                      <div className="mt-1 leading-relaxed"><span className="text-zinc-455 dark:text-zinc-600 font-bold">Explanation:</span> {tc.explanation}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Code Editor */}
        <div className="w-full md:w-1/2 flex flex-col bg-white dark:bg-zinc-950 overflow-hidden transition-colors duration-200">
          
          {/* Tab Control Bar */}
          <div className="border-b border-zinc-200 dark:border-zinc-900 h-11 shrink-0 flex items-center justify-between px-4 bg-zinc-50 dark:bg-zinc-900/10 transition-colors duration-200">
            <div className="flex gap-4">
              {['code', 'testcase', 'result'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveWorkspaceTab(tab)}
                  className={`relative py-3.5 text-xs font-bold capitalize transition-all cursor-pointer ${
                    activeWorkspaceTab === tab
                      ? 'text-cyan-600 dark:text-cyan-400 border-b-2 border-cyan-500 dark:border-cyan-400'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-white border-b-2 border-transparent'
                  }`}
                >
                  {tab === 'testcase' ? 'Testcase' : tab}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleRunCode}
                disabled={running || submitting}
                className="btn btn-xs bg-white dark:bg-[#09090b] hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-450 hover:text-zinc-900 dark:hover:text-white rounded-md px-2.5 py-1 cursor-pointer border border-zinc-200 dark:border-zinc-900 text-[10px] font-bold transition-all disabled:opacity-40"
              >
                {running ? 'Running...' : 'Run Code'}
              </button>
              
              <button
                type="button"
                onClick={handleSubmitCode}
                disabled={running || submitting}
                className="btn btn-xs bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white rounded-md px-3 py-1 cursor-pointer border-none text-[10px] font-bold transition-all disabled:opacity-40 shadow-lg shadow-cyan-500/10"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>

          {/* Active Tab View */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeWorkspaceTab === 'code' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Language Selection Pills */}
                <div className="flex items-center gap-2 p-3 bg-zinc-50/50 dark:bg-[#0c0c0f]/20 border-b border-zinc-150 dark:border-zinc-900/60 shrink-0">
                  {['javascript', 'python', 'c++', 'java'].map((lang) => {
                    const isActive = selectedLanguage === lang;
                    const displayName = lang === 'javascript' ? 'JavaScript' :
                                        lang === 'python' ? 'Python' :
                                        lang === 'c++' ? 'C++' : 'Java';
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => handleLanguageChange({ target: { value: lang } })}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer uppercase tracking-wider ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 bg-transparent'
                        }`}
                      >
                        {displayName}
                      </button>
                    );
                  })}
                </div>

                {/* Editor Textarea */}
                <div className="flex-1 relative overflow-hidden flex flex-col">
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    spellCheck="false"
                    className="w-full h-full p-4 font-mono text-xs bg-white dark:bg-[#09090b]/20 text-zinc-800 dark:text-zinc-200 resize-none focus:outline-none leading-relaxed transition-colors duration-200 flex-1"
                    style={{ tabSize: 4 }}
                  />
                </div>
              </div>
            )}

            {activeWorkspaceTab === 'testcase' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="flex flex-col gap-1">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Example Test Cases</h3>
                  <p className="text-[11px] text-zinc-550 dark:text-zinc-500">Below are the parameters used to run your code for validation.</p>
                </div>
                <div className="space-y-4">
                  {problem.visibleTestCases?.map((tc, idx) => (
                    <div key={idx} className="bg-zinc-50 dark:bg-zinc-900/10 border border-zinc-200 dark:border-zinc-900 rounded-xl p-4 space-y-3.5 text-xs transition-colors duration-200">
                      <div className="flex items-center justify-between border-b border-zinc-200/50 dark:border-zinc-900/40 pb-2">
                        <span className="font-bold text-cyan-600 dark:text-cyan-500">Case {idx + 1}</span>
                      </div>
                      <div className="space-y-2.5 font-mono text-[11px]">
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-650 font-bold block mb-1">Input Parameters:</span>
                          <div className="bg-white dark:bg-[#09090b] border border-zinc-150 dark:border-zinc-900/50 rounded-lg p-2.5 text-zinc-700 dark:text-zinc-300">
                            {tc.input}
                          </div>
                        </div>
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-650 font-bold block mb-1">Expected Output:</span>
                          <div className="bg-white dark:bg-[#09090b] border border-zinc-150 dark:border-zinc-900/50 rounded-lg p-2.5 text-zinc-700 dark:text-zinc-300">
                            {tc.output}
                          </div>
                        </div>
                        {tc.explanation && (
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-650 font-bold block mb-1">Explanation:</span>
                            <div className="text-zinc-650 dark:text-zinc-400 leading-relaxed pl-1 whitespace-pre-wrap font-sans text-xs">
                              {tc.explanation}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeWorkspaceTab === 'result' && (
              <div className="flex-1 overflow-y-auto p-6 transition-colors duration-200">
                {running || submitting ? (
                  <div className="h-full flex flex-col items-center justify-center gap-3 text-zinc-400 dark:text-zinc-500 py-12">
                    <span className="loading loading-spinner loading-md text-cyan-600 dark:text-cyan-500"></span>
                    <span className="text-xs font-bold uppercase tracking-wider">Compiling and running tests...</span>
                  </div>
                ) : !runResult && !submitResult ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-550 text-xs py-12 text-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-zinc-400 opacity-60">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                    </svg>
                    <span>No execution results yet. Run or Submit your code to see the test results.</span>
                  </div>
                ) : runResult ? (
                  /* Run Result */
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-zinc-500 dark:text-zinc-400">Status:</span>
                      <span className={`badge border text-[9px] px-2.5 py-0.5 rounded-md font-bold uppercase ${
                        runResult.status === 'Accepted' ? 'bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-950/20 dark:border-teal-900/35 dark:text-teal-400' : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/35 dark:text-rose-400'
                      }`}>
                        {runResult.status}
                      </span>
                    </div>

                    {runResult.error ? (
                      <div className="bg-rose-50 border border-rose-200 dark:bg-rose-950/15 dark:border-rose-900/30 rounded-xl p-4 text-xs text-rose-650 dark:text-rose-400 font-mono whitespace-pre-wrap leading-relaxed">
                        {runResult.error}
                      </div>
                    ) : runResult.results ? (
                      <div className="space-y-3.5">
                        <div className="flex flex-wrap gap-1.5 border-b border-zinc-200 dark:border-zinc-900 pb-2">
                          {runResult.results.map((res, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setActiveResultTab(idx)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer border transition-all ${
                                activeResultTab === idx
                                  ? 'bg-cyan-50 border-cyan-200 text-cyan-700 dark:bg-cyan-950/20 dark:border-cyan-800 dark:text-cyan-400'
                                  : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-100 dark:bg-[#09090b] dark:border-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-900'
                              }`}
                            >
                              Case {idx + 1} ({res.passed ? 'Pass' : 'Fail'})
                            </button>
                          ))}
                        </div>

                        {runResult.results[activeResultTab] && (
                          <div className="space-y-3.5 font-mono text-[11px] bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-900 rounded-xl p-4 transition-colors duration-200">
                            <div>
                              <span className="text-zinc-500 dark:text-zinc-650 font-bold block mb-1">Input Parameters:</span>
                              <div className="bg-white dark:bg-[#09090b] border border-zinc-150 dark:border-zinc-900/40 rounded-lg p-2.5 text-zinc-700 dark:text-zinc-350">
                                {runResult.results[activeResultTab].input}
                              </div>
                            </div>
                            <div>
                              <span className="text-zinc-500 dark:text-zinc-650 font-bold block mb-1">Expected Output:</span>
                              <div className="bg-white dark:bg-[#09090b] border border-zinc-150 dark:border-zinc-900/40 rounded-lg p-2.5 text-zinc-700 dark:text-zinc-350">
                                {runResult.results[activeResultTab].expectedOutput}
                              </div>
                            </div>
                            <div>
                              <span className="text-zinc-500 dark:text-zinc-650 font-bold block mb-1">Your stdout:</span>
                              <div className={`border rounded-lg p-2.5 font-bold ${
                                runResult.results[activeResultTab].passed 
                                  ? 'bg-teal-50/50 border-teal-200 text-teal-700 dark:bg-teal-950/10 dark:border-teal-900/30 dark:text-teal-400' 
                                  : 'bg-rose-50/50 border-rose-200 text-rose-700 dark:bg-rose-950/10 dark:border-rose-900/30 dark:text-rose-500'
                              }`}>
                                {runResult.results[activeResultTab].actualOutput || 'Empty/Null'}
                              </div>
                            </div>
                            {runResult.results[activeResultTab].stderr && (
                              <div>
                                <span className="text-rose-500 font-bold block mb-1">Standard Error:</span>
                                <div className="bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/15 dark:text-rose-400 p-3 rounded-lg whitespace-pre-wrap text-[10px] leading-relaxed">
                                  {runResult.results[activeResultTab].stderr}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  /* Submit Result */
                  <div className="space-y-4 py-4">
                    <div className="text-center space-y-3.5">
                      {submitResult.status === 'Accepted' ? (
                        <div className="space-y-3">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 border border-teal-200 text-teal-700 dark:bg-teal-950/20 dark:border-teal-900/35 dark:text-teal-400 rounded-lg text-[10px] font-bold uppercase transition-colors duration-200">
                            🎉 Accepted
                          </div>
                          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">All test cases passed!</h3>
                          <div className="flex justify-center gap-6 text-[10px] text-zinc-400 dark:text-zinc-550 pt-2 font-mono transition-colors duration-200">
                            <div>
                              <span className="text-zinc-500 dark:text-zinc-650 block mb-1">Total cases</span>
                              <span className="text-zinc-800 dark:text-zinc-350 font-bold text-xs">{submitResult.testCasesPassed} / {submitResult.totalTestCases}</span>
                            </div>
                            <div>
                              <span className="text-zinc-500 dark:text-zinc-650 block mb-1">Execution time</span>
                              <span className="text-zinc-800 dark:text-zinc-350 font-bold text-xs">{(submitResult.runtime || 0).toFixed(2)}s</span>
                            </div>
                            <div>
                              <span className="text-zinc-500 dark:text-zinc-650 block mb-1">Memory</span>
                              <span className="text-zinc-800 dark:text-zinc-350 font-bold text-xs">{submitResult.memory} KB</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/35 dark:text-rose-400 rounded-lg text-[10px] font-bold uppercase transition-colors duration-200">
                            ❌ {submitResult.status || 'Failed'}
                          </div>
                          
                          {submitResult.errorMessage && (
                            <div className="max-w-md mx-auto bg-rose-50 border border-rose-200 dark:bg-rose-950/15 dark:border-rose-900/30 rounded-lg p-3 text-[10px] text-rose-700 dark:text-rose-400 font-mono text-left whitespace-pre-wrap leading-relaxed font-bold">
                              {submitResult.errorMessage}
                            </div>
                          )}
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-500 font-mono font-bold">
                            Passed {submitResult.testCasesPassed || 0} / {submitResult.totalTestCases || 0} test cases.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProblemWorkspace;
