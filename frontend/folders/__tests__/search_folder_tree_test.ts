import { TEST_GRAPH } from "../test_fixtures";
import { searchFolderTree, FolderSearchProps } from "../search_folder_tree";
import { TaggedResource } from "farmbot";
import { FolderUnion } from "../interfaces";

describe("searchFolderTree", () => {
  const searchFor = (searchTerm: string) => searchFolderTree({
    references: {},
    searchTerm,
    root: TEST_GRAPH
  });

  it("returns an empty result set when no match is found.", () => {
    const before = JSON.stringify(TEST_GRAPH);
    const results = searchFor("foo");
    const after = JSON.stringify(TEST_GRAPH);
    expect(results).toBeTruthy();
    expect(results.length).toEqual(0);
    expect(before).toEqual(after); // Prevent mutation of original data.
  });

  it("finds an `initial` folder", () => {
    const results = searchFor("one").map(x => x.name);
    expect(results.length).toEqual(1);
    expect(results).toContain("One");
    const results2 = searchFor("Ten").map(x => x.name);
    expect(results2.length).toEqual(4);
    expect(results2).toContain("Ten");
  });

  it("finds a `medial` folder", () => {
    const results = searchFor("seven").map(x => x.name);
    [ // === DIRECT MATCH:
      "Seven",
      "Seventeen",
      // == PARENTS
      "Six",
      "Sixteen",
      // == GRANDPARENTS
      "Fourteen",
    ].map(x => expect(results).toContain(x));
    expect(results.length).toEqual(7);
    const results2 = searchFor("Eleven").map(x => x.name);
    ["Eleven", "Ten"].map(x => expect(results2).toContain(x));
    expect(results2.length).toEqual(2);
  });

  it("finds a `terminal` folder", () => {
    const results = searchFor("ighteen").map(x => x.name);
    ["Eighteen", "Sixteen", "Fourteen"].map(x => expect(results).toContain(x));
  });

  it("finds sequences in an `terminal` folder node", () => {
    const byName: Record<string, FolderUnion> = {};
    const results = searchFolderTree(fakeSearchProps("level three"));
    results.map(x => byName[x.name] = x);
    const folder1 = byName["First Folder"];
    const folder2 = byName["Second Folder"];
    const folder3 = byName["Third Folder"];
    const folder3seq = TEST_REFERENCES[folder3.content[0]];
    expect(results.length).toEqual(3);
    expect(folder3).toBeTruthy();
    expect(folder2).toBeTruthy();
    expect(folder1).toBeTruthy();
    expect(folder3seq).toBeTruthy();
  });

  it("finds sequences in an `medial` folder node", () => {
    const byName: Record<string, FolderUnion> = {};
    const results = searchFolderTree(fakeSearchProps("level two"));
    results.map(x => byName[x.name] = x);
    const folder1 = byName["First Folder"];
    const folder2 = byName["Second Folder"];
    const folder3 = byName["Third Folder"];
    const folder2seq = TEST_REFERENCES[folder2.content[0]];
    expect(results.length).toEqual(2);
    expect(folder3).toBeUndefined();
    expect(folder2).toBeTruthy();
    expect(folder1).toBeTruthy();
    expect(folder2seq).toBeTruthy();
  });

  it("finds sequences in an `initial` folder node", () => {
    const byName: Record<string, FolderUnion> = {};
    const results = searchFolderTree(fakeSearchProps("level one"));
    results.map(x => byName[x.name] = x);
    const folder1 = byName["First Folder"];
    const folder2 = byName["Second Folder"];
    const folder3 = byName["Third Folder"];
    const folder1seq = TEST_REFERENCES[folder1.content[0]];
    expect(results.length).toEqual(1);
    expect(folder1seq).toBeTruthy();
    expect(folder3).toBeUndefined();
    expect(folder2).toBeUndefined();
    expect(folder1).toBeTruthy();
  });
});

const TEST_REFERENCES = {
  "Sequence.65.10": {
    "kind": "Sequence",
    "body": { "id": 65, "folder_id": 54, "color": "gray", "name": "level one" },
    "uuid": "Sequence.65.10",
    "specialStatus": ""
  },
  "Sequence.66.11": {
    "kind": "Sequence",
    "body": { "id": 66, "folder_id": 55, "color": "gray", "name": "level two" },
    "uuid": "Sequence.66.11",
    "specialStatus": ""
  },
  "Sequence.67.12": {
    "kind": "Sequence",
    "body": { "id": 67, "folder_id": 57, "color": "gray", "name": "level three" },
    "uuid": "Sequence.67.12",
    "specialStatus": ""
  }
} as unknown as Record<string, TaggedResource | undefined>;

const fakeSearchProps = (searchTerm: string): FolderSearchProps => ({
  searchTerm,
  references: TEST_REFERENCES,
  root: {
    noFolder: [],
    folders: [
      {
        "id": 54,
        "color": "blue",
        "name": "First Folder",
        "kind": "initial",
        "open": true,
        "editing": false,
        "children": [
          {
            "id": 55,
            "color": "yellow",
            "name": "Second Folder",
            "kind": "medial",
            "open": true,
            "editing": false,
            "children": [
              {
                "id": 57,
                "color": "purple",
                "name": "Third Folder",
                "kind": "terminal",
                "content": ["Sequence.67.12"],
                "open": true,
                "editing": false
              },
            ],
            "content": ["Sequence.66.11"]
          },
        ],
        "content": ["Sequence.65.10"]
      },
    ]
  }
});
