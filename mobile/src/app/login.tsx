import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/auth-context";
import LoginView from "../../sections/views/login-view";

export default function LoginScreen() {
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

  return <LoginView />;
}
