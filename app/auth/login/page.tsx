"use client";

import type React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, GraduationCap, Building2 } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { t } from "@/lib/i18n";

export default function LoginPage() {
  const lang = useLanguage();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link
            href="/"
            className="flex items-center justify-center space-x-2 mb-4 hover:opacity-80 transition-opacity"
          >
            <BookOpen className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              {t(lang, "app_name")}
            </h1>
          </Link>
          <CardTitle>{t(lang, "login_title", "Welcome Back")}</CardTitle>
          <CardDescription>
            {t(
              lang,
              "login_desc",
              "Choose your role to get started with AI-powered learning"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Student Option */}
          <Link href="/auth/login/student" className="block">
            <div className="border-2 border-blue-200 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Student</h3>
                  <p className="text-sm text-gray-600">
                    {t(
                      lang,
                      "web_mobile_desc",
                      "Join as a student to learn with AI tutoring"
                    )}
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* Teacher Option */}
          <Link href="/auth/login/teacher" className="block">
            <div className="border-2 border-green-200 rounded-lg p-4 hover:border-green-400 hover:bg-green-50 transition-all cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Teacher</h3>
                  <p className="text-sm text-gray-600">
                    {t(
                      lang,
                      "feature_teachers_desc",
                      "Join as a teacher to guide students"
                    )}
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {t(lang, "already_account", "Don't have an account?")}{" "}
              <Link
                href="/auth/signin"
                className="text-blue-600 hover:underline"
              >
                {t(lang, "sign_in", "Sign In")}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
