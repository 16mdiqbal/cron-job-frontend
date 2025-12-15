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
    <div className="bg-muted/50 p-4 rounded-lg space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
          />
        </div>

        <Select value={status} onChange={(e) => handleStatusChange(e.target.value)}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>

        <Select value={repository} onChange={(e) => handleRepositoryChange(e.target.value)}>
          <option value="all">All Repositories</option>
          <option value="api">API</option>
          <option value="mobile">Mobile</option>
          <option value="web">Web</option>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleApplyFilters} size="sm">
          Apply Filters
        </Button>
        <Button onClick={handleClearFilters} variant="outline" size="sm">
          <X className="mr-2 h-4 w-4" />
          Clear
        </Button>
      </div>
    </div>
  );
};

export default JobFilters;
