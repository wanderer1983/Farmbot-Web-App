import React from "react";
import { AxisNumberProperty, MapTransformProps } from "../../interfaces";
import { getMapSize, transformXY } from "../../util";
import { BotPosition } from "../../../../devices/interfaces";
import { trim } from "../../../../util";
import { GetWebAppConfigValue } from "../../../../config_storage/actions";
import { BooleanSetting } from "../../../../session_keys";
import { range } from "lodash";
import { PeripheralValues } from "./bot_trail";

export interface BotPeripheralsProps {
  position: BotPosition;
  peripheralValues: PeripheralValues;
  mapTransformProps: MapTransformProps;
  plantAreaOffset: AxisNumberProperty;
  getConfigValue: GetWebAppConfigValue;
}

function lightsFigure(
  props: { i: number, x: number, y: number, height: number, xySwap: boolean }) {
  const { i, x, y, height, xySwap } = props;
  const mapHeightMid = height / 2 + y;
  return <g id="lights" key={`peripheral_${i}`}>
    <defs>
      <linearGradient id="LightingGradient">
        <stop offset="0%" stopColor="white" stopOpacity={0.5} />
        <stop offset="100%" stopColor="white" stopOpacity={0} />
      </linearGradient>
      <g id="light-half">
        <rect
          x={x}
          y={y}
          width={400}
          height={height}
          fill="url(#LightingGradient)" />
      </g>
    </defs>

    <use xlinkHref="#light-half"
      transform={trim(`rotate(${xySwap ? 90 : 0},
        ${xySwap ? height / 2 + x : x},
        ${mapHeightMid})`)} />
    <use xlinkHref="#light-half"
      transform={trim(`rotate(${xySwap ? 270 : 180},
        ${x},
        ${xySwap ? y : mapHeightMid})`)} />
  </g>;
}

function waterFigure(
  props: { i: number, cx: number, cy: number, animate: boolean }) {
  const { i, cx, cy, animate } = props;
  const color = "rgb(11, 83, 148)";
  const copies = animate ? 3 : 1;
  const animateClass = animate ? "animate" : "";

  return <g id="water" key={`peripheral_${i}`}>
    <defs>
      <g id="water-circle">
        <circle
          cx={cx}
          cy={cy}
          r={55}
          fillOpacity={0.2}
          fill={color} />
      </g>
      <g id="water-line">
        <path
          d={`M${cx} ${cy + 50} v -3`}
          stroke={color}
          strokeOpacity={0.5}
          strokeWidth={2}
          strokeLinecap="round" />
      </g>
    </defs>

    {range(0, copies).map(s => {
      return <g
        className={`water-spray delay-${s} ${animateClass}`} key={`spray-${s}`}>
        <use xlinkHref="#water-circle" />
        {range(0, 360, 15).map(rotation => {
          return <use xlinkHref="#water-line" key={`spray-line-${rotation}`}
            transform={`rotate(${rotation}, ${cx}, ${cy})`} />;
        })}
      </g>;
    })}
  </g>;
}

function vacuumFigure(
  props: { i: number, cx: number, cy: number, animate: boolean }) {
  const { i, cx, cy, animate } = props;
  const color = "black";
  const copies = animate ? 3 : 1;
  const animateClass = animate ? "animate" : "";

  return <g id="vacuum" key={`peripheral_${i}`}>
    <defs>
      <radialGradient id="WaveGradient">
        <stop offset="0%" stopColor={color} stopOpacity={0} />
        <stop offset="80%" stopColor={color} stopOpacity={0} />
        <stop offset="90%" stopColor={color} stopOpacity={0.25} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </radialGradient>
      <g id="vacuum-wave">
        <circle
          cx={cx}
          cy={cy}
          r={100}
          fill="url(#WaveGradient)" />
      </g>
    </defs>

    {range(0, copies).map(s => {
      return <g
        className={`vacuum delay-${s} ${animateClass}`} key={`vacuum-${s}`}>
        <use xlinkHref="#vacuum-wave" />
      </g>;
    })}
  </g>;
}

function rotaryFigure(
  props: { i: number, cx: number, cy: number, animate: boolean }) {
  const { i, cx, cy, animate } = props;
  const color = "black";
  const copies = animate ? 3 : 1;
  const animateClass = animate ? "animate" : "";

  return <g id="rotary" key={`peripheral_${i}`}>
    <defs>
      <radialGradient id="WaveGradient">
        <stop offset="0%" stopColor={color} stopOpacity={0} />
        <stop offset="80%" stopColor={color} stopOpacity={0} />
        <stop offset="90%" stopColor={color} stopOpacity={0.25} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </radialGradient>
      <g id="rotary-wave">
        <circle
          cx={cx}
          cy={cy}
          r={100}
          fill="url(#WaveGradient)" />
      </g>
    </defs>

    {range(0, copies).map(s => {
      return <g
        className={`rotary delay-${s} ${animateClass}`} key={`rotary-${s}`}>
        <use xlinkHref="#rotary-wave" />
      </g>;
    })}
  </g>;
}

export function BotPeripherals(props: BotPeripheralsProps) {
  const {
    peripheralValues, position, plantAreaOffset, mapTransformProps, getConfigValue,
  } = props;
  const { xySwap } = mapTransformProps;
  const mapSize = getMapSize(mapTransformProps, plantAreaOffset);
  const positionQ = transformXY(
    (position.x || 0), (position.y || 0), mapTransformProps);
  const animate = !getConfigValue(BooleanSetting.disable_animations);

  return <g className={"virtual-peripherals"}>
    {peripheralValues.map((x, i) => {
      if (x.label.toLowerCase().includes("light") && x.value) {
        return lightsFigure({
          i,
          x: xySwap ? -plantAreaOffset.y : positionQ.qx,
          y: xySwap ? positionQ.qy : -plantAreaOffset.y,
          height: xySwap ? mapSize.w : mapSize.h,
          xySwap,
        });
      } else if (x.label.toLowerCase().includes("water") && x.value) {
        return waterFigure({
          i,
          cx: positionQ.qx,
          cy: positionQ.qy,
          animate
        });
      } else if (x.label.toLowerCase().includes("vacuum") && x.value) {
        return vacuumFigure({
          i,
          cx: positionQ.qx,
          cy: positionQ.qy,
          animate
        });
      } else if (x.label.toLowerCase().includes("rotary") && x.value) {
        return rotaryFigure({
          i,
          cx: positionQ.qx,
          cy: positionQ.qy,
          animate
        });
      }
    })}
  </g>;
}
