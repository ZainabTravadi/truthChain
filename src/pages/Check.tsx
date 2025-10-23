// ========================================================================
// Check.tsx — Fact Verification Page (Simplified & Polished)
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
} from 'lucide-react';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Loader from '@/components/Loader';
import ConfidenceBar from '@/components/ConfidenceBar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// ========================================================================
// Interfaces
// ========================================================================
interface EvidenceItem {
  id: string;
  source: string;
  link: string;
  description: string;
  credibility: number;
  content: string;
  supportVerdict: 'supporting' | 'contradictory' | 'neutral';
}

interface AnalysisResult {
  verdict: 'true' | 'false' | 'mixed';
  confidence: number;
  summary: string;
  evidence: EvidenceItem[];
}

// ========================================================================
// Custom Evidence Card
// ========================================================================
// ========================================================================
// Custom Evidence Card (Final Polished Version)
// ========================================================================
const EvidenceCard: React.FC<{ evidence: EvidenceItem }> = ({ evidence }) => {
  const [expanded, setExpanded] = useState(false);
  const maxLength = 150;
  const textTooLong = evidence.description.length > maxLength;
  const shownText = expanded
    ? evidence.description
    : evidence.description.slice(0, maxLength) + (textTooLong ? '...' : '');

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
            className={`${
              evidence.supportVerdict === 'supporting'
                ? 'bg-green-500/10 text-green-500 border-green-500/50'
                : evidence.supportVerdict === 'contradictory'
                ? 'bg-red-500/10 text-red-500 border-red-500/50'
                : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50'
            }`}
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
// Main Component
// ========================================================================
const Check = () => {
  const [inputText, setInputText] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'text' | 'url'>('text');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ======================================================================
  // Handlers
  // ======================================================================
  const handleAnalyze = async () => {
    setErrorMessage(null);
    setResult(null);

    const inputType = activeTab;
    const inputValue = inputType === 'text' ? inputText.trim() : inputUrl.trim();

    if (!inputValue) {
      setErrorMessage(
        `Please enter ${inputType === 'text' ? 'some text' : 'a valid URL'}.`
      );
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input_type: inputType, input_value: inputValue }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Analysis failed.');
      setResult(data as AnalysisResult);
    } catch (error) {
      console.error('API Error:', error);
      setErrorMessage(
        `Analysis Error: ${
          error instanceof Error ? error.message : 'Unknown issue occurred.'
        }`
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ======================================================================
  // Verdict Config
  // ======================================================================
  const verdictConfig = {
    true: {
      label: 'Likely True',
      icon: CheckCircle,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      border: 'border-green-500/50',
    },
    false: {
      label: 'Likely False',
      icon: XCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      border: 'border-red-500/50',
    },
    mixed: {
      label: 'Mixed Evidence',
      icon: AlertCircle,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/50',
    },
  };

  const config = result ? verdictConfig[result.verdict] : verdictConfig.mixed;
  const VerdictIcon = config.icon;

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
              Paste text or enter a URL to get instant AI-powered fact verification
            </p>
          </div>

          {/* ================= Input Card ================= */}
          <Card className="p-6 mb-8">
            <Tabs
              defaultValue="text"
              className="w-full"
              onValueChange={(value: 'text' | 'url') => setActiveTab(value)}
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
              disabled={isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Now'}
            </Button>
          </Card>

          {/* ================= Loading ================= */}
          {isAnalyzing && (
            <Card className="p-8">
              <Loader text="Analyzing article with AI..." />
            </Card>
          )}

          {/* ================= Results ================= */}
          {result && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Verdict */}
              <Card className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Analysis Results</h2>
                  <Badge
                    className={`${config.bg} ${config.color} border ${config.border} text-lg px-4 py-2 flex items-center`}
                  >
                    <VerdictIcon className="h-5 w-5 mr-2" />
                    {config.label}
                  </Badge>
                </div>

                <div className="mb-6">
                  <ConfidenceBar
                    confidence={result.confidence * 100} // ✅ fix: scale 0–1 to %
                    label="Confidence Score"
                    size="lg"
                  />
                </div>

                <div className="p-4 rounded-lg bg-secondary/50 mb-6">
                  <h3 className="font-semibold mb-2">Summary</h3>
                  <p className="text-muted-foreground">{result.summary}</p>
                </div>
              </Card>

              {/* Evidence */}
              <Card className="p-8">
                <h3 className="text-xl font-bold mb-6">Supporting Evidence</h3>
                <div className="space-y-4">
                  {result.evidence.map((ev) => (
                    <EvidenceCard key={ev.id} evidence={ev} />
                  ))}
                </div>
              </Card>

              {/* Explanation */}
              <Card className="p-8">
                <h3 className="text-xl font-bold mb-4">How We Analyzed This</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Our AI cross-referenced the article's claims against{' '}
                    {result.evidence.length} verified sources from academic databases,
                    fact-checking organizations, and public records.
                  </p>
                  <p>
                    The confidence score reflects source credibility, consistency, and
                    evidence strength. A score above 80% indicates high reliability.
                  </p>
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