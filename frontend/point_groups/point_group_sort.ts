import { PointGroupSortType } from "farmbot/dist/resources/api_resources";
import { t } from "../i18next_wrapper";
import { shuffle, sortBy } from "lodash";
import { TaggedPoint } from "farmbot";
import { alternating, nn } from "./paths";

export const sortOptionsTable = (): Record<PointGroupSortType, string> => ({
  random: t("Random Order"),
  xy_ascending: t("X/Y, Ascending"),
  xy_descending: t("X/Y, Descending"),
  yx_ascending: t("Y/X, Ascending"),
  yx_descending: t("Y/X, Descending"),
  xy_alternating: t("X/Y Alternating"),
  yx_alternating: t("Y/X Alternating"),
  nn: t("Optimized"),
}); // Typechecker will remind us when this needs an update. Don't simplify - RC

type Sorter = (p: TaggedPoint[]) => TaggedPoint[];
type SortDictionary = Record<PointGroupSortType, Sorter>;

export const SORT_OPTIONS: SortDictionary = {
  random(points) {
    return shuffle(points);
  },
  xy_ascending(points) {
    return sortBy(points, ["body.x", "body.y"]);
  },
  xy_descending(points) {
    return sortBy(points, ["body.x", "body.y"]).reverse();
  },
  yx_ascending(points) {
    return sortBy(points, ["body.y", "body.x"]);
  },
  yx_descending(points) {
    return sortBy(points, ["body.y", "body.x"]).reverse();
  },
  xy_alternating(points) {
    return alternating(points, "xy");
  },
  yx_alternating(points) {
    return alternating(points, "yx");
  },
  nn(points) {
    return nn(points) as TaggedPoint[];
  },
};
export const sortGroupBy =
  (st: PointGroupSortType, p: TaggedPoint[]) => SORT_OPTIONS[st](p);
