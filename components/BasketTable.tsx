import type { DashboardView } from "@/lib/dashboard/service";

export function BasketTable({ legs }: { legs: DashboardView["legs"] }) {
  return (
    <div className="panel">
      <h2>Basket legs</h2>
      <table>
        <thead>
          <tr>
            <th>Leg</th>
            <th>Kind</th>
            <th>Signal</th>
            <th>Weight</th>
          </tr>
        </thead>
        <tbody>
          {legs.map((l, i) => (
            <tr key={i}>
              <td>{l.label}</td>
              <td>{l.kind}</td>
              <td>
                {l.kind === "prediction" ? (
                  <>
                    {Math.round((l.beliefProb ?? 0) * 100)}% YES{" "}
                    <span className={`pill ${l.beliefSource}`}>{l.beliefSource}</span>
                  </>
                ) : (
                  <>
                    ${l.priceUsd?.toLocaleString()} <span className={`pill ${l.priceSource}`}>{l.priceSource}</span>
                  </>
                )}
              </td>
              <td>{Math.round(l.weight * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
