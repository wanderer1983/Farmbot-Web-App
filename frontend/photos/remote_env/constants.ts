import { WDENVKey, Translation, FormatTranslationMap } from "./interfaces";
import { snakeCase, get, isUndefined } from "lodash";
import { NumericKeyName } from "../image_workspace";

/** I would rather not deal with all the weird edge cases that come with
 * supporting strings and numbers right now. It adds too many edge cases for the
 * FE to validate against. Example: Needing to conditionally determine if an ENV
 * key is string vs. number vs. bool. Using only numbers (and translating values
 * when transmitting) allows us to minimize the use of such conditionals.
 * When we need to support text that users will read, I can re-visit this. */
export enum SPECIAL_VALUES {
  FALSE = 0,
  TRUE = 1,
  TOP_LEFT = 2,
  TOP_RIGHT = 3,
  BOTTOM_LEFT = 4,
  BOTTOM_RIGHT = 5,
  X = 6,
  Y = 7
}

/** Sometimes, ENV var values are not available but rendering must still be
 * performed. This map provides a set of defaults for every ENV var. */
export const WD_KEY_DEFAULTS = {
  CAMERA_CALIBRATION_calibration_along_axis: SPECIAL_VALUES.X,
  CAMERA_CALIBRATION_image_bot_origin_location: SPECIAL_VALUES.BOTTOM_LEFT,
  CAMERA_CALIBRATION_invert_hue_selection: SPECIAL_VALUES.TRUE,
  CAMERA_CALIBRATION_easy_calibration: SPECIAL_VALUES.TRUE,
  CAMERA_CALIBRATION_blur: 5,
  CAMERA_CALIBRATION_calibration_object_separation: 100,
  CAMERA_CALIBRATION_camera_offset_x: 50,
  CAMERA_CALIBRATION_camera_offset_y: 100,
  CAMERA_CALIBRATION_coord_scale: 0,
  CAMERA_CALIBRATION_H_HI: 160,
  CAMERA_CALIBRATION_H_LO: 20,
  CAMERA_CALIBRATION_iteration: 1,
  CAMERA_CALIBRATION_morph: 5,
  CAMERA_CALIBRATION_S_HI: 255,
  CAMERA_CALIBRATION_S_LO: 100,
  CAMERA_CALIBRATION_total_rotation_angle: 0,
  CAMERA_CALIBRATION_V_HI: 255,
  CAMERA_CALIBRATION_V_LO: 100,
  WEED_DETECTOR_blur: 15,
  WEED_DETECTOR_H_HI: 90,
  WEED_DETECTOR_H_LO: 30,
  WEED_DETECTOR_iteration: 4,
  WEED_DETECTOR_morph: 6,
  WEED_DETECTOR_S_HI: 255,
  WEED_DETECTOR_S_LO: 50,
  WEED_DETECTOR_V_HI: 255,
  WEED_DETECTOR_V_LO: 50,
  WEED_DETECTOR_save_detected_plants: SPECIAL_VALUES.FALSE,
  WEED_DETECTOR_use_bounds: SPECIAL_VALUES.TRUE,
  WEED_DETECTOR_min_radius: 1.5,
  WEED_DETECTOR_max_radius: 50,
};

export type WEED_DETECTOR_KEY_PART =
  | "blur" | "morph" | "iteration"
  | "save_detected_plants"
  | "use_bounds"
  | "min_radius"
  | "max_radius"
  | NumericKeyName;

export type CAMERA_CALIBRATION_KEY_PART =
  | WEED_DETECTOR_KEY_PART
  | "calibration_along_axis"
  | "image_bot_origin_location"
  | "invert_hue_selection"
  | "easy_calibration"
  | "calibration_object_separation"
  | "camera_offset_x"
  | "camera_offset_y"
  | "coord_scale"
  | "total_rotation_angle";

/** The runtime equivalent for WeedDetectorENVKey.
 *  Good for iterating and whatnot. */
export const EVERY_WD_KEY: WDENVKey[] =
  Object.keys(WD_KEY_DEFAULTS).map((x: WDENVKey) => x);

const isWDENVKey = (key: unknown): key is WDENVKey =>
  (EVERY_WD_KEY as string[]).includes("" + key);

export const namespace = <T>(
  prefix: "WEED_DETECTOR_" | "CAMERA_CALIBRATION_") => (key: T): WDENVKey => {
    const namespacedKey = prefix + key;
    if (isWDENVKey(namespacedKey)) {
      return namespacedKey;
    } else {
      throw new Error(`${namespacedKey} is not a valid key.`);
    }
  };

export const DEFAULT_FORMATTER: Translation = {
  format: (key, val): number | string => {
    switch (key) {
      case "CAMERA_CALIBRATION_calibration_along_axis":
      case "CAMERA_CALIBRATION_image_bot_origin_location":
      case "CAMERA_CALIBRATION_invert_hue_selection":
      case "CAMERA_CALIBRATION_easy_calibration":
      case "WEED_DETECTOR_save_detected_plants":
      case "WEED_DETECTOR_use_bounds":
        return ("" + (SPECIAL_VALUES[val] || val));
      default:
        return val;
    }
  },
  parse: (__, val) => {
    try {
      const parsed = JSON.parse(val);
      switch (typeof parsed) {
        case "number":
          return parsed;
        case "boolean":
        case "string":
          return getSpecialValue(val);
        default:
          throw new Error("BAD DATA TYPE");
      }

    } catch (error) {
      throw new Error(`An invalid config input caused a crash.
      This is the value we got: ${val}
      This is the error: ${error}
      `);
    }
  }
};
/** If we hit any "special cases", we can register them here. */
export const TRANSLATORS: FormatTranslationMap = {};
/** We only expect certain string values from the weed detector.
 * Tokens like "BOTTOM_RIGHT" or "X" all have a numeric counterpart.
 * This function converts such strings to their numeric equivalent.
 * If a matching numeric code is not found, throws an exception.
 */
export function getSpecialValue(key: string | number):
  SPECIAL_VALUES {

  const k = snakeCase(("" + key).toUpperCase()).toUpperCase();
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const v = get(SPECIAL_VALUES, k, NaN) as number | undefined;

  if (isUndefined(v) || isNaN(v)) {
    throw new Error("Not a SPECIAL_VALUE: " + k);
  } else {
    return v;
  }
}
