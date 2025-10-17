export interface Verdict {
  id: string;
  title: string;
  url?: string;
  verdict: 'true' | 'mixed' | 'false';
  confidence: number;
  date: string;
  summary: string;
  txHash?: string;
  ipfsCid?: string;
  evidence: Evidence[];
}

export interface Evidence {
  id: string;
  source: string;
  credibility: number;
  content: string;
  supportVerdict: boolean;
}

export const mockVerdicts: Verdict[] = [
  {
    id: '1',
    title: 'Climate Scientists Agree on Human-Caused Warming',
    url: 'https://example.com/climate-article',
    verdict: 'true',
    confidence: 94,
    date: '2025-10-14',
    summary: 'Article accurately represents scientific consensus on climate change with proper citations.',
    txHash: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEaC',
    ipfsCid: 'QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxX',
    evidence: [
      {
        id: 'e1',
        source: 'IPCC 2021 Report',
        credibility: 98,
        content: 'It is unequivocal that human influence has warmed the atmosphere, ocean and land.',
        supportVerdict: true,
      },
      {
        id: 'e2',
        source: 'NASA Climate Science',
        credibility: 97,
        content: '97% of climate scientists agree that climate-warming trends are extremely likely due to human activities.',
        supportVerdict: true,
      },
      {
        id: 'e3',
        source: 'Nature Journal Meta-Analysis',
        credibility: 96,
        content: 'Comprehensive review confirms overwhelming scientific consensus on anthropogenic climate change.',
        supportVerdict: true,
      },
    ],
  },
  {
    id: '2',
    title: 'New Miracle Drug Cures All Diseases',
    url: 'https://example.com/miracle-drug',
    verdict: 'false',
    confidence: 98,
    date: '2025-10-13',
    summary: 'No scientific evidence supports claims. Article uses manipulated data and fake testimonials.',
    txHash: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    ipfsCid: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    evidence: [
      {
        id: 'e4',
        source: 'FDA Official Database',
        credibility: 99,
        content: 'No such drug has been approved or is under clinical trial.',
        supportVerdict: true,
      },
      {
        id: 'e5',
        source: 'Medical Journal Review',
        credibility: 95,
        content: 'Claims are scientifically implausible and contradict established medical knowledge.',
        supportVerdict: true,
      },
      {
        id: 'e6',
        source: 'Snopes Fact-Check',
        credibility: 88,
        content: 'Testimonials traced to stock photos and fictional personas.',
        supportVerdict: true,
      },
    ],
  },
  {
    id: '3',
    title: 'Economic Report Shows Mixed Recovery Signals',
    url: 'https://example.com/economy-report',
    verdict: 'mixed',
    confidence: 72,
    date: '2025-10-12',
    summary: 'Article contains accurate data but cherry-picks statistics and omits contradictory evidence.',
    txHash: '0x1c4d8d7bEF3bB3cb24dbD1F088c3DFEF6c0f1234',
    ipfsCid: 'QmPK1s3pNYLi92xKxrG4j8c3j3hYR4RZbVxTUeFYXV5MXy',
    evidence: [
      {
        id: 'e7',
        source: 'Federal Reserve Report',
        credibility: 97,
        content: 'GDP growth matches article claims, supports positive outlook.',
        supportVerdict: true,
      },
      {
        id: 'e8',
        source: 'Bureau of Labor Statistics',
        credibility: 98,
        content: 'Unemployment data cited is accurate.',
        supportVerdict: true,
      },
      {
        id: 'e9',
        source: 'Economic Policy Institute',
        credibility: 92,
        content: 'Article omits wage stagnation and inflation data that complicate recovery narrative.',
        supportVerdict: false,
      },
    ],
  },
  {
    id: '4',
    title: 'Tech Company Announces Revolutionary AI Breakthrough',
    url: 'https://example.com/ai-breakthrough',
    verdict: 'mixed',
    confidence: 68,
    date: '2025-10-11',
    summary: 'Core technology is real but performance claims are exaggerated and benchmarks are misleading.',
    evidence: [
      {
        id: 'e10',
        source: 'Company Press Release',
        credibility: 75,
        content: 'Official announcement confirms new model architecture.',
        supportVerdict: true,
      },
      {
        id: 'e11',
        source: 'Independent AI Researchers',
        credibility: 93,
        content: 'Benchmark methodology criticized for favorable test selection.',
        supportVerdict: false,
      },
      {
        id: 'e12',
        source: 'ArXiv Preprint Analysis',
        credibility: 89,
        content: 'Technical approach is novel but performance gains are within normal variance.',
        supportVerdict: false,
      },
    ],
  },
  {
    id: '5',
    title: 'Historical Event Reinterpretation Based on New Documents',
    url: 'https://example.com/history-reinterpret',
    verdict: 'true',
    confidence: 86,
    date: '2025-10-10',
    summary: 'Article accurately reports newly declassified documents with proper historical context.',
    evidence: [
      {
        id: 'e13',
        source: 'National Archives',
        credibility: 99,
        content: 'Documents are authentic and properly dated.',
        supportVerdict: true,
      },
      {
        id: 'e14',
        source: 'Academic Historians Review',
        credibility: 94,
        content: 'Interpretations align with scholarly consensus and new evidence.',
        supportVerdict: true,
      },
      {
        id: 'e15',
        source: 'Historical Journal Peer Review',
        credibility: 91,
        content: 'Methodology follows accepted historical research standards.',
        supportVerdict: true,
      },
    ],
  },
];

export const mockSampleAnalysis: Verdict = {
  id: 'sample',
  title: 'Sample Article Analysis',
  verdict: 'mixed',
  confidence: 76,
  date: new Date().toISOString().split('T')[0],
  summary: 'The article contains some accurate information but also includes unsupported claims and potential bias in source selection.',
  txHash: '0x9f2d95C6E4b8F3a7D1c0B5E8A9d4F7c3E6b2A8D5',
  ipfsCid: 'QmRj8f9s3pNYLi92xKxrG4j8c3j3hYR4RZbVxTUeFYXV',
  evidence: [
    {
      id: 'es1',
      source: 'Verified Academic Database',
      credibility: 95,
      content: 'Core factual claims match peer-reviewed research from 2024.',
      supportVerdict: true,
    },
    {
      id: 'es2',
      source: 'Independent Fact-Checkers',
      credibility: 89,
      content: 'Statistical data cited is accurate but presented without full context.',
      supportVerdict: true,
    },
    {
      id: 'es3',
      source: 'Expert Commentary Analysis',
      credibility: 82,
      content: 'Quotes from experts are accurate but selectively chosen to support specific narrative.',
      supportVerdict: false,
    },
  ],
};
