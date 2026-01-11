from fastapi import APIRouter, HTTPException, Request
from typing import Optional
from data.aircraft_database import (
    lookup_registration, 
    get_all_operators, 
    get_all_aircraft_types,
    get_aircraft_models_by_type,
    AIRCRAFT_MODELS
)

router = APIRouter(prefix="/aircraft", tags=["aircraft"])

@router.get("/lookup")
async def lookup_aircraft(registration: str):
    """
    Busca informações de aeronave pela matrícula.
    Usa banco de dados local baseado em dados públicos da ANAC.
    Retorna também sugestões de modelos baseado no tipo da aeronave.
    """
    if not registration or len(registration) < 2:
        raise HTTPException(status_code=400, detail="Matrícula inválida")
    
    result = lookup_registration(registration)
    
    if result:
        # Adicionar sugestões de modelos baseado no tipo
        aircraft_type = result.get("aircraft_type")
        models = []
        if aircraft_type:
            models = get_aircraft_models_by_type(aircraft_type)
        
        return {
            "found": True,
            **result,
            "suggested_models": models
        }
    
    return {
        "found": False,
        "registration": registration.upper(),
        "message": "Matrícula não encontrada no banco de dados local. Por favor, preencha manualmente.",
        "suggested_models": []
    }

@router.get("/operators")
async def list_operators():
    """Lista todos os operadores conhecidos"""
    return {"operators": get_all_operators()}

@router.get("/types")
async def list_aircraft_types():
    """Lista todos os tipos de aeronaves"""
    return {"types": get_all_aircraft_types()}

@router.get("/models")
async def list_aircraft_models(aircraft_type: Optional[str] = None):
    """Lista modelos de aeronaves, opcionalmente filtrado por tipo"""
    if aircraft_type:
        models = get_aircraft_models_by_type(aircraft_type)
        return {"type": aircraft_type, "models": models}
    
    # Retorna todos os modelos agrupados por tipo
    all_models = {}
    for model, data in AIRCRAFT_MODELS.items():
        atype = data["type"]
        if atype not in all_models:
            all_models[atype] = []
        all_models[atype].append({
            "model": model,
            "full_name": data["full_name"],
            "manufacturer": data["manufacturer"]
        })
    
    return {"models_by_type": all_models}

@router.get("/validate")
async def validate_registration(registration: str):
    """Valida formato de matrícula brasileira"""
    if not registration:
        return {"valid": False, "message": "Matrícula vazia"}
    
    reg = registration.upper().strip()
    
    # Formato brasileiro: PR-XXX, PP-XXX, PT-XXX, PS-XXX, PU-XXX
    valid_prefixes = ["PR-", "PP-", "PT-", "PS-", "PU-"]
    
    # Verifica se tem formato válido
    for prefix in valid_prefixes:
        if reg.startswith(prefix.replace("-", "")) or reg.startswith(prefix):
            # Normaliza para formato com hífen
            if "-" not in reg and len(reg) >= 5:
                normalized = f"{reg[:2]}-{reg[2:]}"
            else:
                normalized = reg
            
            return {
                "valid": True,
                "normalized": normalized,
                "prefix": reg[:2],
                "country": "Brasil"
            }
    
    # Pode ser matrícula estrangeira
    return {
        "valid": True,
        "normalized": reg,
        "country": "Estrangeira/Desconhecida",
        "message": "Matrícula não segue padrão brasileiro, mas pode ser válida"
    }
