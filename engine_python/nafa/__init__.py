"""
NAFA AGRITECH — Package Python d'Ingénierie Agronomique, Vétérinaire, CAO 2D/3D et Terrain
"""

from .crops_vision import CropVisionAnalyzer, CropType, PathologyType, SeverityLevel
from .livestock_density import LivestockDensityEngine, AnimalSpecies, THIStatus
from .modeling_2d_3d import AgronomicCAD3DEngine, StructureType, Building3DSpecs, Mesh3D
from .field_suite import (
    AfricanFieldSuiteEngine,
    GeodesicGPSPoint,
    AfricanUTMZone,
    PipeMaterial,
    IrrigationMethod,
    MERCURIALE_BPU_FCFA
)

__version__ = "1.0.0"
__all__ = [
    "CropVisionAnalyzer",
    "CropType",
    "PathologyType",
    "SeverityLevel",
    "LivestockDensityEngine",
    "AnimalSpecies",
    "THIStatus",
    "AgronomicCAD3DEngine",
    "StructureType",
    "Building3DSpecs",
    "Mesh3D",
    "AfricanFieldSuiteEngine",
    "GeodesicGPSPoint",
    "AfricanUTMZone",
    "PipeMaterial",
    "IrrigationMethod",
    "MERCURIALE_BPU_FCFA",
]
