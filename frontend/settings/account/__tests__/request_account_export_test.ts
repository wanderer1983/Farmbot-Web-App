let mockData: {} | undefined = {};
jest.mock("axios", () => ({
  post: jest.fn(() => Promise.resolve({ data: mockData }))
}));

import { API } from "../../../api";
import { Content } from "../../../constants";
import {
  requestAccountExport, generateFilename,
} from "../request_account_export";
import { success } from "../../../toast/toast";
import axios from "axios";
import { fakeDevice } from "../../../__test_support__/resource_index_builder";

API.setBaseUrl("http://www.foo.bar");
window.URL.createObjectURL = jest.fn();
window.URL.revokeObjectURL = jest.fn();

describe("generateFilename()", () => {
  it("generates a filename", () => {
    const device = fakeDevice().body;
    device.name = "FOO";
    device.id = 123;
    const result = generateFilename({ device });
    expect(result).toEqual("export_foo_123.json");
  });
});

describe("requestAccountExport()", () => {
  it("pops toast on completion (when API has email support)", async () => {
    mockData = undefined;
    await requestAccountExport();
    expect(axios.post).toHaveBeenCalledWith(API.current.exportDataPath);
    expect(success).toHaveBeenCalledWith(Content.EXPORT_SENT);
  });

  it("downloads the data synchronously (when API has no email support)",
    async () => {
      mockData = {};
      await requestAccountExport();
      expect(window.URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      expect(window.URL.revokeObjectURL).toHaveBeenCalled();
    });
});
