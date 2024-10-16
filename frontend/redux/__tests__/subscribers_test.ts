import {
  unsavedCheck,
  stopThem,
} from "../subscribers";
import {
  buildResourceIndex,
} from "../../__test_support__/resource_index_builder";
import { SpecialStatus, TaggedWebAppConfig } from "farmbot";
import { fakeState } from "../../__test_support__/fake_state";
import { fakeSequence } from "../../__test_support__/fake_state/resources";
import { betterCompact } from "../../util";
import { WebAppConfig } from "farmbot/dist/resources/configs/web_app";

describe("unsavedCheck", () => {
  beforeEach(() => {
    localStorage.setItem("session", "YES");
    window.addEventListener = jest.fn();
    window.removeEventListener = jest.fn();
  });

  function setItUp(
    dirty: Record<"seqDirty" | "otherDirty", boolean>,
    body: Partial<WebAppConfig> | undefined,
  ) {
    const status = (isDirty: boolean) =>
      isDirty ? SpecialStatus.DIRTY : SpecialStatus.SAVED;
    const configStatus = status(dirty.otherDirty);
    const sequenceStatus = status(dirty.seqDirty);

    const config: TaggedWebAppConfig = {
      kind: "WebAppConfig",
      uuid: "NOT SET HERE!",
      specialStatus: configStatus,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      body: (body as any)
    };
    const output = fakeState();
    const sequence = fakeSequence();
    const resources = betterCompact([sequence, body ? config : undefined]);
    output.resources = buildResourceIndex(resources);
    // `buildResourceIndex` clears specialStatus. Set it again:
    const configUuid = Object.keys(output.resources.index.all)
      .filter(r => r.includes("WebAppConfig"))[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (output.resources.index.references[configUuid] || {} as any)
      .specialStatus = configStatus;
    const sequenceUuid = Object.keys(output.resources.index.all)
      .filter(r => r.includes("Sequence"))[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (output.resources.index.references[sequenceUuid] || {} as any)
      .specialStatus = sequenceStatus;
    return output;
  }

  it("does nothing when logged out", () => {
    localStorage.removeItem("session");
    unsavedCheck(setItUp(
      { seqDirty: true, otherDirty: true },
      { discard_unsaved: false, discard_unsaved_sequences: false }));
    expect(window.removeEventListener).toHaveBeenCalled();
  });

  it("doesn't stop users if work is saved", () => {
    unsavedCheck(setItUp(
      { seqDirty: false, otherDirty: false },
      { discard_unsaved: false, discard_unsaved_sequences: false }));
    expect(window.removeEventListener).toHaveBeenCalled();
  });

  it("stops users if they have unsaved work without config", () => {
    unsavedCheck(setItUp({ seqDirty: true, otherDirty: true }, undefined));
    expect(window.addEventListener).toHaveBeenCalled();
  });

  it("doesn't stop users if they want to discard all unsaved work", () => {
    unsavedCheck(setItUp(
      { seqDirty: true, otherDirty: true },
      { discard_unsaved: true, discard_unsaved_sequences: false }));
    expect(window.removeEventListener).toHaveBeenCalled();
  });

  it("stops users if they have unsaved work other than sequences", () => {
    unsavedCheck(setItUp(
      { seqDirty: false, otherDirty: true },
      { discard_unsaved: false, discard_unsaved_sequences: true }));
    expect(window.addEventListener).toHaveBeenCalled();
  });

  it("doesn't stop users if discard unsaved sequences is enabled", () => {
    unsavedCheck(setItUp(
      { seqDirty: true, otherDirty: true },
      { discard_unsaved: false, discard_unsaved_sequences: true }));
    expect(window.removeEventListener).toHaveBeenCalled();
  });

  it("stops users with unsaved sequences", () => {
    unsavedCheck(setItUp(
      { seqDirty: true, otherDirty: false },
      { discard_unsaved: false, discard_unsaved_sequences: false }));
    expect(window.addEventListener).toHaveBeenCalled();
  });
});

describe("stopThem()", () => {
  it("indicates unsaved changes", () => {
    const e = { preventDefault: jest.fn() } as unknown as BeforeUnloadEvent;
    expect(stopThem(e)).toEqual("You have unsaved work.");
    expect(e.preventDefault).toHaveBeenCalled();
  });
});
