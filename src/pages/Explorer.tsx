import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, ExternalLink, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockVerdicts } from '@/data/mockData';

const Explorer = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [verdictFilter, setVerdictFilter] = useState<'all' | 'true' | 'mixed' | 'false'>('all');

  const filteredVerdicts = mockVerdicts.filter((verdict) => {
    const matchesSearch = verdict.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = verdictFilter === 'all' || verdict.verdict === verdictFilter;
    return matchesSearch && matchesFilter;
  });

  const verdictConfig = {
    true: {
      icon: CheckCircle,
      label: 'True',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/50',
    },
    false: {
      icon: XCircle,
      label: 'False',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/50',
    },
    mixed: {
      icon: AlertCircle,
      label: 'Mixed',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/50',
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
            <span className="text-gradient">On-Chain Explorer</span>
          </h1>
          <p className="text-xl text-center text-muted-foreground mb-12">
            Browse all verified verdicts stored on the blockchain
          </p>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by title, source, or transaction hash..."
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
                <SelectItem value="true">True</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
                <SelectItem value="false">False</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead>Article</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Verdict</TableHead>
                  <TableHead className="text-right">Confidence</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVerdicts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <p className="text-muted-foreground">No verdicts found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVerdicts.map((verdict, idx) => {
                    const config = verdictConfig[verdict.verdict];
                    const VerdictIcon = config.icon;

                    return (
                      <motion.tr
                        key={verdict.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="border-border hover:bg-secondary/50 transition-smooth cursor-pointer"
                        onClick={() => navigate(`/verdicts/${verdict.id}`)}
                      >
                        <TableCell className="font-medium max-w-md">
                          <div className="truncate">{verdict.title}</div>
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {new Date(verdict.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${config.bgColor} ${config.color} border ${config.borderColor}`}>
                            <VerdictIcon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {verdict.confidence}%
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/verdicts/${verdict.id}`);
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </motion.tr>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Explorer;
