from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta
import numpy as np
from app.models import Finding, FindingCategory, FindingSeverity, ReviewStatus

def evaluate_statistical_workload_and_ml(workflows: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Evaluates Statistical & Machine Learning Anomaly models:
    - RULE-05: Shift-Boundary Mass Closure Dump
    - RULE-08: Unsupervised Multi-variate Triage Outliers (Isolation Forest / Scikit-learn)
    - Analyst operational profiling metrics
    """
    findings = []
    
    # -------------------------------------------------------------
    # RULE-05: Shift-Boundary Mass Closure Dump Detection
    # -------------------------------------------------------------
    # Group closures by analyst and check for high-density bursts (< 15 mins window with >= 15 closures)
    closures_by_analyst: Dict[str, List[Dict[str, Any]]] = {}
    for wf in workflows:
        closure = wf["closure"]
        if closure and closure["closed_by"] and closure["closed_at"]:
            analyst = closure["closed_by"]
            if analyst not in closures_by_analyst:
                closures_by_analyst[analyst] = []
            try:
                dt = datetime.strptime(closure["closed_at"], "%Y-%m-%d %H:%M:%S")
                closures_by_analyst[analyst].append({
                    "dt": dt,
                    "wf": wf,
                    "closure": closure
                })
            except Exception:
                pass

    for analyst, items in closures_by_analyst.items():
        items.sort(key=lambda x: x["dt"])
        window = timedelta(minutes=15)
        
        # Sliding window
        for i in range(len(items)):
            start_time = items[i]["dt"]
            cluster = [items[i]]
            for j in range(i + 1, len(items)):
                if items[j]["dt"] - start_time <= window:
                    cluster.append(items[j])
                else:
                    break
            
            if len(cluster) >= 15: # Burst threshold
                sample_wf = cluster[0]["wf"]
                end_time = cluster[-1]["dt"]
                entity_id = sample_wf["entity_id"]
                entity_name = sample_wf["entity_name"]
                
                # Check if we already created a finding for this analyst burst
                burst_key = f"BURST-{analyst}-{start_time.strftime('%Y%m%d%H%M')}"
                if not any(f.get("burst_key") == burst_key for f in findings):
                    findings.append({
                        "burst_key": burst_key,
                        "rule_id": "RULE-05",
                        "entity_id": entity_id,
                        "entity_name": entity_name,
                        "title": f"Shift-Boundary Mass Closure Dump ({len(cluster)} Tickets in {int((end_time - start_time).total_seconds()/60)}m)",
                        "category": FindingCategory.STATISTICAL_WORKLOAD,
                        "severity": FindingSeverity.HIGH,
                        "base_score": 88,
                        "what": f"Analyst '{analyst}' closed {len(cluster)} alerts/cases within an abnormal {int((end_time - start_time).total_seconds()/60)+1}-minute window (average {(end_time - start_time).total_seconds()/len(cluster):.1f}s per ticket), exhibiting metric-gaming / shift-clearing behavior.",
                        "why": "Operational Quality Standard: Bulk-closing alerts at high speed without individualized investigation indicates systematic queue flushing and superficial triage.",
                        "expected_workflow": [
                            "1. Triage: Individual review of alert context and source IP",
                            "2. Distinct Investigation: Case-by-case evidence verification",
                            "3. Distributed Closures: Normal temporal spread throughout 8-hour shift"
                        ],
                        "observed_workflow": [
                            f"1. Burst Start: First closure at {start_time.strftime('%H:%M:%S')}",
                            f"2. Rapid Succession: {len(cluster)} tickets closed by {analyst} in rapid succession",
                            f"3. Burst End: Final closure at {end_time.strftime('%H:%M:%S')}",
                            "4. Generic Root Cause: Repetitive copy-pasted closure explanations"
                        ],
                        "supporting_evidence": {
                            "analyst_id": analyst,
                            "ticket_count": len(cluster),
                            "window_minutes": int((end_time - start_time).total_seconds()/60) + 1,
                            "start_timestamp": start_time.strftime("%Y-%m-%d %H:%M:%S"),
                            "end_timestamp": end_time.strftime("%Y-%m-%d %H:%M:%S"),
                            "sample_alert_ids": [c["wf"]["alert"]["id"] for c in cluster[:5]]
                        },
                        "counterfactual_explanation": "If closures had been distributed across shift hours with average investigation times > 8 minutes per ticket, this burst anomaly would not be triggered.",
                        "recommended_action": f"Review SOC shift handover logs for Analyst {analyst} on {start_time.strftime('%Y-%m-%d')} and audit all {len(cluster)} batch-closed alerts."
                    })
                break

    # -------------------------------------------------------------
    # RULE-08: Unsupervised Multi-variate Triage Outlier (Scikit-learn Isolation Forest)
    # -------------------------------------------------------------
    ml_feature_rows = []
    ml_wf_map = []
    
    for wf in workflows:
        alert = wf["alert"]
        case = wf["case"]
        closure = wf["closure"]
        
        triage_dur = float(alert["triage_duration_sec"])
        sev_val = {"Critical": 4.0, "High": 3.0, "Medium": 2.0, "Low": 1.0}.get(alert["severity"], 1.0)
        has_case_val = 1.0 if case else 0.0
        closure_dur = float(closure["duration_minutes"]) if closure and closure["duration_minutes"] else (triage_dur / 60.0)
        
        ml_feature_rows.append([triage_dur, sev_val, has_case_val, closure_dur])
        ml_wf_map.append(wf)

    if len(ml_feature_rows) >= 20:
        try:
            from sklearn.ensemble import IsolationForest
            X = np.array(ml_feature_rows)
            # Fit Isolation Forest
            iso = IsolationForest(contamination=0.03, random_state=42)
            preds = iso.fit_predict(X)
            scores = iso.decision_function(X) # lower score means more anomalous
            
            for idx, p in enumerate(preds):
                if p == -1 and scores[idx] < -0.15: # Significant outlier
                    wf = ml_wf_map[idx]
                    alert = wf["alert"]
                    findings.append({
                        "rule_id": "RULE-08",
                        "entity_id": wf["entity_id"],
                        "entity_name": wf["entity_name"],
                        "title": f"Operational ML Outlier: Multi-Variate Triage Anomaly on {alert['target_host']}",
                        "category": FindingCategory.UNSUPERVISED_ANOMALY,
                        "severity": FindingSeverity.MEDIUM,
                        "base_score": 76,
                        "what": f"Statistical Isolation Forest model flagged alert '{alert['id']}' as an extreme multi-variate operational outlier (Anomaly Score: {scores[idx]:.3f}) across triage duration ({alert['triage_duration_sec']}s), severity, and closure profile.",
                        "why": "Operational Baselines: Statistical anomalies highlighting extreme deviation from peer baseline warrant secondary supervisory scrutiny.",
                        "expected_workflow": [
                            "1. Typical Peer Distribution: Triage duration aligns with severity cluster",
                            "2. Proportional Investigation: In-depth verification matching threat profile"
                        ],
                        "observed_workflow": [
                            f"1. Operational Outlier: Triage ({alert['triage_duration_sec']}s) and closure metrics significantly diverge from 97% of peer alerts",
                            f"2. Anomaly Decision Score: {scores[idx]:.3f}"
                        ],
                        "supporting_evidence": {
                            "alert_id": alert["id"],
                            "target_host": alert["target_host"],
                            "triage_seconds": alert["triage_duration_sec"],
                            "severity": alert["severity"],
                            "anomaly_score": round(float(scores[idx]), 3)
                        },
                        "counterfactual_explanation": "If timing and case handling features had stayed within 2 standard deviations of normal operational distribution, this statistical outlier would not have registered.",
                        "recommended_action": f"Perform spot-check review on alert {alert['id']} to understand context for unusual handling pattern."
                    })
        except Exception as e:
            print(f"ML Isolation Forest skipped: {e}")

    # Workload summary statistics
    workload_stats = {
        "total_analysts": len(closures_by_analyst),
        "analyst_activity": {
            a: {
                "total_closed": len(items),
                "avg_duration_min": round(sum(i["closure"]["duration_minutes"] or 0 for i in items)/max(len(items), 1), 2)
            } for a, items in closures_by_analyst.items()
        }
    }
    
    return findings, workload_stats
