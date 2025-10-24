// ========================================================================
// Check.tsx — Fact Verification Page (Hybrid Fusion & LIME Visualization)
// ========================================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    CheckCircle,
    XCircle,
    AlertCircle,
    FileText,
    Link as LinkIcon,
    ExternalLink,
    Wand2,
} from 'lucide-react';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Loader from '@/components/Loader';
// NOTE: Assuming ConfidenceBar is a custom component
import ConfidenceBar from '@/components/ConfidenceBar'; 
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// ========================================================================
// Interfaces (Updated for Hybrid Fusion and LIME)
// ========================================================================
type VerdictType = 'true' | 'false' | 'mixed';

interface EvidenceItem {
    id: string;
    source: string;
    link: string;
    description: string;
    credibility: number;
    content: string;
    supportVerdict: 'supporting' | 'contradictory' | 'neutral';
}

interface LIMEWeight {
    word: string;
    weight: number;
}

interface FusionResult {
    status: string;
    final_verdict: VerdictType;
    final_confidence: number; // Fused score (0.0 to 1.0)
    fused_components: {
        ai_synthesis_detected: boolean;
        ai_probability: number;
        local_model: { verdict: VerdictType; confidence: number; };
        gemini_pipeline: {
            verdict: VerdictType;
            confidence: number;
            summary: string;
            evidence: EvidenceItem[];
        }
    };
    summary?: string; 
}

// ========================================================================
// Verdict Config (Hoisted for safe access)
// ========================================================================
const verdictConfig: Record<VerdictType | 'mixed', any> = { 
    true: { label: 'LIKELY TRUE', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/50' },
    false: { label: 'LIKELY FALSE', icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/50' },
    mixed: { label: 'MIXED EVIDENCE', icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/50' },
};

// ========================================================================
// Word Highlighter Utility (FINAL FIX)
// ========================================================================

const COLOR_CLASSES: Record<number, string> = {
    10: 'bg-red-500/10', 20: 'bg-red-500/20', 30: 'bg-red-500/30', 40: 'bg-red-500/40',
    50: 'bg-red-500/50', 60: 'bg-red-500/60', 70: 'bg-red-500/70', 80: 'bg-red-500/80',
    90: 'bg-red-500/90',
    11: 'bg-green-500/10', 21: 'bg-green-500/20', 31: 'bg-green-500/30', 41: 'bg-green-500/40',
    51: 'bg-green-500/50', 61: 'bg-green-500/60', 71: 'bg-green-500/70', 81: 'bg-green-500/80',
    91: 'bg-green-500/90',
};

const getDiscreteOpacityKey = (weight: number): number => {
    const scale = Math.floor(Math.min(0.9, Math.abs(weight)) * 9) + 1;
    return weight > 0 ? scale + 10 : scale; 
};

const getHighlightClass = (weight: number): string => {
    const opacityKey = getDiscreteOpacityKey(weight);
    return COLOR_CLASSES[opacityKey] || ''; 
};

const getHighlightedText = (text: string, weights: LIMEWeight[]) => {
    const weightMap = new Map(weights.map(w => [w.word.toLowerCase(), w.weight]));
    const parts = text.match(/(\\b\\w+\\b|[^\\w\\s]+|\\s+)/g) || [];
    
    return parts.map((part, index) => {
        const cleanWord = part.toLowerCase().replace(/[^a-z0-9]/g, '');
        const weight = weightMap.get(cleanWord) || 0;
        
        const highlightClass = getHighlightClass(weight);

        if (highlightClass) { 
            return (
                <span
                    key={index}
                    // Apply the background class
                    className={`px-0.5 rounded-sm transition-all duration-150 ${highlightClass}`}
                    title={`Influence: ${weight.toFixed(4)}`}
                >
                    {part}
                </span>
            );
        }
        // FINAL FIX: Return with explicit light text color for visibility
        return <span key={index} className="text-gray-100">{part}</span>; 
    });
};


// ========================================================================
// Custom Evidence Card (Reused)
// ========================================================================
const EvidenceCard: React.FC<{ evidence: EvidenceItem }> = ({ evidence }) => {
    const [expanded, setExpanded] = useState(false);
    const maxLength = 150;
    const textTooLong = evidence.description.length > maxLength;
    const shownText = expanded
        ? evidence.description
        : evidence.description.slice(0, maxLength) + (textTooLong ? '...' : '');

    const evidenceConfig = {
        supporting: { color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/50' },
        contradictory: { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/50' },
        neutral: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/50' },
    }[evidence.supportVerdict];

    return (
        <Card className="p-4 border flex flex-col justify-between">
            {/* Top Info */}
            <div>
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-semibold">{evidence.source}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            Credibility: {evidence.credibility.toFixed(2)}
                        </p>
                    </div>
                    <Badge
                        className={`${evidenceConfig.bg} ${evidenceConfig.color} border ${evidenceConfig.border}`}
                    >
                        {evidence.supportVerdict}
                    </Badge>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mt-2">{shownText}</p>
            </div>

            {/* Bottom Row */}
            <div className="flex justify-between items-center mt-4">
                {textTooLong && (
                    <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto text-xs text-red-500 hover:text-red-600"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? 'Show Less' : 'Read More'}
                    </Button>
                )}

                {evidence.link && (
                    <a
                        href={evidence.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm border border-red-500 text-red-500 rounded-full px-3 py-1 hover:bg-red-500 hover:text-white transition-colors"
                    >
                        View Source <ExternalLink className="w-3 h-3" />
                    </a>
                )}
            </div>
        </Card>
    );
};


// ========================================================================
// Main Component: Check
// ========================================================================
const Check = () => {
    const [inputText, setInputText] = useState('');
    const [inputUrl, setInputUrl] = useState('');
    const [activeTab, setActiveTab] = useState<'text' | 'url'>('text');

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<FusionResult | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    
    const [limeWeights, setLimeWeights] = useState<LIMEWeight[] | null>(null);
    const [isExplaining, setIsExplaining] = useState(false);
    
    const API_URL = 'http://127.0.0.1:5001';

    const lastAnalyzedValue = activeTab === 'text' ? inputText : inputUrl;


    // ======================================================================
    // LIME Fetcher
    // ======================================================================
    const fetchLIMEExplanation = async (inputValue: string, inputType: 'text' | 'url') => {
        setIsExplaining(true);
        try {
            const response = await fetch(`${API_URL}/api/explain`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input_type: inputType, input_value: inputValue }),
            });
            
            const data = await response.json();
            
            if (!response.ok || data.error) {
                console.error("LIME Fetch Failed:", data.error || "Unknown LIME Error");
                setLimeWeights([]); 
                return;
            }
            
            setLimeWeights(data.weights);
            
        } catch (error) {
            console.error('LIME API Error:', error);
            setLimeWeights([]); 
        } finally {
            setIsExplaining(false);
        }
    };
    
    // ======================================================================
    // Analysis Handler (Runs FUSION endpoint)
    // ======================================================================
    const handleAnalyze = async () => {
        setErrorMessage(null);
        setResult(null);
        setLimeWeights(null); // Clear previous results

        const inputType = activeTab;
        const inputValue = inputType === 'text' ? inputText.trim() : inputUrl.trim();

        if (!inputValue) {
            setErrorMessage(`Please enter ${inputType === 'text' ? 'some text' : 'a valid URL'}.`);
            return;
        }

        setIsAnalyzing(true);
        try {
            const response = await fetch(`${API_URL}/api/analyze`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input_type: inputType, input_value: inputValue }),
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || data.summary || `Analysis failed with status ${response.status}`);
            }
            
            setResult(data as FusionResult);

            // Trigger LIME explanation for the text just analyzed
            await fetchLIMEExplanation(inputValue, inputType); 

        } catch (error) {
            console.error('API Error:', error);
            setErrorMessage(
                `Analysis Error: ${
                    error instanceof Error ? error.message : 'Unknown issue occurred. (Check console for detail)'
                }`
            );
        } finally {
            setIsAnalyzing(false);
        }
    };

    // --- LOGIC BLOCK: Uses the hoisted verdictConfig ---
    const config = result ? verdictConfig[result.final_verdict] : verdictConfig.mixed;
    const VerdictIcon = config.icon;
    const confidencePercent = result?.final_confidence * 100 || 0;
    const evidenceList = result?.fused_components?.gemini_pipeline?.evidence || [];
    const aiProbability = result?.fused_components.ai_probability || 0;


    // ======================================================================
    // JSX
    // ======================================================================
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navbar />

            <main className="flex-grow container mx-auto px-4 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto"
                >
                    {/* ================= Header ================= */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold mb-2">
                            <span className="text-gradient">Verify Any Article</span>
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            Hybrid AI-powered verification using local models and Gemini.
                        </p>
                    </div>

                    {/* ================= Input Card ================= */}
                    <Card className="p-6 mb-8">
                        <Tabs
                            defaultValue="text"
                            className="w-full"
                            onValueChange={(value: 'text' | 'url') => {
                                setActiveTab(value);
                                setInputText('');
                                setInputUrl('');
                                setResult(null);
                                setErrorMessage(null);
                                setLimeWeights(null);
                            }}
                        >
                            <TabsList className="grid grid-cols-2 mb-6">
                                <TabsTrigger value="text" className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" /> Paste Text
                                </TabsTrigger>
                                <TabsTrigger value="url" className="flex items-center gap-2">
                                    <LinkIcon className="h-4 w-4" /> Enter URL
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="text">
                                <Textarea
                                    placeholder="Paste the article text here..."
                                    className="min-h-[200px] mb-4"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                />
                            </TabsContent>

                            <TabsContent value="url">
                                <Input
                                    type="url"
                                    placeholder="https://example.com/article"
                                    className="mb-4"
                                    value={inputUrl}
                                    onChange={(e) => setInputUrl(e.target.value)}
                                />
                            </TabsContent>
                        </Tabs>

                        {errorMessage && (
                            <div className="mb-4 p-3 rounded-md border border-red-500/50 bg-red-500/10 text-red-500">
                                {errorMessage}
                            </div>
                        )}

                        <Button
                            size="lg"
                            className="w-full bg-gradient-primary hover:glow-primary"
                            onClick={handleAnalyze}
                            disabled={isAnalyzing || isExplaining}
                        >
                            {isAnalyzing ? 'Running Hybrid Analysis...' : isExplaining ? 'Generating Explanation...' : 'Analyze Now'}
                        </Button>
                    </Card>

                    {/* ================= Loading ================= */}
                    {(isAnalyzing || isExplaining) && (
                        <Card className="p-8">
                            <Loader text={isExplaining ? "Calculating LIME word influence..." : "Running AI and Hybrid Models..."} />
                        </Card>
                    )}

                    {/* ================= Results ================= */}
                    {result && !isAnalyzing && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            {/* Verdict Card */}
                            <Card className="p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold">Hybrid Analysis Verdict</h2>
                                    <Badge
                                        className={`${config.bg} ${config.color} border ${config.border} text-lg px-4 py-2 flex items-center`}
                                    >
                                        <VerdictIcon className="h-5 w-5 mr-2" />
                                        {config.label}
                                    </Badge>
                                </div>

                                <div className="mb-6">
                                    <ConfidenceBar
                                        confidence={confidencePercent} // Final Adjusted Confidence
                                        label="Final Adjusted Confidence Score"
                                        size="lg"
                                    />
                                    <p className="text-sm text-muted-foreground mt-2">
                                        <span className="font-semibold text-primary">Final Score: {result.final_confidence.toFixed(4)}</span> is the weighted fusion of the Local RoBERTa Model (60%) and the Gemini Pipeline (40%), penalized by the AI Synthesis Probability ({aiProbability.toFixed(4)}).
                                    </p>
                                </div>

                                <div className="p-4 rounded-lg bg-secondary/50 mb-6">
                                    <h3 className="font-semibold mb-2">Summary</h3>
                                    <p className="text-muted-foreground">
                                        {result.fused_components.gemini_pipeline.summary}
                                    </p>
                                </div>
                            </Card>
                            
                            {/* 🧠 LIME INTERPRETABILITY CARD (Analyst Aesthetic) */}
<Card className="p-8">
    {/* Header */}
    <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Model Interpretability (LIME)</h2>

        {isExplaining ? (
            <Badge className="border border-yellow-400/40 text-yellow-500 bg-yellow-500/10 text-sm px-4 py-1 animate-pulse flex items-center">
                <Wand2 className="h-4 w-4 mr-2" />
                Generating Insights...
            </Badge>
        ) : (
            <Badge className="border border-green-400/40 text-green-600 bg-green-500/10 text-sm px-4 py-1 flex items-center">
                <Wand2 className="h-4 w-4 mr-2" />
                Explanation Ready
            </Badge>
        )}
    </div>

    {/* LIME Summary Insight */}
    {limeWeights?.length ? (
        <div className="mb-6">
            <h3 className="font-semibold mb-2">Top Influential Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {limeWeights
                    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
                    .slice(0, 6)
                    .map((item, index) => {
                        const positive = item.weight > 0;
                        const barWidth = Math.min(Math.abs(item.weight) * 100, 100);
                        return (
                            <div key={index} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-gray-200">{item.word}</span>
                                    <span
                                        className={
                                            positive
                                                ? "text-green-400 text-xs"
                                                : "text-red-400 text-xs"
                                        }
                                    >
                                        {positive ? "↑ TRUE" : "↓ FALSE"}
                                    </span>
                                </div>
                                <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
                                    <motion.div
                                        className={`h-full ${
                                            positive ? "bg-green-500/80" : "bg-red-500/80"
                                        }`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${barWidth}%` }}
                                        transition={{ duration: 0.6, delay: index * 0.05 }}
                                    />
                                </div>
                            </div>
                        );
                    })}
            </div>
        </div>
    ) : (
        <div className="p-6 rounded-lg bg-secondary/50 text-center text-muted-foreground border italic">
            ⚠️ LIME explanation unavailable or failed to generate.
        </div>
    )}

    {/* Explanation Text */}
    {limeWeights?.length ? (
        <motion.div
            className="p-5 rounded-lg bg-secondary/40 border text-base leading-relaxed text-muted-foreground"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <h4 className="font-semibold mb-2 text-primary">Model Rationale</h4>
            <p>
                The model considered <span className="font-semibold text-primary">{limeWeights.length}</span> features.
                The strongest signals came from the words shown above — positively weighted words 
                push the prediction toward <span className="text-green-400 font-medium">TRUE</span>, 
                while negatively weighted ones pull it toward <span className="text-red-400 font-medium">FALSE</span>.
            </p>
        </motion.div>
    ) : null}
</Card>



                            {/* Evidence Links (Gemini Pipeline) */}
                            <Card className="p-8">
                                <h3 className="text-xl font-bold mb-6">Supporting Evidence (Gemini Search)</h3>
                                <div className="space-y-4">
                                    {evidenceList.length > 0 ? (
                                        evidenceList.map((ev) => (
                                            <EvidenceCard key={ev.id || ev.source + ev.link} evidence={ev} /> 
                                        ))
                                    ) : (
                                        <p className="text-muted-foreground">No specific evidence links found during the Gemini search phase.</p>
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </motion.div>
            </main>

            <Footer />
        </div>
    );
};

export default Check;