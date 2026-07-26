// Re-export so the legacy `@/components/BlockEditor` import path keeps
// resolving. The actual implementation lives in `block-editor.tsx` (the
// kebab-case filename; this file predates the project adopting kebab-case
// consistently). New code should import from `@/components/block-editor`.
export { BlockEditor } from './block-editor'
export type { BlockEditorProps } from './block-editor'
