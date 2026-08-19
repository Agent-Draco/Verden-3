import "./index.css";
import { IntroComposition } from "./Intro";
import { DashboardLoadingComposition } from "./DashboardLoading";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <IntroComposition />
      <DashboardLoadingComposition />
    </>
  );
};
