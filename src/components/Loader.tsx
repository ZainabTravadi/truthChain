import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

interface LoaderProps {
  text?: string;
}

const Loader = ({ text = 'Analyzing...' }: LoaderProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <motion.div
        className="relative"
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary glow-primary" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Shield className="h-6 w-6 text-primary" />
        </div>
      </motion.div>
      <motion.p
        className="mt-4 text-sm text-muted-foreground"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {text}
      </motion.p>
    </div>
  );
};

export default Loader;
