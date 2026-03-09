type RoadmapStages = {
  beginner: string[];
  intermediate: string[];
  advanced: string[];
};

export type SkillGapItem = { skill: string; gap: number };
export type RequiredSkills = {
  core: string[];
  advanced: string[];
  industry: string[];
};
export type LearningTool = {
  name: string;
  description: string;
  youtubePlaylist: string;
};

export type FixedSkillRoadmap = {
  canonicalRole: string;
  aliases: string[];
  strengthProfile: string;
  careerPersona: string;
  roadmap: RoadmapStages;
  requiredSkills?: RequiredSkills;
  tools?: LearningTool[];
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

const TOOL_CATALOG: Record<string, { description: string; youtubePlaylist: string }> = {
  "HTML & CSS": {
    description: "Semantic HTML, forms, responsive layout with Flexbox/Grid",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLWKjhJtqVAbmMuZ3saqRIBimAKIMYkt0E",
  },
  JavaScript: {
    description: "ES6+, DOM, async programming, API integrations",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLillGF-RfqbYE6Ik_EuXA2iZFcE082B3s",
  },
  TypeScript: {
    description: "Static typing for scalable, maintainable projects",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PL4cUxeGkcC9gUgr39Q_yD6v-bSyMwKPUI",
  },
  React: {
    description: "Component architecture, hooks, routing, performance",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLillGF-RfqbY3c2r0htQyVbDJJoBFE6Rb",
  },
  "Next.js": {
    description: "Production React framework for routing and deployment",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PL8p2I9GklV47BCAjiCtuV_liN9IwAl8pM",
  },
  "Tailwind CSS": {
    description: "Utility-first CSS framework for fast UI implementation",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PL5f_mz_zU5eXWYDXHUDOLBE0scnuJofO0",
  },
  "Git & GitHub": {
    description: "Version control workflows and collaboration",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLWKjhJtqVAblJZeQ86Th1fFUq9WQy2hLk",
  },
  Jest: {
    description: "Unit testing fundamentals and test-driven validation",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PL6gx4Cwl9DGBuKf2sfEioAL4my80aQ8Fa",
  },
  "Node.js": {
    description: "Server runtime, async architecture, backend foundations",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLillGF-RfqbYhQsN5WMXy6VsDMKGadrJ-",
  },
  Express: {
    description: "REST APIs, middleware, authentication, routing patterns",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLillGF-RfqbZ2ybcoD2OaabW2P7Ws8CWu",
  },
  PostgreSQL: {
    description: "Relational modeling, queries, indexing and optimization",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLBf0hzazHTGOEStpN5rJXh5M3s6W5g4JY",
  },
  MongoDB: {
    description: "NoSQL schema design, aggregation, indexing strategies",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PL4RCxklHWZ9vM5xM6dA6c4yJ9H8Yh7x9k",
  },
  Redis: {
    description: "Caching, pub/sub, rate limiting, session storage",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLZyvi_9gamL-EE3zQJbU5N5x8iN3r9M5m",
  },
  Docker: {
    description: "Containerization for local/dev/prod environment parity",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLkA60AVN3hh_6cAz8TUGtkYbJSL2bdZ4h",
  },
  Kubernetes: {
    description: "Container orchestration, deployments, scaling, monitoring",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PL2_OBreMn7FoYmfx27iSwocotjiikS5BD",
  },
  Terraform: {
    description: "Infrastructure as Code for repeatable cloud provisioning",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLJQJ7jT6hS2jL6mLCf7hYQfYVJx6nR7s8",
  },
  "GitHub Actions": {
    description: "CI/CD automation for build, test, deploy pipelines",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PL8p2I9GklV44KGfM5mU4T0hJQG84fY6gK",
  },
  Prometheus: {
    description: "Metrics collection, observability and alerting fundamentals",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLy7NrYWoggjziYQIDorlXjTvvwweTYoNC",
  },
  AWS: {
    description: "Core cloud services: compute, storage, networking, IAM",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PL9ooVrP1hQOEaU0teCbLQx2k3hA4J8z8F",
  },
  Azure: {
    description: "Cloud resource management, deployment, monitoring",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLLasX02E8BPA3I7x6FfA6wZLJ4wE9H3fC",
  },
  GCP: {
    description: "Google Cloud architecture and managed services",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLQMsfKRZZviQ8WQf4hFfWHz7A3EMI8yT0",
  },
  "CloudWatch": {
    description: "Cloud logs, metrics, alarms and operational dashboards",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLW8bTPfXNGdAqz2a0u1rYQfA8M7J3mQd2",
  },
  Figma: {
    description: "UI/UX design workflows, components, auto-layout, prototyping",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLXDU_eVOJTx5LSjVfG2WvQ7Qw7kP4WzLh",
  },
  Canva: {
    description: "Rapid visual creation for design communication and assets",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLJQJ7jT6hS2h9Hh4hC1E1mR1n4bN5p2q1",
  },
  "Adobe XD": {
    description: "Wireframing, prototyping, and UX handoff workflows",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLD8AMy73ZVxV9M4lq8W9S8rYg6Yw0sXq8",
  },
  Miro: {
    description: "Research synthesis, user flows, journey mapping and workshops",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PL6Jx2XQ5nQwKQ5SgG2dM1u8HqV7s4f3c9",
  },
  Notion: {
    description: "Documentation, roadmap tracking, and project organization",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLRHpY9sMjlS3vQ9xL0Z1fP2yT8nE5mQ7r",
  },
  Python: {
    description: "Core programming, scripting, and data/AI foundations",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PL-osiE80TeTt2d9bfVyTiXJA-UTHn6WwU",
  },
  Pandas: {
    description: "Data wrangling, cleaning, and exploratory analysis",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PL5-da3qGB5IC4o0uAhCw6nPz1kH4sQ4W8",
  },
  SQL: {
    description: "Querying, joins, aggregations and analytics workflows",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PL08903FB7ACA1C2FB",
  },
  "scikit-learn": {
    description: "Classical machine learning modeling and evaluation",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PL2-dafEMk2A7mu0bSksCGMJEmeddU_H4D",
  },
  Tableau: {
    description: "Interactive dashboards and business analytics reporting",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PL_qizAfcpJ-OdM1YJzL8YQqQ6vFjv3v7D",
  },
  PyTorch: {
    description: "Deep learning training, experimentation and model building",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLqnslRFeH2UrcDBWF5mfPGpqQDSta6VK4",
  },
  TensorFlow: {
    description: "Neural network modeling and production ML workflows",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLQY2H8rRoyvxN7x6YvWfM9N8n3S6m9B5Y",
  },
  MLflow: {
    description: "Experiment tracking and model lifecycle management",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLR6PuN5p8Q9Yqg9U8oJ7M4rX2L2vA0w5Z",
  },
  FastAPI: {
    description: "High-performance API development for ML and backend apps",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PL5gdMNl42qynnRtx5W8g7M3Qf3zS7M2jY",
  },
  LangChain: {
    description: "LLM app orchestration, chains, tools and retrieval",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLrH1HnMlyv9f-jlZFKY1f0Xq7xY1A3mV8",
  },
  "Vector DB": {
    description: "Embedding retrieval and semantic indexing concepts",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PL4RCxklHWZ9tZs8iQhY0R1KzV4E2f8k3N",
  },
  Wireshark: {
    description: "Packet capture and network traffic analysis",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLW8bTPfXNGdD8M6mA6mQm7Y3L7wP2g6N1",
  },
  Splunk: {
    description: "Log analytics, detection rules and SOC workflows",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLxNoJq6k39G-F7xQ2Wj3XzVQ8V4kYf7Xf",
  },
  Nmap: {
    description: "Network scanning and vulnerability reconnaissance",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLW8bTPfXNGdAn4G4cYfW7u0M3z5jG6p9Q",
  },
  "Burp Suite": {
    description: "Web security testing and proxy-based analysis",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLuyTk2_mYISL6f0pNw7uF0S8D6a2M3k1H",
  },
  "Kali Linux": {
    description: "Practical ethical hacking and penetration testing toolkit",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLW8bTPfXNGdBLWj3Tz5L5f9Q2m7x2k1N0",
  },
  Flutter: {
    description: "Cross-platform mobile development and state management",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLjxrf2q8roU1xK9uT4nD9bD90A7w6X2Xq",
  },
  "React Native": {
    description: "Native mobile UI with React ecosystem and APIs",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PL6QREj8te1P6wX9m5K5Y9L6p7Q3x5mV2X",
  },
  Firebase: {
    description: "Authentication, cloud database, storage and notifications",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLl-K7zZEsYLmOF_07IayrTntevxtbUxDL",
  },
  "Android Studio": {
    description: "Android app development environment and debugging",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLQ9nYwR5Q4f0nL8Q9x2S3a8mW7Q5J2X8k",
  },
  Xcode: {
    description: "iOS development workflow, simulators and debugging",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLQ9nYwR5Q4f0xK2N4v6P7w8L9t3M1B4qD",
  },
  Kotlin: {
    description: "Modern Android language fundamentals and architecture",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLQkwcJG4YTCSYVnM0hE8mN9kP3Y8jL5gE",
  },
  "Jetpack Compose": {
    description: "Declarative Android UI and state-driven layouts",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLQkwcJG4YTCTq1raTb5xXz2JY3x0E9k7F",
  },
  Room: {
    description: "Local persistence layer and offline Android storage",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLQkwcJG4YTCQ6emtoqSZS2FVwZR9FT3BV",
  },
  Retrofit: {
    description: "Networking and API clients for Android apps",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLQkwcJG4YTCQJ4r7d8M5Yh6Uq3x9K2h1X",
  },
  Swift: {
    description: "iOS programming fundamentals and best practices",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLMRqhzcHGw1aLoz4pM_Mg2TewmJcMg9ua",
  },
  SwiftUI: {
    description: "Declarative iOS UI development and app architecture",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLwvDm4VfkdphqETTBf-DdjCoAvhai1QpO",
  },
  Combine: {
    description: "Reactive data flow and asynchronous stream handling",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLQ9nYwR5Q4f0gN8xS4T2n6B1c8Y3m5L7h",
  },
  "Core Data": {
    description: "Persistence and local data modeling for iOS apps",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLQ9nYwR5Q4f2k4M8n7Q2s9X6z3W5e1aB0",
  },
  Photoshop: {
    description: "Image editing, compositing and visual asset creation",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLD8AMy73ZVxVJfG3nJ0WqJmU6D2mV8k9R",
  },
  Illustrator: {
    description: "Vector graphics, icons, typography and branding",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLD8AMy73ZVxX3g9Q8M7zL5qN2B4sV6h1T",
  },
  InDesign: {
    description: "Layout systems for publishing and document design",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLD8AMy73ZVxW6pN4g3M8Y2vQ5tL9nX1aF",
  },
  "Google Analytics": {
    description: "Behavior analytics, events, funnels and attribution",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLhLJ4Qf8l2n5S8z2Y7P3W1x6N4kM9qB0R",
  },
  "Google Ads": {
    description: "Paid campaign setup, targeting and optimization",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLhLJ4Qf8l2n5uX3zK8N4D7mQ2cV6pB1YH",
  },
  "Meta Ads Manager": {
    description: "Social campaign execution and performance scaling",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLhLJ4Qf8l2n6P3sN9B4kY2fQ8mV1xW7ZC",
  },
  Ahrefs: {
    description: "SEO research, keyword strategy and backlink analysis",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLhLJ4Qf8l2n7Z5xQ4M8nV2kY1cB6pD3R9",
  },
  HubSpot: {
    description: "CRM workflows, lead funnels and automation",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLhLJ4Qf8l2n8N2yM7Q4kV1xC3pB6dR9Z5",
  },
  Jira: {
    description: "Agile sprint planning, tickets and release management",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLQ9nYwR5Q4f3K7mV2N8xS1cD4pB6zR9Y2",
  },
  Mixpanel: {
    description: "Product analytics, retention and conversion tracking",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLQ9nYwR5Q4f4V2mN8xS3kD1pB6zR9Y7C5",
  },
  Excel: {
    description: "Business analysis, formulas, pivots and reporting",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLrRPvpgDmw0k5JgL3sA4D8mY2N7wQ6xP1",
  },
  "Power BI": {
    description: "Data modeling and interactive business dashboards",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PL1N57mwBHtN0Hz6f4o7Bv8sD2mP5xQ9Y3",
  },
  Selenium: {
    description: "Web automation testing framework fundamentals",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PL6flErFppaj3dAq0f7R5W2nY8mQ1xB4vK",
  },
  Cypress: {
    description: "Modern end-to-end testing and QA automation",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PL6flErFppaj0nJ2Y4D8mV1xQ7kR3pB9Z2",
  },
  Postman: {
    description: "API testing, collections, environments and automation",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PL6flErFppaj0M5A7xD2mV8Q1kR4pB9Y3C",
  },
  JMeter: {
    description: "Performance testing and load simulation workflows",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLQq8-9yVHyOZkM6xD2vN8Q1pB4rY7C3T5",
  },
  TestRail: {
    description: "Test case management and QA release workflows",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLQq8-9yVHyOaD2mV7xN5Q1pB4rY8C3T6K",
  },
  Solidity: {
    description: "Smart contract development and EVM fundamentals",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLS5SEs8ZftgVnWH4A0J4v9Sx6F7b2Q3W8",
  },
  Hardhat: {
    description: "Smart contract testing, deployment and tooling",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLS5SEs8ZftgVg7V4K2Y2mN8Q1xB5rD9L3",
  },
  "Ethers.js": {
    description: "Blockchain app integration and contract interaction",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLS5SEs8ZftgX9D2mV7Q1pB4rY8C3T6K5M",
  },
  Remix: {
    description: "In-browser smart contract IDE and debugging",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLS5SEs8ZftgY4N2mV8Q1pB7rD3T6K5C9L",
  },
  Foundry: {
    description: "High-performance Solidity testing and scripting toolkit",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLS5SEs8ZftgZ3D2mV9Q1pB4rY7C6T5K8N",
  },
  Unity: {
    description: "Game mechanics, scenes, assets and deployment",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLPV2KyIb3jR4KLGCCAciWQ5qHudKtYeP7",
  },
  "Unreal Engine": {
    description: "Advanced game development and real-time rendering",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLZlv_N0_O1ga0aV9jVqJgog0VWz1cLL5f",
  },
  "C#": {
    description: "Object-oriented programming for app and game logic",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLdo4fOcmZ0oULFjxrOagaERVAMbmG20Xe",
  },
  Blender: {
    description: "3D modeling, assets and animation workflows",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLjEaoINr3zgFX8ZsChQVQsuDSjEqdWMAD",
  },
  "Git LFS": {
    description: "Version control for large files and game assets",
    youtubePlaylist: "https://www.youtube.com/playlist?list=PLQ9nYwR5Q4f5D2mV8xN1pB4rY7C6T3K9L",
  },
};

const ROLE_TOOL_STACKS: Record<string, string[]> = {
  "Frontend Developer": ["HTML & CSS", "JavaScript", "TypeScript", "React", "Next.js", "Tailwind CSS", "Git & GitHub", "Jest", "Node.js", "Postman"],
  "Backend Developer": ["Node.js", "Express", "PostgreSQL", "MongoDB", "Redis", "Docker", "Git & GitHub", "Postman", "Jest", "AWS"],
  "Full Stack Developer": ["HTML & CSS", "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Express", "PostgreSQL", "Docker", "Git & GitHub"],
  "UI/UX Designer": ["Figma", "Adobe XD", "Canva", "Miro", "Notion", "Photoshop", "Illustrator", "InDesign", "HTML & CSS", "Git & GitHub"],
  "Data Scientist": ["Python", "Pandas", "SQL", "scikit-learn", "Tableau", "Git & GitHub", "TensorFlow", "PyTorch", "Power BI", "Notion"],
  "Machine Learning Engineer": ["Python", "PyTorch", "TensorFlow", "MLflow", "FastAPI", "Docker", "Kubernetes", "Git & GitHub", "AWS", "SQL"],
  "AI Engineer": ["Python", "LangChain", "Vector DB", "FastAPI", "Docker", "Git & GitHub", "TensorFlow", "PyTorch", "AWS", "SQL"],
  "DevOps Engineer": ["Docker", "Kubernetes", "Terraform", "GitHub Actions", "Prometheus", "AWS", "Azure", "GCP", "Git & GitHub", "Node.js"],
  "Cloud Engineer": ["AWS", "Azure", "GCP", "Terraform", "CloudWatch", "Docker", "Kubernetes", "Git & GitHub", "Python", "Notion"],
  "Cybersecurity Analyst": ["Wireshark", "Splunk", "Nmap", "Burp Suite", "Kali Linux", "Python", "Git & GitHub", "AWS", "Postman", "Notion"],
  "Mobile App Developer": ["Flutter", "React Native", "Firebase", "Android Studio", "Xcode", "Git & GitHub", "JavaScript", "TypeScript", "Docker", "Postman"],
  "Android Developer": ["Kotlin", "Jetpack Compose", "Room", "Retrofit", "Firebase", "Android Studio", "Git & GitHub", "Postman", "Jest", "Docker"],
  "iOS Developer": ["Swift", "SwiftUI", "Xcode", "Combine", "Core Data", "Git & GitHub", "Firebase", "Postman", "Docker", "Jest"],
  "Graphic Designer": ["Photoshop", "Illustrator", "InDesign", "Figma", "Canva", "Notion", "Miro", "Git & GitHub", "HTML & CSS", "Adobe XD"],
  "Digital Marketing Specialist": ["Google Analytics", "Google Ads", "Meta Ads Manager", "Ahrefs", "HubSpot", "Notion", "Canva", "Tableau", "Excel", "SQL"],
  "Product Manager": ["Jira", "Notion", "Figma", "Mixpanel", "SQL", "Excel", "Power BI", "Miro", "Git & GitHub", "Google Analytics"],
  "Business Analyst": ["Excel", "SQL", "Power BI", "Tableau", "Jira", "Notion", "Google Analytics", "Python", "Git & GitHub", "Postman"],
  "Software Tester / QA Engineer": ["Selenium", "Cypress", "Postman", "JMeter", "TestRail", "Jest", "Git & GitHub", "Docker", "JavaScript", "Python"],
  "Blockchain Developer": ["Solidity", "Hardhat", "Ethers.js", "Remix", "Foundry", "Git & GitHub", "JavaScript", "TypeScript", "Node.js", "Docker"],
  "Game Developer": ["Unity", "Unreal Engine", "C#", "Blender", "Git LFS", "Git & GitHub", "Docker", "Jira", "Notion", "Postman"],
};

const ROLE_REQUIRED_SKILLS: Record<string, RequiredSkills> = {
  "Frontend Developer": {
    core: ["HTML5 semantic structure and forms", "CSS3 Flexbox/Grid responsive design", "JavaScript ES6+ and DOM", "TypeScript fundamentals", "React hooks and component architecture"],
    advanced: ["State management patterns", "Performance optimization and code splitting", "Testing with Jest/RTL", "Accessibility standards (WCAG)", "SEO basics and metadata"],
    industry: ["Git/GitHub workflows", "API integration and auth flows", "CI/CD deployment concepts", "Code review and collaboration", "Project architecture planning"],
  },
  "Backend Developer": {
    core: ["Node.js runtime fundamentals", "Express middleware and routing", "REST API design", "SQL/NoSQL data modeling", "Authentication and authorization"],
    advanced: ["Caching and queueing patterns", "Database indexing and optimization", "Observability and logging", "Security hardening", "Scalable service architecture"],
    industry: ["Dockerized environments", "Cloud deployment patterns", "CI/CD backend pipelines", "Incident handling basics", "API documentation standards"],
  },
};

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
  const roleToolNames = ROLE_TOOL_STACKS[input.canonicalRole] || [];
  const toolsToLearn = unique([
    ...roleToolNames,
    ...input.toolsToLearn,
  ]);
  const tools = toolsToLearn.map((toolName) => {
    const found = TOOL_CATALOG[toolName];
    return {
      name: toolName,
      description: found?.description || `${toolName} practical learning path`,
      youtubePlaylist:
        found?.youtubePlaylist ||
        `https://www.youtube.com/results?search_query=${encodeURIComponent(
          `${toolName} playlist`
        )}`,
    };
  });

  const roleRequired = ROLE_REQUIRED_SKILLS[input.canonicalRole] || {
    core: [
      `${input.canonicalRole} fundamentals and core concepts`,
      "Problem decomposition and execution planning",
      "Hands-on implementation through practical tasks",
      "Tooling setup and workflow discipline",
      "Version control and team collaboration basics",
    ],
    advanced: [
      "Architecture quality and modular implementation",
      "Performance optimization and reliability improvements",
      "Testing/validation workflows for stable delivery",
      "Security and maintainability best practices",
      "Scaling strategies for real-world usage",
    ],
    industry: [
      "Portfolio/case-study documentation standards",
      "Interview communication and project walkthroughs",
      "Job-role specific keyword and resume alignment",
      "Internship/freelance execution readiness",
      "Weekly application tracking and feedback iteration",
    ],
  };

  const requiredSkills: RequiredSkills = {
    core: ensureMinItems(unique([...(input.requiredSkills?.core || []), ...roleRequired.core]), 5, "Core skill"),
    advanced: ensureMinItems(
      unique([...(input.requiredSkills?.advanced || []), ...roleRequired.advanced]),
      5,
      "Advanced skill"
    ),
    industry: ensureMinItems(
      unique([...(input.requiredSkills?.industry || []), ...roleRequired.industry]),
      5,
      "Industry skill"
    ),
  };

  const requiredTechnicalSkills = unique([
    ...(input.requiredTechnicalSkills || []),
    ...requiredSkills.core,
    ...requiredSkills.advanced,
    ...requiredSkills.industry,
    ...toolsToLearn.slice(0, 5),
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
    requiredSkills,
    tools,
    toolsToLearn,
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
    requiredSkills: { core: [], advanced: [], industry: [] },
    tools: [],
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
