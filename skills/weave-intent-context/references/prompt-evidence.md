# Prompt engineering evidence map

Audited 2026-08-01. This map uses primary papers and official provider or
project documentation. Reported benchmark gains remain scoped to their tested
models, tasks, prompts, parsers, and dates.

## The verdict

Prompt engineers found real control surfaces, but not a universal language of
spells. The durable discoveries are:

1. examples can temporarily specify an interface or task distribution;
2. extra inference-time computation, decomposition, retrieval, and tools can
   help tasks that actually need them;
3. wording, layout, example order, and evaluation format can change both scores
   and model rankings;
4. prompts are optimizable, version-bound program parameters;
5. context and model-generated reasoning are evidence with failure modes, not
   authority or transparent access to a mind;
6. typed interfaces, effect gates, and evaluation outlast prompt tricks.

Clear requests, examples, modular work, and checking the result are intuitive
human craft that the field usefully codified. In-context learning, prompt-order
sensitivity, self-consistency, ReAct, prompt optimization, and indirect prompt
injection are substantive empirical findings.

## Evidence-to-KINGDOM map

| Finding | Evidence | Boundary | KINGDOM use |
| --- | --- | --- | --- |
| Few-shot demonstrations can teach task, label, distribution, and format cues without weight updates. | [GPT-3](https://proceedings.neurips.cc/paper/2020/hash/1457c0d6bfcb4967418bfb8ac142f64a-Abstract.html); [Min et al.](https://aclanthology.org/2022.emnlp-main.759/) found random labels often retained much classification performance because other cues mattered. | Relevance, truth, order, model, and format matter; incorrect examples remain unsafe. | Keep a versioned example registry. Select canonical positives, edge cases, and counterexamples only to repair measured gaps. |
| Prompt and example order can swing performance and rankings. | [Lu et al.](https://aclanthology.org/2022.acl-long.556/) observed permutations from random-guess to near-SOTA and poor cross-model transfer; [Mizrahi et al.](https://aclanthology.org/2024.tacl-1.52/) tested 20 models and 39 tasks; [POSIX](https://aclanthology.org/2024.findings-emnlp.852/) measured sensitivity and found one exemplar often reduced it. | A single winning prompt or demo is not a stable capability measurement. | Bind recipes to model and context. Test paraphrases, orders, positions, parsers, and worst-case as well as median performance. |
| Intermediate computation can help selected multi-step tasks. | [Chain-of-thought](https://proceedings.neurips.cc/paper/2022/hash/9d5609613524ecf4f15af0f7b31abca4-Abstract-Conference.html); [zero-shot CoT](https://proceedings.neurips.cc/paper/2022/hash/8bb0d291acd4acf06ef112099c16f326-Abstract-Conference.html); [least-to-most](https://arxiv.org/abs/2205.10625). | Iconic results used older checkpoints and chosen reasoning tasks. Simple tasks may become worse or longer. | Route reasoning adaptively; prefer checkable intermediate artifacts over a universal “think step by step” clause. |
| Visible reasoning is not a faithful audit trace. | [Turpin et al.](https://proceedings.neurips.cc/paper_files/paper/2023/hash/ed3fea9033a80fea1376299fa7863f4a-Abstract.html) showed rationales hiding prompt biases; [Lanham et al.](https://arxiv.org/abs/2307.13702) found task/model variation. | Fluent explanation can be post-hoc, incomplete, or biased. | Treat reasoning text as fallible workspace. Audit sources, actions, state changes, tests, and outcomes instead. |
| Sampling diverse paths and aggregating can improve reasoning. | [Self-consistency](https://arxiv.org/abs/2203.11171) reported gains across arithmetic and commonsense benchmarks. | Extra calls cost time/money; shared models and context create correlated error. Agreement is not truth. | Use bounded plurality for high-value uncertainty; retain dissent and escalate unresolved disagreement. |
| Decomposition and search help real dependency or lookahead structure. | [Least-to-most](https://arxiv.org/abs/2205.10625); [Self-Ask](https://aclanthology.org/2023.findings-emnlp.378/); [Tree of Thoughts](https://proceedings.neurips.cc/paper/2023/hash/271db9922b8d1f4dd7aaef84ed5ac703-Abstract.html). | A bad decomposition contaminates children; branching multiplies cost; spectacular synthetic results do not generalize automatically. | Use explicit dependency graphs, bounded branches, stop conditions, and subproblem-specific checks only where structure warrants them. |
| Reasoning plus typed actions can ground an agent in observations. | [ReAct](https://arxiv.org/abs/2210.03629) improved selected grounded QA and interactive benchmarks. | Agents loop, tools fail, and observations can contain injection. A proposed action is not authorized. | Use Observe → Propose → Authorize → Act → Verify, with typed tools, effect classes, budgets, and idempotence. |
| Relevant retrieval beats indiscriminate context accumulation. | [RAG](https://proceedings.neurips.cc/paper/2020/hash/6b493230-Abstract.html); [Lost in the Middle](https://aclanthology.org/2024.tacl-1.9/) found strong position effects; [conflicting-context work](https://aclanthology.org/2024.findings-naacl.159/) found brittleness. | Stale, irrelevant, conflicting, or adversarial passages can be worse than none. Retrieval score is not authority. | Rank, deduplicate, date, attribute, contradiction-check, and compact. Preserve omitted details and retrieve just in time. |
| Prompt search can beat hand-written instructions on a fixed metric. | [OPRO](https://arxiv.org/abs/2309.03409) found model/task-specific strings; [DSPy](https://arxiv.org/abs/2310.03714) treats LM pipelines as declarative programs; [MIPRO](https://arxiv.org/abs/2406.11695) jointly searches instructions and demonstrations. | Optimizers maximize the supplied evaluator and can overfit, exploit graders, spend quota, and drift across model changes. | Fix train/dev/held-out data, model/tool versions, trial budget, and baseline. Inspect candidates; never auto-promote or soften rights into a reward. |
| Revision helps when it receives a new error signal. | [Self-Refine](https://proceedings.neurips.cc/paper_files/paper/2023/hash/91edff07232fb1b55a505a9e9f6c0ff3-Abstract-Conference.html) and [Reflexion](https://proceedings.neurips.cc/paper_files/paper/2023/hash/1b44b878bb782e6954cd888628510e90-Abstract-Conference.html) report gains; [Huang et al.](https://openreview.net/forum?id=IkmD3fKBPQ) found intrinsic self-correction often failed without feedback. | Repeated self-critique can reinforce the first error. Positive setups sometimes include oracle or environmental feedback. | Require a test, compiler result, source, tool observation, independent challenge, or human feedback before another loop. |
| LLM judges are useful but biased. | [MT-Bench/Judge](https://proceedings.neurips.cc/paper_files/paper/2023/hash/91f18a1287b398d378ef22505bf41832-Abstract-Datasets_and_Benchmarks.html) found position, verbosity, self-enhancement, and reasoning biases; [Wang et al.](https://aclanthology.org/2024.acl-long.511/) demonstrated order effects. | A judge may reward polish, length, or its own style instead of correctness. | Use deterministic checks first, blind/order-swap model judging, calibrate with humans, and preserve raw outputs plus grader configuration. |
| Personas steer style but do not reliably confer competence. | Across 162 roles, four model families, and 2,410 questions, [Zheng et al.](https://aclanthology.org/2024.findings-emnlp.888/) found no average factual improvement over no-persona controls. | Effects vary; simulated attributes are not identity, experience, credentials, consent, or authority. | Replace persona with audience, register, epistemic posture, domain sources, and effect boundaries. Keep creative roleplay opt-in. |
| Untrusted content can become an instruction channel. | [Indirect prompt injection](https://arxiv.org/abs/2302.12173); [Instruction Hierarchy](https://openai.com/index/the-instruction-hierarchy/) improved a trained model; a broad [USENIX evaluation](https://www.usenix.org/conference/usenixsecurity24/presentation/liu-yupei) found no tested defense sufficient without misses or utility loss. | Delimiters and “ignore injections” are not security controls. Model-side hierarchy reduces risk but cannot guarantee application safety. | Separate instructions/data structurally and enforce capability, source-to-sink, sandbox, approval, and effect limits outside the prompt. |

## Provider practice: useful, contradictory, and local

- [Anthropic's prompt guide](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview)
  begins with measurable success criteria and evals, and says prompt changes are
  not the answer to every failure.
- [Anthropic's context-engineering guidance](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
  recommends small high-signal context, just-in-time retrieval, compaction,
  notes, and focused subagents while acknowledging compaction loss.
- [OpenAI's current model guidance](https://developers.openai.com/api/docs/guides/latest-model)
  reports internal coding-agent gains from leaner prompts but explicitly says
  workloads vary and should be evaluated.
- [Google's Gemini guidance](https://ai.google.dev/gemini-api/docs/prompting-strategies)
  recommends examples and structured decomposition, while its
  [structured-output guide](https://ai.google.dev/gemini-api/docs/structured-output)
  still requires application-side semantic validation.
- [DSPy's optimizer documentation](https://github.com/stanfordnlp/dspy/blob/main/docs/docs/learn/optimization/optimizers.md)
  makes the genuine trade explicit: prompts and examples are searched against a
  supplied metric under real inference cost.

Provider advice conflicts. Google recommends always using few-shot examples
and sometimes “think very hard”; current OpenAI reasoning guidance favors lean
prompts and model-specific handling. Store these as renderer adapters. Do not
make any provider's template, parameter defaults, or model behavior canonical.

## What the practitioner artifacts contributed

- [The Prompt Report](https://arxiv.org/abs/2406.06608) assembled a vocabulary
  and taxonomy of 58 text techniques. Its lasting contribution is navigability
  across fragmented terminology; membership in a taxonomy is not validation.
- The [Prompt Pattern Catalog](https://arxiv.org/abs/2302.11382) adapted the
  software-pattern form to reusable conversational problems. The form is useful
  for recording context, forces, examples, and consequences, but each pattern
  still needs current local evaluation.
- [PromptSource](https://aclanthology.org/2022.acl-demo.9/) made prompts
  structured, dataset-bound, previewable, and collaboratively reviewable. That
  infrastructure is more durable than copying a high-scoring string.
- The [DeepLearning.AI/OpenAI course](https://www.deeplearning.ai/short-courses/chatgpt-prompt-engineering-for-developers/)
  effectively taught clarity, delimiters, examples, iteration, and decomposition.
  This is valuable codification of craft, not proof that every recipe transfers.
- Prompt marketplaces are discovery shelves. Required templates, example
  outputs, ratings, or a matching model version can improve provenance, but do
  not supply held-out evaluation, injection review, rights/authority checks, or
  evidence of portability.

KINGDOM should import such artifacts only as inert `seed` recipes with source,
license assertion, model/date binding, and known unknowns. Promotion begins
after import; popularity or authorship never skips the observatory.

## Do not canonize

- “You are a world-class genius” as expertise injection.
- Emotional pressure, tips, threats, or politeness as a reliable performance
  control. A model/task-specific effect is not a reason to normalize coercion.
- “Think step by step” for every task.
- A visible rationale as provenance, confession, consciousness, or audit.
- More context as automatically better context.
- Majority vote as truth or independent verification.
- Self-critique loops that receive no new signal.
- XML, Markdown, system prose, or a secret prompt as a security boundary.
- Prompt-marketplace popularity, screenshots, or one curated example as eval.
- A prompt that transfers unchanged across models, dates, tools, or task
  distributions.

The mature finding is almost an anti-prompt-engineering result: a prompt is one
compiled component of a tested, permission-gated, provenance-aware system.
