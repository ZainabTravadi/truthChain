import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Link as LinkIcon, FileText } from 'lucide-react';
import Loader from '@/components/Loader';
import EvidenceCard from '@/components/EvidenceCard';
import ConfidenceBar from '@/components/ConfidenceBar';
import BlockchainModal from '@/components/BlockchainModal';
import { mockSampleAnalysis } from '@/data/mockData';

const Check = () => {
  const [inputText, setInputText] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<typeof mockSampleAnalysis | null>(null);
  const [showBlockchainModal, setShowBlockchainModal] = useState(false);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setResult(null);

    // Mock delay for analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      setResult(mockSampleAnalysis);
    }, 2000);
  };

  const verdictConfig = {
    true: {
      icon: CheckCircle,
      label: 'Likely True',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/50',
    },
    false: {
      icon: XCircle,
      label: 'Likely False',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/50',
    },
    mixed: {
      icon: AlertCircle,
      label: 'Mixed Evidence',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/50',
    },
  };

  const config = result ? verdictConfig[result.verdict] : verdictConfig.mixed;
  const VerdictIcon = config.icon;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
            <span className="text-gradient">Verify Any Article</span>
          </h1>
          <p className="text-xl text-center text-muted-foreground mb-12">
            Paste text or enter a URL to get instant AI-powered fact verification
          </p>

          {/* Input Section */}
          <Card className="p-6 mb-8">
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Paste Text
                </TabsTrigger>
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Enter URL
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

            <Button
              size="lg"
              className="w-full bg-gradient-primary hover:glow-primary"
              onClick={handleAnalyze}
              disabled={isAnalyzing || (!inputText && !inputUrl)}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Now'}
            </Button>
          </Card>

          {/* Loading State */}
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Card className="p-8">
                <Loader text="Analyzing article with AI..." />
              </Card>
            </motion.div>
          )}

          {/* Results */}
          {result && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Verdict Card */}
              <Card className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Analysis Results</h2>
                  <Badge className={`${config.bgColor} ${config.color} border ${config.borderColor} text-lg px-4 py-2`}>
                    <VerdictIcon className="h-5 w-5 mr-2" />
                    {config.label}
                  </Badge>
                </div>

                <div className="mb-6">
                  <ConfidenceBar confidence={result.confidence} label="Confidence Score" size="lg" />
                </div>

                <div className="p-4 rounded-lg bg-secondary/50 mb-6">
                  <h3 className="font-semibold mb-2">Summary</h3>
                  <p className="text-muted-foreground">{result.summary}</p>
                </div>

                <Button
                  size="lg"
                  className="w-full bg-gradient-primary hover:glow-primary"
                  onClick={() => setShowBlockchainModal(true)}
                >
                  Commit to Blockchain
                </Button>
              </Card>

              {/* Evidence Section */}
              <Card className="p-8">
                <h3 className="text-xl font-bold mb-6">Supporting Evidence</h3>
                <div className="space-y-4">
                  {result.evidence.map((evidence) => (
                    <EvidenceCard key={evidence.id} {...evidence} />
                  ))}
                </div>
              </Card>

              {/* Explanation */}
              <Card className="p-8">
                <h3 className="text-xl font-bold mb-4">How We Analyzed This</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Our AI model cross-referenced the article's claims against {result.evidence.length} verified sources
                    from academic databases, fact-checking organizations, and official records.
                  </p>
                  <p>
                    The confidence score is calculated based on source credibility, claim consistency,
                    and the strength of supporting evidence. A score above 80% indicates high confidence.
                  </p>
                  <p className="text-sm italic">
                    Note: This is a demonstration using mock data. In production, this would connect to
                    real AI models and blockchain infrastructure.
                  </p>
                </div>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </main>
      <Footer />
      <BlockchainModal
        isOpen={showBlockchainModal}
        onClose={() => setShowBlockchainModal(false)}
        txHash={result?.txHash}
        ipfsCid={result?.ipfsCid}
      />
    </div>
  );
};

export default Check;
