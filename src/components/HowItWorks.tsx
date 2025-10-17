import { motion } from 'framer-motion';
import { FileText, Brain, Shield, CheckCircle } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: FileText,
      title: 'Submit Content',
      description: 'Paste article text or enter a URL to analyze',
      color: 'from-primary to-accent',
    },
    {
      icon: Brain,
      title: 'AI Analysis',
      description: 'Advanced models verify facts against trusted sources',
      color: 'from-accent to-primary',
    },
    {
      icon: Shield,
      title: 'Blockchain Commit',
      description: 'Verdict stored immutably on-chain with IPFS proof',
      color: 'from-primary to-accent',
    },
    {
      icon: CheckCircle,
      title: 'Get Results',
      description: 'Receive confidence score and detailed evidence',
      color: 'from-accent to-primary',
    },
  ];

  return (
    <section className="py-20 bg-gradient-dark">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Four simple steps to verify any news article with AI and blockchain
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
            >
              {/* Step Number */}
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-xl font-bold z-10">
                {idx + 1}
              </div>

              {/* Card */}
              <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-smooth h-full hover-lift">
                <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${step.color} flex items-center justify-center mb-4`}>
                  <step.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>

              {/* Connector Line */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary to-transparent" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
