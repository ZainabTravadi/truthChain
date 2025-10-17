import { motion } from 'framer-motion';
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EvidenceCardProps {
  source: string;
  credibility: number;
  content: string;
  supportVerdict: boolean;
}

const EvidenceCard = ({ source, credibility, content, supportVerdict }: EvidenceCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-5 hover:border-primary/50 transition-smooth cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {supportVerdict ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <h4 className="font-semibold">{source}</h4>
          </div>
          <Badge variant="secondary" className="text-xs">
            {credibility}% credible
          </Badge>
        </div>

        <div className="mb-3">
          <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-primary"
              initial={{ width: 0 }}
              animate={{ width: `${credibility}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        <motion.div
          initial={false}
          animate={{ height: isExpanded ? 'auto' : 60 }}
          className="overflow-hidden"
        >
          <p className={`text-sm text-muted-foreground ${!isExpanded ? 'line-clamp-2' : ''}`}>
            {content}
          </p>
        </motion.div>

        <div className="mt-3 flex items-center justify-between">
          <button className="text-xs text-primary hover:underline">
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
          <a href="#" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
            View source
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </Card>
    </motion.div>
  );
};

export default EvidenceCard;
