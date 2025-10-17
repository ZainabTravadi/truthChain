import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import VerdictCard from '@/components/VerdictCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { mockVerdicts } from '@/data/mockData';

const Verdicts = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [verdictFilter, setVerdictFilter] = useState<'all' | 'true' | 'mixed' | 'false'>('all');

  const filteredVerdicts = mockVerdicts.filter((verdict) => {
    const matchesSearch = verdict.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = verdictFilter === 'all' || verdict.verdict === verdictFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
            <span className="text-gradient">Verdict History</span>
          </h1>
          <p className="text-xl text-center text-muted-foreground mb-12">
            Browse all analyzed articles and their verification results
          </p>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8 max-w-4xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by title or keyword..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={verdictFilter} onValueChange={(value: any) => setVerdictFilter(value)}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by verdict" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Verdicts</SelectItem>
                <SelectItem value="true">Likely True</SelectItem>
                <SelectItem value="mixed">Mixed Evidence</SelectItem>
                <SelectItem value="false">Likely False</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results */}
          <div className="max-w-4xl mx-auto">
            {filteredVerdicts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-xl text-muted-foreground mb-4">No verdicts found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredVerdicts.map((verdict, idx) => (
                  <motion.div
                    key={verdict.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <VerdictCard {...verdict} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Verdicts;
