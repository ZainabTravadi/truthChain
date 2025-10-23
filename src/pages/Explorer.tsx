import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, ExternalLink, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Loader from '@/components/Loader';
import { Card } from '@/components/ui/card'; // Added Card for error display

// ========================================================================
// Interfaces (Matches API output from /api/daily-news)
// ========================================================================
interface DailyNewsItem {
    title: string;
    url: string;
    source: string;
    verdict: 'true' | 'false' | 'mixed';
    confidence: number; // 0.0 to 1.0 scale
    summary: string;
    // NOTE: Date is assumed to be missing from the summary, so we use current date for sorting.
}

// Extended interface for the table (simulating structure)
interface VerdictItem extends DailyNewsItem {
    id: string; // Use a hash or simple index for the key
    date: string; // Add a date field for display/sorting
}

// ========================================================================
// Main Component
// ========================================================================
const Explorer = () => {
    const navigate = useNavigate();
    
    // State for live data and fetching status
    const [verdicts, setVerdicts] = useState<VerdictItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // State for filters
    const [searchQuery, setSearchQuery] = useState('');
    const [verdictFilter, setVerdictFilter] = useState<'all' | 'true' | 'mixed' | 'false'>('all');

    // ======================================================================
    // Data Fetching Logic
    // ======================================================================
    const fetchDailyVerdicts = useCallback(async () => {
      if (verdicts.length > 0) { 
        setIsLoading(false);
        return;
    }
        setIsLoading(true);
        setFetchError(null);
        try {
            const response = await fetch('http://127.0.0.1:5000/api/daily-news');
            const data = await response.json();

            if (!response.ok) {
                // The 503 persistent error will be returned in data.summary
                throw new Error(data.error || data.summary || `Failed to fetch: ${response.status}`);
            }

            // Map and augment the data for the table display
            const processedData: VerdictItem[] = (data as DailyNewsItem[]).map((item, index) => ({
                ...item,
                id: item.url + index, // Use URL + index as a temporary unique ID
                date: new Date().toISOString(), // Use current date since NewsAPI often omits exact date in headlines API
                confidence: item.confidence * 100, // Convert 0-1 scale to percentage 0-100
            }));

            setVerdicts(processedData);

        } catch (error) {
            console.error('Live Data Fetch Error:', error);
            setFetchError(
                `Failed to load live data. Ensure backend is running. Error: ${
                    error instanceof Error ? error.message : 'Unknown network issue.'
                }`
            );
        } finally {
            setIsLoading(false);
        }
    }, [verdicts.length]);

    // Fetch data on component mount
    useEffect(() => {
        fetchDailyVerdicts();
    }, [fetchDailyVerdicts]);

    // ======================================================================
    // Filtering Logic
    // ======================================================================
    const filteredVerdicts = verdicts.filter((verdict) => {
        // Search by title or source
        const searchTarget = `${verdict.title} ${verdict.source}`.toLowerCase();
        const matchesSearch = searchTarget.includes(searchQuery.toLowerCase());
        
        // Filter by verdict category
        const matchesFilter = verdictFilter === 'all' || verdict.verdict === verdictFilter;
        
        return matchesSearch && matchesFilter;
    });

    // ======================================================================
    // Verdict Styling Config
    // ======================================================================
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

    // ======================================================================
    // JSX
    // ======================================================================
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-4 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
                        <span className="text-gradient">Live Verification Feed</span>
                    </h1>
                    <p className="text-xl text-center text-muted-foreground mb-12">
                        Real-time AI-powered fact checks on today's top headlines
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
                        <Select 
                            value={verdictFilter} 
                            onValueChange={(value: 'all' | 'true' | 'mixed' | 'false') => setVerdictFilter(value)}
                        >
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

                    {/* Loading State */}
                    {isLoading && (
                        <Card className="p-12 mt-8 text-center">
                            <Loader text="Fetching and analyzing today's headlines with Gemini..." />
                        </Card>
                    )}
                    
                    {/* Error State */}
                    {fetchError && !isLoading && (
                         <Card className="p-8 mt-8 border-red-500 bg-red-500/10 text-red-700">
                             <p className="font-semibold">Error Loading Feed:</p>
                             <p className="text-sm">{fetchError}</p>
                             <Button onClick={fetchDailyVerdicts} className="mt-4">
                                 Retry Fetch
                             </Button>
                         </Card>
                    )}

                    {/* Table */}
                    {!isLoading && !fetchError && (
                        <div className="rounded-xl border border-border bg-card overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-border">
                                        <TableHead>Article & Source</TableHead>
                                        <TableHead>Verdict</TableHead>
                                        <TableHead className="text-right">Confidence</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredVerdicts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-12">
                                                <p className="text-muted-foreground">No verdicts found matching your filters.</p>
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
                                                    // NOTE: We don't have a specific /verdicts/:id endpoint setup here,
                                                    // so the navigate function is a placeholder for future implementation.
                                                    onClick={() => alert(`Navigating to detailed analysis for: ${verdict.title}`)} 
                                                >
                                                    <TableCell className="font-medium max-w-lg">
                                                        <div className="truncate">{verdict.title}</div>
                                                        <div className="text-xs text-muted-foreground mt-0.5">{verdict.source}</div>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        <Badge className={`${config.bgColor} ${config.color} border ${config.borderColor}`}>
                                                            <VerdictIcon className="h-3 w-3 mr-1" />
                                                            {config.label}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold">
                                                        {Math.round(verdict.confidence)}%
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <a 
                                                            href={verdict.url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()} // Prevent table row click
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                            >
                                                                <ExternalLink className="h-4 w-4" />
                                                            </Button>
                                                        </a>
                                                    </TableCell>
                                                </motion.tr>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </motion.div>
            </main>
            <Footer />
        </div>
    );
};

export default Explorer;