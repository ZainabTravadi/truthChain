import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, ExternalLink, Copy } from 'lucide-react';
import EvidenceCard from '@/components/EvidenceCard';
import ConfidenceBar from '@/components/ConfidenceBar';
import { mockVerdicts } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

const VerdictDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const verdict = mockVerdicts.find((v) => v.id === id);

  if (!verdict) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Verdict Not Found</h1>
            <Button onClick={() => navigate('/verdicts')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Verdicts
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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

  const config = verdictConfig[verdict.verdict];
  const VerdictIcon = config.icon;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/verdicts')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Verdicts
          </Button>

          {/* Header */}
          <Card className="p-8 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{verdict.title}</h1>
                <p className="text-muted-foreground">
                  Analyzed on {new Date(verdict.date).toLocaleDateString()}
                </p>
              </div>
              <Badge className={`${config.bgColor} ${config.color} border ${config.borderColor} text-lg px-4 py-2`}>
                <VerdictIcon className="h-5 w-5 mr-2" />
                {config.label}
              </Badge>
            </div>

            <div className="mb-6">
              <ConfidenceBar confidence={verdict.confidence} label="Confidence Score" size="lg" />
            </div>

            <div className="p-4 rounded-lg bg-secondary/50">
              <h3 className="font-semibold mb-2">Summary</h3>
              <p className="text-muted-foreground">{verdict.summary}</p>
            </div>

            {verdict.url && (
              <a
                href={verdict.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline mt-4"
              >
                View original article
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </Card>

          {/* Blockchain Details */}
          {verdict.txHash && verdict.ipfsCid && (
            <Card className="p-8 mb-6">
              <h2 className="text-xl font-bold mb-4">Blockchain Proof</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                    Transaction Hash
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm bg-secondary p-3 rounded font-mono truncate">
                      {verdict.txHash}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(verdict.txHash!, 'Transaction hash')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                    IPFS Content ID
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm bg-secondary p-3 rounded font-mono truncate">
                      {verdict.ipfsCid}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(verdict.ipfsCid!, 'IPFS CID')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Evidence */}
          <Card className="p-8 mb-6">
            <h2 className="text-xl font-bold mb-6">Evidence Analysis</h2>
            <div className="space-y-4">
              {verdict.evidence.map((evidence) => (
                <EvidenceCard key={evidence.id} {...evidence} />
              ))}
            </div>
          </Card>

          {/* Actions */}
          <Card className="p-8">
            <h2 className="text-xl font-bold mb-4">Community Actions</h2>
            <p className="text-muted-foreground mb-6">
              Believe this verdict is incorrect? Token holders can challenge verdicts and
              participate in governance decisions.
            </p>
            <div className="flex gap-4">
              <Button variant="outline" className="flex-1" disabled>
                Challenge Verdict
              </Button>
              <Button variant="outline" className="flex-1" disabled>
                View Discussion
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              * Feature coming soon - requires wallet connection
            </p>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default VerdictDetail;
