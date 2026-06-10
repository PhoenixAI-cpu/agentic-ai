"""
ChEMBL data pipeline for Antaria.

Hits the real ChEMBL REST API at https://www.ebi.ac.uk/chembl/api/data.
Responses are cached in-memory with a 5-minute TTL.
"""

import time
from typing import Optional

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


class ChEMBLPipeline:
    BASE = "https://www.ebi.ac.uk/chembl/api/data"

    async def get_compound(self, chembl_id: str) -> dict:
        """Fetch compound data from ChEMBL.

        Returns pref_name, molecular_formula, molecular_weight, alogp, psa,
        ro5_violations, smiles.
        Endpoint: GET /molecule/{chembl_id}?format=json
        """
        key = f"chembl:compound:{chembl_id}"
        cached, hit = _cache_get(key)
        if hit:
            result = dict(cached)
            result["_cache_hit"] = True
            return result

        url = f"{self.BASE}/molecule/{chembl_id}"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, params={"format": "json"})
            resp.raise_for_status()
            data = resp.json()

        props = data.get("molecule_properties") or {}
        structs = data.get("molecule_structures") or {}
        result = {
            "chembl_id": chembl_id,
            "pref_name": data.get("pref_name"),
            "molecular_formula": props.get("full_molformula"),
            "molecular_weight": props.get("full_mwt"),
            "alogp": props.get("alogp"),
            "psa": props.get("psa"),
            "ro5_violations": props.get("num_ro5_violations"),
            "smiles": structs.get("canonical_smiles"),
            "_cache_hit": False,
        }
        _cache_set(key, dict(result))
        return result

    async def get_bioactivity(self, chembl_id: str, target_chembl_id: Optional[str] = None) -> list:
        """Fetch bioactivity records for a compound.

        Endpoint: GET /activity?molecule_chembl_id={id}&limit=20&format=json
        Returns list of {activity_type, value, units, target_pref_name, assay_chembl_id}
        """
        key = f"chembl:bioactivity:{chembl_id}:{target_chembl_id}"
        cached, hit = _cache_get(key)
        if hit:
            return cached

        params: dict = {
            "molecule_chembl_id": chembl_id,
            "limit": 20,
            "format": "json",
        }
        if target_chembl_id:
            params["target_chembl_id"] = target_chembl_id

        url = f"{self.BASE}/activity"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        records = []
        for act in data.get("activities", []):
            records.append({
                "activity_type": act.get("standard_type"),
                "value": act.get("standard_value"),
                "units": act.get("standard_units"),
                "target_pref_name": act.get("target_pref_name"),
                "assay_chembl_id": act.get("assay_chembl_id"),
            })

        _cache_set(key, records)
        return records

    async def search_compounds(self, query: str, limit: int = 10) -> list:
        """Search ChEMBL compounds by name/synonym.

        Endpoint: GET /molecule/search?q={query}&limit={limit}&format=json
        """
        key = f"chembl:search:{query}:{limit}"
        cached, hit = _cache_get(key)
        if hit:
            return cached

        url = f"{self.BASE}/molecule/search"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, params={"q": query, "limit": limit, "format": "json"})
            resp.raise_for_status()
            data = resp.json()

        results = []
        for mol in data.get("molecules", []):
            props = mol.get("molecule_properties") or {}
            structs = mol.get("molecule_structures") or {}
            results.append({
                "chembl_id": mol.get("molecule_chembl_id"),
                "pref_name": mol.get("pref_name"),
                "molecular_formula": props.get("full_molformula"),
                "molecular_weight": props.get("full_mwt"),
                "smiles": structs.get("canonical_smiles"),
            })

        _cache_set(key, results)
        return results

    async def get_target(self, target_chembl_id: str) -> dict:
        """Fetch target info: pref_name, target_type, organism, gene_names.

        Endpoint: GET /target/{target_chembl_id}?format=json
        """
        key = f"chembl:target:{target_chembl_id}"
        cached, hit = _cache_get(key)
        if hit:
            result = dict(cached)
            result["_cache_hit"] = True
            return result

        url = f"{self.BASE}/target/{target_chembl_id}"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, params={"format": "json"})
            resp.raise_for_status()
            data = resp.json()

        gene_names = []
        for comp in data.get("target_components", []):
            for syn in comp.get("target_component_synonyms", []):
                if syn.get("syn_type") == "GENE_SYMBOL":
                    gene_names.append(syn.get("component_synonym"))
                    break

        result = {
            "target_chembl_id": target_chembl_id,
            "pref_name": data.get("pref_name"),
            "target_type": data.get("target_type"),
            "organism": data.get("organism"),
            "gene_names": gene_names,
            "_cache_hit": False,
        }
        _cache_set(key, dict(result))
        return result
