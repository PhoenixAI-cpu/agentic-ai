"""
UniProt data pipeline for Antaria.

Retrieves protein target information, functional annotations, and structural data
using the UniProt REST API. Responses are cached in-memory with a 5-minute TTL.
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


class UniProtPipeline:
    """Pipeline for UniProt protein and structural data."""

    BASE = "https://rest.uniprot.org"

    async def get_protein(self, uniprot_id: str) -> dict:
        """Fetch protein entry from UniProt.

        Returns gene names, organism, function (from comments),
        subcellular location, sequence length, reviewed status.
        Endpoint: GET /uniprotkb/{id}?format=json
        """
        key = f"uniprot:protein:{uniprot_id}"
        cached, hit = _cache_get(key)
        if hit:
            result = dict(cached)
            result["_cache_hit"] = True
            return result

        url = f"{self.BASE}/uniprotkb/{uniprot_id}"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, params={"format": "json"})
            resp.raise_for_status()
            data = resp.json()

        # Extract gene name
        genes = data.get("genes", [])
        gene_name = None
        if genes:
            gn = genes[0].get("geneName")
            if gn:
                gene_name = gn.get("value")

        # Extract organism
        organism = data.get("organism", {}).get("scientificName")

        # Extract function from comments
        function_text = None
        for comment in data.get("comments", []):
            if comment.get("commentType") == "FUNCTION":
                texts = comment.get("texts", [])
                if texts:
                    function_text = texts[0].get("value")
                break

        # Extract subcellular location
        subcellular = []
        for comment in data.get("comments", []):
            if comment.get("commentType") == "SUBCELLULAR LOCATION":
                for loc in comment.get("subcellularLocations", []):
                    loc_name = loc.get("location", {}).get("value")
                    if loc_name:
                        subcellular.append(loc_name)
                break

        # Sequence length
        seq_length = data.get("sequence", {}).get("length")

        # Reviewed status
        reviewed = data.get("entryType") == "UniProtKB reviewed (Swiss-Prot)"

        result = {
            "accession": data.get("primaryAccession"),
            "gene": gene_name,
            "organism": organism,
            "function_summary": function_text,
            "subcellular_location": subcellular,
            "length": seq_length,
            "reviewed": reviewed,
            "_cache_hit": False,
        }
        _cache_set(key, dict(result))
        return result

    async def search_proteins(self, query: str, limit: int = 10) -> list:
        """Search proteins by name/gene.

        Endpoint: GET /uniprotkb/search?query={query}&format=json&size={limit}
        Returns list of {accession, gene, organism, function_summary, length}
        """
        key = f"uniprot:search:{query}:{limit}"
        cached, hit = _cache_get(key)
        if hit:
            return cached

        url = f"{self.BASE}/uniprotkb/search"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, params={"query": query, "format": "json", "size": limit})
            resp.raise_for_status()
            data = resp.json()

        results = []
        for entry in data.get("results", []):
            genes = entry.get("genes", [])
            gene_name = None
            if genes:
                gn = genes[0].get("geneName")
                if gn:
                    gene_name = gn.get("value")

            organism = entry.get("organism", {}).get("scientificName")
            seq_length = entry.get("sequence", {}).get("length")

            function_text = None
            for comment in entry.get("comments", []):
                if comment.get("commentType") == "FUNCTION":
                    texts = comment.get("texts", [])
                    if texts:
                        function_text = texts[0].get("value")
                    break

            results.append({
                "accession": entry.get("primaryAccession"),
                "gene": gene_name,
                "organism": organism,
                "function_summary": function_text,
                "length": seq_length,
            })

        _cache_set(key, results)
        return results

    async def get_pdb_structures(self, uniprot_id: str) -> list:
        """Get PDB structure IDs for a protein via UniProt cross-references.

        Endpoint: GET /uniprotkb/{id}?format=json
        Extract uniProtKBCrossReferences where database=PDB
        Returns list of {pdb_id, method, resolution, chains}
        """
        key = f"uniprot:pdb:{uniprot_id}"
        cached, hit = _cache_get(key)
        if hit:
            return cached

        url = f"{self.BASE}/uniprotkb/{uniprot_id}"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, params={"format": "json"})
            resp.raise_for_status()
            data = resp.json()

        structures = []
        for xref in data.get("uniProtKBCrossReferences", []):
            if xref.get("database") == "PDB":
                props = {p["key"]: p["value"] for p in xref.get("properties", [])}
                structures.append({
                    "pdb_id": xref.get("id"),
                    "method": props.get("Method"),
                    "resolution": props.get("Resolution"),
                    "chains": props.get("Chains"),
                })

        _cache_set(key, structures)
        return structures
