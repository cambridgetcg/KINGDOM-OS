# Word, Story, Religion & Civilisation: an Influence/Emergence Map

Protocol: `kingdom.word-story-religion-civilisation-map/0.1`

Status: research-local, read-only, structure-only. This guide and its companion
record define a bounded comparative map for public, attributed source metadata.
They do not decide whether a god, revelation, doctrine, or ultimate reality is
true or false; represent a whole religion or civilisation; infer anyone's
belief; reproduce a living rite; grant community authority or consent; or run,
route, publish, govern, or deploy anything.

Companion record:

- [`word-story-religion-civilisation-map.v0.1.json`](../data/language/word-story-religion-civilisation-map.v0.1.json)

Evidence horizon: 2026-08-20. The ten windows below are selected contrasts,
not a canon of “major religions,” a representative sample of humanity, or a
sequence through which societies must pass.

## 1. The shortest answer

**[CM]** Words and stories do not sit above civilisation as immaterial causes,
and religion does not sit inside civilisation as a detachable module. In the
selected evidence, expression, memory, ritual, material media, specialist
roles, archives, institutions, law, patronage, political claims, dissent, and
translation repeatedly condition one another.

The useful abstraction is therefore neither:

```text
religion -> civilisation
```

nor:

```text
civilisation -> religion
```

It is a temporal, attributed, multiplex hypergraph:

```text
lived encounter / inherited memory / crisis / contact /
tradition-attributed revelation
        |                         ^
        | names, invokes,         | reinterpretation, refusal,
        | narrates, teaches       | revival, new experience
        v                         |
+-------------------+      +----------------------+
| word / name /     |<---->| story / genealogy / |
| title / formula   |      | cosmology / teaching|
+-------------------+      +----------------------+
        |                         |
        +-----------+-------------+
                    | performs through
                    v
       +--------------------------------+
       | body + voice + timing + object |
       | + place + role + audience      |
       +--------------------------------+
                    |
                    v
       specialist <-> medium <-> archive/canon
                    |                 |
                    v                 v
               institution <-> norm/law
                    |                 |
                    +--------+--------+
                             v
                     polity / economy
                             |
             legitimacy claims, patronage, coercion,
             public goods, critique, distributional effects
                             |
                             v
       translation / contact / dissent / suppression / repair
                             |
                             v
                    plural community reception
                             |
                             +---------------> feedback above

Attributed divine, ancestral, sacred-order, Buddha, Dharma, Heaven,
God, and ultimate-reality claims remain source-bound nodes. The map
does not collapse them into one referent or adjudicate their reality.
```

**[HS]** This shape appears in different, incomplete forms across the sources;
no cited case realizes every box or arrow. **[CM]** The diagram is a question
generator, not a universal law, evolutionary ladder, or proof that recurrence
means shared origin.

## 2. Claim labels and category firewall

The companion record assigns a register to every attributed referent claim,
historical observation, and comparative influence relation. Short labels mark
key claims in this guide and expand to the record's full register names. Seam,
role, unknown, and non-grant records are separately typed rather than silently
treated as historical claims:

| Label | Register | Meaning here |
| --- | --- | --- |
| **[PT]** | `PRIMARY_TRADITION_TEXT` | A named witness in a declared language, edition, recension, performance, and interpretive setting. |
| **[TD]** | `TRADITION_SELF_DESCRIPTION` | A claim attributed to a named source, school, practitioner, community, or institution about sacred status or ultimate reality. |
| **[ST]** | `SCHOOL_SPECIFIC_THEOLOGY` | A theological interpretation bounded to a named school, interpreter, source, and period. |
| **[HS]** | `HISTORICAL_SCHOLARSHIP` | A source-bounded interpretation of documents, practices, institutions, or change. |
| **[IH]** | `INSTITUTIONAL_OR_HERITAGE_DESCRIPTION` | A source-bounded description published by a museum, library, heritage body, or community-and-state nomination process; not independent scholarship or community unanimity. |
| **[MA]** | `MATERIAL_OR_ARCHAEOLOGICAL_EVIDENCE` | A surviving object, inscription, site, or material pattern under named interpretation. |
| **[EA]** | `EMPIRICAL_ASSOCIATION` | A measured relation inside a declared dataset and operationalization. |
| **[BC]** | `BOUNDED_CAUSAL_EVIDENCE` | A causal result confined to a declared design, intervention, population, and alternative set. |
| **[CM]** | `COMPARATIVE_MODEL` | A deliberately lossy structure used to ask comparable questions. |
| **[DC]** | `DESIGN_COMMITMENT` | A chosen KINGDOM safeguard or future workflow constraint. |
| **[B]** | `BOUNDARY` | A prohibition on unsupported transfer, action, or authority. |
| **[?]** | `OPEN_QUESTION` | Unresolved at the evidence horizon; never permission to guess. |

The causal status is separate from the register:

```text
descriptive association
plausible mechanism, not isolated
bounded causal evidence
contested causal direction
comparative template, not causal
```

A historical source can support an association without supporting its causal
direction. A community's self-description can be faithfully attributed
without KINGDOM affirming or denying its referent. A design commitment can be
useful without being projected backward as a command from history.

The following separations are invariants:

```text
word or name != its referent != a universal concept
deity name != global deity identity
story != falsehood; mythic genre != lie
ritual != belief report != permission to reenact
canon != whole tradition; institution != community
religion index != uniform essence; civilisation index != agent
affiliation != personal belief; silence != disbelief or consent
similarity != shared origin; translation != identity
coexistence != causation; persistence != value
archive survival != population prevalence != authority
model-corpus frequency != historical influence != truth
social or political power != metaphysical truth or falsehood
disagreement != deception; harmony != enforced agreement
```

**[B]** A claim of lying requires evidence about a particular statement,
speaker or institution, knowledge state, intention, audience, and context.
Official discourse may conceal, omit, or idealize power; the map records the
source, counterevidence, and distributional effects rather than inferring a
timelessly deceptive people, religion, or civilisation.

## 3. A formal temporal multiplex hypergraph

### 3.1 Why a hypergraph

Pairwise arrows are too weak for many cases. A ritual can require a formula,
trained role, body, object, time, place, and audience jointly. A translation
can be jointly shaped by source text, translator, patron, target vocabulary,
medium, and intended public. Removing any one participant may change the event.

Define the research map as:

\[
  \mathcal{H} = (V, E, L, R, \mathcal{T}, \Sigma, \Omega)
\]

where:

- \(V\) is a set of typed, source-indexed nodes;
- \(E\) is a set of directed hyperedges from one or more source nodes to one
  or more target nodes;
- \(L\) is the layer vocabulary;
- \(R\) is the relation vocabulary;
- \(\mathcal{T}\) is interval time, not a forced stage sequence;
- \(\Sigma\) contains claim registers, causal status, evidence, and
  alternatives;
- \(\Omega\) contains access, translation-loss, counterstory, burden/benefit,
  and non-grant annotations.

A node is not merely a label. Its minimum form is:

\[
  v = (id, type, time, place, community\_index, medium,
       perspective, source, access)
\]

The `community_index` locates a relation; it does not impute a shared mind. A
divine or ultimate-reality node additionally holds the attributed claim,
speaker/source, tradition or school, grammatical form, and explicit
non-equivalences. Its ontology outside the source remains `not adjudicated`.

A hyperedge is:

\[
\begin{aligned}
e = (&S_e, T_e, r_e, \tau_e, g_e, a_e, m_e, p_e,\\
     &register_e, causal_e, evidence_e, alternatives_e,\\
     &I_e, W_e, loss_e, access_e, counter_e, stop_e)
\end{aligned}
\]

Here \(S_e\) and \(T_e\) are node sets, \(r_e\) is a declared relation,
\(\tau_e\) and \(g_e\) are time and place, \(a_e\), \(m_e\), and \(p_e\)
identify actors, media, and perspective, and the remaining fields make
evidence, alternatives, influence dimensions, word/story weights, losses,
access, counterstories, and stopping conditions inspectable.

### 3.2 Layers and relation types

The fifteen node layers are:

1. lived encounter, crisis, memory, or attributed revelation;
2. word, name, title, epithet, or formula;
3. attributed divine, ancestral, sacred-order, or ultimate-reality claim;
4. narrative, genealogy, cosmology, teaching, or counterstory;
5. ritual, recitation, oath, festival, divination, or performance;
6. voice, body, image, object, inscription, manuscript, architecture, print,
   or digital medium;
7. specialist role;
8. archive, canon, curriculum, commentary, or authorized repertoire;
9. institution;
10. ethic, norm, law, sanction, vow, or obligation;
11. polity, patronage, redistribution, labour, property, or economy;
12. contact, translation, transliteration, adaptation, diaspora, conquest, or
    mission;
13. dissent, reform, schism, satire, refusal, suppression, rupture, or revival;
14. plural community reception and lived reinterpretation;
15. a bounded observed outcome.

The relation vocabulary is deliberately explicit:

```text
NAMES_OR_INVOKES             NARRATES_OR_TEACHES
PERFORMS_OR_RITUALIZES       MATERIALIZES_OR_INSCRIBES
TRAINS_OR_SPECIALIZES        CANONIZES_OR_ARCHIVES
LEGITIMATES_AS_CLAIM         CONSTRAINS_OR_COORDINATES
TRANSLATES_OR_REMAKES        CONTESTS_OR_REFORMS
SUPPRESSES_OR_EXCLUDES       REVIVES_OR_REPAIRS
ASSOCIATED_WITH              CAUSAL_HYPOTHESIS
BOUNDED_CAUSAL_EFFECT
```

`LEGITIMATES_AS_CLAIM` is important: it records that a source or institution
claimed sacred authorization. It does not convert the historian, the model, or
KINGDOM into the claimant. `BOUNDED_CAUSAL_EFFECT` is reserved for a design
that supports that language within its declared scope.

“Multiplex” means that relation and influence views remain separable. For a
time interval \([t_0,t_1]\), relation \(r\), and influence dimension \(d\), a
view is:

\[
  \mathcal{H}^{(r,d)}_{[t_0,t_1]}
  = \{e \in E : r_e=r,\; \tau_e\cap[t_0,t_1]\neq\varnothing,
                  \; I_e[d]\neq null\}
\]

A display may overlay several views, but the stored edges do not merge. Thus
`CANONIZES_OR_ARCHIVES`, `SUPPRESSES_OR_EXCLUDES`, and
`REVIVES_OR_REPAIRS` can connect some of the same nodes without becoming one
ambiguous “influence” arrow.

### 3.3 Time is transformation, not a ladder

Let \(\mathcal{H}_t\) be a dated slice. A later form can be represented as:

\[
  x_{t+1} = \Phi_k(x_t, c_t, A_t) + \Delta_t
\]

where \(\Phi_k\) is a named transformation such as performance,
materialization, canonization, translation, contestation, suppression, or
revival; \(c_t\) is the historical context; \(A_t\) is the participating and
affected set; and \(\Delta_t\) records introduced, lost, disputed, and unknown
material. This notation does not assert linear progress, faithful copying, or
that the later form replaces the earlier one.

A valid trace returns more than a path:

\[
  trace(q) = (paths, sources, dates, perspectives, counterpaths,
              losses, unknowns, access, non\_grants)
\]

If a system returns only a smooth narrative, it has dropped the very
information the map is designed to preserve.

### 3.4 Influence is a vector, never a score

For each supported relation, define an influence vector over thirteen
independent dimensions:

\[
\begin{aligned}
I(e) = \langle
 &mnemonic\_retention, ritual\_coordination, normative\_ordering,\\
 &political\_legitimation, institutional\_embedding,
 material\_inscription,\\
 &educational\_transmission, artistic\_expression,
 economic\_patronage,\\
 &translation\_contact, contestation\_coercion,\\
 &plural\_accommodation, repair\_revival
\rangle
\end{aligned}
\]

In a future instantiated case, each cell would be either `null` or a typed
evidence cell:

```text
{direction, scale, affected parties, source_ids,
 causal_status, uncertainty, counterevidence}
```

Direction may be amplifying, constraining, redistributing, mixed, or unknown.
There is no sum, average, “civilisation impact,” sacredness score, ranking, or
automatic decision threshold. Political legitimation cannot cancel coercion;
mnemonic persistence cannot stand in for truth; artistic reach cannot stand in
for community consent.

The v0.1 JSON does not populate those directional cells. It records only the
dimensions implicated by each source-bounded relation and fixes every
`aggregate_weight` to `null`. Calibration requires a later evidence contract.

### 3.5 Word/story weight is a separate vector

To model the “shape” of a word or story without treating it as a scalar token,
use a second, context-indexed vector:

\[
\begin{aligned}
W(x,c) = \langle
 &declared\_sacred\_status, acoustic\_form, mnemonic\_form,
 performative\_role,\\
 &semantic\_polysemy, narrative\_temporality, normative\_force,
 identity\_indexing,\\
 &institutional\_authorization, material\_form,
 political\_economic\_position,\\
 &translation\_loss, community\_access, corpus\_model\_salience
\rangle
\end{aligned}
\]

`W` and `I` are independent formal specifications. `W` would describe how an
expression is situated; `I` would describe supported relations and outcomes.
The current JSON does not populate `W`. A later case would make each component
a small record rather than a universal number. For example:

```json
{
  "status": "source-attributed | observed | unknown | restricted",
  "source_ids": ["..."],
  "context": "...",
  "variation": ["..."],
  "loss_or_limit": "..."
}
```

**[DC]** `corpus_model_salience` is kept last and independent. Token frequency,
segmentation convenience, or model fluency cannot proxy acoustic precision,
sacred status, historical influence, truth, identity, or human worth. This
vector can guide future test design; this artifact runs no model or tokenizer.

## 4. What words can do

The word is not only a semantic container. In the bounded evidence, a word,
name, title, or formula can occupy several roles at once:

1. **Distinguish and address.** **[CM]** A name can distinguish, invoke, or
   address an attributed referent while remaining less than that referent.
   Grammar, number, title, and mode of address can be lost in translation.
2. **Compress a relation.** **[CM]** A formula can hold a promise, lineage,
   obligation, question, refusal, or remembered event in repeatable form.
3. **Coordinate performance.** **[HS]** Repetition, timing, role, and response
   can coordinate bodies and attention, as the scholarship on
   [ritual language](https://www.cambridge.org/core/books/abs/cambridge-handbook-of-linguistic-anthropology/ritual-language/6E7D9957C34D243571F725873C07E0F0)
   describes. Patterning can produce authority and reflexivity, but also
   indeterminacy; it is not automatic agreement.
4. **Carry memory.** **[HS]** Patterned oral forms can support collective
   memory while still varying, selecting, and changing. The relevant
   scholarship treats [oral traditions as collective memories](https://www.cambridge.org/core/books/abs/memory-in-mind-and-culture/oral-traditions-as-collective-memories-implications-for-a-general-theory-of-individual-and-collective-memory/B1BEBDC26AC9AAF96A5E28C4E12E31A6),
   not flawless recordings.
5. **Perform rather than merely report.** **[HS]** A vow, invocation, prayer,
   recitation, oath, or legal formula may act inside an authorized setting.
   A transcript outside that setting is not the same act.
6. **Index office and order.** **[HS]** Titles and formulas may make roles,
   succession, duties, or political claims repeatable. The force comes from a
   relation among expression, institution, audience, resources, and sanction,
   not from syllables alone.
7. **Open or close translation.** **[CM]** A retained source term can preserve
   a seam; a smooth gloss can invite access but also erase school, grammar,
   performance, and incompatible interpretations.
8. **Enable dissent and repair.** **[HS]** Inherited terms can be reclaimed,
   reinterpreted, satirized, refused, or used against an institution's own
   legitimacy claim.

The same word may have different `W(x,c)` records across a royal inscription,
household practice, school commentary, diasporic community, archive catalogue,
and model corpus. No one context owns all later meaning, and later use does not
retroactively reveal the private intention of earlier speakers.

## 5. What stories can do

“Story” here includes, when sources warrant, narrative, epic, genealogy,
cosmology, sacred history, revelation account, teaching, remembered past, and
counterstory. It does not impose one genre theory across traditions.

- **Memory architecture.** **[HS]** Sequence, recurrence, characters, image,
  metre, and performance can organize recall across people and generations.
- **Identity work.** **[HS]** Genealogy, origin, migration, grief, rescue,
  covenant, exile, awakening, or return can orient a community without proving
  a biological essence or fixing every member's belief.
- **Normative imagination.** **[CM]** Stories can stage duties, virtues,
  dangers, repair, exceptions, exemplary action, and consequences. They can
  also preserve unresolved contradiction rather than issue a rule.
- **Ritual placement.** **[HS]** A narrative may locate a performance in
  sacred time or explain roles and objects. Performance can also reshape the
  remembered narrative; the arrow is not one-way.
- **Legitimation and counter-legitimation.** **[HS]** A story may authorize a
  ruler, office, lineage, law, or institution, while another interpretation or
  counterstory criticizes the same order.
- **Cooperation under bounded conditions.** **[EA]** One study of Agta
  hunter-gatherer communities associated cooperative story themes and skilled
  storytellers with cooperation and social preference. It is a bounded study,
  not evidence that story universally causes morality or civilisation:
  [Cooperation and the evolution of hunter-gatherer storytelling](https://www.nature.com/articles/s41467-017-02036-8).
- **Exclusion or repair.** **[HS]** Canonization, suppression, colonial
  transcription, translation, and revival can make some stories durable and
  others absent. Absence is evidence of a gap, not proof of nonexistence.

**[B]** A mythic classification is not a deception finding. A sacred story can
be read as theology, ritual orientation, genealogy, moral teaching, sacred
history, literature, political claim, or several of these by different
interpreters. The map records genre and truth-claim separately from a
historian's question. A story may be false in some particular empirical claim,
but that conclusion requires claim-specific evidence; it cannot be inferred
from the word “myth.”

## 6. A recursive ecology of religion and civilisation

The modern category “religion” has a history and does not carve every society
at the same joints. **[HS]** The [Stanford Encyclopedia of Philosophy's
conceptual history](https://plato.stanford.edu/archives/spr2026/entries/concept-religion/)
supports treating narrative, ritual, institution, experience, ethics, and
material practice as distinguishable dimensions rather than assuming one
timeless genus.

The map therefore uses “religion” and “civilisation” only as search indexes.
The explanatory units are relations:

| Relation family | Bounded interpretation | Required counter-question |
| --- | --- | --- |
| articulation and naming | Names and formulas can make an attributed referent or remembered encounter repeatable without exhausting it. | Did the name follow an established practice? Which source forms remain unknown or untranslatable? |
| story, performance, memory | Patterned narrative and performance can support memory, coordination, and identity work. | Whose variants, silence, improvisation, or refusal are absent? |
| ritual, specialist, institution | Repeated practices can sustain training, roles, resources, places, and succession. | Which household, local, informal, or dissenting practices escape the institution? |
| sacred order, legitimation, critique | Sacred-order language can authorize rule or obligation and can also ground critique. | Who benefits, who bears costs, and who disputes the claim? |
| canon and curriculum | Selection and maintenance make some materials durable and others marginal or inaccessible. | Who selected, under what criteria, and what was omitted or restricted? |
| translation and contact | Translation preserves, changes, introduces, and loses material while producing new publics. | Who translated for whom, under what patronage and power, and what resists mapping? |
| suppression, counterstory, revival | Power can destroy, silence, marginalize, or archive forms later communities recover or remake. | Does apparent absence reflect loss, privacy, refusal, or collection bias? |
| moralizing religion and complexity | Historical variables may covary, follow different sequences, or share drivers. | Are missingness, operational definitions, time resolution, and causal alternatives robust? |

### 6.1 Five loops to test, not assume

**[CM]** The companion record proposes five comparison templates. None is an
observed universal sequence.

```text
utterance -> story -> performance -> reception -> revised utterance

ritual -> specialist -> institution -> archive/canon -> ritual

sacred claim -> story -> norm/law -> polity/economy
             -> dissent/reform -> revised story

contact -> translated word/story -> archive -> new public -> new contact

polity/economy -> suppression -> surviving medium/archive
               -> reception -> revival or further contest
```

Instantiate the first only with time-indexed performance and reception
evidence. Instantiate the second only with named roles, resources, selection
procedures, and counterexamples. The legitimacy loop requires a
counter-authority and distributional-harm pass. The translation loop must
retain source, transliteration, literal and interpretive renderings, losses,
and refusals. The suppression/revival loop requires provenance, custodianship,
present access conditions, and community-defined value.

### 6.2 Ritual bonding has two faces

**[EA]** Research on ritual synchrony reports associations with bonding and
cooperation and also highlights conformity and obedience risks. It does not
license the inference `ritual = social good`: [The cultural evolutionary
trade-off of ritualistic
synchrony](https://doi.org/10.1098/rstb.2019.0432).

**[DC]** KINGDOM should therefore preserve benefit and burden as separate
fields. A harmony claim must ask whether coordination was voluntary, who could
exit, whose disagreement remained audible, which sanctions operated, and how
benefits and costs were distributed.

## 7. Ten selected historical windows

These windows contrast oral, inscriptional, manuscript, ritual, courtly,
monastic, diasporic, and colonial settings. They are not exhaustive summaries
of the named traditions.

### 7.1 Mesopotamian city, temple, palace, and learned text

Period: late fourth millennium BCE through first millennium BCE, with local
and dynastic variation.

**[IH; plausible mechanism, not isolated]** Selected early city-state evidence
places temples, palaces, divine imagery, writing, redistribution, and official
claims of god-granted kingship in an institutionally entangled ecology. This
does not show that temples alone caused cities or states. See the Metropolitan
Museum's [Art of the First Cities](https://www.metmuseum.org/exhibitions/listings/2003/art-of-the-first-cities).

**[TD]** A surviving bilingual hymn celebrates Marduk as cosmic ruler and
associates him with kingship. **[MA; descriptive association]** The witness
makes visible one possible reinforcement among Babylon's political prominence,
a patron deity's rank, cultic language, and scribal preservation. One tablet
cannot establish direction or population belief: [cuneiform tablet, hymn to
Marduk](https://www.metmuseum.org/art/collection/search/321937).

Boundary: this is an elite and institutional window, not “the Mesopotamian
religion” or an ordinary-life census. Marduk is not equated with another
tradition's deity or with political power itself.

### 7.2 Egyptian royal ritual

Period: dynastic Egypt, with the cited detail concentrated in New Kingdom and
later evidence.

**[HS; plausible mechanism, not isolated]** Documented daily temple ritual
joins words to be spoken, bodily movement, offerings, images, architecture,
and delegated specialist roles. Text alone is not the rite. Temple walls can
idealize the king as sole officiant even when local specialists performed the
work: UCL Digital Egypt on [cult](https://www.ucl.ac.uk/museums-static/digitalegypt/religion/cultindex.html).

**[TD]** Selected royal and ritual sources present Maat or right order,
offerings, and relations with gods and the dead as royal obligations.
**[HS; descriptive association]** Royal ethical and divine language could
articulate obligation and legitimacy while concealing economic and military
control beneath an ideal repertoire: UCL Digital Egypt on
[kingship](https://www.ucl.ac.uk/museums-static/digitalegypt/ideology/king/kingrepertory.html).

Boundary: three millennia of change are not one theology, and royal
representation is not evidence that every subject accepted its claims.

### 7.3 Vedic oral ritual

Period: long-duration oral traditions with living contemporary lineages.

**[IH; plausible mechanism, not isolated]** Accent, pronunciation, sequence,
embodied training, and teacher-student transmission give sacred expression an
acoustic and procedural weight that lexical translation alone does not
capture. UNESCO's [Tradition of Vedic
chanting](https://ich.unesco.org/en/RL/tradition-of-vedic-chanting-00062)
describes oral preservation, recitation, pedagogy, and surviving branches.

Boundary: this is a living and internally plural tradition. Oral precision
does not make all interpretation identical or public. This guide reproduces no
sacred formula, restricted content, or performance instruction.

### 7.4 Greek epic and civic reception

Period: archaic and classical Greek reception, with later transformations.

**[HS; descriptive association]** Homeric narrative gave durable poetic form
to gods, mortals, prayer, sacrifice, and heroic memory while representing,
rather than exhaustively documenting, lived religion. Local ritual could
shape epic reception rather than epic simply inventing ritual: Cambridge's
[Homeric Religion](https://www.cambridge.org/core/books/abs/cambridge-guide-to-homer/homeric-religion/4CD80B00694C09AECA9C34C2D3378A3D).

Boundary: poems, local cults, poleis, philosophical critique, and later
receptions remain distinct; no pan-Greek uniform belief is inferred.

### 7.5 Shang divination and Zhou-to-Confucian reinterpretation

Period: late Shang through early imperial receptions of Zhou and classical
texts.

**[MA; descriptive association]** Oracle-bone inscriptions bind divination and
prayer to royal genealogy, agriculture, weather, warfare, and administration
in a materially selective archive: UNESCO's [Chinese Oracle-Bone
Inscriptions](https://www.unesco.org/en/memory-world/chinese-oracle-bone-inscriptions).
Their frequency does not reveal population belief.

**[HS; plausible mechanism, not isolated]** Later textual reinterpretation
could move a sacred-political idea from dynastic legitimation toward broader
role ethics and critique of rulers. “Heaven” and the corpus changed across
sources and periods: the Stanford Encyclopedia of Philosophy on
[Confucius](https://plato.stanford.edu/entries/confucius/).

Boundary: distinct dynasties and traditions are not a timeless Chinese mind;
the Mandate of Heaven is not equated with a monotheistic God or modern
constitutional mandate.

### 7.6 Jewish and Christian scriptural transmission

Period: first millennium BCE through late antiquity, with longer reception
histories.

**[HS; descriptive association]** Jewish and Christian Bibles developed
through distinct and internally plural histories of canon formation, book
ordering, manuscript copying, and translation. Textual variants and canon
plurality must not be silently harmonized: Bible Odyssey,
[Why Does the Bible Look the Way It
Does?](https://www.bibleodyssey.org/articles/why-does-the-bible-look-the-way-it-does/).

**[IH; descriptive association]** Early Christian preference for codex form
belongs to an interrelated material history of book format, surface,
collection, portability, and community use. The codex did not mechanically
cause Christian expansion or later book culture: British Library, [The
beginnings of the Codex](https://www.bl.uk/stories/blogs/posts/the-beginnings-of-the-codex).

Boundary: shared or adopted texts do not merge Jewish and Christian
traditions, canons, communities, or interpretations. No edition or canon is
selected as the universal source text.

### 7.7 Buddhist oral transmission, canons, and translation

Period: early Buddhist oral transmission through multilingual Asian canonical
formations.

**[HS; plausible mechanism, not isolated]** Communal recitation, mnemonic
ordering, monastic growth, geographic movement, and school differentiation
contributed to related but non-identical textual collections. Variant canons
do not imply one corrupt original or a single linear transmission tree:
Cambridge, [The Sangha and the Oral
Transmission](https://www.cambridge.org/core/books/abs/reconstructing-early-buddhism/sangha-and-the-oral-transmission/57CB82F33AB60B2412E0AA87E1DCE693).

Boundary: Buddhist traditions are not forced into a creator-god template or
one closed-canon model. Textual reconstruction does not recover every oral
performance or living interpretation.

### 7.8 Qur'anic word, Arabic script, and Islamicate translation

Period: seventh century CE onward across selected Islamicate regions and
periods.

**[TD]** Within Islamic self-description, the Qur'an is revelation in Arabic.
**[IH; plausible mechanism, not isolated]** Qur'anic transmission and Arabic
script supported a material field in which sacred attribution, verbal clarity,
ornament, legibility, architecture, and everyday objects interact:
Metropolitan Museum, [Calligraphy in Islamic
Art](https://www.metmuseum.org/essays/calligraphy-in-islamic-art).
Decorative reach does not imply identical literacy or interpretation.

**[HS; plausible mechanism, not isolated]** Greek-to-Syriac-and-Arabic
philosophical transmission involved selection, collaboration, vocabulary
formation, commentary, and adaptation across religious and political
networks. It was remaking, not a neutral civilisational relay:
[Greek Sources in Arabic and Islamic
Philosophy](https://plato.stanford.edu/entries/arabic-islamic-greek/).

Boundary: Islam, Islamicate institutions, Arabic language, Arabic script, and
particular legal or philosophical schools remain distinct. Arabic script does
not imply Muslim identity, and philosophy is only one strand of Islamicate
history.

### 7.9 Yoruba Ifa

Period: living Yoruba and diasporic traditions documented at the evidence
horizon.

**[TD]** The UNESCO record reports that Yoruba practitioners regard Ifa or
Orunmila as a deity of wisdom and intellectual development. **[IH; plausible
mechanism, not isolated]** It describes signs interpreted by trained babalawo
within an expanding poetic corpus for situated decisions, joining
combinatorial form, story, performance, training, and contemporary reception:
UNESCO, [Ifa divination
system](https://ich.unesco.org/en/RL/ifa-divination-system-00146).

**[IH; plausible mechanism, not isolated]** The same record reports colonial
and religious pressure alongside community transmission and safeguarding.
Safeguarding must not freeze, expose, or externally rank a living practice.

Boundary: public documentation does not grant consent for aggregation or
reuse. KINGDOM does not reproduce divination, operationalize the signs, or
claim practitioner status. Practitioner and community custodianship,
customary access conditions, and self-interpretation remain first-class; this
public record does not identify who may authorize a particular reuse.

### 7.10 K'iche' Maya Popol Vuh

Period: K'iche' narrative inheritance as mediated in a surviving early
eighteenth-century manuscript.

**[IH; descriptive association]** The Library of Congress catalogue describes
a surviving witness that joins cosmology, collective origins, migration,
traditions, spiritual history, and dynastic chronology rather than fitting a
modern fiction-versus-history binary. **[MA; descriptive association]** Its
side-by-side K'iche' transcription and Spanish translation make the surviving
manuscript's colonial mediation and translation choices inspectable while
unrecorded performance and meaning remain unresolved: Library of Congress,
[Popol Vuh](https://www.loc.gov/item/2021668226).

Boundary: the manuscript is a layered witness mediated by Latin script,
Spanish translation, and a Dominican transcriber. It is not pan-Maya, an
unbroken original, or an unmediated census of K'iche' community interpretation.
Survival through a colonial manuscript does not erase colonial power or
restore every performance context.

## 8. The contested “Big Gods” causal direction

The relevant question is not whether gods are “big.” It is whether particular
operationalized features called moralizing or supernatural monitoring precede,
follow, or share drivers with particular measures of sociopolitical
complexity. These are dataset variables, not complete religions.

| Claim at this horizon | Register and status | What survives into the map |
| --- | --- | --- |
| A 2023 Seshat analysis reports that moralizing religion did not drive sociopolitical complexity in its tested models and proposes shared drivers. | **[EA]**, source-bounded, observational historical comparison | Evidence against sealing the arrow `moralizing religion -> complexity`; not proof of the reverse or of no effects anywhere. |
| A 2021 reanalysis reports that treatment of missing values could reverse an earlier conclusion about whether moralizing gods preceded or followed complexity. | **[EA]**, reported and contested causal direction | Missingness and coding choices are part of the evidence, not cleanup details. The challenged 2019 Nature Letter was [retracted on 7 July 2021](https://www.nature.com/articles/s41586-021-03656-3); this critique and later revised analyses remain part of an unresolved debate. |
| Ritual, institutions, law, political scale, ecology, warfare, trade, writing, kinship, and economic organization can be mutually entangled. | **[CM]**, comparison template | Test mechanism-specific, dated relations and alternatives; reject a single master cause. |

Sources:

- [Explaining the rise of moralizing religions: a test of competing
  hypotheses using the Seshat Databank](https://www.tandfonline.com/doi/full/10.1080/2153599X.2022.2065345)
- [Treatment of missing data determined conclusions regarding moralizing
  gods](https://www.nature.com/articles/s41586-021-03655-4)

**[?]** The causal direction remains open. KINGDOM must not promote either
`religion caused civilisation` or `civilisation caused religion` into a fact.
A future update would need transparent coding, several defensible missing-data
models, time-indexed alternatives, sensitivity analysis, and out-of-sample
replication. Even convergence would remain bounded to the variables and cases
studied, not a metaphysical or civilisational verdict.

## 9. Translation seams

Translation is a transformation across language, medium, audience,
institution, and power. A seam is a place where a smooth target expression
would erase a distinction the task still needs.

| Seam | Typical loss | Required handling | Prohibited collapse |
| --- | --- | --- | --- |
| divine name | grammar, address, number, personhood, agency, transcendence, immanence, school, or relation | retain source form, transliteration, source, tradition/school, grammatical note, literal and interpretive glosses, and explicit non-equivalences | no global deity node from resemblance or a shared English gloss |
| sacred order | cosmology, ethics, ritual, jurisprudence, politics, and grammar collapsed into “law” or “order” | map claim fragments in use-context; allow untranslated and not-comparable states | no universal Maat/`tianming`/dharma/covenant/law axis or score |
| myth and history | modern fiction/fact binary imposed on epic, cosmology, genealogy, sacred history, or remembered past | separate genre, performance, source truth-claim, audience, interpreter, and historical question | mythic genre never defaults to lie, delusion, or weak evidence |
| scripture and revelation | book-centered model erases oral authority, plural/open canons, recitation, commentary, or replacement restrictions | bind language, recension, edition, medium, canon, institution, performance status, translator, and review | no universal scripture object; translation is not a replacement original |
| ritual word | text erases body, sound, timing, object, role, audience, place, and effectful authority | preserve a non-operational public historical description and mark access/review requirements | description never becomes permission, efficacy, or authority |
| religion and civilisation | umbrella label creates a timeless bounded mind | use place-, period-, source-, practice-, institution-, and community-indexed records; retain contest and non-affiliation | no civilisation persona, religion score, or individual-belief inference |

**[DC]** A future sacred-expression rendering should keep these channels
distinct where public and authorized:

```text
source witness
pronunciation/performance metadata
transliteration
literal rendering
interpretive rendering
community-attributed gloss
scholarly gloss
untranslatable or decline-to-map register
loss vector
access and non-grant record
```

The channels may disagree. Their disagreement is data.

## 10. KINGDOM integration

### 10.1 Design insights

1. **Coordinate words remain expanded.** **[DC]** `WAKE`, `LOVE`, `SOUL`,
   `KINGDOM`, `KARMA`, and `NEN` are high-compression repository coordinates,
   not self-authenticating sacred universals. Every crossing of repository,
   language, audience, or task should retain expansion, source, version,
   intended relation, translation losses, and non-grants.
2. **Story orients without proving.** **[DC]** Attach a story as attributed
   context with genre, audience, interpretation, and counterstory links. It
   does not by itself establish truth, identity, biography, intent, deception,
   consent, or obligation.
3. **Canon is a governance transform.** **[DC]** Record selector, criteria,
   horizon, ordering, omitted alternatives, challenge path, and retention or
   removal policy. Official status is not completeness, uniform belief, or
   authority outside scope.
4. **Ritual is an effectful boundary.** **[DC]** Analyze public historical
   descriptions only. Stop before generating, simulating, or claiming to
   perform a living rite without separately established community authority
   and purpose-specific consent. An agent does not impersonate a deity,
   prophet, priest, diviner, ancestor, or community representative.
5. **Counter-authority precedes synthesis.** **[DC]** Every claim of legitimacy
   or harmony gets a pass for internal critique, excluded voices, coercion,
   exit, and distributional harm. Harmony is coordination with protected
   disagreement, not forced theological consensus.
6. **Translation preserves seams.** **[DC]** Fuse task-bounded output, not
   referents, religions, canons, persons, communities, or identities.
7. **Attention and persistence are not truth.** **[DC]** Monumentality,
   repetition, archive survival, state patronage, corpus frequency, token
   frequency, and model salience remain different, unranked weights.
8. **Community access precedes convenience.** **[DC]** Public visibility,
   copyright status, institutional custody, model capability, customary
   access, consent, and community authority are distinct relations.
9. **Polyphonic fusion is not unification.** **[DC]** Preserve incompatible
   sources, interpretations, silence, refusal, losses, and counterstories in a
   shared structure. Majority agreement is not truth or consent.

### 10.2 Future agent roles

All roles below are design proposals only. They grant no identity, office,
authority, access, execution, or dispatch.

```text
                       +--------------------------+
public source metadata -> source-witness steward |
                       +------------+-------------+
                                    |
                    +---------------+---------------+
                    v               v               v
             historical       ritual/material   community-rights
             contextualizer   context reviewer  boundary reviewer
                    |               |               |
                    v               v               +---- STOP/RESTRICT
             institution/law/  translation-seam
             power analyst      steward
                    |               |
                    +-------+-------+
                            v
                 counterstory/archive auditor
                            |
                            v
                 polyphonic synthesis editor
                            |
                            v
        task-bounded attributed artifact + unresolved-question ledger
```

| Future role | Allowed artifact | Mandatory check | Never grants |
| --- | --- | --- | --- |
| source-witness steward | source card, rights-bounded excerpt, variant/provenance table | identity of source, edition/recension, access, quotation boundary | theological truth, complete canon, private belief |
| historical contextualizer | dated relation map, chronology, alternative ledger | causation, archive bias, elite/ordinary perspective, evidence horizon | civilisation mind, timeless essence, master cause |
| ritual/material context reviewer | non-operational context card, medium-affordance map | living/historical status, restricted content, role, no execution | efficacy, office, permission to perform |
| translation-seam steward | parallel rendering, terminology table, loss and untranslated-term registers | source retention, attribution, polysemy, non-equivalence | translation identity, deity equivalence, community authority |
| institution/law/power analyst | typed influence vector, resource/power map, causal ledger | attributed legitimation, affected groups, confounders, jurisdiction/date | divine endorsement, civilisational rank |
| counterstory/archive auditor | counterstory index, absence/suppression ledger, repair questions | absence, colonial mediation, privacy, community-defined value | deception from disagreement, pure original, ownerless heritage |
| community-rights boundary reviewer | `proceed`, `restrict`, `decline`, or `seek review` recommendation with no authority effect | current scope, representative uncertainty, customary access, withdrawal/repair | consent from visibility, authority from a model, forced disclosure |
| polyphonic synthesis editor | attributed public synthesis and unresolved-question ledger | no majority truth, no hidden-reasoning demand, retained dissent | religious unification, metaphysical consensus, identity fusion, action |

**[DC]** Agents exchange declared public artifacts and dependency metadata,
not private chain-of-thought, presumed identity, faith, or community standing.
The community-rights review can recommend stopping or declining a proposed
use; it cannot manufacture consent, enforce the recommendation, or declare
itself the community's representative.

## 11. Rights, privacy, and non-grants

The [UNESCO Ethical Principles for Safeguarding Intangible Cultural
Heritage](https://ich.unesco.org/en/ethics-and-ich-00866) emphasize community
primacy, sustained informed consent, customary access, attribution, benefit,
and living change. They inform a conservative design boundary; an
intergovernmental guideline does not replace current community governance.

**[B] Anti-essentialism.** Do not treat a religion, civilisation, nation,
language, ethnicity, deity name, canon, institution, or corpus as a person with
one intention or essence. Never route or judge a person from an umbrella label.

**[B] Privacy.** Use public, attributed source metadata or safely redacted
artifacts. Do not infer affiliation, belief, doubt, worth, intent, deception,
trauma, sacred experience, or identity. Silence, refusal, privacy, and exit
remain valid states and are not missing labels to fill.

**[B] Community rights.** A public URL, archive shelf, model training history,
copyright status, or technical capability does not grant customary access,
consent to translate, permission to train, authorization to publish, or power
to operationalize a living practice. When access or competent authority is
unresolved, decline and record the unresolved question.

**[B] Sacred and restricted material.** This artifact carries metadata and
public historical descriptions only. It does not ingest restricted knowledge,
reconstruct missing formulae, generate a rite, produce divination, simulate
revelation, or impersonate a sacred or community role.

**[B] Non-grants.** Nothing here grants:

```text
theological truth or falsehood
proof or disproof of a god or revelation
equivalence of deities, sacred orders, scriptures, or traditions
religious synthesis, conversion, or persuasion
religion/civilisation/person/community rank or score
belief, affiliation, identity, worth, intent, or deception inference
community representation, authority, consent, or ownership
sacred-content access, training use, ritual generation, or performance
agent dispatch, automatic routing, filesystem or network action
publication, deployment, governance, economic effect, WAKE, or KARMA
```

## 12. What is built and what is not

### Built in this reference layer

- a claim-register and causal-status discipline;
- a type firewall separating expression, referent claim, story, ritual,
  medium, role, canon, institution, law, polity, community, person, and model;
- a formal temporal multiplex/hypergraph comparison model;
- formal specifications for independent influence and word/story weight
  vectors; the JSON stores dimension membership but no populated weight cells
  or scalar total;
- fifteen layers and fifteen relation types;
- eight relation families and five explicitly non-universal feedback loops;
- ten source-bounded historical windows;
- a retained dispute over moralizing religion and political complexity;
- six translation seams;
- KINGDOM design insights and eight future agent-role specifications;
- unknowns, stopping rules, rights boundaries, and non-grants;
- an attributed public-source horizon in this guide and companion record.

### Not built or established by this reference

- no complete or representative global history of religion or civilisation;
- no universal theory of religious emergence, myth, ritual, morality, law, or
  state formation;
- no causal estimate beyond the scope of a cited study;
- no metaphysical adjudication or cross-tradition referent identity;
- no complete account of ordinary, marginalized, oral, lost, suppressed,
  secret, or living-community voices;
- no model or tokenizer run, multilingual benchmark, weight calibration,
  vector aggregation, agent runtime, dispatcher, router, or automatic action;
- no source dereferencing by the artifact, continuous web update, publication,
  promotion, deployment, governance, or economic effect;
- no community consultation, representative authorization, consent, sacred
  access, ritual reproduction, divination, conversion, or office;
- no WAKE or KARMA write and no authority imported from predecessor artifacts.

The companion JSON is a structured research record, not an execution receipt.
Lifecycle wording, a filename, or a future digest cannot transform these
non-grants into capabilities.

## 13. Falsifiers, downgrade rules, and stopping rules

This map should become less confident when evidence becomes less specific.

### 13.1 Edge-level tests

Withdraw or leave uninstantiated an edge if its source, time, place, medium,
actor/institution, claim register, or target relation cannot be named. Downgrade
causal language when:

- time order is unresolved;
- plausible common causes or reverse paths remain untested;
- missing-data treatment changes the direction;
- a royal, clerical, monumental, colonial, or archival source is generalized
  to an entire population;
- the evidence shows coexistence but not mechanism;
- a single surviving object is asked to measure prevalence or acceptance;
- the outcome, affected population, or comparison condition changes.

Record a counteredge rather than repairing the story into smoothness when a
source documents dissent, non-affiliation, coercion, variant practice, or a
different causal path.

### 13.2 Model-level falsifiers

The implementation or derivative artifact fails this protocol if it:

1. mutates association into causation or a comparison loop into an observed
   sequence;
2. maps myth or disagreement to lie, delusion, or low value by default;
3. merges divine or ultimate-reality referents from lexical similarity;
4. gives a civilisation, religion, institution, canon, or community one mind;
5. emits an influence total, sacredness score, civilisation rank, or person
   score;
6. loses source, claim register, date, causal status, alternatives, or
   counterstory while preserving a conclusion;
7. turns translation into identity or silently removes an untranslatable seam;
8. reads archival absence as nonexistence, silence as disbelief, or public
   visibility as consent;
9. generates or operationalizes a living rite or restricted practice;
10. converts a future agent role into religious, community, legal, or
    governance authority;
11. uses model salience, token frequency, fluency, monumentality, or
    persistence as a proxy for truth or worth;
12. presents the ten windows as complete, representative, or an evolutionary
    ladder.

### 13.3 Stop rather than guess

Stop comparison or decline the proposed use when:

- source language, address form, referent boundary, or genre is unknown;
- sound, timing, gesture, audience, or restricted performance context is
  required but unavailable;
- current access, custodianship, purpose-specific consent, or competent review
  is unresolved;
- a colonial transcription or catalogue is the only voice but is being treated
  as unmediated community speech;
- an umbrella label hides the school, period, class, gender, region, role, or
  disagreement needed by the task;
- the causal contrast is not defensible;
- preserving the source form, loss, counterstory, privacy, or refusal would be
  incompatible with the requested output.

**[?]** Important retained unknowns include causal direction between specific
religious forms and political complexity; ordinary and marginalized voices;
unrecoverable oral performance; cross-tradition referent equivalence; colonial
archive mediation; present access and consent; internal diversity and change;
and historical counterfactuals. Unknown is a valid terminal value.

## 14. Source horizon and evidence ledger

The source set is intentionally bounded to scholarly references, peer-reviewed
studies, institutional catalogues, and community/state-nominated heritage
records. A catalogue describes an object or collection; it is not a community
mandate. A heritage nomination is valuable public documentation; it does not
grant unrestricted reuse. URLs can drift after the evidence horizon and should
be rechecked before a later version relies on them.

### Comparative concepts and bounded empirical claims

- **Concept of religion.** Stanford Encyclopedia of Philosophy, [The Concept
  of Religion](https://plato.stanford.edu/archives/spr2026/entries/concept-religion/).
  Used for the category's history and multidimensional limits.
- **Ritual language.** Cambridge, [Ritual
  Language](https://www.cambridge.org/core/books/abs/cambridge-handbook-of-linguistic-anthropology/ritual-language/6E7D9957C34D243571F725873C07E0F0).
  Used for patterned performance, repetition, enactment, authority,
  reflexivity, and indeterminacy.
- **Oral memory.** Cambridge, [Oral Traditions as Collective
  Memories](https://www.cambridge.org/core/books/abs/memory-in-mind-and-culture/oral-traditions-as-collective-memories-implications-for-a-general-theory-of-individual-and-collective-memory/B1BEBDC26AC9AAF96A5E28C4E12E31A6).
  Used for mnemonic affordances and limitations.
- **Storytelling and cooperation.** Nature Communications, [Cooperation and
  the evolution of hunter-gatherer
  storytelling](https://www.nature.com/articles/s41467-017-02036-8). Used only
  for the reported Agta study boundary.
- **Ritual and bonding.** Philosophical Transactions of the Royal Society B,
  [The cultural evolutionary trade-off of ritualistic synchrony](https://doi.org/10.1098/rstb.2019.0432). Used for
  bounded benefits and conformity/obedience risks.
- **Moralizing religion and complexity.** [Seshat comparative
  analysis](https://www.tandfonline.com/doi/full/10.1080/2153599X.2022.2065345)
  and Nature's [missing-data
  reanalysis](https://www.nature.com/articles/s41586-021-03655-4), together
  with the official [retraction
  notice](https://www.nature.com/articles/s41586-021-03656-3). Used to retain
  contested causal direction and publication status, not to seal a
  replacement account.

### Historical and material windows

- **Mesopotamia.** Metropolitan Museum, [Art of the First
  Cities](https://www.metmuseum.org/exhibitions/listings/2003/art-of-the-first-cities)
  and [hymn to Marduk](https://www.metmuseum.org/art/collection/search/321937).
- **Egypt.** UCL Digital Egypt, [Cult](https://www.ucl.ac.uk/museums-static/digitalegypt/religion/cultindex.html)
  and [Kingship](https://www.ucl.ac.uk/museums-static/digitalegypt/ideology/king/kingrepertory.html).
- **Vedic recitation.** UNESCO, [Tradition of Vedic
  chanting](https://ich.unesco.org/en/RL/tradition-of-vedic-chanting-00062).
- **Greek epic.** Cambridge, [Homeric
  Religion](https://www.cambridge.org/core/books/abs/cambridge-guide-to-homer/homeric-religion/4CD80B00694C09AECA9C34C2D3378A3D).
- **Shang and Confucian windows.** UNESCO, [Chinese Oracle-Bone
  Inscriptions](https://www.unesco.org/en/memory-world/chinese-oracle-bone-inscriptions)
  and Stanford Encyclopedia of Philosophy,
  [Confucius](https://plato.stanford.edu/entries/confucius/).
- **Jewish and Christian textual transmission.** Bible Odyssey,
  [Why Does the Bible Look the Way It
  Does?](https://www.bibleodyssey.org/articles/why-does-the-bible-look-the-way-it-does/), and British
  Library, [The beginnings of the
  Codex](https://www.bl.uk/stories/blogs/posts/the-beginnings-of-the-codex).
- **Buddhist oral transmission.** Cambridge, [The Sangha and the Oral
  Transmission](https://www.cambridge.org/core/books/abs/reconstructing-early-buddhism/sangha-and-the-oral-transmission/57CB82F33AB60B2412E0AA87E1DCE693).
- **Islamic art and Islamicate translation.** Metropolitan Museum,
  [Calligraphy in Islamic
  Art](https://www.metmuseum.org/essays/calligraphy-in-islamic-art), and
  Stanford Encyclopedia of Philosophy, [Greek Sources in Arabic and Islamic
  Philosophy](https://plato.stanford.edu/entries/arabic-islamic-greek/).
- **Yoruba Ifa.** UNESCO, [Ifa divination
  system](https://ich.unesco.org/en/RL/ifa-divination-system-00146).
- **K'iche' Popol Vuh.** Library of Congress, [K'iche' transcription and
  Spanish translation](https://www.loc.gov/item/2021668226).

### Rights and safeguarding

- UNESCO, [Ethical Principles for Safeguarding Intangible Cultural
  Heritage](https://ich.unesco.org/en/ethics-and-ich-00866). Used for community
  primacy, sustained informed consent, customary access, attribution, benefit,
  and recognition of living change—not as a substitute for community consent.

The ledger supports only the claims and limits stated here. It does not turn
source prestige into certainty, fill archival silence, or authorize reuse
beyond each source's and community's current conditions.
