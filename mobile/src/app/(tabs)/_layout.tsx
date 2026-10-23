import AppTabs from "@/components/app-tabs";
import { PlugsProvider } from "@/providers/plug.provider";

export default function TabsLayout() {
  return (
    <PlugsProvider>
      <AppTabs />
    </PlugsProvider>
  );
}
