jest.mock("../../open_farm/cached_crop", () => ({
  maybeGetCachedPlantIcon: jest.fn(),
  setImgSrc: jest.fn(),
}));

jest.mock("../../farm_designer/map/actions", () => ({
  setHoveredPlant: jest.fn(),
}));
jest.mock("../actions", () => ({ overwriteGroup: jest.fn() }));

jest.mock("../../history", () => ({ push: jest.fn() }));

import React from "react";
import {
  PointGroupItem, PointGroupItemProps, genericPointIcon,
  genericWeedIcon,
} from "../point_group_item";
import { shallow, mount } from "enzyme";
import {
  fakePlant, fakePointGroup, fakePoint, fakeToolSlot, fakeWeed, fakeTool,
  fakePlantTemplate,
} from "../../__test_support__/fake_state/resources";
import {
  maybeGetCachedPlantIcon, setImgSrc,
} from "../../open_farm/cached_crop";
import { setHoveredPlant } from "../../farm_designer/map/actions";
import { cloneDeep } from "lodash";
import { imgEvent } from "../../__test_support__/fake_html_events";
import { error } from "../../toast/toast";
import { svgToUrl } from "../../open_farm/icons";
import { overwriteGroup } from "../actions";
import { mockDispatch } from "../../__test_support__/fake_dispatch";
import { fakeToolTransformProps } from "../../__test_support__/fake_tool_info";
import { FilePath, Path } from "../../internal_urls";
import { push } from "../../history";

describe("<PointGroupItem/>", () => {
  const fakeProps = (): PointGroupItemProps => ({
    dispatch: mockDispatch(),
    point: fakePlant(),
    group: fakePointGroup(),
    hovered: true,
    tools: [],
    toolTransformProps: fakeToolTransformProps(),
  });

  it("renders", () => {
    const p = fakeProps();
    const el = shallow<PointGroupItem>(<PointGroupItem {...p} />);
    const i = el.instance();
    expect(el.first().prop("onMouseEnter")).toEqual(i.enter);
    expect(el.first().prop("onMouseLeave")).toEqual(i.leave);
    expect(el.first().prop("onClick")).toEqual(i.click);
  });

  it("fetches plant icon", async () => {
    const p = fakeProps();
    p.point = fakePlant();
    const i = new PointGroupItem(p);
    const fakeImgEvent = imgEvent();
    await i.maybeGetCachedIcon(fakeImgEvent);
    const slug = i.props.point.kind == "Point" &&
      i.props.point.body.pointer_type === "Plant"
      ? i.props.point.body.openfarm_slug
      : "slug";
    expect(maybeGetCachedPlantIcon)
      .toHaveBeenCalledWith(slug, expect.any(Object), expect.any(Function));
    expect(setImgSrc).not.toHaveBeenCalled();
  });

  it("doesn't fetch non-plant icon", async () => {
    const p = fakeProps();
    p.point = fakeWeed();
    const i = new PointGroupItem(p);
    const fakeImgEvent = imgEvent();
    await i.maybeGetCachedIcon(fakeImgEvent);
    expect(maybeGetCachedPlantIcon).not.toHaveBeenCalled();
    expect(setImgSrc).not.toHaveBeenCalled();
  });

  it("sets icon in state", () => {
    const i = new PointGroupItem(fakeProps());
    i.setState = jest.fn();
    i.setIconState("fake icon");
    expect(i.setState).toHaveBeenCalledWith({ icon: "fake icon" });
  });

  it("displays default plant icon", () => {
    const p = fakeProps();
    p.point = fakePlant();
    const wrapper = mount<PointGroupItem>(<PointGroupItem {...p} />);
    expect(wrapper.find("img").props().src).toEqual(FilePath.DEFAULT_ICON);
  });

  it("displays default plant template icon", () => {
    const p = fakeProps();
    p.point = fakePlantTemplate();
    const wrapper = mount<PointGroupItem>(<PointGroupItem {...p} />);
    expect(wrapper.find("img").props().src).toEqual(FilePath.DEFAULT_ICON);
  });

  it("displays point icon", () => {
    const p = fakeProps();
    p.point = fakePoint();
    const wrapper = mount<PointGroupItem>(<PointGroupItem {...p} />);
    expect(wrapper.find("img").props().src).toEqual(
      svgToUrl(genericPointIcon(undefined)));
  });

  it("displays weed icon", () => {
    const p = fakeProps();
    p.point = fakeWeed();
    p.point.body.meta.color = undefined;
    const wrapper = mount<PointGroupItem>(<PointGroupItem {...p} />);
    expect(wrapper.find("img").first().props().src)
      .toEqual(FilePath.DEFAULT_WEED_ICON);
    expect(wrapper.find("img").last().props().src).toEqual(
      svgToUrl(genericWeedIcon(undefined)));
    expect(wrapper.find(".slot-icon").length).toEqual(0);
  });

  it("displays tool slot icon", () => {
    const p = fakeProps();
    p.point = fakeToolSlot();
    const wrapper = mount<PointGroupItem>(<PointGroupItem {...p} />);
    expect(wrapper.find("img").props().src).toEqual(
      svgToUrl("<svg xmlns='http://www.w3.org/2000/svg'></svg>"));
    expect(wrapper.find(".slot-icon").length).toEqual(1);
  });

  it("displays named tool slot icon", () => {
    const p = fakeProps();
    const tool = fakeTool();
    tool.body.id = 1;
    tool.body.name = "fake tool";
    p.tools = [tool];
    const toolSlot = fakeToolSlot();
    toolSlot.body.tool_id = 1;
    p.point = toolSlot;
    const wrapper = mount<PointGroupItem>(<PointGroupItem {...p} />);
    expect(wrapper.find("img").props().src).toEqual(
      svgToUrl("<svg xmlns='http://www.w3.org/2000/svg'></svg>"));
    expect(wrapper.find(".slot-icon").length).toEqual(1);
  });

  it("handles mouse enter", () => {
    const i = new PointGroupItem(fakeProps());
    i.state.icon = "X";
    i.enter();
    expect(i.props.dispatch).toHaveBeenCalledTimes(1);
    expect(setHoveredPlant).toHaveBeenCalledWith(i.props.point.uuid, "X");
  });

  it("handles mouse enter: no action", () => {
    const p = fakeProps();
    p.dispatch = undefined;
    const i = new PointGroupItem(p);
    i.state.icon = "X";
    i.enter();
    expect(setHoveredPlant).not.toHaveBeenCalled();
  });

  it("handles mouse exit", () => {
    const i = new PointGroupItem(fakeProps());
    i.state.icon = "X";
    i.leave();
    expect(i.props.dispatch).toHaveBeenCalledTimes(1);
    expect(setHoveredPlant).toHaveBeenCalledWith(undefined);
  });

  it("handles mouse exit: no action", () => {
    const p = fakeProps();
    p.dispatch = undefined;
    const i = new PointGroupItem(p);
    i.state.icon = "X";
    i.leave();
    expect(setHoveredPlant).not.toHaveBeenCalled();
  });

  it("handles clicks", () => {
    const p = fakeProps();
    p.point.body.id = 1;
    p.group && (p.group.body.point_ids = [1]);
    const i = new PointGroupItem(p);
    i.click();
    expect(i.props.dispatch).toHaveBeenCalledTimes(2);
    const expectedGroupBody = cloneDeep(p.group?.body || { point_ids: [] });
    expectedGroupBody.point_ids = [];
    expect(overwriteGroup).toHaveBeenCalledWith(p.group, expectedGroupBody);
    expect(setHoveredPlant).toHaveBeenCalledWith(undefined);
  });

  it("handles clicks with no id", () => {
    const p = fakeProps();
    p.point.body.id = 0;
    p.group && (p.group.body.point_ids = [0]);
    const i = new PointGroupItem(p);
    i.click();
    expect(i.props.dispatch).toHaveBeenCalledTimes(2);
    const expectedGroupBody = cloneDeep(p.group?.body || { point_ids: [] });
    expectedGroupBody.point_ids = [];
    expect(overwriteGroup).toHaveBeenCalledWith(p.group, expectedGroupBody);
    expect(setHoveredPlant).toHaveBeenCalledWith(undefined);
  });

  it("errors on click", () => {
    const p = fakeProps();
    p.point.body.id = 1;
    p.group && (p.group.body.point_ids = []);
    const i = new PointGroupItem(p);
    i.click();
    expect(i.props.dispatch).not.toHaveBeenCalled();
    expect(overwriteGroup).not.toHaveBeenCalled();
    expect(setHoveredPlant).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(
      "Cannot remove points selected by filters.");
  });

  it("handles clicks: no action", () => {
    const p = fakeProps();
    p.point.body.id = 1;
    p.group = undefined;
    p.dispatch = undefined;
    const i = new PointGroupItem(p);
    i.click();
    expect(overwriteGroup).not.toHaveBeenCalled();
    expect(setHoveredPlant).not.toHaveBeenCalled();
  });

  it("handles clicks: navigates", () => {
    const p = fakeProps();
    p.point.body.id = 1;
    p.group = undefined;
    p.dispatch = undefined;
    p.navigate = true;
    const i = new PointGroupItem(p);
    i.click();
    expect(overwriteGroup).not.toHaveBeenCalled();
    expect(setHoveredPlant).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith(Path.plants(1));
  });
});
