import React from 'react';
import { Search, ListFilter as Filter } from 'lucide-react';
import { Input } from '../ui/Input';

interface FileFiltersProps {
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  filterType: string;
  setFilterType: (s: string) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
  dateFilter: string;
  setDateFilter: (s: string) => void;
  ownerFilter: string;
  setOwnerFilter: (s: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (v: 'grid' | 'list') => void;
}

export function FileFilters({
  searchQuery, setSearchQuery,
  filterType, setFilterType,
  sortBy, setSortBy,
  dateFilter, setDateFilter,
  ownerFilter, setOwnerFilter,
  viewMode, setViewMode
}: FileFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            className="pl-9 bg-white" 
            placeholder="Search files..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shrink-0 self-start lg:self-auto">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          </button>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        <select 
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-indigo-500"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All Files</option>
          <option value="documents">Documents</option>
          <option value="pdfs">PDFs</option>
          <option value="images">Images</option>
          <option value="spreadsheets">Spreadsheets</option>
          <option value="presentations">Presentations</option>
          <option value="text">Text Files</option>
          <option value="archives">Archives (ZIP, RAR, 7Z)</option>
          <option value="code">Code Files</option>
          <option value="fonts">Fonts</option>
          <option value="svg_design">SVG & Design Files</option>
          <option value="other">Other Files</option>
        </select>

        <select 
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-indigo-500"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        >
          <option value="all">Any Date</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="last_7_days">Last 7 Days</option>
          <option value="last_30_days">Last 30 Days</option>
          <option value="this_month">This Month</option>
          <option value="this_year">This Year</option>
          {/* <option value="custom">Custom Range</option> */}
        </select>

        <select 
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-indigo-500"
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
        >
          <option value="all">All Owners</option>
          <option value="mine">My Files</option>
          <option value="members">Members</option>
        </select>

        <select 
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-indigo-500"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="name_asc">Name (A–Z)</option>
          <option value="name_desc">Name (Z–A)</option>
          <option value="date_mod_new">Date Modified (Newest)</option>
          <option value="date_mod_old">Date Modified (Oldest)</option>
          <option value="date_created">Date Created</option>
          <option value="size_large">File Size (Largest)</option>
          <option value="size_small">File Size (Smallest)</option>
          <option value="file_type">File Type</option>
          <option value="most_viewed">Most Viewed</option>
          <option value="most_downloaded">Most Downloaded</option>
        </select>
      </div>
    </div>
  );
}
