import { JobForm } from '@/components/jobs/JobForm';
import { PageTransition } from '@/components/ui/page-transition';

const JobFormPage = () => {
  return (
    <PageTransition>
      <div className="space-y-6">
        <JobForm />
      </div>
    </PageTransition>
  );
};

export default JobFormPage;
