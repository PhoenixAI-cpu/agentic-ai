"""
ChEMBL data pipeline for Antaria.

Retrieves compound bioactivity data, assay information, and molecular properties.
In production, this will query the ChEMBL REST API and local mirrors.
"""


class ChEMBLPipeline:
    """Pipeline for ChEMBL compound and bioactivity data."""

    BASE_URL = "https://www.ebi.ac.uk/chembl/api/data"

    def get_compound(self, chembl_id: str) -> dict:
        """
        Retrieve compound data from ChEMBL.
        Currently returns a stub for API development.
        """
        return {
            "chembl_id": chembl_id,
            "status": "stub",
            "message": f"Would retrieve compound data for {chembl_id} from {self.BASE_URL}/molecule/{chembl_id}",
            "fields_available": [
                "canonical_smiles",
                "molecular_weight",
                "alogp",
                "hba",
                "hbd",
                "ro5_violations",
                "bioactivity_records",
            ],
        }

    def get_bioactivity(self, chembl_id: str, assay_type: str = "B") -> dict:
        """
        Retrieve bioactivity data for a compound.
        assay_type: B (binding), F (functional), A (ADMET), P (physicochemical)
        """
        return {
            "chembl_id": chembl_id,
            "assay_type": assay_type,
            "status": "stub",
            "message": f"Would retrieve {assay_type}-type bioactivity data for {chembl_id}",
        }
