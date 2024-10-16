jest.mock("../maybe_start_tracking", () => {
  return { maybeStartTracking: jest.fn() };
});
jest.mock("../../read_only_mode/app_is_read_only",
  () => ({ appIsReadonly: jest.fn() }));

const mockBody: Partial<TaggedUser["body"]> = { id: 23 };
jest.mock("axios", () => {
  return {
    delete: () => Promise.resolve({}),
    post: () => Promise.resolve({ data: mockBody }),
    put: () => Promise.resolve({ data: mockBody })
  };
});

import { destroy, saveAll, initSave, initSaveGetId } from "../crud";
import { buildResourceIndex } from "../../__test_support__/resource_index_builder";
import { createStore, applyMiddleware } from "redux";
import { resourceReducer } from "../../resources/reducer";
import { thunk } from "redux-thunk";
import { ReduxAction } from "../../redux/interfaces";
import { maybeStartTracking } from "../maybe_start_tracking";
import { API } from "../api";
import { betterCompact } from "../../util";
import { SpecialStatus, TaggedUser } from "farmbot";
import { uniq } from "lodash";

describe("AJAX data tracking", () => {
  API.setBaseUrl("http://blah.whatever.party");
  const initialState = { resources: buildResourceIndex() };
  const wrappedReducer =
    (state: typeof initialState, action: ReduxAction<void>) => {
      return { resources: resourceReducer(state.resources, action) };
    };

  const store = createStore(wrappedReducer, initialState, applyMiddleware(thunk));
  const resources = () =>
    betterCompact(Object.values(store.getState().resources.index.references));

  it("sets consistency when calling destroy()", () => {
    const uuid = Object.keys(store.getState().resources.index.byKind.Tool)[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    store.dispatch(destroy(uuid) as any);
    expect(maybeStartTracking).toHaveBeenCalled();
  });

  it("sets consistency when calling saveAll()", () => {
    const r = resources().map(x => {
      x.specialStatus = SpecialStatus.DIRTY;
      return x;
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    store.dispatch(saveAll(r) as any);
    expect(maybeStartTracking).toHaveBeenCalled();
    const list = (maybeStartTracking as jest.Mock).mock.calls;
    const uuids: string[] =
      uniq(list.map((x: string[]) => x[0]));
    expect(uuids.length).toEqual(r.length);
  });

  it("sets consistency when calling initSave()", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const action: any = initSave("User", {
      name: "tester123",
      email: "test@test.com"
    });
    store.dispatch(action);
    expect(maybeStartTracking).toHaveBeenCalled();
  });

  it("sets consistency when calling initSaveGetId()", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const action: any = initSaveGetId("User", {
      name: "tester123",
      email: "test@test.com"
    });
    store.dispatch(action);
    expect(maybeStartTracking).toHaveBeenCalled();
  });
});
