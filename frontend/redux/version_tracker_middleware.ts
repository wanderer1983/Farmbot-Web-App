import { EnvName } from "./interfaces";
import { determineInstalledOsVersion, FbosVersionFallback } from "../util/index";
import { maybeGetDevice } from "../resources/selectors";
import { MW } from "./middlewares";
import { Everything } from "../interfaces";
import { Store, Action, Dispatch } from "redux";
import { createReminderFn } from "./upgrade_reminder";

const maybeRemindUserToUpdate = createReminderFn();

function getVersionFromState(state: Everything) {
  const device = maybeGetDevice(state.resources.index);
  const version = determineInstalledOsVersion(state.bot, device)
    || FbosVersionFallback.NULL;
  maybeRemindUserToUpdate(version);
  return version;
}

const fn: MW =
  (store: Store<Everything>) =>
    (dispatch: Dispatch<Action<string>>) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (action: any) => {
        const fbos = getVersionFromState(store.getState());
        window.Rollbar?.configure({ payload: { fbos } });
        return dispatch(action);
      };

const env: EnvName = "*";

export const versionChangeMiddleware = { env, fn };
