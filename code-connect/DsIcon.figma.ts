// url=https://www.figma.com/design/Fzozwr0ZgLD9qfv1NMP9R4/New-Lib-Components?node-id=1-2
import figma from 'figma';

/**
 * Smoke test: maps one Figma component to the React wrapper for `<ds-icon>`.
 * Adjust `// url=` to your real Icon component before `npm run figma:connect:publish`.
 */
export default {
  example: figma.code`
    <DsIcon name="Bell" size="md" />
  `,
  imports: ["import { DsIcon } from '@ds-mo/ui/react'"],
  id: 'ds-icon',
};
