import { TaggedResource } from "farmbot";
import { ResourceIndex } from "../interfaces";
import {
  buildResourceIndex,
} from "../../__test_support__/resource_index_builder";
import { EVERY_USAGE_KIND, UsageIndex, resourceUsageList } from "../in_use";
import { DeepPartial } from "../../redux/interfaces";
import {
  fakeSequence,
  fakeFarmEvent,
  fakeRegimen,
} from "../../__test_support__/fake_state/resources";
import { resourceReducer } from "../reducer";
import { resourceReady } from "../../sync/actions";

describe("resourceUsageList", () => {
  it("Converts `UsageIndex` type Into Record<UUID, boolean>", () => {
    const usageIndex: UsageIndex = {
      "Regimen.FarmEvent": {
        "FarmEvent.0.0": { "Regimen.2.2": true, "Regimen.1.1": true }
      },
      "Sequence.FarmEvent": {
        "FarmEvent.3.3": { "Sequence.4.4": true, "Sequence.5.5": true }
      },
      "Sequence.Regimen": {
        "Regimen.6.6": { "Sequence.7.7": true, "Sequence.8.8": true }
      },
      "Sequence.Sequence": {
        "Regimen.9.9": { "Sequence.10.10": true, "Sequence.11.11": true }
      },
      "Sequence.FbosConfig": { "Sequence.12.12": { "FbosConfig.13.13": true } },
      "Sequence.PinBinding": { "Sequence.14.14": { "PinBinding.15.15": true } },
      "Curve.Point": {
        "Point.1.1": { "Curve.2.2": true, "Curve.3.3": true }
      },
    };
    const actual = Object.keys(resourceUsageList(usageIndex)).sort();
    const expected = [
      "FarmEvent.0.0", "FarmEvent.3.3",
      "Regimen.6.6", "Regimen.9.9",
      "Sequence.12.12",
      "Sequence.14.14",
      "Point.1.1",
    ].sort();
    expect(actual.length).toEqual(expected.length);
    expected.map(y => expect(actual).toContain(y));
  });
});

describe("in_use tracking at reducer level", () => {
  function testCase(sequences: TaggedResource[]): ResourceIndex {
    return resourceReducer(buildResourceIndex(sequences),
      resourceReady("Sequence", sequences)).index;
  }

  const assertShape =
    (inUse: UsageIndex, expected: DeepPartial<UsageIndex>) => {
      EVERY_USAGE_KIND.map(kind =>
        expect(inUse[kind]).toEqual(expected[kind] || {}));
    };

  it("loads defaults", () => assertShape(testCase([]).inUse, {}));

  it("does not track self-referencing Sequences", () => {
    const selfReferential = fakeSequence();
    const sequence_id = selfReferential.body.id;
    expect(sequence_id).toBeDefined();
    if (sequence_id) {
      selfReferential.body.body = [{ kind: "execute", args: { sequence_id } }];
      const { inUse } = testCase([selfReferential]);
      assertShape(inUse, {});
    }
  });

  it("handles a sequence that calls many sequences", () => {
    const s1 = fakeSequence();
    const s1_id = 1;
    s1.body.id = s1_id;
    const s2 = fakeSequence();
    const s2_id = 2;
    s2.body.id = s2_id;
    const s3 = fakeSequence();
    const s3_id = 3;
    s3.body.id = s3_id;
    s1.body.body = [
      { kind: "execute", args: { sequence_id: s3_id } },
      { kind: "execute", args: { sequence_id: s2_id } },
    ];
    const { inUse } = testCase([s1, s2, s3]);
    assertShape(inUse, {
      "Sequence.Sequence": {
        [s2.uuid]: { [s1.uuid]: true },
        [s3.uuid]: { [s1.uuid]: true },
      }
    });
  });

  it("Tracks a FarmEvent's Regimen usage", () => {
    const theRegimen = fakeRegimen();
    theRegimen.body.id = 2;
    const theFarmEvent = fakeFarmEvent("Regimen", theRegimen.body.id);
    const { inUse } = testCase([theRegimen, theFarmEvent]);
    assertShape(inUse, {
      "Regimen.FarmEvent": {
        [theRegimen.uuid]: { [theFarmEvent.uuid]: true },
      }
    });
  });

  it("Tracks a Regimen's Sequence usage", () => {
    const sequence_id = 123123123123;
    const sequence = fakeSequence();
    sequence.body.name = "Y";
    sequence.body.id = sequence_id;
    const regimen = fakeRegimen();
    regimen.body.name = "X";
    regimen.body.regimen_items = [
      { sequence_id, time_offset: 12 },
    ];
    const ri = buildResourceIndex([regimen, sequence]);
    expect(resourceUsageList(ri.index.inUse)[sequence.uuid]).toBe(true);
  });
});
