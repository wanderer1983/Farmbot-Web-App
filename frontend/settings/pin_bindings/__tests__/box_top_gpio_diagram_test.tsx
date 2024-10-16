jest.mock("../../../devices/actions", () => ({
  execSequence: jest.fn(),
  sendRPC: jest.fn(),
}));

import React from "react";
import { mount } from "enzyme";
import {
  BoxTopButtons,
  BoxTopGpioDiagram,
  BoxTopGpioDiagramProps,
} from "../box_top_gpio_diagram";
import {
  buildResourceIndex,
} from "../../../__test_support__/resource_index_builder";
import {
  fakePinBinding, fakeSequence,
} from "../../../__test_support__/fake_state/resources";
import { execSequence, sendRPC } from "../../../devices/actions";
import {
  PinBindingSpecialAction,
  PinBindingType, SpecialPinBinding, StandardPinBinding,
} from "farmbot/dist/resources/api_resources";
import { BoxTopBaseProps } from "../interfaces";
import { bot } from "../../../__test_support__/fake_state/bot";

describe("<BoxTopGpioDiagram />", () => {
  const fakeProps = (): BoxTopGpioDiagramProps => ({
    boundPins: [16],
    setSelectedPin: jest.fn(),
    selectedPin: undefined,
    firmwareHardware: undefined,
  });

  it("renders", () => {
    const p = fakeProps();
    p.boundPins = undefined;
    const wrapper = mount(<BoxTopGpioDiagram {...p} />);
    expect(wrapper.find("circle").length).toEqual(18);
  });

  it("renders: express", () => {
    const p = fakeProps();
    p.firmwareHardware = "express_k10";
    const wrapper = mount(<BoxTopGpioDiagram {...p} />);
    expect(wrapper.find("circle").length).toEqual(8);
  });

  it("pin hover", () => {
    const wrapper = mount<BoxTopGpioDiagram>(<BoxTopGpioDiagram
      {...fakeProps()} />);
    wrapper.find("#button").at(0).simulate("mouseEnter");
    expect(wrapper.instance().state.hoveredPin).toEqual(20);
  });

  it("doesn't hover pin", () => {
    const wrapper = mount<BoxTopGpioDiagram>(<BoxTopGpioDiagram
      {...fakeProps()} />);
    wrapper.find("#button").at(6).simulate("mouseEnter");
    expect(wrapper.instance().state.hoveredPin).toEqual(undefined);
  });

  it("pin click", () => {
    const p = fakeProps();
    const wrapper = mount(<BoxTopGpioDiagram {...p} />);
    wrapper.find("#button").at(0).simulate("click");
    expect(p.setSelectedPin).toHaveBeenCalledWith(20);
  });
});

describe("<BoxTopButtons />", () => {
  const fakeProps = (): BoxTopBaseProps => {
    const pinBinding = fakePinBinding();
    pinBinding.body.pin_num = 20;
    pinBinding.body.binding_type = PinBindingType.standard;
    (pinBinding.body as StandardPinBinding).sequence_id = 1;
    const sequence = fakeSequence();
    sequence.body.id = 1;
    sequence.body.name = "my sequence";
    const resources = buildResourceIndex([sequence, pinBinding]).index;
    bot.hardware.informational_settings.sync_status = "synced";
    bot.hardware.informational_settings.locked = false;
    return {
      firmwareHardware: "arduino",
      isEditing: true,
      dispatch: jest.fn(),
      resources,
      botOnline: true,
      bot,
    };
  };

  it("renders: genesis", () => {
    const p = fakeProps();
    p.firmwareHardware = "arduino";
    const wrapper = mount(<BoxTopButtons {...p} />);
    expect(wrapper.find("#button").length).toEqual(9);
  });

  it("renders: express", () => {
    const p = fakeProps();
    p.firmwareHardware = "express_k10";
    const wrapper = mount(<BoxTopButtons {...p} />);
    expect(wrapper.find("#button").length).toEqual(1);
  });

  it("renders: not editing", () => {
    const p = fakeProps();
    p.isEditing = false;
    const wrapper = mount(<BoxTopButtons {...p} />);
    expect(wrapper.text().toLowerCase()).toContain("my sequence");
    expect(wrapper.find(".fast-blink").length).toEqual(0);
    expect(wrapper.find(".slow-blink").length).toEqual(0);
  });

  it("renders: blinking", () => {
    const p = fakeProps();
    p.bot.hardware.informational_settings.sync_status = "syncing";
    p.bot.hardware.informational_settings.locked = true;
    const wrapper = mount(<BoxTopButtons {...p} />);
    expect(wrapper.find(".fast-blink").length).toEqual(1);
    expect(wrapper.find(".slow-blink").length).toEqual(1);
  });

  it("executes sequence", () => {
    const wrapper = mount(<BoxTopButtons {...fakeProps()} />);
    wrapper.find("#button").first().simulate("click");
    expect(execSequence).toHaveBeenCalledWith(1);
  });

  it("doesn't execute sequence", () => {
    const p = fakeProps();
    p.botOnline = false;
    const wrapper = mount(<BoxTopButtons {...p} />);
    wrapper.find("#button").first().simulate("click");
    expect(execSequence).not.toHaveBeenCalled();
  });

  it("executes action", () => {
    const p = fakeProps();
    const pinBinding = fakePinBinding();
    pinBinding.body.pin_num = 20;
    pinBinding.body.binding_type = PinBindingType.special;
    (pinBinding.body as SpecialPinBinding).special_action =
      PinBindingSpecialAction.sync;
    p.resources = buildResourceIndex([pinBinding]).index;
    const wrapper = mount(<BoxTopButtons {...p} />);
    wrapper.find("#button").first().simulate("click");
    expect(sendRPC).toHaveBeenCalledWith({ kind: "sync", args: {} });
  });

  it("hovers", () => {
    const wrapper = mount<BoxTopButtons>(<BoxTopButtons {...fakeProps()} />);
    expect(wrapper.state().hoveredPin).toEqual(undefined);
    wrapper.find("#button").first().simulate("mouseEnter");
    expect(wrapper.state().hoveredPin).toEqual(20);
  });

  it("un-hovers", () => {
    const wrapper = mount<BoxTopButtons>(<BoxTopButtons {...fakeProps()} />);
    wrapper.setState({ hoveredPin: 20 });
    expect(wrapper.state().hoveredPin).toEqual(20);
    wrapper.find("#button").first().simulate("mouseLeave");
    expect(wrapper.state().hoveredPin).toEqual(undefined);
  });
});
