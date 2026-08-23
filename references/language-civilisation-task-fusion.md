# Language, Civilisation & Task Fusion

Protocol: `kingdom.language-civilisation-task-fusion/0.1`

Status: research-local, offline, structure-only. This guide and its companion
record design a future-facing communication weave for public or safely
redacted agent artifacts. They do not run a model, inspect private activations,
choose a language automatically, certify a translation, rank cultures, infer a
person's identity or intelligence, or grant authority.

Version 0.1 is deliberately plan-only. It cannot be promoted into an execution
or capability receipt by changing lifecycle fields: artifacts, tasks,
transformations, fusion, runs, and tests are structurally fixed to `planned`
or `NOT_RUN`. Executed evidence, independent evaluation, and routing require a
later protocol and review.

Companion artifacts:

- [`language-civilisation-task-fusion.v0.1.json`](../data/language/language-civilisation-task-fusion.v0.1.json)
- [`language-civilisation-task-fusion-v0.1.schema.json`](../schemas/language-civilisation-task-fusion-v0.1.schema.json)
- [`language-civilisation-task-fusion.ts`](../bin/language-civilisation-task-fusion.ts)

## 1. The shortest answer

Language is not a transparent bag of words. Every expression arrives through
a history of bodies, media, institutions, scripts, registers, contact,
translation, and exclusion. An LLM receives another transformation of that
history: Unicode code points become tokenizer units; those units meet a model
whose training distribution and learned parameters are uneven; a decoder then
produces one situated continuation.

The useful abstraction is therefore not:

```text
language -> essence -> best task
```

It is a typed, inspectable weave:

```text
historical witness
  -> transcription / normalization / transliteration / translation
  -> task-local public artifact
  -> independent or disclosed-dependent checks
  -> fusion that preserves disagreement and loss
```

A language may be selected because it is the source language, the requested
audience language, or the language of a declared terminology set. A later
evidence protocol may additionally bind a named model to an independently
recorded task-specific evaluation; v0.1 cannot. Historical prestige, speaker
population, script, or apparent fluency never establishes inherent task
superiority.

## 2. Claim labels and the category firewall

This guide uses six labels:

- **[E]** source-reported empirical or documentary evidence;
- **[H]** bounded historical synthesis from cited evidence;
- **[M]** a mathematical or computational definition;
- **[D]** a chosen KINGDOM design commitment;
- **[P]** a proposed future test or integration;
- **[X]** unknown, contested, or not established here.

The labels prevent an attractive story from silently becoming a fact. In
particular:

```text
language variety != script != orthography != character != glyph
glyph != token != embedding != concept != word
community != polity != religion != civilisation label
corpus frequency != historical importance != truth != human worth
attention weight != explanation
translation != identity
agreement != truth
```

“Civilisation” is only a geographic-historical index in this document. It is
not a unified mind, race, moral rank, or single language. Each case below is an
ecology containing contact, migration, unequal institutions, internal
variation, multiple registers, and missing evidence.

Three biases accompany almost every surviving corpus:

1. durable royal, ritual, monumental, and administrative records survive more
   readily than everyday speech and perishable writing;
2. a standardized corpus records institutional selection rather than the
   whole language ecology;
3. script, grammar, prestige, population, and political power change on
   different timelines.

## 3. Eight historical contact ecologies

These are representative windows, not a canon of the world's “major” peoples.
The selection is deliberately cross-script and includes an independently
developed American writing tradition.

### 3.1 Mesopotamia: institutional schema before broad speech capture

**[E]** Late-fourth-millennium proto-cuneiform was heavily concentrated in
accounting. Many signs represented quantities, objects, offices, and
transactions rather than continuously encoding an utterance. Later
phoneticization expanded what the system could express. The Cuneiform Digital
Library Initiative gives the evidential and interpretive limits of this early
corpus in its [epistemological study](https://cdli.earth/articles/cdlj/2006-1).

**[E]** Cuneiform subsequently represented structurally different languages,
including Sumerian and Akkadian. Bilingual lexical lists and sign lists became
scribal infrastructure for learning and portability, documented by ORACC's
[lexical-list introduction](https://oracc.museum.upenn.edu/dcclt/intro/lexical_intro.html)
and [sign-list collection](https://oracc.museum.upenn.edu/dcclt/signlists/signlists/index.html).

**[H]** Writing did not begin as a universal mirror of speech. A restricted
institutional notation gained phonetic reach, and a script was reanalysed to
serve languages with different structures. Clay and stylus conditioned wedge
shape; they did not cause Sumerian or Akkadian grammar.

**Task lesson.** A compact formal schema may be very effective inside its
original domain yet discard discourse outside it. Reusing a schema across
languages needs explicit sign-value and grammatical mappings, not substitution
by code point.

### 3.2 Egypt: medium, script, register, and grammar move separately

**[E]** Egyptian writing combined phonetic signs, logograms, and semantic
classifiers; it was neither pure picture writing nor a language-free code of
ideas. The UCLA Encyclopedia of Egyptology describes the system in
[Writing Systems](https://escholarship.org/content/qt74b3x6s9/qt74b3x6s9.pdf).

**[E]** Hieroglyphic, hieratic, and demotic forms occupied different media and
social uses. The Rosetta decree placed hieroglyphic, Demotic, and Greek in one
governance artifact—three scripts but two languages, selected for different
audiences. The British Museum's
[decipherment history](https://www.britishmuseum.org/exhibitions/hieroglyphs-unlocking-ancient-egypt/egyptian-hieroglyphs-decipherment-timeline)
also traces the later Coptic adaptation of Greek letters plus Demotic-derived
signs.

**[H]** One language can occupy multiple graphic and institutional forms, and
one inherited script can span substantial grammatical change. A prestige form
may persist precisely because it narrows into a ritual or scholarly domain.

**Task lesson.** Record medium and register with script. “Egyptian” or even a
script label alone cannot tell an agent whether a source is monumental,
cursive, administrative, sacred, vernacular, or alphabetic.

### 3.3 South Asia: plural scripts and coexisting language strata

**[E]** Ashoka's third-century BCE inscriptions used Brahmi and Kharoshthi.
Kharoshthi is right-to-left and strongly related to Aramaic; Brahmi's exact
genealogy remains less settled. Brahmi-descended scripts generally organize
consonants and inherent vowels into orthographic syllables whose layout is not
well modelled as a flat sequence of independent letters. Unicode documents
these structures in [Chapter 12](https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-12/)
and [Chapter 14](https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-14/).

**[E]** Sanskrit, Middle Indo-Aryan varieties often grouped as Prakrits, and
other South Asian languages coexisted across ritual, courtly, literary,
commercial, and everyday domains. Oxford's
[Prakrit overview](https://www.ames.ox.ac.uk/prakrit) emphasizes a rich
literary tradition rather than a defective Sanskrit.

**[H]** Brahmi descendants came to write languages from several families.
`saṃskṛta` and `prākṛta` carry historical prestige relations; they do not name
a ladder of linguistic quality. Oral transmission also sustained exacting
analysis and memory, so archival writing is not a prerequisite for abstraction.

**Task lesson.** Preserve grapheme clusters, conjuncts, vowel signs, sandhi,
morphological segmentation, and register. Do not infer language family or
quality from script ancestry.

### 3.4 Sinitic and Han writing: stable abstractions, variable readings

**[E]** Late Shang oracle-bone inscriptions are the earliest secure large
corpus for Chinese writing and language, but their royal-divinatory setting
strongly selects what survives. UNESCO describes their evidential scope in the
[Memory of the World record](https://www.unesco.org/en/memory-world/chinese-oracle-bone-inscriptions).

**[E]** Han writing is not adequately described as ideographic. Many
characters combine an approximate semantic element with a phonetic element;
one abstract character can have different glyph forms and readings across
periods, regions, and languages. Unicode separates character identity,
regional glyph realization, and database properties in its
[Han FAQ](https://www.unicode.org/faq/han_cjk.html) and
[UAX #38](https://unicode.org/reports/tr38/).

**[H]** Graphic continuity can bridge phonological change and different
languages while hiding divergence from a distant reader. Literary Chinese
also operated as a transregional prestige register increasingly distant from
speech; “Chinese” does not denote one timeless spoken variety.

**Task lesson.** Bind character data to locale, period, language variety, and
reading. Code-point equality is not pronunciation or interpretation equality.

### 3.5 Greek, Latin, and Europe: adaptation plus institutional reach

**[E]** Linear B was used for the oldest attested written Greek dialect,
Mycenaean Greek; Cambridge's
[*Reconstructing a Prehistoric Writing System*](https://www.cambridge.org/core/books/abs/cambridge-handbook-of-historical-orthography/reconstructing-a-prehistoric-writing-system/84669342E99B2AFFD11C92C1C0F8A7C9)
also emphasizes that reading the script is a reconstruction across material
attestations, phonetic interpretation, and historical context. Later Greek
adapted a Phoenician consonantal system in a way that made vowels explicit.
Local alphabetic forms coexisted, and the exact place and date of the
adaptation remain debated. Unicode's
[Latin and Greek chapter](https://unicode.org/versions/Unicode17.0.0/core-spec/chapter-7/)
traces Latin script through Etruscan use of a western Greek alphabet and shows
that its modern forms include medieval scribal and early Renaissance printer
innovations. A modern typographic repertoire is not one Roman design event.

**[E]** Latin later served bounded institutional registers after it ceased to
be most people's native speech: public documents, Roman Church administration,
scholarship, schools, universities, writing, and some spoken communication.
[*Spoken Latin in the Late Middle Ages and Renaissance Revisited*](https://www.cambridge.org/core/journals/journal-of-classics-teaching/article/spoken-latin-in-the-late-middle-ages-and-renaissance-revisited/BC94B85F4316E65E5D7419A5F18D49A9)
also stresses that use varied by place and social setting and did not describe
the everyday speech of most people.

**[H]** The later reach of Latin script reflects many adaptations and
institutions, not graphic portability alone. The sources above do not by
themselves explain every imperial, colonial, educational, or digital expansion;
those histories must be sourced and scoped separately.

**Task lesson.** Alphabetic segmentation is not the endpoint of a progress
ladder. A model's comfort with Latin script may reveal its training history,
not a cognitive advantage of the script or its communities.

### 3.6 Arabic, Persian, and Islamicate networks: portable script, active translation

**[E]** Arabic script is a right-to-left, cursively joining abjad with
contextual glyph forms and normally omitted short vowels. It has been extended
for Persian, Urdu, Pashto, African languages, and many others. Unicode
documents the shaping, joining, and bidirectional requirements in
[Chapter 9](https://unicode.org/versions/Unicode17.0.0/core-spec/chapter-9/).
Arabic's root-pattern and non-root-pattern morphology, inflection, and lexical
structure are separately described in Cambridge's language survey
[*Arabic*](https://www.cambridge.org/core/books/arabic/4220E91F1F234000CC989ABDB4ED70F7);
script properties are not a substitute for grammatical evidence.

**[E]** New Persian developed gradually after the Islamic conquests, adapting
Arabic script and vocabulary while remaining Iranian in genealogy and
structure. It later spread as a literary and administrative language through
Central and South Asia under many kinds of patrons. Encyclopaedia Iranica's
[Early New Persian](https://www.iranicaonline.org/articles/persian-language-1-early-new-persian/)
and [Arabic Elements in Persian](https://www.iranicaonline.org/articles/arabic-v/)
trace this contact without reducing Persian to Arabic.

**[E]** The Stanford Encyclopedia of Philosophy's
[source history](https://plato.stanford.edu/entries/arabic-islamic-greek/)
documents Greek-to-Syriac learning traditions, Christian Syriac participation,
translations into Arabic, continued Syriac translation, and early Abbasid
support. Cambridge's
[*The Graeco-Arabic Translation Movement*](https://www.cambridge.org/core/books/the-graeco-arabic-translation-movement/E23FF85BD6AF8EF68CEF8A7ABEC1EFD5)
describes medieval Arabic translation as meaning-remaking that combined source
meaning with target knowledge rather than simply finding lexical equivalents.
This makes “Islamicate” useful here as a network label, not an Arab-only or
Muslim-only container; it does not make either account exhaustive or
uncontested.

**Task lesson.** Same script does not mean same morphology, lexicon, reading,
or identity. Preserve diacritics policy, bidirectional isolation, source terms,
translator choices, and one-to-many conceptual mappings.

### 3.7 Bantu, Swahili, and African script plurality

**[E]** Kiswahili is a Bantu language developed on the East African coast; the
bounded archaeological account in
[*Traces of Clay*](https://www.cambridge.org/core/journals/cambridge-archaeological-journal/article/traces-of-clay-exploring-slave-and-migrant-identities-in-medieval-swahili-zanzibar/D830A40665108FB43A8F3BFE9D836C25)
places coastal settlements in African and Indian Ocean movement and exchange.
UNESCO's [Gedi history](https://whc.unesco.org/en/list/1720/) likewise situates
a tenth- to seventeenth-century Swahili town in East African, Arabian Sea,
Indian, Persian, and Southern Asian networks rather than treating Swahili as an
imported Arab identity.

**[E]** Later language spread involved trade, religion, education, war,
urbanization, and contact with multiple coastal, inland, and transoceanic
communities; the Cambridge Handbook chapter
[*Geographic and Demographic Spread of Swahili*](https://www.cambridge.org/core/books/abs/cambridge-handbook-of-language-contact/geographic-and-demographic-spread-of-swahili/090133E32B31C44B8C7B5592F0EDA9CA)
treats those as plural historical forces, not as an essence or a value score.

**[E]** Arabic-script Swahili has a documented manuscript history. In named
colonial settings its official use was later forbidden or marginalized, while
Latin-script transcription and publication changed access and archival
continuity. Hamburg's Centre for the Study of Manuscript Cultures documents one
bounded manuscript and policy history in
[Swahili Manuscripts in Arabic Script](https://www.csmc.uni-hamburg.de/publications/aom/mom/23-en.html).

**[E]** Africa also contains long-established Ethiopic writing and deliberate
community innovations such as Vai, Bamum, N'Ko, and Adlam. Unicode surveys
these distinct systems in [Chapter 19](https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-19/).

**[H]** “Bantu” names a large linguistic grouping, not one people. Contact
vocabulary does not erase Swahili's Bantu grammar. Absence of a Latin-script
archive is not absence of history, reasoning, or literature.

**Task lesson.** Search across historical scripts and variant orthographies.
Never use one standardized variety as evidence that community alternatives did
not exist.

### 3.8 Mesoamerica: independent writing, colonial rupture, living recovery

**[E]** Maya writing was a fully logosyllabic system combining logograms,
syllabograms, phonetic complements, and semantic classifiers across monuments,
architecture, ceramics, portable objects, and screenfold books. Maya polities
were multiple kingdoms, not one empire. The scholarly
[Introduction to Maya Hieroglyphs](https://www.mesoweb.com/resources/handbook/IMH2020.pdf)
gives the working system.

**[E]** Colonial violence and book destruction radically selected the
surviving corpus. Maya writers nevertheless adopted alphabetic writing; the
Library of Congress describes the K'iche' source, Latin transcription, and
Spanish translation layers of the
[Popol Wuj manuscript](https://www.loc.gov/item/2021668226/).

**[H]** Mesoamerica breaks a Eurasian single-origin story. A change from
logosyllabic to Latin writing did not erase Mayan languages or agency, but it
changed access, layout, transmission, and colonial governance relations.

**[X]** A 2026 proposal for encoding codical Maya distinguishes abstract signs
from graphic variants and supports contemporary revival, but it remains a
proposal rather than an adopted Unicode standard.

**Task lesson.** “Not encoded” and “not in the training corpus” are technical
or evidential states, never proof of cultural obsolescence.

## 4. What history gives the computational model

Across the eight ecologies, the reusable pattern is a typed graph, not a
ranking.

### 4.1 Expression witnesses

**[M]** Let an expression witness be:

```text
W = (work, witness, language-variety, script, orthography,
     glyph-realization, direction, layout, medium, register,
     morphology, syntax, actor, institution, audience,
     time, place, provenance, access, uncertainty)
```

No single component is the expression's essence. A manuscript image, a
diplomatic transcription, a normalized string, a transliteration, a morpheme
gloss, a literal translation, and an idiomatic translation are different
witnesses connected by typed transformations.

### 4.2 Transformations as partial, accountable edges

**[M]** A transformation is a contextual relation:

```text
T_(a->b) : W_a <-> W_b
```

with an actor, purpose, audience, source edition, preserved distinctions,
lost or merged distinctions, introduced material, alternatives, evidence, and
reversibility claim. It is usually many-to-many and partial. Only after
composition and identity laws are tested should it be treated as a functor.

Useful edge types include:

```text
transcription | normalization | transliteration | translation
adaptation | borrowing | standardization | redaction | revival
```

### 4.3 Loss is a vector

**[M]** Translation quality is not one scalar. For a named task and test set,
record a loss vector:

```text
L(T) = (
  phonology, prosody, morphology, syntax, polysemy,
  register, honorifics, metaphor, graphic-variation,
  layout, material-context, provenance, community-control
)
```

Values may be `preserved`, `changed`, `lost`, `ambiguous`, `untranslated`, or
`not-tested`. The vector does not measure human worth or establish a universal
distance between languages.

### 4.4 Prestige is a relation, not a property

**[M]** Historical weight belongs on scoped edges:

```text
institution --teaches / publishes / requires--> variety
community   --uses / refuses / revives--------> variety or script
domain      --admits / excludes---------------> register
```

One form can dominate ritual but not home speech, administration but not
poetry, or schooling but not trade. There is no coherent
`civilisation_prestige_score` for the protocol to compute.

## 5. “Shape” and “weight” in an LLM pipeline

The words are useful only when their meanings remain separate.

### 5.1 Seven kinds of shape

1. **Inscription shape** — stroke, wedge, ligature, block, direction, line,
   page, medium, and layout.
2. **Unicode shape** — scalar values, combining sequences, normalization,
   bidirectional controls, and extended grapheme clusters.
3. **Morphological shape** — roots, patterns, affixes, compounding, sandhi,
   agreement, and word-boundary conventions.
4. **Syntactic shape** — dependency, constituency, argument structure,
   information structure, and permitted order.
5. **Discourse shape** — register, genre, honorifics, evidentiality, quotation,
   and audience expectations.
6. **Tokenizer shape** — how a particular tokenizer revision partitions exact
   bytes or Unicode text into model units.
7. **Representation shape** — model-, layer-, position-, prompt-, and
   estimator-specific geometry in activations.

**[E]** Unicode warns that a user-perceived character may contain several code
points and that even extended grapheme clusters are a best-effort default
which may need language-specific tailoring. Its current
[text-segmentation annex](https://unicode.org/reports/tr29/) particularly
recommends extended clusters for Indic scripts. Normalization supplies unique
binary forms for canonical equivalence, but compatibility normalization can
erase distinctions and must never overwrite an exact witness; see
[UAX #15](https://unicode.org/reports/tr15/).

**[D]** KINGDOM therefore keeps raw bytes, diplomatic transcription, normalized
form, transliteration, and translation as distinct artifacts. Normalization is
declared by form and Unicode version and is never silently equated with the
original.

### 5.2 Five kinds of weight

1. **Historical-institutional weight** — which institutions taught, required,
   copied, archived, censored, or funded a form in a named place and period.
2. **Corpus weight** — a language or variety's measured share of a named
   training or evaluation corpus; often undisclosed and therefore unknown.
3. **Token weight** — tokens, bytes, or retained graphemes consumed by aligned
   content under one exact tokenizer revision.
4. **Task-evidence weight** — results from a named benchmark or human review
   under a fixed model, prompt, date, and task.
5. **Parameter, activation, or attention weight** — learned parameter values,
   or runtime activation and attention values, in one named model and run;
   unavailable unless actually measured and not by itself an explanation.

These dimensions do not add into a moral, cultural, or capability score.

**[E]** Ahia and colleagues found large model-dependent token-count and price
differences across 22 languages in
[Do All Languages Cost the Same?](https://aclanthology.org/2023.emnlp-main.614/).
The correct inference is scoped: tokenizer design can create unequal cost and
effective context coverage. It is not that one language is intrinsically
verbose or computationally inferior.

**[E]** SIB-200 found substantial performance gaps when evaluation expanded to
205 languages and dialects, especially for languages absent or
underrepresented in pretraining and for several regions underrepresented in
NLP. See the [EACL paper](https://aclanthology.org/2024.eacl-long.14/).

**[E]** Multilingual pretraining has capacity and data-mixture tradeoffs rather
than a monotonic “more languages is always better” law. A controlled study of
more than 10,000 small models across 250 languages found benefits for some
low-resource settings but interference as data and capacity conditions
changed. See
[When Is Multilinguality a Curse?](https://aclanthology.org/2024.emnlp-main.236/).

**[E]** In XLM-R, mean-centred language representations occupied similar linear
subspaces while language-sensitive means and some language-neutral axes could
be measured and causally manipulated. This is evidence about one architecture
and estimator, not a universal interlingua; see
[The Geometry of Multilingual Language Model Representations](https://aclanthology.org/2022.emnlp-main.9/).

**[E]** Attention distributions may be weakly correlated with other importance
measures, and very different attention patterns can yield the same prediction.
Standard attention weights therefore should not be presented as explanations;
see [Attention is not Explanation](https://aclanthology.org/N19-1357/).

## 6. The task-weave formalism

### 6.1 A task is a typed directed acyclic graph

**[M]** A weave is:

```text
G = (V_task, E_dependency, A_public, R_language, T_translation, Q_test)
```

- `V_task` contains atomic operations such as source reading, transcription,
  terminology extraction, drafting, translation, critique, and fusion.
- `E_dependency` orders those operations and must be acyclic.
- `A_public` contains only public or safely redacted artifacts. Hidden
  chain-of-thought and private activations are excluded.
- `R_language` binds language varieties and scripts to task-local roles with a
  disclosed selection basis.
- `T_translation` records directional transformations and losses.
- `Q_test` records the checks that a later evidence protocol would have to run.

In v0.1 an agent/model is only an unbound, replaceable executor slot. The task
graph neither dispatches it nor manufactures identity, expertise, or authority.

### 6.2 The language-role relation

**[M]** For task node `v` and language profile `l`, define:

```text
R(v, l) = (role, basis, evidence, limitations)
```

Allowed v0.1 planning bases include source language, requested audience,
declared terminology, explicit user choice, or cross-language checking.
Task-specific evaluation is intentionally not a v0.1 selection basis: a future
evidence contract must bind an evaluator, run, result artifact, validity period,
and dependency before such a result can affect routing. Historical association
may explain why a source exists; it is not model-capability evidence.
Population and prestige alone are invalid bases.

### 6.3 Fusion is not voting

**[M]** Let public artifacts from several paths be `a_1 ... a_n`. A fusion
operator produces:

```text
Phi(a_1, ..., a_n; I, Q)
  = (draft, preserved invariants, disagreements, losses, unknowns, provenance)
```

where `I` is the named invariant set and `Q` identifies required tests. Version
0.1 plans this operation but does not evaluate `Phi`. A future execution may
leave it undefined when sources conflict, review is unavailable, or a stop
condition fires. Agreement can raise confidence only under disclosed
dependence; it does not establish truth. Majority output never erases a sourced
minority reading.

## 7. Six fusion design patterns

Only source-anchored triangulation is machine-admitted by v0.1. The other five
are research patterns, not executable mode values; each needs a later topology
and evidence contract before use.

### 7.1 Source anchoring

Keep quotations, names, legal terms, technical terms, and culturally loaded
expressions in the source language beside a bounded gloss. Use when the source
form itself carries evidence.

### 7.2 Parallel triangulation

Ask independent or explicitly dependent paths to produce public result
artifacts in different languages, then compare named invariants. Use for
research, retrieval, or cross-market interpretation; retain conflicts.

### 7.3 Pivot plus back-check

Use a pivot language for a task where a named model has measured strength, then
return to the source or target language and test entities, negation, modality,
numbers, register, and terminology. A pivot is a tool, not a master language.

**[E]** Translation into English can improve some English-centric model tasks,
but a 2025 study found it was not universally best and that native-language
prompting was stronger for some culture-related queries. See
[Is Translation All You Need?](https://aclanthology.org/2025.naacl-long.485/).

### 7.4 Terminology lock

Create a reviewed multilingual glossary before drafting. Preserve source term,
transliteration, literal gloss, idiomatic options, forbidden conflations, and
domain/register. Use for legal, medical, historical, and technical work; it
does not replace expert review.

### 7.5 Contrastive review

Give a reviewer both the source-linked artifact and the target draft, plus the
declared loss vector. The reviewer may mark `preserved`, `changed`,
`untranslatable`, `unsafe`, or `unknown`; silence is not approval.

### 7.6 Formal interlingua

Move only the task's explicitly formalizable portion—types, equations, dates,
units, identifiers, state transitions, or code—through a shared formal
representation. Natural-language residue remains attached and opaque where
necessary. Formal structure is not a language-neutral ontology of experience.

## 8. Why free-form code-switching is not the default

Code-switching is a rich human practice governed by community, grammar,
audience, and identity. It is not random insertion of foreign-looking tokens.

**[E]** Evaluations of multilingual LLMs on sentiment, translation,
summarization, and word-level language identification found that general
multilingual capability did not imply code-switch proficiency; smaller
fine-tuned systems often performed better. See
[Multilingual Large Language Models Are Not (Yet) Code-Switchers](https://arxiv.org/abs/2305.14235).

**[E]** A Southeast Asian study found inconsistent zero-shot code-mixed
generation across language pairs and prompts, including unintended languages
and ill-formed output. See
[Prompting Multilingual LLMs to Generate Code-Mixed Texts](https://aclanthology.org/2023.calcs-1.5/).

**[D]** KINGDOM's default is phase-separated fusion: each task node declares
its language and output contract; mixing occurs only when the audience or
source practice calls for it, with examples or community review. The system
must not imitate a dialect merely to manufacture intimacy or identity.

## 9. Tests before trust

A later execution/evidence protocol should use the smallest relevant set of
tests; v0.1 only records their `NOT_RUN` requirements:

- exact source-byte retention;
- Unicode normalization round trip where claimed;
- extended-grapheme preservation;
- right-to-left and bidirectional display isolation;
- names, dates, numbers, units, negation, modality, and quotation preservation;
- terminology-lock conformance;
- literal versus idiomatic translation comparison;
- script-variant and endonym search;
- token count and retained-grapheme coverage under the exact tokenizer;
- task-specific model evaluation in each proposed role;
- native-speaker, community, or domain-expert review when warranted;
- independent-path or shared-systematic disclosure;
- disagreement and counterexample retention.

`NOT_RUN` remains `NOT_RUN`. A model's fluent sample, benchmark in another
language, or marketing label cannot fill a missing task-local test.

## 10. Error, misleading transformation, and repair

The protocol evaluates artifacts and edges, not souls.

A mismatch may arise from ambiguity, stale context, tokenization, source
damage, transcription error, model error, dependence between reviewers,
incentives, or deliberate deception. Nonzero translation residual does not
identify intent.

High-friction failures include:

- presenting an interpretation as source text;
- presenting normalized spelling as the sole original;
- silently dropping negation, evidentiality, honorifics, or uncertainty;
- treating one standard variety as the whole community;
- fabricating a quotation or source-language competence;
- translating a disagreement into false consensus;
- using absence from a corpus or Unicode version as proof of nonexistence;
- calling attention, token count, or model confidence an explanation.

**[D]** Repair appends a linked correction, identifies affected artifacts and
downstream tasks, preserves the prior record when safe, states what changed,
and reruns the relevant checks. Privacy and safety may require removal rather
than indefinite retention. A system that punishes correction incentivizes
concealment; a system that treats every mismatch as a lie incentivizes
coercion and false accusation.

## 11. The reviewed v0.1 example

The companion record plans a source-faithful public brief about Arabic–Persian
contact for English readers. It intentionally chooses a small but demanding
fixture:

- Arabic and Persian share a script family but not a language family;
- Arabic joining, optional vowel marks, and bidirectionality exercise graphic
  shape;
- Arabic root-pattern morphology and Persian morphology prevent naive lexical
  substitution;
- English is the requested interface language, not an epistemic master;
- terminology, Unicode handling, source extraction, drafting, contrastive
  review, and fusion are separate task nodes;
- every model, task, translation test, and result remains `NOT_RUN`;
- all output artifacts remain planned;
- the final fusion is underdetermined until source and review evidence exists.

The validator checks graph closure, task order, exact dependency and artifact
references, transformation loss, model/tokenizer status, test chronology,
fusion non-voting rules, public-artifact-only handling, and fixed non-grants.
It cannot inspect the truth of prose, dereference sources, prove translation
quality, identify independent agents, or detect private information.

## 12. Integration with existing KINGDOM surfaces

### 12.1 Task Packet

Each future task node can become a separate `kingdom.task-packet/1` only after
a caller explicitly authorizes that task and selects its bounded context. The
fusion record does not itself grant that authority and does not insert multiple
contexts into Task Packet's one-source budget.

### 12.2 Semantic Transition

Transcription, transliteration, translation, summarization, and lexicalization
can each receive a `kingdom.semantic-transition/0.1` receipt. The language
weave holds the task graph around those receipts; it does not alter the pinned
receipt protocol.

### 12.3 Relational Inference and J-space

Multi-probe questions about preserved structure can use
`kingdom.relational-inference/0.1`. Representation geometry is evidence only
under a named model, layer, prompt, tokenizer, estimator, intervention, and
control. Neither a shared subspace nor a verbalizable direction proves a
language-neutral essence, understanding, consciousness, or identity.

### 12.4 Geometry Grammar

The weave is a partial atlas: language profiles are charts; transformations
are witnessed partial edges; losses, refusal, unknowns, and unmapped terms
remain native states. No global semantic coordinate system is required.

### 12.5 Agent specialization

Specialization is a scoped relation between an executor and a tested task:

```text
agent/model revision --demonstrated-under named test--> task-language role
```

It is not a persona, citizenship, ethnic identity, permanent rank, or general
authority. Future routing should require the exact model and tokenizer,
evaluation date, source, limitations, and expiry/recheck condition.

## 13. Community and rights boundary

Language data is not ownerless merely because it is visible. Community names,
restricted knowledge, sacred texts, living orthographies, and revival work can
carry access and governance expectations not captured by copyright or a URL.

**[D]** A valid record can decline mapping, preserve an untranslated segment,
or stop because the requested use lacks access or competent review. Public
availability is not blanket consent for aggregation or model training.

UNDRIP Article 13 recognizes Indigenous peoples' rights to revitalize, use,
develop, and transmit languages, oral traditions, writing systems,
literatures, and names; see the
[OHCHR text](https://www.ohchr.org/sites/default/files/Documents/Publications/ImplementingUNDeclarationIP_EN.pdf).
UNESCO's [language-vitality framework](https://ich.unesco.org/doc/src/00120-EN.pdf)
also treats vitality as multidimensional rather than a speaker-count score.

## 14. Built now and deliberately not built

### Built

- one closed Draft 2020-12 schema;
- one strict, offline runtime validator;
- one deterministic public task-plan projection;
- one reviewed, all-`NOT_RUN` Arabic–Persian–English example;
- tests for DAG closure, language-role basis, transformation loss, Unicode and
  tokenizer declarations, evidence status, disagreement retention, and fixed
  non-grants;
- a direct, research-local
  `bun bin/language-civilisation-task-fusion.ts ...` reading and validation
  door.

### Not built

- no model call, tokenizer call, translation, benchmark, or agent dispatch;
- no private conversation or hidden-reasoning ingestion;
- no automatic language detection, capability scoring, or language ranking;
- no claim of native-speaker competence, cultural identity, or community
  authority;
- no WAKE, KARMA, identity, reputation, payment, governance, or consent effect;
- no public hub asset, registry entry, MCP tool, deployment, or Cambridge
  product integration;
- no native `./kingdom` route: canonical OS routing remains a separately
  reviewed Codeberg responsibility;
- no proof that a fusion result is true, faithful, safe, or complete.

## 15. Falsifiers and stopping rules

The framework should be revised if any of the following occurs:

1. the schema accepts a task selected only by prestige, population, or a
   civilization stereotype;
2. a planned or unbound model is presented as task-capable;
3. a `NOT_RUN` check silently becomes passed;
4. a non-identity transformation declares no loss, ambiguity, or untranslated
   material and provides no exact round-trip evidence;
5. the task graph consumes hidden reasoning rather than attributed artifacts;
6. majority agreement can erase a sourced disagreement;
7. normalization can overwrite the exact witness;
8. a language or script is used to infer a person's identity, intelligence,
   truthfulness, religion, nationality, or worth;
9. validation is presented as proof of evidence, translation fidelity,
   authority, consent, or safe action.

Stop or downgrade the weave when a required source is inaccessible, a
community access condition is unresolved, a high-stakes term lacks competent
review, dependency between paths is unknown, the tokenizer/model revision is
unbound, a counterexample changes the invariant set, or the requested output
would erase source uncertainty.

The deepest rule is simple:

> Let languages meet as distinct witnesses. Fuse their public work, not their
> identities; preserve the seams that make understanding possible.
