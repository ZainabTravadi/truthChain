import { Shield, Linkedin, Github, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = {
    linkedin: "https://www.linkedin.com/in/zainab-travadi-119a83373/",
    github: "https://github.com/ZainabTravadi",
    email: "mailto:zainabtravadi421@gmail.com",
    resume: "https://docs.google.com/your-resume-link",
  };

  const resourceLinks = {
    documentation:
      "https://github.com/ZainabTravadi/truthChain.git",
    researchPapers:
      "https://www.cancer.gov/about-cancer/treatment/drugs/cancer-type",
    postman: "https://ai.google.dev/gemini-api",
    fastapi: "https://newsapi.org/",
  };

  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold text-gradient">TruthChain</span>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-powered fake news detection technology.
            </p>
          </div>

          {/* About Me */}
          <div>
            <h3 className="font-semibold mb-4">About Me</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Zainab Travadi</li>
              <li>Data Scientist in the Making</li>
              <li>B.Tech CSE</li>
              <li>Parul University</li>
            </ul>
          </div>

          {/* Resources & Tools */}
          <div>
            <h3 className="font-semibold mb-4">Resources & Tools</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href={resourceLinks.documentation}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-smooth"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href={resourceLinks.researchPapers}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-smooth"
                >
                  Research Paper
                </a>
              </li>
              <li>
                <a
                  href={resourceLinks.postman}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-smooth"
                >
                  Gemini API
                </a>
              </li>
              <li>
                <a
                  href={resourceLinks.fastapi}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-smooth"
                >
                  NewsAPI
                </a>
              </li>
            </ul>
          </div>

          {/* Social & Contact */}
          <div>
            <h3 className="font-semibold mb-4">Connect with Me</h3>
            <div className="flex gap-4">
              {/* LinkedIn */}
              <a
                href={socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-smooth"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>

              {/* GitHub */}
              <a
                href={socialLinks.github}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-smooth"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>

              {/* Email */}
              <a
                href={socialLinks.email}
                className="p-2 rounded-lg bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-smooth"
                aria-label="Email"
              >
                <Send className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>
            © {currentYear} TruthChain. All rights reserved.
          </p>
          <p className="mt-2 text-xs text-muted-foreground/70">
            Powered by Advanced Research & AI-Driven Insights
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
