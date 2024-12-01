import { CSSResultGroup, LitElement } from "lit";
import { theme } from "../styles/theme";

export abstract class LitComponent extends LitElement {
    private static _styles: CSSResultGroup;

    static get styles(): CSSResultGroup {
        const derivedStyles = this._styles || [];
        return [
            theme,
            ...(Array.isArray(derivedStyles) ? derivedStyles : [derivedStyles]),
        ];
    }

    static set styles(styles: CSSResultGroup) {
        this._styles = styles;
    }
}