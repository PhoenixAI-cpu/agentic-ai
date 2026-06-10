import GreetingSection from '@/components/home/GreetingSection';
import StatRow from '@/components/home/StatRow';
import AnaChatHero from '@/components/home/AnaChatHero';
import ActiveCandidateCard from '@/components/home/ActiveCandidateCard';
import AgentsActivity from '@/components/home/AgentsActivity';
import TopCandidatesTable from '@/components/home/TopCandidatesTable';
import InsightsAlerts from '@/components/home/InsightsAlerts';
import MyProjects from '@/components/home/MyProjects';
import DataHub from '@/components/home/DataHub';
import DataSources from '@/components/home/DataSources';

export const metadata = {
  title: 'Home — Antaria',
};

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Section 1: Greeting */}
      <GreetingSection />

      {/* Section 2: Stat row */}
      <StatRow />

      {/* Section 3: Ana chat hero */}
      <AnaChatHero />

      {/* Section 4: Active candidate */}
      <ActiveCandidateCard />

      {/* Section 5: AI agents activity */}
      <AgentsActivity />

      {/* Section 6: Top candidates table */}
      <TopCandidatesTable />

      {/* Section 7: Insights and alerts */}
      <InsightsAlerts />

      {/* Section 8: My projects */}
      <MyProjects />

      {/* Section 9: Data hub */}
      <DataHub />

      {/* Section 10: Data sources */}
      <DataSources />
    </div>
  );
}
