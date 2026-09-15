// Source-only loader. The package build substitutes a compiler-validated JSON
// snapshot so the public Node entry never reads a consumer's filesystem.
import { createLintContracts } from '../scripts/lint-contracts.mjs';
export default createLintContracts();
