import {
  semverCompare,
  SemverResult,
  createShouldDisplayFn,
  determineInstalledOsVersion,
  versionOK,
  MinVersionOverride,
} from "../version";
import { bot } from "../../__test_support__/fake_state/bot";
import { fakeDevice } from "../../__test_support__/resource_index_builder";
import { Feature, MinOsFeatureLookup } from "../../devices/interfaces";

describe("semver compare", () => {
  it("knows when RIGHT_IS_GREATER: numeric", () => {
    expect(semverCompare("3.1.6", "4.0.0"))
      .toBe(SemverResult.RIGHT_IS_GREATER);

    expect(semverCompare("2.1.6", "4.1.0"))
      .toBe(SemverResult.RIGHT_IS_GREATER);

    expect(semverCompare("4.1.6", "5.1.9"))
      .toBe(SemverResult.RIGHT_IS_GREATER);

    expect(semverCompare("1.1.9", "2.0.2"))
      .toBe(SemverResult.RIGHT_IS_GREATER);
  });

  it("knows when RIGHT_IS_GREATER: undefined", () => {
    expect(semverCompare("", "1.0.0"))
      .toBe(SemverResult.RIGHT_IS_GREATER);

    expect(semverCompare("x.y.z", "1.0.0"))
      .toBe(SemverResult.RIGHT_IS_GREATER);
  });

  it("knows when RIGHT_IS_GREATER: pre-release identifiers", () => {
    expect(semverCompare("6.1.0", "6.1.1-beta"))
      .toBe(SemverResult.RIGHT_IS_GREATER);

    expect(semverCompare("1.1.1-beta", "1.1.1"))
      .toBe(SemverResult.RIGHT_IS_GREATER);

    expect(semverCompare("1.1.1-rc2", "1.1.1-rc11"))
      .toBe(SemverResult.RIGHT_IS_GREATER);

    expect(semverCompare("1.1.1-rc1", "1.1.1"))
      .toBe(SemverResult.RIGHT_IS_GREATER);

    expect(semverCompare("1.1.1-rc2", "1.1.2-rc1"))
      .toBe(SemverResult.RIGHT_IS_GREATER);
  });

  it("knows when LEFT_IS_GREATER: numeric", () => {
    expect(semverCompare("4.0.0", "3.1.6"))
      .toBe(SemverResult.LEFT_IS_GREATER);

    expect(semverCompare("4.1.0", "2.1.6"))
      .toBe(SemverResult.LEFT_IS_GREATER);

    expect(semverCompare("5.1.9", "4.1.6"))
      .toBe(SemverResult.LEFT_IS_GREATER);

    expect(semverCompare("2.0.2", "1.1.9"))
      .toBe(SemverResult.LEFT_IS_GREATER);
  });

  it("knows when LEFT_IS_GREATER: undefined", () => {
    expect(semverCompare("1.0.0", ""))
      .toBe(SemverResult.LEFT_IS_GREATER);

    expect(semverCompare("1.0.0", "x.y.z"))
      .toBe(SemverResult.LEFT_IS_GREATER);
  });

  it("knows when LEFT_IS_GREATER: pre-release identifiers", () => {
    expect(semverCompare("6.1.1-beta", "6.1.0"))
      .toBe(SemverResult.LEFT_IS_GREATER);

    expect(semverCompare("1.1.1", "1.1.1-beta"))
      .toBe(SemverResult.LEFT_IS_GREATER);

    expect(semverCompare("1.1.1-RC99", "1.1.1-rc10"))
      .toBe(SemverResult.LEFT_IS_GREATER);

    expect(semverCompare("1.1.1", "1.1.1-rc1"))
      .toBe(SemverResult.LEFT_IS_GREATER);

    expect(semverCompare("1.1.1-rc2-", "1.1.1-rc1"))
      .toBe(SemverResult.LEFT_IS_GREATER);
  });

  it("knows when EQUAL", () => {
    expect(semverCompare("1.1.1", "1.1.1"))
      .toBe(SemverResult.EQUAL);

    expect(semverCompare("", ""))
      .toBe(SemverResult.EQUAL);

    expect(semverCompare("1.1.1-beta", "1.1.1-beta"))
      .toBe(SemverResult.EQUAL);

    expect(semverCompare("1.1.1-rc100", "1.1.1-rc100"))
      .toBe(SemverResult.EQUAL);
  });
});

describe("shouldDisplay()", () => {
  const fakeMinOsData = { jest_feature: "1.0.0" };

  it("should display", () => {
    expect(createShouldDisplayFn("1.0.0", fakeMinOsData, undefined)(
      Feature.jest_feature)).toBeTruthy();
    expect(createShouldDisplayFn("10.0.0", fakeMinOsData, undefined)(
      Feature.jest_feature)).toBeTruthy();
    expect(createShouldDisplayFn("10.0.0", { jest_feature: "1.0.0" },
      undefined)(Feature.jest_feature)).toBeTruthy();
    globalConfig.FBOS_END_OF_LIFE_VERSION = MinVersionOverride.NEVER;
    expect(createShouldDisplayFn(undefined, fakeMinOsData, undefined)(
      Feature.jest_feature)).toBeTruthy();
    delete globalConfig.FBOS_END_OF_LIFE_VERSION;
  });

  it("shouldn't display", () => {
    expect(createShouldDisplayFn("0.9.0", fakeMinOsData, undefined)(
      Feature.jest_feature)).toBeFalsy();
    expect(createShouldDisplayFn(undefined, fakeMinOsData, undefined)(
      Feature.jest_feature)).toBeFalsy();
    const unknown_feature = "unknown_feature" as Feature;
    expect(createShouldDisplayFn("1.0.0", fakeMinOsData, undefined)(
      unknown_feature)).toBeFalsy();
    expect(createShouldDisplayFn("1.0.0", undefined, undefined)(
      unknown_feature)).toBeFalsy();
    expect(createShouldDisplayFn("1.0.0", "" as MinOsFeatureLookup, undefined)(
      unknown_feature)).toBeFalsy();
    expect(createShouldDisplayFn("1.0.0", "{}" as MinOsFeatureLookup, undefined)(
      unknown_feature)).toBeFalsy();
    expect(createShouldDisplayFn("1.0.0", "bad" as MinOsFeatureLookup, undefined)(
      unknown_feature)).toBeFalsy();
  });
});

describe("determineInstalledOsVersion()", () => {
  const checkVersionResult =
    (fromBot: string | undefined,
      api: string | undefined,
      expected: string | undefined) => {
      bot.hardware.informational_settings.controller_version = fromBot;
      const d = fakeDevice();
      d.body.fbos_version = api;
      const result = determineInstalledOsVersion(bot, d);
      expect(result).toEqual(expected);
    };

  it("returns correct installed FBOS version string", () => {
    checkVersionResult(undefined, undefined, undefined);
    checkVersionResult("1.1.1", undefined, "1.1.1");
    checkVersionResult("", undefined, undefined);
    checkVersionResult(undefined, "", undefined);
    checkVersionResult(undefined, "1.1.1", "1.1.1");
    checkVersionResult("bad", undefined, undefined);
    checkVersionResult(undefined, "bad", undefined);
    checkVersionResult("bad", "1.1.1", "1.1.1");
    checkVersionResult("1.2.3", "2.3.4", "2.3.4");
    checkVersionResult("1.0.1", "1.0.0", "1.0.1");
    checkVersionResult("-rc0", "", undefined);
  });
});

describe("versionOK()", () => {
  it("checks if major/minor version meets min requirement", () => {
    globalConfig.MINIMUM_FBOS_VERSION = "3.0.0";
    expect(versionOK("9.1.9-rc99")).toBeTruthy();
    expect(versionOK("3.0.9-rc99")).toBeTruthy();
    expect(versionOK("4.0.0")).toBeTruthy();
    expect(versionOK("3.1.0")).toBeTruthy();
    expect(versionOK("2.0.-")).toBeFalsy();
    expect(versionOK("2.9.4")).toBeFalsy();
    expect(versionOK("1.9.6")).toBeFalsy();
    globalConfig.MINIMUM_FBOS_VERSION = "3.1.0";
    expect(versionOK("4.0.0")).toBeTruthy();
    globalConfig.MINIMUM_FBOS_VERSION = "4.0.0";
    expect(versionOK("3.1.6")).toBeFalsy();
    delete globalConfig.MINIMUM_FBOS_VERSION;
    expect(versionOK("5.0.0")).toBeFalsy();
    expect(versionOK("7.0.0")).toBeTruthy();
  });
});
