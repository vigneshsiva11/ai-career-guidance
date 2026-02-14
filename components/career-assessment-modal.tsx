"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CareerAssessmentModalProps {
  open: boolean;
  onStart: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  startLabel?: string;
  cancelLabel?: string;
}

export function CareerAssessmentModal({
  open,
  onStart,
  onCancel,
  title = "Discover Your Career Strengths",
  message = "Attend a short AI-powered assessment to identify your strengths and generate a personalized career roadmap.",
  startLabel = "Start Assessment",
  cancelLabel = "Cancel",
}: CareerAssessmentModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-gray-600">{message}</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button onClick={onStart}>{startLabel}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
