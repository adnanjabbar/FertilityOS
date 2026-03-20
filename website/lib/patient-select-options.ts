/**
 * Load patients for select dropdowns (paginates until all loaded, with safety cap).
 * Call from client useEffect only (uses fetch).
 */
export type PatientOptionMinimal = { id: string; firstName: string; lastName: string };

export async function loadAllPatientOptionsForSelect(): Promise<PatientOptionMinimal[]> {
  const limit = 200;
  const acc: PatientOptionMinimal[] = [];
  let page = 1;
  const maxPages = 50;

  while (page <= maxPages) {
    const res = await fetch(`/api/app/patients?limit=${limit}&page=${page}`);
    if (!res.ok) break;
    const j = (await res.json()) as {
      patients?: Array<{ id: string; firstName: string; lastName: string }>;
      totalPages?: number;
    };
    const list = Array.isArray(j) ? j : j.patients ?? [];
    for (const p of list) {
      acc.push({ id: p.id, firstName: p.firstName, lastName: p.lastName });
    }
    const totalPages = typeof j.totalPages === "number" ? j.totalPages : 1;
    if (page >= totalPages || list.length === 0) break;
    page += 1;
  }

  return acc;
}
