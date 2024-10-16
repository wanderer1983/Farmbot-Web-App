import { TaggedSensorReading, TaggedSensor } from "farmbot";
import { AxisInputBoxGroupState } from "../../controls/interfaces";
import { TimeSettings } from "../../interfaces";

export interface SensorReadingsProps {
  sensorReadings: TaggedSensorReading[];
  sensors: TaggedSensor[];
  timeSettings: TimeSettings;
  dispatch: Function;
}

export interface SensorReadingsState {
  sensor: TaggedSensor | undefined;
  /** seconds */
  timePeriod: number;
  /** seconds */
  endDate: number;
  /** location filter setting */
  xyzLocation: AxisInputBoxGroupState | undefined;
  /** Show the previous time period in addition to the current time period. */
  showPreviousPeriod: boolean;
  /** mm */
  deviation: number;
  /** TaggedSensorReading UUID */
  hovered: string | undefined;
  /** Add Sensor Reading Menu state. */
  addReadingMenuOpen: boolean;
}

export interface SensorReadingsTableProps {
  readingsForPeriod: (period: "current" | "previous") => TaggedSensorReading[];
  sensors: TaggedSensor[];
  timeSettings: TimeSettings;
  /** TaggedSensorReading UUID */
  hovered: string | undefined;
  hover: (hovered: string | undefined) => void;
}

export interface TableRowProps {
  sensorReading: TaggedSensorReading;
  sensorName: string;
  timeSettings: TimeSettings;
  period: "previous" | "current";
  /** TaggedSensorReading UUID */
  hovered: string | undefined;
  hover: (hovered: string | undefined) => void;
  hideLocation?: boolean;
  distance?: number;
}

export interface SensorSelectionProps {
  selectedSensor: TaggedSensor | undefined;
  sensors: TaggedSensor[];
  setSensor: (sensor: TaggedSensor) => void;
  allOption?: boolean;
}

export interface LocationSelectionProps {
  xyzLocation: AxisInputBoxGroupState | undefined;
  /** mm */
  deviation: number;
  setDeviation: (deviation: number) => void;
  setLocation: (xyzLocation: AxisInputBoxGroupState | undefined) => void;
}

export interface TimePeriodSelectionProps {
  /** seconds */
  timePeriod: number;
  /** seconds */
  endDate: number;
  showPreviousPeriod: boolean;
  setEndDate: (date: number) => void;
  setPeriod: (period: number) => void;
  togglePrevious: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface DateDisplayProps {
  /** seconds */
  endDate: number;
  timeSettings: TimeSettings;
  /** seconds */
  timePeriod: number;
  showPreviousPeriod: boolean;
}

export interface SensorReadingPlotProps {
  readingsForPeriod: (period: "current" | "previous") => TaggedSensorReading[];
  /** seconds */
  endDate: number;
  timeSettings: TimeSettings;
  /** TaggedSensorReading UUID */
  hovered: string | undefined;
  hover: (hovered: string | undefined) => void;
  showPreviousPeriod: boolean;
  /** seconds */
  timePeriod: number;
}
