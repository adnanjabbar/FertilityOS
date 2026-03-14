# Phase 3.2–3.5 — One Agent Per Phase: Copy-Paste Prompts

Use **Option 1**: one agent per phase. Copy the prompt below for the phase you want that agent to implement. Each agent should work in a separate branch or session and implement **full stack** (schema + migration + APIs + UI + nav + Super Dashboard) for that phase only.

---

## Agent A — Phase 3.2: Appointments & Scheduling

```
Implement Phase 3.2 Appointments & Scheduling for FertilityOS using the handoff document.

Read and follow exactly: System-Architecture/Planning/phase-3-2-agent-handoff.md

Do both Agent 1 (schema + migration + APIs) and Agent 2 (UI: list, add, detail/edit, nav, Super Dashboard). Use migration file 0004_appointments.sql. Add "Appointments" to the app nav. Update GET /api/app/super/stats with appointments count and set scheduling: "active" in modules. Run the new migration after creating it and add it to website/scripts/run-migrations.js. Document the migration in System-Architecture/Infrastructure/digitalocean-database-setup.md.
```

---

## Agent B — Phase 3.3: Clinical Notes (EMR)

```
Implement Phase 3.3 Clinical Notes (EMR) for FertilityOS using the handoff document.

Read and follow exactly: System-Architecture/Planning/phase-3-3-agent-handoff.md

Do both Agent 1 (schema + migration + APIs) and Agent 2 (UI: notes section on patient detail, add/view/edit note, Super Dashboard). Use migration file 0005_clinical_notes.sql. Set emr: "active" in super stats modules. Run the new migration and add it to run-migrations.js. Document in digitalocean-database-setup.md.
```

---

## Agent C — Phase 3.4: IVF Lab & Embryology

```
Implement Phase 3.4 IVF Lab & Embryology for FertilityOS using the handoff document.

Read and follow exactly: System-Architecture/Planning/phase-3-4-agent-handoff.md

Do both Agent 1 (schema + migrations + APIs for ivf_cycles and embryos) and Agent 2 (UI: IVF cycles section on patient detail, cycle detail, add cycle and embryos, Super Dashboard). Use migration file 0006_ivf_cycles.sql (both tables in one file). Add ivfCyclesCount to super stats and set ivfLab: "active". Run the new migration and add it to run-migrations.js. Document in digitalocean-database-setup.md.
```

---

## Agent D — Phase 3.5: Billing & Invoicing

```
Implement Phase 3.5 Billing & Invoicing for FertilityOS using the handoff document.

Read and follow exactly: System-Architecture/Planning/phase-3-5-agent-handoff.md

Do both Agent 1 (schema + migration + APIs for invoices and invoice_lines) and Agent 2 (UI: invoices list, add invoice with line items, invoice detail, mark paid, nav, Super Dashboard). Use migration file 0007_invoices.sql (both tables in one file). Generate unique invoice numbers per tenant (e.g. INV-YYYY-NNN). Add invoicesCount to super stats and set billing: "active". Run the new migration and add it to run-migrations.js. Document in digitalocean-database-setup.md.
```

---

## Notes for running in parallel

- **Branching:** Each agent can work on a branch like `phase-3-2-appointments`, `phase-3-3-emr`, `phase-3-4-ivf`, `phase-3-5-billing`. Merge one phase at a time to avoid migration number conflicts if two agents pick the same number.
- **Migration order:** If all four run truly in parallel, ensure each uses only its assigned migration file (0004, 0005, 0006, 0007). Merge order can be 3.2 → 3.3 → 3.4 → 3.5 so migrations run in sequence on main.
- **Conflict:** If two agents touch the same file (e.g. `run-migrations.js` or app layout), merge the first PR, then have the next agent rebase and add only their migration/entry.
