import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Zap, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroBg from '@/assets/hero-bg.jpg';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroBg} 
          alt="AI Neural Network Background" 
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background"></div>
      </div>

      {/* Animated Particles */}
      <div className="absolute inset-0 z-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0,
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              ease: 'linear',
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Top Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-primary/20 mb-6">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">AI-Powered News Verification</span>
            </div>
          </motion.div>

          {/* Hero Heading */}
          <motion.h1
            className="text-5xl md:text-7xl font-black tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <span className="text-gradient">Detect.</span>{' '}
            <span className="text-gradient">Verify.</span>{' '}
            <span className="text-gradient">Trust.</span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            className="text-xs md:text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Experience real-time AI-powered fake news detection. 
            TruthChain combines multiple AI models, web intelligence, and credibility checks 
            to help you separate truth from misinformation.
          </motion.p>

          {/* Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Button
              size="lg"
              className="bg-gradient-primary hover:glow-primary-lg text-lg px-8 py-6 group"
              onClick={() => navigate('/check')}
            >
              Check an Article
              <ArrowRight className="ml-2 h-5 w-5 transition-smooth group-hover:translate-x-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 border-primary/50 hover:bg-primary/10"
              onClick={() => navigate('/explorer')}
            >
              Explore Verdicts
            </Button>
          </motion.div>

          {/* Features */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {[
              {
                icon: Zap,
                title: 'Hybrid AI Analysis',
                desc: 'TruthChain fuses RoBERTa and Gemini AI to cross-check news using both local and real-time web intelligence.'
              },
              {
                icon: Lock,
                title: 'Source & Claim Verification',
                desc: 'Each claim is validated through Google Fact Check Tools and source credibility scoring before final verdict.'
              },
              {
                icon: Shield,
                title: 'Transparent Evidence',
                desc: 'Get a clear breakdown of verdicts, confidence levels, and supporting or contradictory sources — all in one place.'
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-smooth hover-lift"
              >
                <feature.icon className="h-8 w-8 text-primary mb-3 mx-auto" />
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
