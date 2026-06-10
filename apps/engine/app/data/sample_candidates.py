"""Sample candidate set for the Antaria demo.

NOTE: the SMILES below are real, public drug structures used purely as
stand-ins so the engine returns meaningful chemistry. The Antaria-style
candidate IDs/stages are illustrative labels, not real programmes.
"""

SAMPLE_CANDIDATES: list[dict] = [
    {"id": "AX-7291", "name": "AX-7291", "stage": "Lead Optimisation",
     "smiles": "COC1=C(C=C2C(=C1)N=CN=C2NC3=CC(=C(C=C3)F)Cl)OCCCN4CCOCC4",
     "note": "gefitinib (public structure, stand-in)"},
    {"id": "AX-6104", "name": "AX-6104", "stage": "Hit-to-Lead",
     "smiles": "COCCOC1=C(C=C2C(=C1)C(=NC=N2)NC3=CC=CC(=C3)C#C)OCCOC",
     "note": "erlotinib (public structure, stand-in)"},
    {"id": "AX-5892", "name": "AX-5892", "stage": "Hit Identification",
     "smiles": "CNC(=O)C1=NC=CC(=C1)OC2=CC=C(C=C2)NC(=O)NC3=CC(=C(C=C3)Cl)C(F)(F)F",
     "note": "sorafenib (public structure, stand-in)"},
    {"id": "BX-3341", "name": "BX-3341", "stage": "Hit Identification",
     "smiles": "CC1=C(C=C(C=C1)NC(=O)C2=CC=C(C=C2)CN3CCN(CC3)C)NC4=NC=CC(=N4)C5=CC=CN=C5",
     "note": "imatinib (public structure, stand-in)"},
    {"id": "CX-1205", "name": "CX-1205", "stage": "Screening",
     "smiles": "CC(=O)OC1=CC=CC=C1C(=O)O",
     "note": "aspirin (public structure, stand-in)"},
]
