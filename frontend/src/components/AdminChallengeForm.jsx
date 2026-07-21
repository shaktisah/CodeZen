import React, { useState, useEffect } from 'react';

function AdminChallengeForm({ editingProblem, onSubmit, onCancel, submitting, activeTab }) {
  // Create/Edit Problem Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [tagsInput, setTagsInput] = useState('');
  
  const [visibleTestCases, setVisibleTestCases] = useState([{ input: '', output: '', explanation: '' }]);
  const [hiddenTestCases, setHiddenTestCases] = useState([{ input: '', output: '' }]);
  
  // Code templates
  const [startCodeJS, setStartCodeJS] = useState('');
  const [startCodePy, setStartCodePy] = useState('');
  const [startCodeCPP, setStartCodeCPP] = useState('');
  const [startCodeJava, setStartCodeJava] = useState('');
  
  const [refSolutionJS, setRefSolutionJS] = useState('');
  const [refSolutionPy, setRefSolutionPy] = useState('');
  const [refSolutionCPP, setRefSolutionCPP] = useState('');
  const [refSolutionJava, setRefSolutionJava] = useState('');

  const [localMessage, setLocalMessage] = useState(null);

  // Two Sum Template generator
  const loadTwoSumTemplate = () => {
    setTitle('Two Sum');
    setDescription('Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.');
    setDifficulty('easy');
    setTagsInput('Array, Hash Table, Algorithms');
    setVisibleTestCases([
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]', explanation: 'nums[1] + nums[2] == 6, we return [1, 2].' }
    ]);
    setHiddenTestCases([
      { input: 'nums = [3,3], target = 6', output: '[0,1]' }
    ]);
    
    // JS
    setStartCodeJS('function twoSum(nums, target) {\n    // Write your code here\n}');
    setRefSolutionJS('function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return [map.get(complement), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n}');

    // Python
    setStartCodePy('def twoSum(nums, target):\n    # Write your code here\n    pass');
    setRefSolutionPy('def twoSum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        remaining = target - num\n        if remaining in seen:\n            return [seen[remaining], i]\n        seen[num] = i\n    return []');

    // C++
    setStartCodeCPP('class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your C++ code here\n    }\n};');
    setRefSolutionCPP('class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int, int> seen;\n        for (int i = 0; i < nums.size(); i++) {\n            int diff = target - nums[i];\n            if (seen.count(diff)) {\n                return {seen[diff], i};\n            }\n            seen[nums[i]] = i;\n        }\n        return {};\n    }\n};');

    // Java
    setStartCodeJava('class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your Java code here\n    }\n}');
    setRefSolutionJava('class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int complement = target - nums[i];\n            if (map.containsKey(complement)) {\n                return new int[] { map.get(complement), i };\n            }\n            map.put(nums[i], i);\n        }\n        return new int[] {};\n    }\n}');

    setLocalMessage('Two Sum template loaded successfully!');
    setTimeout(() => setLocalMessage(null), 3000);
  };

  useEffect(() => {
    if (editingProblem) {
      setTitle(editingProblem.title || '');
      setDescription(editingProblem.description || '');
      setDifficulty(editingProblem.difficulty || 'easy');
      setTagsInput(editingProblem.tags ? editingProblem.tags.join(', ') : '');
      setVisibleTestCases(editingProblem.visibleTestCases && editingProblem.visibleTestCases.length > 0 ? editingProblem.visibleTestCases : [{ input: '', output: '', explanation: '' }]);
      setHiddenTestCases(editingProblem.hiddenTestCases && editingProblem.hiddenTestCases.length > 0 ? editingProblem.hiddenTestCases : [{ input: '', output: '' }]);
      
      const jsStart = editingProblem.startCode?.find(c => c.language?.toLowerCase() === 'javascript' || c.language?.toLowerCase() === 'js');
      const pyStart = editingProblem.startCode?.find(c => c.language?.toLowerCase() === 'python' || c.language?.toLowerCase() === 'py');
      const cppStart = editingProblem.startCode?.find(c => c.language?.toLowerCase() === 'c++' || c.language?.toLowerCase() === 'cpp');
      const javaStart = editingProblem.startCode?.find(c => c.language?.toLowerCase() === 'java');
      
      setStartCodeJS(jsStart ? jsStart.initialCode : '');
      setStartCodePy(pyStart ? pyStart.initialCode : '');
      setStartCodeCPP(cppStart ? cppStart.initialCode : '');
      setStartCodeJava(javaStart ? javaStart.initialCode : '');

      const jsRef = editingProblem.referenceSolution?.find(c => c.language?.toLowerCase() === 'javascript' || c.language?.toLowerCase() === 'js');
      const pyRef = editingProblem.referenceSolution?.find(c => c.language?.toLowerCase() === 'python' || c.language?.toLowerCase() === 'py');
      const cppRef = editingProblem.referenceSolution?.find(c => c.language?.toLowerCase() === 'c++' || c.language?.toLowerCase() === 'cpp');
      const javaRef = editingProblem.referenceSolution?.find(c => c.language?.toLowerCase() === 'java');
      
      setRefSolutionJS(jsRef ? jsRef.completeCode : '');
      setRefSolutionPy(pyRef ? pyRef.completeCode : '');
      setRefSolutionCPP(cppRef ? cppRef.completeCode : '');
      setRefSolutionJava(javaRef ? javaRef.completeCode : '');
    } else {
      setTitle('');
      setDescription('');
      setDifficulty('easy');
      setTagsInput('');
      setVisibleTestCases([{ input: '', output: '', explanation: '' }]);
      setHiddenTestCases([{ input: '', output: '' }]);
      setStartCodeJS('');
      setStartCodePy('');
      setStartCodeCPP('');
      setStartCodeJava('');
      setRefSolutionJS('');
      setRefSolutionPy('');
      setRefSolutionCPP('');
      setRefSolutionJava('');
    }
  }, [editingProblem]);

  const addVisibleTestCase = () => setVisibleTestCases([...visibleTestCases, { input: '', output: '', explanation: '' }]);
  const removeVisibleTestCase = (index) => setVisibleTestCases(visibleTestCases.filter((_, i) => i !== index));
  const updateVisibleTestCase = (index, field, value) => {
    const updated = [...visibleTestCases];
    updated[index][field] = value;
    setVisibleTestCases(updated);
  };

  const addHiddenTestCase = () => setHiddenTestCases([...hiddenTestCases, { input: '', output: '' }]);
  const removeHiddenTestCase = (index) => setHiddenTestCases(hiddenTestCases.filter((_, i) => i !== index));
  const updateHiddenTestCase = (index, field, value) => {
    const updated = [...hiddenTestCases];
    updated[index][field] = value;
    setHiddenTestCases(updated);
  };

  const handleLocalSubmit = (e) => {
    e.preventDefault();
    onSubmit({
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
    });
  };

  return (
    <form onSubmit={handleLocalSubmit} className="space-y-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-sm transition-colors duration-200">
      
      {localMessage && (
        <div className="alert text-xs py-2 px-3 rounded-lg bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-900/40 text-cyan-700 dark:text-cyan-400">
          {localMessage}
        </div>
      )}

      {activeTab === 'create' && (
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-900 pb-4">
          <div>
            <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Add Challenge</h3>
          </div>
          <button
            type="button"
            onClick={loadTwoSumTemplate}
            className="text-xs font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-cyan-600 dark:text-cyan-400 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
          >
            ⚡ Load Two Sum Template
          </button>
        </div>
      )}

      {/* Core Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2">
          <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 block">Challenge Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Reverse Integer"
            className="w-full bg-white dark:bg-[#09090b] border border-zinc-300 dark:border-zinc-900 rounded-lg py-2 px-3 text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-cyan-600 transition-colors"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 block">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="select select-bordered select-sm w-full bg-white dark:bg-[#09090b] border border-zinc-300 dark:border-zinc-900 rounded-lg focus:outline-none focus:border-cyan-600 text-xs text-zinc-800 dark:text-zinc-200"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 block">Tags (comma-separated)</label>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="e.g. Array, String, Dynamic Programming"
          className="w-full bg-white dark:bg-[#09090b] border border-zinc-300 dark:border-zinc-900 rounded-lg py-2 px-3 text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-cyan-600 transition-colors"
        />
      </div>

      <div>
        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 block">Problem Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          placeholder="Describe the challenge parameters, formatting, and constraints..."
          className="w-full bg-white dark:bg-[#09090b] border border-zinc-300 dark:border-zinc-900 rounded-lg py-2 px-3 text-xs font-mono text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-cyan-600 transition-colors"
        />
      </div>

      {/* Test cases */}
      <div className="space-y-6">
        <div className="border-t border-zinc-200 dark:border-zinc-900 pt-5">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Visible Test Cases</h4>
            </div>
            <button type="button" onClick={addVisibleTestCase} className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-900/40 px-2.5 py-1 rounded-md cursor-pointer">
              + Add Case
            </button>
          </div>

          <div className="space-y-3">
            {visibleTestCases.map((tc, idx) => (
              <div key={idx} className="bg-zinc-50 dark:bg-zinc-900/10 border border-zinc-200 dark:border-zinc-900 rounded-xl p-4 space-y-3 relative">
                {visibleTestCases.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVisibleTestCase(idx)}
                    className="absolute top-3 right-3 text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 text-[10px] font-bold cursor-pointer"
                  >
                    Delete
                  </button>
                )}
                <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-500 uppercase tracking-wide">Case #{idx + 1}</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1 block">Input parameters</label>
                    <input
                      type="text"
                      value={tc.input}
                      onChange={(e) => updateVisibleTestCase(idx, 'input', e.target.value)}
                      placeholder="e.g. nums = [2,7,11,15], target = 9"
                      className="w-full bg-white dark:bg-[#09090b] border border-zinc-300 dark:border-zinc-900 rounded-lg py-1.5 px-3 font-mono text-xs text-zinc-800 dark:text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1 block">Expected Output</label>
                    <input
                      type="text"
                      value={tc.output}
                      onChange={(e) => updateVisibleTestCase(idx, 'output', e.target.value)}
                      placeholder="e.g. [0,1]"
                      className="w-full bg-white dark:bg-[#09090b] border border-zinc-300 dark:border-zinc-900 rounded-lg py-1.5 px-3 font-mono text-xs text-zinc-800 dark:text-zinc-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1 block">Explanation (optional)</label>
                  <input
                    type="text"
                    value={tc.explanation}
                    onChange={(e) => updateVisibleTestCase(idx, 'explanation', e.target.value)}
                    placeholder="Why this output is expected..."
                    className="w-full bg-white dark:bg-[#09090b] border border-zinc-300 dark:border-zinc-900 rounded-lg py-1.5 px-3 text-xs text-zinc-800 dark:text-zinc-200"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-zinc-200 dark:border-zinc-900 pt-5">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Hidden Test Cases</h4>
            </div>
            <button type="button" onClick={addHiddenTestCase} className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-900/40 px-2.5 py-1 rounded-md cursor-pointer">
              + Add Case
            </button>
          </div>

          <div className="space-y-3">
            {hiddenTestCases.map((tc, idx) => (
              <div key={idx} className="bg-zinc-50 dark:bg-zinc-900/10 border border-zinc-200 dark:border-zinc-900 rounded-xl p-4 space-y-3 relative">
                {hiddenTestCases.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeHiddenTestCase(idx)}
                    className="absolute top-3 right-3 text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 text-[10px] font-bold cursor-pointer"
                  >
                    Delete
                  </button>
                )}
                <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-500 uppercase tracking-wide">Hidden Case #{idx + 1}</span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1 block">Input parameters</label>
                    <input
                      type="text"
                      value={tc.input}
                      onChange={(e) => updateHiddenTestCase(idx, 'input', e.target.value)}
                      placeholder="e.g. nums = [3,2,4], target = 6"
                      className="w-full bg-white dark:bg-[#09090b] border border-zinc-300 dark:border-zinc-900 rounded-lg py-1.5 px-3 font-mono text-xs text-zinc-800 dark:text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1 block">Expected Output</label>
                    <input
                      type="text"
                      value={tc.output}
                      onChange={(e) => updateHiddenTestCase(idx, 'output', e.target.value)}
                      placeholder="e.g. [1,2]"
                      className="w-full bg-white dark:bg-[#09090b] border border-zinc-300 dark:border-zinc-900 rounded-lg py-1.5 px-3 font-mono text-xs text-zinc-800 dark:text-zinc-200"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Start Code & Reference Solutions */}
      <div className="border-t border-zinc-200 dark:border-zinc-900 pt-5 space-y-4">
        <div>
          <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Code Configurations</h4>
        </div>

        {/* JS collapse */}
        <div className="collapse collapse-arrow border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-[#09090b] rounded-xl">
          <input type="checkbox" defaultChecked />
          <div className="collapse-title text-xs font-bold text-cyan-600 dark:text-cyan-400">JavaScript Configuration</div>
          <div className="collapse-content grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1 block">Starting Template</label>
              <textarea
                value={startCodeJS}
                onChange={(e) => setStartCodeJS(e.target.value)}
                rows={5}
                placeholder="function twoSum(nums, target) { ... }"
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-900 font-mono text-xs focus:border-cyan-600 rounded-lg p-2.5 text-zinc-800 dark:text-zinc-200"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1 block">Reference Solution</label>
              <textarea
                value={refSolutionJS}
                onChange={(e) => setRefSolutionJS(e.target.value)}
                rows={5}
                placeholder="function twoSum(nums, target) { return solution; }"
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-900 font-mono text-xs focus:border-cyan-600 rounded-lg p-2.5 text-zinc-800 dark:text-zinc-200"
              />
            </div>
          </div>
        </div>

        {/* Py collapse */}
        <div className="collapse collapse-arrow border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-[#09090b] rounded-xl">
          <input type="checkbox" />
          <div className="collapse-title text-xs font-bold text-cyan-600 dark:text-cyan-400">Python Configuration</div>
          <div className="collapse-content grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1 block">Starting Template</label>
              <textarea
                value={startCodePy}
                onChange={(e) => setStartCodePy(e.target.value)}
                rows={5}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-900 font-mono text-xs focus:border-cyan-600 rounded-lg p-2.5 text-zinc-800 dark:text-zinc-200"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1 block">Reference Solution</label>
              <textarea
                value={refSolutionPy}
                onChange={(e) => setRefSolutionPy(e.target.value)}
                rows={5}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-900 font-mono text-xs focus:border-cyan-600 rounded-lg p-2.5 text-zinc-800 dark:text-zinc-200"
              />
            </div>
          </div>
        </div>

        {/* CPP collapse */}
        <div className="collapse collapse-arrow border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-[#09090b] rounded-xl">
          <input type="checkbox" />
          <div className="collapse-title text-xs font-bold text-cyan-600 dark:text-cyan-400">C++ Configuration</div>
          <div className="collapse-content grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1 block">Starting Template</label>
              <textarea
                value={startCodeCPP}
                onChange={(e) => setStartCodeCPP(e.target.value)}
                rows={5}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-900 font-mono text-xs focus:border-cyan-600 rounded-lg p-2.5 text-zinc-800 dark:text-zinc-200"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1 block">Reference Solution</label>
              <textarea
                value={refSolutionCPP}
                onChange={(e) => setRefSolutionCPP(e.target.value)}
                rows={5}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-900 font-mono text-xs focus:border-cyan-600 rounded-lg p-2.5 text-zinc-800 dark:text-zinc-200"
              />
            </div>
          </div>
        </div>

        {/* Java collapse */}
        <div className="collapse collapse-arrow border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-[#09090b] rounded-xl">
          <input type="checkbox" />
          <div className="collapse-title text-xs font-bold text-cyan-600 dark:text-cyan-400">Java Configuration</div>
          <div className="collapse-content grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1 block">Starting Template</label>
              <textarea
                value={startCodeJava}
                onChange={(e) => setStartCodeJava(e.target.value)}
                rows={5}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-900 font-mono text-xs focus:border-cyan-600 rounded-lg p-2.5 text-zinc-800 dark:text-zinc-200"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1 block">Reference Solution</label>
              <textarea
                value={refSolutionJava}
                onChange={(e) => setRefSolutionJava(e.target.value)}
                rows={5}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-900 font-mono text-xs focus:border-cyan-600 rounded-lg p-2.5 text-zinc-800 dark:text-zinc-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-zinc-200 dark:border-zinc-900 pt-5 flex justify-end gap-2.5">
        <button
          type="button"
          onClick={onCancel}
          className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-white text-xs font-bold px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-colors shadow-lg shadow-cyan-500/10 cursor-pointer disabled:opacity-40 flex items-center gap-2"
        >
          {submitting ? (
            <>
              <span className="loading loading-spinner loading-xs"></span>
              Running Verifications...
            </>
          ) : activeTab === 'edit' ? (
            'Update Challenge'
          ) : (
            'Save Challenge'
          )}
        </button>
      </div>
    </form>
  );
}

export default AdminChallengeForm;
