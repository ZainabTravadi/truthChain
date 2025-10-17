import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Shield, Zap, Users, Lock, Brain, Globe } from 'lucide-react';
import { Card } from '@/components/ui/card';

const About = () => {
  const features = [
    {
      icon: Brain,
      title: 'Advanced AI Models',
      description: 'State-of-the-art natural language processing and fact-checking algorithms analyze articles against verified databases.',
    },
    {
      icon: Lock,
      title: 'Blockchain Security',
      description: 'All verdicts are stored immutably on-chain with IPFS evidence, ensuring transparency and preventing manipulation.',
    },
    {
      icon: Shield,
      title: 'Source Credibility',
      description: 'We cross-reference claims with trusted academic, governmental, and fact-checking sources with proven track records.',
    },
    {
      icon: Users,
      title: 'Community Governance',
      description: 'Token holders can challenge verdicts and participate in DAO decisions about platform improvements.',
    },
    {
      icon: Zap,
      title: 'Real-Time Analysis',
      description: 'Get instant verification results with detailed evidence breakdowns and confidence scoring.',
    },
    {
      icon: Globe,
      title: 'Open & Transparent',
      description: 'Our verification process is fully auditable, with all evidence sources publicly accessible.',
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
            <span className="text-gradient">About CrimsonTruth</span>
          </h1>
          <p className="text-xl text-center text-muted-foreground mb-12">
            Fighting misinformation with AI and blockchain technology
          </p>

          {/* Mission */}
          <Card className="p-8 mb-12">
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                In an era where misinformation spreads faster than truth, CrimsonTruth provides a
                transparent, decentralized platform for verifying news articles using advanced AI
                and blockchain technology.
              </p>
              <p>
                We believe that trust in information should be earned through verifiable evidence,
                not editorial opinion. By combining artificial intelligence with Web3 infrastructure,
                we create an immutable record of fact-checking that anyone can audit.
              </p>
              <p>
                Our platform empowers users to make informed decisions by providing confidence scores,
                detailed evidence, and blockchain-secured verdicts that can't be altered or censored.
              </p>
            </div>
          </Card>

          {/* Features Grid */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-center mb-8">How We Do It</h2>
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

          {/* Technology Stack */}
          <Card className="p-8 mb-12">
            <h2 className="text-2xl font-bold mb-4">Technology Stack</h2>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">AI & Machine Learning</h3>
                <p className="text-sm">
                  Advanced natural language processing models trained on millions of verified articles,
                  combined with knowledge graphs and semantic analysis for accurate fact-checking.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Blockchain Infrastructure</h3>
                <p className="text-sm">
                  Ethereum-compatible smart contracts for immutable verdict storage, IPFS for
                  decentralized evidence hosting, and ENS integration for human-readable addresses.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Data Sources</h3>
                <p className="text-sm">
                  Integration with academic databases, government records, established fact-checking
                  organizations, and verified news archives for comprehensive source verification.
                </p>
              </div>
            </div>
          </Card>

          {/* CTA */}
          <Card className="p-8 bg-gradient-primary text-center">
            <h2 className="text-2xl font-bold mb-4 text-white">Join the Fight Against Misinformation</h2>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              CrimsonTruth is more than a tool—it's a movement towards transparent, verifiable truth.
              Start verifying articles today and contribute to a more informed world.
            </p>
            <div className="text-sm text-white/70">
              * This is a demonstration frontend. Backend AI models and blockchain integration coming soon.
            </div>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
