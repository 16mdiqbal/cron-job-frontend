import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface JobFiltersProps {
  onFilterChange: (filters: {
    search?: string;
    is_active?: boolean;
    github_repo?: 'api' | 'mobile' | 'web';
  }) => void;
}

export const JobFilters = ({ onFilterChange }: JobFiltersProps) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [repository, setRepository] = useState<string>('all');
  const didMountRef = useRef(false);

  const buildAndApplyFilters = (currentSearch?: string, currentStatus?: string, currentRepo?: string) => {
    const filters: { search?: string; is_active?: boolean; github_repo?: 'api' | 'mobile' | 'web' } = {};

    const searchVal = currentSearch !== undefined ? currentSearch : search;
    const statusVal = currentStatus !== undefined ? currentStatus : status;
    const repoVal = currentRepo !== undefined ? currentRepo : repository;

    if (searchVal) filters.search = searchVal;
    if (statusVal !== 'all') filters.is_active = statusVal === 'active';
    if (repoVal !== 'all') filters.github_repo = repoVal as 'api' | 'mobile' | 'web';

    onFilterChange(filters);
  };

  const handleApplyFilters = () => {
    buildAndApplyFilters();
  };

  // Live search with debounce (no need to click "Apply Filters")
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      buildAndApplyFilters(search, undefined, undefined);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    buildAndApplyFilters(undefined, newStatus, undefined);
  };

  const handleRepositoryChange = (newRepo: string) => {
    setRepository(newRepo);
    buildAndApplyFilters(undefined, undefined, newRepo);
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatus('all');
    setRepository('all');
    // Explicitly reload all jobs without any filters
    onFilterChange({});
  };

  return (
    <div className="rounded-2xl border border-indigo-100 dark:border-gray-700 bg-white/70 dark:bg-gray-900/30 backdrop-blur-sm shadow-sm p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground">Job name</div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-800 border-indigo-200 dark:border-gray-700 focus-visible:ring-indigo-500"
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground">Status</div>
          <Select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="bg-white dark:bg-gray-800 border-indigo-200 dark:border-gray-700 focus-visible:ring-indigo-500"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>

        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground">Repository</div>
          <Select
            value={repository}
            onChange={(e) => handleRepositoryChange(e.target.value)}
            className="bg-white dark:bg-gray-800 border-indigo-200 dark:border-gray-700 focus-visible:ring-indigo-500"
          >
            <option value="all">All</option>
            <option value="api">API</option>
            <option value="mobile">Mobile</option>
            <option value="web">Web</option>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={handleApplyFilters}
          size="sm"
          className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 shadow-sm hover:shadow-md transition-all"
        >
          Apply
        </Button>
        <Button
          onClick={handleClearFilters}
          variant="outline"
          size="sm"
          className="border-indigo-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700"
        >
          <X className="mr-2 h-4 w-4" />
          Clear
        </Button>
      </div>
    </div>
  );
};

export default JobFilters;
