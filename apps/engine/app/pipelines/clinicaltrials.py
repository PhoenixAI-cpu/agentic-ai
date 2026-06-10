"""
ClinicalTrials.gov data pipeline for Antaria.

Retrieves clinical trial information using the ClinicalTrials.gov API v2.
Responses are cached in-memory with a 5-minute TTL.
"""

import time

import httpx

_CACHE: dict[str, tuple[float, object]] = {}
_TTL = 300  # 5 minutes


def _cache_get(key: str):
    entry = _CACHE.get(key)
    if entry and (time.time() - entry[0]) < _TTL:
        return entry[1], True
    return None, False


def _cache_set(key: str, value):
    _CACHE[key] = (time.time(), value)


def _extract_trial(study: dict) -> dict:
    """Extract relevant fields from a ClinicalTrials study object."""
    proto = study.get("protocolSection", {})
    ident = proto.get("identificationModule", {})
    status_mod = proto.get("statusModule", {})
    design_mod = proto.get("designModule", {})
    sponsor_mod = proto.get("sponsorCollaboratorsModule", {})
    conditions_mod = proto.get("conditionsModule", {})
    interventions_mod = proto.get("armsInterventionsModule", {})

    conditions = conditions_mod.get("conditions", [])
    interventions = [
        i.get("name") for i in interventions_mod.get("interventions", []) if i.get("name")
    ]
    phases = design_mod.get("phases", [])

    return {
        "nct_id": ident.get("nctId"),
        "title": ident.get("briefTitle"),
        "status": status_mod.get("overallStatus"),
        "phase": phases[0] if phases else None,
        "sponsor": sponsor_mod.get("leadSponsor", {}).get("name"),
        "start_date": status_mod.get("startDateStruct", {}).get("date"),
        "primary_completion_date": status_mod.get("primaryCompletionDateStruct", {}).get("date"),
        "enrollment": design_mod.get("enrollmentInfo", {}).get("count"),
        "conditions": conditions,
        "interventions": interventions,
    }


class ClinicalTrialsPipeline:
    """Pipeline for ClinicalTrials.gov trial data."""

    BASE = "https://clinicaltrials.gov/api/v2"

    async def search_trials(self, query: str, status: str = "RECRUITING", limit: int = 10) -> list:
        """Search trials by condition/intervention.

        Endpoint: GET /studies?query.cond={query}&filter.overallStatus={status}&pageSize={limit}&format=json
        Returns list of trial summary dicts.
        """
        key = f"ct:search:{query}:{status}:{limit}"
        cached, hit = _cache_get(key)
        if hit:
            return cached

        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(
                f"{self.BASE}/studies",
                params={
                    "query.cond": query,
                    "filter.overallStatus": status,
                    "pageSize": limit,
                    "format": "json",
                },
            )
            resp.raise_for_status()
            data = resp.json()

        results = [_extract_trial(s) for s in data.get("studies", [])]
        _cache_set(key, results)
        return results

    async def get_trial(self, nct_id: str) -> dict:
        """Get full trial details.

        Endpoint: GET /studies/{nct_id}?format=json
        """
        key = f"ct:trial:{nct_id}"
        cached, hit = _cache_get(key)
        if hit:
            result = dict(cached)
            result["_cache_hit"] = True
            return result

        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(f"{self.BASE}/studies/{nct_id}", params={"format": "json"})
            resp.raise_for_status()
            data = resp.json()

        result = _extract_trial(data)
        # also add why_stopped if present
        proto = data.get("protocolSection", {})
        result["why_stopped"] = proto.get("statusModule", {}).get("whyStopped")
        result["_cache_hit"] = False
        _cache_set(key, dict(result))
        return result

    async def get_failure_patterns(self, indication: str, phase: str = "PHASE2") -> list:
        """Get completed/terminated trials for an indication to extract failure signals.

        Endpoint: GET /studies?query.cond={indication}&filter.overallStatus=TERMINATED,COMPLETED
                            &filter.phase={phase}&pageSize=20&format=json
        Returns list with status, why_stopped field for terminated trials.
        """
        key = f"ct:failures:{indication}:{phase}"
        cached, hit = _cache_get(key)
        if hit:
            return cached

        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(
                f"{self.BASE}/studies",
                params={
                    "query.cond": indication,
                    "filter.overallStatus": "TERMINATED,COMPLETED",
                    "filter.phase": phase,
                    "pageSize": 20,
                    "format": "json",
                },
            )
            resp.raise_for_status()
            data = resp.json()

        results = []
        for study in data.get("studies", []):
            trial = _extract_trial(study)
            proto = study.get("protocolSection", {})
            trial["why_stopped"] = proto.get("statusModule", {}).get("whyStopped")
            results.append(trial)

        _cache_set(key, results)
        return results
