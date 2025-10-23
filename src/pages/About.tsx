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
      description:
        'Powered by Google Gemini and integrated with trusted news APIs, our AI analyzes articles, cross-references claims, and evaluates reliability in real time.',
    },
    {
      icon: Lock,
      title: 'Data Integrity',
      description:
        'Our systems ensure all verification results remain secure, transparent, and tamper-proof within the platform.',
    },
    {
      icon: Shield,
      title: 'Source Credibility',
      description:
        'We cross-reference claims with trusted academic, governmental, and fact-checking sources with proven track records.',
    },
    {
      icon: Users,
      title: 'Community Collaboration',
      description:
        'Users can provide feedback, flag inaccuracies, and contribute to improving the platform’s verification accuracy.',
    },
    {
      icon: Zap,
      title: 'Real-Time Analysis',
      description:
        'Get instant verification results with detailed evidence breakdowns and confidence scoring.',
    },
    {
      icon: Globe,
      title: 'Open & Transparent',
      description:
        'Our verification process is fully auditable, with all evidence sources publicly accessible.',
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
            Fighting misinformation with cutting-edge artificial intelligence
          </p>

          {/* Mission */}
          <Card className="p-8 mb-12">
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                In an era where misinformation spreads faster than truth, TruthChain provides a
                transparent platform for verifying news articles using advanced AI and data-driven
                analysis.
              </p>
              <p>
                We believe that trust in information should be earned through verifiable evidence,
                not editorial opinion. By combining artificial intelligence with trusted data
                pipelines, we create a reliable fact-checking process that anyone can understand and
                evaluate.
              </p>
              <p>
                Our platform empowers users to make informed decisions by providing confidence scores
                and detailed evidence that can’t be altered or censored.
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

          {/* CTA */}
          <Card className="p-8 bg-gradient-primary text-center">
            <h2 className="text-2xl font-bold mb-4 text-white">
              Join the Fight Against Misinformation
            </h2>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              TruthChain is more than a tool—it's a movement towards transparent, verifiable truth.
              Start verifying articles today and contribute to a more informed world.
            </p>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
