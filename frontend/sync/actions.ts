import axios from "axios";
import { API } from "../api";
import { Actions } from "../constants";
import { TaggedResource as TR, SpecialStatus } from "farmbot";
import { Session } from "../session";
import { arrayWrap, generateUuid } from "../resources/util";

export interface SyncBodyContents<T extends TR> {
  kind: T["kind"];
  body: T[];
}
export interface SyncResponse<T extends TR> {
  type: Actions.RESOURCE_READY;
  payload: SyncBodyContents<T>
}

export const resourceReady =
  <T extends TR>(kind: T["kind"], body: T | T[]): SyncResponse<T> => {
    return {
      type: Actions.RESOURCE_READY,
      payload: { kind, body: arrayWrap(body) }
    };
  };

export const newTaggedResource = <T extends TR>(kind: T["kind"],
  bodies: T["body"] | T["body"][],
  specialStatus = SpecialStatus.SAVED): T[] => {
  const arr = arrayWrap(bodies);
  return arr.map((body: T["body"]): T => {
    return {
      kind,
      body,
      uuid: generateUuid(body?.id, kind),
      specialStatus,
    } as T;
  });
};

export function syncFail(e: Error) {
  console.error("DATA SYNC ERROR!");
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  Session.clear() as never;
  throw e;
}

const download = (dispatch: Function) =>
  <T extends TR>(kind: T["kind"], url: string) => axios
    .get<T["body"] | T["body"][]>(url)
    .then(({ data }) => {
      dispatch(resourceReady(kind, newTaggedResource(kind, data)));
    }, syncFail);

// eslint-disable-next-line @typescript-eslint/require-await
export async function fetchSyncData(dispatch: Function) {
  const get = download(dispatch);
  /** Resources are placed into groups based on their dependencies.
   * For example, if:
   *  * a Regimen relies on a Sequence
   *  * a Sequence relies on a tool
   *  * a tool has no deps.
   * then they must be loaded in the order Regimen => Sequence => Tool to avoid
   * conflicts.
  */
  const group = {
    0: () => Promise.all<{}>([
      get("User", API.current.usersPath),
      get("Device", API.current.devicePath),
      get("FirmwareConfig", API.current.firmwareConfigPath),
      get("FarmwareEnv", API.current.farmwareEnvPath),
      get("FarmwareInstallation", API.current.farmwareInstallationPath),
      get("WebAppConfig", API.current.webAppConfigPath),
      get("SavedGarden", API.current.savedGardensPath),
      get("Curve", API.current.curvesPath),
    ]),
    1: () => Promise.all<{}>([
      get("PlantTemplate", API.current.plantTemplatePath),
      get("Peripheral", API.current.peripheralsPath),
      get("Point", API.current.allPointsPath),
      get("Sensor", API.current.sensorPath),
      get("Tool", API.current.toolsPath),
      get("Alert", API.current.alertPath),
      get("Folder", API.current.foldersPath),
    ]),
    2: () => Promise.all<{}>([
      get("SensorReading", API.current.sensorReadingPath),
      get("Sequence", API.current.sequencesPath),
      get("PointGroup", API.current.pointGroupsPath),
    ]),
    3: () => Promise.all<{}>([
      get("FbosConfig", API.current.fbosConfigPath),
      get("Regimen", API.current.regimensPath),
      get("PinBinding", API.current.pinBindingPath),
    ]),
    4: () => Promise.all<{}>([
      get("FarmEvent", API.current.farmEventsPath),
      get("Image", API.current.imagesPath),
      get("Log", API.current.filteredLogsPath),
      get("WebcamFeed", API.current.webcamFeedPath),
      get("WizardStepResult", API.current.wizardStepResultsPath),
      get("Telemetry", API.current.telemetryPath),
    ]),
  };
  const step = (num: keyof typeof group) => group[num];
  step(0)().then(step(1)).then(step(2)).then(step(3)).then(step(4)).catch(syncFail);
}
