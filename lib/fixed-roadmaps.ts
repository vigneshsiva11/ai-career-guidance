type RoadmapStages = {
  beginner: string[];
  intermediate: string[];
  advanced: string[];
};

export type SkillGapItem = { skill: string; gap: number };

export type FixedSkillRoadmap = {
  canonicalRole: string;
  aliases: string[];
  strengthProfile: string;
  careerPersona: string;
  roadmap: RoadmapStages;
  toolsToLearn: string[];
  certifications: string[];
  realWorldProjects: string[];
  portfolioRequirements: string[];
  interviewPreparationTopics: string[];
  jobPlatformsToApply: string[];
  estimatedTimeline: string;
  salaryRange?: string;
  requiredTechnicalSkills?: string[];
  requiredSoftSkills?: string[];
  internshipStrategy?: string[];
  freelancingStrategy?: string[];
  salaryInsight?: string;
  resumeTips: string[];
  jobReadyChecklist?: string[];
  skillGapPreview: SkillGapItem[];
};

export const UNSUPPORTED_SKILL_MESSAGE =
  "This skill roadmap is currently not available. Please choose one of the top industry-demand skills.";

const COMMON_PLATFORMS = ["LinkedIn", "Indeed", "Naukri", "Wellfound", "Internshala"];
const COMMON_RESUME_TIPS = [
  "Use measurable impact bullets for every project and internship.",
  "Tailor resume keywords to the role description.",
  "Highlight tools, certifications, and portfolio links in the top section.",
];

const COMMON_SOFT_SKILLS = [
  "Communication and stakeholder updates",
  "Time management and weekly execution planning",
  "Problem-solving and structured thinking",
  "Collaboration in cross-functional teams",
  "Documentation and presentation clarity",
  "Feedback handling and iteration mindset",
];

const FIXED_ROADMAPS: FixedSkillRoadmap[] = [
  {
    canonicalRole: "Frontend Developer",
    aliases: ["frontend developer", "frontend", "front end developer", "ui developer"],
    strengthProfile: "You are suited for building user-focused, high-performance web interfaces.",
    careerPersona: "Interface-Focused Builder",
    roadmap: {
      beginner: ["Learn HTML, CSS, JavaScript fundamentals", "Build 3 responsive pages"],
      intermediate: ["Master React + TypeScript", "Build dashboard and auth UI"],
      advanced: ["Optimize performance and testing", "Contribute to production frontend systems"],
    },
    toolsToLearn: ["React", "TypeScript", "Next.js", "Tailwind CSS", "Jest"],
    certifications: ["Meta Front-End Developer", "freeCodeCamp Front End Libraries"],
    realWorldProjects: ["SaaS admin dashboard", "Real-time analytics UI"],
    portfolioRequirements: ["3 production-quality projects", "Live deploy links"],
    interviewPreparationTopics: ["JavaScript closures", "React rendering lifecycle"],
    jobPlatformsToApply: COMMON_PLATFORMS,
    estimatedTimeline: "6-10 months",
    salaryRange: "USD 60k-140k",
    resumeTips: COMMON_RESUME_TIPS,
    skillGapPreview: [{ skill: "JavaScript Depth", gap: 55 }, { skill: "Component Architecture", gap: 60 }, { skill: "Testing", gap: 62 }, { skill: "Performance", gap: 58 }],
  },
  {
    canonicalRole: "Backend Developer",
    aliases: ["backend developer", "backend", "back end developer", "api developer"],
    strengthProfile: "You are aligned with scalable systems, APIs, and data-focused engineering.",
    careerPersona: "Systems Reliability Builder",
    roadmap: {
      beginner: ["Learn one backend language and core data structures", "Build secure CRUD APIs"],
      intermediate: ["Work with relational and NoSQL databases", "Add caching and async jobs"],
      advanced: ["Design scalable services", "Own production deployment and incident response"],
    },
    toolsToLearn: ["Node.js", "Express", "PostgreSQL", "MongoDB", "Redis"],
    certifications: ["AWS Developer Associate", "MongoDB Developer Path"],
    realWorldProjects: ["Booking API with RBAC", "Payment service with webhooks"],
    portfolioRequirements: ["API documentation", "Architecture diagrams"],
    interviewPreparationTopics: ["Database indexing", "Distributed system basics"],
    jobPlatformsToApply: COMMON_PLATFORMS,
    estimatedTimeline: "7-12 months",
    salaryRange: "USD 70k-150k",
    resumeTips: COMMON_RESUME_TIPS,
    skillGapPreview: [{ skill: "Database Design", gap: 58 }, { skill: "Scalability", gap: 66 }, { skill: "Security", gap: 60 }, { skill: "Observability", gap: 63 }],
  },
  {
    canonicalRole: "Full Stack Developer",
    aliases: ["full stack developer", "fullstack developer", "full stack", "web developer"],
    strengthProfile: "You can own end-to-end product delivery across frontend and backend layers.",
    careerPersona: "Product-Oriented Generalist",
    roadmap: {
      beginner: ["Build frontend and backend fundamentals", "Develop full-stack CRUD apps"],
      intermediate: ["Implement auth, uploads, and payments", "Add testing and deployment pipelines"],
      advanced: ["Design scalable architecture", "Lead feature delivery from design to deployment"],
    },
    toolsToLearn: ["React", "Next.js", "Node.js", "PostgreSQL", "Docker"],
    certifications: ["Meta Full Stack Certificate", "AWS Cloud Practitioner"],
    realWorldProjects: ["Subscription SaaS", "Marketplace platform"],
    portfolioRequirements: ["3 deployed full-stack apps", "Clear architecture docs"],
    interviewPreparationTopics: ["System design tradeoffs", "API versioning"],
    jobPlatformsToApply: COMMON_PLATFORMS,
    estimatedTimeline: "8-14 months",
    salaryRange: "USD 75k-160k",
    resumeTips: COMMON_RESUME_TIPS,
    skillGapPreview: [{ skill: "Frontend Depth", gap: 56 }, { skill: "Backend Robustness", gap: 60 }, { skill: "Deployment", gap: 62 }, { skill: "System Design", gap: 64 }],
  },
  {
    canonicalRole: "UI/UX Designer",
    aliases: [
      "ui ux designer",
      "ui/ux designer",
      "ux designer",
      "ui designer",
      "designer",
      "product designer",
      "product design",
      "graphic design",
      "figma",
      "adobe xd",
      "ui",
      "ux",
    ],
    strengthProfile: "You are strong in user empathy, interface clarity, and design communication.",
    careerPersona: "Human-Centered Designer",
    roadmap: {
      beginner: [
        "Learn design fundamentals: typography, color theory, and layout principles",
        "Learn Figma basics, wireframing, and UX fundamentals",
        "Create 3 small UI projects",
      ],
      intermediate: [
        "Use advanced Figma workflows and interactive prototyping",
        "Run user research and usability testing sessions",
        "Build design systems and write case studies",
      ],
      advanced: [
        "Apply interaction design, micro animations, and accessibility standards",
        "Complete real client project or internship/freelance engagement",
        "Build product thinking and interview-ready portfolio walkthroughs",
      ],
    },
    toolsToLearn: ["Figma", "Canva", "Adobe XD", "Miro", "Notion"],
    certifications: ["Google UX Design Certificate", "NN/g UX Certification"],
    realWorldProjects: [
      "Landing page redesign",
      "Mobile app wireframe",
      "Simple dashboard UI",
      "Complete SaaS redesign",
      "Mobile app UI system",
      "Portfolio case study",
    ],
    portfolioRequirements: [
      "3-5 strong case studies",
      "Clear problem statement for each project",
      "Research process explanation",
      "Before/after comparison",
    ],
    interviewPreparationTopics: [
      "Design thinking process",
      "UX case walkthrough",
      "Tool proficiency discussion",
      "Live design challenge",
    ],
    jobPlatformsToApply: COMMON_PLATFORMS,
    estimatedTimeline: "6-12 months",
    salaryRange: "USD 55k-135k",
    resumeTips: COMMON_RESUME_TIPS,
    jobReadyChecklist: [
      "Strong portfolio with case studies",
      "Resume tailored for design roles",
      "LinkedIn profile optimized with portfolio links",
      "Applications submitted on LinkedIn, Wellfound, Internshala, and Indeed",
    ],
    skillGapPreview: [{ skill: "UX Research", gap: 55 }, { skill: "Visual Systems", gap: 52 }, { skill: "Case Study Depth", gap: 60 }, { skill: "Design Communication", gap: 57 }],
  },
  {
    canonicalRole: "Data Scientist",
    aliases: ["data scientist", "data science"],
    strengthProfile: "You are suited for extracting insight from data and communicating business impact.",
    careerPersona: "Insight-Driven Analyst",
    roadmap: {
      beginner: ["Learn Python, statistics, and SQL", "Build exploratory analysis projects"],
      intermediate: ["Use ML for regression and classification", "Build end-to-end dashboard projects"],
      advanced: ["Handle large-scale pipelines and monitoring", "Deliver business-ready recommendations"],
    },
    toolsToLearn: ["Python", "Pandas", "SQL", "scikit-learn", "Tableau"],
    certifications: ["IBM Data Science Professional Certificate", "Google Advanced Data Analytics"],
    realWorldProjects: ["Customer churn prediction", "Sales forecasting pipeline"],
    portfolioRequirements: ["Business problem framing", "Clean EDA + modeling notebooks"],
    interviewPreparationTopics: ["Bias-variance", "SQL case studies"],
    jobPlatformsToApply: COMMON_PLATFORMS,
    estimatedTimeline: "8-14 months",
    salaryRange: "USD 80k-170k",
    resumeTips: COMMON_RESUME_TIPS,
    skillGapPreview: [{ skill: "Statistics", gap: 58 }, { skill: "Feature Engineering", gap: 61 }, { skill: "Model Evaluation", gap: 59 }, { skill: "Business Communication", gap: 55 }],
  },
  {
    canonicalRole: "Machine Learning Engineer",
    aliases: ["machine learning engineer", "ml engineer", "machine learning"],
    strengthProfile: "You align with production ML systems and model lifecycle engineering.",
    careerPersona: "Applied ML Engineer",
    roadmap: {
      beginner: ["Build strong Python, math, and ML fundamentals", "Train baseline models on datasets"],
      intermediate: ["Learn MLOps and deployment", "Build model APIs with monitoring"],
      advanced: ["Optimize model serving at scale", "Design robust ML platforms"],
    },
    toolsToLearn: ["PyTorch", "TensorFlow", "MLflow", "FastAPI", "Docker"],
    certifications: ["TensorFlow Developer Certificate", "AWS ML Specialty"],
    realWorldProjects: ["Recommendation engine", "Fraud detection model service"],
    portfolioRequirements: ["Training and serving code", "Model metrics and tradeoffs"],
    interviewPreparationTopics: ["Loss functions", "System design for ML"],
    jobPlatformsToApply: COMMON_PLATFORMS,
    estimatedTimeline: "10-16 months",
    salaryRange: "USD 95k-190k",
    resumeTips: COMMON_RESUME_TIPS,
    skillGapPreview: [{ skill: "Math Foundations", gap: 62 }, { skill: "Model Serving", gap: 66 }, { skill: "MLOps", gap: 68 }, { skill: "Experimentation", gap: 57 }],
  },
  {
    canonicalRole: "AI Engineer",
    aliases: ["ai engineer", "artificial intelligence engineer", "genai engineer", "llm engineer"],
    strengthProfile: "You are positioned for building intelligent applications with modern AI stacks.",
    careerPersona: "AI Product Engineer",
    roadmap: {
      beginner: ["Learn Python and AI/ML concepts", "Build simple AI assistants"],
      intermediate: ["Implement RAG pipelines and evaluation", "Create secure AI workflows with guardrails"],
      advanced: ["Optimize cost, latency, and quality", "Design domain-specific AI products"],
    },
    toolsToLearn: ["Python", "LangChain", "Vector DB", "FastAPI", "Docker"],
    certifications: ["Google Generative AI", "Azure AI Engineer Associate"],
    realWorldProjects: ["RAG knowledge assistant", "AI support copilot"],
    portfolioRequirements: ["Prompt + retrieval strategy docs", "Evaluation results"],
    interviewPreparationTopics: ["Prompt engineering", "RAG architecture"],
    jobPlatformsToApply: COMMON_PLATFORMS,
    estimatedTimeline: "8-14 months",
    salaryRange: "USD 95k-200k",
    resumeTips: COMMON_RESUME_TIPS,
    skillGapPreview: [{ skill: "Prompt Design", gap: 52 }, { skill: "RAG Quality", gap: 64 }, { skill: "Productionization", gap: 67 }, { skill: "Evaluation", gap: 61 }],
  },
  {
    canonicalRole: "DevOps Engineer",
    aliases: ["devops engineer", "devops", "site reliability engineer", "sre"],
    strengthProfile: "You fit reliability, automation, and delivery-focused engineering roles.",
    careerPersona: "Automation and Reliability Engineer",
    roadmap: {
      beginner: ["Learn Linux, networking, and scripting basics", "Containerize apps with Docker"],
      intermediate: ["Build CI/CD pipelines and IaC templates", "Deploy to cloud with monitoring"],
      advanced: ["Design scalable deployments", "Lead reliability and platform optimization"],
    },
    toolsToLearn: ["Docker", "Kubernetes", "Terraform", "GitHub Actions", "Prometheus"],
    certifications: ["AWS SysOps Administrator", "CKA Kubernetes"],
    realWorldProjects: ["Multi-stage CI/CD pipeline", "K8s deployment platform"],
    portfolioRequirements: ["Pipeline YAML", "Infra diagrams"],
    interviewPreparationTopics: ["Kubernetes internals", "Incident management"],
    jobPlatformsToApply: COMMON_PLATFORMS,
    estimatedTimeline: "8-14 months",
    salaryRange: "USD 85k-175k",
    resumeTips: COMMON_RESUME_TIPS,
    skillGapPreview: [{ skill: "Cloud Operations", gap: 61 }, { skill: "IaC", gap: 64 }, { skill: "Kubernetes", gap: 68 }, { skill: "Observability", gap: 60 }],
  },
  {
    canonicalRole: "Cloud Engineer",
    aliases: ["cloud engineer", "cloud developer", "aws engineer", "azure engineer", "gcp engineer"],
    strengthProfile: "You are aligned to architecting and operating cloud-native systems.",
    careerPersona: "Cloud Infrastructure Specialist",
    roadmap: {
      beginner: ["Learn cloud core services and pricing basics", "Deploy simple apps on cloud platforms"],
      intermediate: ["Implement IAM, networking, and monitoring", "Use infrastructure as code"],
      advanced: ["Design secure production architectures", "Lead cloud migration and modernization"],
    },
    toolsToLearn: ["AWS", "Azure", "GCP", "Terraform", "CloudWatch"],
    certifications: ["AWS Solutions Architect Associate", "Azure Administrator Associate"],
    realWorldProjects: ["Cloud-hosted web app stack", "Serverless event pipeline"],
    portfolioRequirements: ["Architecture diagrams", "IaC repository"],
    interviewPreparationTopics: ["VPC design", "HA and DR strategies"],
    jobPlatformsToApply: COMMON_PLATFORMS,
    estimatedTimeline: "7-12 months",
    salaryRange: "USD 85k-170k",
    resumeTips: COMMON_RESUME_TIPS,
    skillGapPreview: [{ skill: "Networking", gap: 58 }, { skill: "Security", gap: 63 }, { skill: "Architecture", gap: 64 }, { skill: "Cost Optimization", gap: 57 }],
  },
  {
    canonicalRole: "Cybersecurity Analyst",
    aliases: ["cybersecurity analyst", "cyber security analyst", "security analyst", "soc analyst"],
    strengthProfile: "You are suited for threat detection, defense strategy, and secure operations.",
    careerPersona: "Threat Defense Analyst",
    roadmap: {
      beginner: ["Learn networking, OS, and security basics", "Practice incident response workflows"],
      intermediate: ["Use SIEM tools and log analysis", "Perform vulnerability assessment and remediation"],
      advanced: ["Lead threat hunting playbooks", "Implement security governance controls"],
    },
    toolsToLearn: ["Wireshark", "Splunk", "Nmap", "Burp Suite", "Kali Linux"],
    certifications: ["CompTIA Security+", "CEH"],
    realWorldProjects: ["SOC alert triage dashboard", "Incident response simulation"],
    portfolioRequirements: ["Threat analysis reports", "Mitigation case studies"],
    interviewPreparationTopics: ["OWASP Top 10", "Incident response lifecycle"],
    jobPlatformsToApply: COMMON_PLATFORMS,
    estimatedTimeline: "8-14 months",
    salaryRange: "USD 75k-155k",
    resumeTips: COMMON_RESUME_TIPS,
    skillGapPreview: [{ skill: "Threat Detection", gap: 60 }, { skill: "Incident Response", gap: 62 }, { skill: "Vulnerability Mgmt", gap: 58 }, { skill: "Security Governance", gap: 65 }],
  },
  {
    canonicalRole: "Mobile App Developer",
    aliases: ["mobile app developer", "mobile developer", "app developer", "flutter developer", "react native developer"],
    strengthProfile: "You are aligned with creating performant, user-centric mobile experiences.",
    careerPersona: "Mobile Product Builder",
    roadmap: {
      beginner: ["Learn mobile UI fundamentals and app architecture", "Build simple apps with state and navigation"],
      intermediate: ["Integrate APIs, auth, and notifications", "Ship apps to testing channels"],
      advanced: ["Build scalable architecture and analytics", "Prepare for production release cycles"],
    },
    toolsToLearn: ["Flutter", "React Native", "Firebase", "Android Studio", "Xcode"],
    certifications: ["Google Associate Android Developer", "Meta React Native"],
    realWorldProjects: ["Habit tracker app", "E-commerce mobile app"],
    portfolioRequirements: ["App build links", "Architecture notes"],
    interviewPreparationTopics: ["Mobile lifecycle", "State management"],
    jobPlatformsToApply: COMMON_PLATFORMS,
    estimatedTimeline: "7-12 months",
    salaryRange: "USD 70k-150k",
    resumeTips: COMMON_RESUME_TIPS,
    skillGapPreview: [{ skill: "App Architecture", gap: 59 }, { skill: "API Integration", gap: 55 }, { skill: "Performance", gap: 61 }, { skill: "Release Process", gap: 58 }],
  },
  {
    canonicalRole: "Android Developer",
    aliases: ["android developer", "android", "kotlin developer"],
    strengthProfile: "You are suited for native Android engineering and platform optimization.",
    careerPersona: "Native Android Engineer",
    roadmap: {
      beginner: ["Learn Kotlin and Android fundamentals", "Build UI and local data workflows"],
      intermediate: ["Work with APIs and clean architecture", "Add testing and background jobs"],
      advanced: ["Optimize app performance and startup time", "Lead production releases and monitoring"],
    },
    toolsToLearn: ["Kotlin", "Jetpack Compose", "Room", "Retrofit", "Firebase"],
    certifications: ["Google Associate Android Developer"],
    realWorldProjects: ["Finance tracker app", "Offline-first notes app"],
    portfolioRequirements: ["Playable APK links", "Test coverage"],
    interviewPreparationTopics: ["Android lifecycle", "Coroutines"],
    jobPlatformsToApply: COMMON_PLATFORMS,
    estimatedTimeline: "7-12 months",
    salaryRange: "USD 70k-145k",
    resumeTips: COMMON_RESUME_TIPS,
    skillGapPreview: [{ skill: "Kotlin Proficiency", gap: 54 }, { skill: "App Architecture", gap: 61 }, { skill: "Testing", gap: 63 }, { skill: "Performance Tuning", gap: 60 }],
  },
  {
    canonicalRole: "iOS Developer",
    aliases: ["ios developer", "ios", "swift developer", "iphone developer"],
    strengthProfile: "You are aligned to building premium native iOS experiences.",
    careerPersona: "Native iOS Engineer",
    roadmap: {
      beginner: ["Learn Swift and SwiftUI fundamentals", "Build stateful views and networking basics"],
      intermediate: ["Integrate APIs, auth, and notifications", "Implement architecture patterns and tests"],
      advanced: ["Optimize memory and app performance", "Lead release quality and analytics workflows"],
    },
    toolsToLearn: ["Swift", "SwiftUI", "Xcode", "Combine", "Core Data"],
    certifications: ["Apple App Development with Swift"],
    realWorldProjects: ["Task manager app", "Subscription app"],
    portfolioRequirements: ["TestFlight/demo videos", "Architecture notes"],
    interviewPreparationTopics: ["Swift memory management", "Concurrency"],
    jobPlatformsToApply: COMMON_PLATFORMS,
    estimatedTimeline: "7-12 months",
    salaryRange: "USD 75k-155k",
    resumeTips: COMMON_RESUME_TIPS,
    skillGapPreview: [{ skill: "Swift Proficiency", gap: 56 }, { skill: "Architecture", gap: 60 }, { skill: "Testing", gap: 61 }, { skill: "Release Management", gap: 57 }],
  },
  {
    canonicalRole: "Graphic Designer",
    aliases: ["graphic designer", "visual designer", "branding designer"],
    strengthProfile: "You are strong in visual storytelling, brand identity, and creative execution.",
    careerPersona: "Visual Communication Designer",
    roadmap: {
      beginner: ["Learn design principles and composition", "Practice typography, color, and hierarchy"],
      intermediate: ["Develop brand systems and campaign assets", "Work with client briefs and iterations"],
      advanced: ["Build niche expertise and campaign leadership", "Deliver portfolio with measurable outcomes"],
    },
    toolsToLearn: ["Photoshop", "Illustrator", "InDesign", "Figma", "Canva"],
    certifications: ["Adobe Certified Professional"],
    realWorldProjects: ["Brand identity package", "Product packaging design"],
    portfolioRequirements: ["Brand case studies", "Print + digital samples"],
    interviewPreparationTopics: ["Design rationale", "Brand consistency"],
    jobPlatformsToApply: COMMON_PLATFORMS,
    estimatedTimeline: "6-10 months",
    salaryRange: "USD 45k-110k",
    resumeTips: COMMON_RESUME_TIPS,
    skillGapPreview: [{ skill: "Typography", gap: 50 }, { skill: "Brand Systems", gap: 58 }, { skill: "Creative Direction", gap: 62 }, { skill: "Client Communication", gap: 55 }],
  },
  {
    canonicalRole: "Digital Marketing Specialist",
    aliases: ["digital marketing specialist", "digital marketer", "seo specialist", "performance marketer", "marketing specialist"],
    strengthProfile: "You are aligned to growth-focused campaigns, analytics, and conversion strategy.",
    careerPersona: "Growth Marketing Specialist",
    roadmap: {
      beginner: ["Learn SEO, SEM, content, and social basics", "Set up analytics tracking"],
      intermediate: ["Master paid ads and conversion funnels", "Build reporting and optimization loops"],
      advanced: ["Lead multi-channel growth strategy", "Scale campaigns with experimentation"],
    },
    toolsToLearn: ["Google Analytics", "Google Ads", "Meta Ads Manager", "Ahrefs", "HubSpot"],
    certifications: ["Google Ads Certification", "HubSpot Digital Marketing"],
    realWorldProjects: ["SEO audit + content plan", "Paid campaign optimization"],
    portfolioRequirements: ["Campaign KPI snapshots", "Channel strategy breakdown"],
    interviewPreparationTopics: ["Attribution", "Funnel analytics"],
    jobPlatformsToApply: COMMON_PLATFORMS,
    estimatedTimeline: "5-9 months",
    salaryRange: "USD 50k-120k",
    resumeTips: COMMON_RESUME_TIPS,
    skillGapPreview: [{ skill: "SEO Strategy", gap: 56 }, { skill: "Paid Ads", gap: 60 }, { skill: "Analytics", gap: 58 }, { skill: "CRO", gap: 63 }],
  },
  {
    canonicalRole: "Product Manager",
    aliases: ["product manager", "pm", "associate product manager", "apm"],
    strengthProfile: "You are suited for cross-functional leadership and product decision-making.",
    careerPersona: "Product Strategy Leader",
    roadmap: {
      beginner: ["Learn product lifecycle and prioritization", "Practice writing PRDs and user stories"],
      intermediate: ["Run discovery interviews and roadmap planning", "Track metrics and iterate"],
      advanced: ["Lead product strategy and stakeholder alignment", "Drive high-impact launches"],
    },
    toolsToLearn: ["Jira", "Notion", "Figma", "Mixpanel", "SQL"],
    certifications: ["Product School PM Certificate", "Google Project Management"],
    realWorldProjects: ["PRD for feature launch", "Product teardown strategy proposal"],
    portfolioRequirements: ["Case studies on decisions", "Outcome-focused metrics"],
    interviewPreparationTopics: ["Product sense", "Execution tradeoffs"],
    jobPlatformsToApply: COMMON_PLATFORMS,
    estimatedTimeline: "8-14 months",
    salaryRange: "USD 85k-190k",
    resumeTips: COMMON_RESUME_TIPS,
    skillGapPreview: [{ skill: "Product Discovery", gap: 59 }, { skill: "Prioritization", gap: 56 }, { skill: "Stakeholder Management", gap: 62 }, { skill: "Metrics Ownership", gap: 60 }],
  },
  {
    canonicalRole: "Business Analyst",
    aliases: ["business analyst", "ba", "data business analyst"],
    strengthProfile: "You are aligned to translating business needs into data-driven execution.",
    careerPersona: "Business Insight Translator",
    roadmap: {
      beginner: ["Learn requirement documentation and process mapping", "Build SQL and spreadsheet analysis skills"],
      intermediate: ["Perform stakeholder interviews and gap analysis", "Build dashboards and business reports"],
      advanced: ["Lead cross-team requirement planning", "Drive process optimization initiatives"],
    },
    toolsToLearn: ["Excel", "SQL", "Power BI", "Tableau", "Jira"],
    certifications: ["ECBA", "IIBA CBAP (later stage)"],
    realWorldProjects: ["Business process map", "Executive KPI dashboard"],
    portfolioRequirements: ["BRD/FRD samples", "Dashboard screenshots"],
    interviewPreparationTopics: ["Requirement elicitation", "Stakeholder communication"],
    jobPlatformsToApply: COMMON_PLATFORMS,
    estimatedTimeline: "6-11 months",
    salaryRange: "USD 60k-130k",
    resumeTips: COMMON_RESUME_TIPS,
    skillGapPreview: [{ skill: "Requirement Analysis", gap: 54 }, { skill: "Data Reporting", gap: 57 }, { skill: "Stakeholder Handling", gap: 60 }, { skill: "Process Optimization", gap: 62 }],
  },
  {
    canonicalRole: "Software Tester / QA Engineer",
    aliases: ["software tester", "qa engineer", "quality assurance engineer", "tester", "sdet"],
    strengthProfile: "You fit quality-first engineering with strong validation and reliability mindset.",
    careerPersona: "Quality Automation Specialist",
    roadmap: {
      beginner: ["Learn testing fundamentals and bug lifecycle", "Write test cases and perform manual testing"],
      intermediate: ["Automate UI/API tests", "Integrate testing into CI pipelines"],
      advanced: ["Design quality strategy and test architecture", "Own quality metrics and release confidence"],
    },
    toolsToLearn: ["Selenium", "Cypress", "Postman", "JMeter", "TestRail"],
    certifications: ["ISTQB Foundation Level"],
    realWorldProjects: ["Automation suite", "API testing framework"],
    portfolioRequirements: ["Test plans and bug reports", "Automation repositories"],
    interviewPreparationTopics: ["Test design techniques", "Defect triage"],
    jobPlatformsToApply: COMMON_PLATFORMS,
    estimatedTimeline: "6-10 months",
    salaryRange: "USD 55k-125k",
    resumeTips: COMMON_RESUME_TIPS,
    skillGapPreview: [{ skill: "Test Design", gap: 52 }, { skill: "Automation", gap: 61 }, { skill: "API Testing", gap: 57 }, { skill: "Quality Metrics", gap: 60 }],
  },
  {
    canonicalRole: "Blockchain Developer",
    aliases: ["blockchain developer", "web3 developer", "smart contract developer", "solidity developer"],
    strengthProfile: "You are aligned with decentralized systems and secure smart contract engineering.",
    careerPersona: "Web3 Protocol Builder",
    roadmap: {
      beginner: ["Learn blockchain fundamentals and cryptography basics", "Build simple Solidity contracts"],
      intermediate: ["Develop and test dApps with wallets", "Audit gas usage and vulnerabilities"],
      advanced: ["Design protocol mechanics", "Implement security-first contract architecture"],
    },
    toolsToLearn: ["Solidity", "Hardhat", "Ethers.js", "Remix", "Foundry"],
    certifications: ["Certified Blockchain Developer"],
    realWorldProjects: ["ERC-20 token + dashboard", "DAO voting contract"],
    portfolioRequirements: ["Verified contract links", "Security notes"],
    interviewPreparationTopics: ["Smart contract security", "Web3 architecture"],
    jobPlatformsToApply: COMMON_PLATFORMS,
    estimatedTimeline: "8-14 months",
    salaryRange: "USD 80k-180k",
    resumeTips: COMMON_RESUME_TIPS,
    skillGapPreview: [{ skill: "Solidity", gap: 60 }, { skill: "Smart Contract Security", gap: 68 }, { skill: "dApp Integration", gap: 59 }, { skill: "Protocol Design", gap: 66 }],
  },
  {
    canonicalRole: "Game Developer",
    aliases: ["game developer", "game dev", "unity developer", "unreal developer"],
    strengthProfile: "You are suited for interactive systems, gameplay mechanics, and creative engineering.",
    careerPersona: "Interactive Experience Engineer",
    roadmap: {
      beginner: ["Learn programming and game design fundamentals", "Build 2D mini games"],
      intermediate: ["Use engines for 3D gameplay and level design", "Publish playable prototypes"],
      advanced: ["Optimize rendering and performance", "Ship portfolio-ready games"],
    },
    toolsToLearn: ["Unity", "Unreal Engine", "C#", "Blender", "Git LFS"],
    certifications: ["Unity Certified Associate"],
    realWorldProjects: ["2D platformer", "3D action prototype"],
    portfolioRequirements: ["Playable builds/videos", "Game design documents"],
    interviewPreparationTopics: ["Game loops", "Engine architecture"],
    jobPlatformsToApply: COMMON_PLATFORMS,
    estimatedTimeline: "8-14 months",
    salaryRange: "USD 60k-145k",
    resumeTips: COMMON_RESUME_TIPS,
    skillGapPreview: [{ skill: "Engine Proficiency", gap: 58 }, { skill: "Gameplay Systems", gap: 61 }, { skill: "Optimization", gap: 64 }, { skill: "Asset Integration", gap: 55 }],
  },
];

function normalizeRole(input: string) {
  return String(input || "")
    .toLowerCase()
    .replace(/[^\w\s/+.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const KEYWORD_ROLE_MAP: Array<{ role: string; keywords: string[] }> = [
  { role: "UI/UX Designer", keywords: ["designer", "ui", "ux", "ui ux", "product design", "graphic design", "figma", "adobe xd"] },
  { role: "Frontend Developer", keywords: ["frontend", "front end", "react", "html", "css", "javascript", "js"] },
  { role: "Backend Developer", keywords: ["backend", "back end", "node", "express", "api", "server", "mongodb", "postgres"] },
  { role: "Full Stack Developer", keywords: ["full stack", "fullstack", "mern", "mean"] },
  { role: "Data Scientist", keywords: ["data science", "data scientist", "analytics", "pandas", "sql"] },
  { role: "Machine Learning Engineer", keywords: ["machine learning", "ml", "deep learning", "model training"] },
  { role: "AI Engineer", keywords: ["ai engineer", "artificial intelligence", "genai", "llm", "prompt engineering", "rag"] },
  { role: "Cybersecurity Analyst", keywords: ["cyber", "security", "ethical hacking", "soc", "pentest"] },
  { role: "Cloud Engineer", keywords: ["cloud", "aws", "azure", "gcp", "terraform"] },
  { role: "DevOps Engineer", keywords: ["devops", "kubernetes", "ci cd", "sre", "docker"] },
  { role: "Mobile App Developer", keywords: ["mobile app", "app developer", "flutter", "react native"] },
  { role: "Android Developer", keywords: ["android", "kotlin", "jetpack"] },
  { role: "iOS Developer", keywords: ["ios", "swift", "xcode"] },
  { role: "Graphic Designer", keywords: ["branding", "poster design", "illustrator", "photoshop"] },
  { role: "Digital Marketing Specialist", keywords: ["digital marketing", "seo", "sem", "google ads", "performance marketing"] },
  { role: "Product Manager", keywords: ["product manager", "pm", "roadmap planning", "product strategy"] },
  { role: "Business Analyst", keywords: ["business analyst", "ba", "requirement analysis", "brd", "frd"] },
  { role: "Software Tester / QA Engineer", keywords: ["qa", "software tester", "sdet", "testing", "automation testing"] },
  { role: "Blockchain Developer", keywords: ["blockchain", "web3", "solidity", "smart contract"] },
  { role: "Game Developer", keywords: ["game developer", "unity", "unreal", "game dev"] },
];

function unique(items: string[]) {
  return Array.from(new Set(items.map((x) => x.trim()).filter(Boolean)));
}

function ensureMinItems(items: string[], min: number, fillerPrefix: string) {
  const next = [...items];
  let count = 1;
  while (next.length < min) {
    next.push(`${fillerPrefix} ${count}`);
    count += 1;
  }
  return next;
}

function expandStages(role: string, roadmap: RoadmapStages): RoadmapStages {
  const beginner = ensureMinItems(
    unique([
      ...roadmap.beginner,
      `Build a weekly ${role} learning schedule and track progress`,
      "Learn core fundamentals with official documentation and guided tutorials",
      "Practice daily with small focused exercises",
      "Create notes and revision sheets for key concepts",
      "Set up development/design environment and workflow tools",
      "Publish first project iteration with README/case summary",
      "Follow coding/design standards and basic accessibility/usability rules",
      "Learn version control basics and collaborative workflow",
      "Get mentor/peer feedback and iterate quickly",
    ]),
    10,
    "Beginner practice task"
  );

  const intermediate = ensureMinItems(
    unique([
      ...roadmap.intermediate,
      "Build feature-complete projects with real-world constraints",
      "Integrate APIs/services and handle errors edge-to-edge",
      "Write reusable modules/components and improve architecture quality",
      "Use testing/validation workflows for reliability",
      "Improve performance, security, and maintainability",
      "Document decisions, tradeoffs, and technical/design rationale",
      "Contribute to open-source or collaborative team repositories",
      "Run project demos and collect structured user/reviewer feedback",
      "Prepare internship-ready portfolio and resume artifacts",
    ]),
    10,
    "Intermediate implementation task"
  );

  const advanced = ensureMinItems(
    unique([
      ...roadmap.advanced,
      "Build production-grade capstone project with measurable outcomes",
      "Apply advanced optimization and quality standards",
      "Handle monitoring/analytics and continuous improvement loops",
      "Simulate interview scenarios and explain project architecture/process",
      "Tailor resume and portfolio for role-specific applications",
      "Run mock interviews and refine communication delivery",
      "Apply to internships/jobs consistently with weekly targets",
      "Prepare for domain-specific case studies and problem-solving rounds",
      "Track rejections/feedback and adapt strategy quickly",
    ]),
    10,
    "Advanced execution task"
  );

  return { beginner, intermediate, advanced };
}

function enrichRoadmap(input: FixedSkillRoadmap): FixedSkillRoadmap {
  const roadmap = expandStages(input.canonicalRole, input.roadmap);
  const requiredTechnicalSkills = unique([
    ...(input.requiredTechnicalSkills || []),
    ...input.toolsToLearn.slice(0, 8),
    "Fundamentals and core concepts",
    "Project architecture and problem decomposition",
  ]);
  const requiredSoftSkills = unique([
    ...(input.requiredSoftSkills || []),
    ...COMMON_SOFT_SKILLS,
  ]);
  const internshipStrategy = unique([
    ...(input.internshipStrategy || []),
    "Start applying after 3 strong projects/case studies",
    "Target startups for faster ownership and learning",
    "Customize each application with relevant project links",
    "Network with hiring managers and alumni on LinkedIn",
    "Track applications weekly and follow up professionally",
  ]);
  const freelancingStrategy = unique([
    ...(input.freelancingStrategy || []),
    "Create service packages based on your strongest projects",
    "Build profile credibility with detailed portfolio proof",
    "Start with small fixed-scope gigs and collect reviews",
    "Use proposals that clearly define deliverables and timelines",
    "Retain clients via maintenance/support offerings",
  ]);
  const interviewPreparationTopics = ensureMinItems(
    unique([
      ...input.interviewPreparationTopics,
      "Project walkthrough and technical/design tradeoffs",
      "Debugging/problem-solving approach",
      "Behavioral STAR answers",
      "System/process thinking for real use-cases",
      "Role-specific scenario questions",
    ]),
    8,
    "Interview prep topic"
  );
  const resumeTips = ensureMinItems(
    unique([
      ...input.resumeTips,
      "Keep resume one page with high-signal achievements",
      "Put portfolio/GitHub links in header and ensure they work",
      "Add keywords from target job descriptions",
      "Quantify impact for each project and internship bullet",
    ]),
    6,
    "Resume optimization tip"
  );
  const portfolioRequirements = ensureMinItems(
    unique([
      ...input.portfolioRequirements,
      "Include problem statement, approach, and final outcome",
      "Add deployment/demo links and clean documentation",
      "Show before/after improvements and measurable impact",
    ]),
    6,
    "Portfolio requirement"
  );
  const realWorldProjects = ensureMinItems(
    unique([
      ...input.realWorldProjects,
      `${input.canonicalRole} capstone project with production-quality standards`,
      `Collaborative ${input.canonicalRole.toLowerCase()} project in team setting`,
      "Real-world scenario project with user/client feedback loop",
    ]),
    6,
    "Project build"
  );
  const jobReadyChecklist = ensureMinItems(
    unique([
      ...(input.jobReadyChecklist || []),
      "4+ portfolio-ready projects/case studies completed",
      "Resume and LinkedIn profile optimized for target role",
      "Mock interviews completed with feedback incorporated",
      "Consistent weekly applications on multiple platforms",
    ]),
    8,
    "Job readiness checkpoint"
  );

  return {
    ...input,
    roadmap,
    requiredTechnicalSkills,
    requiredSoftSkills,
    internshipStrategy,
    freelancingStrategy,
    salaryInsight: input.salaryInsight || input.salaryRange || "",
    interviewPreparationTopics,
    resumeTips,
    portfolioRequirements,
    realWorldProjects,
    jobReadyChecklist,
  };
}

export function getFixedRoadmapForRole(targetRole: string): FixedSkillRoadmap | null {
  const normalized = normalizeRole(targetRole);
  if (!normalized) return null;

  const mappedRole = KEYWORD_ROLE_MAP.find((entry) =>
    entry.keywords.some((keyword) => normalized.includes(normalizeRole(keyword)))
  )?.role;
  if (mappedRole) {
    const mapped = FIXED_ROADMAPS.find((item) => item.canonicalRole === mappedRole);
    if (mapped) return enrichRoadmap(mapped);
  }

  const exact = FIXED_ROADMAPS.find((item) =>
    item.aliases.some((alias) => normalizeRole(alias) === normalized)
  );
  if (exact) return enrichRoadmap(exact);

  const scored = FIXED_ROADMAPS.map((item) => {
    const aliasScore = item.aliases.reduce((score, alias) => {
      const a = normalizeRole(alias);
      if (a === normalized) return score + 6;
      if (normalized.includes(a)) return score + 4;
      if (a.includes(normalized) && normalized.length >= 4) return score + 2;
      return score;
    }, 0);

    const tokenSet = new Set(normalized.split(" ").filter(Boolean));
    const tokenScore = item.aliases.reduce((score, alias) => {
      const aliasTokens = normalizeRole(alias).split(" ").filter(Boolean);
      const overlap = aliasTokens.filter((token) => tokenSet.has(token)).length;
      return score + overlap;
    }, 0);

    return { item, score: aliasScore + tokenScore };
  })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.score > 0 ? enrichRoadmap(scored[0].item) : null;
}

export function buildUnsupportedRoadmap(targetRole: string) {
  const role = String(targetRole || "").trim() || "Selected Skill";
  return {
    strengthProfile:
      "You have clear intent to build career-ready skills through structured learning.",
    careerPersona: "Focused Growth Learner",
    recommendedCareer: role,
    roadmap: {
      beginner: [UNSUPPORTED_SKILL_MESSAGE],
      intermediate: ["This skill roadmap is not available yet."],
      advanced: ["Choose one of the currently supported top industry-demand skills."],
    },
    estimatedTimeline: "N/A",
    toolsToLearn: [],
    certifications: [],
    realWorldProjects: [],
    portfolioRequirements: [],
    interviewPreparationTopics: [],
    requiredTechnicalSkills: [],
    requiredSoftSkills: [],
    internshipStrategy: [],
    freelancingStrategy: [],
    salaryInsight: "",
    jobPlatformsToApply: [],
    resumeTips: [],
    jobReadyChecklist: [],
    skillGapPreview: [] as SkillGapItem[],
    source: "fixed_catalog_unsupported",
  };
}
