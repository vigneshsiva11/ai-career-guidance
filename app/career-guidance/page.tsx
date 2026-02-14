"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Briefcase,
  GraduationCap,
  Target,
  Users,
  TrendingUp,
  MapPin,
  ArrowRight,
  Lightbulb,
  Star,
  Globe2,
  Building2,
  Landmark,
  Wallet,
  Layers,
  RefreshCw,
  NotebookPen,
} from "lucide-react";

export default function CareerGuidancePage() {
  const [selectedInterest, setSelectedInterest] = useState<string>("");
  const [selectedEducation, setSelectedEducation] = useState<string>("");
  const pathname = usePathname();

  const interests = [
    {
      id: "technology",
      name: "Technology & IT",
      icon: "💻",
      color: "bg-blue-100 text-blue-800",
    },
    {
      id: "healthcare",
      name: "Healthcare",
      icon: "🏥",
      color: "bg-green-100 text-green-800",
    },
    {
      id: "business",
      name: "Business & Finance",
      icon: "💼",
      color: "bg-purple-100 text-purple-800",
    },
    {
      id: "arts",
      name: "Arts & Design",
      icon: "🎨",
      color: "bg-pink-100 text-pink-800",
    },
    {
      id: "engineering",
      name: "Engineering",
      icon: "⚙️",
      color: "bg-orange-100 text-orange-800",
    },
    {
      id: "education",
      name: "Education",
      icon: "📚",
      color: "bg-indigo-100 text-indigo-800",
    },
  ];

  const educationLevels = [
    {
      id: "high-school",
      name: "High School",
      color: "bg-green-100 text-green-800",
    },
    { id: "diploma", name: "Diploma", color: "bg-blue-100 text-blue-800" },
    {
      id: "bachelor",
      name: "Bachelor's Degree",
      color: "bg-purple-100 text-purple-800",
    },
    {
      id: "master",
      name: "Master's Degree",
      color: "bg-orange-100 text-orange-800",
    },
    { id: "phd", name: "PhD", color: "bg-red-100 text-red-800" },
  ];

  const careerServices = [
    {
      id: "assessment",
      name: "Career Assessment",
      description:
        "Take our comprehensive career assessment to discover your strengths and interests",
      icon: Target,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      id: "counseling",
      name: "Career Counseling",
      description: "One-on-one sessions with experienced career counselors",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      id: "pathways",
      name: "Career Pathways",
      description:
        "Explore different career paths and educational requirements",
      icon: MapPin,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      id: "market",
      name: "Job Market Analysis",
      description:
        "Stay updated with current job market trends and opportunities",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const trendingCareers = [
    {
      name: "Data Scientist",
      growth: "+31%",
      salary: "$120,000",
      education: "Bachelor's+",
      icon: "📊",
    },
    {
      name: "AI Engineer",
      growth: "+28%",
      salary: "$130,000",
      education: "Bachelor's+",
      icon: "🤖",
    },
    {
      name: "Cybersecurity Analyst",
      growth: "+25%",
      salary: "$95,000",
      education: "Bachelor's+",
      icon: "🔒",
    },
    {
      name: "Digital Marketing",
      growth: "+22%",
      salary: "$65,000",
      education: "High School+",
      icon: "📱",
    },
  ];

  // (Scholarships removed on this page; internships only)

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/"
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Classless</h1>
            </Link>
            <nav className="flex space-x-4">
              <Link href="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
              <Link href="/ask">
                <Button
                  variant={pathname === "/ask" ? "default" : "outline"}
                  className={pathname === "/ask" ? "bg-black text-white" : ""}
                >
                  Ask Question
                </Button>
              </Link>
              <Link href="/quiz">
                <Button variant="outline">Quiz</Button>
              </Link>
              <Link href="/career-guidance">
                <Button>Career Guidance</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Career Guidance & Planning
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover your potential, explore career paths, and plan your future
            with expert guidance
          </p>
        </div>

        {/* Interest Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              <span>What Interests You?</span>
            </CardTitle>
            <CardDescription>
              Select areas that spark your curiosity and passion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {interests.map((interest) => (
                <button
                  key={interest.id}
                  onClick={() => setSelectedInterest(interest.id)}
                  className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                    selectedInterest === interest.id
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-3xl mb-2">{interest.icon}</div>
                  <div className="text-sm font-medium text-gray-900">
                    {interest.name}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Career Roadmaps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Layers className="h-5 w-5 text-indigo-600" />
              <span>Career Roadmaps</span>
            </CardTitle>
            <CardDescription>
              Step-by-step: Education → Skills → Internships → First Job →
              Growth
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Software Engineer",
                  steps: [
                    "Education: B.Tech/BE/BS (CS/IT) or Bootcamp",
                    "Skills: DSA, Web/Backend, Git, Cloud basics",
                    "Internships: Open source, startups, hackathons",
                    "First Job: SDE, Full-stack, QA automation",
                    "Growth: Senior Engineer → Tech Lead → Architect",
                  ],
                },
                {
                  title: "Doctor",
                  steps: [
                    "Education: MBBS → Internship",
                    "Skills: Clinical skills, patient care, research",
                    "Residency: Choose specialization (MD/MS)",
                    "First Job: Resident/Junior Doctor",
                    "Growth: Specialist → Consultant → Medical Director",
                  ],
                },
                {
                  title: "Architect",
                  steps: [
                    "Education: B.Arch + Council registration",
                    "Skills: AutoCAD, Revit, BIM, design thinking",
                    "Internships: Design firms, site exposure",
                    "First Job: Junior Architect",
                    "Growth: Senior Architect → Project Lead → Principal",
                  ],
                },
              ].map((r, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{r.title}</h4>
                    <Badge variant="secondary">5 stages</Badge>
                  </div>
                  <ol className="space-y-2 text-sm text-gray-700 list-decimal pl-4">
                    {r.steps.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Internship Opportunities */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Briefcase className="h-5 w-5 text-emerald-600" />
              <span>Internship Opportunities</span>
            </CardTitle>
            <CardDescription>
              Popular internship portals & current openings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">
                Internship Portals & Openings
              </h4>
              <ul className="space-y-2 text-sm text-blue-700">
                {[
                  { name: "Internshala", url: "https://internshala.com" },
                  {
                    name: "LinkedIn Jobs",
                    url: "https://www.linkedin.com/jobs/",
                  },
                  {
                    name: "Naukri Internships",
                    url: "https://www.naukri.com/internship-jobs",
                  },
                  { name: "UN Internships", url: "https://careers.un.org/" },
                  {
                    name: "Google Careers (Student)",
                    url: "https://careers.google.com/students/",
                  },
                ].map((p, i) => (
                  <li key={i}>
                    <Link
                      href={p.url}
                      target="_blank"
                      className="hover:underline"
                    >
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Industry Insights */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span>Industry Insights</span>
            </CardTitle>
            <CardDescription>
              Monthly trends and 5–10 year outlook
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Technology",
                  points: [
                    "AI/ML hiring up, data roles expanding",
                    "Cybersecurity demand strong",
                    "Cloud-native & DevOps core",
                  ],
                  future: "High demand for AI, data, security",
                },
                {
                  title: "Healthcare",
                  points: [
                    "Telemedicine adoption steady",
                    "Shortage of nurses/specialists",
                    "Health informatics growing",
                  ],
                  future: "Clinicians + digital health rise",
                },
                {
                  title: "Manufacturing",
                  points: [
                    "Automation/Robotics investment",
                    "EV supply chain ramping",
                    "Quality & safety roles stable",
                  ],
                  future: "Robotics, EV, mechatronics",
                },
              ].map((x, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{x.title}</h4>
                    <Badge variant="secondary">Monthly</Badge>
                  </div>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {x.points.map((p, idx) => (
                      <li key={idx}>• {p}</li>
                    ))}
                  </ul>
                  <div className="text-xs text-gray-500 mt-3">
                    Outlook: {x.future}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Education Level Selection */}
        {selectedInterest && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GraduationCap className="h-5 w-5 text-blue-600" />
                <span>Your Education Level</span>
              </CardTitle>
              <CardDescription>
                Select your current or target education level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {educationLevels.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setSelectedEducation(level.id)}
                    className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                      selectedEducation === level.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {level.name}
                      </div>
                      <Badge className={level.color}>{level.id}</Badge>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Career Services */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {careerServices.map((service) => (
            <Card
              key={service.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
            >
              <CardHeader>
                <div className={`p-3 rounded-lg ${service.bgColor} w-fit mb-3`}>
                  <service.icon className={`h-6 w-6 ${service.color}`} />
                </div>
                <CardTitle className="text-lg">{service.name}</CardTitle>
                <CardDescription>{service.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Get Started
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trending Careers */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span>Trending Careers in 2024</span>
            </CardTitle>
            <CardDescription>
              High-growth career opportunities with promising futures
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingCareers.map((career, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="text-2xl">{career.icon}</div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {career.name}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {career.growth}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Salary:</span>
                      <span className="font-medium text-green-600">
                        {career.salary}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Education:</span>
                      <span className="font-medium">{career.education}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Skill-Building Resources */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <NotebookPen className="h-5 w-5 text-blue-600" />
              <span>Skill-Building Resources</span>
            </CardTitle>
            <CardDescription>Free/paid platforms by domain</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Tech",
                  links: [
                    {
                      n: "YouTube: freeCodeCamp",
                      u: "https://www.youtube.com/c/Freecodecamp",
                    },
                    { n: "Coursera", u: "https://www.coursera.org" },
                    { n: "NPTEL/SWAYAM", u: "https://swayam.gov.in" },
                  ],
                },
                {
                  title: "Healthcare",
                  links: [
                    { n: "WHO Learning", u: "https://openwho.org" },
                    {
                      n: "Coursera: Health",
                      u: "https://www.coursera.org/browse/health",
                    },
                  ],
                },
                {
                  title: "Arts & Design",
                  links: [
                    {
                      n: "YouTube: The Futur",
                      u: "https://www.youtube.com/@thefuturishere",
                    },
                    { n: "Behance", u: "https://www.behance.net" },
                  ],
                },
                {
                  title: "Business",
                  links: [
                    { n: "Harvard Online", u: "https://online.hbs.edu" },
                    {
                      n: "edX Business",
                      u: "https://www.edx.org/learn/business",
                    },
                  ],
                },
                {
                  title: "Education",
                  links: [
                    { n: "Diksha", u: "https://diksha.gov.in" },
                    {
                      n: "Coursera: Teaching",
                      u: "https://www.coursera.org/browse/teaching-and-learning",
                    },
                  ],
                },
                {
                  title: "Engineering",
                  links: [
                    { n: "MIT OCW", u: "https://ocw.mit.edu" },
                    {
                      n: "YouTube: Learn Engineering",
                      u: "https://www.youtube.com/@LearnEngineering",
                    },
                  ],
                },
              ].map((c, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {c.title}
                  </h4>
                  <ul className="space-y-2 text-sm">
                    {c.links.map((l, idx) => (
                      <li key={idx}>
                        <Link
                          href={l.u}
                          target="_blank"
                          className="text-blue-700 hover:underline"
                        >
                          {l.n}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Government & Competitive Exams */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Landmark className="h-5 w-5 text-rose-600" />
              <span>Government & Competitive Exams</span>
            </CardTitle>
            <CardDescription>
              Dates, eligibility, and preparation resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid lg:grid-cols-3 gap-6">
              {[
                {
                  exam: "UPSC Civil Services",
                  date: "Prelims: May/June",
                  eligibility: "Graduate, Age 21–32",
                  link: "https://upsc.gov.in",
                },
                {
                  exam: "SSC CGL",
                  date: "Tier I: Yearly",
                  eligibility: "Graduate",
                  link: "https://ssc.nic.in",
                },
                {
                  exam: "IBPS PO (Banking)",
                  date: "Prelims: Aug–Oct",
                  eligibility: "Graduate",
                  link: "https://www.ibps.in",
                },
                {
                  exam: "NDA (Defense)",
                  date: "Twice yearly",
                  eligibility: "12th pass",
                  link: "https://upsc.gov.in/examinations/NDA-NAVAL-ACADEMY-EXAMINATION",
                },
              ].map((e, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{e.exam}</h4>
                    <Badge variant="secondary">{e.date}</Badge>
                  </div>
                  <div className="text-sm text-gray-700 mb-3">
                    Eligibility: {e.eligibility}
                  </div>
                  <Link href={e.link} target="_blank">
                    <Button variant="outline" className="w-full">
                      Details
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Career Switching Guides */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 text-orange-600" />
              <span>Career Switching Guides</span>
            </CardTitle>
            <CardDescription>
              How to move from one field to another
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  from: "Teacher",
                  to: "Instructional Designer",
                  steps: [
                    "Build portfolio (lesson → e-learning)",
                    "Learn tools (Articulate/Captivate/LMS)",
                    "Certifications (IDOL, Coursera)",
                    "Apply to edtech/L&D roles",
                  ],
                },
                {
                  from: "Mechanical Engineer",
                  to: "Data Analyst",
                  steps: [
                    "Excel → SQL → Python",
                    "Industry projects (OEE, quality)",
                    "Portfolio + GitHub",
                    "Apply to analyst roles",
                  ],
                },
                {
                  from: "Sales",
                  to: "Product Manager",
                  steps: [
                    "Learn discovery/roadmap",
                    "Write PRDs, manage tickets",
                    "Side projects or courses",
                    "Internal transfer/APM",
                  ],
                },
              ].map((p, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">
                      {p.from} → {p.to}
                    </h4>
                    <Badge variant="secondary">Path</Badge>
                  </div>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {p.steps.map((s, idx) => (
                      <li key={idx}>• {s}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Job Market Salary Insights */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wallet className="h-5 w-5 text-teal-600" />
              <span>Job Market Salary Insights</span>
            </CardTitle>
            <CardDescription>
              Average salaries by experience level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  role: "Software Engineer",
                  salaries: [
                    { l: "Fresher", v: "₹4–10 LPA" },
                    { l: "Mid-level", v: "₹12–30 LPA" },
                    { l: "Senior", v: "₹30–70+ LPA" },
                  ],
                },
                {
                  role: "Data Analyst",
                  salaries: [
                    { l: "Fresher", v: "₹3–8 LPA" },
                    { l: "Mid-level", v: "₹8–18 LPA" },
                    { l: "Senior", v: "₹18–35 LPA" },
                  ],
                },
                {
                  role: "Civil Engineer",
                  salaries: [
                    { l: "Fresher", v: "₹3–6 LPA" },
                    { l: "Mid-level", v: "₹6–12 LPA" },
                    { l: "Senior", v: "₹12–25 LPA" },
                  ],
                },
              ].map((r, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">{r.role}</h4>
                  <div className="space-y-2 text-sm">
                    {r.salaries.map((s, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between"
                      >
                        <span className="text-gray-600">{s.l}</span>
                        <span className="font-medium text-gray-900">{s.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Recruiters & Companies */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-purple-600" />
              <span>Top Recruiters & Companies</span>
            </CardTitle>
            <CardDescription>
              Leading companies and career pages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  sector: "Technology",
                  links: [
                    { n: "Google Careers", u: "https://careers.google.com" },
                    {
                      n: "Microsoft Careers",
                      u: "https://careers.microsoft.com",
                    },
                    { n: "TCS Careers", u: "https://www.tcs.com/careers" },
                  ],
                },
                {
                  sector: "Healthcare",
                  links: [
                    {
                      n: "Apollo Hospitals",
                      u: "https://www.apollohospitals.com/careers/",
                    },
                    {
                      n: "Fortis Healthcare",
                      u: "https://www.fortishealthcare.com/careers",
                    },
                  ],
                },
                {
                  sector: "Finance",
                  links: [
                    {
                      n: "HDFC Bank Careers",
                      u: "https://www.hdfcbank.com/careers",
                    },
                    {
                      n: "Goldman Sachs Careers",
                      u: "https://www.goldmansachs.com/careers/",
                    },
                  ],
                },
              ].map((c, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {c.sector}
                  </h4>
                  <ul className="space-y-2 text-sm">
                    {c.links.map((l, idx) => (
                      <li key={idx}>
                        <Link
                          href={l.u}
                          target="_blank"
                          className="text-blue-700 hover:underline"
                        >
                          {l.n}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Soft Skills & Workplace Readiness */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-amber-600" />
              <span>Soft Skills & Workplace Readiness</span>
            </CardTitle>
            <CardDescription>
              Communication, teamwork, leadership, etiquette
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                "Communication: active listening, concise writing, public speaking",
                "Teamwork: collaboration tools, conflict resolution",
                "Leadership: decision-making, delegation, feedback",
                "Emotional Intelligence: self-awareness, empathy",
                "Workplace: email, meeting, time management",
                "Remote: async comms, focus, documentation",
              ].map((t, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="text-sm text-gray-700">{t}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Global Career Opportunities */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe2 className="h-5 w-5 text-cyan-600" />
              <span>Global Career Opportunities</span>
            </CardTitle>
            <CardDescription>Work abroad, visas, and demand</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  country: "USA",
                  visa: "H-1B, F-1 OPT",
                  demand: "Software, data, healthcare, semiconductor",
                  link: "https://travel.state.gov/",
                },
                {
                  country: "Canada",
                  visa: "Express Entry, PGWP",
                  demand: "Developers, healthcare, construction, finance",
                  link: "https://www.canada.ca/en/immigration-refugees-citizenship.html",
                },
                {
                  country: "Germany",
                  visa: "EU Blue Card, Job Seeker",
                  demand: "Engineering, automotive, software",
                  link: "https://www.make-it-in-germany.com/en/",
                },
                {
                  country: "Japan",
                  visa: "Highly Skilled, Specified Skilled",
                  demand: "Manufacturing, robotics, IT",
                  link: "https://www.mofa.go.jp/",
                },
              ].map((c, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{c.country}</h4>
                    <Badge variant="secondary">Visa</Badge>
                  </div>
                  <div className="text-sm text-gray-700 mb-1">{c.visa}</div>
                  <div className="text-xs text-gray-500 mb-3">
                    Demand: {c.demand}
                  </div>
                  <Link href={c.link} target="_blank">
                    <Button variant="outline" className="w-full">
                      Official Info
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Briefcase className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">0</div>
                  <div className="text-sm text-gray-600">
                    Career Assessments
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">0</div>
                  <div className="text-sm text-gray-600">
                    Counseling Sessions
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">0</div>
                  <div className="text-sm text-gray-600">
                    Career Paths Explored
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        {selectedInterest && selectedEducation && (
          <Card className="text-center bg-gradient-to-r from-green-500 to-blue-600 text-white">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">
                Ready to Plan Your Career?
              </h3>
              <p className="text-green-100 mb-6">
                You've shown interest in{" "}
                {interests.find((i) => i.id === selectedInterest)?.name} with{" "}
                {educationLevels.find((e) => e.id === selectedEducation)?.name}{" "}
                education
              </p>
              <Button
                size="lg"
                className="bg-white text-green-600 hover:bg-gray-100"
              >
                Start Career Assessment
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Additional Resources */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              <span>Additional Resources</span>
            </CardTitle>
            <CardDescription>
              Explore more tools and resources for your career development
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">
                  Learning Resources
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Online courses and certifications</li>
                  <li>• Industry-specific training programs</li>
                  <li>• Skill development workshops</li>
                  <li>• Mentorship opportunities</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Career Tools</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Resume builder and templates</li>
                  <li>• Interview preparation guides</li>
                  <li>• Salary negotiation tips</li>
                  <li>• Networking strategies</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
