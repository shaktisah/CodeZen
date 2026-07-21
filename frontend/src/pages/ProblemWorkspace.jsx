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

  // Editor configuration
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');

  // Execution states
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [activeTab, setActiveTab] = useState('code'); // 'code' | 'testcase' | 'result'
  const [activeResultTab, setActiveResultTab] = useState(0);
  const [activeTestcaseTab, setActiveTestcaseTab] = useState(0);

  // AI Assistant states
  const [showAi, setShowAi] = useState(false);
  const [aiMessages, setAiMessages] = useState([
    {
      sender: 'ai',
      text: `Hello! I'd be glad to help you break down this problem or assist you with debugging, hints, and optimization!`
    }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

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

          setAiMessages([
            {
              sender: 'ai',
              text: `👋 Hi! I'm your CodeZen AI Assistant for **${p.title}**.\n\nNeed help? Ask a question or click one of the quick prompt options below!`
            }
          ]);
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
        return 'function solve(nums, target) {\n    // Write your JavaScript code here\n}';
      case 'python':
      case 'py':
        return 'def solve(nums, target):\n    # Write your Python code here\n    pass';
      case 'c++':
      case 'cpp':
        return 'class Solution {\npublic:\n    vector<int> solve(vector<int>& nums, int target) {\n        // Write your C++ code here\n    }\n};';
      case 'java':
        return 'class Solution {\n    public int[] solve(int[] nums, int target) {\n        // Write your Java code here\n    }\n}';
      default:
        return '// Write your code here';
    }
  };

  const handleLanguageChange = (lang) => {
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
    setActiveTab('result');

    try {
      const res = await axiosClient.post(`/submission/runCode/${id}`, {
        code,
        language: selectedLanguage
      });
      setRunResult(res.data);
      setActiveResultTab(0);
    } catch (err) {
      console.error(err);
      setRunResult({
        success: false,
        status: 'Error',
        error: err.response?.data || err.message || 'Execution request failed'
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
    setActiveTab('result');

    try {
      const res = await axiosClient.post(`/submission/submit/${id}`, {
        code,
        language: selectedLanguage
      });
      setSubmitResult(res.data);
    } catch (err) {
      console.error(err);
      setSubmitResult({
        status: 'Error',
        errorMessage: err.response?.data || err.message || 'Submission request failed'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendAiMessage = async (customMsg) => {
    const textToSend = customMsg || aiInput;
    if (!textToSend.trim() || aiLoading) return;

    const newMessages = [...aiMessages, { sender: 'user', text: textToSend }];
    setAiMessages(newMessages);
    if (!customMsg) setAiInput('');
    setAiLoading(true);

    try {
      const res = await axiosClient.post('/ai/chat', {
        message: textToSend,
        code,
        language: selectedLanguage,
        problemTitle: problem?.title,
        problemDescription: problem?.description,
        runResult,
        submitResult
      });

      const reply = res.data?.response || res.data?.reply || res.data?.message || 'AI assistant processed your request.';
      setAiMessages([...newMessages, { sender: 'ai', text: reply }]);
    } catch (err) {
      console.error('AI Chat Error:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.response?.data || 'Failed to reach AI Assistant.';
      setAiMessages([...newMessages, { sender: 'ai', text: `⚠️ ${typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)}` }]);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center gap-4 text-zinc-400 font-sans">
        <span className="loading loading-spinner loading-md text-indigo-500"></span>
        <p className="text-xs">Setting up problem workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center gap-4 p-4 text-center font-sans">
        <div className="alert alert-error max-w-md bg-red-950/20 border border-red-900/40 text-red-400 rounded-xl py-3 text-xs">
          <span>{error}</span>
        </div>
        <Link to="/" className="btn btn-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-950 border-none rounded-lg font-bold py-2 px-4 shadow-sm">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  let diffColorClass = 'text-teal-400 bg-teal-950/20 border-teal-900/35';
  if (problem.difficulty?.toLowerCase() === 'medium') {
    diffColorClass = 'text-amber-400 bg-amber-950/20 border-amber-900/35';
  } else if (problem.difficulty?.toLowerCase() === 'hard') {
    diffColorClass = 'text-rose-400 bg-rose-950/20 border-rose-900/35';
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans flex flex-col h-screen overflow-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Top Navbar Header */}
      <header className="border-b border-zinc-900 bg-[#09090b] h-12 shrink-0 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 font-semibold text-xs">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            <span className="uppercase tracking-wider">BACK</span>
          </Link>
          <div className="h-3.5 w-px bg-zinc-800"></div>
          <span className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-xs">{problem.title}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* AI Toggle Button */}
          <button
            type="button"
            onClick={() => setShowAi(!showAi)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer shadow-md shadow-indigo-600/20"
          >
            <span className="text-sm">+</span>
            <span>{showAi ? 'Hide AI' : 'AI Assistant'}</span>
          </button>

          <div className="h-3.5 w-px bg-zinc-800"></div>

          {user ? (
            <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">
              CANDIDATE: <span className="text-zinc-200">{user.firstName} {user.lastName || ''}</span>
            </span>
          ) : (
            <Link to="/login" className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-1 text-xs font-bold transition-colors">
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Column: Problem Description */}
        <div className={`border-r border-zinc-900 flex flex-col bg-[#09090b] overflow-y-auto ${showAi ? 'w-full lg:w-[32%]' : 'w-full lg:w-[42%]'}`}>
          <div className="border-b border-zinc-900 h-11 shrink-0 flex items-center px-6 bg-zinc-900/10">
            <span className="text-xs font-bold text-white uppercase tracking-wider border-b-2 border-indigo-500 py-3">
              DESCRIPTION
            </span>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-2.5">{problem.title}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`badge border text-[10px] px-2.5 py-0.5 font-bold rounded-md capitalize ${diffColorClass}`}>
                  {problem.difficulty}
                </span>
                {problem.tags?.map((tag) => (
                  <span key={tag} className="text-[9px] font-bold bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap font-sans border-t border-zinc-900 pt-5">
              {problem.description}
            </div>

            {/* Examples */}
            <div className="space-y-4 border-t border-zinc-900 pt-5">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">EXAMPLES</h4>
              {problem.visibleTestCases?.map((tc, idx) => (
                <div key={idx} className="bg-zinc-900/30 border border-zinc-800/60 rounded-xl p-4 space-y-2 text-xs">
                  <span className="font-bold text-indigo-400 block">Example {idx + 1}:</span>
                  <div className="grid grid-cols-1 gap-1.5 font-mono text-zinc-300">
                    <div><span className="text-zinc-500 font-bold">Input:</span> {tc.input}</div>
                    <div><span className="text-zinc-500 font-bold">Output:</span> {tc.output}</div>
                    {tc.explanation && (
                      <div className="mt-1 leading-relaxed"><span className="text-zinc-500 font-bold">Explanation:</span> {tc.explanation}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Middle Column: Code Editor & Execution Panel */}
        <div className={`flex flex-col bg-zinc-950 border-r border-zinc-900 overflow-hidden ${showAi ? 'w-full lg:w-[38%]' : 'w-full lg:w-[58%]'}`}>
          
          {/* Editor Sub-header Tabs & Buttons */}
          <div className="border-b border-zinc-900 h-11 shrink-0 flex items-center justify-between px-4 bg-zinc-900/20">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className={`text-xs font-bold uppercase tracking-wider py-3 transition-colors cursor-pointer border-b-2 ${
                  activeTab === 'code' ? 'text-white border-indigo-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'
                }`}
              >
                Code
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('testcase')}
                className={`text-xs font-bold uppercase tracking-wider py-3 transition-colors cursor-pointer border-b-2 ${
                  activeTab === 'testcase' ? 'text-white border-indigo-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'
                }`}
              >
                Testcase
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('result')}
                className={`text-xs font-bold uppercase tracking-wider py-3 transition-colors cursor-pointer border-b-2 ${
                  activeTab === 'result' ? 'text-white border-indigo-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'
                }`}
              >
                Result
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRunCode}
                disabled={running || submitting}
                className="bg-transparent hover:bg-zinc-900 text-zinc-300 border border-zinc-700 font-bold px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-40"
              >
                {running ? 'Running...' : 'Run Code'}
              </button>

              <button
                type="button"
                onClick={handleSubmitCode}
                disabled={running || submitting}
                className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold px-4 py-1 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-40 shadow-md shadow-cyan-500/20"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>

          {/* Language Selection Pills (visible in Code tab) */}
          {activeTab === 'code' && (
            <div className="border-b border-zinc-900 bg-[#09090b] px-4 py-2 flex items-center gap-2">
              {['javascript', 'python', 'c++', 'java'].map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleLanguageChange(lang)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold tracking-wider transition-colors cursor-pointer uppercase ${
                    selectedLanguage.toLowerCase() === lang
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          )}

          {/* Main Middle Content Area based on activeTab */}
          <div className="flex-1 relative overflow-hidden bg-[#09090b]/50">
            {activeTab === 'code' && (
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck="false"
                className="w-full h-full p-4 font-mono text-xs bg-transparent text-zinc-100 resize-none focus:outline-none leading-relaxed"
                style={{ tabSize: 4 }}
              />
            )}

            {activeTab === 'testcase' && (
              <div className="h-full overflow-y-auto p-4 space-y-4 font-sans text-xs">
                <div className="flex gap-2 border-b border-zinc-900 pb-3">
                  {problem?.visibleTestCases?.map((tc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveTestcaseTab(idx)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                        activeTestcaseTab === idx
                          ? 'bg-indigo-950/40 border-indigo-600 text-indigo-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                      }`}
                    >
                      Case {idx + 1}
                    </button>
                  ))}
                </div>

                {problem?.visibleTestCases?.[activeTestcaseTab] ? (
                  <div className="space-y-4 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                        Input
                      </label>
                      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 font-mono text-xs text-zinc-200 whitespace-pre-wrap">
                        {problem.visibleTestCases[activeTestcaseTab].input}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                        Expected Output
                      </label>
                      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 font-mono text-xs text-zinc-200 whitespace-pre-wrap">
                        {problem.visibleTestCases[activeTestcaseTab].output}
                      </div>
                    </div>

                    {problem.visibleTestCases[activeTestcaseTab].explanation && (
                      <div>
                        <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                          Explanation
                        </label>
                        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 text-xs text-zinc-400 leading-relaxed">
                          {problem.visibleTestCases[activeTestcaseTab].explanation}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-zinc-500 text-xs py-4">
                    No visible test cases provided for this problem.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'result' && (
              <div className="h-full overflow-y-auto flex flex-col p-4 font-sans text-xs">
                {running || submitting ? (
                  <div className="h-full flex flex-col items-center justify-center gap-2 text-zinc-400">
                    <span className="loading loading-spinner loading-sm text-indigo-500"></span>
                    <span className="text-xs font-bold uppercase tracking-wider">Evaluating solution...</span>
                  </div>
                ) : !runResult && !submitResult ? (
                  <div className="h-full flex items-center justify-center text-zinc-500 text-xs">
                    Run or Submit your code to see evaluation results.
                  </div>
                ) : runResult ? (
                  /* Run Result */
                  <div className="space-y-3 h-full">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-zinc-400">Status:</span>
                      <span className={`badge border text-[10px] px-2.5 py-0.5 rounded-md font-bold uppercase ${
                        runResult.status === 'Accepted' ? 'bg-teal-950/20 border-teal-900/35 text-teal-400' : 'bg-rose-950/20 border-rose-900/35 text-rose-400'
                      }`}>
                        {runResult.status}
                      </span>
                    </div>

                    {runResult.error ? (
                      <div className="bg-rose-950/20 border border-rose-900/40 rounded-lg p-3 text-xs text-rose-400 font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                        {runResult.error}
                      </div>
                    ) : runResult.results ? (
                      <div className="space-y-3">
                        <div className="flex gap-2 border-b border-zinc-900 pb-2">
                          {runResult.results.map((res, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setActiveResultTab(idx)}
                              className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer border ${
                                activeResultTab === idx
                                  ? 'bg-indigo-950/40 border-indigo-600 text-indigo-400'
                                  : 'bg-[#09090b] border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                              }`}
                            >
                              Case {idx + 1} ({res.passed ? 'Pass' : 'Fail'})
                            </button>
                          ))}
                        </div>

                        {runResult.results[activeResultTab] && (
                          <div className="space-y-2 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                            <div><span className="text-zinc-500 font-bold">Input:</span> <span className="text-zinc-200">{runResult.results[activeResultTab].input}</span></div>
                            <div><span className="text-zinc-500 font-bold">Expected Output:</span> <span className="text-zinc-200">{runResult.results[activeResultTab].expectedOutput}</span></div>
                            <div>
                              <span className="text-zinc-500 font-bold">Your stdout:</span>{' '}
                              <span className={runResult.results[activeResultTab].passed ? 'text-teal-400 font-bold' : 'text-rose-400 font-bold'}>
                                {runResult.results[activeResultTab].actualOutput || 'Empty/Null'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  /* Submit Result */
                  <div className="space-y-3 h-full flex flex-col justify-center text-center">
                    {submitResult.status === 'Accepted' ? (
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-950/20 border border-teal-900/35 text-teal-400 rounded-md text-xs font-bold uppercase">
                          Accepted
                        </div>
                        <h3 className="text-sm font-bold text-white">All test cases passed!</h3>
                        <div className="flex justify-center gap-6 text-xs text-zinc-400 pt-2 font-mono">
                          <div><span className="text-zinc-500 block">Passed</span><span className="text-zinc-200 font-bold">{submitResult.testCasesPassed} / {submitResult.totalTestCases}</span></div>
                          <div><span className="text-zinc-500 block">Runtime</span><span className="text-zinc-200 font-bold">{(submitResult.runtime || 0).toFixed(2)}s</span></div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-950/20 border border-rose-900/35 text-rose-400 rounded-md text-xs font-bold uppercase">
                          {submitResult.status || 'Failed'}
                        </div>
                        <p className="text-xs text-zinc-400 font-mono">
                          Passed {submitResult.testCasesPassed || 0} / {submitResult.totalTestCases || 0} test cases.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dedicated Collapsible AI Assistant Panel */}
        {showAi && (
          <div className="w-full lg:w-[30%] border-l border-zinc-900 flex flex-col bg-[#09090b] overflow-hidden">
            
            {/* AI Assistant Header */}
            <div className="border-b border-zinc-900 h-11 shrink-0 flex items-center justify-between px-4 bg-zinc-900/20">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-indigo-400">
                  <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.43 7.93l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258.906a1.5 1.5 0 0 0 1.04 1.04l.906.258a.75.75 0 0 1 0 1.456l-.906.258a1.5 1.5 0 0 0-1.04 1.04l-.258.906a.75.75 0 0 1-1.456 0l-.258-.906a1.5 1.5 0 0 0-1.04-1.04l-.906-.258a.75.75 0 0 1 0-1.456l.906-.258a1.5 1.5 0 0 0 1.04-1.04l.258-.906A.75.75 0 0 1 18 1.5Z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  AI CODING ASSISTANT
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  title="Clear Chat"
                  onClick={() => setAiMessages([{ sender: 'ai', text: 'Chat history cleared. How can I help you?' }])}
                  className="text-zinc-400 hover:text-zinc-200 transition-colors p-1 cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>

                <button
                  type="button"
                  title="Close AI Assistant"
                  onClick={() => setShowAi(false)}
                  className="text-zinc-400 hover:text-zinc-200 transition-colors p-1 cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
              {aiMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {msg.sender === 'ai' && (
                    <span className="text-[10px] font-bold text-indigo-400 mb-1 flex items-center gap-1 uppercase tracking-wider">
                      ● CODEZEN AI
                    </span>
                  )}
                  <div
                    className={`max-w-[92%] rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white font-medium shadow-md'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {aiLoading && (
                <div className="flex items-center gap-2 text-indigo-400 text-xs py-2 px-1">
                  <span className="loading loading-dots loading-xs text-indigo-400"></span>
                  <span>AI is thinking & analyzing code...</span>
                </div>
              )}
            </div>

            {/* Quick Prompt Chips */}
            <div className="px-3 pt-2.5 pb-1 bg-zinc-950 flex items-center gap-1.5 overflow-x-auto text-[11px] border-t border-zinc-900">
              <button
                type="button"
                onClick={() => handleSendAiMessage("Can you give me a hint for this problem?")}
                disabled={aiLoading}
                className="shrink-0 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-indigo-500/50 text-zinc-300 hover:text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                💡 Hint
              </button>
              <button
                type="button"
                onClick={() => handleSendAiMessage("Explain this problem simply.")}
                disabled={aiLoading}
                className="shrink-0 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-indigo-500/50 text-zinc-300 hover:text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                📚 Explain
              </button>
              <button
                type="button"
                onClick={() => handleSendAiMessage("Check my current code for bugs or errors.")}
                disabled={aiLoading}
                className="shrink-0 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-indigo-500/50 text-zinc-300 hover:text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                🐛 Debug
              </button>
              <button
                type="button"
                onClick={() => handleSendAiMessage("How can I optimize the time and space complexity of my code?")}
                disabled={aiLoading}
                className="shrink-0 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-indigo-500/50 text-zinc-300 hover:text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                ⚡ Optimize
              </button>
            </div>

            {/* Chat Input Area */}
            <div className="p-3 bg-zinc-950">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendAiMessage();
                }}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Ask CodeZen AI a question..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-4 pr-11 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={aiLoading || !aiInput.trim()}
                  className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.917H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.917a.75.75 0 0 0 .926.941l18-7.5a.75.75 0 0 0 0-1.382l-18-7.5Z" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProblemWorkspace;
