import type { DetailedHTMLProps, HTMLAttributes } from "react";

type ApiSportsWidgetProps = DetailedHTMLProps<
  HTMLAttributes<HTMLElement>,
  HTMLElement
> & {
  "data-type"?: string;
  "data-sport"?: string;
  "data-key"?: string;
  "data-lang"?: string;
  "data-theme"?: string;
  "data-show-error"?: string;
  "data-show-logos"?: string;
  "data-refresh"?: string;
  "data-league"?: string;
  "data-season"?: string;
  "data-tab"?: string;
  "data-game-tab"?: string;
  "data-target-game"?: string;
  "data-target-standings"?: string;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "api-sports-widget": ApiSportsWidgetProps;
    }
  }
}
