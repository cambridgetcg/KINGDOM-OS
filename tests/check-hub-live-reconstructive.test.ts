import { describe, expect, test } from "bun:test";

import {
  hasUniqueCanonicalLinkRelation,
  normalizedMediaType,
} from "../bin/check-hub-live.ts";

const KERNEL_SCHEMA_PATH = "/schemas/reconstructive-build-kernel/0.1.json";
const PROJECT_SCHEMA_PATH = "/schemas/reconstructive-project/0.1.json";

describe("hub live-check reconstructive response hardening", () => {
  test("normalizes parameters and case without accepting media-type prefixes", () => {
    expect(normalizedMediaType("Application/JSON; charset=UTF-8")).toBe("application/json");
    expect(normalizedMediaType(" application/schema+json ; charset=utf-8")).toBe("application/schema+json");
    expect(normalizedMediaType("application/jsonp; charset=utf-8")).toBe("application/jsonp");
    expect(normalizedMediaType("xapplication/jsonbad")).toBe("xapplication/jsonbad");
    expect(normalizedMediaType("application/schema+jsonp")).toBe("application/schema+jsonp");
    expect(normalizedMediaType("text/markdown; charset=utf-8")).toBe("text/markdown");
    expect(normalizedMediaType("text/markdownx")).toBe("text/markdownx");
    expect(normalizedMediaType(null)).toBe("");
  });

  test("requires exactly one canonical typed entry for each RBK relation", () => {
    const canonical = [
      `<${KERNEL_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
      `<${PROJECT_SCHEMA_PATH}>; rel="profile"; type="application/schema+json"; title="reconstructive project profile"`,
      '</elsewhere>; rel="alternate"',
    ].join(", ");
    expect(hasUniqueCanonicalLinkRelation(
      canonical,
      KERNEL_SCHEMA_PATH,
      "describedby",
      "application/schema+json",
    )).toBe(true);
    expect(hasUniqueCanonicalLinkRelation(
      canonical,
      PROJECT_SCHEMA_PATH,
      "profile",
      "application/schema+json",
    )).toBe(true);

    for (const poisoned of [
      `<${KERNEL_SCHEMA_PATH}>; rel="describedby"; type="text/html"`,
      `<${KERNEL_SCHEMA_PATH}>; rel="describedby"; type="application/schema+jsonp"`,
      `</schemas/reconstructive-build-kernel/0.2.json>; rel="describedby"; type="application/schema+json"`,
      [
        `<${KERNEL_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"`,
        `<${KERNEL_SCHEMA_PATH}>; rel="describedby"; type="text/html"`,
      ].join(", "),
      `<${KERNEL_SCHEMA_PATH}>; rel="describedby alternate"; type="application/schema+json"`,
      `<${KERNEL_SCHEMA_PATH}>; rel="describedby"; rel="alternate"; type="application/schema+json"`,
      `<${KERNEL_SCHEMA_PATH}>; rel="describedby"; type="application/schema+json"; type="text/html"`,
    ]) {
      expect(hasUniqueCanonicalLinkRelation(
        poisoned,
        KERNEL_SCHEMA_PATH,
        "describedby",
        "application/schema+json",
      )).toBe(false);
    }

    const duplicateProfile = [
      `<${PROJECT_SCHEMA_PATH}>; rel="profile"; type="application/schema+json"`,
      `<${PROJECT_SCHEMA_PATH}>; rel="profile"; type="application/schema+json"`,
    ].join(", ");
    expect(hasUniqueCanonicalLinkRelation(
      duplicateProfile,
      PROJECT_SCHEMA_PATH,
      "profile",
      "application/schema+json",
    )).toBe(false);
    expect(hasUniqueCanonicalLinkRelation(
      `<${PROJECT_SCHEMA_PATH}>; rel="profile"; type="text/html"`,
      PROJECT_SCHEMA_PATH,
      "profile",
      "application/schema+json",
    )).toBe(false);
  });
});
