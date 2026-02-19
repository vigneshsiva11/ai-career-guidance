"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpen,
  MessageSquare,
  Phone,
  Users,
  Award,
  MapPin,
  Menu,
  X,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { getTollFreeNumber } from "@/lib/config";
import { t } from "@/lib/i18n";
import { useLanguage, setStoredLanguage } from "@/hooks/use-language";
import { useEffect, useState } from "react";
import { CareerAssessmentModal } from "@/components/career-assessment-modal";

type AuthUser = {
  id: string;
  legacyId?: number | null;
  name: string;
  email: string;
  role: "student" | "teacher" | "admin";
  assessmentCompleted: boolean;
  lastLoginAt: string | null;
};

export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const lang = useLanguage();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAssessmentPopup, setShowAssessmentPopup] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setRefreshKey((prev) => prev + 1);
  }, [lang]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const meResponse = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });
        if (meResponse.status === 401) {
          setAuthUser(null);
          setShowAssessmentPopup(false);
          return;
        }
        const meResult = await meResponse.json();
        if (!meResult.success || !meResult.data) {
          setAuthUser(null);
          setShowAssessmentPopup(false);
          return;
        }

        const me = meResult.data as AuthUser;
        setAuthUser(me);

        if (me.role !== "student") return;
        const assessmentResponse = await fetch(
          `/api/career-assessment?user_id=${me.id}`
        );
        const assessmentResult = await assessmentResponse.json();
        if (!assessmentResult.success) return;
        const completed = Boolean(assessmentResult.data?.assessmentCompleted);
        if (!completed) setShowAssessmentPopup(true);
      } catch (error) {
        console.error("Auth check failed:", error);
        setAuthUser(null);
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>("[data-fade-in]");
    if (sections.length === 0) return;

    sections.forEach((section) => {
      section.setAttribute("data-reveal-state", "pending");
    });

    // Hard fallback: never leave content hidden.
    const fallbackTimer = window.setTimeout(() => {
      sections.forEach((section) => {
        section.setAttribute("data-reveal-state", "visible");
      });
    }, 600);

    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      sections.forEach((section) => {
        section.setAttribute("data-reveal-state", "visible");
      });
      window.clearTimeout(fallbackTimer);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-reveal-state", "visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    sections.forEach((section) => observer.observe(section));
    return () => {
      window.clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleStartLearning = () => {
    if (authUser) {
      router.push("/assessment");
    } else {
      router.push("/login");
    }
  };

  const startAssessmentFromPopup = () => {
    setShowAssessmentPopup(false);
    router.push("/assessment");
  };

  const remindLater = () => {
    setShowAssessmentPopup(false);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setAuthUser(null);
      setShowAssessmentPopup(false);
      setIsMobileMenuOpen(false);
      router.push("/");
    }
  };

  const roleLabel =
    authUser?.role && authUser.role.length > 0
      ? `${authUser.role[0].toUpperCase()}${authUser.role.slice(1)}`
      : "";
  return (
    <div
      key={refreshKey}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col"
    >
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 md:px-16">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center space-x-2 rounded-full px-2 py-1 transition-all duration-300 ease-in-out hover:bg-white/80"
            >
              <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                {t(lang, "app_name")}
              </h1>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center rounded-full border border-slate-200 bg-white p-1 shadow-md">
              <Link href="/auth/register/student">
                <Button
                  variant={pathname === "/ask" ? "default" : "outline"}
                  size="sm"
                  className={`rounded-full border-0 text-xs xl:text-sm transition-all duration-300 ease-in-out hover:scale-105 hover:-translate-y-1 ${
                    pathname === "/ask"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                      : "bg-transparent hover:bg-slate-50"
                  }`}
                >
                  {t(lang, "navbar_ask", "Ask Question")}
                </Button>
              </Link>
              <Link href="/quiz">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-0 bg-transparent text-xs xl:text-sm transition-all duration-300 ease-in-out hover:scale-105 hover:-translate-y-1 hover:bg-slate-50"
                >
                  {t(lang, "navbar_quiz", "Quiz")}
                </Button>
              </Link>
              <Link href="/career-guidance">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-0 bg-transparent text-xs xl:text-sm transition-all duration-300 ease-in-out hover:scale-105 hover:-translate-y-1 hover:bg-slate-50"
                >
                  {t(lang, "navbar_career", "Career Guidance")}
                </Button>
              </Link>
              <div className="relative">
                <select
                  aria-label="Language selector"
                  className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs xl:text-sm text-slate-700"
                  onChange={(e) => setStoredLanguage(e.target.value as any)}
                  value={lang}
                >
                  <option value="pa">Punjabi</option>
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="ta">Tamil</option>
                </select>
              </div>
            </nav>

            <div className="hidden lg:flex items-center gap-2 xl:gap-3">
              {authUser ? (
                <>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs xl:text-sm text-slate-700">
                    Welcome, {authUser.name} ({roleLabel})
                  </span>
                  <Link href="/dashboard">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full border-slate-300 bg-white text-xs xl:text-sm shadow-md transition-all duration-300 ease-in-out hover:scale-105 hover:-translate-y-1 hover:bg-slate-50"
                    >
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-slate-300 bg-white text-xs xl:text-sm shadow-md transition-all duration-300 ease-in-out hover:scale-105 hover:-translate-y-1 hover:bg-slate-50"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full border-slate-300 bg-white text-xs xl:text-sm shadow-md transition-all duration-300 ease-in-out hover:scale-105 hover:-translate-y-1 hover:bg-slate-50"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link href="/auth/register/student">
                    <Button
                      size="sm"
                      className="rounded-full bg-indigo-600 text-xs xl:text-sm text-white shadow-md transition-all duration-300 ease-in-out hover:scale-105 hover:-translate-y-1 hover:bg-indigo-700 hover:shadow-lg"
                    >
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center space-x-2 lg:hidden">
              <div className="relative">
                <select
                  aria-label="Language selector"
                  className="rounded-full border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700"
                  onChange={(e) => setStoredLanguage(e.target.value as any)}
                  value={lang}
                >
                  <option value="pa">PA</option>
                  <option value="en">EN</option>
                  <option value="hi">HI</option>
                  <option value="ta">TA</option>
                </select>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMobileMenu}
                className="h-10 w-10 rounded-full border border-slate-300 bg-white"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-slate-200 bg-white/90 backdrop-blur-md">
              <div className="space-y-1 px-2 pt-2 pb-3">
                <Link
                  href="/auth/register/student"
                  className="block rounded-xl px-3 py-2 text-base font-medium text-slate-700 transition-all duration-300 ease-in-out hover:bg-slate-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t(lang, "navbar_ask", "Ask Question")}
                </Link>
                <Link
                  href="/quiz"
                  className="block rounded-xl px-3 py-2 text-base font-medium text-slate-700 transition-all duration-300 ease-in-out hover:bg-slate-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t(lang, "navbar_quiz", "Quiz")}
                </Link>
                <Link
                  href="/career-guidance"
                  className="block rounded-xl px-3 py-2 text-base font-medium text-slate-700 transition-all duration-300 ease-in-out hover:bg-slate-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t(lang, "navbar_career", "Career Guidance")}
                </Link>
                {authUser ? (
                  <>
                    <div className="px-3 py-2 text-sm text-slate-600">
                      Welcome, {authUser.name} ({roleLabel})
                    </div>
                    <Link
                      href="/dashboard"
                      className="block rounded-xl px-3 py-2 text-base font-medium text-slate-700 transition-all duration-300 ease-in-out hover:bg-slate-50"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      className="block w-full rounded-xl px-3 py-2 text-left text-base font-medium text-slate-700 transition-all duration-300 ease-in-out hover:bg-slate-50"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block rounded-xl px-3 py-2 text-base font-medium text-slate-700 transition-all duration-300 ease-in-out hover:bg-slate-50"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      href="/auth/register/student"
                      className="block rounded-xl px-3 py-2 text-base font-medium text-slate-700 transition-all duration-300 ease-in-out hover:bg-slate-50"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section
        data-fade-in
        className="reveal-section relative px-6 py-20 md:px-16 md:py-24"
      >
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-24 top-8 h-64 w-64 rounded-full bg-indigo-200/60 blur-3xl opacity-30" />
          <div className="absolute -right-20 top-16 h-72 w-72 rounded-full bg-purple-200/60 blur-3xl opacity-30" />
        </div>
        <div className="relative mx-auto max-w-5xl text-center">
          <h2 className="mb-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl leading-tight">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            AI-Powered Career Guidance for Future Professionals
            </span>
          </h2>
          <p className="mx-auto mb-8 max-w-2xl px-2 text-base leading-relaxed text-slate-600 sm:text-lg lg:text-xl">
            Discover your strengths, receive a personalized roadmap, analyze skill gaps, and build a structured path toward your ideal career.
          </p>
          <div className="mx-auto flex max-w-md flex-col justify-center gap-3 sm:max-w-none sm:flex-row sm:gap-4">
            <Button
              size="lg"
              className="min-h-[44px] w-full rounded-full bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 ease-in-out hover:scale-105 hover:-translate-y-1 hover:bg-indigo-700 hover:shadow-lg sm:w-auto sm:text-base"
              onClick={handleStartLearning}
            >
              Start Career Assessment
            </Button>
            <Link href="/roadmap" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="min-h-[44px] w-full rounded-full border border-indigo-600 bg-white px-8 py-3 text-sm font-semibold text-indigo-600 shadow-md transition-all duration-300 ease-in-out hover:scale-105 hover:-translate-y-1 hover:bg-slate-50 hover:shadow-lg sm:w-auto sm:text-base"
              >
                Explore Career Roadmap
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Access Methods */}
      <section
        data-fade-in
        className="reveal-section bg-white px-6 py-20 md:px-16"
      >
        <div className="mx-auto max-w-6xl">
          <h3 className="mb-12 text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
            How It Works
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="text-center rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:-translate-y-1 hover:shadow-xl">
              <CardHeader className="pb-4">
                <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600 mx-auto mb-3 sm:mb-4" />
                <CardTitle className="text-lg sm:text-xl">
                  AI Vision Discovery
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm sm:text-base leading-relaxed text-slate-600">
                  Participate in a structured AI interview to uncover your strengths and career interests.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:-translate-y-1 hover:shadow-xl">
              <CardHeader className="pb-4">
                <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 text-green-600 mx-auto mb-3 sm:mb-4" />
                <CardTitle className="text-lg sm:text-xl">
                  Personalized Career Roadmap
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm sm:text-base leading-relaxed text-slate-600">
                  Receive a clear step-by-step roadmap aligned with your goals and skill level.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:-translate-y-1 hover:shadow-xl">
              <CardHeader className="pb-4">
                <Phone className="h-10 w-10 sm:h-12 sm:w-12 text-purple-600 mx-auto mb-3 sm:mb-4" />
                <CardTitle className="text-lg sm:text-xl">
                  Skill Gap Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm sm:text-base leading-relaxed text-slate-600">
                  Identify missing skills and measure your readiness for your target role.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:-translate-y-1 hover:shadow-xl sm:col-span-2 lg:col-span-1">
              <CardHeader className="pb-4">
                <MapPin className="h-10 w-10 sm:h-12 sm:w-12 text-orange-600 mx-auto mb-3 sm:mb-4" />
                <CardTitle className="text-lg sm:text-xl">
                  AI Career Coach
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm sm:text-base leading-relaxed text-slate-600">
                  Get continuous AI-powered guidance for career growth and interview preparation.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        data-fade-in
        className="reveal-section px-6 py-20 md:px-16"
      >
        <div className="mx-auto max-w-6xl">
          <h3 className="mb-12 text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
            {t(lang, "features_title")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="flex items-start space-x-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:-translate-y-1 hover:shadow-xl sm:space-x-4">
              <div className="bg-blue-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="min-w-0">
                <h4 className="mb-2 text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
                  Career Persona Identification
                </h4>
                <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                  Build a data-driven profile that maps your strengths and interests to the right career direction, while supporting reverse career planning.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:-translate-y-1 hover:shadow-xl sm:space-x-4">
              <div className="bg-green-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="min-w-0">
                <h4 className="mb-2 text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
                  Embedding-Based Skill Gap Analysis
                </h4>
                <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                  Use semantic matching to compare your profile with role requirements and get learn-to-earn recommendations.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:-translate-y-1 hover:shadow-xl sm:space-x-4 md:col-span-2 lg:col-span-1">
              <div className="bg-purple-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                <Award className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <div className="min-w-0">
                <h4 className="mb-2 text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
                  Continuous AI Coaching Support
                </h4>
                <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                  Receive ongoing AI guidance for next steps, interview preparation, and long-term career growth.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 text-center sm:text-left">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-center sm:justify-start space-x-2 mb-4">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="text-lg sm:text-xl font-bold">
                  {t(lang, "app_name", "Classless")}
                </span>
              </div>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                Delivering intelligent career guidance powered by AI to help professionals grow with clarity and confidence.
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-3 sm:mb-4 text-base sm:text-lg">
                {t(lang, "footer_access_methods", "Access Methods")}
              </h5>
              <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
                <li>{t(lang, "footer_web_app", "Web Application")}</li>
                <li className="break-words">
                  {t(lang, "footer_sms_text", "SMS: Text to")}{" "}
                  {getTollFreeNumber("sms")}
                </li>
                <li className="break-words">
                  {t(lang, "footer_call_text", "Call:")}{" "}
                  {getTollFreeNumber("voice")}
                </li>
                <li>
                  {t(lang, "footer_community_stations", "Community Stations")}
                </li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold mb-3 sm:mb-4 text-base sm:text-lg">
                {t(lang, "footer_support", "Support")}
              </h5>
              <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
                <li>{t(lang, "footer_help_center", "Help Center")}</li>
                <li>{t(lang, "footer_contact_us", "Contact Us")}</li>
                <li>{t(lang, "footer_privacy_policy", "Privacy Policy")}</li>
                <li>
                  {t(lang, "footer_terms_of_service", "Terms of Service")}
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-gray-400">
            <p className="text-xs sm:text-sm">
              &copy; 2024 {t(lang, "app_name", "Classless")}.{" "}
              {t(
                lang,
                "footer_copyright",
                "Bridging the digital education divide."
              )}
            </p>
          </div>
        </div>
      </footer>
      <CareerAssessmentModal
        open={showAssessmentPopup}
        onStart={startAssessmentFromPopup}
        onCancel={remindLater}
        title="Complete Your Career Assessment"
        message="Answer a few personalized questions to unlock your AI-powered roadmap."
        startLabel="Start Assessment"
        cancelLabel="Remind Me Later"
      />
    </div>
  );
}
