import { Path } from "../../../../../internal_urls";
let mockPath = Path.mock(Path.plants());
jest.mock("../../../../../history", () => ({
  push: jest.fn(),
  getPathArray: jest.fn(() => { return mockPath.split("/"); })
}));

import React from "react";
import { ToolSlotLayer, ToolSlotLayerProps } from "../tool_slot_layer";
import {
  fakeMapTransformProps,
} from "../../../../../__test_support__/map_transform_props";
import { fakeResource } from "../../../../../__test_support__/fake_resource";
import { shallow } from "enzyme";
import { push } from "../../../../../history";
import { ToolSlotPointer } from "farmbot/dist/resources/api_resources";
import { TaggedToolSlotPointer } from "farmbot";
import { ToolSlotPoint } from "../tool_slot_point";

describe("<ToolSlotLayer/>", () => {
  function fakeProps(): ToolSlotLayerProps {
    const ts: ToolSlotPointer = {
      pointer_type: "ToolSlot",
      tool_id: undefined,
      name: "Name",
      x: 1,
      y: 2,
      z: 3,
      meta: {},
      pullout_direction: 0,
      gantry_mounted: false,
    };
    const toolSlot: TaggedToolSlotPointer = fakeResource("Point", ts);
    return {
      visible: false,
      slots: [{ toolSlot, tool: undefined }],
      botPositionX: undefined,
      mapTransformProps: fakeMapTransformProps(),
      dispatch: jest.fn(),
      hoveredToolSlot: undefined,
      interactions: true,
      currentPoint: undefined,
      animate: false,
    };
  }
  it("toggles visibility off", () => {
    const result = shallow(<ToolSlotLayer {...fakeProps()} />);
    expect(result.find(ToolSlotPoint).length).toEqual(0);
  });

  it("toggles visibility on", () => {
    const p = fakeProps();
    p.visible = true;
    const result = shallow(<ToolSlotLayer {...p} />);
    expect(result.find(ToolSlotPoint).length).toEqual(1);
  });

  it("doesn't navigate to tools page", async () => {
    mockPath = Path.mock(Path.plants(1));
    const p = fakeProps();
    const wrapper = shallow(<ToolSlotLayer {...p} />);
    const tools = wrapper.find("g").first();
    await tools.simulate("click");
    expect(push).not.toHaveBeenCalled();
  });

  it("is in clickable mode", () => {
    mockPath = Path.mock(Path.cropSearch("mint/add"));
    const p = fakeProps();
    p.interactions = true;
    const wrapper = shallow(<ToolSlotLayer {...p} />);
    expect(wrapper.find("g").props().style)
      .toEqual({ cursor: "pointer" });
  });

  it("is in non-clickable mode", () => {
    mockPath = Path.mock(Path.cropSearch("mint/add"));
    const p = fakeProps();
    p.interactions = false;
    const wrapper = shallow(<ToolSlotLayer {...p} />);
    expect(wrapper.find("g").props().style)
      .toEqual({ pointerEvents: "none" });
  });
});
