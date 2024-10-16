jest.mock("axios", () => ({
  post: jest.fn(() => Promise.resolve()),
}));

jest.mock("../actions", () => ({
  snapshotGarden: jest.fn(),
  newSavedGarden: jest.fn(),
  copySavedGarden: jest.fn(),
}));

import React from "react";
import { mount, shallow } from "enzyme";
import { GardenSnapshotProps, GardenSnapshot } from "../garden_snapshot";
import { clickButton } from "../../__test_support__/helpers";
import { snapshotGarden, newSavedGarden, copySavedGarden } from "../actions";
import { fakeSavedGarden } from "../../__test_support__/fake_state/resources";

describe("<GardenSnapshot />", () => {
  const fakeProps = (): GardenSnapshotProps => ({
    currentSavedGarden: undefined,
    plantTemplates: [],
    dispatch: jest.fn(),
  });

  it("saves garden", () => {
    const wrapper = mount(<GardenSnapshot {...fakeProps()} />);
    clickButton(wrapper, 0, "snapshot current garden");
    expect(snapshotGarden).toHaveBeenCalledWith("", "");
  });

  it("copies saved garden", () => {
    const p = fakeProps();
    p.currentSavedGarden = fakeSavedGarden();
    const wrapper = mount(<GardenSnapshot {...p} />);
    clickButton(wrapper, 0, "snapshot current garden");
    expect(snapshotGarden).not.toHaveBeenCalled();
    expect(copySavedGarden).toHaveBeenCalledWith({
      newSGName: "",
      plantTemplates: [],
      savedGarden: p.currentSavedGarden
    });
  });

  it("changes name", () => {
    const wrapper = shallow<GardenSnapshot>(<GardenSnapshot {...fakeProps()} />);
    wrapper.find("input").first().simulate("change", {
      currentTarget: { value: "new name" }
    });
    expect(wrapper.instance().state.gardenName).toEqual("new name");
  });

  it("changes notes", () => {
    const wrapper = shallow<GardenSnapshot>(<GardenSnapshot {...fakeProps()} />);
    wrapper.find("textarea").first().simulate("change", {
      currentTarget: { value: "new notes" }
    });
    expect(wrapper.instance().state.gardenNotes).toEqual("new notes");
  });

  it("creates new garden", () => {
    const wrapper = shallow<GardenSnapshot>(<GardenSnapshot {...fakeProps()} />);
    wrapper.setState({ gardenName: "new saved garden" });
    wrapper.find("button").last().simulate("click");
    expect(newSavedGarden).toHaveBeenCalledWith("new saved garden", "");
    expect(wrapper.instance().state.gardenName).toEqual("");
  });
});
