import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, TrendingUp, Zap, Server } from 'lucide-react'; // Icons for KPIs
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Loader from '@/components/Loader';

// ========================================================================
// Interfaces (Matches API output from /api/analytics/summary)
// ========================================================================
interface VerdictDistribution {
    verdict: 'true' | 'false' | 'mixed';
    count: number;
    percentage: number; // 0-100
}

interface TopSource {
    _id: string; // The source name
    total_analyses: number;
}

interface AnalyticsData {
    success: boolean;
    total_metrics: {
        total_articles_analyzed: number;
        total_unique_sources: number;
        overall_avg_confidence: number; // 0.0 to 1.0
        last_update: string; // ISO string
    };
    verdict_distribution: VerdictDistribution[];
    top_analyzed_sources: TopSource[];
}

// ========================================================================
// Main Component: AnalyticsDashboard
// ========================================================================
const AnalyticsDashboard = () => {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Styling for Verdict Badges (copied from Explorer for consistency)
    const verdictConfig: Record<VerdictDistribution['verdict'], any> = {
        true: { label: 'True', color: 'text-green-500', bgColor: 'bg-green-500/10' },
        false: { label: 'False', color: 'text-red-500', bgColor: 'bg-red-500/10' },
        mixed: { label: 'Mixed', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
    };
    
    // ======================================================================
    // Data Fetching Logic
    // ======================================================================
    const fetchAnalytics = useCallback(async () => {
        setIsLoading(true);
        setFetchError(null);
        try {
            const response = await fetch('http://127.0.0.1:5001/api/analytics/summary');
            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || `Failed to fetch: ${response.status}`);
            }
            
            // Convert confidence score from 0-1 (backend) to 0-100 (frontend display)
            data.total_metrics.overall_avg_confidence = data.total_metrics.overall_avg_confidence * 100;
            
            setAnalytics(data as AnalyticsData);

        } catch (error) {
            console.error('Analytics Fetch Error:', error);
            setFetchError(
                `Failed to load analytics. Ensure the backend is running. Error: ${
                    error instanceof Error ? error.message : 'Unknown network issue.'
                }`
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnalytics();
        // Set up refresh interval (e.g., refresh every 60 seconds)
        const interval = setInterval(fetchAnalytics, 60000); 
        return () => clearInterval(interval);
    }, [fetchAnalytics]);

    // ======================================================================
    // JSX Rendering
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
                        <span className="text-gradient">Verification Dashboard</span>
                    </h1>
                    <p className="text-xl text-center text-muted-foreground mb-12">
                        Historical and aggregated insights across all analyzed data.
                    </p>

                    {/* Loading/Error States */}
                    {isLoading && <Card className="p-12 mt-8 text-center"><Loader text="Compiling historical data..." /></Card>}
                    {fetchError && !isLoading && (
                        <Card className="p-8 mt-8 border-2 border-red-500 bg-red-500/10 text-red-700">
                            <p className="font-semibold">Analysis Error:</p>
                            <p className="text-sm">{fetchError}</p>
                            <Button onClick={fetchAnalytics} className="mt-4">
                                Retry Fetch
                            </Button>
                        </Card>
                    )}

                    {/* Main Dashboard Content */}
                    {analytics && !isLoading && (
                        <div className="space-y-10">
                            {/* Key Performance Indicators (KPIs) */}
                            <motion.div 
                                className="grid grid-cols-1 md:grid-cols-4 gap-6"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Card className="p-6 flex flex-col items-center justify-center text-center">
                                    <Zap className="h-8 w-8 text-primary mb-2" />
                                    <div className="text-3xl font-bold">{analytics.total_metrics.total_articles_analyzed}</div>
                                    <p className="text-sm text-muted-foreground">Articles Analyzed</p>
                                </Card>

                                <Card className="p-6 flex flex-col items-center justify-center text-center">
                                    <Server className="h-8 w-8 text-yellow-200 mb-2" />
                                    <div className="text-3xl font-bold">{analytics.total_metrics.total_unique_sources}</div>
                                    <p className="text-sm text-muted-foreground">Unique Sources Tracked</p>
                                </Card>
                                
                                <Card className="p-6 flex flex-col items-center justify-center text-center">
                                    <TrendingUp className="h-8 w-8 text-green-500 mb-2" />
                                    <div className="text-3xl font-bold">{analytics.total_metrics.overall_avg_confidence.toFixed(2)}%</div>
                                    <p className="text-sm text-muted-foreground">Avg. Confidence Score</p>
                                </Card>
                                
                                <Card className="p-6 flex flex-col items-center justify-center text-center">
                                    <AlertCircle className="h-8 w-8 text-yellow-500 mb-2" />
                                    <div className="text-sm font-semibold">{new Date(analytics.total_metrics.last_update).toLocaleTimeString()}</div>
                                    <p className="text-xs text-muted-foreground">Last Data Update</p>
                                </Card>
                            </motion.div>

                            {/* Verification Distribution and Top Sources */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Verdict Distribution (2/3 width) */}
                                <Card className="p-6 lg:col-span-2">
                                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">Verdict Distribution</h2>
                                    <p className="text-muted-foreground mb-4">Percentage breakdown of all historical analyses.</p>
                                    
                                    <div className="space-y-3">
                                        {analytics.verdict_distribution?.map((item) => {
                                            const config = verdictConfig[item.verdict];
                                            const widthStyle = { width: `${item.percentage || 0}%` };
                                            return (
                                                <div key={item.verdict} className="flex flex-col">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <Badge className={`${config.bgColor} ${config.color} border ${config.bgColor}`}>
                                                            {config.label}
                                                        </Badge>
                                                        <span className="font-mono text-sm">{item.percentage.toFixed(1)}%</span>
                                                    </div>
                                                    <div className="w-full bg-secondary rounded-full h-2.5">
                                                        <div 
                                                            className={`${config.solidBgColor} ${config.color.replace('text', 'bg')} h-2.5 rounded-full transition-all duration-500`} 
                                                            style={widthStyle}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card>

                                {/* Top Analyzed Sources (1/3 width) */}
                                <Card className="p-6 lg:col-span-1">
                                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">Top Sources Tracked</h2>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Source</TableHead>
                                                <TableHead className="text-right">Analyses</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {analytics.top_analyzed_sources?.map((source, index) => (
                                                <TableRow key={source._id}>
                                                    <TableCell className="font-medium">{source._id}</TableCell>
                                                    <TableCell className="text-right text-lg font-bold text-primary">{source.total_analyses}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Card>
                            </div>
                        </div>
                    )}
                </motion.div>
            </main>
            <Footer />
        </div>
    );
};

export default AnalyticsDashboard;