import { useState, useEffect, useRef } from 'react';
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

  // AI Assistant States
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [customApiKey, setCustomApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages, aiLoading]);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get(`/problem/ProblemById/${id}`);
        if (res.data && res.data.success) {
          setProblem(res.data.problem);
          const p = res.data.problem;
          // Set default start code based on default selected language
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

  const handleSendAiMessage = async (textToSend) => {
    const text = textToSend || aiInput;
    if (!text || !text.trim()) return;

    if (!user) {
      alert("Please sign in to use the AI Assistant.");
      navigate("/login");
      return;
    }

    const newMessage = { role: 'user', text };
    const updatedMessages = [...aiMessages, newMessage];
    
    setAiMessages(updatedMessages);
    if (!textToSend) setAiInput('');
    setAiLoading(true);

    try {
      const res = await axiosClient.post('/ai/chat', {
        message: text,
        code,
        language: selectedLanguage,
        problemTitle: problem?.title,
        problemDescription: problem?.description,
        history: aiMessages,
        runResult,
        submitResult,
        customApiKey
      });

      if (res.data && res.data.response) {
        setIsOfflineMode(!!res.data.isFallback);
        setAiMessages([...updatedMessages, { role: 'assistant', text: res.data.response }]);
      } else {
        setAiMessages([...updatedMessages, { role: 'assistant', text: "Sorry, I encountered an error processing your request." }]);
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.response?.data || err.message || "Unknown error";
      setAiMessages([...updatedMessages, { role: 'assistant', text: `Error: Could not connect to the AI Assistant. Details: ${errMsg}` }]);
    } finally {
      setAiLoading(false);
    }
  };

  const parseInlineStyles = (inlineText) => {
    if (!inlineText) return "";

    // Split by `inline code` first
    const codeParts = inlineText.split(/(`[^`\n]+`)/g);

    return codeParts.map((part, idx) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={idx} className="bg-zinc-150 dark:bg-zinc-800 text-indigo-650 dark:text-indigo-400 font-mono px-1 py-0.5 rounded text-[10px] mx-0.5 font-semibold">
            {part.slice(1, -1)}
          </code>
        );
      }

      // Split by **bold** tags
      const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
      return (
        <span key={idx}>
          {boldParts.map((bPart, bIdx) => {
            if (bPart.startsWith('**') && bPart.endsWith('**')) {
              return (
                <strong key={bIdx} className="font-extrabold text-zinc-950 dark:text-zinc-50">
                  {bPart.slice(2, -2)}
                </strong>
              );
            }
            return bPart;
          })}
        </span>
      );
    });
  };

  const parseMarkdownText = (textBlock) => {
    if (!textBlock) return null;

    const lines = textBlock.split('\n');
    let insideList = false;
    let listItems = [];
    const elements = [];

    const flushList = (keyPrefix) => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-${keyPrefix}`} className="list-disc pl-4 my-1.5 space-y-1 text-zinc-700 dark:text-zinc-300">
            {listItems}
          </ul>
        );
        listItems = [];
        insideList = false;
      }
    };

    lines.forEach((line, lineIdx) => {
      // Check if it is a heading (e.g. ### Header)
      const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (headerMatch) {
        flushList(lineIdx);
        const level = headerMatch[1].length;
        const headingText = headerMatch[2];
        const formattedContent = parseInlineStyles(headingText);

        if (level === 1) {
          elements.push(<h1 key={lineIdx} className="text-sm font-extrabold text-zinc-900 dark:text-white mt-3 mb-1.5">{formattedContent}</h1>);
        } else if (level === 2) {
          elements.push(<h2 key={lineIdx} className="text-xs font-bold text-zinc-900 dark:text-white mt-3 mb-1">{formattedContent}</h2>);
        } else {
          elements.push(<h3 key={lineIdx} className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 mt-2.5 mb-1.5 uppercase tracking-wide">{formattedContent}</h3>);
        }
        return;
      }

      // Check if it is a blockquote (e.g. > text)
      const quoteMatch = line.match(/^>\s+(.*)$/);
      if (quoteMatch) {
        flushList(lineIdx);
        const quoteText = quoteMatch[1];
        elements.push(
          <blockquote key={lineIdx} className="pl-3 border-l-2 border-indigo-500 text-zinc-500 dark:text-zinc-400 italic my-2 py-0.5 bg-zinc-100/30 dark:bg-zinc-900/20 pr-2 rounded-r-md">
            {parseInlineStyles(quoteText)}
          </blockquote>
        );
        return;
      }

      // Check if it is a bullet list item
      const bulletMatch = line.match(/^(\*|-)\s+(.*)$/);
      if (bulletMatch) {
        insideList = true;
        const itemText = bulletMatch[2];
        listItems.push(
          <li key={`li-${lineIdx}`} className="text-xs leading-relaxed">
            {parseInlineStyles(itemText)}
          </li>
        );
        return;
      }

      // Check if it is an ordered list item
      const orderedMatch = line.match(/^(\d+)\.\s+(.*)$/);
      if (orderedMatch) {
        insideList = true;
        const itemText = orderedMatch[2];
        listItems.push(
          <li key={`li-${lineIdx}`} className="list-decimal text-xs leading-relaxed ml-2">
            {parseInlineStyles(itemText)}
          </li>
        );
        return;
      }

      // Empty line
      if (line.trim() === '') {
        flushList(lineIdx);
        elements.push(<div key={`space-${lineIdx}`} className="h-1.5" />);
        return;
      }

      // Standard text line
      flushList(lineIdx);
      elements.push(
        <p key={lineIdx} className="my-1 leading-relaxed text-zinc-700 dark:text-zinc-300">
          {parseInlineStyles(line)}
        </p>
      );
    });

    flushList('end');
    return elements;
  };

  const renderMessageContent = (text) => {
    if (!text) return null;
    
    // Split by code blocks ```
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const match = part.match(/```(\w*)\n([\s\S]*?)```/);
        const lang = match ? match[1] : '';
        const codeText = match ? match[2] : part.slice(3, -3);
        
        return (
          <div key={index} className="my-2 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden font-mono text-[10px] text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-950/80">
            {lang && (
              <div className="bg-zinc-100 dark:bg-zinc-900 px-3 py-1 border-b border-zinc-200 dark:border-zinc-800 text-[9px] font-bold text-zinc-500 uppercase select-none">
                {lang}
              </div>
            )}
            <pre className="p-3 overflow-x-auto whitespace-pre">{codeText.trim()}</pre>
          </div>
        );
      }
      
      return <div key={index} className="font-sans text-xs">{parseMarkdownText(part)}</div>;
    });
  };

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
          <button
            type="button"
            onClick={() => setAiOpen(!aiOpen)}
            className={`btn btn-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer shadow-sm ${
              aiOpen
                ? 'bg-indigo-650 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-550 text-white border-transparent'
                : 'bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 border-zinc-200'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 21l-.813-5.096L3.091 15.09a.81.81 0 0 1 0-1.08l5.096-.813L9 8.096l.813 5.096 5.096.813a.81.81 0 0 1 0 1.08l-5.096.813ZM21 3.75c0 .16-.13.29-.29.29h-.5c-.16 0-.29-.13-.29-.29v-.5c0-.16.13-.29.29-.29h.5c.16 0 .29.13.29.29v.5ZM16.5 7.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25v-.5a.25.25 0 0 1 .25-.25h.5c.14 0 .25.11.25.25v.5Z" />
            </svg>
            <span>{aiOpen ? 'Hide AI' : 'AI Assistant'}</span>
          </button>
          
          <div className="h-3.5 w-px bg-zinc-200 dark:bg-zinc-800"></div>

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
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Left Panel - Description */}
        <div className={`w-full ${aiOpen ? 'md:w-[34%]' : 'md:w-1/2'} border-r border-zinc-200 dark:border-zinc-900 flex flex-col bg-white dark:bg-[#09090b] overflow-y-auto transition-all duration-300`}>
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
        <div className={`w-full ${aiOpen ? 'md:w-[34%]' : 'md:w-1/2'} flex flex-col bg-white dark:bg-zinc-950 overflow-hidden transition-all duration-300`}>
          
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

        {/* AI Assistant Sidebar */}
        <div className={`w-full md:w-[32%] border-l border-zinc-200 dark:border-zinc-900 flex flex-col bg-zinc-50 dark:bg-zinc-950/60 overflow-hidden transition-all duration-300 ${aiOpen ? 'translate-x-0' : 'hidden translate-x-full'}`}>
          
          {/* AI Panel Header */}
          <div className="border-b border-zinc-200 dark:border-zinc-900 h-11 shrink-0 flex items-center justify-between px-4 bg-zinc-100 dark:bg-zinc-900/10">
            <span className="text-[10px] font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-indigo-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 21l-.813-5.096L3.091 15.09a.81.81 0 0 1 0-1.08l5.096-.813L9 8.096l.813 5.096 5.096.813a.81.81 0 0 1 0 1.08l-5.096.813ZM21 3.75c0 .16-.13.29-.29.29h-.5c-.16 0-.29-.13-.29-.29v-.5c0-.16.13-.29.29-.29h.5c.16 0 .29.13.29.29v.5ZM16.5 7.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25v-.5a.25.25 0 0 1 .25-.25h.5c.14 0 .25.11.25.25v.5Z" />
              </svg>
              AI Coding Assistant
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowKeyInput(!showKeyInput)}
                className={`p-1 rounded-md cursor-pointer transition-colors ${showKeyInput ? 'text-indigo-650 bg-indigo-50 dark:bg-indigo-950/40' : 'text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                title="Configure API Key"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                </svg>
              </button>
              {aiMessages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setAiMessages([])}
                  className="p-1 rounded-md text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
                  title="Clear chat history"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                onClick={() => setAiOpen(false)}
                className="p-1 rounded-md text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
                title="Collapse sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* API Key Config Panel */}
          {showKeyInput && (
            <div className="p-3 border-b border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 flex flex-col gap-2 transition-all shrink-0">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Custom Gemini API Key</label>
                {customApiKey && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomApiKey('');
                      localStorage.removeItem('gemini_api_key');
                    }}
                    className="text-[9px] font-bold text-rose-600 dark:text-rose-450 hover:underline cursor-pointer"
                  >
                    Clear Key
                  </button>
                )}
              </div>
              <input
                type="password"
                value={customApiKey}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomApiKey(val);
                  localStorage.setItem('gemini_api_key', val);
                }}
                placeholder="Enter your GEMINI_API_KEY..."
                className="w-full bg-zinc-50 dark:bg-zinc-905 border border-zinc-200 dark:border-zinc-900 rounded-lg px-2.5 py-1.5 text-[10px] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
              />
              <p className="text-[9px] text-zinc-500 dark:text-zinc-500 leading-normal">
                Saved locally in your browser storage. If not set, the assistant uses the backend server key configuration.
              </p>
            </div>
          )}

          {/* Offline Fallback Alert Banner */}
          {isOfflineMode && (
            <div className="bg-amber-50/70 dark:bg-amber-950/20 border-b border-amber-200/50 dark:border-amber-900/40 p-3 text-[10px] text-amber-800 dark:text-amber-400 leading-relaxed flex items-start gap-2 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              <div>
                <strong>Simulated Fallback Mode active.</strong> Live conversation is offline. Configure <code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded font-mono font-bold text-[9px]">GEMINI_API_KEY</code> in your backend <code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded font-mono font-bold text-[9px]">.env</code> file, or click the 🔑 key icon above to set your own key.
              </div>
            </div>
          )}

          {/* AI Panel Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
            {aiMessages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/35 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-500">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 21l-.813-5.096L3.091 15.09a.81.81 0 0 1 0-1.08l5.096-.813L9 8.096l.813 5.096 5.096.813a.81.81 0 0 1 0 1.08l-5.096.813ZM21 3.75c0 .16-.13.29-.29.29h-.5c-.16 0-.29-.13-.29-.29v-.5c0-.16.13-.29.29-.29h.5c.16 0 .29.13.29.29v.5ZM16.5 7.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25v-.5a.25.25 0 0 1 .25-.25h.5c.14 0 .25.11.25.25v.5Z" />
                  </svg>
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white">Need help with this challenge?</h4>
                  <p className="text-[10px] text-zinc-500 max-w-[240px] leading-relaxed mx-auto">
                    Ask me for coding concepts, hints, logic explanations, complexity checks, or help debugging.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 w-full pt-4 max-w-[280px]">
                  {[
                    { label: "💡 Explain Problem", prompt: "Can you explain the requirements of this coding problem in simple terms?" },
                    { label: "🔑 Give a Hint", prompt: "I'm stuck. Can you give me a conceptual hint on how to approach this problem?" },
                    { label: "🐛 Find Bugs", prompt: "Here is my code. Can you review it and help me find any logical bugs or edge-case failures?" },
                    { label: "⚡ Optimize Code", prompt: "How can I optimize the time and space complexity of my current code?" }
                  ].map((btn, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendAiMessage(btn.prompt)}
                      className="p-2.5 text-[10px] font-bold text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-indigo-400 dark:hover:border-indigo-600 rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {aiMessages.map((msg, index) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        isUser
                          ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                          : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-bl-none shadow-xs'
                      }`}>
                        {!isUser && (
                          <div className="font-bold text-[9px] text-indigo-500 uppercase tracking-wider mb-1 flex items-center gap-1 select-none">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                            CodeZen AI
                          </div>
                        )}
                        <div className="whitespace-pre-wrap break-words font-sans selection:bg-indigo-500/20">
                          {renderMessageContent(msg.text)}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 rounded-2xl rounded-bl-none px-3.5 py-2.5 shadow-xs flex items-center gap-2">
                      <span className="loading loading-dots loading-xs text-indigo-500"></span>
                      <span className="text-[10px] font-medium tracking-wide">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* AI Panel Input Footer */}
          <div className="p-3 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-100/50 dark:bg-zinc-900/10">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendAiMessage();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Ask CodeZen AI a question..."
                className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
                disabled={aiLoading}
              />
              <button
                type="submit"
                disabled={aiLoading || !aiInput.trim()}
                className="btn btn-xs h-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-3 cursor-pointer border-none flex items-center justify-center disabled:opacity-40"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProblemWorkspace;
