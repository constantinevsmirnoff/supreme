/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agentChat from "../agentChat.js";
import type * as agentTools from "../agentTools.js";
import type * as assignmentPreview from "../assignmentPreview.js";
import type * as assignmentSettings from "../assignmentSettings.js";
import type * as domain_assignJobTemplates from "../domain/assignJobTemplates.js";
import type * as domain_assignmentSettings from "../domain/assignmentSettings.js";
import type * as domain_listFilters from "../domain/listFilters.js";
import type * as embeddings from "../embeddings.js";
import type * as flexiblePages from "../flexiblePages.js";
import type * as jobTemplates from "../jobTemplates.js";
import type * as jobs from "../jobs.js";
import type * as lib_embeddingDb from "../lib/embeddingDb.js";
import type * as lib_embeddingText from "../lib/embeddingText.js";
import type * as lib_voyageClient from "../lib/voyageClient.js";
import type * as listWithAssignments from "../listWithAssignments.js";
import type * as seed from "../seed.js";
import type * as templateConditionConflict from "../templateConditionConflict.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agentChat: typeof agentChat;
  agentTools: typeof agentTools;
  assignmentPreview: typeof assignmentPreview;
  assignmentSettings: typeof assignmentSettings;
  "domain/assignJobTemplates": typeof domain_assignJobTemplates;
  "domain/assignmentSettings": typeof domain_assignmentSettings;
  "domain/listFilters": typeof domain_listFilters;
  embeddings: typeof embeddings;
  flexiblePages: typeof flexiblePages;
  jobTemplates: typeof jobTemplates;
  jobs: typeof jobs;
  "lib/embeddingDb": typeof lib_embeddingDb;
  "lib/embeddingText": typeof lib_embeddingText;
  "lib/voyageClient": typeof lib_voyageClient;
  listWithAssignments: typeof listWithAssignments;
  seed: typeof seed;
  templateConditionConflict: typeof templateConditionConflict;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
