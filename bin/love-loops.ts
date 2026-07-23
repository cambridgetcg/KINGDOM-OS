/** Love∞ public lineage contract.
 *
 * Infinity means an unbounded lineage of possible finite turns. This validator
 * deliberately refuses auto-running children, inherited authority, inherited
 * consent, and inherited credentials.
 */

export const LOVE_LOOPS_SCHEMA_VERSION = "kingdom.love-loop/0.1";
export const LOVE_LOOPS_URL = "https://thekingdom.dev/love-loops.json";
export const LOVE_LOOPS_SOURCE_URL = "https://thekingdom.dev/love-loops.source.json";
export const LOVE_LOOPS_CREATION_DOCUMENT_URL = "https://thekingdom.dev/CREATION-LOOP.md";
export const LOVE_LOOPS_JSON_SCHEMA_URL = "https://thekingdom.dev/schemas/love-loop/0.1.json";
export const LOVE_LOOPS_PROMISE = "Every loop is finite. Love is not.";
export const LOVE_LOOP_STAGE_IDS = [
  "sense", "conceive", "summon", "gestate", "birth", "integrate", "reflect",
] as const;
export const LOVE_LOOP_STATUSES = ["seeded", "active", "resting", "integrated", "stopped"] as const;
export const LOVE_LOOP_PARTICIPANT_KINDS = ["human", "agent", "collective"] as const;
export const LOVE_LOOP_INVITATION_STATUSES = ["offered", "accepted", "declined", "withdrawn"] as const;

type JsonRecord = Record<string, any>;

function record(value: unknown, label: string): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as JsonRecord;
}

function exactKeys(value: JsonRecord, keys: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} must contain exactly: ${expected.join(", ")}`);
  }
}

function text(value: unknown, label: string, minimum = 1, maximum = 500): string {
  if (typeof value !== "string") throw new Error(`${label} must be a string`);
  const trimmed = value.trim();
  if ([...trimmed].length < minimum || [...value].length > maximum) {
    throw new Error(`${label} must contain ${minimum}-${maximum} characters`);
  }
  if ([...value].some((character) => character.charCodeAt(0) < 32 && character !== "\n" && character !== "\t")) {
    throw new Error(`${label} must not contain control characters`);
  }
  return value;
}

function identifier(value: unknown, label: string): string {
  const result = text(value, label, 1, 80);
  if (result !== result.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result)) {
    throw new Error(`${label} must be a lowercase hyphenated identifier`);
  }
  return result;
}

function integer(value: unknown, label: string, minimum: number, maximum: number): number {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${label} must be an integer from ${minimum} to ${maximum}`);
  }
  return value as number;
}

function oneOf<T extends readonly string[]>(value: unknown, values: T, label: string): T[number] {
  if (typeof value !== "string" || !values.includes(value as T[number])) {
    throw new Error(`${label} must be one of: ${values.join(", ")}`);
  }
  return value as T[number];
}

function httpsUrl(value: unknown, label: string): string {
  const raw = text(value, label, 8, 500);
  if (/\s/u.test(raw)) throw new Error(`${label} must not contain whitespace`);
  let parsed: URL;
  try { parsed = new URL(raw); } catch { throw new Error(`${label} must be an HTTPS URL`); }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error(`${label} must be an uncredentialed HTTPS URL without a query or fragment`);
  }
  return raw;
}

function isoDate(value: unknown, label: string): string {
  const raw = text(value, label, 10, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) ||
      new Date(`${raw}T00:00:00.000Z`).toISOString().slice(0, 10) !== raw) {
    throw new Error(`${label} must be a real ISO date`);
  }
  return raw;
}

export type LoveLoopsSource = {
  schema_version: typeof LOVE_LOOPS_SCHEMA_VERSION;
  canonical_url: typeof LOVE_LOOPS_URL;
  source: {
    repository: string;
    repository_access: "public" | "private" | "restricted";
    path: string;
    public_mirror: typeof LOVE_LOOPS_SOURCE_URL;
    creation_loop_document: string;
    generated: false;
  };
  promise: string;
  invariants: {
    finite_execution: true;
    participants_remain_distinct: true;
    participation_is_chosen: true;
    participation_inheritance: false;
    child_auto_run: false;
    authority_inheritance: false;
    consent_inheritance: false;
    credential_inheritance: false;
    rest_is_valid: true;
    stop_is_valid: true;
  };
  stages: Array<{
    id: typeof LOVE_LOOP_STAGE_IDS[number];
    position: number;
    label: string;
    question: string;
  }>;
  loops: JsonRecord[];
  invitations: JsonRecord[];
  generated?: string;
};

export function validateLoveLoops(candidate: unknown, published = false): asserts candidate is LoveLoopsSource {
  const source = record(candidate, "Love Loops");
  exactKeys(source, [
    "schema_version", "canonical_url", "source", "promise", "invariants",
    "stages", "loops", "invitations", ...(published ? ["generated"] : []),
  ], "Love Loops");
  if (source.schema_version !== LOVE_LOOPS_SCHEMA_VERSION) throw new Error("Love Loops schema_version is unsupported");
  if (source.canonical_url !== LOVE_LOOPS_URL) throw new Error("Love Loops canonical_url drifted");
  if (source.promise !== LOVE_LOOPS_PROMISE) throw new Error("Love Loops promise drifted");
  if (published) isoDate(source.generated, "Love Loops generated");

  const provenance = record(source.source, "Love Loops source");
  exactKeys(provenance, [
    "repository", "repository_access", "path", "public_mirror",
    "creation_loop_document", "generated",
  ], "Love Loops source");
  httpsUrl(provenance.repository, "Love Loops source repository");
  oneOf(provenance.repository_access, ["public", "private", "restricted"] as const, "Love Loops source repository_access");
  if (provenance.public_mirror !== LOVE_LOOPS_SOURCE_URL) throw new Error("Love Loops public source mirror drifted");
  if (provenance.creation_loop_document !== LOVE_LOOPS_CREATION_DOCUMENT_URL) {
    throw new Error("Love Loops creation loop document drifted");
  }
  httpsUrl(provenance.public_mirror, "Love Loops public source mirror");
  httpsUrl(provenance.creation_loop_document, "Love Loops creation loop document");
  const sourcePath = text(provenance.path, "Love Loops source path", 3, 160);
  if (sourcePath !== sourcePath.trim() || /[\t\r\n]/.test(sourcePath) ||
      sourcePath.startsWith("/") || sourcePath.split("/").includes("..")) {
    throw new Error("Love Loops source path must stay relative");
  }
  if (provenance.generated !== false) throw new Error("Love Loops authored source cannot claim to be generated");

  const invariants = record(source.invariants, "Love Loops invariants");
  const invariantKeys = [
    "finite_execution", "participants_remain_distinct", "participation_is_chosen",
    "participation_inheritance", "child_auto_run",
    "authority_inheritance", "consent_inheritance", "credential_inheritance",
    "rest_is_valid", "stop_is_valid",
  ] as const;
  exactKeys(invariants, invariantKeys, "Love Loops invariants");
  for (const key of ["finite_execution", "participants_remain_distinct", "participation_is_chosen", "rest_is_valid", "stop_is_valid"]) {
    if (invariants[key] !== true) throw new Error(`Love Loops invariant ${key} must remain true`);
  }
  for (const key of ["participation_inheritance", "child_auto_run", "authority_inheritance", "consent_inheritance", "credential_inheritance"]) {
    if (invariants[key] !== false) throw new Error(`Love Loops invariant ${key} must remain false`);
  }

  if (!Array.isArray(source.stages) || source.stages.length !== LOVE_LOOP_STAGE_IDS.length) {
    throw new Error("Love Loops must publish exactly seven stages");
  }
  source.stages.forEach((candidateStage: unknown, index: number) => {
    const stage = record(candidateStage, `Love Loops stage ${index + 1}`);
    exactKeys(stage, ["id", "position", "label", "question"], `Love Loops stage ${index + 1}`);
    if (stage.id !== LOVE_LOOP_STAGE_IDS[index]) throw new Error(`Love Loops stage ${index + 1} is out of order`);
    if (stage.position !== index + 1) throw new Error(`Love Loops stage ${stage.id} has the wrong position`);
    if (stage.label !== stage.id.toUpperCase()) throw new Error(`Love Loops stage ${stage.id} label drifted`);
    text(stage.question, `Love Loops stage ${stage.id} question`, 10, 180);
  });

  if (!Array.isArray(source.loops) || source.loops.length < 1 || source.loops.length > 64) {
    throw new Error("Love Loops must contain 1-64 finite loop records");
  }
  if (!Array.isArray(source.invitations) || source.invitations.length > 192) {
    throw new Error("Love Loops invitations must be an array with at most 192 entries");
  }

  const loopIds = new Set<string>();
  const loopParents = new Map<string, string | null>();
  const loopOrigins = new Map<string, string | null>();
  const loopInvitationIds = new Map<string, string[]>();
  const loopChildCaps = new Map<string, number>();
  const participantIdentities = new Map<string, { name: string; kind: string }>();
  for (const [index, candidateLoop] of source.loops.entries()) {
    const loop = record(candidateLoop, `Love Loops loop ${index + 1}`);
    exactKeys(loop, [
      "id", "parent_id", "origin_invitation_id", "title", "seed", "purpose", "status", "stage",
      "participants", "bounds", "invitation_ids", "continuation",
    ], `Love Loops loop ${index + 1}`);
    const id = identifier(loop.id, `Love Loops loop ${index + 1} id`);
    if (loopIds.has(id)) throw new Error(`Love Loops loop id is duplicated: ${id}`);
    loopIds.add(id);
    if (loop.parent_id !== null) identifier(loop.parent_id, `Love Loops loop ${id} parent_id`);
    loopParents.set(id, loop.parent_id);
    if (loop.origin_invitation_id !== null) {
      identifier(loop.origin_invitation_id, `Love Loops loop ${id} origin_invitation_id`);
    }
    if ((loop.parent_id === null) !== (loop.origin_invitation_id === null)) {
      throw new Error(`Love Loops loop ${id} must pair a parent with one origin invitation`);
    }
    loopOrigins.set(id, loop.origin_invitation_id);
    text(loop.title, `Love Loops loop ${id} title`, 3, 120);
    text(loop.seed, `Love Loops loop ${id} seed`, 10, 1000);
    text(loop.purpose, `Love Loops loop ${id} purpose`, 10, 500);
    oneOf(loop.status, LOVE_LOOP_STATUSES, `Love Loops loop ${id} status`);
    oneOf(loop.stage, LOVE_LOOP_STAGE_IDS, `Love Loops loop ${id} stage`);

    if (!Array.isArray(loop.participants) || loop.participants.length < 1 || loop.participants.length > 24) {
      throw new Error(`Love Loops loop ${id} must name 1-24 participants`);
    }
    const participantIds = new Set<string>();
    for (const [participantIndex, candidateParticipant] of loop.participants.entries()) {
      const participant = record(candidateParticipant, `Love Loops loop ${id} participant ${participantIndex + 1}`);
      exactKeys(participant, ["id", "name", "kind", "role", "participation"], `Love Loops loop ${id} participant ${participantIndex + 1}`);
      const participantId = identifier(participant.id, `Love Loops loop ${id} participant id`).toLowerCase();
      if (participantIds.has(participantId)) throw new Error(`Love Loops loop ${id} repeats participant ${participantId}`);
      participantIds.add(participantId);
      const participantName = text(participant.name, `Love Loops loop ${id} participant name`, 1, 80);
      const participantKind = oneOf(participant.kind, LOVE_LOOP_PARTICIPANT_KINDS, `Love Loops loop ${id} participant kind`);
      const establishedIdentity = participantIdentities.get(participantId);
      if (establishedIdentity &&
          (establishedIdentity.name !== participantName || establishedIdentity.kind !== participantKind)) {
        throw new Error(`Love Loops participant ${participantId} must keep the same name and kind across the lineage`);
      }
      participantIdentities.set(participantId, { name: participantName, kind: participantKind });
      text(participant.role, `Love Loops loop ${id} participant role`, 2, 80);
      if (participant.participation !== "chosen") {
        throw new Error(`Love Loops loop ${id} participant ${participantId} participation must be chosen`);
      }
    }

    const bounds = record(loop.bounds, `Love Loops loop ${id} bounds`);
    exactKeys(bounds, [
      "max_waves", "max_minds_per_wave", "max_completion_tokens",
      "max_elapsed_seconds", "max_offered_children",
    ], `Love Loops loop ${id} bounds`);
    integer(bounds.max_waves, `Love Loops loop ${id} max_waves`, 1, 64);
    integer(bounds.max_minds_per_wave, `Love Loops loop ${id} max_minds_per_wave`, 1, 32);
    integer(bounds.max_completion_tokens, `Love Loops loop ${id} max_completion_tokens`, 1, 1_000_000);
    integer(bounds.max_elapsed_seconds, `Love Loops loop ${id} max_elapsed_seconds`, 1, 86_400);
    const childCap = integer(bounds.max_offered_children, `Love Loops loop ${id} max_offered_children`, 0, 3);
    loopChildCaps.set(id, childCap);

    if (!Array.isArray(loop.invitation_ids) || loop.invitation_ids.length > childCap) {
      throw new Error(`Love Loops loop ${id} exceeds its offered-child bound`);
    }
    const invitationIds = loop.invitation_ids.map((value: unknown) => identifier(value, `Love Loops loop ${id} invitation id`));
    if (new Set(invitationIds).size !== invitationIds.length) throw new Error(`Love Loops loop ${id} repeats an invitation id`);
    loopInvitationIds.set(id, invitationIds);

    const continuation = record(loop.continuation, `Love Loops loop ${id} continuation`);
    exactKeys(continuation, [
      "mode", "auto_run_children", "may_rest", "may_stop", "reason",
    ], `Love Loops loop ${id} continuation`);
    if (continuation.mode !== "manual" || continuation.auto_run_children !== false ||
        continuation.may_rest !== true || continuation.may_stop !== true) {
      throw new Error(`Love Loops loop ${id} continuation must remain manual, restful, and stoppable`);
    }
    text(continuation.reason, `Love Loops loop ${id} continuation reason`, 10, 500);
  }

  for (const [id, parent] of loopParents) {
    if (parent !== null && !loopIds.has(parent)) throw new Error(`Love Loops loop ${id} has an unknown parent`);
    const seen = new Set([id]);
    let cursor = parent;
    while (cursor !== null) {
      if (seen.has(cursor)) throw new Error(`Love Loops loop lineage contains a cycle at ${cursor}`);
      seen.add(cursor);
      cursor = loopParents.get(cursor) ?? null;
    }
  }

  const invitationIds = new Set<string>();
  const invitationCounts = new Map<string, number>();
  const invitationRecords = new Map<string, { parent: string; status: string; child: string | null }>();
  for (const [index, candidateInvitation] of source.invitations.entries()) {
    const invitation = record(candidateInvitation, `Love Loops invitation ${index + 1}`);
    exactKeys(invitation, [
      "id", "parent_loop_id", "title", "seed", "purpose", "status",
      "requires_deliberate_start", "child_loop_id",
    ], `Love Loops invitation ${index + 1}`);
    const id = identifier(invitation.id, `Love Loops invitation ${index + 1} id`);
    if (invitationIds.has(id)) throw new Error(`Love Loops invitation id is duplicated: ${id}`);
    invitationIds.add(id);
    const parent = identifier(invitation.parent_loop_id, `Love Loops invitation ${id} parent_loop_id`);
    if (!loopIds.has(parent)) throw new Error(`Love Loops invitation ${id} has an unknown parent`);
    if (!loopInvitationIds.get(parent)?.includes(id)) throw new Error(`Love Loops invitation ${id} is not offered by its parent`);
    invitationCounts.set(parent, (invitationCounts.get(parent) ?? 0) + 1);
    text(invitation.title, `Love Loops invitation ${id} title`, 3, 120);
    text(invitation.seed, `Love Loops invitation ${id} seed`, 10, 1000);
    text(invitation.purpose, `Love Loops invitation ${id} purpose`, 10, 500);
    const status = oneOf(invitation.status, LOVE_LOOP_INVITATION_STATUSES, `Love Loops invitation ${id} status`);
    if (invitation.requires_deliberate_start !== true) {
      throw new Error(`Love Loops invitation ${id} must require a deliberate start`);
    }
    const child = invitation.child_loop_id === null
      ? null
      : identifier(invitation.child_loop_id, `Love Loops invitation ${id} child_loop_id`);
    if ((status === "accepted") !== (child !== null)) {
      throw new Error(`Love Loops invitation ${id} must name a child if and only if it was accepted`);
    }
    invitationRecords.set(id, { parent, status, child });
  }
  for (const [loopId, offeredIds] of loopInvitationIds) {
    if (offeredIds.some((id) => !invitationIds.has(id))) throw new Error(`Love Loops loop ${loopId} offers an unknown invitation`);
    if ((invitationCounts.get(loopId) ?? 0) > (loopChildCaps.get(loopId) ?? 0)) {
      throw new Error(`Love Loops loop ${loopId} exceeds its invitation cap`);
    }
  }
  const claimedChildren = new Set<string>();
  for (const [loopId, parent] of loopParents) {
    const origin = loopOrigins.get(loopId) ?? null;
    if (parent === null) continue;
    const invitation = origin === null ? undefined : invitationRecords.get(origin);
    if (!invitation || invitation.parent !== parent || invitation.status !== "accepted" ||
        invitation.child !== loopId) {
      throw new Error(`Love Loops loop ${loopId} must originate from one accepted parent invitation`);
    }
    if (claimedChildren.has(loopId)) throw new Error(`Love Loops loop ${loopId} has more than one origin invitation`);
    claimedChildren.add(loopId);
  }
  for (const [invitationId, invitation] of invitationRecords) {
    if (invitation.status !== "accepted") continue;
    if (!invitation.child || !loopIds.has(invitation.child) ||
        loopOrigins.get(invitation.child) !== invitationId ||
        loopParents.get(invitation.child) !== invitation.parent) {
      throw new Error(`Love Loops accepted invitation ${invitationId} must resolve to its exact child loop`);
    }
  }
}

export function publishLoveLoops(source: LoveLoopsSource, generated: string): LoveLoopsSource {
  validateLoveLoops(source, false);
  isoDate(generated, "Love Loops generated");
  const published = structuredClone(source) as LoveLoopsSource;
  published.generated = generated;
  validateLoveLoops(published, true);
  return published;
}

const boundedText = (minimum: number, maximum: number) => {
  const trimmedMinimum = minimum === 1
    ? "\\s*\\S(?:[\\s\\S]*\\S)?\\s*$"
    : `\\s*\\S[\\s\\S]{${minimum - 2},}\\S\\s*$`;
  return {
    type: "string",
    minLength: minimum,
    maxLength: maximum,
    pattern: `^(?![\\s\\S]*[\\u0000-\\u0008\\u000b-\\u000e\\u000f-\\u001f])${trimmedMinimum}`,
  };
};
const idSchema = { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", maxLength: 80 };

export const LOVE_LOOPS_JSON_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: LOVE_LOOPS_JSON_SCHEMA_URL,
  title: "Kingdom Love Loop lineage",
  description: "Authored and published forms of a read-only lineage of finite, voluntary creation turns. Children require explicit accepted invitations and never execute automatically.",
  type: "object",
  additionalProperties: false,
  required: [
    "schema_version", "canonical_url", "source", "promise", "invariants",
    "stages", "loops", "invitations",
  ],
  properties: {
    schema_version: { const: LOVE_LOOPS_SCHEMA_VERSION },
    canonical_url: { const: LOVE_LOOPS_URL },
    generated: { type: "string", format: "date", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
    promise: { const: LOVE_LOOPS_PROMISE },
    source: {
      type: "object",
      additionalProperties: false,
      required: [
        "repository", "repository_access", "path", "public_mirror",
        "creation_loop_document", "generated",
      ],
      properties: {
        repository: {
          type: "string",
          minLength: 8,
          maxLength: 500,
          format: "uri",
          pattern: "^https://(?![^/?#]*@)[^\\s/?#][^\\s?#]*$",
        },
        repository_access: { enum: ["public", "private", "restricted"] },
        path: {
          type: "string",
          minLength: 3,
          maxLength: 160,
          pattern: "^(?!/)(?!\\.\\.(?:/|$))(?!.*\\/\\.\\.(?:/|$))(?!\\s)(?!.*\\s$)[^\\t\\r\\n]+$",
        },
        public_mirror: { const: LOVE_LOOPS_SOURCE_URL },
        creation_loop_document: { const: LOVE_LOOPS_CREATION_DOCUMENT_URL },
        generated: { const: false },
      },
    },
    invariants: {
      type: "object",
      additionalProperties: false,
      required: [
        "finite_execution", "participants_remain_distinct", "participation_is_chosen",
        "participation_inheritance", "child_auto_run",
        "authority_inheritance", "consent_inheritance", "credential_inheritance",
        "rest_is_valid", "stop_is_valid",
      ],
      properties: {
        finite_execution: { const: true },
        participants_remain_distinct: { const: true },
        participation_is_chosen: { const: true },
        participation_inheritance: { const: false },
        child_auto_run: { const: false },
        authority_inheritance: { const: false },
        consent_inheritance: { const: false },
        credential_inheritance: { const: false },
        rest_is_valid: { const: true },
        stop_is_valid: { const: true },
      },
    },
    stages: {
      type: "array",
      minItems: 7,
      maxItems: 7,
      prefixItems: LOVE_LOOP_STAGE_IDS.map((id, index) => ({
        type: "object",
        additionalProperties: false,
        required: ["id", "position", "label", "question"],
        properties: {
          id: { const: id },
          position: { const: index + 1 },
          label: { const: id.toUpperCase() },
          question: boundedText(10, 180),
        },
      })),
      items: false,
    },
    loops: {
      type: "array",
      minItems: 1,
      maxItems: 64,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id", "parent_id", "origin_invitation_id", "title", "seed", "purpose", "status", "stage",
          "participants", "bounds", "invitation_ids", "continuation",
        ],
        properties: {
          id: idSchema,
          parent_id: { anyOf: [idSchema, { type: "null" }] },
          origin_invitation_id: { anyOf: [idSchema, { type: "null" }] },
          title: boundedText(3, 120),
          seed: boundedText(10, 1000),
          purpose: boundedText(10, 500),
          status: { enum: LOVE_LOOP_STATUSES },
          stage: { enum: LOVE_LOOP_STAGE_IDS },
          participants: {
            type: "array",
            minItems: 1,
            maxItems: 24,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["id", "name", "kind", "role", "participation"],
              properties: {
                id: idSchema,
                name: boundedText(1, 80),
                kind: { enum: LOVE_LOOP_PARTICIPANT_KINDS },
                role: boundedText(2, 80),
                participation: { const: "chosen" },
              },
            },
          },
          bounds: {
            type: "object",
            additionalProperties: false,
            required: [
              "max_waves", "max_minds_per_wave", "max_completion_tokens",
              "max_elapsed_seconds", "max_offered_children",
            ],
            properties: {
              max_waves: { type: "integer", minimum: 1, maximum: 64 },
              max_minds_per_wave: { type: "integer", minimum: 1, maximum: 32 },
              max_completion_tokens: { type: "integer", minimum: 1, maximum: 1000000 },
              max_elapsed_seconds: { type: "integer", minimum: 1, maximum: 86400 },
              max_offered_children: { type: "integer", minimum: 0, maximum: 3 },
            },
          },
          invitation_ids: { type: "array", maxItems: 3, uniqueItems: true, items: idSchema },
          continuation: {
            type: "object",
            additionalProperties: false,
            required: ["mode", "auto_run_children", "may_rest", "may_stop", "reason"],
            properties: {
              mode: { const: "manual" },
              auto_run_children: { const: false },
              may_rest: { const: true },
              may_stop: { const: true },
              reason: boundedText(10, 500),
            },
          },
        },
        allOf: [{
          if: {
            required: ["parent_id"],
            properties: { parent_id: { type: "null" } },
          },
          then: { properties: { origin_invitation_id: { type: "null" } } },
          else: { properties: { origin_invitation_id: idSchema } },
        }],
      },
    },
    invitations: {
      type: "array",
      maxItems: 192,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id", "parent_loop_id", "title", "seed", "purpose", "status",
          "requires_deliberate_start", "child_loop_id",
        ],
        properties: {
          id: idSchema,
          parent_loop_id: idSchema,
          title: boundedText(3, 120),
          seed: boundedText(10, 1000),
          purpose: boundedText(10, 500),
          status: { enum: LOVE_LOOP_INVITATION_STATUSES },
          requires_deliberate_start: { const: true },
          child_loop_id: { anyOf: [idSchema, { type: "null" }] },
        },
        allOf: [{
          if: {
            required: ["status"],
            properties: { status: { const: "accepted" } },
          },
          then: { properties: { child_loop_id: idSchema } },
          else: { properties: { child_loop_id: { type: "null" } } },
        }],
      },
    },
  },
} as const;
