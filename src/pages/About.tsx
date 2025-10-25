import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Shield, Zap, Users, Lock, Brain, Globe, Database, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';

const About = () => {
  const features = [
    {
      icon: Brain,
      title: 'Hybrid AI Verification Engine',
      description:
        'We combine a fine-tuned RoBERTa model, Google Gemini reasoning, and real-time web-backed fact verification to evaluate news credibility.',
    },
    {
      icon: Search,
      title: 'Claim & Evidence Extraction',
      description:
        'Our system extracts the core claim in an article, identifies supporting and opposing evidence, and generates an explainable verification summary.',
    },
    {
      icon: Shield,
      title: 'Source Reputation Intelligence',
      description:
        'Domain credibility is evaluated using historical accuracy, publication bias, transparency, and cross-institutional trust scores.',
    },
    {
      icon: Database,
      title: 'Fact-Check API Integration',
      description:
        'Claims are validated against global fact-checking databases and academic/government sources for verifiable truth grounding.',
    },
    {
      icon: Lock,
      title: 'Adaptive Trust Scoring',
      description:
        'Each article receives a confidence score powered by local ML predictions, evidence alignment, AI-generated text detection, and source reliability.',
    },
    {
      icon: Globe,
      title: 'Transparent & Inspectable',
      description:
        'Every result includes an explanation trail, evidence sources, and reasoning transparency — no black-box verdicts.',
    },
  ];

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
            <span className="text-gradient">About TruthChain</span>
          </h1>
          <p className="text-xl text-center text-muted-foreground mb-12">
            A hybrid AI-powered platform for accurate, transparent news verification
          </p>

          {/* Mission */}
          <Card className="p-8 mb-12">
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Misinformation spreads quickly — often faster than the truth. TruthChain exists to
                restore clarity, trust, and accountability in the way information is consumed.
              </p>

              <p>
                Instead of relying on opinions or *black-box* models, we use a **hybrid verification
                pipeline** that analyzes text across multiple layers:
              </p>

              <ul className="list-disc ml-6 space-y-1">
                <li>A local ML model predicts intent and factual consistency</li>
                <li>Google Gemini performs high-depth reasoning and claim verification</li>
                <li>Global fact-checking databases validate real-world truth</li>
                <li>Source credibility and historical behavior shape final trust scoring</li>
              </ul>

              <p>
                Every result is traceable, explainable, and backed by evidence. No hidden logic. No
                silent judgment. Just reasoned transparency.
              </p>
            </div>
          </Card>

          {/* Features */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-center mb-8">How Our System Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="p-6 h-full hover:border-primary/50 transition-smooth hover-lift">
                    <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4 glow-primary">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <Card className="p-8 bg-gradient-primary text-center">
            <h2 className="text-2xl font-bold mb-4 text-white">
              Join the Fight for Truth
            </h2>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              TruthChain is not just a verification tool — it’s a step toward a more informed
              society. Analyze articles, verify claims, and help strengthen the reliability of the
              information we share.
            </p>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
