import React from "react";
import moment from "moment";
import { t } from "../../i18next_wrapper";
import { SensorReadingsTableProps, TableRowProps } from "./interfaces";
import { xyzTableEntry } from "../../logs/components/logs_table";
import { formatTime } from "../../util";
import { isUndefined, round } from "lodash";

enum TableColWidth {
  sensor = 125,
  value = 50,
  mode = 50,
  location = 110,
  date = 100,
}

/** Separated to allow frozen header row while scrolling table body. */
export const TableHeader = () =>
  <table className="sensor-history-table-header">
    <thead>
      <tr>
        <th style={{ width: `${TableColWidth.sensor}px` }}>
          <label>
            {t("Sensor")}
          </label>
        </th>
        <th style={{ width: `${TableColWidth.value}px` }}>
          <label>
            {t("Value")}
          </label>
        </th>
        <th style={{ width: `${TableColWidth.mode}px` }}>
          <label>
            {t("Mode")}
          </label>
        </th>
        <th style={{ width: `${TableColWidth.location}px` }}>
          <label>
            {t("(x, y, z)")}
          </label>
        </th>
        <th style={{ width: `${TableColWidth.date}px` }}>
          <label>
            {t("Time")}
          </label>
        </th>
      </tr>
    </thead>
  </table>;

/** Sensor reading. */
export const TableRow = (props: TableRowProps) => {
  const {
    sensorReading, timeSettings, period, sensorName, hover, hovered,
  } = props;
  const { uuid, body } = sensorReading;
  const { value, x, y, z, read_at, mode } = body;
  return <tr key={uuid}
    className={`table-row ${period} ${hovered === uuid ? "selected" : ""}`}
    onMouseEnter={() => hover(uuid)}
    onMouseLeave={() => hover(undefined)}>
    <td style={{ width: `${TableColWidth.sensor}px` }}>
      {sensorName}
    </td>
    <td style={{ width: `${TableColWidth.value}px` }}>
      {value}
    </td>
    <td style={{ width: `${TableColWidth.mode}px` }}>
      {mode > 0 ? t("Analog") : t("Digital")}
    </td>
    <td style={{ width: `${TableColWidth.location}px` }}>
      {!props.hideLocation && xyzTableEntry(x, y, z)}
      {!isUndefined(props.distance) && ` ${round(props.distance)}mm ${t("away")}`}
    </td>
    <td style={{ width: `${TableColWidth.date}px` }}>
      {formatTime(moment(read_at), timeSettings, "MMM D")}
    </td>
  </tr>;
};

export class SensorReadingsTable
  extends React.Component<SensorReadingsTableProps, {}> {

  render() {
    const sensorNameByPinLookup: { [x: number]: string } = {};
    this.props.sensors.map(x => {
      sensorNameByPinLookup[x.body.pin || 0] = x.body.label;
    });
    return <div className="sensor-history-table">
      <TableHeader />
      <table className="sensor-history-table-contents">
        <tbody>
          {["current", "previous"].map((period: "current" | "previous") => {
            return this.props.readingsForPeriod(period).reverse()
              .map(sensorReading => {
                const pin = sensorReading.body.pin;
                const sensorName = `${sensorNameByPinLookup[pin]} (pin ${pin})`;
                return <TableRow
                  key={sensorReading.uuid}
                  sensorName={sensorName}
                  sensorReading={sensorReading}
                  timeSettings={this.props.timeSettings}
                  period={period}
                  hover={this.props.hover}
                  hovered={this.props.hovered} />;
              });
          })}
        </tbody>
      </table>
    </div>;
  }
}
