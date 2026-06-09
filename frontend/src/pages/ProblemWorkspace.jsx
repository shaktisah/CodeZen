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
          
          {/* Editor Control bar */}
          <div className="border-b border-zinc-200 dark:border-zinc-900 h-10 shrink-0 flex items-center justify-between px-4 bg-zinc-50 dark:bg-zinc-900/10 transition-colors duration-200">
            <div className="flex items-center gap-1">
              <select
                value={selectedLanguage}
                onChange={handleLanguageChange}
                className="select select-ghost select-xs text-[10px] font-bold text-zinc-600 dark:text-zinc-400 bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer uppercase tracking-wider"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="c++">C++</option>
                <option value="java">Java</option>
              </select>
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
                className="btn btn-xs bg-cyan-600 hover:bg-cyan-550 dark:bg-cyan-650 dark:hover:bg-cyan-600 text-white rounded-md px-3 py-1 cursor-pointer border-none text-[10px] font-bold transition-all disabled:opacity-40 shadow-lg shadow-cyan-500/10"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 relative border-b border-zinc-200 dark:border-zinc-900 overflow-hidden">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck="false"
              className="w-full h-full p-4 font-mono text-xs bg-zinc-50 dark:bg-[#09090b]/40 text-zinc-800 dark:text-zinc-200 resize-none focus:outline-none leading-relaxed transition-colors duration-200"
              style={{ tabSize: 4 }}
            />
          </div>

          {/* Console Output */}
          <div className="h-56 shrink-0 bg-white dark:bg-[#09090b] border-t border-zinc-200 dark:border-zinc-900 overflow-y-auto flex flex-col transition-colors duration-200">
            <div className="border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/10 px-4 h-8 shrink-0 flex items-center text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider transition-colors duration-200">
              Output Console
            </div>
            
            <div className="flex-1 p-4">
              {running || submitting ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-zinc-400 dark:text-zinc-600">
                  <span className="loading loading-spinner loading-sm text-cyan-600 dark:text-cyan-500"></span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Compiling challenge...</span>
                </div>
              ) : !runResult && !submitResult ? (
                <div className="h-full flex items-center justify-center text-zinc-400 dark:text-zinc-650 text-[11px]">
                  Run or Submit your code to see evaluation results.
                </div>
              ) : runResult ? (
                /* Run Result */
                <div className="space-y-3.5 h-full">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="font-bold text-zinc-500 dark:text-zinc-555">Status:</span>
                    <span className={`badge border text-[9px] px-2 py-0.5 rounded-md font-bold uppercase ${
                      runResult.status === 'Accepted' ? 'bg-teal-50 border-teal-200 text-teal-750 dark:bg-teal-950/20 dark:border-teal-900/35 dark:text-teal-400' : 'bg-rose-50 border-rose-200 text-rose-750 dark:bg-rose-950/20 dark:border-rose-900/35 dark:text-rose-400'
                    }`}>
                      {runResult.status}
                    </span>
                  </div>

                  {runResult.error ? (
                    <div className="bg-rose-50 border border-rose-200 dark:bg-rose-950/15 dark:border-rose-900/30 rounded-lg p-3 text-[11px] text-rose-650 dark:text-rose-400 font-mono whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto transition-colors duration-200">
                      {runResult.error}
                    </div>
                  ) : runResult.results ? (
                    <div className="space-y-2.5">
                      <div className="flex gap-1.5 border-b border-zinc-200 dark:border-zinc-900 pb-1.5 transition-colors duration-200">
                        {runResult.results.map((res, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveResultTab(idx)}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer border ${
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
                        <div className="space-y-2 text-[11px] font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-lg p-3 transition-colors duration-200">
                          <div><span className="text-zinc-450 dark:text-zinc-600 font-bold">Input Parameters:</span> <span className="text-zinc-700 dark:text-zinc-350">{runResult.results[activeResultTab].input}</span></div>
                          <div><span className="text-zinc-455 dark:text-zinc-600 font-bold">Expected Output:</span> <span className="text-zinc-700 dark:text-zinc-350">{runResult.results[activeResultTab].expectedOutput}</span></div>
                          <div>
                            <span className="text-zinc-455 dark:text-zinc-600 font-bold">Your stdout:</span>{' '}
                            <span className={runResult.results[activeResultTab].passed ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>
                              {runResult.results[activeResultTab].actualOutput || 'Empty/Null'}
                            </span>
                          </div>
                          {runResult.results[activeResultTab].stderr && (
                            <div className="bg-rose-50 border border-rose-200 text-rose-650 dark:bg-rose-950/15 dark:text-rose-400 p-2 rounded-md whitespace-pre-wrap text-[10px] leading-relaxed max-h-20 overflow-y-auto transition-colors duration-200">
                              {runResult.results[activeResultTab].stderr}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : (
                /* Submit Result */
                <div className="space-y-4 h-full flex flex-col justify-center">
                  <div className="text-center space-y-2.5">
                    {submitResult.status === 'Accepted' ? (
                      <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-teal-50 border border-teal-200 text-teal-700 dark:bg-teal-950/20 dark:border-teal-900/35 dark:text-teal-400 rounded-md text-[10px] font-bold uppercase transition-colors duration-200">
                          🎉 Accepted
                        </div>
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">All test cases passed!</h3>
                        <div className="flex justify-center gap-5 text-[10px] text-zinc-400 dark:text-zinc-500 pt-2 font-mono transition-colors duration-200">
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-600 block">Total cases</span>
                            <span className="text-zinc-800 dark:text-zinc-300 font-bold text-xs">{submitResult.testCasesPassed} / {submitResult.totalTestCases}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-600 block">Execution time</span>
                            <span className="text-zinc-800 dark:text-zinc-300 font-bold text-xs">{(submitResult.runtime || 0).toFixed(2)}s</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-600 block">Memory</span>
                            <span className="text-zinc-800 dark:text-zinc-300 font-bold text-xs">{submitResult.memory} KB</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/35 dark:text-rose-400 rounded-md text-[10px] font-bold uppercase transition-colors duration-200">
                          ❌ {submitResult.status || 'Failed'}
                        </div>
                        
                        {submitResult.errorMessage && (
                          <div className="max-w-md mx-auto bg-rose-50 border border-rose-200 dark:bg-rose-950/15 dark:border-rose-900/30 rounded-lg p-2.5 text-[10px] text-rose-650 dark:text-rose-400 font-mono text-left whitespace-pre-wrap leading-relaxed max-h-20 overflow-y-auto transition-colors duration-200">
                            {submitResult.errorMessage}
                          </div>
                        )}
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-550 font-mono font-bold">
                          Passed {submitResult.testCasesPassed || 0} / {submitResult.totalTestCases || 0} test cases.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProblemWorkspace;
