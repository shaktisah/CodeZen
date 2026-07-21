import React from 'react';
import { Link } from 'react-router-dom';

function ProblemTable({ problems, solvedProblemIds, loading, user }) {
  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-xl overflow-hidden shadow-sm transition-colors duration-200">
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400 dark:text-zinc-500">
          <span className="loading loading-spinner loading-md text-cyan-600 dark:text-cyan-500"></span>
          <span className="text-xs">Loading board...</span>
        </div>
      ) : problems.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-zinc-500 dark:text-zinc-500 text-xs mb-1">No challenges found</p>
          <span className="text-zinc-400 dark:text-zinc-600 text-[10px]">Try adjusting your search criteria.</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table w-full text-zinc-700 dark:text-zinc-300">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-900 text-zinc-400 dark:text-zinc-500 uppercase text-[10px] tracking-wider bg-zinc-50 dark:bg-zinc-900/10 font-bold">
                <th className="w-12 text-center">Status</th>
                <th>Title</th>
                <th>Difficulty</th>
                <th>Tags</th>
                <th className="text-right pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((problem) => {
                const isSolved = solvedProblemIds.has(problem._id.toString());
                const problemLink = user 
                  ? `/problem/${problem._id}` 
                  : `/login?redirect=${encodeURIComponent(`/problem/${problem._id}`)}`;
                
                let diffColorClass = 'text-teal-600 bg-teal-50 border-teal-200 dark:text-teal-400 dark:bg-teal-950/20 dark:border-teal-900/35';
                if (problem.difficulty?.toLowerCase() === 'medium') {
                  diffColorClass = 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/20 dark:border-amber-900/35';
                } else if (problem.difficulty?.toLowerCase() === 'hard') {
                  diffColorClass = 'text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950/20 dark:border-rose-900/35';
                }

                return (
                  <tr key={problem._id} className="border-b border-zinc-150 dark:border-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-all">
                    <td className="text-center">
                      {user ? (
                        isSolved ? (
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-cyan-50 dark:bg-cyan-950 border border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                            </svg>
                          </span>
                        ) : (
                          <span className="inline-block w-3 h-3 rounded-full border border-zinc-300 dark:border-zinc-800"></span>
                        )
                      ) : (
                        <span className="inline-block w-3 h-3 rounded-full border border-zinc-200 dark:border-zinc-800/60 opacity-40"></span>
                      )}
                    </td>
                    <td className="font-medium text-zinc-900 dark:text-white text-xs">
                      <Link to={problemLink} className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                        {problem.title}
                      </Link>
                    </td>
                    <td>
                      <span className={`badge border text-[10px] px-2 py-0.5 font-bold rounded-md capitalize ${diffColorClass}`}>
                        {problem.difficulty}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {problem.tags && problem.tags.length > 0 ? (
                          problem.tags.map((tag) => (
                            <span key={tag} className="text-[9px] font-bold bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded uppercase">
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-700 text-[10px]">-</span>
                        )}
                      </div>
                    </td>
                    <td className="text-right pr-4">
                      <Link
                        to={problemLink}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-cyan-500/10 dark:hover:bg-cyan-500/20 dark:text-cyan-400 dark:border dark:border-cyan-500/30 transition-all shadow-xs"
                      >
                        <span>Solve</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                      </Link>
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

export default ProblemTable;
