import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/use-theme";
import RecentDevices from "../recent-device";
import { usePlugs } from "@/providers/plug.provider";
import CurrentConsumptionCard from "../current-consumption-card";
import WeeklyConsumptionCard from "../weekly-consumption-card";
import ConsumptionBreakdownCard from "../consumption-breakdown-card";
import { StatsCards } from "../stats-cards";
import MasterPowerCard from "../master-power-card";

const HomeMainView = () => {
  const { liveData } = usePlugs();
  const allStrips = Object.values(liveData ?? {});
  const allOutlets = allStrips.flatMap((strip) =>
    Object.values(strip.outlets || {}),
  );
  const activeOutlets = allOutlets.filter((outlet) => outlet.on);
  const totalPower = allOutlets.reduce(
    (acc, outlet) => acc + (outlet.power_W || 0),
    0,
  );
  const totalEnergy = allOutlets.reduce(
    (acc, outlet) => acc + (outlet.energy_kwh || 0),
    0,
  );

  const theme = useTheme();

  return (
    <SafeAreaView
      edges={["top"]}
      style={{
        paddingVertical: 12,
        gap: 12,
        backgroundColor: theme.background,
        flex: 1,
      }}
    >
      <ScrollView
        style={{ gap: 12 }}
        contentContainerStyle={{
          gap: 14,
          paddingHorizontal: 12,
          paddingBottom: 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <CurrentConsumptionCard
          totalPower={totalPower}
          activeDevicesCount={activeOutlets?.length}
        />
        <WeeklyConsumptionCard />
        <ConsumptionBreakdownCard totalPower={totalPower} />
        <StatsCards
          totalPower={totalPower}
          totalEnergy={totalEnergy}
          activeDevicesCount={activeOutlets?.length}
        />
        <RecentDevices />
        <MasterPowerCard />
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeMainView;
