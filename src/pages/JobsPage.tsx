import { JobsList } from '@/components/jobs/JobsList';
import { PageTransition } from '@/components/ui/page-transition';

export const JobsPage = () => {
  return (
    <PageTransition>
      <div className="space-y-6">
        <JobsList />
      </div>
    </PageTransition>
  );
};

export default JobsPage;
