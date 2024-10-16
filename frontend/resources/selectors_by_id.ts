import {
  isTaggedFarmEvent,
  isTaggedPlantPointer,
  isTaggedRegimen,
  isTaggedSequence,
  isTaggedTool,
  isTaggedToolSlotPointer,
  sanityCheck,
  isTaggedPlantTemplate,
  isTaggedGenericPointer,
  isTaggedSavedGarden,
  isTaggedFolder,
  isTaggedWeedPointer,
  isTaggedPeripheral,
  isTaggedSensor,
} from "./tagged_resources";
import {
  TaggedResource,
  TaggedTool,
  TaggedToolSlotPointer,
} from "farmbot";
import { ResourceIndex } from "./interfaces";
import { isNumber, find } from "lodash";
import { joinKindAndId } from "./reducer_support";
import { findAll } from "./find_all";

const byId =
  <T extends TaggedResource>(kind: T["kind"]) =>
    (index: ResourceIndex, id: number): T | undefined => {
      const resources = findAll(index, kind);
      const f = (x: TaggedResource) => (x.kind === kind) && (x.body.id === id);
      // Maybe we should add a throw here?
      return resources.filter(f)[0] as T | undefined;
    };

export const findFarmEventById = (ri: ResourceIndex, fe_id: number) => {
  const fe = byId("FarmEvent")(ri, fe_id);
  if (fe && isTaggedFarmEvent(fe) && sanityCheck(fe)) {
    return fe;
  } else {
    const e = new Error(`Bad farm_event id: ${fe_id}`);
    throw e;
  }
};

export const maybeFindToolSlotById = (ri: ResourceIndex, tool_slot_id?: number):
  TaggedToolSlotPointer | undefined => {
  const toolSlot = tool_slot_id && byId("Point")(ri, tool_slot_id);
  if (toolSlot && isTaggedToolSlotPointer(toolSlot) && sanityCheck(toolSlot)) {
    return toolSlot;
  } else {
    return undefined;
  }
};

export const maybeFindToolById = (ri: ResourceIndex, tool_id?: number):
  TaggedTool | undefined => {
  const tool = tool_id && byId("Tool")(ri, tool_id);
  if (tool && isTaggedTool(tool) && sanityCheck(tool)) {
    return tool;
  } else {
    return undefined;
  }
};

export const findToolById = (ri: ResourceIndex, tool_id: number) => {
  const tool = maybeFindToolById(ri, tool_id);
  if (tool) {
    return tool;
  } else {
    throw new Error("Bad tool id: " + tool_id);
  }
};

export const findSequenceById = (ri: ResourceIndex, sequence_id: number) => {
  const sequence = byId("Sequence")(ri, sequence_id);
  if (sequence && isTaggedSequence(sequence) && sanityCheck(sequence)) {
    return sequence;
  } else {
    throw new Error("Bad sequence id: " + sequence_id);
  }
};

export const maybeFindSequenceById = (ri: ResourceIndex, sequence_id: number) => {
  const sequence = byId("Sequence")(ri, sequence_id);
  if (sequence && isTaggedSequence(sequence) && sanityCheck(sequence)) {
    return sequence;
  } else {
    return undefined;
  }
};

/** Find a Tool's corresponding Slot. */
export const findSlotByToolId = (index: ResourceIndex, tool_id: number) => {
  const tool = findToolById(index, tool_id);
  const query = { body: { tool_id: tool.body.id } };
  const every = Object
    .keys(index.references)
    .map(x => index.references[x]);
  const tts = find(every, query);
  if (tts && !isNumber(tts) && isTaggedToolSlotPointer(tts) && sanityCheck(tts)) {
    return tts;
  } else {
    return undefined;
  }
};

/** Unlike other findById methods, this one allows undefined (missed) values */
export function maybeFindPlantById(index: ResourceIndex, id: number) {
  const uuid = index.byKindAndId[joinKindAndId("Point", id)];
  const resource = index.references[uuid || "nope"];
  if (resource && isTaggedPlantPointer(resource)) { return resource; }
}

/** Unlike other findById methods, this one allows undefined (missed) values */
export function maybeFindPlantTemplateById(index: ResourceIndex, id: number) {
  const uuid = index.byKindAndId[joinKindAndId("PlantTemplate", id)];
  const resource = index.references[uuid || "nope"];
  if (resource && isTaggedPlantTemplate(resource)) { return resource; }
}

/** Unlike other findById methods, this one allows undefined (missed) values */
export function maybeFindGenericPointerById(index: ResourceIndex, id: number) {
  const uuid = index.byKindAndId[joinKindAndId("Point", id)];
  const resource = index.references[uuid || "nope"];
  if (resource && isTaggedGenericPointer(resource)) { return resource; }
}

/** Unlike other findById methods, this one allows undefined (missed) values */
export function maybeFindWeedPointerById(index: ResourceIndex, id: number) {
  const uuid = index.byKindAndId[joinKindAndId("Point", id)];
  const resource = index.references[uuid || "nope"];
  if (resource && isTaggedWeedPointer(resource)) { return resource; }
}

/** Unlike other findById methods, this one allows undefined (missed) values */
export function maybeFindSavedGardenById(index: ResourceIndex, id: number) {
  const uuid = index.byKindAndId[joinKindAndId("SavedGarden", id)];
  const resource = index.references[uuid || "nope"];
  if (resource && isTaggedSavedGarden(resource)) { return resource; }
}

/** Unlike other findById methods, this one allows undefined (missed) values */
export function maybeFindPeripheralById(index: ResourceIndex, id: number) {
  const uuid = index.byKindAndId[joinKindAndId("Peripheral", id)];
  const resource = index.references[uuid || "nope"];
  if (resource && isTaggedPeripheral(resource)) { return resource; }
}

/** Unlike other findById methods, this one allows undefined (missed) values */
export function maybeFindSensorById(index: ResourceIndex, id: number) {
  const uuid = index.byKindAndId[joinKindAndId("Sensor", id)];
  const resource = index.references[uuid || "nope"];
  if (resource && isTaggedSensor(resource)) { return resource; }
}

export const findRegimenById = (ri: ResourceIndex, regimen_id: number) => {
  const regimen = byId("Regimen")(ri, regimen_id);
  if (regimen && isTaggedRegimen(regimen) && sanityCheck(regimen)) {
    return regimen;
  } else {
    throw new Error("Bad regimen id: " + regimen_id);
  }
};

export const findFolderById = (ri: ResourceIndex, folder_id: number) => {
  const folder = byId("Folder")(ri, folder_id);
  if (folder && isTaggedFolder(folder) && sanityCheck(folder)) {
    return folder;
  } else {
    throw new Error("Bad folder id: " + folder_id);
  }
};
