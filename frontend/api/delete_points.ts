import axios from "axios";
import { success, error } from "../toast/toast";
import { Thunk } from "../redux/interfaces";
import { API } from "./api";
import { Progress, ProgressCallback, trim } from "../util";
import { noop, chunk } from "lodash";
import { Point } from "farmbot/dist/resources/api_resources";
import { Actions } from "../constants";
import { t } from "../i18next_wrapper";

export function deletePoints(
  pointName: string,
  query: Partial<Point>,
  cb?: ProgressCallback): Thunk {
  // TODO: Generalize and add to api/crud.ts
  return async function (dispatch) {
    const URL = API.current.pointSearchPath;
    const resp = await axios.post<Point[]>(URL, query);
    const ids = resp.data.map(x => x.id);
    // If you delete too many points, you will violate the URL length
    // limitation of 2,083. Chunking helps fix that.
    const chunks = chunk(ids, 179 /* Prime numbers, why not? */);
    const prog = new Progress(chunks.length, cb || noop);
    prog.inc();
    const promises = chunks.map(function (c) {
      return axios
        .delete(API.current.pointsPath + c.join(","))
        .then(function (x) {
          prog.inc();
          return x;
        });
    });
    Promise
      .all(promises)
      .then(function () {
        dispatch({
          type: Actions.DELETE_POINT_OK,
          payload: ids
        });
        success(t("Deleted {{num}} {{points}}", {
          num: ids.length, points: pointName
        }));
        prog.finish();
      })
      .catch(function () {
        error(trim(`${t("Some {{points}} failed to delete.",
          { points: pointName })}
            ${t("Are they in use by sequences?")}`));
        prog.finish();
      });
  };
}

export const deletePointsByIds = (pointName: string, ids: number[]) =>
  Promise
    .all(chunk(ids, 100).map(c => axios
      .delete(API.current.pointsPath + c.join(","))))
    .then(() =>
      success(t("Deleted {{num}} {{points}}", {
        num: ids.length, points: pointName,
      })))
    .catch(() =>
      error(trim(`${t("Some {{points}} failed to delete.", { points: pointName })}
                  ${t("Are they in use by sequences?")}`)));
