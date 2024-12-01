import { css } from 'lit';

export const theme = css`
  :host {
    --white: #ffffff;

    --river-blue-200: #E5F2F6;
    --river-blue-300: #C8E3EE;
    --river-blue-400: #A7D4E5;
    --river-blue-600: #36B2D1;
    --river-blue-1000: #18505D;

    --radishical-100: #FDF3F4;
    --radishical-200: #FCE6E9;
    --radishical-300: #F9CBD2;
    --radishical-400: #F6AAB7;
    --radishical-700: #D64063;
    --radishical-800: #B93756;
    --radishical-1000: #6B2032;

    --golden-snitch-400: #F6EDAB;
    --golden-snitch-700: #D7C940;
    --golden-snitch-1000: #6B6520;

    --mako-500: #86898A;
    --mako-700: #474C4D;
    --mako-800: #3D4243;
    --mako-900: #323636;
    --mako-1000: #232626;

    --light-gray: #EBECEF;

    --dimond-river-gradient: radial-gradient(129.94% 315.77% at 12.04% 84.51%, #F3F8FB 5.22%, #E5F2F6 56.06%);
    --dimond-radishical-gradient: radial-gradient(129.94% 315.77% at 12.04% 84.51%, #FDF3F4 5.22%, #FCE6E9 56.06%);
    --dimond-golden-gradient: radial-gradient(129.94% 315.77% at 12.04% 84.51%, #FEFCF3 5.22%, #F3F3F3 56.06%);
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
`; 
