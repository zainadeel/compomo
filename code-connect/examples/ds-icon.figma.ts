// Example only — not published (see figma.config.json `include`).
// Copy to ../published/DsIcon.figma.ts, then set // url= from Figma → Copy link to selection.
// url=https://www.figma.com/design/Fzozwr0ZgLD9qfv1NMP9R4/New-Lib-Components?node-id=REPLACE-WITH-REAL-NODE
import figma from 'figma';

/**
 * Example: React wrapper for `<ds-icon>`.
 */
export default {
  example: figma.code`
    <DsIcon name="Bell" size="md" />
  `,
  imports: ["import { DsIcon } from '@ds-mo/ui/react'"],
  id: 'ds-icon',
};
