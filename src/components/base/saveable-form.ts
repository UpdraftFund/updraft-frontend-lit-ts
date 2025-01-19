import { LitElement } from "lit";
import { query } from "lit/decorators.js";

/**
 * SaveableForm provides form saving/loading behavior.
 * It organizes data under the `form` namespace in sessionStorage.
 */
export class SaveableForm extends LitElement {
  @query("form", true) form!: HTMLFormElement;

  formName: string | null = null;

  protected saveForm = ()=> {
    if (this.formName) {
      const formData = new FormData(this.form);
      const formObject: Record<string, string> = {};

      for (const [key, value] of formData.entries()) {
        formObject[key] = value as string; // File inputs won't work
      }
      sessionStorage.setItem(`form:${this.formName}`, JSON.stringify(formObject));
      console.log(`Saved form: ${this.formName}`);
      console.dir(formObject);
    }
  }

  protected restoreForm = () => {
    if (this.formName) {
      const savedForm = sessionStorage.getItem(`form:${this.formName}`);
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
    this.addEventListener("click", this.saveForm);
    //this.addEventListener("sl-blur", this.handleBlurEvent);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("blur", this.handleBlurEvent);
    this.removeEventListener("click", this.saveForm);
    //this.removeEventListener("sl-blur", this.handleBlurEvent);
  }

  firstUpdated(changedProperties: Map<string | number | symbol, unknown>) {
    super.firstUpdated(changedProperties);
    this.formName = this.form?.name || null;
    this.restoreForm();
  }

  private handleBlurEvent = (event: Event) => {
    const target = event.composedPath()[0] as HTMLInputElement | HTMLTextAreaElement | null;
    if (target && target.name && target.value?.trim()) {
      this.saveForm();
    }
  };
}

/**
 * Utility function to load form data from sessionStorage by its name.
 *
 * @param formName - The name of the form to load data for.
 * @returns The form data as a Record<string, string> or null if no data exists.
 */
export function loadFormData(formName: string): Record<string, string> | null {
  const formData = sessionStorage.getItem(`form:${formName}`);
  return formData ? JSON.parse(formData) : null;
}
