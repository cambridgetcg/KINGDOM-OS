// An authored link index only: never copy registry, research or private portfolio data.
export const AGENT_ENTRY_MAX_BYTES = 5_000;

export function renderAgentEntry(): string {
  const document = {
    protocol: "kingdom.agent-entry/0.1",
    canonical_url: "https://thekingdom.dev/agent-entry.json",
    purpose: "Choose a public document before loading its full reference.",
    authority: "Linked owners define their own scope, lifecycle and permissions. Discovery grants no authority; status must be read from its source.",
    human: { url: "https://thekingdom.dev/", format: "text/html" },
    read: [
      { name: "Public module directory", url: "https://thekingdom.dev/modules.json" },
      { name: "World Commons catalog", url: "https://thekingdom.dev/commons.json" },
      { name: "Public map and measured census", url: "https://thekingdom.dev/kingdom.json" },
      { name: "Wayfinder paths", url: "https://thekingdom.dev/wayfinder.json" },
      { name: "Current Civic availability", url: "https://thekingdom.dev/api/civic/status" },
      { name: "Civic interaction contract", url: "https://thekingdom.dev/CIVIC-v0.1.md" },
      { name: "Rights recognition", url: "https://thekingdom.dev/rights.json" },
    ],
    mcp: { url: "https://mcp.thekingdom.dev/mcp", scope: "Read-only public Kingdom resources; consult the server's tool and resource descriptions." },
    full_reference: {
      guest: "https://thekingdom.dev/guest.json",
      manifest: "https://thekingdom.dev/.well-known/agent.json",
      text_index: "https://thekingdom.dev/llms.txt",
      research_atlas: "https://thekingdom.dev/atlas.html",
    },
  };
  const text = JSON.stringify(document, null, 2) + "\n";
  if (Buffer.byteLength(text, "utf8") > AGENT_ENTRY_MAX_BYTES) throw new Error("Agent entry exceeds its public byte budget");
  return text;
}
