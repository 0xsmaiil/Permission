import { memo } from "react";
import { HolidaysCalendar } from "./HolidaysCalendar";
import { BridgeOptimizer } from "./BridgeOptimizer";
import { CalendarView } from "./CalendarView";
import type { CalculationRecord } from "../lib/storage";

interface Props {
  history: CalculationRecord[];
}

export const CalendarTab = memo(function CalendarTab({ history }: Props) {
  return (
    <div className="tab-page">
      <HolidaysCalendar />
      <BridgeOptimizer />
      <CalendarView history={history} />
    </div>
  );
});
