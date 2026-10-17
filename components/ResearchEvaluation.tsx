import results from '../training/artifacts/brighter-time-evaluation.json';
import model from '../training/artifacts/brighter-time-research-model.json';

export default function ResearchEvaluation() {
  const difference=results.means.model_mae_ms-results.means.recent_mean_mae_ms;
  return <section className="panel">
    <h2>Research model evaluation</h2>
    <p className="panel-sub mt-4">A Ridge regression model was trained on real Brighter Time research records to estimate the next recorded psychomotor vigilance task (PVT) median reaction time within 48 hours. This is an offline research experiment, separate from your personal wellness analysis.</p>
    <div className="data-row"><span>Research participants</span><span>{model.audit.participants}</span></div>
    <div className="data-row"><span>PVT records / eligible prediction examples</span><span>{model.audit.pvt_rows} / {model.audit.eligible_examples}</span></div>
    <h3 className="mt-6">Repeated participant-split evaluation</h3>
    <p className="panel-sub">Mean absolute error (MAE) in milliseconds, averaged equally across {results.splits} splits. Lower is better; this is not an accuracy percentage.</p>
    <div className="overflow-x-auto"><table className="records-table"><thead><tr><th>Method</th><th>Average MAE</th></tr></thead><tbody>
      <tr><td>Trained Ridge model</td><td>{results.means.model_mae_ms.toFixed(3)} ms</td></tr>
      <tr><td>Previous-result baseline</td><td>{results.means.previous_result_mae_ms.toFixed(3)} ms</td></tr>
      <tr><td>Recent-average baseline</td><td>{results.means.recent_mean_mae_ms.toFixed(3)} ms</td></tr>
    </tbody></table></div>
    <p className="mt-4"><strong>No consistent advantage over the recent average.</strong> The trained model had {difference.toFixed(3)} ms more error on average and beat that baseline in {results.wins} of {results.splits} splits.</p>
    <details className="mt-6"><summary>See each evaluation split</summary><div className="overflow-x-auto"><table className="records-table"><thead><tr><th>Split seed</th><th>Ridge MAE (ms)</th><th>Previous result (ms)</th><th>Recent average (ms)</th></tr></thead><tbody>{results.rows.map(row=><tr key={row.seed}><td>{row.seed}</td><td>{row.model_mae_ms.toFixed(3)}</td><td>{row.previous_result_mae_ms.toFixed(3)}</td><td>{row.recent_mean_mae_ms.toFixed(3)}</td></tr>)}</tbody></table></div></details>
    <h3 className="mt-6">What was evaluated</h3>
    <p className="panel-sub">Each example uses earlier reaction results, the prior session’s hours awake and sleepiness, and prior time of day. Participants are separated into training, validation and test groups. Validation selects regularization; test results do not select settings. Earlier sessions from test participants supply prediction inputs but are not used to fit the model.</p>
    <h3 className="mt-6">Limits and next steps</h3>
    <p className="panel-sub">The splits overlap and are not independent studies. This is not a prospective calendar-wide evaluation. The research PVT differs from NeuroTwin’s five-trial browser task, and the source sleepiness coding (observed 1–10) still needs review. These results do not validate predictions for your account or establish clinical usefulness. No live research-model prediction or automatic retraining is enabled.</p>
    <p className="panel-sub mt-4">Data: Didikoglu and colleagues, University of Manchester, <a href="https://doi.org/10.48420/20212265" target="_blank" rel="noreferrer">Brighter Time dataset</a>. Licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. Analysis selects PVT records and constructs earlier-session features. Values shown come from the exported research artifact and repeated-evaluation CSV.</p>
  </section>;
}
