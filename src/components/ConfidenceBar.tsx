import { motion } from 'framer-motion';

interface ConfidenceBarProps {
  confidence: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const ConfidenceBar = ({ confidence, label, size = 'md' }: ConfidenceBarProps) => {
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const getColor = (value: number) => {
    if (value >= 80) return 'from-green-500 to-green-400';
    if (value >= 60) return 'from-yellow-500 to-yellow-400';
    return 'from-red-500 to-red-400';
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-sm font-bold">{confidence}%</span>
        </div>
      )}
      <div className={`w-full ${sizeClasses[size]} bg-secondary rounded-full overflow-hidden`}>
        <motion.div
          className={`h-full bg-gradient-to-r ${getColor(confidence)}`}
          initial={{ width: 0 }}
          animate={{ width: `${confidence}%` }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
    </div>
  );
};

export default ConfidenceBar;
