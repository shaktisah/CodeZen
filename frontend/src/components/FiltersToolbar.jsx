import React from 'react';

function FiltersToolbar({
  searchQuery,
  setSearchQuery,
  difficultyFilter,
  setDifficultyFilter,
  selectedTag,
  setSelectedTag,
  allTags,
  onReset
}) {
  return (
    <div className="bg-zinc-100 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-xl p-3 flex flex-col sm:flex-row gap-3 items-center justify-between transition-colors duration-200">
      {/* Search Input */}
      <div className="relative w-full sm:max-w-xs">
        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-zinc-400 dark:text-zinc-600">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21-21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by title..."
          className="w-full bg-white dark:bg-[#09090b]/80 border border-zinc-200 dark:border-zinc-900 rounded-lg py-1.5 pl-9 pr-3 text-xs text-zinc-800 dark:text-zinc-300 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-cyan-600 transition-colors"
        />
      </div>

      {/* Select Dropdowns */}
      <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="select select-xs bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-900 text-zinc-700 dark:text-zinc-300 text-[11px] rounded-lg focus:outline-none focus:border-cyan-600 font-semibold"
        >
          <option value="">Difficulty</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="select select-xs bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-900 text-zinc-700 dark:text-zinc-300 text-[11px] rounded-lg focus:outline-none focus:border-cyan-600 font-semibold"
        >
          <option value="">Tags</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>

        {(searchQuery || difficultyFilter || selectedTag) && (
          <button
            type="button"
            onClick={onReset}
            className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-[10px] font-bold px-2 py-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-900 rounded-lg cursor-pointer transition-colors"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

export default FiltersToolbar;
