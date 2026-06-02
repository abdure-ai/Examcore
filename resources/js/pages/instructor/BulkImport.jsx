import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import axios from 'axios';

export default function BulkImport() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get(`/api/exams/${examId}/questions/template`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'questions_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download template.');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const response = await axios.post(`/api/exams/${examId}/questions/import`, formData);
      toast.success(response.data.message);
      navigate(`/exams/${examId}/questions`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Bulk import failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Bulk Import Questions</h1>
        <p className="text-slate-400 text-sm">Upload questions via CSV or Excel sheets.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          <div className="flex items-center justify-between">
            <p className="font-bold">Instructions & File Format:</p>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50 rounded-lg transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Template
            </button>
          </div>
          <ul className="list-disc pl-5 space-y-1">
            <li>Supported file type: <strong>.csv</strong> or <strong>.txt</strong></li>
            <li>Required Columns in order:</li>
            <li className="font-mono text-xs text-indigo-500">type, category, content, options, correct_answer, difficulty, marks</li>
            <li>For <strong>MCQ</strong>, separate choices using a vertical line (e.g. <span className="font-mono text-xs">Option A|Option B|Option C</span>).</li>
            <li>For <strong>TF</strong>, the correct answer must be <span className="font-mono text-xs">true</span> or <span className="font-mono text-xs">false</span>.</li>
            <li>For <strong>SA</strong> (Short Answer), options and correct_answer can be left empty.</li>
          </ul>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all">
            <svg className="h-10 w-10 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".csv,.txt"
              className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Link
              to={`/exams/${examId}/questions`}
              className="px-4 py-2 text-sm font-semibold border rounded-xl"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={uploading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl shadow-lg shadow-indigo-600/10 transition-all text-sm"
            >
              {uploading ? 'Importing...' : 'Upload & Import'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
