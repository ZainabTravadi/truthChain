import { motion } from 'framer-motion';
import { Database, Lock, Users, FileCheck } from 'lucide-react';

const WhyWeb3 = () => {
  const features = [
    {
      icon: Lock,
      title: 'Immutable Records',
      description: 'Once a verdict is stored on blockchain, it cannot be altered or deleted, ensuring permanent accountability.',
    },
    {
      icon: Database,
      title: 'Decentralized Storage',
      description: 'Evidence stored on IPFS ensures no single entity controls the data, promoting transparency.',
    },
    {
      icon: Users,
      title: 'Community Governance',
      description: 'Token holders can challenge verdicts and vote on disputed cases, creating a democratic verification system.',
    },
    {
      icon: FileCheck,
      title: 'Verifiable Proof',
      description: 'Every analysis includes cryptographic proof that anyone can verify independently on the blockchain.',
    },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Why Web3?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Blockchain technology brings unprecedented transparency and trust to fact-checking
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              className="p-8 rounded-xl bg-card border border-border hover:border-primary/50 transition-smooth hover-lift"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
            >
              <div className="w-14 h-14 rounded-lg bg-gradient-primary flex items-center justify-center mb-4 glow-primary">
                <feature.icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyWeb3;
