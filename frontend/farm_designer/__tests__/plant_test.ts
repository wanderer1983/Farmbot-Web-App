import { Plant } from "../plant";

describe("Plant()", () => {
  it("returns defaults", () => {
    expect(Plant({})).toEqual({
      id: undefined,
      meta: {},
      name: "Untitled Plant",
      openfarm_slug: "not-set",
      plant_stage: "planned",
      planted_at: undefined,
      water_curve_id: undefined,
      spread_curve_id: undefined,
      height_curve_id: undefined,
      pointer_type: "Plant",
      radius: 25,
      depth: 0,
      x: 0,
      y: 0,
      z: 0,
    });
  });
});
