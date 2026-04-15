"use client";
import { useParams } from "next/navigation";
import { redirect } from "next/navigation";

export default function ProgressPage() {
  const params = useParams();
  const learnerId = params.id as string;
  redirect(`/dashboard/parent/learner/${learnerId}/gradebook`);
}
