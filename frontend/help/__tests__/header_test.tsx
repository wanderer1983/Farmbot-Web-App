let mockIsMobile = false;
jest.mock("../../screen_size", () => ({
  isMobile: () => mockIsMobile,
}));

import { Path } from "../../internal_urls";
let mockPath = Path.mock(Path.designer());
jest.mock("../../history", () => ({
  push: jest.fn(),
  getPathArray: () => mockPath.split("/"),
}));

jest.mock("../../hotkeys", () => ({
  toggleHotkeyHelpOverlay: jest.fn(() => jest.fn()),
}));

import React from "react";
import { mount } from "enzyme";
import { HelpHeader } from "../header";
import { push } from "../../history";
import { toggleHotkeyHelpOverlay } from "../../hotkeys";

describe("<HelpHeader />", () => {
  beforeEach(() => {
    mockIsMobile = false;
  });

  it.each<[string, string]>([
    ["software documentation", Path.designer()],
    ["software documentation", Path.help()],
    ["developer documentation", Path.developer()],
    ["genesis documentation", Path.designer("genesis")],
    ["express documentation", Path.designer("express")],
    ["business documentation", Path.designer("business")],
    ["education documentation", Path.designer("education")],
    ["take a tour", Path.tours()],
    ["get help", Path.support()],
  ])("renders %s panel", (title, path) => {
    mockPath = Path.mock(path);
    const wrapper = mount(<HelpHeader />);
    expect(wrapper.text().toLowerCase()).toContain(title);
  });

  it("hides hotkeys menu item", () => {
    mockIsMobile = true;
    const wrapper = mount(<HelpHeader />);
    wrapper.find(".help-panel-header").simulate("click");
    expect(wrapper.text().toLowerCase()).not.toContain("hotkeys");
  });

  it("opens menu", () => {
    const wrapper = mount(<HelpHeader />);
    expect(wrapper.html()).toContain("fa-chevron-down");
    wrapper.find(".help-panel-header").simulate("click");
    expect(wrapper.html()).toContain("fa-chevron-up");
    expect(wrapper.text().toLowerCase()).toContain("hotkeys");
  });

  it("selects panel", () => {
    const wrapper = mount(<HelpHeader />);
    wrapper.find(".help-panel-header").simulate("click");
    wrapper.find("a").first().simulate("click");
    expect(push).toHaveBeenCalledWith(Path.support());
  });

  it("opens hotkeys", () => {
    const wrapper = mount(<HelpHeader />);
    wrapper.find(".help-panel-header").simulate("click");
    wrapper.find("a").last().simulate("click");
    expect(push).not.toHaveBeenCalled();
    expect(toggleHotkeyHelpOverlay).toHaveBeenCalled();
  });
});
