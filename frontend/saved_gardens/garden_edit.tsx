import React from "react";
import { GardenViewButtonProps, EditGardenProps } from "./interfaces";
import { openOrCloseGarden, applyGarden, destroySavedGarden } from "./actions";
import { error } from "../toast/toast";
import { trim } from "../util";
import { BlurableInput, Row } from "../ui";
import { edit, save } from "../api/crud";
import { connect } from "react-redux";
import {
  selectAllPlantPointers, maybeFindSavedGardenById, selectAllPlantTemplates,
} from "../resources/selectors";
import { Everything } from "../interfaces";
import {
  DesignerPanel, DesignerPanelHeader, DesignerPanelContent,
} from "../farm_designer/designer_panel";
import { push } from "../history";
import { isNumber, take } from "lodash";
import { ResourceIndex } from "../resources/interfaces";
import { t } from "../i18next_wrapper";
import { Panel } from "../farm_designer/panel_header";
import { Path } from "../internal_urls";
import { PointGroupItem } from "../point_groups/point_group_item";
import {
  calcMaxCount, MoreIndicatorIcon,
} from "../point_groups/criteria/component";

/** Open or close a SavedGarden. */
const GardenViewButton = (props: GardenViewButtonProps) => {
  const { dispatch, savedGardenId, gardenIsOpen } = props;
  const onClick = openOrCloseGarden({ savedGardenId, gardenIsOpen, dispatch });
  const btnText = gardenIsOpen
    ? t("exit")
    : t("view");
  return <button
    className={`fb-button ${gardenIsOpen ? "gray" : "yellow"}`}
    title={btnText}
    onClick={onClick}>
    {btnText}
  </button>;
};

/** Apply a SavedGarden after checking that the current garden is empty. */
const ApplyGardenButton =
  (props: { plantPointerCount: number, gardenId: number, dispatch: Function }) =>
    <button
      className="fb-button green"
      title={t("apply garden")}
      onClick={() => props.plantPointerCount > 0
        ? error(trim(`${t("Please clear current garden first.")}
        (${props.plantPointerCount} ${t("plants")})`))
        : props.dispatch(applyGarden(props.gardenId))}>
      {t("apply")}
    </button>;

const DestroyGardenButton =
  (props: { dispatch: Function, gardenUuid: string }) =>
    <i className={"fa fa-trash fb-icon-button"}
      title={t("delete garden")}
      onClick={() => props.dispatch(destroySavedGarden(props.gardenUuid))} />;

const findSavedGardenByUrl = (ri: ResourceIndex) => {
  const id = Path.getSlug(Path.savedGardens());
  const num = parseInt(id, 10);
  if (isNumber(num) && !isNaN(num)) {
    return maybeFindSavedGardenById(ri, num);
  }
};

export const mapStateToProps = (props: Everything): EditGardenProps => {
  const { openedSavedGarden } = props.resources.consumers.farm_designer;
  const savedGarden = findSavedGardenByUrl(props.resources.index);
  return {
    savedGarden,
    gardenIsOpen: !!(savedGarden?.body.id === openedSavedGarden),
    dispatch: props.dispatch,
    plantPointerCount: selectAllPlantPointers(props.resources.index).length,
    gardenPlants: selectAllPlantTemplates(props.resources.index)
      .filter(p => p.body.saved_garden_id == savedGarden?.body.id),
  };
};

interface EditGardenState {
  notes: string;
  expand: boolean;
}

export class RawEditGarden
  extends React.Component<EditGardenProps, EditGardenState> {
  state: EditGardenState = {
    notes: this.props.savedGarden?.body.notes || "",
    expand: false,
  };

  toggleExpand = () => this.setState({ expand: !this.state.expand });

  render() {
    const { savedGarden } = this.props;
    const gardensPath = Path.savedGardens();
    const plantsPath = Path.plants();
    !savedGarden && Path.startsWith(gardensPath) && push(plantsPath);
    const maxCount = this.state.expand ? 1000 : calcMaxCount(3);
    return <DesignerPanel panelName={"saved-garden-edit"}
      panel={Panel.SavedGardens}>
      <DesignerPanelHeader
        panelName={"saved-garden"}
        panel={Panel.SavedGardens}
        title={t("Edit garden")}
        backTo={plantsPath}>
        {savedGarden &&
          <div className={"buttons"}>
            <ApplyGardenButton
              dispatch={this.props.dispatch}
              plantPointerCount={this.props.plantPointerCount}
              gardenId={savedGarden.body.id || -1} />
            <DestroyGardenButton
              dispatch={this.props.dispatch}
              gardenUuid={savedGarden.uuid} />
            <GardenViewButton
              dispatch={this.props.dispatch}
              savedGardenId={savedGarden.body.id}
              gardenIsOpen={this.props.gardenIsOpen} />
          </div>}
      </DesignerPanelHeader>
      <DesignerPanelContent panelName={"saved-garden-edit"}>
        {savedGarden
          ? <div className={"saved-garden-content"}>
            <Row>
              <label>{t("name")}</label>
              <BlurableInput
                value={savedGarden.body.name || ""}
                onCommit={e => {
                  this.props.dispatch(edit(savedGarden, {
                    name: e.currentTarget.value
                  }));
                  this.props.dispatch(save(savedGarden.uuid));
                }} />
            </Row>
            <Row>
              <label>{t("notes")}</label>
              <textarea
                value={this.state.notes}
                onChange={e => this.setState({ notes: e.currentTarget.value })}
                onBlur={() => {
                  this.props.dispatch(edit(savedGarden, {
                    notes: this.state.notes
                  }));
                  this.props.dispatch(save(savedGarden.uuid));
                }} />
            </Row>
          </div>
          : <p>{t("Garden not found.")}</p>}
        <div className={"point-list-wrapper"}>
          {take(this.props.gardenPlants, maxCount).map(point =>
            <PointGroupItem key={point.uuid} point={point} />)}
          <MoreIndicatorIcon count={this.props.gardenPlants.length}
            maxCount={maxCount} onClick={this.toggleExpand} />
        </div>
      </DesignerPanelContent>
    </DesignerPanel>;
  }
}

export const EditGarden = connect(mapStateToProps)(RawEditGarden);
