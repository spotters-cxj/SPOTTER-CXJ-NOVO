"""
ANAC Integration for Aircraft Lookup
Queries the Brazilian ANAC registry for aircraft information based on registration
"""
from fastapi import APIRouter, HTTPException, Request
import httpx
import re
from bs4 import BeautifulSoup
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/aircraft", tags=["aircraft"])

# ANAC RAB (Registro Aeronáutico Brasileiro) lookup
ANAC_RAB_URL = "https://sistemas.anac.gov.br/aeronaves/cons_rab_resposta.asp"

async def lookup_anac_registration(registration: str) -> dict:
    """
    Lookup aircraft information from ANAC RAB
    Returns aircraft details if found
    """
    # Clean and validate registration
    registration = registration.upper().strip()
    
    # Brazilian registrations start with PP, PR, PT, PS, PU
    if not re.match(r'^P[PRSTU]-[A-Z]{3}$', registration):
        return {"found": False, "error": "Formato de matrícula inválido. Use: PR-XXX, PP-XXX, PT-XXX, etc."}
    
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            # First, access the main page to get any necessary cookies
            main_page = await client.get("https://sistemas.anac.gov.br/aeronaves/cons_rab.asp")
            
            # Prepare form data for search
            # Format registration without hyphen for search
            reg_parts = registration.split("-")
            
            # Submit the search form
            form_data = {
                "Ession": "99",
                "Ession1": "99",
                "txtNumero": "",  # Serial number (optional)
                "cboMarca": reg_parts[0] if len(reg_parts) > 0 else "",  # PP, PR, PT, etc.
                "txtMarcaII": reg_parts[1] if len(reg_parts) > 1 else "",  # XXX part
                "cboMarcaPais": "",
                "cboProprietario": "",
                "cboOperador": "",
                "cboFabricante": "",
                "cboModelo": "",
                "cboTipoICAO": "",
                "cboTipoVoo": "",
                "cboStatus": "",
                "cboCategoria": "",
                "txtNS": "",
                "cboNucleo": "",
                "cboUF": "",
                "cboGravame": "",
                "Ession2": "",
                "cboMarcaPais2": "",
                "Button1": "Consultar"
            }
            
            response = await client.post(
                ANAC_RAB_URL,
                data=form_data,
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Referer": "https://sistemas.anac.gov.br/aeronaves/cons_rab.asp"
                }
            )
            
            if response.status_code != 200:
                logger.warning(f"ANAC returned status {response.status_code}")
                return {"found": False, "error": "Erro ao consultar ANAC"}
            
            # Parse HTML response
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Look for result table
            tables = soup.find_all('table')
            
            # Try to extract aircraft data from the response
            result = parse_anac_response(soup, registration)
            
            if result:
                return {"found": True, "data": result}
            else:
                return {"found": False, "error": "Aeronave não encontrada no registro ANAC"}
                
    except httpx.TimeoutException:
        logger.error("ANAC lookup timeout")
        return {"found": False, "error": "Tempo limite excedido na consulta ANAC"}
    except Exception as e:
        logger.error(f"ANAC lookup error: {str(e)}")
        return {"found": False, "error": f"Erro na consulta: {str(e)}"}

def parse_anac_response(soup: BeautifulSoup, registration: str) -> Optional[dict]:
    """Parse ANAC HTML response and extract aircraft data"""
    try:
        # ANAC returns data in table format
        # Look for key fields in the response
        text = soup.get_text()
        
        # Check if aircraft was found
        if "Nenhum registro encontrado" in text or "não encontrado" in text.lower():
            return None
        
        # Try to find aircraft data
        result = {
            "registration": registration,
            "manufacturer": None,
            "model": None,
            "serial_number": None,
            "owner": None,
            "operator": None,
            "category": None,
            "type_icao": None,
            "status": None,
            "year_built": None
        }
        
        # Find all table rows and extract data
        rows = soup.find_all('tr')
        
        for row in rows:
            cells = row.find_all(['td', 'th'])
            if len(cells) >= 2:
                label = cells[0].get_text(strip=True).lower()
                value = cells[1].get_text(strip=True)
                
                if 'fabricante' in label:
                    result['manufacturer'] = value
                elif 'modelo' in label:
                    result['model'] = value
                elif 'número de série' in label or 'n° série' in label:
                    result['serial_number'] = value
                elif 'proprietário' in label:
                    result['owner'] = value
                elif 'operador' in label:
                    result['operator'] = value
                elif 'categoria' in label:
                    result['category'] = value
                elif 'tipo icao' in label:
                    result['type_icao'] = value
                elif 'situação' in label or 'status' in label:
                    result['status'] = value
                elif 'ano fabric' in label:
                    result['year_built'] = value
        
        # Also try to match common patterns in the text
        text_lower = text.lower()
        
        # Look for manufacturer patterns
        manufacturers = ['boeing', 'airbus', 'embraer', 'cessna', 'beechcraft', 'piper', 'robinson', 'bell']
        for mfr in manufacturers:
            if mfr in text_lower and not result['manufacturer']:
                # Find the actual case version
                import re
                match = re.search(rf'\b{mfr}\b', text, re.IGNORECASE)
                if match:
                    result['manufacturer'] = match.group()
        
        # If we found any data, return it
        if any(v for v in result.values() if v and v != registration):
            return result
            
        return None
        
    except Exception as e:
        logger.error(f"Error parsing ANAC response: {str(e)}")
        return None

@router.get("/anac_lookup")
async def anac_lookup(request: Request, registration: str):
    """
    Lookup aircraft information from ANAC RAB (Registro Aeronáutico Brasileiro)
    
    Args:
        registration: Brazilian aircraft registration (e.g., PR-GXJ, PP-ABC)
    
    Returns:
        Aircraft information if found, or error message
    """
    if not registration:
        raise HTTPException(status_code=400, detail="Matrícula é obrigatória")
    
    result = await lookup_anac_registration(registration)
    return result

@router.get("/lookup/{registration}")
async def lookup_aircraft(request: Request, registration: str):
    """Alternative endpoint for aircraft lookup"""
    return await anac_lookup(request, registration)

# Common aircraft database for fallback
COMMON_AIRCRAFT = {
    # GOL Fleet
    "PR-GXJ": {"manufacturer": "Boeing", "model": "737-8EH", "operator": "GOL Linhas Aéreas", "type_icao": "B738"},
    "PR-GXK": {"manufacturer": "Boeing", "model": "737-8EH", "operator": "GOL Linhas Aéreas", "type_icao": "B738"},
    # LATAM Fleet  
    "PR-XBB": {"manufacturer": "Airbus", "model": "A320-271N", "operator": "LATAM Airlines Brasil", "type_icao": "A20N"},
    "PR-XBC": {"manufacturer": "Airbus", "model": "A320-271N", "operator": "LATAM Airlines Brasil", "type_icao": "A20N"},
    # Azul Fleet
    "PR-AXH": {"manufacturer": "Airbus", "model": "A320-251N", "operator": "Azul Linhas Aéreas", "type_icao": "A20N"},
    "PR-YRH": {"manufacturer": "Embraer", "model": "ERJ 195-E2", "operator": "Azul Linhas Aéreas", "type_icao": "E295"},
}

@router.get("/quick_lookup/{registration}")
async def quick_lookup(request: Request, registration: str):
    """
    Quick lookup using local database (faster, but limited data)
    Falls back to ANAC if not found locally
    """
    registration = registration.upper().strip()
    
    # Check local database first
    if registration in COMMON_AIRCRAFT:
        return {
            "found": True, 
            "source": "local",
            "data": {
                "registration": registration,
                **COMMON_AIRCRAFT[registration]
            }
        }
    
    # Try ANAC lookup
    result = await lookup_anac_registration(registration)
    if result.get("found"):
        result["source"] = "anac"
    return result
