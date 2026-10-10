"""
NAFA AGRITECH — CLI Professionnel d'Ingénierie Agronomique et Vétérinaire
"""

import argparse
import json
import sys
import uvicorn
from .crops_vision import CropVisionAnalyzer, CropType
from .livestock_density import LivestockDensityEngine, AnimalSpecies
from .modeling_2d_3d import AgronomicCAD3DEngine, StructureType, Building3DSpecs
from .field_suite import AfricanFieldSuiteEngine, GeodesicGPSPoint, AfricanUTMZone, PipeMaterial


def main():
    parser = argparse.ArgumentParser(
        prog="nafa-engine",
        description="NAFA AGRITECH — Suite logicielle d'ingénierie agronomique, vétérinaire et CAO 2D/3D"
    )
    subparsers = parser.add_subparsers(dest="command", help="Commandes disponibles")

    # Serveur API
    srv_parser = subparsers.add_parser("serve", help="Lancer le serveur API REST local FastAPI")
    srv_parser.add_argument("--host", default="127.0.0.1", help="Hôte d'écoute")
    srv_parser.add_argument("--port", type=int, default=8000, help="Port d'écoute")

    # Arpentage GPS
    gps_parser = subparsers.add_parser("survey", help="Calculer la surface et le périmètre d'une parcelle GPS")
    gps_parser.add_argument("--points", required=True, help="Liste JSON de points lat/lon ex: '[[12.35, -1.52], [12.351, -1.52], [12.351, -1.519], [12.35, -1.519]]'")
    gps_parser.add_argument("--zone", type=int, default=30, help="Fuseau UTM (30 ou 31)")

    # Audit Densité Élevage
    live_parser = subparsers.add_parser("livestock", help="Audit de densité et stress thermique THI")
    live_parser.add_argument("--species", default="poulet_chair", help="Espèce animale (poulet_chair, pondeuse, ovin, bovin)")
    live_parser.add_argument("--area", type=float, required=True, help="Surface du bâtiment ou enclos en m²")
    live_parser.add_argument("--heads", type=int, required=True, help="Nombre de têtes")
    live_parser.add_argument("--temp", type=float, default=34.0, help="Température ambiante en °C")
    live_parser.add_argument("--humidity", type=float, default=45.0, help="Humidité relative en %")

    # Modélisation 3D
    cad_parser = subparsers.add_parser("model-building", help="Générer le modèle 3D OBJ d'un bâtiment d'élevage")
    cad_parser.add_argument("--length", type=float, default=24.0, help="Longueur en mètres")
    cad_parser.add_argument("--width", type=float, default=8.0, help="Largeur en mètres")
    cad_parser.add_argument("--wall-height", type=float, default=2.4, help="Hauteur mur gouttereau en mètres")
    cad_parser.add_argument("--ridge-height", type=float, default=3.6, help="Hauteur faîtage en mètres")
    cad_parser.add_argument("--output-obj", default=None, help="Chemin d'export du fichier .obj")

    args = parser.parse_args()

    if args.command == "serve":
        print(f"Démarrage de l'API NAFA AGRITECH sur http://{args.host}:{args.port}")
        uvicorn.run("nafa.api:app", host=args.host, port=args.port, reload=False)

    elif args.command == "survey":
        pts_raw = json.loads(args.points)
        pts = [GeodesicGPSPoint(latitude=p[0], longitude=p[1]) for p in pts_raw]
        engine = AfricanFieldSuiteEngine()
        res = engine.survey_land_gps(pts, utm_zone=AfricanUTMZone(args.zone))
        print(json.dumps({
            "superficie_m2": res.area_m2,
            "superficie_hectares": res.area_hectares,
            "perimetre_m": res.perimeter_m,
            "centroide": [res.centroid_lat, res.centroid_lon]
        }, indent=2))

    elif args.command == "livestock":
        engine = LivestockDensityEngine()
        res = engine.analyze_density(
            species=AnimalSpecies(args.species),
            enclosure_area_m2=args.area,
            total_heads=args.heads,
            temperature_celsius=args.temp,
            relative_humidity_pct=args.humidity
        )
        print(json.dumps({
            "espece": res.species.value,
            "nombre_tetes": res.total_heads,
            "densite_calculee_tet_m2": res.calculated_density_heads_per_m2,
            "densite_max_recommandee": res.recommended_density_max,
            "surdensite": res.is_overcrowded,
            "total_ubt": res.total_ubt,
            "thi_indice": res.bioclimatic_audit.thi_index,
            "thi_statut": res.bioclimatic_audit.thi_status.value,
            "eau_requise_L_jour": res.bioclimatic_audit.water_requirements_total_liters_day
        }, indent=2, ensure_ascii=False))

    elif args.command == "model-building":
        engine = AgronomicCAD3DEngine()
        specs = Building3DSpecs(
            structure_type=StructureType.BIOCLIMATIC_POULTRY_HOUSE,
            length_m=args.length,
            width_m=args.width,
            wall_height_m=args.wall_height,
            ridge_height_m=args.ridge_height
        )
        res = engine.model_bioclimatic_building_3d(specs)
        print(f"Modélisation terminée : {res.ground_footprint_m2} m² au sol, {res.usable_air_volume_m3} m³ d'air utile.")
        print(f"Sommets: {res.vertices_count}, Faces: {res.faces_count}")
        if args.output_obj:
            with open(args.output_obj, "w", encoding="utf-8") as f:
                f.write(res.mesh_obj_string)
            print(f"Fichier OBJ exporté avec succès vers : {args.output_obj}")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
