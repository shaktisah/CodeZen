import React from 'react';
import { Link } from 'react-router-dom';

function StatsSidebar({
  user,
  totalCount,
  solvedCount,
  solvedEasy,
  easyCount,
  solvedMedium,
  mediumCount,
  solvedHard,
  hardCount
}) {
  return (
    <div className="space-y-6">
      {user ? (
        <div className="bg-white dark:bg-[#0e0e11] border border-zinc-200 dark:border-zinc-900 rounded-xl p-5 shadow-sm space-y-4 transition-colors duration-200">
          <div>
            <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-wide">Developer Profile</h3>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mt-1">{user.firstName} {user.lastName}</h4>
          </div>
          
          <div className="border-t border-zinc-200 dark:border-zinc-900 pt-3.5 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 dark:text-zinc-555">Overall Solved</span>
              <span className="font-bold text-zinc-900 dark:text-white">{solvedCount} <span className="text-zinc-400 dark:text-zinc-650 font-normal">/ {totalCount}</span></span>
            </div>
            
            {/* Clean inline bar progress */}
            <div className="w-full bg-zinc-200 dark:bg-zinc-900 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${totalCount > 0 ? (solvedCount / totalCount) * 100 : 0}%` }}
              ></div>
            </div>

            <div className="space-y-2 text-xs pt-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-teal-650 dark:text-teal-400 font-semibold">Easy</span>
                <span className="text-zinc-500 dark:text-zinc-500 font-medium">{solvedEasy} / {easyCount}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-amber-650 dark:text-amber-400 font-semibold">Medium</span>
                <span className="text-zinc-500 dark:text-zinc-500 font-medium">{solvedMedium} / {mediumCount}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-rose-600 dark:text-rose-400 font-semibold">Hard</span>
                <span className="text-zinc-500 dark:text-zinc-500 font-medium">{solvedHard} / {hardCount}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-950 dark:to-[#0e0e11] border border-zinc-200 dark:border-zinc-900 rounded-xl p-5 shadow-sm space-y-4 text-center transition-colors duration-200">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Save Your Progress</h3>
          <p className="text-zinc-500 dark:text-zinc-500 text-[11px] leading-relaxed">
            Log in to run compilers, submit algorithms, and track your execution statistics.
          </p>
          <div className="space-y-2 pt-2">
            <Link to="/login" className="btn btn-xs bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 border-none rounded-lg w-full font-bold py-2">
              Sign In
            </Link>
            <Link to="/signup" className="btn btn-xs btn-ghost text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white w-full text-xs font-bold py-2">
              Create Account
            </Link>
          </div>
        </div>
      )}

      {/* Muted developer card */}
      <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-900 rounded-xl p-5 space-y-2 transition-colors duration-200">
        <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-555 uppercase tracking-wider">Algorithm Tip</h4>
        <p className="text-zinc-700 dark:text-zinc-400 text-xs leading-relaxed italic">
          "First, solve the problem. Then, write the code."
        </p>
        <span className="text-zinc-400 dark:text-zinc-650 text-[10px] block text-right">- John Johnson</span>
      </div>
    </div>
  );
}

export default StatsSidebar;
