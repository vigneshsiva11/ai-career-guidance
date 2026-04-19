"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: GoogleTokenResponse) => void;
            error_callback?: (error: { type?: string; message?: string }) => void;
          }) => {
            requestAccessToken: (config?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

type GoogleSSOButtonProps = {
  educationLevel?: string;
  requireEducationLevel?: boolean;
};

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.2-1.9 2.9v2.4h3.1c1.8-1.7 2.9-4.1 2.9-7 0-.7-.1-1.4-.2-2.1H12z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.6 0 4.9-.9 6.5-2.5l-3.1-2.4c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.2H3.2v2.6C4.8 19.8 8.1 22 12 22z"
      />
      <path
        fill="#4A90E2"
        d="M6.4 13.8c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V7.6H3.2C2.4 9.1 2 10.5 2 12s.4 2.9 1.2 4.4l3.2-2.6z"
      />
      <path
        fill="#FBBC05"
        d="M12 6.1c1.4 0 2.7.5 3.7 1.4l2.8-2.8C16.9 3.2 14.6 2 12 2 8.1 2 4.8 4.2 3.2 7.6l3.2 2.6c.8-2.4 3-4.1 5.6-4.1z"
      />
    </svg>
  );
}

export function GoogleSSOButton({
  educationLevel,
  requireEducationLevel = false,
}: GoogleSSOButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const clientId = useMemo(
    () =>
      String(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "")
        .split(",")
        .map((value) => value.trim())
        .find(Boolean) || "",
    []
  );

  const handleGoogleSignIn = async () => {
    if (!clientId) {
      toast.error("Google Sign-In is not configured");
      return;
    }

    if (requireEducationLevel && !educationLevel?.trim()) {
      toast.error("Please select Education Level before continuing with Google");
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      toast.error("Google Sign-In is still loading. Please try again.");
      return;
    }

    setIsLoading(true);
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "openid email profile",
        callback: async (tokenResponse: GoogleTokenResponse) => {
          try {
            if (!tokenResponse.access_token) {
              throw new Error(tokenResponse.error || "Google token not received");
            }

            const response = await fetch("/api/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                accessToken: tokenResponse.access_token,
                educationLevel: educationLevel || "",
              }),
            });
            const result = await response.json();
            if (!result.success || !result.data) {
              throw new Error(result.error || "Google sign-in failed");
            }

            localStorage.setItem("classless_user", JSON.stringify(result.data));
            toast.success("Signed in with Google");
            router.replace("/dashboard");
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Google sign-in failed";
            toast.error(message);
          } finally {
            setIsLoading(false);
          }
        },
        error_callback: (error) => {
          const message =
            error?.message ||
            (error?.type
              ? `Google sign-in failed: ${error.type.replace(/_/g, " ")}`
              : "Google sign-in failed");
          toast.error(message);
          setIsLoading(false);
        },
      });

      tokenClient.requestAccessToken({ prompt: "consent" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Google sign-in failed";
      toast.error(message);
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className="w-full justify-center gap-2 rounded-xl border-slate-300 bg-white py-6 text-base font-medium text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
    >
      <GoogleIcon />
      {isLoading ? "Connecting..." : "Continue with Google"}
    </Button>
  );
}
