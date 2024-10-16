jest.mock("../../step_tiles", () => ({
  splice: jest.fn(),
  remove: jest.fn(),
  move: jest.fn(),
}));

import React from "react";
import { mount, shallow } from "enzyme";
import { StepIconGroup, StepIconBarProps } from "../step_icon_group";
import { fakeSequence } from "../../../__test_support__/fake_state/resources";
import { splice, remove, move } from "../../step_tiles";
import { push } from "../../../history";
import { Path } from "../../../internal_urls";
import { emptyState } from "../../../resources/reducer";
import { StateToggleKey } from "../step_wrapper";

describe("<StepIconGroup />", () => {
  const fakeProps = (): StepIconBarProps => ({
    index: 0,
    dispatch: jest.fn(),
    readOnly: false,
    step: { kind: "wait", args: { milliseconds: 100 } },
    sequence: fakeSequence(),
    executeSequenceName: undefined,
    viewRaw: undefined,
    toggleViewRaw: undefined,
    links: undefined,
    helpText: "helpful text",
    confirmStepDeletion: false,
    isProcessing: false,
    togglePrompt: jest.fn(),
    sequencesState: emptyState().consumers.sequences,
  });

  it("renders", () => {
    const wrapper = mount(<StepIconGroup {...fakeProps()} />);
    expect(wrapper.find("i").length).toEqual(4);
  });

  it("renders monaco editor enabled", () => {
    const p = fakeProps();
    p.stateToggles = {
      [StateToggleKey.monacoEditor]: { enabled: true, toggle: () => false }
    };
    const wrapper = mount(<StepIconGroup {...p} />);
    expect(wrapper.find(".fa-font").hasClass("enabled")).toEqual(true);
  });

  it("renders monaco editor disabled", () => {
    const p = fakeProps();
    p.stateToggles = {
      [StateToggleKey.monacoEditor]: { enabled: false, toggle: () => true }
    };
    const wrapper = mount(<StepIconGroup {...p} />);
    expect(wrapper.find(".fa-font").hasClass("enabled")).toEqual(false);
  });

  it("renders expanded editor enabled", () => {
    const p = fakeProps();
    p.stateToggles = {
      [StateToggleKey.luaExpanded]: { enabled: true, toggle: () => false }
    };
    const wrapper = mount(<StepIconGroup {...p} />);
    expect(wrapper.find(".fa-expand").length).toEqual(0);
    expect(wrapper.find(".fa-compress").length).toEqual(1);
  });

  it("renders expanded editor disabled", () => {
    const p = fakeProps();
    p.stateToggles = {
      [StateToggleKey.luaExpanded]: { enabled: false, toggle: () => true }
    };
    const wrapper = mount(<StepIconGroup {...p} />);
    expect(wrapper.find(".fa-expand").length).toEqual(1);
    expect(wrapper.find(".fa-compress").length).toEqual(0);
  });

  it("renders celery script view enabled", () => {
    const p = fakeProps();
    p.viewRaw = true;
    p.toggleViewRaw = () => false;
    const wrapper = mount(<StepIconGroup {...p} />);
    expect(wrapper.find(".fa-code").hasClass("enabled")).toEqual(true);
  });

  it("renders prompt", () => {
    const p = fakeProps();
    p.step.kind = "lua";
    p.readOnly = false;
    p.isProcessing = false;
    const wrapper = mount(<StepIconGroup {...p} />);
    expect(wrapper.find(".fa-magic").length).toEqual(1);
  });

  it("renders celery script view disabled", () => {
    const p = fakeProps();
    p.viewRaw = false;
    p.toggleViewRaw = () => true;
    const wrapper = mount(<StepIconGroup {...p} />);
    expect(wrapper.find(".fa-code").hasClass("enabled")).toEqual(false);
  });

  it("deletes step", () => {
    const wrapper = mount(<StepIconGroup {...fakeProps()} />);
    wrapper.find("i").at(1).simulate("click");
    expect(remove).toHaveBeenCalledWith(expect.objectContaining({ index: 0 }));
  });

  it("duplicates step", () => {
    const wrapper = mount(<StepIconGroup {...fakeProps()} />);
    wrapper.find("i").at(2).simulate("click");
    expect(splice).toHaveBeenCalledWith(expect.objectContaining({
      index: 0,
      step: fakeProps().step
    }));
  });

  it("moves step", () => {
    const wrapper = shallow(<StepIconGroup {...fakeProps()} />);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (wrapper.find("StepUpDownButtonPopover").props() as any).onMove(-1)();
    expect(move).toHaveBeenCalledWith(expect.objectContaining({
      from: 0,
      to: 0,
      step: fakeProps().step
    }));
  });

  it("navigates to sequence", () => {
    const p = fakeProps();
    p.executeSequenceName = "My Sequence";
    const wrapper = mount(<StepIconGroup {...p} />);
    wrapper.find(".fa-external-link").simulate("click");
    expect(push).toHaveBeenCalledWith(Path.sequences("My_Sequence"));
  });
});
