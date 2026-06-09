import React from 'react';

function AdminChallengeTable({ problems, loadingProblems, onEdit, onDelete }) {
  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-xl overflow-hidden shadow-sm transition-colors duration-200">
      {loadingProblems ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400 dark:text-zinc-500">
          <span className="loading loading-spinner loading-md text-cyan-600 dark:text-cyan-500"></span>
          <span className="text-xs">Fetching all challenges...</span>
        </div>
      ) : problems.length === 0 ? (
        <div className="py-20 text-center text-zinc-500 dark:text-zinc-600 text-xs">
          No challenges configured.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table w-full text-zinc-700 dark:text-zinc-300">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-900 text-zinc-400 dark:text-zinc-555 uppercase text-[10px] tracking-wider bg-zinc-50 dark:bg-zinc-900/10 font-bold">
                <th>Title</th>
                <th>Difficulty</th>
                <th>Tags</th>
                <th className="text-center w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((problem) => {
                let diffColorClass = 'text-teal-650 bg-teal-50 border-teal-200 dark:text-teal-400 dark:bg-teal-950/20 dark:border-teal-900/35';
                if (problem.difficulty?.toLowerCase() === 'medium') {
                  diffColorClass = 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/20 dark:border-amber-900/35';
                } else if (problem.difficulty?.toLowerCase() === 'hard') {
                  diffColorClass = 'text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950/20 dark:border-rose-900/35';
                }

                return (
                  <tr key={problem._id} className="border-b border-zinc-150 dark:border-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                    <td className="font-semibold text-zinc-900 dark:text-white text-xs">{problem.title}</td>
                    <td>
                      <span className={`badge border text-[10px] px-2 py-0.5 font-bold rounded-md capitalize ${diffColorClass}`}>
                        {problem.difficulty}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {problem.tags?.map((tag) => (
                          <span key={tag} className="text-[9px] font-bold bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded uppercase">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="text-center flex justify-center gap-1.5 animate-none">
                      <button
                        type="button"
                        onClick={() => onEdit(problem._id)}
                        className="btn btn-xs btn-outline border-zinc-300 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-md text-[10px] cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(problem._id)}
                        className="btn btn-xs btn-outline border-red-300 text-red-650 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/20 rounded-md text-[10px] cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminChallengeTable;
