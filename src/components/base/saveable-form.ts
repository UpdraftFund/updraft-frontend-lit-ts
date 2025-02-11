import { LitElement } from 'lit';
import { query } from 'lit/decorators.js';

import Ajv from 'ajv';

/**
 * SaveableForm provides form saving/loading behavior.
 * It organizes data under the `form` namespace in localStorage.
 */
export class SaveableForm extends LitElement {
  @query("form", true) protected form!: HTMLFormElement;

  formName: string | null = null;

  protected saveForm = () => {
    if (this.formName) {
      const formData = new FormData(this.form);
      const formObject: Record<string, string> = {};

      for (const [key, value] of formData) {
        if (typeof value === "string") {
          formObject[key] = value; // Save the string value (even if it's empty)
        } else {
          console.warn(`saveForm(${this.formName}): Skipping unsupported input type (${typeof value}) for key: ${key}`);
        }
      }
      localStorage.setItem(`form:${this.formName}`, JSON.stringify(formObject));
      console.group(`Saved form: ${this.formName}`);
      console.dir(formObject);
      console.groupEnd();
    }
  }

  protected restoreForm = () => {
    if (this.formName) {
      const savedForm = localStorage.getItem(`form:${this.formName}`);
      if (savedForm) {
        for (const [name, value] of Object.entries(JSON.parse(savedForm))) {
          const field = this.form.querySelector(`[name="${name}"]`);
          if (field) {
            (field as any).value = value;
          }
        }
      }
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("blur", this.handleBlurEvent);
    this.addEventListener("mousedown", this.saveForm);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("blur", this.handleBlurEvent);
    this.removeEventListener("mousedown", this.saveForm);
  }

  firstUpdated(changedProperties: Map<string | number | symbol, unknown>) {
    super.firstUpdated(changedProperties);
    this.formName = this.form?.name || null;
    this.restoreForm();
  }

  private handleBlurEvent = (event: Event) => {
    const target = event.composedPath()[0] as { name?: string, value?: any };
    if (target && target.name && typeof target.value === "string") {
      this.saveForm();
    }
  };
}

/**
 * Helper function to load form data from localStorage by its name.
 *
 * @param form - The name of the form to load data for.
 * @returns The form data as a Record<string, string> or null if no data exists.
 */
export function loadForm(form: string): Record<string, string> | null {
  const formData = localStorage.getItem(`form:${form}`);
  return formData ? JSON.parse(formData) : null;
}

/**
 * Helper function to map form data stored in localStorage into a schema-compliant JSON object.
 *
 * @param forms - The name of the form (or array of form names) to load data for.
 * @param schema - A JSON schema matching the data structure.
 * @param validate - Optional. Whether to validate the data against the schema. Defaults to `false`.
 * @returns A validated JSON object if validation is successful (or validation is skipped) or `null` if validation fails.
 */
export function formToJson(
  forms: string | string[], // Updated parameter name
  schema: any,
  validate: boolean = false
): Record<string, unknown>{
  // Normalize input to always handle as an array
  const formNames = Array.isArray(forms) ? forms : [forms];

  // Combined form data
  const formData: Record<string, string> = {};

  // Load and merge form data from all provided forms
  for (const formName of formNames) {
    const currentFormData = loadForm(formName);
    if (currentFormData) {
      Object.assign(formData, currentFormData);
    } else {
      console.warn(`No data found for form: ${formName}`);
    }
  }

  const json: Record<string, unknown> = {};
  const properties = Object.entries(schema.properties || {}) as [string, any][];

  for (const [key, schemaProperty] of properties) {
    switch (schemaProperty.type) {
      case "array":
        // Case 1: Space-separated array fields
        if (formData[key] && typeof formData[key] === "string") {
          json[key] = formData[key].split(/\s+/);
        }
        // Case 2: Numbered fields aggregated into an array (e.g., "link1", "link2", ...)
        else {
          const baseName = key.slice(0, -1); // Extract the singular base name (e.g., "links" -> "link")
          const regex = new RegExp(`^${baseName}(\\d+)$`);

          const arrayValues = Object.entries(formData)
            .filter(([formKey]) => regex.test(formKey)) // Check for numbered keys
            .sort((a, b) => {
              // Ensure numerical order based on the digit (e.g., link1, link2, ...)
              const [, aIndex] = a[0].match(regex)!;
              const [, bIndex] = b[0].match(regex)!;
              return parseInt(aIndex) - parseInt(bIndex);
            })
            .map(([, value]) => value);

          if (arrayValues.length > 0) {
            json[key] = arrayValues;
          }
        }
        break;

      case "string":
      case "number":
        if (formData[key]) {
          json[key] = formData[key];
        }
        break;

      default:
        throw new Error(`Unsupported schema property type: ${schemaProperty.type}`);
    }
  }

  if (validate) {
    const ajv = new Ajv();
    const validateSchema = ajv.compile(schema);

    if (!validateSchema(json)) {
      const errorMessages = validateSchema.errors
        ?.map((err) => `${err.instancePath} ${err.message}`)
        .join(', ');
      throw new Error(
        `Schema: ${schema} validation failed for form(s):` +
        `${formNames.join(', ')}. Errors: ${errorMessages}`
      );
    }
  }

  return json;
}

