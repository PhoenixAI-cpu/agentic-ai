"""
Open Targets data pipeline for Antaria.

Retrieves target-disease associations and drug indications using the
Open Targets GraphQL API. Responses are cached in-memory with a 5-minute TTL.
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


class OpenTargetsPipeline:
    """Pipeline for Open Targets target-disease association data."""

    GQL = "https://api.platform.opentargets.org/api/v4/graphql"

    async def _query(self, query: str, variables: dict) -> dict:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                self.GQL,
                json={"query": query, "variables": variables},
                headers={"Content-Type": "application/json"},
            )
            resp.raise_for_status()
            return resp.json()

    async def get_target_diseases(self, ensembl_id: str, limit: int = 10) -> list:
        """Get disease associations for a target (Ensembl gene ID).

        Returns list of {disease_id, disease_name, overall_score, genetic_score, drug_score}
        """
        key = f"ot:diseases:{ensembl_id}:{limit}"
        cached, hit = _cache_get(key)
        if hit:
            return cached

        query = """
        query TargetDiseases($id: String!, $limit: Int!) {
          target(id: $id) {
            associatedDiseases(page: { size: $limit }) {
              rows {
                disease { id name }
                score
                datatypeScores { componentId score }
              }
            }
          }
        }
        """
        data = await self._query(query, {"id": ensembl_id, "limit": limit})

        rows = (
            data.get("data", {})
            .get("target", {})
            .get("associatedDiseases", {})
            .get("rows", [])
        )

        results = []
        for row in rows:
            disease = row.get("disease", {})
            datatype_scores = {s["componentId"]: s["score"] for s in row.get("datatypeScores", [])}
            results.append({
                "disease_id": disease.get("id"),
                "disease_name": disease.get("name"),
                "overall_score": row.get("score"),
                "genetic_score": datatype_scores.get("genetic_association"),
                "drug_score": datatype_scores.get("known_drug"),
            })

        _cache_set(key, results)
        return results

    async def search_targets(self, query: str, limit: int = 5) -> list:
        """Search for targets by gene name.

        Returns list of {ensembl_id, name}
        """
        key = f"ot:search:{query}:{limit}"
        cached, hit = _cache_get(key)
        if hit:
            return cached

        gql = """
        query SearchTargets($q: String!, $limit: Int!) {
          search(queryString: $q, entityNames: ["target"], page: { size: $limit }) {
            hits { id name entity }
          }
        }
        """
        data = await self._query(gql, {"q": query, "limit": limit})

        hits = data.get("data", {}).get("search", {}).get("hits", [])
        results = [{"ensembl_id": h.get("id"), "name": h.get("name")} for h in hits]

        _cache_set(key, results)
        return results

    async def get_drug_indications(self, chembl_drug_id: str) -> list:
        """Get approved indications for a drug.

        Returns list of {disease_name, max_phase}
        """
        key = f"ot:drug:{chembl_drug_id}"
        cached, hit = _cache_get(key)
        if hit:
            return cached

        query = """
        query DrugIndications($id: String!) {
          drug(id: $id) {
            indications {
              rows {
                disease { name }
                maxPhaseForIndication
              }
            }
          }
        }
        """
        data = await self._query(query, {"id": chembl_drug_id})

        rows = (
            data.get("data", {})
            .get("drug", {})
            .get("indications", {})
            .get("rows", [])
        )

        results = [
            {
                "disease_name": row.get("disease", {}).get("name"),
                "max_phase": row.get("maxPhaseForIndication"),
            }
            for row in rows
        ]

        _cache_set(key, results)
        return results
