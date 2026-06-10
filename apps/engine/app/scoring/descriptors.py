"""Molecular descriptor computation via RDKit.

Imports are lazy so the API can degrade gracefully (clear error) in
environments where the RDKit wheel is unavailable.
"""

RDKIT_AVAILABLE = False
try:  # pragma: no cover - import guard
    from rdkit import Chem
    from rdkit.Chem import Descriptors, QED, Crippen, rdMolDescriptors

    RDKIT_AVAILABLE = True
except ImportError:  # pragma: no cover - import guard
    Chem = None  # type: ignore
    Descriptors = QED = Crippen = rdMolDescriptors = None  # type: ignore


def rdkit_available() -> bool:
    """Return True if RDKit could be imported in this environment."""
    return RDKIT_AVAILABLE


def compute_descriptors(smiles: str) -> dict:
    """Compute physicochemical descriptors for a SMILES string.

    Returns None-safe dict; raises ValueError on unparseable SMILES or if
    RDKit is not installed."""
    if not RDKIT_AVAILABLE:
        raise ValueError("RDKit not installed — descriptor computation unavailable")
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        raise ValueError(f"Could not parse SMILES: {smiles}")
    return {
        "molecular_weight": Descriptors.MolWt(mol),
        "logp": Crippen.MolLogP(mol),
        "tpsa": Descriptors.TPSA(mol),
        "hbd": rdMolDescriptors.CalcNumHBD(mol),
        "hba": rdMolDescriptors.CalcNumHBA(mol),
        "rotatable_bonds": rdMolDescriptors.CalcNumRotatableBonds(mol),
        "aromatic_rings": rdMolDescriptors.CalcNumAromaticRings(mol),
        "qed": QED.qed(mol),
        "heavy_atoms": mol.GetNumHeavyAtoms(),
        "formula": rdMolDescriptors.CalcMolFormula(mol),
    }
