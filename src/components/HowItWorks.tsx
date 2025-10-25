import { motion } from 'framer-motion';
import { FileText, Brain, Shield, CheckCircle } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: FileText,
      title: 'Submit News or URL',
      description: 'Paste an article or share a link : TruthChain extracts its core claim and context automatically.',
      color: 'from-primary to-accent',
    },
    {
      icon: Brain,
      title: 'Hybrid AI Analysis',
      description: 'Our RoBERTa and Gemini AI models jointly assess the text, scanning reliable global databases and the live web.',
      color: 'from-accent to-primary',
    },
    {
      icon: Shield,
      title: 'Cross-Verification & Evidence',
      description: 'Claims are checked through Google Fact Check Tools and source credibility heuristics to ensure factual grounding.',
      color: 'from-primary to-accent',
    },
    {
      icon: CheckCircle,
      title: 'Final Verdict & Insights',
      description: 'TruthChain fuses all AI signals to deliver a clear verdict : True, False, or Mixed, with confidence scores and cited sources.',
      color: 'from-accent to-primary',
    },
  ];

  return (
    <section className="py-20 bg-gradient-dark">
      <div className="container mx-auto px-4">
        {/* Section Heading */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            TruthChain verifies any news article in four intelligent steps, powered by deep learning and real-time fact verification.
          </p>
        </motion.div>

        {/* Step Cards */}
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

              {/* Step Card */}
              <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-smooth h-full hover-lift">
                <div
                  className={`w-16 h-16 rounded-lg bg-gradient-to-br ${step.color} flex items-center justify-center mb-4`}
                >
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
