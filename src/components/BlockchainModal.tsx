import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Copy, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface BlockchainModalProps {
  isOpen: boolean;
  onClose: () => void;
  txHash?: string;
  ipfsCid?: string;
}

const BlockchainModal = ({ isOpen, onClose, txHash, ipfsCid }: BlockchainModalProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState<'tx' | 'ipfs' | null>(null);

  const copyToClipboard = (text: string, type: 'tx' | 'ipfs') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast({
      title: 'Copied!',
      description: 'Hash copied to clipboard',
    });
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <DialogTitle>Verdict Committed to Blockchain</DialogTitle>
          </div>
          <DialogDescription>
            Your verdict has been permanently stored on-chain with immutable proof.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Transaction Hash */}
          <div className="p-4 rounded-lg bg-card border border-border">
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">
              Transaction Hash
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-secondary p-2 rounded font-mono truncate">
                {txHash || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEaC'}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(txHash || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEaC', 'tx')}
              >
                {copied === 'tx' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* IPFS CID */}
          <div className="p-4 rounded-lg bg-card border border-border">
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">
              IPFS Content ID
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-secondary p-2 rounded font-mono truncate">
                {ipfsCid || 'QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxX'}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(ipfsCid || 'QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxX', 'ipfs')}
              >
                {copied === 'ipfs' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" asChild>
              <a href="#" className="flex items-center justify-center gap-2">
                View on Explorer
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <Button className="flex-1 bg-gradient-primary" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BlockchainModal;
