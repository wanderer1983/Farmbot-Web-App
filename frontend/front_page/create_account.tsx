import React from "react";
import {
  WidgetBody, Col, Widget, WidgetHeader, Row, BlurableInput, BIProps,
} from "../ui";
import { resendEmail } from "./resend_verification";
import { success, error } from "../toast/toast";
import { bail } from "../util";
import { ResendPanelBody } from "./resend_panel_body";
import { BlurablePassword } from "../ui/blurable_password";
import { Content } from "../constants";
import { t } from "../i18next_wrapper";

type RegKeyName =
  | "regConfirmation"
  | "regEmail"
  | "regName"
  | "regPassword";

type KeySetter = (keyName: RegKeyName, val: string) => void;

type KeyGetter = (keyName: RegKeyName) => string | undefined;

export interface CreateAccountProps {
  children?: React.ReactChild
  submitRegistration(e: React.FormEvent<{}>): void;
  sent: boolean;
  get: KeyGetter;
  set: KeySetter;
  callback(): void;
}

type FieldType = BIProps["type"];

export interface FormFieldProps {
  label: string;
  type: FieldType;
  value: string;
  onCommit(val: string): void;
}

export const FormField = (props: FormFieldProps) =>
  <div className={"account-form-field"}>
    <label> {t(props.label)} </label>
    <BlurableInput
      value={props.value}
      type={props.type}
      onCommit={(e) => props.onCommit(e.currentTarget.value)} />
  </div>;

interface FieldData {
  label: string,
  type: FieldType | "password",
  keyName: RegKeyName
}

const FIELDS: FieldData[] = [
  { label: "Email", type: "email", keyName: "regEmail" },
  { label: "Name", type: "text", keyName: "regName" },
  { label: "Password", type: "password", keyName: "regPassword" },
  { label: "Verify Password", type: "password", keyName: "regConfirmation" },
];

/** Helper function to make life easier when testing.
 * Renders a list of input boxes on the registration panel form. */
const renderFormFields = (get: KeyGetter, set: KeySetter) => {
  return FIELDS.map((f) => {
    if (f.type == "password") {
      return <div key={f.label}>
        <label> {t(f.label)} </label>
        <BlurablePassword
          key={f.label}
          onCommit={(e) => set(f.keyName, e.currentTarget.value)} />
      </div>;
    } else {
      return <FormField
        key={f.label}
        label={f.label}
        type={f.type}
        value={get(f.keyName) || ""}
        onCommit={(val) => set(f.keyName, val)} />;
    }
  });
};

export function MustRegister(props: CreateAccountProps) {
  return <WidgetBody>
    <form onSubmit={props.submitRegistration}>
      {renderFormFields(props.get, props.set)}
      {props.children}
      <Row>
        <button
          title={t("Create Account")}
          className="fb-button green front-page-button">
          {t("Create Account")}
        </button>
      </Row>
    </form>
  </WidgetBody>;
}

const MISSING_EMAIL = "User tried to resend to their registration email, " +
  "but none was found.";

export function sendEmail(email: string, callback: () => void) {
  const ok = () => {
    success(t(Content.VERIFICATION_EMAIL_RESENT));
    callback();
  };
  const no = () => {
    error(t(Content.VERIFICATION_EMAIL_RESEND_ERROR));
    callback();
  };

  return resendEmail(email).then(ok, no);
}

export function DidRegister(props: CreateAccountProps) {
  const email = props.get("regEmail");
  return email
    ? <ResendPanelBody onClick={() => { sendEmail(email, props.callback); }} />
    : bail(MISSING_EMAIL);
}

export function CreateAccount(props: CreateAccountProps) {
  const RelevantForm = props.sent ? DidRegister : MustRegister;
  return <Col xs={12} sm={5}>
    <Widget>
      <WidgetHeader title={t("Create An Account")} />
      <RelevantForm {...props} />
    </Widget>
  </Col>;
}
