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
  const [activeResultTab, setActiveResultTab] = useState(0);
  const [viewMode, setViewMode] = useState('description');
  
  // AI Assistant states
  const [leftTab, setLeftTab] = useState('description'); // 'description' | 'ai'
  const [aiMessages, setAiMessages] = useState([
    { sender: 'ai', text: 'Hello! I am your CodeZen AI Assistant. How can I help you with this problem?' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

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

      const reply = res.data?.reply || res.data?.message || 'AI assistant processed your request.';
      setAiMessages([...newMessages, { sender: 'ai', text: reply }]);
    } catch (err) {
      console.error('AI Chat Error:', err);
      const errorMsg = err.response?.data?.message || err.response?.data || 'Failed to reach AI Assistant. Please log in to chat.';
      setAiMessages([...newMessages, { sender: 'ai', text: `⚠️ ${typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)}` }]);
    } finally {
      setAiLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center gap-4 text-zinc-550">
        <span className="loading loading-spinner loading-md text-cyan-500"></span>
        <p className="text-xs">Setting up problem workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center gap-4 p-4 text-center">
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
    <div className="min-h-screen bg-[#09090b] text-zinc-150 font-sans flex flex-col h-screen overflow-hidden">
      
      {/* Workspace Header */}
      <header className="border-b border-zinc-900 bg-[#09090b] h-12 shrink-0 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-zinc-550 hover:text-white transition-colors flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Back</span>
          </Link>
          <div className="h-3.5 w-px bg-zinc-800"></div>
          <span className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-xs">{problem.title}</span>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 font-bold uppercase">Candidate: {user.firstName}</span>
            </div>
          ) : (
            <Link to="/login" className="btn btn-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-950 rounded-lg border-none text-[10px] font-bold">
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Split Panels Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Panel - Description & AI Assistant */}
        <div className="w-full md:w-1/2 border-r border-zinc-900 flex flex-col bg-[#09090b] overflow-y-auto">
          <div className="border-b border-zinc-900 h-10 shrink-0 flex items-center px-4 bg-zinc-900/20 gap-4">
            <button
              type="button"
              onClick={() => setLeftTab('description')}
              className={`text-[10px] font-bold uppercase tracking-wider py-2.5 transition-colors cursor-pointer border-b-2 ${
                leftTab === 'description'
                  ? 'text-white border-cyan-500'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              Description
            </button>
            <button
              type="button"
              onClick={() => setLeftTab('ai')}
              className={`text-[10px] font-bold uppercase tracking-wider py-2.5 transition-colors cursor-pointer flex items-center gap-1.5 border-b-2 ${
                leftTab === 'ai'
                  ? 'text-cyan-400 border-cyan-500'
                  : 'text-zinc-500 border-transparent hover:text-cyan-400'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-cyan-400">
                <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.43 7.93l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258.906a1.5 1.5 0 0 0 1.04 1.04l.906.258a.75.75 0 0 1 0 1.456l-.906.258a1.5 1.5 0 0 0-1.04 1.04l-.258.906a.75.75 0 0 1-1.456 0l-.258-.906a1.5 1.5 0 0 0-1.04-1.04l-.906-.258a.75.75 0 0 1 0-1.456l.906-.258a1.5 1.5 0 0 0 1.04-1.04l.258-.906A.75.75 0 0 1 18 1.5Z" clipRule="evenodd" />
              </svg>
              AI Assistant
            </button>
          </div>

          {leftTab === 'description' ? (
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white mb-2">{problem.title}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`badge border text-[10px] px-2 py-0.5 font-bold rounded-md capitalize ${diffColorClass}`}>
                    {problem.difficulty}
                  </span>
                  
                  <div className="flex gap-1">
                    {problem.tags?.map((tag) => (
                      <span key={tag} className="text-[9px] font-bold bg-zinc-900 border border-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded uppercase">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-xs leading-relaxed text-zinc-350 whitespace-pre-wrap font-sans border-t border-zinc-900 pt-5">
                {problem.description}
              </div>

              {/* Examples */}
              <div className="space-y-3.5 border-t border-zinc-900 pt-5">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Examples</h4>
                {problem.visibleTestCases?.map((tc, idx) => (
                  <div key={idx} className="bg-zinc-900/10 border border-zinc-900 rounded-xl p-4 space-y-2 text-[11px]">
                    <span className="font-bold text-cyan-500 block">Example {idx + 1}:</span>
                    <div className="grid grid-cols-1 gap-1 font-mono text-zinc-400">
                      <div><span className="text-zinc-600 font-bold">Input:</span> {tc.input}</div>
                      <div><span className="text-zinc-600 font-bold">Output:</span> {tc.output}</div>
                      {tc.explanation && (
                        <div className="mt-1 leading-relaxed"><span className="text-zinc-600 font-bold">Explanation:</span> {tc.explanation}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* AI Assistant Chat UI */
            <div className="flex-1 flex flex-col h-full overflow-hidden p-4 space-y-3 bg-zinc-950/40">
              <div className="flex-1 overflow-y-auto space-y-3 p-2 font-sans text-xs">
                {aiMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[9px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">
                      {msg.sender === 'user' ? 'You' : 'CodeZen AI'}
                    </span>
                    <div
                      className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                        msg.sender === 'user'
                          ? 'bg-cyan-600 text-white font-medium shadow-md'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div className="flex items-center gap-2 text-zinc-400 text-xs py-2 px-1">
                    <span className="loading loading-dots loading-xs text-cyan-400"></span>
                    <span>AI is analyzing your code & request...</span>
                  </div>
                )}
              </div>

              {/* Quick AI Prompt Chips */}
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => handleSendAiMessage('Can you give me a hint on how to approach this problem?')}
                  disabled={aiLoading}
                  className="text-[10px] font-semibold bg-zinc-900 hover:bg-zinc-800 text-cyan-400 border border-zinc-800 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                >
                  💡 Give Hint
                </button>
                <button
                  type="button"
                  onClick={() => handleSendAiMessage('Please check my current code for any bugs or edge cases.')}
                  disabled={aiLoading}
                  className="text-[10px] font-semibold bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-800 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                >
                  🐛 Debug Code
                </button>
                <button
                  type="button"
                  onClick={() => handleSendAiMessage('How can I optimize the time and space complexity of my solution?')}
                  disabled={aiLoading}
                  className="text-[10px] font-semibold bg-zinc-900 hover:bg-zinc-800 text-teal-400 border border-zinc-800 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                >
                  ⚡ Optimize Complexity
                </button>
              </div>

              {/* Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendAiMessage();
                }}
                className="flex items-center gap-2 pt-1"
              >
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Ask AI Assistant a question..."
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={aiLoading || !aiInput.trim()}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                >
                  Send
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Panel - Code Editor */}
        <div className="w-full md:w-1/2 flex flex-col bg-zinc-950 overflow-hidden">
          
          {/* Editor Control bar */}
          <div className="border-b border-zinc-900 h-10 shrink-0 flex items-center justify-between px-4 bg-zinc-900/10">
            <div className="flex items-center gap-1">
              <select
                value={selectedLanguage}
                onChange={handleLanguageChange}
                className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-bold rounded-md px-2.5 py-1 focus:outline-none focus:border-cyan-500 cursor-pointer uppercase tracking-wider"
              >
                <option value="javascript" className="bg-zinc-900 text-zinc-200 py-1">JAVASCRIPT</option>
                <option value="python" className="bg-zinc-900 text-zinc-200 py-1">PYTHON</option>
                <option value="c++" className="bg-zinc-900 text-zinc-200 py-1">C++</option>
                <option value="java" className="bg-zinc-900 text-zinc-200 py-1">JAVA</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleRunCode}
                disabled={running || submitting}
                className="btn btn-xs bg-[#09090b] hover:bg-zinc-900 text-zinc-450 hover:text-white rounded-md px-2.5 py-1 cursor-pointer border border-zinc-900 text-[10px] font-bold transition-colors disabled:opacity-40"
              >
                {running ? 'Running...' : 'Run Code'}
              </button>
              
              <button
                onClick={handleSubmitCode}
                disabled={running || submitting}
                className="btn btn-xs bg-cyan-650 hover:bg-cyan-600 text-white rounded-md px-3 py-1 cursor-pointer border-none text-[10px] font-bold transition-colors disabled:opacity-40 shadow-lg shadow-cyan-500/10"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 relative border-b border-zinc-900 overflow-hidden">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck="false"
              className="w-full h-full p-4 font-mono text-xs bg-[#09090b]/40 text-zinc-200 resize-none focus:outline-none leading-relaxed"
              style={{ tabSize: 4 }}
            />
          </div>

          {/* Console Output */}
          <div className="h-56 shrink-0 bg-[#09090b] border-t border-zinc-900 overflow-y-auto flex flex-col">
            <div className="border-b border-zinc-900 bg-zinc-900/10 px-4 h-8 shrink-0 flex items-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              Output Console
            </div>
            
            <div className="flex-1 p-4">
              {running || submitting ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-zinc-600">
                  <span className="loading loading-spinner loading-sm text-cyan-500"></span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Compiling challenge...</span>
                </div>
              ) : !runResult && !submitResult ? (
                <div className="h-full flex items-center justify-center text-zinc-650 text-[11px]">
                  Run or Submit your code to see evaluation results.
                </div>
              ) : runResult ? (
                /* Run Result */
                <div className="space-y-3.5 h-full">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="font-bold text-zinc-550">Status:</span>
                    <span className={`badge border text-[9px] px-2 py-0.5 rounded-md font-bold uppercase ${
                      runResult.status === 'Accepted' ? 'bg-teal-950/20 border-teal-900/35 text-teal-400' : 'bg-rose-950/20 border-rose-900/35 text-rose-400'
                    }`}>
                      {runResult.status}
                    </span>
                  </div>

                  {runResult.error ? (
                    <div className="bg-rose-950/15 border border-rose-900/30 rounded-lg p-3 text-[11px] text-rose-400 font-mono whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
                      {runResult.error}
                    </div>
                  ) : runResult.results ? (
                    <div className="space-y-2.5">
                      <div className="flex gap-1.5 border-b border-zinc-900 pb-1.5">
                        {runResult.results.map((res, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveResultTab(idx)}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer border ${
                              activeResultTab === idx
                                ? 'bg-cyan-950/20 border-cyan-800 text-cyan-400'
                                : 'bg-[#09090b] border-zinc-900 text-zinc-500 hover:bg-zinc-900'
                            }`}
                          >
                            Case {idx + 1} ({res.passed ? 'Pass' : 'Fail'})
                          </button>
                        ))}
                      </div>

                      {runResult.results[activeResultTab] && (
                        <div className="space-y-2 text-[11px] font-mono bg-zinc-950 border border-zinc-900 rounded-lg p-3">
                          <div><span className="text-zinc-600 font-bold">Input Parameters:</span> <span className="text-zinc-350">{runResult.results[activeResultTab].input}</span></div>
                          <div><span className="text-zinc-600 font-bold">Expected Output:</span> <span className="text-zinc-350">{runResult.results[activeResultTab].expectedOutput}</span></div>
                          <div>
                            <span className="text-zinc-600 font-bold">Your stdout:</span>{' '}
                            <span className={runResult.results[activeResultTab].passed ? 'text-teal-400 font-bold' : 'text-rose-400 font-bold'}>
                              {runResult.results[activeResultTab].actualOutput || 'Empty/Null'}
                            </span>
                          </div>
                          {runResult.results[activeResultTab].stderr && (
                            <div className="bg-rose-950/15 text-rose-400 p-2 rounded-md whitespace-pre-wrap text-[10px] leading-relaxed max-h-20 overflow-y-auto">
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
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-teal-950/20 border border-teal-900/35 text-teal-400 rounded-md text-[10px] font-bold uppercase">
                           Accepted
                        </div>
                        <h3 className="text-sm font-bold text-white">All test cases passed!</h3>
                        <div className="flex justify-center gap-5 text-[10px] text-zinc-500 pt-2 font-mono">
                          <div>
                            <span className="text-zinc-600 block">Total cases</span>
                            <span className="text-zinc-300 font-bold text-xs">{submitResult.testCasesPassed} / {submitResult.totalTestCases}</span>
                          </div>
                          <div>
                            <span className="text-zinc-600 block">Execution time</span>
                            <span className="text-zinc-300 font-bold text-xs">{(submitResult.runtime || 0).toFixed(2)}s</span>
                          </div>
                          <div>
                            <span className="text-zinc-600 block">Memory</span>
                            <span className="text-zinc-300 font-bold text-xs">{submitResult.memory} KB</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-rose-950/20 border border-rose-900/35 text-rose-400 rounded-md text-[10px] font-bold uppercase">
                           {submitResult.status || 'Failed'}
                        </div>
                        
                        {submitResult.errorMessage && (
                          <div className="max-w-md mx-auto bg-rose-950/15 border border-rose-900/30 rounded-lg p-2.5 text-[10px] text-rose-400 font-mono text-left whitespace-pre-wrap leading-relaxed max-h-20 overflow-y-auto">
                            {submitResult.errorMessage}
                          </div>
                        )}
                        <p className="text-[10px] text-zinc-550 font-mono font-bold">
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
