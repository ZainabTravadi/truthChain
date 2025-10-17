import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface VerdictCardProps {
  id: string;
  title: string;
  verdict: 'true' | 'mixed' | 'false';
  confidence: number;
  date: string;
  summary: string;
}

const VerdictCard = ({ id, title, verdict, confidence, date, summary }: VerdictCardProps) => {
  const navigate = useNavigate();

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

  const config = verdictConfig[verdict];
  const VerdictIcon = config.icon;

  return (
    <motion.div
      className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-smooth hover-lift cursor-pointer"
      onClick={() => navigate(`/verdicts/${id}`)}
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2 line-clamp-2">{title}</h3>
          <p className="text-sm text-muted-foreground">{new Date(date).toLocaleDateString()}</p>
        </div>
        <Badge className={`${config.bgColor} ${config.color} border ${config.borderColor}`}>
          <VerdictIcon className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{summary}</p>

      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground">Confidence</span>
            <span className="text-sm font-semibold">{confidence}%</span>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className={`h-full bg-gradient-primary`}
              initial={{ width: 0 }}
              animate={{ width: `${confidence}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
        <Button variant="ghost" size="sm" className="ml-4">
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default VerdictCard;
