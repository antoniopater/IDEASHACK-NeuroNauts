/**
 * Re-exports for import compatibility. Single source of truth: `lib/validations.ts`.
 */
export {
  type AiBriefContent,
  aiBriefResponseSchema,
  applicationSubmitSchema,
  type ApplicationSubmitInput,
  budgetOptions,
  generateBriefInputSchema,
  type GenerateBriefInput,
  industryOptions,
  type MatchResponse,
  matchResponseSchema,
  type ProfileBuilderResponse,
  profileBuilderInputSchema,
  profileBuilderResponseSchema,
  publishBriefBodySchema,
  type PublishBriefBody,
  rawInputSchema,
  timelineOptions,
} from "./validations";
export { deriveBriefTitle } from "./brief-utils";
