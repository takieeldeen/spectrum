import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { VerifyEmailView } from "../../sections/views/verify-email-view";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/(tabs)");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return null;
  }

  return <VerifyEmailView />;
}
