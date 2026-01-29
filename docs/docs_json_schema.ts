/**
 * Schema definitions for documentation JSON files
 * This file defines the TypeScript interfaces for all documentation JSON files
 * converted from Markdown files in the docs directory.
 */

/**
 * Base metadata for all documentation files
 */
export interface DocumentationMetadata {
  /** Source TypeScript file path (e.g., "src/helpers/email_helpers.ts") */
  source_file: string;
  /** Path to the original Markdown file (e.g., "docs/helpers/email_helpers.md") */
  path: string;
  /** Type of documentation file (optional, defaults to "module") */
  type?: "module" | "directory_overview" | "readme" | "summary" | "index" | "barrel_export";
}

/**
 * Parameter definition for functions/interfaces
 */
export interface ParameterDefinition {
  /** Parameter name */
  name: string;
  /** Parameter type (TypeScript type string) */
  type: string;
  /** Whether parameter is optional */
  optional?: boolean;
  /** Default value if any */
  default?: string;
  /** Parameter description */
  description: string;
  /** Nested properties (for object types) */
  properties?: ParameterDefinition[];
}

/**
 * Code example with language
 */
export interface CodeExample {
  /** Code content */
  code: string;
  /** Programming language (e.g., "typescript", "javascript") */
  language: string;
}

/**
 * Export definition (function, class, interface, enum, type, etc.)
 */
export interface ExportDefinition {
  /** Export name */
  name: string;
  /** Full function/class signature */
  signature?: string;
  /** Type of export */
  type: "function" | "class" | "interface" | "enum" | "type" | "const" | "variable" | "method";
  /** Description of the export */
  description: string;
  /** Whether this is an internal/private export */
  internal?: boolean;
  /** Function/class parameters */
  parameters?: ParameterDefinition[];
  /** Return type description */
  returns?: string;
  /** Behavior description (array of steps) */
  behavior?: string[];
  /** What this throws/errors */
  throws?: string | string[];
  /** Error handling description */
  error_handling?: string[];
  /** Code examples */
  examples?: CodeExample[];
  /** Additional properties (e.g., supported_extensions, values, etc.) */
  [key: string]: any;
}

/**
 * Type definition (interface, enum, type alias)
 */
export interface TypeDefinition {
  /** Type name */
  name: string;
  /** Type kind */
  type: "interface" | "enum" | "type" | "class";
  /** Type definition code */
  definition: string;
  /** Description (optional) */
  description?: string;
  /** Properties (for interfaces) */
  properties?: ParameterDefinition[];
  /** Values (for enums) */
  values?: string[];
}

/**
 * Code block (for displaying code snippets)
 */
export interface CodeBlock {
  /** Code content */
  code: string;
  /** Programming language */
  language: string;
}

/**
 * Section in documentation (can contain exports, subsections, etc.)
 */
export interface DocumentationSection {
  /** Section title */
  title: string;
  /** Section description (optional) */
  description?: string;
  /** Exports in this section */
  exports?: ExportDefinition[];
  /** Subsections */
  subsections?: DocumentationSection[];
  /** Type definitions in this section */
  type_definitions?: TypeDefinition[];
  /** Code block (for displaying code) */
  code_block?: CodeBlock;
  /** Categories (for README files) */
  categories?: CategoryDefinition[];
  /** Points (for lists) */
  points?: string[];
  /** Code examples */
  code_examples?: CodeExample[];
  /** Additional properties */
  [key: string]: any;
}

/**
 * Category definition (for README files)
 */
export interface CategoryDefinition {
  /** Category name */
  name: string;
  /** Modules in this category */
  modules?: ModuleDefinition[];
}

/**
 * Module definition (for README files)
 */
export interface ModuleDefinition {
  /** Module name */
  name: string;
  /** Module description */
  description: string;
}

/**
 * Architecture description (for managers/classes)
 */
export interface ArchitectureDescription {
  /** Architecture pattern name */
  pattern?: string;
  /** Description of the architecture */
  description?: string;
  /** Architecture details */
  details?: string[];
}

/**
 * Common patterns section
 */
export interface CommonPattern {
  /** Pattern name */
  name?: string;
  /** Pattern description */
  description?: string;
  /** Code example */
  code?: string;
  /** Language */
  language?: string;
}

/**
 * Main documentation JSON structure
 */
export interface DocumentationJSON {
  /** File metadata */
  metadata: DocumentationMetadata;
  /** Purpose/overview of the module */
  purpose: string;
  /** Dependencies array (strings) */
  dependencies?: string[];
  /** Main sections of documentation */
  sections?: DocumentationSection[];
  /** Architecture description (for managers/classes) */
  architecture?: ArchitectureDescription;
  /** Common usage patterns */
  common_patterns?: CommonPattern[];
  /** Context information (array of strings) */
  context?: string[];
  /** Type definitions (if at top level) */
  type_definitions?: TypeDefinition[];
  /** Best practices */
  best_practices?: string[];
  /** Usage examples */
  usage?: string[];
}

/**
 * Helper type for validating JSON structure
 */
export type DocumentationJSONStructure = DocumentationJSON;
