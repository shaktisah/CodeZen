import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import axiosClient from '../utils/axiosClient';
import Navbar from '../components/Navbar';
import FiltersToolbar from '../components/FiltersToolbar';
import ProblemTable from '../components/ProblemTable';
import StatsSidebar from '../components/StatsSidebar';
import Pagination from '../components/Pagination';

function HomePage() {
  const { user } = useAuth();
  const [problems, setProblems] = useState([]);
  const [solvedProblemIds, setSolvedProblemIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, difficultyFilter, selectedTag]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const problemsRes = await axiosClient.get('/problem/getAllProblem');
        setProblems(Array.isArray(problemsRes.data) ? problemsRes.data : []);

        if (user) {
          const solvedRes = await axiosClient.get('/problem/user');
          if (solvedRes.data && solvedRes.data.success) {
            setSolvedProblemIds(new Set(solvedRes.data.solved.map(id => id.toString())));
          }
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const allTags = Array.from(
    new Set(problems.flatMap((p) => p.tags || []))
  ).filter(Boolean);

  const filteredProblems = problems.filter((problem) => {
    const matchesSearch = problem.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = difficultyFilter ? problem.difficulty.toLowerCase() === difficultyFilter.toLowerCase() : true;
    const matchesTag = selectedTag ? (problem.tags || []).includes(selectedTag) : true;
    return matchesSearch && matchesDifficulty && matchesTag;
  });

  const totalItems = filteredProblems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedProblems = filteredProblems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalCount = problems.length;
  const solvedCount = problems.filter(p => solvedProblemIds.has(p._id.toString())).length;

  const easyProblems = problems.filter(p => p.difficulty?.toLowerCase() === 'easy');
  const mediumProblems = problems.filter(p => p.difficulty?.toLowerCase() === 'medium');
  const hardProblems = problems.filter(p => p.difficulty?.toLowerCase() === 'hard');

  const solvedEasy = easyProblems.filter(p => solvedProblemIds.has(p._id.toString())).length;
  const solvedMedium = mediumProblems.filter(p => solvedProblemIds.has(p._id.toString())).length;
  const solvedHard = hardProblems.filter(p => solvedProblemIds.has(p._id.toString())).length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-800 dark:text-zinc-150 font-sans flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200 transition-colors duration-200">
      
     
      <Navbar />

      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        
        <div className="lg:col-span-3 space-y-6">
          
          
          <div className="flex flex-col gap-1 pb-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
              Coding Challenges
              <span className="text-xs bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full font-mono">
                {totalCount} total
              </span>
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Select a problem to solve, run test cases, and evaluate your solution.</p>
          </div>

         
          <FiltersToolbar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            difficultyFilter={difficultyFilter}
            setDifficultyFilter={setDifficultyFilter}
            selectedTag={selectedTag}
            setSelectedTag={setSelectedTag}
            allTags={allTags}
            onReset={() => {
              setSearchQuery('');
              setDifficultyFilter('');
              setSelectedTag('');
            }}
          />

          
          <ProblemTable
            problems={paginatedProblems}
            solvedProblemIds={solvedProblemIds}
            loading={loading}
            user={user}
          />

          {!loading && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
        </div>

        
        <StatsSidebar
          user={user}
          totalCount={totalCount}
          solvedCount={solvedCount}
          solvedEasy={solvedEasy}
          easyCount={easyProblems.length}
          solvedMedium={solvedMedium}
          mediumCount={mediumProblems.length}
          solvedHard={solvedHard}
          hardCount={hardProblems.length}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-900 py-5 text-center text-[10px] text-zinc-500 dark:text-zinc-600 mt-auto bg-zinc-100 dark:bg-[#09090b] transition-colors duration-200">
        <p className="m-0"> © 2026 CodeZen Platform. Designed & Developed by Shakti.</p>
      </footer>
    </div>
  );
}

export default HomePage;