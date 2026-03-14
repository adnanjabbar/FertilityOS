# Global Skills Registry — FertilityOS

This document is the **global registry and guide** for skills and conventions used by AI agents (e.g. Cursor, Claude Code, Antigravity) when working on **FertilityOS**. As new skills are installed or new conventions adopted, document them here so all agents have a single reference.

---

## FertilityOS Conventions (All Agents)

When working on this repo, **always**:

1. **System-Architecture first** — Planning, design, and product decisions live under `System-Architecture/`. Check relevant docs before implementing (e.g. `Planning/mvp-scope.md`, `Planning/tech-stack.md`, `Design/`).
2. **Design source** — The marketing website in `website/` is the canonical UI/UX. Use `System-Architecture/Design/website-design-source.md`, `branding-guidelines.md`, and `design-system.md` for all product UI so branding stays consistent.
3. **Phase-by-phase** — Build in phases per the roadmap; document new modules and API surface in System-Architecture so we can later publish API docs and charge for EMR integrations.
4. **Old-System** — `System-Architecture/Old-System/` is reference only (previous Express/PostgreSQL implementation). Do not copy from it without aligning to the new architecture and docs.
5. **Git workflow** — Prefer pull before changes and push after (with meaningful commits) to keep the repo in sync with GitHub and DigitalOcean deployments.

---

## 🚀 Installed Skills

### 1. `typescript-docs`
* **Source:** [giuseppe-trisciuoglio/developer-kit](https://github.com/giuseppe-trisciuoglio/developer-kit)
* **Status:** Installed Globally.
* **Location:** `~/.gemini/agents/workflows/typescript-docs/SKILL.md`
* **Purpose:** Provides comprehensive documentation, best practices, rules, and configuration guidelines for modern TypeScript development. It covers typing patterns, generic usage, utility types, Next.js/React integrations, and error handling.
* **How to Call into Action:** 
  You should use the `view_file` tool to read the skill instructions from `c:\Users\Dr Adnan Jabbar\.gemini\agents\workflows\typescript-docs\SKILL.md` whenever you need guidance on:
  - Complex TypeScript types, interfaces, or generics.
  - Solving strict type-checking issues (e.g., `tsconfig.json` strict mode).
  - Following the officially recommended developer-kit TypeScript patterns for React/Node.js.

### 2. `claude-code-templates`
* **Source:** [davila7/claude-code-templates](https://github.com/davila7/claude-code-templates)
* **Status:** Installed Globally.
* **Location:** `~/.gemini/agents/workflows/claude-code-templates/`
* **Purpose:** Provides a collection of templates specifically optimized for Claude Code/Antigravity spanning multiple frameworks.
* **How to Call into Action:** Review the specific templates located in the `claude-code-templates` folder matching your current stack (e.g., React, Node, etc.) prior to writing new components to ensure consistency with these high-quality templates.

### 3. `antigravity-awesome-skills`
* **Source:** [sickn33/antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills)
* **Status:** Installed Globally.
* **Location:** `~/.gemini/agents/workflows/antigravity-awesome-skills/`
* **Purpose:** A curated list of highly effective "awesome" skills specifically designed for the Antigravity system, extending agent capabilities in complex problem-solving.
* **How to Call into Action:** Check the index of skills in this repository and invoke them when facing specific advanced coding challenges or architectural roadblocks.

### 4. `ui-ux-pro-max-skill`
* **Source:** [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
* **Status:** Installed Globally.
* **Location:** `~/.gemini/agents/workflows/ui-ux-pro-max-skill/`
* **Purpose:** Provides absolute premium styling guidelines, advanced micro-interaction patterns, and premium "pro-max" design aesthetic rules for web development.
* **How to Call into Action:** Use this skill specifically when developing frontend React components, Tailwind styling, or animations to ensure the interface meets "Pro Max" premium UI/UX standards. This is the primary authority on frontend aesthetics.

### 5. `claude-code-template`
* **Source:** [kimny1143/claude-code-template](https://github.com/kimny1143/claude-code-template)
* **Status:** Installed Globally.
* **Location:** `~/.gemini/agents/workflows/claude-code-template/`
* **Purpose:** Excellent general-purpose coding templates optimized for Claude engines.
* **How to Call into Action:** View the repository's rules and structural templates before scaffolding new files or major modules to inherit optimized structural designs.

### 6. `claude-supercode-skills`
* **Source:** [404kidwiz/claude-supercode-skills](https://github.com/404kidwiz/claude-supercode-skills)
* **Status:** Installed Globally.
* **Location:** `~/.gemini/agents/workflows/claude-supercode-skills/`
* **Purpose:** A suite of "Supercode" skills that enhance deep automated refactoring, test generation, and complex logical analysis within Antigravity.
* **How to Call into Action:** Read the relevant skill from this directory when needing extreme accuracy in deep-refactoring, generating complex unit tests, or conducting system-wide logical audits.

### 7. `marketingskills`
* **Source:** [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills)
* **Status:** Installed Globally.
* **Location:** `~/.gemini/agents/workflows/marketingskills/`
* **Purpose:** Provides strategic marketing techniques, conversion-rate optimization (CRO) UI/UX suggestions, and copywriting protocols for web applications.
* **How to Call into Action:** Deploy this skill when designing landing pages or user-facing forms to ensure maximum conversion rates and engaging copy.

### 8. `seo-geo-claude-skills`
* **Source:** [aaron-he-zhu/seo-geo-claude-skills](https://github.com/aaron-he-zhu/seo-geo-claude-skills)
* **Status:** Installed Globally.
* **Location:** `~/.gemini/agents/workflows/seo-geo-claude-skills/`
* **Purpose:** Best practices for search engine optimization (SEO) and geographic/local SEO targeting.
* **How to Call into Action:** Use this when constructing the meta tags, routing, or content architectures of the web application.

### 9. `skills-template`
* **Source:** [supercent-io/skills-template](https://github.com/supercent-io/skills-template)
* **Status:** Installed Globally.
* **Location:** `~/.gemini/agents/workflows/skills-template/`
* **Purpose:** Standardizes the creation and formatting of future AI skills and workflows.
* **How to Call into Action:** Access this if the user asks you to create entirely new, custom `.md` skill files from scratch.

### 10. `database-skills`
* **Source:** [planetscale/database-skills](https://github.com/planetscale/database-skills)
* **Status:** Installed Globally.
* **Location:** `~/.gemini/agents/workflows/database-skills/`
* **Purpose:** Expert-tier database optimization, schema design, indexing strategies, and SQL/Prisma query optimization.
* **How to Call into Action:** Use this specifically when editing `schema.prisma`, writing complex SQL, or whenever the database layer needs scaling.

### 11. `anthropics/skills`
* **Source:** [anthropics/skills](https://github.com/anthropics/skills)
* **Status:** Installed Globally.
* **Location:** `~/.gemini/agents/workflows/skills/`
* **Purpose:** Baseline Anthropic-approved code quality and logic standards.
* **How to Call into Action:** Serve as the general foundation for code logic.

### 12. `agents`
* **Source:** [wshobson/agents](https://github.com/wshobson/agents)
* **Status:** Installed Globally.
* **Location:** `~/.gemini/agents/workflows/agents/`
* **Purpose:** Contains complex logic capabilities for multi-agent reasoning, task delegation, and execution structuring.
* **How to Call into Action:** Read through this if a massive objective requires splitting into multiple deep-dive tasks.

### 13. `droid-tings`
* **Source:** [ovachiever/droid-tings](https://github.com/ovachiever/droid-tings)
* **Status:** Installed Globally.
* **Location:** `~/.gemini/agents/workflows/droid-tings/`
* **Purpose:** Advanced automation workflows and "droid" configuration principles.
* **How to Call into Action:** Excellent for configuring automated bash tasks or background routines.

### 14. `chatgpt-skills`
* **Source:** [dkyazzentwatwa/chatgpt-skills](https://github.com/dkyazzentwatwa/chatgpt-skills)
* **Status:** Installed Globally.
* **Location:** `~/.gemini/agents/workflows/chatgpt-skills/`
* **Purpose:** A collection of highly effective skills adapted for generalized problem-solving logic.
* **How to Call into Action:** Applicable for generalized logic extraction or formatting guidelines.

### 15. `ai-workflow`
* **Source:** [nicepkg/ai-workflow](https://github.com/nicepkg/ai-workflow)
* **Status:** Installed Globally.
* **Location:** `~/.gemini/agents/workflows/ai-workflow/`
* **Purpose:** Establishes rigorous CI/CD-style quality checkpoints directly into the AI generation logic.
* **How to Call into Action:** Consult this before writing tests and executing final workflow validations.

### 16. `agent-skills`
* **Source:** [gokapso/agent-skills](https://github.com/gokapso/agent-skills)
* **Status:** Installed Globally.
* **Location:** `~/.gemini/agents/workflows/agent-skills/`
* **Purpose:** Contains robust context management skills that allow sub-agents to persist data effectively.
* **How to Call into Action:** When spawning multiple agents to generate a massive module, this skill instructs them on how to communicate code seamlessly.

---

## 🛠️ How to Use This Registry (For AI Agents)

1. **FertilityOS context:** For any task in this repo, apply the FertilityOS conventions above and the relevant System-Architecture docs.
2. **Check availability:** Before a complex task (e.g. refactoring TypeScript, UI work), check this registry for relevant skills.
3. **Read the skill:** Use your file-reading tools to open the `SKILL.md` (or equivalent) at the path listed under "Location". Paths may be under Cursor skills, `~/.cursor/`, or `~/.gemini/agents/workflows/` depending on the agent environment.
4. **Apply the rules:** Follow the instructions in the skill file for high-quality, consistent output.

> **Note to Agents:** Treat the skills listed here as available when paths exist in your environment. Use them when relevant. For FertilityOS-specific work, System-Architecture docs take precedence for product and design decisions.
