# Procurement Decision Intelligence — Design Direction

## Approach 1
- **Theme Name:** Graphite Signal
- **Very Brief Intro:** A dark, editorial intelligence workspace with restrained electric accents, designed to make evidence, risk, and decisions feel precise and consequential.
- **Probability:** 0.07

## Approach 2
- **Theme Name:** Paper Trail
- **Very Brief Intro:** A warm, document-led procurement studio inspired by annotated briefing books, archival paper, and high-trust consulting materials. The interface feels tactile, rigorous, and quietly premium.
- **Probability:** 0.03

## Approach 3
- **Theme Name:** Civic Instrument
- **Very Brief Intro:** A cool, institutional decision system with large-scale typography, diagrammatic structure, and a calm palette that makes complex comparisons legible without feeling bureaucratic.
- **Probability:** 0.09

# Chosen Approach: Paper Trail

## Design Movement
Swiss editorial systems reinterpreted through the material language of procurement binders, annotated documents, and high-end strategy reports.

## Core Principles
1. **Evidence has a surface:** Important claims should feel attached to a source, not floating in a dashboard.
2. **Calm before clever:** The UI should reduce cognitive load with clear hierarchy, modest ornament, and strong rhythm.
3. **Human judgment stays visible:** Recommendations explain themselves and never impersonate certainty.
4. **Every interaction advances the brief:** Navigation and actions should feel like moving through a working decision document.

## Color Philosophy
Use warm parchment and bone as the working field, ink for certainty, oxidized terracotta for attention, and a muted teal for verified evidence. The palette should feel like a trusted physical briefing pack: grounded, legible, and serious, with color reserved for interpretation rather than decoration.

## Layout Paradigm
A persistent left rail acts as the document spine, while the main canvas uses asymmetrical editorial columns: a wide working surface, a narrow evidence margin, and occasional full-bleed summary bands. Avoid centered card grids; compose the page like an active decision brief.

## Signature Elements
- Thin rule lines, annotation ticks, and source brackets that echo marked-up paper.
- A vertical “brief spine” label and compact index markers in the left rail.
- Tactile surfaces: paper grain, soft ink shadows, stamped status chips, and underlined evidence links.

## Interaction Philosophy
Interactions should feel like turning to a page, opening a document margin, or highlighting a clause. Use instant feedback for dense data navigation, and short, composed transitions for drawers, evidence views, and recommendation explanations.

## Animation
Use 180–240ms ease-out transitions. On page entry, stagger the spine, heading, metrics, and evidence surfaces by 40ms. Charts should reveal with a clipped horizontal wipe rather than a spring. Buttons compress to 0.97 on press. Drawers enter from the right with opacity and translate only. Respect reduced motion.

## Typography System
Use **DM Serif Display** for editorial page titles and **Manrope** for controls, metadata, tables, and body copy. Page titles are large but not oversized; labels use uppercase 10–11px Manrope with generous tracking. Numeric values use Manrope with tabular numbers.

## Brand Essence
An evidence-backed procurement co-pilot for teams choosing with confidence when proposals do not line up cleanly. **Precise, candid, composed.**

## Brand Voice
Headlines are decisive but never inflated. CTAs are verbs tied to the work, not vague conversion language. Microcopy names uncertainty instead of hiding it.

Example lines:
- “See what changed before you compare.”
- “Unknown is a finding, not a failure.”

## Wordmark & Logo
A compact “folded bracket” mark: two offset paper-corner strokes forming a subtle check/signal shape, paired with a custom wordmark set in a narrow editorial sans. The icon should work alone as the favicon and in the rail header.

## Signature Brand Color
**Oxide Teal — #1F6B67**, used only for verified evidence, active intelligence, and confident next steps.

## Screen-Specific Notes
- **Global shell:** Warm parchment canvas, ink rail, thin rule system, persistent brief context.
- **Overview:** Lead with a strong “decision posture” sentence, then show evidence coverage, comparable cost, and requirement fit as a concise brief.
- **Compare:** Use a wide evidence table with row-level traceability and scope warnings, not a generic scorecard.
- **Risks:** Use a calm severity ladder and clear remediation actions rather than alarm-red decoration.
- **Requirements:** Present the rubric as an editable working document with weights and classification.
- **Documents:** Make processing coverage and version deltas explicit.
- **Settings:** Keep it functional and quiet; never let it look like a marketing page.

## Implementation Reminder
Before each component is edited, ask: “Does this choice reinforce or dilute Paper Trail?”
