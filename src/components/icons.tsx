import type { SVGProps } from "react";

const P = (d: string) =>
  function Icon(props: SVGProps<SVGSVGElement>) {
    return (
      <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
        <path d={d} />
      </svg>
    );
  };

export const HomeIcon = P("M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z");
export const PlanIcon = P("M8 3v3M16 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM8 12h3M8 16h6");
export const StudyIcon = P("M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z");
export const TestIcon = P("M9 4h6M9 4a2 2 0 0 0-2 2H6a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1a2 2 0 0 0-2-2M9 13l2 2 4-4");
export const ChartIcon = P("M4 20V10M10 20V4M16 20v-7M22 20H2");
export const UserIcon = P("M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0");
export const BellIcon = P("M6 9a6 6 0 1 1 12 0c0 6 3 7 3 7H3s3-1 3-7M10 20a2 2 0 0 0 4 0");
export const ChatIcon = P("M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z");
export const PlayIcon = P("M7 5v14l11-7z");
export const PauseIcon = P("M8 5v14M16 5v14");
export const CoffeeIcon = P("M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 9h1.5a2.5 2.5 0 0 1 0 5H17M8 3v2M12 3v2");
export const GripIcon = P("M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01");
export const CheckIcon = P("M5 12l5 5L20 7");
export const XIcon = P("M6 6l12 12M18 6L6 18");
export const PlusIcon = P("M12 5v14M5 12h14");
export const RefreshIcon = P("M20 11A8 8 0 0 0 5.3 7M4 4v4h4M4 13a8 8 0 0 0 14.7 4M20 20v-4h-4");
export const FlameIcon = P("M12 21c4 0 7-3 7-7 0-5-5-6-5-11-3 2-5 5-5 8-1-1-2-2-2-4-2 2-2 5-2 7 0 4 3 7 7 7z");
export const InfoIcon = P("M12 16v-5M12 8h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z");
