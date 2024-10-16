import React from "react";
import { isNumber } from "lodash";
import { ResourceIndex } from "../resources/interfaces";
import { selectAllSequences, findSequenceById } from "../resources/selectors";
import { FBSelect, DropDownItem } from "../ui";
import { t } from "../i18next_wrapper";

export interface SequenceSelectBoxProps {
  onChange(selection: DropDownItem): void;
  resources: ResourceIndex;
  sequenceId: number | undefined;
}

export function SequenceSelectBox(props: SequenceSelectBoxProps) {

  const sequenceDropDownList = () => {
    const { resources } = props;
    const dropDownList: DropDownItem[] = [];
    selectAllSequences(resources)
      .map(sequence => {
        const { id, name } = sequence.body;
        if (isNumber(id) && (id !== props.sequenceId)) {
          dropDownList.push({ label: name, value: id });
        }
      });
    return dropDownList;
  };

  const selectedSequence = () => {
    const { resources, sequenceId } = props;
    if (sequenceId) {
      const { id, name } = findSequenceById(resources, sequenceId).body;
      return { label: name, value: id as number };
    } else {
      return undefined;
    }
  };

  return <FBSelect
    extraClass={"sequence-select-box"}
    onChange={props.onChange}
    selectedItem={selectedSequence()}
    list={sequenceDropDownList()}
    customNullLabel={t("Select a sequence")} />;
}
