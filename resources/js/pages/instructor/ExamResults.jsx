import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DataTable from '../../components/UI/DataTable';
import Badge from '../../components/UI/Badge';
import { useToast } from '../../hooks/useToast';
import axios from 'axios';

export default function ExamResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const toast = useToast();

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/results');
      setResults(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load results.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // perform local filter or api reload
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Examination Results</h1>
        <p className="text-slate-400 text-sm">Review student performances, check anti-cheat logs, and trigger grade reviews.</p>
      </div>

      <DataTable
        headers={['Student', 'Exam Title', 'Attempt No', 'Tab Switches', 'Score', 'Status', 'Actions']}
        items={results}
        isLoading={loading}
        renderRow={(result) => {
          const switches = result.session?.tab_switches || 0;
          return (
            <tr key={result.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
              <td className="px-6 py-4">
                <p className="font-semibold text-slate-800 dark:text-slate-100">{result.user?.name}</p>
                <p className="text-xs text-slate-400">{result.user?.email}</p>
              </td>
              <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">{result.exam?.title}</td>
              <td className="px-6 py-4 text-center text-slate-500 font-semibold">#{result.session?.attempt_number}</td>
              <td className="px-6 py-4">
                <Badge variant={switches > 3 ? 'danger' : switches > 0 ? 'warning' : 'success'}>
                  {switches} times
                </Badge>
              </td>
              <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                {result.percentage}%
              </td>
              <td className="px-6 py-4">
                <Badge variant={result.passed ? 'success' : 'danger'}>
                  {result.passed ? 'PASSED' : 'FAILED'}
                </Badge>
              </td>
              <td className="px-6 py-4">
                <Link
                  to={`/results/${result.id}`}
                  className="text-indigo-600 hover:text-indigo-800 font-bold text-xs"
                >
                  Grade Review
                </Link>
              </td>
            </tr>
          );
        }}
      />
    </div>
  );
}
